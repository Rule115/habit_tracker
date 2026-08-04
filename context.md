# Project Context

> Sumber kebenaran proyek. Dibaca AI di setiap sesi baru. Diperbarui setiap fitur.
> Drift merusak kepercayaan — bila kode dan dokumen beda, AI akan menebak.

## Purpose
Membantu pengguna membangun dan mempertahankan kebiasaan baik melalui pelacakan (tracking) kebiasaan harian yang konsisten.

## Target Users
Profesional muda (25–35) yang sudah pakai to-do list tapi gagal konsisten. Mereka sibuk, ingin membangun rutinitas (olahraga, baca, tidur cukup), dan frustrasi karena streak mudah putus tanpa motivasi visual.

## Stack & Versions

> Versi spesifik DIKUNCI. AI tidak boleh mengarang versi lain (mis. Pages Router).

- **Frontend:** Next.js 15 (App Router) + React 19 + TypeScript 5.8 (strict mode)
- **Styling:** Tailwind CSS 4 + PostCSS
- **Backend:** Next.js API routes + tRPC 11 (server + client)
- **Database:** PostgreSQL 16 + Prisma ORM 6 (client di `generated/prisma/`)
- **Auth:** NextAuth (Auth.js) v5 beta — **Credentials provider + bcrypt**
- **Validation:** Zod 3
- **Testing:** Vitest 4 + @vitest/coverage-v8 (target ≥80% di `src/lib/`)
- **Code Quality:** ESLint 9 (flat config) + Prettier 3
- **Deploy:** Vercel
- **Node:** 20+

## Directory Structure

```
habit_tracker/
├── prisma/
│   ├── schema.prisma              # Sumber kebenaran skema DB
│   └── migrations/                # Riwayat migrasi Prisma (commit!)
├── plans/                         # Rencana fitur format OKF (lihat Minggu 1)
│   └── habit-tracker.md
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts  # NextAuth handler
│   │   │   └── register/route.ts            # REST register (hash password)
│   │   ├── admin/habits/                    # Admin panel CRUD (Minggu 4)
│   │   ├── dashboard/page.tsx               # Halaman user terproteksi
│   │   ├── login/                           # Form login (Credentials)
│   │   ├── register/                        # Form registrasi
│   │   ├── layout.tsx                       # Root layout + metadata
│   │   └── page.tsx                         # Home page
│   ├── lib/                       # Logika bisnis murni + unit test
│   │   ├── streak.ts                         # streakLength(checkIns, today)
│   │   └── streak.test.ts
│   ├── server/
│   │   ├── api/
│   │   │   ├── routers/
│   │   │   │   └── habits.ts                # tRPC: checkIn + CRUD admin
│   │   │   ├── root.ts                       # appRouter (habits + health)
│   │   │   └── trpc.ts                       # context + publicProcedure + protectedProcedure
│   │   ├── auth.ts                # NextAuth config (Credentials + bcrypt)
│   │   └── db.ts                  # Prisma client singleton
│   ├── middleware.ts              # Lindungi /dashboard/* dan /admin/*
│   ├── env.js                     # t3-env schema (server + client vars)
│   ├── vitest.setup.ts            # Load .env.test sebelum test
│   └── trpc/                      # tRPC React provider (client)
├── context.md                     # File ini. Wajib baca untuk AI.
├── prompts.md                     # Prompt library (lihat Minggu 4)
├── vitest.config.ts               # Vitest config + coverage 80%
└── .env.example                   # Template env (commit). .env* lain di-ignore.
```

## Data Models

Skema Prisma di `prisma/schema.prisma`. User di-reuse dari NextAuth (jangan duplikasi).

### User (NextAuth bawaan, ditambah timestamps & relasi habits)
- id: String (cuid, PK)
- name: String?
- email: String? (@unique)
- emailVerified: DateTime?
- image: String?
- passwordHash: String? (untuk Credentials login)
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

Relasi: User 1,banyak Habit; Habit 1,banyak CheckIn. Keduanya onDelete: Cascade.

## API Surface

