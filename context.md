# Project Context

## Purpose
Membantu pengguna membangun dan mempertahankan kebiasaan baik melalui pelacakan (tracking) kebiasaan harian yang konsisten.

## Target Users
Profesional muda (25–35) yang sudah pakai to-do list tapi gagal konsisten. Mereka sibuk, ingin membangun rutinitas (olahraga, baca, tidur cukup), dan frustrasi karena streak mudah putus tanpa motivasi visual.

## Stack
- Frontend: Next.js (App Router) + TypeScript + Tailwind CSS
- Backend: tRPC / Next API routes
- DB: Postgres + Prisma
- Auth: NextAuth (Auth.js) — **Credentials provider + bcrypt** (lihat bagian Auth)
- Deploy: Vercel

## Success Criteria
MVP dianggap selesai saat pengguna bisa:

1. Login (NextAuth, Credentials + bcrypt)
2. Input list kebiasaan (CRUD: tambah/edit/hapus)
3. Centang kebiasaan per hari (core loop)
4. Streak dihitung & di-reset otomatis bila skip hari
5. User hanya bisa lihat/ubah kebiasaan miliknya (auth scope)
6. Lihat ringkasan riwayat (calendar/history 7–30 hari)
7. Logout

Batas MVP: web only, tanpa reminder/push notification.

## Data Models
Skema Prisma di `prisma/schema.prisma`. User di-reuse dari NextAuth (jangan duplikasi).

### User (NextAuth bawaan, ditambah timestamps & relasi habits)
- id: String (cuid, PK)
- name: String?
- email: String? (@unique)
- emailVerified: DateTime?
- image: String?
- accounts: Account[]
- sessions: Session[]
- habits: Habit[]
- createdAt, updatedAt: DateTime

### Habit (milik User)
- id: String (cuid, PK)
- name: String
- frequency: String
- userId: String (FK → User.id, onDelete: Cascade)
- user: User
- checkIns: CheckIn[]
- createdAt, updatedAt: DateTime
- @@unique([userId, name]) — nama habit unik per user
- @@index([userId]), @@index([createdAt])

### CheckIn (milik Habit)
- id: String (cuid, PK)
- habitId: String (FK → Habit.id, onDelete: Cascade)
- habit: Habit
- date: DateTime (@db.Date)
- note: String?
- createdAt, updatedAt: DateTime
- @@unique([habitId, date]) — satu check-in per habit per tanggal
- @@index([habitId]), @@index([date])

Relasi: User 1,banyak Habit; Habit 1,banyak CheckIn.

## Testing

**Runner:** Vitest (+ `@vitest/coverage-v8`).

**Cara menjalankan:**
- `npm run test` — jalankan suite sekali (CI mode).
- `npm run test:watch` — watch mode saat development.
- `npm run test:coverage` — suite + laporan coverage.

**Lokasi:** `src/**/*.test.ts` (co-located dengan kode sumber).

**Yang tercakup:**
- Unit test untuk logika bisnis inti di `src/lib/` (mis. `streakLength`).
- Target coverage: **≥80% baris** di `src/lib/`.
- Integration test untuk endpoint API (menyusul saat endpoint dibangun).

**Konvensi:**
- Pure function (mis. `streakLength`) menerima dependensi waktu via argumen (`today`) agar tes deterministik — JANGAN panggil `new Date()`/`Date.now()` di dalam fungsi.
- Tulis tes SEBELUM implementasi (Red-Green-Refactor).

## Auth

**Provider:** NextAuth (Auth.js v5 beta) dengan **Credentials provider**.
Password di-hash dengan **bcrypt, salt rounds 12**. TIDAK PERNAH simpan plaintext,
TIDAK PERNAH pakai MD5/SHA-256 untuk password.

**Lokasi konfigurasi:**
- `src/server/auth.ts` — konfigurasi NextAuth utama (provider, callbacks, `getSession`).
  Mengekspor: `handlers`, `auth`, `signIn`, `signOut`, `getSession`, `getServerAuthSession`.
- `src/app/api/auth/[...nextauth]/route.ts` — Next.js route handler yang memakai `handlers` di atas.
- `src/app/api/register/route.ts` — REST endpoint `POST /api/register` (hash password + buat user).
- `src/middleware.ts` — lindungi `/dashboard/:path*`, redirect ke `/login` bila tidak ada sesi.

**Cara pakai sesi (di komponen server):**
```ts
import { getSession } from "~/server/auth";
const session = await getSession();
// session.user.id sekarang tersedia (diisi via callback jwt+session di auth.ts)
```

**Aturan abstraksi (Liskov / Dependency Inversion):**
- **Komponen UI hanya bergantung pada `getSession()` / `useSession()`** — abstraksi sesi.
- Hanya `src/server/auth.ts`, `src/middleware.ts`, dan `src/app/api/auth/*` yang boleh
  menyentuh provider auth secara langsung.
- Konsekuensi: provider bisa ditukar (mis. tambah GitHub OAuth minggu depan) **tanpa
  menyentuh komponen UI**.

**Anti-pola yang harus ditangkap saat review:**
- Password disimpan plaintext atau di-hash tanpa salt → tolak diff, pakai bcrypt rounds ≥ 10.
- Komponen UI mengimpor `next-auth` providers secara langsung → pindahkan ke server/middleware.
- `getSession()` dipanggil di dalam loop → ambil sekali, oper turun.

## Arsitektur

**Pilihan:** Vertical Slice — kode dikelompokkan **per fitur** (auth, habits, check-in),
bukan per jenis (semua UI bersama, semua data bersama). Alasan: iterasi cepat untuk
fase MVP, sesuai anjuran modul week-3 concept.

## Catatan Keamanan (Minggu 3 — dasar; Minggu 5 mengeraskan)

- File `.env*` (kecuali `.env.example`) DILINDUNGI `.gitignore`. JANGAN commit secret.
- `AUTH_SECRET` di-generate via `npx auth secret`. Jangan hardcode.
- Test isolasi: cleanup berbasis email spesifik, BUKAN `TRUNCATE` tabel. Lihat `src/app/api/register/route.test.ts`.
- Test DB sebaiknya terpisah dari DB dev/produksi (`DATABASE_URL` di `.env.test`).
