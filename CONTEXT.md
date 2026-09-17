# CONTEXT.md — SITRACK Domain Knowledge

> Apa itu SITRACK, siapa penggunanya, business rules, dan alur kerja.

---

## I. WHAT IS SITRACK

**SITRACK** (Sistem Informasi Track Record Alumni) adalah platform sistem alumni resmi **STMIK AMIKOM Surakarta**.

Tujuan utama:
1. Melacak karir dan perkembangan lulusan (sistem alumni)
2. Menyediakan data untuk **akreditasi** kampus (BAN-PT, LAM)
3. Membantu alumni mendapatkan rekomendasi lowongan kerja

---

## II. USER PERSONAS

### 1. Alumni (role: `user`)
- Lulusan STMIK AMIKOM Surakarta
- Email domain: `@amikomsolo.ac.id`
- **Kebutuhan:**
  - Mengisi kuesioner sistem alumni (wajib untuk akreditasi)
  - Mencatat riwayat kerja (track record)
  - Melihat lowongan kerja
  - Mendapat rekomendasi lowongan berdasarkan profil
- **Pintu masuk:** Login → dashboard alumni

### 2. Admin (role: `super_user`)
- Staf kampus / operator / admin
- **Kebutuhan:**
  - Mengelola akun alumni (CRUD, reset password, hapus)
  - Import alumni massal dari CSV
  - Mengelola pertanyaan kuesioner
  - Mengelola lowongan kerja di career center
  - Melihat statistik dan analitik
  - Export data ke Excel untuk laporan akreditasi
- **Pintu masuk:** Login → dashboard admin

---

## III. BUSINESS RULES

### Auth & Registration
- Hanya domain `@amikomsolo.ac.id` yang bisa login
- Akun dibuat oleh admin (tidak ada registrasi mandiri)
- Akun langsung aktif, tanpa verifikasi email
- Minimal password 8 karakter, harus ada uppercase + lowercase + digit

### Sistem Alumni
- Satu alumni hanya bisa punya **satu** response (upsert based on `user_id`)
- Mengisi ulang akan **menimpa** response sebelumnya
- Wajib diisi untuk akreditasi kampus
- Field `company` dan `position` WAJIB jika status pekerjaan = "Bekerja" atau "Wirausaha"
- Data sistem alumni tidak bisa diedit oleh alumni setelah submit (harus submit ulang)

### Track Record
- Alumni bisa punya **banyak** riwayat kerja
- Satu record bisa ditandai `is_current` (pekerjaan saat ini)
- CRUD penuh oleh pemilik record

### Career Center
- Hanya `super_user` yang bisa membuat/mengubah/menghapus lowongan
- Alumni hanya bisa melihat lowongan yang `is_active`
- Status lowongan bisa di-toggle aktif/nonaktif tanpa menghapus

### Rekomendasi Lowongan
- Algoritma **Content-Based Filtering** menggunakan preprocessing teks, TF-IDF, dan Cosine Similarity.
- Profil alumni dan lowongan dibangun sebagai dokumen teks dari tujuh kriteria: program studi, skills, pengalaman kerja, sertifikasi, bidang pekerjaan yang diminati, preferensi lokasi kerja, dan tipe pekerjaan.
- Pengalaman kerja memakai `position` dan `description`; nama perusahaan tidak diprioritaskan.
- `location` adalah domisili alumni, sedangkan `preferred_location` adalah preferensi lokasi kerja.
- `expected_salary`, IPK, dan bobot manual tidak digunakan dalam scoring.
- Skor Cosine Similarity menjadi skor akhir; hasil diurutkan dari skor tertinggi dan dibatasi sebagai Top-N.

### Admin Access
- Multi-layer security: middleware → layout guard → server action guard
- Operasi sensitif (reset password, hapus user) pakai **service_role key** (bypass RLS)

---

## IV. DOMAIN GLOSSARY

| Istilah | Arti |
|---|---|
| Sistem Alumni | Pelacakan alumni — data karir, pendidikan, kontribusi |
| Track Record | Riwayat pekerjaan alumni |
| Career Center | Portal lowongan kerja untuk alumni |
| Smart Matching | Rekomendasi lowongan berdasarkan profil (TF-IDF) |
| Response Rate | Persentase alumni yang sudah mengisi sistem alumni |
| Employment Rate | Persentase alumni yang sudah bekerja |
| Field Match Rate | Kesesuaian bidang studi dengan pekerjaan |

---

## V. DATA RELATIONSHIPS

```
User (role=user)
  ├── 1 Profile (dari tabel profiles, otomatis saat login pertama)
  ├── N Track Records (riwayat kerja)
  ├── 1 Sistem Alumni Response (satu per user, upsert)
  └── N Job Recommendations (dihitung real-time via TF-IDF)

Admin (role=super_user)
  ├── Mengelola N User Profiles
  ├── Mengelola M Sistem Alumni Questions (per angkatan)
  ├── Mengelola K Job Listings
  └── Melihat semua Analytics
```
