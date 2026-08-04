---
type: Plan
title: Habit tracker, data layer
description: Define the 3 core entities and their relations before any UI.
tags: [schema, mvp, week-1]
---

# Goal
Membantu pengguna membangun kebiasaan baik dengan pelacakan harian: catat kebiasaan, centang tiap hari, dan lihat streak.

# Entities
- User: memiliki segalanya. Reuse model User bawaan NextAuth (jangan duplikasi).
- Habit: milik User (mis. "Baca 20 halaman").
- CheckIn: catatan completion, milik Habit + tanggal + catatan opsional.

# Relations
User 1,many Habit; Habit 1,many CheckIn. onDelete: Cascade di kedua relasi (child tak boleh hidup lebih lama dari parent).

# Out of scope (pass ini)
- UI (tidak ada minggu ini).
- Mengedit check-in masa lalu.
- Logika hitung/reset streak (minggu berikutnya).

# Open questions
- Tipe frequency: String dulu, pertimbangkan enum saat kebutuhan muncul.

# Done looks like
- 3 entitas ada sebagai model Prisma dengan relasi eksplisit.
- `prisma migrate dev` berjalan bersih.
- Prisma Studio menampilkan tabel dan saya bisa sisipkan baris test manual.
