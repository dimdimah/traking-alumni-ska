# SKRIPSI.md — Persiapan Sidang Thesis

> Dokumen ini berisi panduan untuk persiapan sidang skripsi/thesis.
> Fokus: apa yang akan ditanyakan penguji, bagaimana menjawab, dan
> apa yang harus diperbaiki sebelum sidang.
>
> Dibuat berdasarkan audit menyeluruh kode (lihat `AUDIT_REPORT.md`).

---

## DAFTAR ISI

1. [Pertanyaan Wajib — Algoritma](#1-pertanyaan-wajib--algoritma)
2. [Pertanyaan Wajib — Arsitektur](#2-pertanyaan-wajib--arsitektur)
3. [Pertanyaan Wajib — Keamanan Data](#3-pertanyaan-wajib--keamanan-data)
4. [Pertanyaan Wajib — Evaluasi & Metrik](#4-pertanyaan-wajib--evaluasi--metrik)
5. [Tembak Jitu — "Apa Bedanya sama LinkedIn?"](#5-tembak-jitu--apa-bedanya-sama-linkedin)
6. [Fixes Wajib Sebelum Sidang](#6-fixes-wajib-sebelum-sidang)
7. [Demo Day Checklist](#7-demo-day-checklist)
8. [Daftar Istilah (Cedal)](#8-daftar-istilah-cedal)

---

## 1. PERTANYAAN WAJIB — ALGORITMA

Ini yang pasti ditanya. Siapkan jawaban tanpa lihat catatan.

### 1.1 "Jelaskan TF-IDF secara matematis."

**Kerangka jawaban:**

> TF-IDF terdiri dari dua komponen:
>
> **Term Frequency (TF)** = jumlah kemunculan term dalam dokumen.
> Di sistem ini, kami menggunakan *raw count* (bukan normalized TF).
> Kelemahannya: dokumen yang lebih panjang punya TF lebih tinggi secara
> artifisial. Kelebihannya: sederhana dan dokumen yang dibandingkan
> (profil vs lowongan) relatif seimbang panjangnya.
>
> **Inverse Document Frequency (IDF)** = log(N / df(t)) + 1
> - N = jumlah total dokumen (profil + semua lowongan)
> - df(t) = jumlah dokumen yang mengandung term t
> - +1 adalah *smoothing* agar term yang muncul di semua dokumen
>   tidak bernilai 0 (karena log(N/N) = 0)
>
> Contoh: "developer" muncul di 10 dari 10 dokumen → IDF = ln(10/10) + 1 = 1
> Contoh: "laravel" muncul di 2 dari 10 dokumen → IDF = ln(10/2) + 1 = 2.61
>
> **Cosine Similarity** = dot(A,B) / (|A| × |B|)
> - dot(A,B) = jumlah bobot term yang sama di kedua vektor
> - |A| = sqrt(kuadrat semua bobot)
> - Hasil: 0 (tidak mirip) sampai 1 (identik secara vektor)

**Bisa tulis di papan tulis:**

```
TF(t,d) = count(t,d)
IDF(t) = ln(N / df(t)) + 1
TF-IDF(t,d) = TF(t,d) × IDF(t)
cos(θ) = (A · B) / (||A|| × ||B||)
```

### 1.2 "Kenapa pakai raw TF, bukan TF yang dinormalisasi?"

**Jawaban:**
"Kami menggunakan raw count karena:
1. Dokumen yang dibandingkan (profil alumni vs deskripsi lowongan) memiliki panjang yang relatif seimbang
2. Normalisasi (seperti除以 total term) tidak mengubah ranking akhir pada cosine similarity — scaling-nya hilang di normalisasi vektor
3. Raw count lebih sederhana untuk diimplementasikan dan dijelaskan

Trade-off: jika ada profil dengan deskripsi sangat panjang (bio 500 kata) dan lowongan dengan deskripsi pendek (50 kata), raw count akan bias ke profil. Ini bisa diperbaiki dengan sublinear TF (log(1 + TF)) di iterasi berikutnya."

### 1.3 "Mengapa hanya Content-Based Filtering?"

**Jawaban:**
"Rekomendasi menggunakan Content-Based Filtering karena sistem membandingkan konten profil alumni dengan konten lowongan. Pipeline-nya deterministik, dapat dijelaskan, dan tidak memerlukan riwayat interaksi antaruser:
- profil alumni dibangun dari tujuh kriteria;
- lowongan dibangun dari judul, deskripsi, skills, lokasi, dan tipe;
- semua dokumen masuk preprocessing, TF-IDF, lalu Cosine Similarity;
- skor Cosine Similarity langsung menjadi skor akhir.

Collaborative Filtering tidak digunakan karena aplikasi belum memiliki data interaksi user–lowongan yang cukup untuk membentuk sinyal perilaku kolektif."

### 1.4 "Apa yang terjadi kalau data profil belum lengkap?"

**Jawaban:**
"Field yang kosong tidak menghasilkan token, sehingga tidak menyumbang kemiripan. Tidak ada bobot manual yang harus didistribusikan. Alumni tetap mendapat hasil, tetapi dokumen yang lebih lengkap biasanya menghasilkan kemiripan konten yang lebih informatif."

### 1.5 "Apa yang terjadi kalau lowongannya kosong? Profilnya kosong?"

**Jawaban:**
- **Lowongan kosong**: fungsi `getJobRecommendations` mengembalikan error
  "Tidak ada lowongan aktif" — UI menampilkan empty state dengan tombol
  "Lengkapi Profil" dan "Coba Lagi"
- **Profil kosong**: `buildProfileDocument` menghasilkan string kosong → `preprocess`
  mengembalikan array kosong → `computeSimilarityScores` mengembalikan array
  `[0, 0, ...]` → semua skor 0 dan hasil tetap diurutkan secara deterministik.
- **Lowongan kosong**: server action melempar error yang ditampilkan pada empty state.

---

## 2. PERTANYAAN WAJIB — ARSITEKTUR

### 2.1 "Coba jelaskan alur data dari user login sampai dapet rekomendasi."

**Alur lengkap (hafalkan):**

```
User login
  → middleware.ts cek session (edge)
    → redirect ke /login kalau gak ada session
  → Halaman /user/rekomendasi dimuat
    → useEffect → panggil getJobRecommendations()
      → Server Action (berjalan di server)
        → createClient() → supabase.auth.getUser()
        → 3 query paralel via Promise.all:
            1. profiles (profil alumni)
            2. track_records (riwayat kerja)
            3. jobs (lowongan aktif)
        → Bangun dokumen teks profil dari tujuh kriteria
        → Bangun dokumen setiap lowongan
        → Preprocessing: case folding → cleaning → tokenization → stopword
        → TF-IDF query vs semua lowongan
        → Cosine Similarity sebagai skor akhir
        → Sort descending + Top-N
    → Return MatchResult[] ke client
  → UI render hasil
```

### 2.2 "Server Action vs API Route — kenapa pilih Server Action?"

**Jawaban:**
"Server Action adalah fitur Next.js 14 yang memungkinkan fungsi berjalan
di server tanpa membuat endpoint REST terpisah. Kelebihan:
1. Satu codebase — logika bisnis dan UI dalam project yang sama
2. Type safety — import type langsung dari server ke client component
3. Tidak perlu setup route handler — cukup `'use server'`
4. Server Component bisa langsung panggil server action tanpa fetch API

Trade-off: tidak bisa diakses oleh third-party. Untuk sistem informasi
alumni yang murni internal, ini bukan masalah."

### 2.3 "RLS Policy — jelaskan cara kerja dan potensi celanya."

**Jawaban:**
"RLS (Row Level Security) adalah fitur PostgreSQL yang membatasi baris
mana yang bisa dibaca/ditulis oleh user tertentu, berdasarkan `auth.uid()`.

Di sistem ini:
- `profiles`: user hanya bisa SELECT/UPDATE profil sendiri. Super_user bisa
  SELECT/UPDATE/DELETE semua profil. UPDATE dicek dengan `WITH CHECK`
  agar user tidak bisa mengubah role-nya sendiri.
- `track_records`: user hanya bisa CRUD record milik sendiri (`user_id = auth.uid()`)
- `jobs`: user hanya bisa SELECT yang `is_active = true`. Super_user CRUD penuh.
- `tracer_study_responses`: user hanya bisa akses milik sendiri. UNIQUE constraint
  memastikan satu alumni cuma punya satu response.

Pencegahan escalation: di setiap Server Action admin, ada role check manual
terpisah dari RLS — defense-in-depth."

**Catatan untuk kamu:** Penguji bisa nanya "apakah ada test untuk RLS?"
Jawab jujur: "Saat ini belum ada automated test untuk RLS, tapi semua policy
telah diverifikasi manual untuk use case utama."

---

## 3. PERTANYAAN WAJIB — KEAMANAN DATA

### 3.1 "Data alumni isinya apa aja? Gimana ngelindungin?"

**Jawaban:**
"Data yang disimpan:
- Identitas: nama, NIM, email, telepon, tanggal lahir
- Akademik: pendidikan terakhir, tahun lulus
- Profesional: skills, riwayat pekerjaan, sertifikasi, minat bidang, preferensi lokasi/tipe, dan expected salary (tidak untuk matching)
- Kuesioner: status pekerjaan, tempat kerja, kritik/saran

Perlindungan:
1. **Database level**: RLS — user hanya bisa lihat data sendiri
2. **Auth level**: Supabase Auth — password di-hash, session via cookie,
   domain email dibatasi `@amikomsolo.ac.id`
3. **Application level**: semua Server Action cek session via `withAuth()`
4. **Admin ops**: operasi sensitif (reset password, hapus user) pakai
   `service_role` key — hanya dijalankan di server, tidak pernah di client
5. **Error sanitization**: error Supabase tidak pernah dikembalikan
   mentah ke client (diganti pesan generik)"

### 3.2 "Service role key — disimpen dimana? Apakah aman?"

**Jawaban:**
"Service role key disimpan di environment variable `SUPABASE_SERVICE_ROLE_KEY`
dan hanya digunakan di `lib/supabase/admin.ts`. Fungsi `createAdminClient()`
hanya dipanggil di Server Actions — tidak pernah di client component
atau browser. Key tidak pernah diekspos ke client-side code."

**⚠️ PENTING:** Pastikan `.env` sudah di-remove dari git tracking.
Kalau penguji lihat file `.env` di repository, siapkan jawaban:
"Itu adalah kelalaian yang sudah kami perbaiki. Key sudah di-rotate
dan file sudah di-remove dari git. Ini menjadi pembelajaran penting
tentang secret management."

### 3.3 "SQL injection? XSS? CSRF?"

**Jawaban:**
- **SQL injection**: Tidak mungkin. Supabase JavaScript client menggunakan
  parameterized queries secara otomatis. Tidak ada raw SQL di kode aplikasi.
- **XSS**: React secara default melakukan escaping output. Data dari database
  di-render sebagai text, bukan HTML. Tidak ada `dangerouslySetInnerHTML`.
- **CSRF**: Server Action di Next.js 14 memiliki built-in CSRF protection.
  Setiap POST request diverifikasi origin-nya.
- **Password**: minimum 8 karakter, harus ada uppercase + lowercase + digit,
  di-verifikasi di client dan server (Zod).

---

## 4. PERTANYAAN WAJIB — EVALUASI & METRIK

### 4.1 "Gimana cara ukur bahwa rekomendasi ini akurat?"

Ini pertanyaan tersulit. Siapkan jawaban:

"Kami menggunakan pendekatan *intrinsic evaluation* melalui tiga indikator:

**1. Confidence Level**
Setiap rekomendasi diberi label high/medium/low berdasarkan jumlah
dimensi yang tersedia (bukan berdasarkan correctness). Ini kelemahan
yang kami sadari — confidence saat ini mengukur *kelengkapan data*,
bukan *akurasi prediksi*.

**2. Manual Verification (seperti unit test)**
Kami memiliki test suite yang memverifikasi:
- Skor dokumen backend > skor dokumen akuntan (sanity check)
- Cosine similarity = 1 untuk vektor identik
- Cosine similarity = 0 untuk vektor orthogonal
- Preprocessing menghasilkan token yang benar

**3. Yang belum dilakukan (pengakuan)**
Kami belum melakukan *user study* atau A/B testing untuk mengukur
apakah alumni yang merekomendasikan benar-benar mendapatkan pekerjaan
yang lebih sesuai. Ini adalah keterbatasan penelitian yang bisa
dijadikan saran untuk pengembangan selanjutnya."

**Catatan tambahan:**
Kalau penguji tanya "kenapa tidak pakai precision/recall?" — jawab:
"Precision dan recall butuh ground truth (label relevan/tidak relevan
untuk setiap pasangan user-job). Dataset seperti itu tidak tersedia
untuk konteks alumni Amikom Surakarta."

### 4.2 "Apakah ada confidence high/medium/low?"

**Jawaban:**
"Tidak. Sistem hanya menampilkan skor Cosine Similarity. Label confidence lama berdasarkan jumlah field tidak dipakai karena dapat disalahartikan sebagai akurasi. Kelengkapan profil tetap dipantau di analytics admin sebagai tujuh kriteria terpisah."

---

## 5. TEMBAK JITU — "APA BEDANYA SAMA LINKEDIN?"

Ini pertanyaan paling berbahaya. Jawaban yang salah: "LinkedIn juga
punya rekomendasi pekerjaan."

**Jawaban yang benar:**

"Perbedaan utama ada tiga:

**1. Domain-specific + bahasa Indonesia**
LinkedIn adalah platform global. Sistem ini dikhususkan untuk alumni
Amikom Surakarta dengan:
- Preprocessing untuk bahasa Indonesia (stopwords bahasa Indonesia)
- Kuesioner sistem alumni — data yang tidak ada di LinkedIn
- Integrasi dengan data akademik kampus (NIM, angkatan)

**2. CBF berbasis tujuh kriteria profil**
Sistem tidak memakai bobot manual. Program studi, skills, pengalaman kerja,
sertifikasi, minat bidang, preferensi lokasi, dan preferensi tipe disatukan
sebagai dokumen teks, lalu dibandingkan dengan dokumen lowongan melalui
TF-IDF dan Cosine Similarity.

**3. Sistem alumni sebagai closed feedback loop**
Fitur sistem alumni bukan sekedar kuesioner. Data dari sistem alumni
(di mana alumni bekerja, posisi apa, gaji berapa) bisa digunakan
sebagai *relevance feedback* untuk meningkatkan kualitas rekomendasi
di masa depan — meskipun loop ini belum sepenuhnya kami implementasikan."

---

## 6. FIXES WAJIB SEBELUM SIDANG

Perbaiki ini **sekarang**, bukan besok.

### Fix 1 — SERVICE_ROLE key di git (5 menit)

```bash
# 1. Rotate key di Supabase Dashboard (Settings → API → Service Role Key)
# 2. Hapus dari git
git rm --cached .env .env.local
# 3. Buat .env.example
# 4. Commit: "chore: remove .env from git, add .env.example"
```

### Fix 2 — url/source tidak tersimpan di createJob/updateJob (15 menit)

Di `lib/actions/jobs.ts`, tambahkan `url` dan `source` ke insert dan update.

### Fix 3 — Buat seed data (30 menit)

Buat `supabase/seed.sql` dengan 10 job, 5 alumni, 5 track records.

### Fix 4 — Buat README (1 jam)

README wajib ada: judul, deskripsi, tech stack, cara install, env vars, scripts.

### Fix 5 — Buat .env.example (5 menit)

### Fix 6 — Terapkan migration 014 (5 menit)

Jalankan `014_add_profile_extended_fields.sql` di Supabase, lalu pastikan empat field profil baru tersedia di type, form, CV, dan analytics.

---

## 7. DEMO DAY CHECKLIST

### H-1

- [ ] Database: cek isi data (minimal 10 job, 5 alumni, track records)
- [ ] Database: jalankan migrasi terbaru
- [ ] SERVICE_ROLE key sudah di-rotate
- [ ] `.env` sudah di `.gitignore` dan tidak tracking
- [ ] Build: `npm run build` — pastikan zero error
- [ ] TypeScript: `npx tsc --noEmit` — catat error yang ada, siapkan alasan
- [ ] Test: `npx jest` — pastikan passing
- [ ] Cek semua halaman yang akan didemo:

| Halaman | Cek |
|---|---|
| `/login` | Login sukses + gagal (error message) |
| `/dashboard` | Quick actions, account info |
| `/dashboard/profile` | Edit profile + change password |
| `/dashboard/career` | Job list, filter, search |
| `/dashboard/track-record` | CRUD + pagination |
| `/dashboard/tracer-study` | Multi-step form + submitted view |
| `/user/rekomendasi` | Rekomendasi muncul, score bars, penjelasan cosine |
| `/admin` | Stats dashboard |
| `/admin/career-center` | CRUD lowongan, toggle status |
| `/admin/alumni` | Tabel alumni |

### Demo Run-through (15 menit)

**Sesi 1 — User Flow (5 menit):**
1. Login sebagai alumni
2. Lihat dashboard
3. Isi/lengkapi tujuh kriteria profil rekomendasi
4. Lihat rekomendasi lowongan
5. Klik detail rekomendasi → lihat skor Cosine Similarity

**Sesi 2 — Admin Flow (5 menit):**
1. Login sebagai super_user
2. Tambah lowongan baru
3. Lihat statistik
4. Export data

**Sesi 3 — Algoritma (5 menit):**
1. Tunjukkan perbedaan rekomendasi sebelum dan setelah profil lengkap
2. Tunjukkan dua alumni beda skill → rekomendasi berbeda
3. Tunjukkan tujuh kriteria yang masuk dokumen profil dan skor cosine

### Skenario Darurat

| Masalah | Solusi |
|---|---|
| Database mati | Ada backup Supabase project? Siapkan local |
| Internet mati | `npm run dev` dengan Supabase local |
| Rekomendasi kosong | Cek data di DB, atau demo pake seed data |
| Error di layar | Jangan panik — "Ini error karena X, biasanya berfungsi. Mari kita coba refresh." |
| Penguji tanya fitur yang belum ada | Jangan bohong — "Fitur itu belum kami implementasikan, tapi masuk dalam roadmap pengembangan." |

---

## 8. DAFTAR ISTILAH (CEDAL)

| Istilah | Arti | Dipakai Kapan |
|---|---|---|
| **Term Frequency (TF)** | Frekuensi kemunculan kata dalam dokumen | Menjelaskan TF-IDF |
| **Inverse Document Frequency (IDF)** | Kelangkaan kata di seluruh dokumen | Menjelaskan TF-IDF |
| **Cosine Similarity** | Kemiripan dua vektor (0-1) | Menjelaskan scoring |
| **Content-Based Filtering (CBF)** | Rekomendasi berdasarkan konten profil | Menjelaskan algoritma utama |
| **Tujuh Kriteria Profil** | Program studi, skills, pengalaman, sertifikasi, minat, lokasi, tipe | Menjelaskan dokumen profil |
| **Top-N Ranking** | Mengambil N hasil dengan cosine tertinggi | Menjelaskan output |
| **Row Level Security (RLS)** | Pembatasan akses baris DB per user | Menjelaskan keamanan data |
| **Service Role Key** | Kunci admin Supabase (bypass RLS) | Menjelaskan operasi admin |
| **Server Action** | Fungsi server di Next.js | Menjelaskan arsitektur |
| **Supabase SSR** | Server-side rendering auth untuk Next.js | Menjelaskan auth flow |

---

## DISCLAIMER

Dokumen ini adalah panduan teknis — bukan pengganti bimbingan dosen
pembimbing. Konsultasikan dengan pembimbing untuk:
- Format laporan skripsi (bab, subbab)
- Metodologi penelitian yang diakui program studi
- Tata tulis dan sitasi
- Kesesuaian dengan template skripsi STMIK AMIKOM Surakarta

---

*Dibuat: 29 Juni 2026 | Sumber: AUDIT_REPORT.md + codebase analysis*
