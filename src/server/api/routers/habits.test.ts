import { describe, expect, it, vi } from "vitest";

// Mock auth & db supaya runtime next-auth / Prisma tidak dimuat di test.
vi.mock("~/server/auth", () => ({
  auth: vi.fn(),
  handlers: {},
  signIn: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("~/server/db", () => ({ db: {} }));

import type { Session } from "next-auth";
import type { PrismaClient } from "../../../../generated/prisma";
import { TRPCError } from "@trpc/server";
import { createCallerFactory } from "~/server/api/trpc";
import { habitsRouter } from "./habits";

const createCaller = createCallerFactory(habitsRouter);

const USER_ID = "user-1";
const OTHER_USER_ID = "user-lain";
const HABIT_ID = "habit-1";
const TODAY = new Date("2026-01-15T10:00:00.000Z");

interface MockDb {
  habit: {
    findUniqueOrThrow: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  checkIn: {
    upsert: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
}

function makeDb(overrides: {
  ownerId?: string;
  checkIns?: { date: Date }[];
  habits?: Array<{
    id: string;
    name: string;
    frequency: string;
    userId: string;
    createdAt: Date;
  }>;
  existingHabit?: {
    id: string;
    name: string;
    frequency: string;
    userId: string;
    createdAt: Date;
  };
} = {}): MockDb {
  const {
    ownerId = USER_ID,
    checkIns = [],
    habits = [],
    existingHabit,
  } = overrides;
  return {
    habit: {
      findUniqueOrThrow: vi
        .fn()
        .mockResolvedValue({ id: HABIT_ID, userId: ownerId }),
      findUnique: vi.fn().mockResolvedValue(existingHabit ?? null),
      findMany: vi.fn().mockResolvedValue(habits),
      create: vi
        .fn()
        .mockImplementation(
          async ({
            data,
          }: {
            data: { name: string; frequency: string; userId: string };
          }) => ({
            id: HABIT_ID,
            name: data.name,
            frequency: data.frequency,
            userId: data.userId,
            createdAt: new Date("2026-01-15"),
          }),
        ),
      update: vi
        .fn()
        .mockImplementation(
          async ({
            data,
            where,
          }: {
            data: { name: string; frequency: string };
            where: { id: string };
          }) => ({
            id: where.id,
            name: data.name,
            frequency: data.frequency,
            userId: ownerId,
            createdAt: new Date("2026-01-10"),
            updatedAt: new Date("2026-01-15"),
          }),
        ),
      delete: vi.fn().mockResolvedValue({ id: HABIT_ID }),
    },
    checkIn: {
      upsert: vi.fn().mockResolvedValue(undefined),
      findMany: vi.fn().mockResolvedValue(checkIns),
    },
  };
}

function makeCaller(db: MockDb, userId = USER_ID) {
  return createCaller({
    db: db as unknown as PrismaClient,
    session: {
      user: { id: userId },
      expires: new Date().toISOString(),
    } as unknown as Session,
    headers: new Headers(),
  });
}

const sampleHabit = {
  id: HABIT_ID,
  name: "Baca 20 halaman",
  frequency: "daily",
  userId: USER_ID,
  createdAt: new Date("2026-01-10"),
};

describe("habits.checkIn (integration)", () => {
  it("membuat check-in milik user dan mengembalikan streak yang diperbarui", async () => {
    const db = makeDb({
      checkIns: [
        { date: new Date("2026-01-15") },
        { date: new Date("2026-01-14") },
      ],
    });
    const caller = makeCaller(db);

    const result = await caller.checkIn({
      habitId: HABIT_ID,
      date: TODAY,
    });

    expect(result.streak).toBe(2);
    expect(db.checkIn.upsert).toHaveBeenCalledOnce();
    const upsertCall = db.checkIn.upsert.mock.calls[0]?.[0] as {
      where: { habitId_date: { habitId: string; date: Date } };
    };
    expect(upsertCall.where.habitId_date.habitId).toBe(HABIT_ID);
    expect(upsertCall.where.habitId_date.date).toBeInstanceOf(Date);
  });

  it("mengembalikan streak 0 bila tidak ada check-in pada today", async () => {
    const db = makeDb({
      checkIns: [{ date: new Date("2026-01-13") }],
    });
    const caller = makeCaller(db);

    const result = await caller.checkIn({ habitId: HABIT_ID, date: TODAY });

    expect(result.streak).toBe(0);
  });

  it("menolak akses ke habit milik user lain (auth scope)", async () => {
    const db = makeDb({ ownerId: OTHER_USER_ID });
    const caller = makeCaller(db);

    await expect(
      caller.checkIn({ habitId: HABIT_ID, date: TODAY }),
    ).rejects.toBeInstanceOf(TRPCError);

    expect(db.checkIn.upsert).not.toHaveBeenCalled();
  });

  it("idempoten: check-in duplikat di hari sama tidak menambah streak", async () => {
    const db = makeDb({
      checkIns: [{ date: new Date("2026-01-15") }],
    });
    const caller = makeCaller(db);

    const result = await caller.checkIn({ habitId: HABIT_ID, date: TODAY });

    expect(result.streak).toBe(1);
  });
});

describe("habits.list", () => {
  it("mengembalikan hanya habit milik user yang login", async () => {
    const db = makeDb({
      habits: [
        sampleHabit,
        {
          id: "habit-2",
          name: "Olahraga",
          frequency: "weekly",
          userId: USER_ID,
          createdAt: new Date("2026-01-11"),
        },
      ],
    });
    const caller = makeCaller(db);

    const result = await caller.list();

    expect(db.habit.findMany).toHaveBeenCalledWith({
      where: { userId: USER_ID },
      orderBy: { createdAt: "desc" },
    });
    expect(result).toHaveLength(2);
  });

  it("mengembalikan array kosong bila user belum punya habit", async () => {
    const db = makeDb({ habits: [] });
    const caller = makeCaller(db);

    const result = await caller.list();

    expect(result).toEqual([]);
  });
});

describe("habits.create", () => {
  it("membuat habit baru terkait user yang login", async () => {
    const db = makeDb();
    const caller = makeCaller(db);

    const result = await caller.create({
      name: "Meditasi 10 menit",
      frequency: "daily",
    });

    expect(db.habit.create).toHaveBeenCalledWith({
      data: {
        name: "Meditasi 10 menit",
        frequency: "daily",
        userId: USER_ID,
      },
    });
    expect(result.name).toBe("Meditasi 10 menit");
  });

  it("menolak name kosong (validasi Zod)", async () => {
    const db = makeDb();
    const caller = makeCaller(db);

    await expect(
      caller.create({ name: "", frequency: "daily" }),
    ).rejects.toBeInstanceOf(TRPCError);

    expect(db.habit.create).not.toHaveBeenCalled();
  });
});

describe("habits.update", () => {
  it("memperbarui habit milik user yang login", async () => {
    const db = makeDb({
      existingHabit: { ...sampleHabit, userId: USER_ID },
    });
    const caller = makeCaller(db);

    const result = await caller.update({
      id: HABIT_ID,
      name: "Baca 30 halaman",
      frequency: "weekly",
    });

    expect(db.habit.update).toHaveBeenCalledWith({
      where: { id: HABIT_ID },
      data: { name: "Baca 30 halaman", frequency: "weekly" },
    });
    expect(result.name).toBe("Baca 30 halaman");
  });

  it("menolak update habit milik user lain (auth scope)", async () => {
    const db = makeDb({
      existingHabit: { ...sampleHabit, userId: OTHER_USER_ID },
    });
    const caller = makeCaller(db);

    await expect(
      caller.update({
        id: HABIT_ID,
        name: "Hacked",
        frequency: "daily",
      }),
    ).rejects.toBeInstanceOf(TRPCError);

    expect(db.habit.update).not.toHaveBeenCalled();
  });

  it("melempar NOT_FOUND bila habit tidak ada", async () => {
    const db = makeDb({ existingHabit: undefined });
    const caller = makeCaller(db);

    await expect(
      caller.update({
        id: "tidak-ada",
        name: "X",
        frequency: "daily",
      }),
    ).rejects.toBeInstanceOf(TRPCError);
  });
});

describe("habits.delete", () => {
  it("menghapus habit milik user yang login", async () => {
    const db = makeDb({
      existingHabit: { ...sampleHabit, userId: USER_ID },
    });
    const caller = makeCaller(db);

    const result = await caller.delete({ id: HABIT_ID });

    expect(db.habit.delete).toHaveBeenCalledWith({ where: { id: HABIT_ID } });
    expect(result).toEqual({ success: true });
  });

  it("menolak hapus habit milik user lain (auth scope)", async () => {
    const db = makeDb({
      existingHabit: { ...sampleHabit, userId: OTHER_USER_ID },
    });
    const caller = makeCaller(db);

    await expect(caller.delete({ id: HABIT_ID })).rejects.toBeInstanceOf(
      TRPCError,
    );

    expect(db.habit.delete).not.toHaveBeenCalled();
  });

  it("melempar NOT_FOUND bila habit tidak ada", async () => {
    const db = makeDb({ existingHabit: undefined });
    const caller = makeCaller(db);

    await expect(caller.delete({ id: "tidak-ada" })).rejects.toBeInstanceOf(
      TRPCError,
    );
  });
});
