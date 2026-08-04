# Prompt Library

> Kumpulan prompt yang sudah teruji di proyek `habit_tracker`. Pakai ulang, modifikasi sesuai konteks.
> Selalu mulai chat BARU per tugas. Salin bagian `context.md` yang relevan sebelum prompt.

## Yang Berhasil (Pakai Ulang)

### 1. Prompt Rancangan Skema (Minggu 1)

```
Saya pakai Prisma + Postgres + TypeScript (T3 stack, Prisma 6).
Rancang skema untuk entitas berikut:
- <Entity A> (field, relasi)
- <Entity B> (field, relasi)

Persyaratan:
- Pakai @relation dengan foreign key eksplisit.
- Tambah onDelete: Cascade di mana child tak boleh hidup lebih lama dari parent.
- Tambah @@index di foreign key dan field yang akan difilter/diurutkan.
- Tambah @unique yang sesuai.
- Sertakan timestamps (createdAt, updatedAt).
Output HANYA blok skema Prisma. JANGAN tambahkan model tak terkait.
```

**Kenapa berhasil:** Scope sempit + konstrain eksplisit + output tunggal. AI tidak mengarang model lain.

---

### 2. Prompt Tests-First / TDD (Minggu 2)

```
Saya pakai Vitest 4. Tulis unit test untuk:

  <functionName>(<args>): <returnType>

Perilaku:
- <perilaku 1>
- <perilaku 2>
- <edge case 1: kosong/null>
- <edge case 2: masa depan>
- <edge case 3: duplikat>

Cakup setidaknya 6 kasus termasuk edge case di atas. Saat menulis test case,
oper <dependency> yang tetap (mis. new Date('2026-01-15')) agar tes deterministik.
JANGAN tulis implementasinya. Hanya tes dan stub yang melempar exception.
```

**Kenapa berhasil:** Test deterministik + forbidden implementation. Paksa Red phase dulu.

---

### 3. Prompt Senior-Engineer Code Review (Minggu 3)

```
Review diff ini sebagai senior engineer. Tandai masalah di kategori berikut,
urut berdasarkan prioritas:
1. Correctness (logika salah?)
2. Edge case (kasus terlewat?)
3. Keamanan (bocor/injeksi/IDOR?)
4. Maintainability (kode tidak jelas?)
5. Performance (inefisien?)

Bersikaplah spesifik dengan nomor baris. Berikan saran perbaikan konkret,
bukan kritik umum. Tolak diff jika ada masalah kategori 1–3.
```

**Kenapa berhasil:** Kategori berurut = prioritas jelas. Spesifik nomor baris = actionable.

---

### 4. Prompt Bangun Fitur dengan Context (Minggu 4 — Inilah Inti Modul Ini)

```
[SALIN context.md DI SINI]

Dengan stack, konvensi, dan API Surface di atas, buat <fitur> di <lokasi>.
Persyaratan:
- <persyaratan fungsional 1>
- <persyaratan fungsional 2>
- Terlindungi: hanya user terotentikasi (gunakan ulang getSession() atau protectedProcedure).
- Ikuti struktur vertical-slice di bawah <folder>.
- Satu file per tanggung jawab (Single Responsibility).
- Jangan ubah skema Prisma atau file lain yang tidak terkait.
- Output hanya file baru.

Setelah selesai, jelaskan setiap file baris demi baris seperti saya baru pertama
kali baca kode ini.
```

**Kenapa berhasil:** Konteks lengkap + scope ketat + paksa code comprehension di akhir.

---

### 5. Prompt Debugging saat AI Berhalusinasi

```
Kode hasil AI ini tidak berfungsi / berperilaku aneh:
[TEMPEL KODE]

Jangan langsung beri solusi. Pertama:
1. Jelaskan penyebab masalah dalam bahasa sederhana (anggap saya baru).
2. Sebutkan asumsi apa yang salah.
3. Baru kemudian berikan perbaikan minimal, jangan rewrite seluruh file.
```

**Kenapa berhasil:** Paksa AI menjelaskan dulu sebelum solusi — Anda belajar, bukan asal copas.

---

## Yang Tidak Berhasil (Catat & Hindari)

### ❌ Prompt Monolitik (Minggu 1)
```
Buatkan habit tracker dengan auth, streak, grafik, dan fitur sosial.
```
**Kenapa gagal:** AI menghasilkan 2000 baris kode saling terkait yang tak teruji. Setiap bug jadi pencarian kusut karena tak tahu bagian mana penyebabnya. → Pakai dekomposisi: pecah jadi 5–7 fitur terpisah, satu prompt per fitur.

### ❌ "Buat dari nol" (Minggu 0)
```
Tolong siapkan project Next.js dari nol dengan auth dan database.
```
**Kenapa gagal:** AI tidak deterministik saat scaffolding. Pakai tool CLI (`npm create t3-app@latest`) untuk boilerplate, AI hanya untuk fitur.

### ❌ Test Setelah Implementasi (Minggu 2)
```
Saya sudah tulis fungsinya, tolong tulis test-nya.
```
**Kenapa gagal:** Anda menguji apa yang kode lakukan, bukan apa yang seharusnya. Bug ikut tersembunyi. → Tulis test DULU sebagai spesifikasi.

### ❌ Accept Tanpa Review (Minggu 3)
```
[Kode hasil AI] → langsung di-commit
```
**Kenapa gagal:** AI bisa diam-diam mengubah test supaya lulus, menyimpan plaintext, atau bikin bug edge case. → Wajib jalankan prompt senior-engineer review sebelum commit.

---

## Aturan Pakai Prompt Library

1. **Sesuaikan placeholder** `<...>` dengan tugas spesifik.
2. **Jangan tempel mentah** kalau konteks tugas berbeda — modifikasi.
3. **Setelah pakai**, evaluasi: apakah hasilnya bagus? Kalau ya, simpan variasinya. Kalau tidak, catat di "Yang Tidak Berhasil".
4. **Salin konteks dulu** (`context.md` atau bagian relevan) sebelum prompt fitur.

## Aturan Penambahan Prompt Baru

Format wajib:
```
### N. <Nama Prompt> (Minggu X)

[isi prompt dalam code block]

**Kenapa berhasil/gagal:** <alasan singkat>
```