### REST Endpoints
| Method | Path | Butuh Auth? | Fungsi |
|---|---|---|---|
| POST | `/api/register` | ❌ | Buat user baru (hash password bcrypt rounds=12, return 201 atau 409 bila email duplikat) |
| GET/POST | `/api/auth/*` | (NextAuth) | Handler NextAuth (login, logout, callback) |

### tRPC Procedures (di `src/server/api/routers/`)
| Procedure | Tipe | Butuh Auth? | Input | Output |
|---|---|---|---|---|
| `health` | query | ❌ | — | `"ok"` |
| `habits.checkIn` | mutation | ✅ | `{ habitId, date? }` | `{ streak: number }` |
| `habits.list` | query | ✅ | — | `Habit[]` (milik user) |
| `habits.create` | mutation | ✅ | `{ name, frequency }` | `Habit` baru |
| `habits.update` | mutation | ✅ | `{ id, name, frequency }` | `Habit` diperbarui |
| `habits.delete` | mutation | ✅ | `{ id }` | `{ success: true }` |

> Semua procedure `habits.*` memakai `protectedProcedure` dan memverifikasi `habit.userId === session.user.id` (auth scope). Bukan-pemilik → `FORBIDDEN`.

## Environment Variables

> TIDAK ADA nilai di sini. Salin dari `.env.example`, isi lokal di `.env` (di-ignore git).

- `DATABASE_URL` — PostgreSQL connection string (wajib)
- `AUTH_SECRET` — secret NextAuth (generate via `npx auth secret`)
- `AUTH_DISCORD_ID`, `AUTH_DISCORD_SECRET` — opsional (Credentials dipakai, Discord tidak)
- `NODE_ENV` — `development` | `test` | `production`

Variabel divalidasi lewat `src/env.js` (t3-env). Akses di kode: `import { env } from "~/env"`.

## Conventions

> Aturan yang memaksa AI ke pola yang dapat diprediksi. Halusinasi berkurang drastis.

### Struktur Kode
- **Vertical Slice** — kelompokkan per fitur (auth, habits, check-in), bukan per jenis.
- Logika bisnis murni di `src/lib/`, wajib unit-tested.
- Komponen UI hanya bergantung pada abstraksi (`getSession()`, `useSession()`, tRPC), bukan implementasi konkret.
- Satu file = satu tanggung jawab (Single Responsibility dari SOLID).

### Penamaan
- File komponen: PascalCase (`LoginForm.tsx`).
- File lib/route: camelCase (`streak.ts`, `route.ts`).
- Folder fitur: kebab-case (`admin/habits/`).
- tRPC procedure: camelCase (`checkIn`, `listHabits` — di dalam router `habits`, jadi `habits.checkIn`).

### Auth
- Hanya `src/server/auth.ts`, `src/middleware.ts`, dan `src/app/api/auth/*` boleh menyentuh provider auth.
- UI hanya pakai `getSession()` (server) atau `useSession()` (client).
- Password wajib bcrypt, salt rounds ≥ 10 (proyek ini pakai 12).

### Testing (Red-Green-Refactor)
- Tulis tes SEBELUM implementasi.
- Pure function terima dependensi waktu via argumen (`today`), JANGAN `new Date()` di dalam.
- Lokasi tes: co-located (`src/**/*.test.ts`).
- Isolasi: hapus berdasarkan ID/email spesifik, JANGAN `TRUNCATE` tabel.

### Version Control
- **Commit atomik** per fitur, format: `type(scope): deskripsi`.
- Tipe: `feat`, `fix`, `test`, `docs`, `refactor`, `style`, `chore`.
- Mulai chat baru per tugas (hindari context rot).

## Auth

**Provider:** NextAuth (Auth.js v5 beta) dengan **Credentials provider**.
Password di-hash dengan **bcrypt, salt rounds 12**. TIDAK PERNAH simpan plaintext,
TIDAK PERNAH pakai MD5/SHA-256 untuk password.

