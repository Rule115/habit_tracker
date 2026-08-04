import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "./route";
import { db } from "~/server/db";
import bcrypt from "bcrypt";

/**
 * Strategi isolasi test:
 * - Hanya berjalan jika NODE_ENV=test (mencegah test mengakali DB dev/produksi).
 * - Cleanup berbasis email spesifik (bukan TRUNCATE seluruh tabel User),
 *   sehingga data user lain tetap aman.
 *
 * Catatan: pola fully-transactional-rollback butuh test DB terpisah.
 * Lihat catatan minggu 2 lab & rencana minggu 5 untuk pengerasan lebih lanjut.
 */

const TEST_EMAILS = [
  "duplikat@example.com",
  "hashcheck@example.com",
  "newuser@example.com",
] as const;

describe("POST /api/register", () => {
  beforeEach(async () => {
    if (process.env.NODE_ENV !== "test") {
      throw new Error(
        "Test register hanya boleh jalan saat NODE_ENV=test. Cek .env.test.",
      );
    }
    await db.user.deleteMany({
      where: { email: { in: [...TEST_EMAILS] } },
    });
  });

  it("harus menolak email duplikat dengan response HTTP 409", async () => {
    const passwordHash = await bcrypt.hash("password123", 12);

    await db.user.create({
      data: {
        email: "duplikat@example.com",
        passwordHash,
      },
    });

    const req = new Request("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "duplikat@example.com",
        password: "passwordBaru123",
      }),
    });

    const res = await POST(req);
    const data = (await res.json()) as { message?: string };

    expect(res.status).toBe(409);
    expect(data.message).toBe("Email sudah terdaftar.");
  });

  it("harus meng-hash password dan memastikan hash tersimpan !== plaintext", async () => {
    const rawPassword = "mySecretPassword123";

    const req = new Request("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "hashcheck@example.com",
        password: rawPassword,
      }),
    });

    await POST(req);

    const createdUser = await db.user.findUnique({
      where: { email: "hashcheck@example.com" },
    });

    expect(createdUser).not.toBeNull();
    expect(createdUser?.passwordHash).not.toBe(rawPassword);

    const isMatch = await bcrypt.compare(rawPassword, createdUser!.passwordHash!);
    expect(isMatch).toBe(true);
  });

  it("harus mengembalikan HTTP 201 dan membuat tepat satu baris User di database", async () => {
    const initialCount = await db.user.count({
      where: { email: { in: [...TEST_EMAILS] } },
    });

    const req = new Request("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "newuser@example.com",
        password: "securePassword123",
      }),
    });

    const res = await POST(req);
    const data = (await res.json()) as {
      id?: string;
      email?: string;
      passwordHash?: string;
    };

    const finalCount = await db.user.count({
      where: { email: { in: [...TEST_EMAILS] } },
    });

    expect(res.status).toBe(201);
    expect(data).toHaveProperty("id");
    expect(data.email).toBe("newuser@example.com");
    expect(data).not.toHaveProperty("passwordHash");

    expect(finalCount - initialCount).toBe(1);
  });
});
