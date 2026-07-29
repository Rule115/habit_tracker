# Project Context

## Purpose
Membantu pengguna membangun dan mempertahankan kebiasaan baik melalui pelacakan (tracking) kebiasaan harian yang konsisten.

## Target Users
Profesional muda (25–35) yang sudah pakai to-do list tapi gagal konsisten. Mereka sibuk, ingin membangun rutinitas (olahraga, baca, tidur cukup), dan frustrasi karena streak mudah putus tanpa motivasi visual.

## Stack
- Frontend: Next.js (App Router) + TypeScript + Tailwind CSS
- Backend: tRPC / Next API routes
- DB: Postgres + Prisma
- Auth: NextAuth (Discord provider)
- Deploy: Vercel

## Success Criteria
MVP dianggap selesai saat pengguna bisa:

1. Login (NextAuth, Discord)
2. Input list kebiasaan (CRUD: tambah/edit/hapus)
3. Centang kebiasaan per hari (core loop)
4. Streak dihitung & di-reset otomatis bila skip hari
5. User hanya bisa lihat/ubah kebiasaan miliknya (auth scope)
6. Lihat ringkasan riwayat (calendar/history 7–30 hari)
7. Logout

Batas MVP: web only, tanpa reminder/push notification.
