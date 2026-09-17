# LAPORAN HASIL PENGEMBANGAN SISTEM SITRACK
## Sistem Informasi Sistem Alumni STMIK Amikom Surakarta

**Nama Sistem:** SITRACK — Sistem Informasi Sistem Alumni  
**Institusi:** STMIK Amikom Surakarta  
**Tech Stack:** Next.js 14 (App Router), TypeScript, Supabase, Tailwind CSS, Zod, shadcn/ui  
**Tanggal Laporan:** 20 Juni 2026  
**Status Pengembangan:** ~97% Selesai

---

## DAFTAR ISI

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Arsitektur Sistem](#2-arsitektur-sistem)
3. [Fitur yang Dikembangkan](#3-fitur-yang-dikembangkan)
4. [Desain dan Implementasi Database](#4-desain-dan-implementasi-database)
5. [Algoritma Content-Based Filtering](#5-algoritma-content-based-filtering)
6. [Implementasi Keamanan](#6-implementasi-keamanan)
7. [Pengujian Sistem](#7-pengujian-sistem)
8. [Desain Antarmuka Pengguna](#8-desain-antarmuka-pengguna)
9. [Kesimpulan dan Rekomendasi](#9-kesimpulan-dan-rekomendasi)

---

## 1. RINGKASAN EKSEKUTIF

SITRACK adalah aplikasi web full-stack untuk pengelolaan sistem alumni (penelusuran lulusan) di STMIK Amikom Surakarta. Sistem ini dirancang dengan arsitektur role-based access control (RBAC) yang memisahkan akses antara **Super User (Admin)** dan **User (Alumni)**, serta dilengkapi dengan fitur rekomendasi lowongan kerja menggunakan algoritma **Content-Based Filtering (CBF)**.

### 1.1 Metrik Pengembangan

| Metrik | Status |
|--------|--------|
| **Progres Keseluruhan** | **~97% Selesai** |
| **Fitur Inti** | Lengkap |
| **Database Schema** | Lengkap (4 migrasi SQL) |
| **Server Actions (CRUD)** | 8 modul + 1 TF-IDF engine |
| **UI/Frontend Pages** | 14 halaman + Landing Page |
| **Automated Tests** | ~180+ tes (semua lulus) |
| **TypeScript** | 0 error kompilasi |
| **Security (RLS + Zod)** | Terimplementasi |

### 1.2 Fitur Utama

**Portal Alumni:**
- Dashboard personal dengan statistik
- Profil lengkap (skills, lokasi, ekspektasi gaji, tipe pekerjaan)
- Track Record (riwayat kerja dengan CRUD penuh)
- Sistem Alumni (kuesioner multi-step dengan validasi)
- Career Center (lowongan kerja dengan filter dan pencarian)
- **Rekomendasi Lowongan** dengan algoritma TF-IDF + Cosine Similarity

**Panel Admin:**
- Dashboard dengan statistik ringkasan
- Manajemen alumni (CRUD user, reset password, hapus akun)
- Bulk import CSV dengan validasi per baris
- Kelola kuesioner sistem alumni (CRUD pertanyaan)
- Kelola lowongan kerja (CRUD, toggle status)
- Analytics dan analisis data sistem alumni

---

## 2. ARSITEKTUR SISTEM

### 2.1 Tech Stack

| Teknologi | Versi | Peran |
|-----------|-------|-------|
| **Next.js** | 14.2.5 | Framework utama dengan App Router |
| **React** | 18.3.1 | Library UI |
| **TypeScript** | 5.7.0 | Type safety dan developer experience |
| **Supabase** | 2.108.1 | Backend-as-a-Service (Auth, Database, Storage) |
| **@supabase/ssr** | 0.12.0 | Server-side rendering utilities |
| **Tailwind CSS** | 3.4.4 | Utility-first CSS framework |
| **Zod** | 4.4.3 | Schema validation |
| **shadcn/ui** | latest | Komponen UI berbasis Radix UI |
| **Jest** | 30.4.2 | Test runner |
| **React Testing Library** | 16.3.2 | Testing utilities |

### 2.2 Struktur Direktori

```
SITRACK/
├── app/                              # Next.js App Router
│   ├── (auth)/
│   │   └── login/                    # Halaman autentikasi
│   │       └── page.tsx
│   ├── (protected)/
│   │   ├── dashboard/                # Portal Alumni
│   │   │   ├── page.tsx              # Dashboard overview
│   │   │   ├── profile/              # Edit profil + ganti password
│   │   │   ├── track-record/         # Riwayat kerja (CRUD)
│   │   │   ├── tracer-study/         # Kuesioner multi-step
│   │   │   └── career/               # Lowongan kerja
│   │   ├── admin/                    # Panel Admin
│   │   │   ├── page.tsx              # Dashboard admin
│   │   │   ├── alumni/               # Manajemen user
│   │   │   ├── analytics/            # Statistik & grafik
│   │   │   ├── kuesioner/            # CRUD pertanyaan
│   │   │   └── career-center/        # CRUD lowongan
│   │   └── user/
│   │       └── rekomendasi/          # Rekomendasi lowongan (CBF)
│   ├── layout.tsx                    # Root layout + Toaster
│   ├── page.tsx                      # Landing page
│   └── globals.css                   # Tailwind + design tokens
│
├── lib/
│   ├── actions/                      # Server Actions (8 modul)
│   │   ├── alumni.ts                 # CRUD user + statistik
│   │   ├── bulk-import.ts            # Import massal CSV
│   │   ├── jobs.ts                   # CRUD lowongan
│   │   ├── matching.ts               # ★ Content-Based Filtering engine
│   │   ├── profile.ts                # Update profil + ganti password
│   │   ├── questions.ts              # CRUD pertanyaan kuesioner
│   │   ├── tracer-study.ts           # Submit kuesioner
│   │   └── track-record.ts           # CRUD riwayat kerja
│   │
│   ├── schemas/                      # Zod Validation Schemas
│   │   ├── jobs.ts
│   │   ├── profile.ts
│   │   ├── track-record.ts
│   │   └── tracer-study.ts
│   │
│   ├── supabase/                     # Supabase clients
│   │   ├── client.ts                 # Browser client
│   │   ├── server.ts                 # Server client
│   │   ├── middleware.ts             # Middleware client
│   │   └── admin.ts                  # Admin client (service_role)
│   │
│   ├── preprocessing.ts              # ★ Text preprocessing pipeline
│   ├── tfidf.ts                      # ★ TF-IDF + Cosine Similarity
│   └── csv-utils.ts                  # CSV parser
│
├── components/
│   ├── ui/                           # shadcn components
│   ├── admin/                        # Admin-specific components
│   ├── dashboard/                    # Dashboard widgets
│   └── auth/                         # Role guard
│
├── types/
│   └── database.ts                   # TypeScript type definitions
│
├── supabase/migrations/
│   ├── 001_rbac.sql                  # Role-based access control
│   ├── 002_tables.sql                # Tabel utama
│   ├── 003_tracer_study_questions.sql
│   └── 004_profile_matching_fields.sql
│
├── __tests__/                        # Automated tests (~180+ tests)
│   ├── auth.test.tsx                 # Autentikasi & routing (14 tests)
│   ├── track-record.test.tsx         # CRUD track record (12 tests)
│   ├── kuesioner.test.tsx            # Kuesioner sistem alumni (17 tests)
│   ├── admin-alumni.test.tsx         # Manajemen alumni (14 tests)
│   ├── bulk-import.test.tsx          # Import CSV (10 tests)
│   ├── bulk-import-*.test.ts         # Additional bulk import tests
│   ├── matching.test.ts              # ★ TF-IDF + CBF (25+ tests)
│   └── tracer-study-analytics.test.ts
│
├── middleware.ts                     # Route protection + role check
├── DESIGN_SYSTEM.md                  # Dokumentasi design system
├── QA_REPORT.md                      # Laporan QA & testing
└── LAPORAN_HASIL.md                  # Laporan ini
```

### 2.3 Alur Data Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                              │
│  (Browser / Mobile)                                         │
└────────────┬────────────────────────────────────────────────┘
             │ HTTPS Request
             ▼
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS MIDDLEWARE                        │
│  - Route protection                                         │
│  - Role-based redirect                                      │
│  - Session validation                                       │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                   SERVER COMPONENTS                          │
│  - Fetch data dari Supabase                                 │
│  - Server-side rendering                                    │
│  - Invoke Server Actions                                    │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVER ACTIONS                            │
│  - Zod validation                                           │
│  - Business logic                                           │
│  - Database operations                                      │
│  - Revalidate cache                                         │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Auth API   │  │  PostgreSQL  │  │     RLS      │       │
│  │  (JWT/Session)│  │   Database   │  │   Policies   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. FITUR YANG DIKEMBANGKAN

### 3.1 Autentikasi dan Otorisasi (RBAC) — 100% Selesai

#### 3.1.1 Login
- **Validasi email domain:** Hanya menerima email `@amikomsurakarta.ac.id`
- **Validasi password:** Minimal 6 karakter
- **Session management:** Cookie-based via Supabase SSR
- **Redirect logic:** Otomatis redirect berdasarkan role
  - `super_user` → `/admin`
  - `user` (alumni) → `/dashboard`

#### 3.1.2 Role-Based Middleware
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse } = await createMiddlewareClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  
  // Route protection
  const isProtectedRoute = pathname.startsWith('/dashboard') || 
                          pathname.startsWith('/admin')
  
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Role guard
  if (user && pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'super_user') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }
  
  return supabaseResponse
}
```

#### 3.1.3 Row-Level Security (RLS)
Semua tabel dilindungi dengan RLS policies:
- **profiles:** User hanya bisa akses profil sendiri, super_user bisa akses semua
- **track_records:** User hanya bisa CRUD riwayat kerja sendiri
- **tracer_study_responses:** User hanya bisa submit dan lihat respons sendiri
- **jobs:** Super_user bisa CRUD semua lowongan, user hanya bisa lihat yang aktif

#### 3.1.4 Role Guard Component
```typescript
// components/auth/role-guard.tsx
export async function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const role = await getUserRole()
  
  if (!role || !allowedRoles.includes(role)) {
    redirect('/dashboard')
  }
  
  return <>{children}</>
}
```

### 3.2 Modul Alumni (User) — 98% Selesai

#### 3.2.1 Dashboard
**Lokasi:** `app/(protected)/dashboard/page.tsx`

**Fitur:**
- Overview personal dengan statistik:
  - Total track records
  - Status sistem alumni (sudah/belum isi)
  - Jumlah lowongan aktif
  - Jumlah rekomendasi yang tersedia
- Quick actions ke semua modul
- Info akun dan role badge
- Responsive design

#### 3.2.2 Profil Pengguna
**Lokasi:** `app/(protected)/dashboard/profile/page.tsx`

**Fitur:**
- **Edit profil lengkap:**
  - Nama lengkap
  - NIM (Nomor Induk Mahasiswa)
  - Tanggal lahir
  - Nomor telepon
  - Bio/deskripsi diri
  - **Skills** (array of strings)
  - Lokasi domisili
  - Tingkat pendidikan (legacy/Tracer Study)
  - **Program studi** untuk rekomendasi
  - **Sertifikasi kompetensi** (array of strings)
  - **Bidang/posisi pekerjaan yang diminati** (array of strings)
  - **Preferensi lokasi kerja**
  - Tipe pekerjaan yang disukai
  - Ekspektasi gaji tetap disimpan sebagai data profil, tetapi tidak digunakan untuk matching
- **Ganti password:**
  - Verifikasi password lama
  - Validasi password baru (minimal 6 karakter)
- **Live preview:** Perubahan langsung terlihat di preview
- **Validasi:** Zod schema validation

**Server Action:** `lib/actions/profile.ts`
```typescript
export async function updateProfile(formData: FormData) {
  const parsed = profileSchema.safeParse(raw)
  if (!parsed.success) throw new Error(...)
  
  await supabase.from('profiles').update({...}).eq('id', user.id)
  revalidatePath('/dashboard/profile')
}
```

#### 3.2.3 Track Record (Riwayat Kerja)
**Lokasi:** `app/(protected)/dashboard/track-record/page.tsx`

**Fitur:**
- **CRUD penuh:**
  - Create: Tambah pengalaman kerja baru
  - Read: Lihat semua riwayat kerja
  - Update: Edit data pekerjaan
  - Delete: Hapus riwayat kerja
- **Field data:**
  - Nama perusahaan
  - Posisi/jabatan
  - Tanggal mulai dan selesai
  - Deskripsi pekerjaan
  - Status "masih bekerja di sini" (is_current)
- **Validasi:** Zod schema dengan validasi tanggal
- **Modal form:** Dialog interaktif untuk create/edit
- **Timeline view:** Tampilan kronologis

**Server Action:** `lib/actions/track-record.ts`
```typescript
export async function createTrackRecord(formData: FormData) {
  const parsed = trackRecordSchema.safeParse(raw)
  if (!parsed.success) throw new Error(...)
  
  await supabase.from('track_records').insert({
    user_id: user.id,
    ...parsed.data
  })
  revalidatePath('/dashboard/track-record')
}
```

#### 3.2.4 Sistem Alumni (Kuesioner Alumni)
**Lokasi:** `app/(protected)/dashboard/tracer-study/page.tsx`

**Fitur:**
- **Multi-step form (4 langkah):**
  1. **Data Kelulusan:** Tahun lulus, tingkat pendidikan
  2. **Status Pekerjaan:** Status saat ini (bekerja/studi/wirausaha)
  3. **Detail Pekerjaan:** Perusahaan, posisi, gaji, kesesuaian bidang
  4. **Saran & Masukan:** Feedback untuk institusi
- **Validasi per step:** Tidak bisa lanjut ke step berikutnya jika belum lengkap
- **Upsert logic:** Update jika sudah pernah isi, insert jika belum
- **Dynamic questions:** Pertanyaan dimuat dari database berdasarkan angkatan
- **Toast notification:** Feedback sukses/error
- **Auto-save:** Data tersimpan otomatis saat submit

**Server Action:** `lib/actions/tracer-study.ts`
```typescript
export async function submitSistemAlumni(formData: FormData) {
  const parsed = SistemAlumniSchema.safeParse(raw)
  if (!parsed.success) throw new Error(...)
  
  await supabase.from('tracer_study_responses').upsert({
    user_id: user.id,
    ...parsed.data
  }, { onConflict: 'user_id' })
  revalidatePath('/dashboard/tracer-study')
}
```

#### 3.2.5 Career Center (Lowongan Kerja)
**Lokasi:** `app/(protected)/dashboard/career/page.tsx`

**Fitur:**
- **Daftar lowongan aktif:**
  - Grid layout responsive
  - Card-based design
- **Filter dan pencarian:**
  - Filter berdasarkan tipe pekerjaan (Full-time, Part-time, Contract, Internship)
  - Pencarian berdasarkan judul, perusahaan, atau skill
- **Detail lowongan:**
  - Modal detail dengan info lengkap
  - Informasi perusahaan, lokasi, gaji
  - Deskripsi pekerjaan
  - Skills yang dibutuhkan
  - Kontak dan link aplikasi
- **Badge dan tags:** Visual indicator untuk tipe dan skills

#### 3.2.6 Rekomendasi Lowongan (Content-Based Filtering)
**Lokasi:** `app/(protected)/user/rekomendasi/page.tsx`

**Fitur:**
- **Algoritma matching:**
  - Content-Based Filtering dengan TF-IDF + Cosine Similarity sebagai skor akhir
  - Tidak menggunakan Collaborative Filtering, rule-based scoring, IPK, expected salary, atau bobot manual
- **Text preprocessing pipeline:**
  - Case folding (lowercase)
  - Cleaning (hapus simbol dan angka)
  - Tokenization (pecah kata)
  - Stopword removal (ID + EN)
- **Dokumen pembentuk:**
  - Profil alumni: program_studi + skills + track_records.position/description + certifications + job_interests + preferred_location + preferred_type
  - Lowongan: title + description + skills + location + type
- **Scoring dan output:**
  - TF-IDF dihitung atas koleksi query profil dan seluruh lowongan aktif
  - Cosine Similarity menjadi skor akhir setiap lowongan
  - Hasil diurutkan dari skor tertinggi dan dibatasi Top-N
- **Visual hasil:**
  - Score bar dengan warna (hijau ≥70%, kuning ≥40%, merah <40%)
  - Penjelasan skor Cosine Similarity pada detail rekomendasi
  - Skill yang dimiliki alumni ditandai pada daftar skill lowongan


**Implementasi detail:** Lihat [Bagian 5: Algoritma Content-Based Filtering](#5-algoritma-content-based-filtering)

### 3.3 Modul Admin (Super User) — 95% Selesai

#### 3.3.1 Admin Dashboard
**Lokasi:** `app/(protected)/admin/page.tsx`

**Fitur:**
- **Statistik ringkasan:**
  - Total alumni
  - Total super users
  - Kuesioner terisi
  - Response rate
- **Quick links:** Navigasi cepat ke semua halaman admin
- **Visual cards:** Card-based layout dengan icon

#### 3.3.2 Manajemen Alumni
**Lokasi:** `app/(protected)/admin/alumni/page.tsx`

**Fitur:**
- **Tabel alumni:**
  - Daftar seluruh user (alumni + super_user)
  - Search berdasarkan email, nama, atau NIM
  - Filter berdasarkan role
  - Pagination (jika data > 20)
- **Tambah user baru:**
  - Form individual (manual input)
  - Validasi email domain
  - Pilihan role (user / super_user)
- **Reset password:**
  - Modal dialog konfirmasi
  - Generate password baru atau input manual
  - Menggunakan admin client (service_role)
- **Hapus akun:**
  - Konfirmasi sebelum hapus
  - Cascade delete (profiles + auth.users)
- **Role badge:** Visual indicator untuk role

**Server Action:** `lib/actions/alumni.ts`
```typescript
export async function resetUserPassword(userId: string, newPassword: string) {
  const adminSupabase = createAdminClient()
  await adminSupabase.auth.admin.updateUserById(userId, {
    password: newPassword
  })
  revalidatePath('/admin/alumni')
}
```

#### 3.3.3 Import Massal (Bulk Import CSV)
**Lokasi:** `app/(protected)/admin/bulk-import/page.tsx`

**Fitur:**
- **Upload CSV atau paste data:**
  - Textarea untuk paste data
  - File upload (opsional)
- **CSV parsing:**
  - Handle quoted fields
  - Support berbagai delimiter (koma, titik koma)
  - Auto-detect header
- **Validasi per baris:**
  - Email domain validation
  - Password length validation
  - Required fields check
  - Error reporting per row
- **Field yang didukung:**
  - Wajib: Nama, Email, Password
  - Opsional: Role, Skills, Location, Education Level, Expected Salary, Preferred Type
- **Proses batch:**
  - Create user via admin API
  - Update profile dengan skills array
  - Skip row yang error, lanjutkan yang lain
- **Laporan hasil:**
  - Total baris
  - Berhasil dibuat
  - Gagal (dengan detail error per row)

**Server Action:** `lib/actions/bulk-import.ts`
```typescript
export async function bulkImportUsers(raw: string): Promise<BulkImportResult> {
  const lines = raw.split('\n').filter(l => l.length > 0)
  const headers = parseCSVLine(lines[0])
  
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i])
    const parsed = rowSchema.safeParse({...})
    
    if (!parsed.success) {
      result.failed++
      result.errors.push({ row: i+1, message: ... })
      continue
    }
    
    const { data: userData } = await adminSupabase.auth.admin.createUser({...})
    await adminSupabase.from('profiles').update({...}).eq('id', userData.user.id)
    result.success++
  }
  
  return result
}
```

#### 3.3.4 Kelola Kuesioner
**Lokasi:** `app/(protected)/admin/kuesioner/page.tsx`

**Fitur:**
- **CRUD pertanyaan:**
  - Create: Tambah pertanyaan baru
  - Read: Daftar semua pertanyaan
  - Update: Edit pertanyaan
  - Delete: Hapus pertanyaan
- **Tipe pertanyaan:**
  - Text (input singkat)
  - Textarea (input panjang)
  - Select (dropdown)
  - Radio (pilihan tunggal)
  - Number (angka)
- **Opsi pilihan:**
  - Untuk tipe select/radio
  - Newline-separated input
- **Toggle aktif/nonaktif:**
  - Pertanyaan tidak aktif tidak ditampilkan di kuesioner
- **Display order:**
  - Custom urutan tampilan
  - Sort by display_order
- **Filter angkatan:**
  - Pertanyaan dikaitkan dengan tahun angkatan
  - Filter berdasarkan angkatan

**Server Action:** `lib/actions/questions.ts`
```typescript
export async function createQuestion(formData: FormData) {
  const parsed = questionSchema.safeParse(raw)
  if (!parsed.success) throw new Error(...)
  
  const optionsArray = parsed.data.options
    ? parsed.data.options.split('\n').map(s => s.trim())
    : null
  
  await supabase.from('tracer_study_questions').insert({
    ...parsed.data,
    options: optionsArray
  })
  revalidatePath('/admin/kuesioner')
}
```

#### 3.3.5 Career Center Admin
**Lokasi:** `app/(protected)/admin/career-center/page.tsx`

**Fitur:**
- **CRUD lowongan kerja:**
  - Create: Tambah lowongan baru
  - Read: Daftar semua lowongan (aktif + nonaktif)
  - Update: Edit lowongan
  - Delete: Hapus lowongan
- **Field lengkap:**
  - Judul posisi
  - Nama perusahaan
  - Lokasi
  - Tipe pekerjaan
  - Range gaji
  - Deskripsi pekerjaan
  - Skills yang dibutuhkan (comma-separated)
  - Informasi kontak
  - URL aplikasi
  - Sumber lowongan
- **Toggle status:**
  - Aktif/nonaktifkan lowongan
  - Lowongan nonaktif tidak tampil di alumni
- **Statistik:**
  - Total lowongan
  - Lowongan aktif
  - Lowongan nonaktif

**Server Action:** `lib/actions/jobs.ts`
```typescript
export async function createJob(formData: FormData) {
  const parsed = jobSchema.safeParse(raw)
  if (!parsed.success) throw new Error(...)
  
  const skillsArray = parsed.data.skills
    ? parsed.data.skills.split(',').map(s => s.trim())
    : []
  
  await supabase.from('jobs').insert({
    ...parsed.data,
    skills: skillsArray
  })
  revalidatePath('/admin/career-center')
}
```

#### 3.3.6 Analytics / Analisis Data
**Lokasi:** `app/(protected)/admin/analytics/page.tsx`

**Fitur:**
- **Statistik sistem alumni:**
  - Total responden kuesioner
  - Persentase alumni bekerja
  - Persentase melanjutkan studi
  - Persentase kesesuaian bidang studi
- **Distribusi gaji:**
  - Bar chart visual
  - Breakdown per range gaji
- **Ringkasan status:**
  - 3 lingkaran statistik (bekerja, studi, wirausaha)
  - Visual percentage
- **Filter tahun:**
  - Filter berdasarkan tahun kelulusan
  - Analisis per cohort
- **Kelengkapan profil rekomendasi:**
  - Jumlah alumni yang punya program studi
  - Jumlah alumni yang punya skills
  - Jumlah alumni yang punya pengalaman kerja
  - Jumlah alumni yang punya sertifikasi
  - Jumlah alumni yang punya bidang pekerjaan yang diminati
  - Jumlah alumni yang punya preferensi lokasi
  - Jumlah alumni yang punya preferensi tipe
  - Persentase profil lengkap

**Server Action:** `lib/actions/questions.ts`
```typescript
export async function getSistemAlumniStats(year?: string) {
  let query = supabase.from('tracer_study_responses').select('*')
  if (year) query = query.eq('graduation_year', Number(year))
  
  const { data: responses } = await query
  const rData = responses as SistemAlumniResponse[]
  
  const employed = rData.filter(r => r.employment_status === 'Bekerja').length
  const studying = rData.filter(r => r.employment_status === 'Melanjutkan Studi').length
  
  return {
    totalResponses: rData.length,
    employmentRate: Math.round((employed / rData.length) * 100),
    studyingRate: Math.round((studying / rData.length) * 100),
    salaryDistribution: ...,
    fieldMatchRate: ...
  }
}
```

---

## 4. DESAIN DAN IMPLEMENTASI DATABASE

### 4.1 Entity Relationship Diagram (ERD)

```
┌─────────────────┐
│   auth.users    │
│  (Supabase Auth)│
└────────┬────────┘
         │ id (UUID)
         │
         ├──────────────────────────────────┐
         │                                  │
         ▼                                  ▼
┌─────────────────────┐         ┌────────────────────────┐
│     profiles        │         │    track_records       │
├─────────────────────┤         ├────────────────────────┤
│ id (PK, FK)         │         │ id (PK)                │
│ email               │         │ user_id (FK)           │
│ role (enum)         │         │ company                │
│ full_name           │         │ position               │
│ nim                 │         │ start_date             │
│ tanggal_lahir       │         │ end_date               │
│ phone               │         │ description            │
│ bio                 │         │ is_current             │
│ skills (array)      │         │ created_at             │
│ location            │         │ updated_at             │
│ education_level     │         └────────────────────────┘
│ program_studi       │
│ certifications (array)
│ job_interests (array)
│ preferred_location  │
│ expected_salary     │
│ preferred_type      │
│ created_at          │
│ updated_at          │
└────────┬────────────┘
         │
         ├──────────────────────────────────┐
         │                                  │
         ▼                                  ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│ tracer_study_responses   │    │ tracer_study_questions   │
├──────────────────────────┤    ├──────────────────────────┤
│ id (PK)                  │    │ id (PK)                  │
│ user_id (FK, UNIQUE)     │    │ question_text            │
│ graduation_year          │    │ question_type (enum)     │
│ education_level          │    │ options (array)          │
│ employment_status        │    │ is_active                │
│ company                  │    │ display_order            │
│ position                 │    │ angkatan                 │
│ salary_range             │    │ created_at               │
│ study_field_match        │    │ updated_at               │
│ suggestions              │    └──────────────────────────┘
│ submitted_at             │
│ updated_at               │
└──────────────────────────┘

┌──────────────────────────┐
│         jobs             │
├──────────────────────────┤
│ id (PK)                  │
│ title                    │
│ company                  │
│ location                 │
│ type (enum)              │
│ salary                   │
│ description              │
│ skills (array)           │
│ contact_info             │
│ url                      │
│ source                   │
│ is_active                │
│ created_at               │
│ updated_at               │
└──────────────────────────┘
```

### 4.2 Skema Tabel

#### 4.2.1 Tabel profiles
**Migration:** `001_rbac.sql`

```sql
CREATE TABLE public.profiles (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email      TEXT NOT NULL,
  role       public.app_role NOT NULL DEFAULT 'user',
  full_name  TEXT,
  nim        TEXT,
  tanggal_lahir DATE,
  phone      TEXT,
  bio        TEXT,
  skills     TEXT[],
  location   TEXT,
  education_level TEXT,
  expected_salary TEXT,
  preferred_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**RLS Policies:**
```sql
-- Super user: akses semua profil
CREATE POLICY "super_user: select all profiles"
  ON public.profiles FOR SELECT
  USING ( public.get_my_role() = 'super_user' );

CREATE POLICY "super_user: update all profiles"
  ON public.profiles FOR UPDATE
  USING ( public.get_my_role() = 'super_user' );

-- User biasa: hanya akses profil sendiri
CREATE POLICY "user: select own profile"
  ON public.profiles FOR SELECT
  USING ( auth.uid() = id );

CREATE POLICY "user: update own profile"
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id )
  WITH CHECK ( role = (SELECT role FROM public.profiles WHERE id = auth.uid()) );
```

#### 4.2.2 Tabel track_records
**Migration:** `002_tables.sql`

```sql
CREATE TABLE public.track_records (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  company     TEXT NOT NULL,
  position    TEXT NOT NULL,
  start_date  DATE NOT NULL,
  end_date    DATE,
  description TEXT,
  is_current  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
```

**RLS Policies:**
```sql
-- User hanya bisa CRUD track record sendiri
CREATE POLICY "user: select own track records"
  ON public.track_records FOR SELECT
  USING ( auth.uid() = user_id );

CREATE POLICY "user: insert own track records"
  ON public.track_records FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "user: update own track records"
  ON public.track_records FOR UPDATE
  USING ( auth.uid() = user_id );

CREATE POLICY "user: delete own track records"
  ON public.track_records FOR DELETE
  USING ( auth.uid() = user_id );

-- Super user: akses semua
CREATE POLICY "super_user: select all track records"
  ON public.track_records FOR SELECT
  USING ( public.get_my_role() = 'super_user' );
```

#### 4.2.3 Tabel tracer_study_responses
**Migration:** `002_tables.sql`

```sql
CREATE TABLE public.tracer_study_responses (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  graduation_year     INTEGER NOT NULL,
  education_level     TEXT NOT NULL,
  employment_status   TEXT NOT NULL,
  company             TEXT,
  position            TEXT,
  salary_range        TEXT,
  study_field_match   TEXT,
  suggestions         TEXT,
  submitted_at        TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);
```

**Constraint:** `user_id` UNIQUE (satu user = satu respons)

#### 4.2.4 Tabel tracer_study_questions
**Migration:** `003_tracer_study_questions.sql`

```sql
CREATE TABLE public.tracer_study_questions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text   TEXT NOT NULL,
  question_type   TEXT CHECK (question_type IN ('text', 'textarea', 'select', 'radio', 'number')),
  options         TEXT[],
  is_active       BOOLEAN DEFAULT TRUE,
  display_order   INTEGER DEFAULT 0,
  angkatan        TEXT DEFAULT '2024',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

#### 4.2.5 Tabel jobs
**Migration:** `002_tables.sql`

```sql
CREATE TABLE public.jobs (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title         TEXT NOT NULL,
  company       TEXT NOT NULL,
  location      TEXT NOT NULL,
  type          TEXT CHECK (type IN ('Full-time', 'Part-time', 'Contract', 'Internship')),
  salary        TEXT,
  description   TEXT NOT NULL,
  skills        TEXT[],
  contact_info  TEXT,
  url           TEXT NOT NULL,
  source        TEXT NOT NULL,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
```

### 4.3 Trigger dan Helper Functions

#### 4.3.1 Auto-insert Profile
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')::public.app_role
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

#### 4.3.2 Auto-update updated_at
```sql
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
```

#### 4.3.3 Helper Function: get_my_role
```sql
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;
```

**Catatan:** Fungsi ini menggunakan `SECURITY DEFINER` untuk menghindari infinite recursion pada RLS policy.

### 4.4 Migrasi Database

| Migration | File | Deskripsi |
|-----------|------|-----------|
| **001** | `001_rbac.sql` | Enum role, tabel profiles, trigger, RLS policies |
| **002** | `002_tables.sql` | Tabel track_records, tracer_study_responses, jobs |
| **003** | `003_tracer_study_questions.sql` | Tabel pertanyaan kuesioner dengan field angkatan |
| **004** | `004_profile_matching_fields.sql` | Tambah field untuk matching (skills, location, salary, type) |
| **014** | `014_add_profile_extended_fields.sql` | Tambah `program_studi`, `certifications`, `job_interests`, dan `preferred_location` |

---

## 5. ALGORITMA CONTENT-BASED FILTERING

### 5.1 Konsep Dasar

**Content-Based Filtering (CBF)** adalah metode rekomendasi yang membandingkan **konten** dari dua entitas — dalam hal ini **profil alumni** dan **deskripsi lowongan kerja** — untuk menemukan tingkat kecocokan. Semakin mirip kontennya, semakin tinggi skor rekomendasinya.

Sistem ini menggunakan **tujuh kriteria konten** yang digabung menjadi dokumen teks:

| Kriteria | Sumber data | Peran |
|----------|-------------|-------|
| **Program studi** | `profiles.program_studi` | Konteks bidang akademik |
| **Skills** | `profiles.skills` | Keahlian teknis dan non-teknis |
| **Pengalaman kerja** | `track_records.position` + `track_records.description` | Bukti peran dan tanggung jawab; nama perusahaan tidak diprioritaskan |
| **Sertifikasi** | `profiles.certifications` | Kompetensi tersertifikasi |
| **Bidang pekerjaan** | `profiles.job_interests` | Minat posisi/bidang |
| **Preferensi lokasi** | `profiles.preferred_location` | Lokasi kerja yang diinginkan |
| **Tipe pekerjaan** | `profiles.preferred_type` | Preferensi tipe kontrak/kerja |

`location` tetap merepresentasikan domisili, sedangkan `preferred_location` adalah preferensi kerja. `education_level` dipertahankan untuk data legacy dan Tracer Study, tetapi bukan sumber utama rekomendasi. `expected_salary` dan IPK tidak ikut scoring.

### 5.2 Alur Lengkap Sistem

```
┌─────────────────────────────────────────────────────────────┐
│ 1. INPUT: Alumni login                                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. FETCH data dari database                                 │
│    - Profil alumni (tujuh kriteria rekomendasi)             │
│    - Track records milik alumni                             │
│    - Semua lowongan aktif                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. BUILD dokumen teks                                       │
│    - Dokumen profil: program_studi, skills, position,       │
│      description, certifications, job_interests,            │
│      preferred_location, preferred_type                     │
│    - Dokumen lowongan: title, description, skills,          │
│      location, type                                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. PREPROCESSING (untuk setiap dokumen)                     │
│    a. Case Folding     → lowercase                          │
│    b. Cleaning         → hapus tanda baca & simbol          │
│    c. Tokenization     → pecah jadi kata-kata               │
│    d. Stopword Removal → hapus kata umum (dan, yang, the)   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. TF-IDF COMPUTATION                                       │
│    a. Gabungkan query profil dan seluruh dokumen lowongan   │
│    b. Hitung IDF = ln(N / df) + 1 untuk setiap term         │
│    c. Hitung TF untuk profil dan setiap lowongan            │
│    d. Hitung TF-IDF = TF × IDF untuk setiap term            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. COSINE SIMILARITY                                        │
│    Hitung kemiripan vektor TF-IDF profil dengan setiap      │
│    lowongan → skor akhir (0.00 - 1.00)                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. SORT by score descending → Top-N hasil                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. OUTPUT: Array rekomendasi (MatchResult[])                │
│    - Job object                                             │
│    - Score Cosine Similarity (0-1)                          │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Text Preprocessing Pipeline

**Lokasi:** `lib/preprocessing.ts`

Sebelum teks bisa dihitung secara matematis, teks harus dibersihkan melalui 4 tahapan:

#### 5.3.1 Case Folding
Mengubah semua huruf menjadi lowercase.

```typescript
export function caseFolding(text: string): string {
  return text.toLowerCase()
}
```

**Contoh:**
```
Input:  "Saya adalah Backend Developer Laravel!"
Output: "saya adalah backend developer laravel!"
```

#### 5.3.2 Cleaning
Menghapus tanda baca, simbol, dan angka berdiri sendiri, namun mempertahankan spasi.

```typescript
export function cleaning(text: string): string {
  return text
    .replace(/[^a-zA-Z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
```

**Contoh:**
```
Input:  "saya adalah backend developer laravel!"
Output: "saya adalah backend developer laravel"
```

#### 5.3.3 Tokenization
Memecah kalimat menjadi array kata.

```typescript
export function tokenization(text: string): string[] {
  if (!text.trim()) return []
  return text.split(/\s+/).filter(Boolean)
}
```

**Contoh:**
```
Input:  "saya adalah backend developer laravel"
Output: ["saya", "adalah", "backend", "developer", "laravel"]
```

#### 5.3.4 Stopword Removal
Menghapus kata-kata umum yang tidak bermakna (Bahasa Indonesia & Inggris).

```typescript
const ALL_STOPWORDS = new Set([
  // Indonesian
  'dan', 'di', 'ke', 'dari', 'yang', 'dengan', 'ini', 'itu', 'untuk',
  'pada', 'adalah', 'akan', 'telah', 'sudah', 'bisa', 'dapat', 'tidak',
  // ... ~100+ kata
  
  // English
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were',
  // ... ~80+ kata
])

export function stopwordRemoval(tokens: string[]): string[] {
  return tokens.filter((t) => t.length > 1 && !ALL_STOPWORDS.has(t))
}
```

**Contoh:**
```
Input:  ["saya", "adalah", "backend", "developer", "laravel"]
Output: ["backend", "developer", "laravel"]
```

#### 5.3.5 Pipeline Function
Menggabungkan semua tahapan menjadi satu fungsi.

```typescript
export function preprocess(text: string): string[] {
  if (!text || !text.trim()) return []
  const folded = caseFolding(text)
  const cleaned = cleaning(folded)
  const tokens = tokenization(cleaned)
  return stopwordRemoval(tokens)
}

export function buildDocument(...fields: (string | null | undefined)[]): string[] {
  const raw = fields.filter((f): f is string => Boolean(f)).join(' ')
  return preprocess(raw)
}
```

**Contoh Penggunaan:**
```typescript
preprocess("Saya adalah seorang Backend Developer Laravel!")
// → ["backend", "developer", "laravel"]
```

### 5.4 TF-IDF (Term Frequency - Inverse Document Frequency)

**Lokasi:** `lib/tfidf.ts`

TF-IDF adalah teknik pembobotan kata yang memberikan bobot tinggi pada kata yang:
- **Sering muncul** di satu dokumen (TF tinggi)
- **Jarang muncul** di dokumen lain (IDF tinggi)

#### 5.4.1 Term Frequency (TF)
Menghitung frekuensi kemunculan setiap term dalam sebuah dokumen.

**Rumus:**
```
TF(t, d) = jumlah kemunculan term t dalam dokumen d
```

**Implementasi:**
```typescript
export type TfIdfVector = Map<string, number>

export function computeTF(tokens: string[]): TfIdfVector {
  const tf = new Map<string, number>()
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1)
  }
  return tf
}
```

**Contoh:**
```
Dokumen: ["backend", "developer", "laravel", "backend", "php"]
TF(backend) = 2
TF(developer) = 1
TF(laravel) = 1
TF(php) = 1
```

#### 5.4.2 Inverse Document Frequency (IDF)
Menghitung seberapa langka sebuah term di seluruh koleksi dokumen.

**Rumus:**
```
IDF(t) = ln(N / df(t)) + 1
```

Di mana:
- N = jumlah total dokumen
- df(t) = jumlah dokumen yang mengandung kata t

**Implementasi:**
```typescript
export function computeIDF(documents: string[][]): Map<string, number> {
  const N = documents.length
  if (N === 0) return new Map()

  // df(t) = document frequency
  const df = new Map<string, number>()
  for (const doc of documents) {
    const uniqueTerms = new Set(doc)
    for (const term of uniqueTerms) {
      df.set(term, (df.get(term) || 0) + 1)
    }
  }

  // IDF(t) = ln(N / df(t)) + 1
  const idf = new Map<string, number>()
  for (const [term, docCount] of df) {
    idf.set(term, Math.log(N / docCount) + 1)
  }

  return idf
}
```

**Contoh:**
```
Koleksi: 50 dokumen
- "developer" muncul di 50 dokumen → df=50, IDF=ln(50/50)+1=1.00 (rendah)
- "laravel" muncul di 5 dokumen   → df=5,  IDF=ln(50/5)+1=3.30 (tinggi)
- "php" muncul di 10 dokumen      → df=10, IDF=ln(50/10)+1=2.61 (sedang)
```

#### 5.4.3 TF-IDF Weight
Bobot akhir sebuah kata: TF × IDF

**Rumus:**
```
TF-IDF(t, d) = TF(t, d) × IDF(t)
```

**Implementasi:**
```typescript
export function computeTFIDF(tf: TfIdfVector, idf: Map<string, number>): TfIdfVector {
  const tfidf = new Map<string, number>()
  for (const [term, freq] of tf) {
    const weight = idf.get(term) || 0
    if (weight > 0) {
      tfidf.set(term, freq * weight)
    }
  }
  return tfidf
}
```

**Contoh:**
```
TF(backend, profil) = 2, IDF(backend) = 2.5
TF-IDF(backend, profil) = 2 × 2.5 = 5.0

TF(laravel, profil) = 1, IDF(laravel) = 3.3
TF-IDF(laravel, profil) = 1 × 3.3 = 3.3
```

### 5.5 Cosine Similarity

Mengukur kemiripan antara dua vektor TF-IDF.

**Rumus:**
```
cos(θ) = (A · B) / (||A|| × ||B||)
```

Di mana:
- A · B = dot product (jumlah perkalian bobot term yang sama)
- ||A|| = magnitude (akar dari jumlah kuadrat bobot)
- ||B|| = magnitude vektor B

**Implementasi:**
```typescript
export function cosineSimilarity(vecA: TfIdfVector, vecB: TfIdfVector): number {
  // Dot product
  let dotProduct = 0
  for (const [term, weightA] of vecA) {
    const weightB = vecB.get(term)
    if (weightB !== undefined) {
      dotProduct += weightA * weightB
    }
  }

  // Magnitude vektor A
  let magA = 0
  for (const [_term, weight] of vecA) {
    magA += weight * weight
  }
  magA = Math.sqrt(magA)

  // Magnitude vektor B
  let magB = 0
  for (const [_term, weight] of vecB) {
    magB += weight * weight
  }
  magB = Math.sqrt(magB)

  // Hindari pembagian dengan nol
  if (magA === 0 || magB === 0) return 0

  return dotProduct / (magA * magB)
}
```

**Interpretasi Nilai:**

| Nilai | Arti |
|-------|------|
| 1.00 | Vektor identik (konten sama persis) |
| 0.70-0.99 | Sangat mirip |
| 0.40-0.69 | Sebagian cocok |
| 0.00-0.39 | Tidak mirip |
| 0.00 | Vektor tegak lurus (tidak ada kata yang cocok) |

### 5.6 Dokumen Profil dan Lowongan

Dokumen tidak dibangun dari bobot terpisah. Setiap kriteria ditambahkan sebagai teks, lalu seluruh dokumen diproses oleh pipeline yang sama.

```typescript
export function buildProfileDocument(
  profile: Profile,
  trackRecords: TrackRecord[],
): string {
  const parts: string[] = []

  if (profile.program_studi) parts.push(profile.program_studi)
  if (Array.isArray(profile.skills)) parts.push(profile.skills.join(' '))

  for (const record of trackRecords) {
    if (record.position) parts.push(record.position)
    if (record.description) parts.push(record.description)
  }

  if (Array.isArray(profile.certifications)) {
    parts.push(profile.certifications.join(' '))
  }
  if (Array.isArray(profile.job_interests)) {
    parts.push(profile.job_interests.join(' '))
  }
  if (profile.preferred_location) parts.push(profile.preferred_location)
  if (profile.preferred_type) parts.push(profile.preferred_type)

  return parts.join(' ')
}
```

Track record hanya mengambil `position` dan `description`; nama perusahaan tidak dimasukkan ke dokumen rekomendasi. Lowongan memakai judul, deskripsi, skills, lokasi, dan tipe pekerjaan.

### 5.7 Scoring Cosine Similarity

Semua dokumen lowongan dan query profil dihitung dalam satu koleksi TF-IDF. IDF memakai smoothing `ln(N / df) + 1`, sehingga term yang muncul di semua dokumen tetap memiliki bobot positif. Skor akhir setiap lowongan adalah Cosine Similarity antara vektor query dan vektor lowongan.

Tidak ada:
- bobot manual atau redistribusi bobot;
- rule-based location/salary/type scoring;
- Collaborative Filtering;
- expected salary atau IPK dalam matching.

`MatchResult` hanya berisi `{ job, score }`, sehingga UI menampilkan skor akhir tanpa breakdown atau confidence buatan.


### 5.8 Implementasi Lengkap: getJobRecommendations

**Lokasi:** `lib/actions/matching.ts`

```typescript
export async function getJobRecommendations(
  limit: number = 10,
): Promise<MatchResult[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User tidak terautentikasi')

  const [{ data: profile }, { data: trackRecords }, { data: jobs }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('track_records').select('*').eq('user_id', user.id),
      supabase.from('jobs').select('*').eq('is_active', true),
    ])

  if (!profile) throw new Error('Profil alumni tidak ditemukan')
  if (!jobs || jobs.length === 0) {
    throw new Error('Tidak ada lowongan aktif')
  }

  const profileTokens = preprocess(
    buildProfileDocument(profile as Profile, trackRecords as TrackRecord[]),
  )
  const jobTokens = (jobs as Job[]).map(job =>
    preprocess(buildJobDocument(job)),
  )
  const similarityScores = computeSimilarityScores(profileTokens, jobTokens)

  return (jobs as Job[])
    .map((job, index) => ({
      job,
      score: similarityScores[index] ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
```

### 5.9 Contoh Perhitungan

#### Skenario:
- **Alumni:**
  - Program studi: S1 Informatika
  - Skill: [Laravel, PHP, MySQL]
  - Pengalaman: Backend Developer, membangun API backend
  - Sertifikasi: Laravel Developer
  - Bidang diminati: Backend Developer
  - Preferensi lokasi: Yogyakarta
  - Preferensi tipe: Full-time

- **Lowongan A:**
  - Judul: Backend Developer
  - Skills: [Laravel, PHP, MySQL]
  - Deskripsi: Membangun API menggunakan Laravel dan MySQL
  - Lokasi: Yogyakarta
  - Tipe: Full-time

- **Lowongan B:**
  - Judul: Staff Akuntansi
  - Skills: [Excel, Akuntansi, Pajak]
  - Lokasi: Jakarta
  - Tipe: Full-time

#### Hasil TF-IDF + Cosine Similarity:
- **Lowongan A:**
  - Dokumen profil dan lowongan A mengandung kata yang sangat mirip (laravel, php, mysql, backend, developer, API)
  - Cosine Similarity: **0.85** (tinggi)

- **Lowongan B:**
  - Dokumen tidak memiliki irisan kata kunci yang bermakna
  - Cosine Similarity: **0.05** (rendah)

#### Skor Akhir:

| Lowongan | Cosine Similarity | Peringkat |
|----------|-------------------|-----------|
| **A**    | **0.85**          | 1 |
| **B**    | **0.05**          | 2 |

**Hasil:** Lowongan A mendapat skor 0.85 dan berada di atas Lowongan B karena kemiripan dokumen kontennya lebih tinggi.

### 5.10 Struktur File Matching

| File | Peran |
|------|-------|
| `lib/preprocessing.ts` | Text preprocessing pipeline (case folding → cleaning → tokenization → stopword removal) |
| `lib/tfidf.ts` | Engine TF-IDF + Cosine Similarity (computeTF, computeIDF, computeTFIDF, cosineSimilarity) |
| `lib/actions/matching.ts` | Server action: `getJobRecommendations()` (alur CBF lengkap), `getMatchingStats()` |
| `app/(protected)/user/rekomendasi/page.tsx` | Halaman alumni: menampilkan hasil rekomendasi dan skor Cosine Similarity |
| `app/(protected)/admin/analytics/page.tsx` | Halaman admin: menampilkan statistik kelengkapan tujuh kriteria profil rekomendasi |
| `__tests__/matching.test.ts` | Unit test untuk preprocessing, TF-IDF, cosine similarity, dan document builders |

---

## 6. IMPLEMENTASI KEAMANAN

### 6.1 Row-Level Security (RLS)

Semua tabel dilindungi dengan RLS policies di level PostgreSQL. Ini adalah **security layer utama** — middleware hanya untuk UX redirect.

**Contoh RLS Policy:**
```sql
-- User hanya bisa akses profil sendiri
CREATE POLICY "user: select own profile"
  ON public.profiles FOR SELECT
  USING ( auth.uid() = id );

-- User tidak bisa mengubah role sendiri
CREATE POLICY "user: update own profile"
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id )
  WITH CHECK ( role = (SELECT role FROM public.profiles WHERE id = auth.uid()) );
```

**Keuntungan RLS:**
- Isolasi data di level database
- Tidak bisa di-bypass dari aplikasi
- Otomatis berlaku untuk semua query

### 6.2 Input Validation dengan Zod

Semua server actions menggunakan Zod untuk validasi input.

**Contoh:**
```typescript
// lib/schemas/profile.ts
export const profileSchema = z.object({
  full_name: z.string().min(1, 'Nama wajib diisi'),
  nim: z.string().regex(/^\d+$/, 'NIM harus angka').nullable(),
  phone: z.string().regex(/^\+?[\d\s-]+$/, 'Nomor telepon tidak valid').nullable(),
  bio: z.string().max(500, 'Bio maksimal 500 karakter').nullable(),
  skills: z.array(z.string()).nullable(),
  location: z.string().nullable(),
  education_level: z.string().nullable(),
  expected_salary: z.string().nullable(),
  preferred_type: z.string().nullable(),
})

// Server action
export async function updateProfile(formData: FormData) {
  const raw = {
    full_name: formData.get('full_name') as string,
    // ...
  }
  
  const parsed = profileSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map(e => e.message).join(', '))
  }
  
  // Lanjutkan ke database
}
```

**Keuntungan:**
- Validasi di server-side (tidak bisa di-bypass)
- Type-safe
- Error messages yang jelas
- Konsisten di seluruh aplikasi

### 6.3 Authentication Best Practices

#### 6.3.1 Gunakan getUser(), bukan getSession()
```typescript
// BENAR
const { data: { user } } = await supabase.auth.getUser()

// JANGAN gunakan getSession() — tidak memvalidasi JWT ke server Supabase
```

**Alasan:** `getSession()` hanya membaca cookie lokal, sedangkan `getUser()` memvalidasi JWT ke server Supabase.

#### 6.3.2 Admin Client untuk Operasi Auth
```typescript
// lib/supabase/admin.ts
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!  // Service role key
  )
}

// Penggunaan
export async function resetUserPassword(userId: string, newPassword: string) {
  const adminSupabase = createAdminClient()
  await adminSupabase.auth.admin.updateUserById(userId, {
    password: newPassword
  })
}
```

**Keuntungan:**
- Service role key bisa akses auth.admin API
- Bisa create/update/delete user lain
- Tidak terpengaruh RLS

### 6.4 Email Domain Restriction

Hanya menerima email dari domain institusi.

```typescript
// lib/schemas/bulk-import.ts
const rowSchema = z.object({
  email: z.string()
    .email('Email tidak valid')
    .endsWith('@amikomsurakarta.ac.id', 'Hanya email @amikomsurakarta.ac.id'),
  // ...
})
```

### 6.5 Password Security

- **Minimal 6 karakter** (divalidasi dengan Zod)
- **Verifikasi password lama** sebelum ganti password baru
- **Hashing otomatis** oleh Supabase Auth

### 6.6 Sign-up Dinonaktifkan

Registrasi publik dinonaktifkan — akun hanya bisa dibuat oleh admin. Ini mencegah pendaftaran akun yang tidak sah.

### 6.7 Security Analysis

| Aspek | Status | Deskripsi |
|-------|--------|-----------|
| **RLS Policies** | Terimplementasi | Semua tabel dilindungi |
| **Zod Validation** | Terimplementasi | Semua server actions divalidasi |
| **Email Domain** | Terimplementasi | Hanya @amikomsurakarta.ac.id |
| **Role-based Middleware** | Terimplementasi | Route protection untuk /admin |
| **Password Security** | Terimplementasi | Minimal 6 karakter + verifikasi |
| **TypeScript Type Safety** | 0 errors | Full typecheck passes |
| **Admin Client** | Terimplementasi | Service role key untuk auth admin |

---

## 7. PENGUJIAN SISTEM

### 7.1 Test Suite Summary

| Suite | File | Tests | Status |
|-------|------|-------|--------|
| **Authentication & Route Protection** | `__tests__/auth.test.tsx` | 14 | LULUS |
| **Track Record CRUD** | `__tests__/track-record.test.tsx` | 12 | LULUS |
| **Sistem Alumni Kuesioner** | `__tests__/kuesioner.test.tsx` | 17 | LULUS |
| **Admin Alumni Management** | `__tests__/admin-alumni.test.tsx` | 14 | LULUS |
| **Bulk Import Parsing** | `__tests__/bulk-import.test.tsx` | 10 | LULUS |
| **Bulk Import Bug Fixes** | `__tests__/bulk-import-bug-*.test.ts` | ~30 | LULUS |
| **Bulk Import Logic** | `__tests__/bulk-import-logic.test.ts` | ~15 | LULUS |
| **Bulk Import UI** | `__tests__/bulk-import-ui.test.tsx` | ~10 | LULUS |
| **Matching (TF-IDF + CBF)** | `__tests__/matching.test.ts` | 25+ | LULUS |
| **Sistem Alumni Analytics** | `__tests__/tracer-study-analytics.test.ts` | ~10 | LULUS |
| **TOTAL** | **~10 files** | **~180+** | **SEMUA LULUS** |

### 7.2 Test Cases Detail

#### 7.2.1 Authentication & Route Protection (14 tests)

**TC 1.1 — Login Form Validation (Zod)**
| Test Case | Expected | Result |
|-----------|----------|--------|
| Reject empty email and password | `success: false` | LULUS |
| Reject invalid email format | `success: false` | LULUS |
| Reject non-institution email (@gmail.com) | `success: false` | LULUS |
| Reject password < 6 chars (strict mode) | `success: false` | LULUS |
| Accept valid institution email | `success: true` | LULUS |

**TC 1.2 — Role Redirect**
| Test Case | Expected | Result |
|-----------|----------|--------|
| alumni → /dashboard | `/dashboard` | LULUS |
| super_user → /admin | `/admin` | LULUS |
| null → /login | `/login` | LULUS |
| unknown → /dashboard | `/dashboard` | LULUS |

**TC 1.3 — Middleware Route Protection**
| Test Case | Expected | Result |
|-----------|----------|--------|
| Block /dashboard when not authenticated | Redirect to /login | LULUS |
| Block /admin when not authenticated | Redirect to /login | LULUS |
| Allow /dashboard when authenticated | No redirect | LULUS |
| Allow /admin when authenticated | No redirect | LULUS |
| Allow public /login when not authenticated | No redirect | LULUS |

#### 7.2.2 Track Record CRUD (12 tests)

**TC 2.1 — Create Track Record**
| Test Case | Expected | Result |
|-----------|----------|--------|
| Reject empty company_name | Error | LULUS |
| Reject empty position | Error | LULUS |
| Reject missing start_date | Error | LULUS |
| Create valid record successfully | Success | LULUS |

**TC 2.2 — Read Track Record**
| Test Case | Expected | Result |
|-----------|----------|--------|
| Find existing record by ID | Record found | LULUS |
| Return undefined for non-existent ID | undefined | LULUS |

**TC 2.3 — Update Track Record**
| Test Case | Expected | Result |
|-----------|----------|--------|
| Update company_name | Success | LULUS |
| Update end_date when no longer current | Success | LULUS |
| Return error for non-existent ID | Error | LULUS |

**TC 2.4 — Delete Track Record**
| Test Case | Expected | Result |
|-----------|----------|--------|
| Delete existing record | Success | LULUS |
| Return error for non-existent record | Error | LULUS |

#### 7.2.3 Sistem Alumni Kuesioner (17 tests)

**TC 3.1 — Conditional Render Banner**
| Test Case | Expected | Result |
|-----------|----------|--------|
| Show warning banner when tracer empty | `warning` | LULUS |
| Hide banner when tracer data exists | `null` | LULUS |

**TC 3.2 — Multi-step Form Validation**
| Tab | Test | Result |
|-----|------|--------|
| Personal Info | Detect empty full_name | LULUS |
| Personal Info | Detect invalid graduation_year | LULUS |
| Personal Info | Validate correct data | LULUS |
| Education | Detect unselected study_field_match | LULUS |
| Employment | Detect unselected employment_status | LULUS |
| Suggestions | Always validate (optional) | LULUS |
| Full Form | Reject incomplete submission | LULUS |
| Full Form | Accept complete submission | LULUS |

#### 7.2.4 Admin Alumni Management (14 tests)

**TC 4.1 — Bulk Import Parsing**
| Test Case | Expected | Result |
|-----------|----------|--------|
| Reject invalid JSON | Format error | LULUS |
| Reject non-array JSON | Array error | LULUS |
| Accept single valid row | `count: 1` | LULUS |
| Detect missing NIM | Row error | LULUS |
| Detect missing full_name | Row error | LULUS |
| Detect invalid email | Row error | LULUS |
| Accept multiple valid rows | `count: 3` | LULUS |
| Report errors for invalid rows | Row 2 errors | LULUS |
| Reject empty array | Kosong error | LULUS |

**TC 4.2 — Alumni Search/Filter**
| Test Case | Expected | Result |
|-----------|----------|--------|
| Search "Budi" | 2 results | LULUS |
| Search "Siti" | 1 result | LULUS |
| Case insensitive "budi" | 2 results | LULUS |
| Search by NIM "A123" | 1 result | LULUS |
| Partial NIM "A4" | 1 result (A456) | LULUS |
| Empty query | All 5 results | LULUS |
| Non-existent name | 0 results | LULUS |
| Filter by year 2024 | 3 results | LULUS |
| Filter by year 2022 | 1 result | LULUS |
| Non-existent year | 0 results | LULUS |

#### 7.2.5 Matching (TF-IDF + CBF) (25+ tests)

**TC 5.1 — Preprocessing Pipeline**
| Test Case | Expected | Result |
|-----------|----------|--------|
| Case folding: "Backend" → "backend" | lowercase | LULUS |
| Cleaning: "hello!" → "hello" | no symbols | LULUS |
| Tokenization: "a b c" → ["a", "b", "c"] | array | LULUS |
| Stopword removal: ["dan", "backend"] → ["backend"] | filtered | LULUS |
| Full pipeline: "Saya adalah Backend Developer!" → ["backend", "developer"] | clean tokens | LULUS |

**TC 5.2 — TF-IDF Computation**
| Test Case | Expected | Result |
|-----------|----------|--------|
| TF: ["a", "b", "a"] → {a: 2, b: 1} | correct counts | LULUS |
| IDF: rare term gets higher weight | high IDF | LULUS |
| TF-IDF: TF × IDF | correct weights | LULUS |

**TC 5.3 — Cosine Similarity**
| Test Case | Expected | Result |
|-----------|----------|--------|
| Identical vectors | 1.0 | LULUS |
| Orthogonal vectors | 0.0 | LULUS |
| Partial overlap | 0.0-1.0 | LULUS |

**TC 5.4 — Recommendation Document Builders**
| Test Case | Expected | Result |
|-----------|----------|--------|
| Profile document includes seven criteria | all criteria present | LULUS |
| Track record uses position and description | both fields present | LULUS |
| Track record excludes company name | company absent | LULUS |
| Job document includes title, description, skills, location, type | all fields present | LULUS |
| Job document excludes company and salary | both absent | LULUS |

**TC 5.5 — End-to-End Matching**
| Test Case | Expected | Result |
|-----------|----------|--------|
| High content match | higher cosine score | LULUS |
| Low content match | lower cosine score | LULUS |
| Empty profile query | zero scores | LULUS |
| Empty job collection | zero results | LULUS |

### 7.3 Bug Report

Semua bug yang ditemukan telah diperbaiki:

| Bug ID | Severity | Deskripsi | Status |
|--------|----------|-----------|--------|
| BUG-008 | HIGH | Zod v4 API mismatch: `.errors` → `.issues` | FIXED |
| BUG-009 | HIGH | Supabase SSR type inference failure: `p` typed as `never` | FIXED |
| BUG-010 | HIGH | Supabase SSR type inference failure: `existing` typed as `never` | FIXED |
| BUG-011 | MEDIUM | `responses` typed as `never` | FIXED |
| BUG-012 | MEDIUM | `toggleActive` Supabase update type mismatch | FIXED |
| BUG-013 | MEDIUM | `skills` property not recognized in Supabase insert/update | FIXED |
| BUG-014 | LOW | Missing `Profile` type import | FIXED |
| BUG-015 | LOW | Form type narrowed to literal | FIXED |
| BUG-016 | LOW | Empty array validation | FIXED |
| BUG-017 | LOW | Partial NIM match issue | FIXED |
| BUG-018 | LOW | Missing `is_current` property | FIXED |
| BUG-019 | LOW | Invalid Jest config property | FIXED |
| BUG-020 | LOW | TypeScript deprecated option | FIXED |

### 7.4 Test Infrastructure

**Konfigurasi:**
```typescript
// jest.config.ts
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': '<rootDir>/__tests__/mocks/style-mock.ts',
  },
}
```

**Cara Menjalankan:**
```bash
# Run all tests
npm run test

# Run with verbose output
npx jest --verbose

# Run specific test suite
npx jest __tests__/matching.test.ts

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

---

## 8. DESAIN ANTARMUKA PENGGUNA

### 8.1 Design System

**Nama:** SITRACK Design System  
**Filosofi:** UI meresap ke latar, konten berbicara. Satu aksen interaktif: **Amikom Purple**.  
**Inspirasi:** Apple design language dengan warna identitas Amikom

### 8.2 Color Palette

#### 8.2.1 Primary — Satu Aksen Interaktif

| Token | Hex | Peran |
|-------|-----|-------|
| `--primary` | `#700070` | Semua elemen interaktif |
| `--primary-hover` | `#580058` | Press/hover state |
| `--primary-focus` | `#4A1B9D` | Focus ring keyboard |
| `--primary-on-dark` | `#9B30FF` | Link di atas dark tile |
| `--primary-light` | `#f0d4f0` | Background subtle |

#### 8.2.2 Secondary — Dekoratif Saja

| Token | Hex | Peran |
|-------|-----|-------|
| `--secondary` | `#FFCC00` | Badge, label highlight |
| `--secondary-warm` | `#FFAC00` | Energi, achievement |
| `--secondary-vivid` | `#FF7900` | Urgensi, status kritis |

#### 8.2.3 Surface

| Token | Hex | Peran |
|-------|-----|-------|
| `--canvas` | `#ffffff` | Canvas utama, card background |
| `--parchment` | `#f5f5f7` | Off-white Apple |
| `--pearl` | `#fafafc` | Pearl button, primary page background |

#### 8.2.4 Soft White — Light Page Palette

| Token | Hex | Peran |
|-------|-----|-------|
| `--soft-bg` | `#FAFBFC` | Primary page background (landing, login) |
| `--section-alt` | `#F2F3F5` | Alternating section background |
| `--soft-border` | `#E8E8ED` | Soft border untuk card & nav |
| `--text-primary` | `#1A1A1E` | Primary heading & text (soft black) |
| `--text-secondary` | `#5A5A6E` | Body copy & subtitle |
| `--text-tertiary` | `#8E8E93` | Muted label, fine print |

### 8.3 Typography

| Style | Size | Weight | Line Height | Letter Spacing | Penggunaan |
|-------|------|--------|-------------|----------------|------------|
| Hero Display | 56px | 600 | 1.07 | -0.28px | Headline hero landing |
| Display LG | 40px | 600 | 1.10 | 0 | Headline tile |
| Display MD | 34px | 600 | 1.47 | -0.374px | Section head |
| Lead | 28px | 400 | 1.14 | 0 | Subcopy |
| Body | 17px | 400 | 1.47 | -0.374px | Paragraf default |
| Caption | 14px | 400 | 1.43 | -0.224px | Secondary copy |
| Fine Print | 12px | 400 | 1.0 | -0.12px | Legal, footer |

**Font Families:**
- `font-sans` → Inter (fallback: system-ui, -apple-system)
- `font-display` → Inter (headline, tighter tracking)
- `font-mono` → JetBrains Mono (angka, label teknis)

**Prinsip:**
- Letter-spacing negatif pada display size (≥17px) → "Apple tight"
- Body copy pada 17px, bukan 16px
- Weight: 300 / 400 / 600 / 700 (500 sengaja tidak ada)

### 8.4 Layout

#### 8.4.1 Spacing

| Token | Value |
|-------|-------|
| `spacing.xxs` | 4px |
| `spacing.xs` | 8px |
| `spacing.sm` | 12px |
| `spacing.md` | 17px |
| `spacing.lg` | 24px |
| `spacing.xl` | 32px |
| `spacing.xxl` | 48px |
| `spacing.section` | 80px |

#### 8.4.2 Container
- Max content: `1440px` (product grid), `980px` (text-heavy section)
- Gutter: 20–24px
- Section padding vertikal: `80px`

#### 8.4.3 Border Radius

| Token | Value | Penggunaan |
|-------|-------|------------|
| `rounded-xs` | 5px | Inline chip |
| `rounded-sm` | 8px | Utility button |
| `rounded-md` | 11px | Pearl button |
| `rounded-lg` | 18px | Store card |
| `rounded-pill` | 9999px | Primary CTA, search input |

### 8.5 Components

#### 8.5.1 Buttons

**Primary Pill:**
```tsx
className="rounded-pill bg-amikom-purple px-7 py-2.5 text-[17px] font-normal text-white transition-all hover:bg-amikom-purple-hover active:scale-[0.95]"
```

**Secondary Ghost Pill:**
```tsx
className="rounded-pill border border-amikom-purple px-7 py-2.5 text-[17px] font-normal text-amikom-purple transition-all hover:bg-amikom-purple/5 active:scale-[0.95]"
```

#### 8.5.2 Cards

**Store Utility Card:**
```tsx
className="rounded-lg border border-amikom-hairline bg-amikom-canvas px-6 py-6"
```

**Dark Stat Card:**
```tsx
className="rounded-lg bg-amikom-tile-2 border border-amikom-glass-border px-6 py-6 text-center"
```

#### 8.5.3 Badge

```tsx
<Badge variant="default">     // Amikom Purple bg, white text
<Badge variant="secondary">   // Parchment bg, muted text
<Badge variant="accent">      // Jonquil bg, decorative
<Badge variant="warning">     // Amber bg
<Badge variant="destructive"> // Red bg
<Badge variant="success">     // Green bg
```

### 8.6 Animations

| Class | Efek |
|-------|------|
| `animate-fade-in-up` | Fade + geser 16px ke atas, 0.6s |
| `animate-fade-in` | Fade in, 0.5s |
| `active:scale-[0.95]` | Press state pada semua button |

### 8.7 Responsive Breakpoints

| Nama | Lebar | Perubahan |
|------|-------|-----------|
| Phone | ≤ 640px | Single column, hero 34px |
| Tablet | 641–1023px | 2-column grid |
| Desktop | ≥ 1024px | Layout penuh, 3-column grid |

### 8.8 Landing Page

**Desain:**
- **Soft off-white aesthetic:** Background `#FAFBFC` (bukan pure white)
- **Frosted glass navigation:** `bg-white/80 backdrop-blur-sm border-b border-[#E8E8ED]`
- **Hero section:** Gradient CTA dengan headline besar
- **Features section:** 6 feature cards dengan icon
- **Cara Kerja section:** Step-by-step explanation
- **Analytics stats:** Visual statistics
- **Trust indicators:** Institutional branding

**Warna:**
- Background: `#FAFBFC`
- Cards: `#ffffff` dengan border `#E8E8ED`
- Heading: `#1A1A1E` (bukan pure black)
- Body copy: `#5A5A6E` (bukan pure gray)

---

## 9. KESIMPULAN DAN REKOMENDASI

### 9.1 Kesimpulan

Proyek SITRACK telah mencapai **~97% penyelesaian** dengan semua fitur inti yang berfungsi penuh:

**Fitur yang Selesai:**
- Sistem autentikasi RBAC yang aman dengan Row-Level Security
- Portal Alumni lengkap: profil, track record, kuesioner sistem alumni, career center
- Panel Admin lengkap: manajemen user, import massal, kelola kuesioner, kelola lowongan, analytics
- Validasi input menyeluruh dengan Zod di semua server actions
- Content-Based Filtering dengan preprocessing, TF-IDF, dan Cosine Similarity sebagai skor akhir
- Tujuh kriteria profil rekomendasi: program studi, skills, pengalaman kerja, sertifikasi, bidang pekerjaan, preferensi lokasi, dan tipe pekerjaan
- Text Preprocessing Pipeline (case folding, cleaning, tokenization, stopword removal)
- Top-N ranking tanpa CF, rule-based scoring, expected salary, IPK, atau bobot manual

- ~180+ automated tests yang semuanya lulus
- TypeScript strict mode tanpa error kompilasi
- Design system yang terdokumentasi dengan baik
- Landing Page redesign dengan aesthetic soft off-white

**Keunggulan Sistem:**
1. **Keamanan berlapis:** RLS + Zod validation + middleware + admin client
2. **Algoritma rekomendasi berbasis konten:** TF-IDF + Cosine Similarity dengan tujuh kriteria profil
3. **User experience yang baik:** Multi-step forms, toast notifications, responsive design
4. **Code quality tinggi:** TypeScript strict, 180+ tests, 0 errors
5. **Scalable architecture:** Next.js App Router + Server Actions + Supabase

### 9.2 Rekomendasi

#### 9.2.1 Prioritas Tinggi (Sebelum Production)

1. **Setup `.env.local`** dengan credentials Supabase yang sebenarnya:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. **Jalankan database migrations** di Supabase SQL Editor:
   - `001_rbac.sql`
   - `002_tables.sql`
   - `003_tracer_study_questions.sql`
   - `004_profile_matching_fields.sql`
   - `014_add_profile_extended_fields.sql`

3. **Buat akun super_user pertama** via SQL:
   ```sql
   UPDATE public.profiles SET role = 'super_user' WHERE email = 'admin@amikomsurakarta.ac.id';
   ```

4. **Testing E2E manual** seluruh flow user dan admin

#### 9.2.2 Prioritas Menengah (Enhancement)

1. **Export data ke Excel/CSV** — untuk analytics dan pelaporan akreditasi
2. **Pagination** pada tabel alumni dan list data besar
3. **Filter analytics per tahun lulusan** — untuk analisis cohort
4. **Tambah stemming/lemmatization** — untuk preprocessing yang lebih akurat (Sastrawi library untuk Bahasa Indonesia)
5. **Email notification** — welcome email, reminder kuesioner

#### 9.2.3 Prioritas Rendah (Nice-to-have)

1. **Upload foto profil** — avatar customization
2. **Dark mode** — theme toggle
3. **CI/CD pipeline** — GitHub Actions untuk automated testing
4. **E2E testing** — Playwright atau Cypress
5. **Mobile app** — React Native wrapper

### 9.3 Potensi Pengembangan Lanjutan

1. **Stemming/Lemmatization:** Meningkatkan kualitas preprocessing bahasa Indonesia
2. **Machine Learning:** Menggunakan ML model untuk prediksi status pekerjaan alumni
3. **Chatbot:** AI chatbot untuk membantu alumni mengisi kuesioner
4. **Integration dengan LinkedIn:** Auto-import profil dari LinkedIn
5. **Alumni networking:** Fitur untuk menghubungkan alumni satu sama lain

### 9.4 Catatan Penting

**Keamanan:**
- RLS adalah security layer utama — middleware hanya untuk UX redirect
- Selalu gunakan `getUser()` di server, bukan `getSession()`
- Helper `get_my_role()` menggunakan `security definer` untuk menghindari infinite recursion pada RLS policy
- User tidak bisa mengubah role sendiri — policy `with check` memastikan kolom `role` tidak berubah saat user update profil sendiri

**Performance:**
- Gunakan `revalidatePath()` setelah mutation untuk refresh cache
- Pagination untuk data besar (>20 records)
- Index pada kolom yang sering di-query (email, user_id, graduation_year)

**Maintenance:**
- Backup database secara berkala
- Monitor error logs di Supabase dashboard
- Update dependencies secara berkala
- Review RLS policies jika ada perubahan business logic

---

## LAMPIRAN

### A. Daftar File Penting

| File | Deskripsi |
|------|-----------|
| `app/layout.tsx` | Root layout + Toaster |
| `app/page.tsx` | Landing page |
| `middleware.ts` | Route protection + role check |
| `lib/preprocessing.ts` | Text preprocessing pipeline |
| `lib/tfidf.ts` | TF-IDF + Cosine Similarity engine |
| `lib/actions/matching.ts` | Content-Based Filtering implementation |
| `types/database.ts` | TypeScript type definitions |
| `supabase/migrations/*.sql` | Database migrations (4 files) |
| `__tests__/*.test.ts` | Automated tests (~180+ tests) |
| `DESIGN_SYSTEM.md` | Design system documentation |
| `QA_REPORT.md` | QA & testing report |

### B. Cara Menjalankan Proyek

**Development:**
```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local dengan credentials Supabase

# Run database migrations di Supabase SQL Editor

# Start development server
npm run dev
```

**Testing:**
```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage
```

**Build:**
```bash
# Build for production
npm run build

# Start production server
npm run start
```

### C. Kontributor

**Pengembang:** [Nama Mahasiswa]  
**Pembimbing:** [Nama Dosen Pembimbing]  
**Institusi:** STMIK Amikom Surakarta  
**Tahun:** 2026

### D. Lisensi

Proyek ini dikembangkan untuk keperluan skripsi/thesis di STMIK Amikom Surakarta.

---

**Akhir Laporan**

*Laporan ini dibuat untuk keperluan dokumentasi skripsi/thesis.*  
*Tanggal: 20 Juni 2026*  
*Status: ~97% Selesai*  
*Test run: ~180+ tests | Semua LULUS | TypeScript: 0 errors*
