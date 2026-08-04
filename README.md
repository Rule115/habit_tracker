# Habit Tracker

Aplikasi pelacakan kebiasaan harian. Daftar, login, catat kebiasaan Anda, dan jaga streak harian agar tetap konsisten.

## Fitur MVP

- Registrasi & login (NextAuth + Credentials + bcrypt)
- Halaman dashboard terlindungi (hanya bisa diakses saat login)
- Pelacakan kebiasaan per hari (coming soon di minggu 4+)
- Perhitungan streak otomatis (logika sudah ada + teruji unit)

## Stack

- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Next API routes + tRPC
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth (Auth.js) — Credentials provider + bcrypt
- **Testing:** Vitest + @vitest/coverage-v8
- **Deploy:** Vercel

## Memulai (Development)

```bash
# 1. Install dependency
npm install

# 2. Salin env
cp .env.example .env
# Lalu isi AUTH_SECRET (jalankan: npx auth secret) dan DATABASE_URL Anda

# 3. Siapkan database
npm run db:generate   # prisma migrate dev

# 4. Jalankan
npm run dev
```

Buka `http://localhost:3000`.

## Testing

```bash
npm run test            # suite sekali
npm run test:watch      # watch mode
npm run test:coverage   # suite + coverage report (target ≥80% di src/lib/)
```

> **Catatan:** test membaca `.env.test` (lihat `.env.example` untuk format).
> Pastikan `DATABASE_URL` di `.env.test` menunjuk ke database **test**, bukan dev/produksi.

## Struktur Proyek

```
src/
├── app/                # Halaman (App Router)
│   ├── api/register/   # REST endpoint registrasi
│   ├── dashboard/      # Halaman terlindungi
│   ├── login/          # Form login
│   └── register/       # Form registrasi
├── lib/                # Logika bisnis murni (streak, dll) + unit test
├── server/
│   ├── api/            # tRPC routers (habits, dll)
│   ├── auth.ts         # Konfigurasi NextAuth (Credentials + bcrypt)
│   └── db.ts           # Prisma client
└── middleware.ts       # Lindungi /dashboard, redirect ke /login
prisma/
└── schema.prisma       # Skema database
plans/                  # Rencana fitur (format OKF)
context.md              # Sumber kebenaran proyek (baca AI tiap minggu)
```

## Dokumentasi Konteks

Lihat `context.md` — file ini adalah sumber kebenaran yang dirujuk AI saat mengembangkan proyek. Diperbarui setiap minggu.
