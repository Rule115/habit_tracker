-- AlterTable
-- Menambahkan kolom passwordHash ke User untuk Credentials login (Minggu 3).
-- Drift: sebelumnya kolom ditambah via `prisma db push` tanpa migration resmi.
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;