**Lokasi konfigurasi:**
- `src/server/auth.ts` — konfigurasi NextAuth utama (provider, callbacks, `getSession`).
  Mengekspor: `handlers`, `auth`, `signIn`, `signOut`, `getSession`, `getServerAuthSession`.
- `src/app/api/auth/[...nextauth]/route.ts` — Next.js route handler yang memakai `handlers` di atas.
- `src/app/api/register/route.ts` — REST endpoint `POST /api/register`.
- `src/middleware.ts` — lindungi `/dashboard/:path*` dan `/admin/:path*`, redirect ke `/login` bila tidak ada sesi.

**Cara pakai sesi (di komponen server):**
```ts
import { getSession } from "~/server/auth";
const session = await getSession();
// session.user.id tersedia (diisi via callback jwt+session di auth.ts)
```

**Aturan abstraksi (Liskov / Dependency Inversion):**
- Komponen UI hanya bergantung pada `getSession()` / `useSession()` — abstraksi sesi.
- Hanya `src/server/auth.ts`, `src/middleware.ts`, dan `src/app/api/auth/*` yang boleh menyentuh provider.
- Konsekuensi: provider bisa ditukar tanpa menyentuh komponen UI.

**Anti-pola yang harus ditangkap saat review:**
- Password disimpan plaintext atau di-hash tanpa salt → tolak diff, pakai bcrypt rounds ≥ 10.
- Komponen UI mengimpor `next-auth` providers secara langsung → pindahkan ke server/middleware.
- `getSession()` dipanggil di dalam loop → ambil sekali, oper turun.

## Testing

**Runner:** Vitest (+ `@vitest/coverage-v8`).

**Cara menjalankan:**
- `npm run test` — jalankan suite sekali (CI mode).
- `npm run test:watch` — watch mode saat development.
- `npm run test:coverage` — suite + laporan coverage.

**Yang tercakup:**
- Unit test untuk logika bisnis inti di `src/lib/` (mis. `streakLength`).
- Integration test untuk tRPC procedures (`habits.test.ts`).
- Test untuk REST endpoint (`api/register/route.test.ts`).
- Target coverage: **≥80% baris** di `src/lib/`.

## Success Criteria (MVP)

MVP dianggap selesai saat pengguna bisa:

1. Register & Login (NextAuth, Credentials + bcrypt)
2. Input list kebiasaan (CRUD: tambah/edit/hapus) — admin panel dasar sudah ada
3. Centang kebiasaan per hari (core loop) — tRPC `habits.checkIn` sudah ada
4. Streak dihitung & di-reset otomatis bila skip hari — `streakLength` sudah ada
5. User hanya bisa lihat/ubah kebiasaan miliknya (auth scope)
6. Lihat ringkasan riwayat (calendar/history 7–30 hari) — coming soon
7. Logout

Batas MVP: web only, tanpa reminder/push notification.

## Catatan Keamanan (Minggu 3 — dasar; Minggu 5 mengeraskan)

- File `.env*` (kecuali `.env.example`) DILINDUNGI `.gitignore`. JANGAN commit secret.
- `AUTH_SECRET` di-generate via `npx auth secret`. Jangan hardcode.
- Test isolasi: cleanup berbasis email spesifik, BUKAN `TRUNCATE` tabel. Lihat `src/app/api/register/route.test.ts`.
- Test DB sebaiknya terpisah dari DB dev/produksi (`DATABASE_URL` di `.env.test`).
- Riwayat git sudah diverifikasi bersih dari secret (cek: `git log --all -S "<token>"`).

## Riwayat Pembaruan Dokumen

- **Minggu 0:** Buat context.md (Purpose, Stack dasar).
- **Minggu 1:** Tambah Data Models (User, Habit, CheckIn).
- **Minggu 2:** Tambah bagian Testing.
- **Minggu 3:** Tambah Auth + Arsitektur + Catatan Keamanan.
- **Minggu 4:** Lengkapi 9 bagian (Directory Structure, ENV vars, API Surface, Conventions terpusat, Stack dengan versi spesifik) + tambah `habits.list/create/update/delete` ke API Surface setelah bangun admin panel.
