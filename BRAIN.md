# BRAIN.md — SITRACK AI Context

> Update: 11 September 2026 — Revisi template kuesioner admin (3 bagian, 62 pertanyaan, checkbox & scale, conditional logic)

---

## I. CURRENT STATE (Codebase Snapshot)

**Framework:** Next.js 14+ App Router, shadcn/ui, Tailwind CSS, Supabase
**Fonts:** Geist (sans/display) + Geist Mono (mono) — ganti dari Work Sans + DM Mono (via `geist/font` package)
**Design Tokens:** `amikom-*` di `tailwind.config.ts` — jangan hardcoded hex
**Bahasa UI:** Indonesia (semua halaman), kecuali label teknis tertentu

### Canonical Pages (redirect tujuan)
| Fungsi | Canonical | Redirect Dari |
|---|---|---|
| Profile | `/dashboard/profile` | `/user/profile` |
| Add user | `/admin/add-user` | `/super-user/add-user` |

### Route Structure
```
/                              → Landing (Server Component)
/login                         → Server + Client Form Island (login-form.tsx)
/dashboard/*                   → Protected (Sidebar + Main + Toaster)
  /dashboard                   → Dashboard (PageHeader + Quick Actions + Account Info)
  /dashboard/track-record      → Riwayat Kerja — CRUD + Pagination + AlertDialog (sidebar: hidden, akses via Profil)
  /dashboard/profile           → Profil (form + password + completeness + Riwayat Kerja card)
  /dashboard/tracer-study      → Tracer Study — Multi-step form + submitted view
  /dashboard/career            → Lowongan Kerja — JobList + Rekomendasi Kerja banner
  /dashboard/network           → Jaringan Alumni — networking cards + modal detail
/admin/*                       → Protected
  /admin                       → Dashboard Admin — 5-row data-driven (Server Component)
  /admin/alumni                → Manajemen Alumni — CRUD + Modal + AlertDialog
  /admin/add-user              → Tambahkan Alumni — AddUserForm + Server Component
  /admin/bulk-import           → Import CSV — CSV Upload (sub of Manajemen Alumni)
  /admin/kuesioner             → Tracer Study — CRUD + Export Excel + AlertDialog
  /admin/analytics             → Analitik — Charts + Filter Tahun (link di Dashboard)
  /admin/career-center         → Lowongan Kerja — CRUD + AlertDialog (di Manajemen Konten)
  /admin/content/*             → Manajemen Konten — Berita, Sertifikasi, FAQ
/super-user/*
  /super-user/users            → PageHeader + DataTable
/user/*
  /user/rekomendasi            → Rekomendasi Kerja — PageHeader + Match Results (link dari career)
  /user/profile                → Redirect ke /dashboard/profile
  /user/lowongan               → JobList component
```

---

## II. ACTIVE DECISIONS (Must Follow)

1. **Satu aksen interaktif:** `amikom-purple (#700070)` — semua button/link. Jonquil hanya dekorasi.
2. **Teks:** heading `text-amikom-ink`, body `text-amikom-ink-muted-48`, jangan `#000000` atau `text-black`
3. **Background:** landing/login `bg-amikom-pearl`, card `bg-amikom-canvas`, jangan full-page `#ffffff`
4. **Label:** `font-mono text-[11px] uppercase tracking-wider` — `text-[10px]` hanya untuk table header & badge
5. **Header halaman:** WAJIB pakai `<PageHeader>`, jangan manual
6. **Delete confirmation:** WAJIB `<AlertDialog>`, jangan `confirm()` native
7. **Delete toast:** WAJIB `toast.promise()`, jangan `try/catch` + `toast.success()`
8. **Redirect:** Halaman deprecated → `redirect('/canonical')` di Server Component
9. **Interaktif non-button:** WAJIB `role="button"` + `tabIndex={0}` + `onKeyDown` handler
10. **Aksesibilitas:** Skip-to-content link (#main-content), aria-label pada semua interactive control
11. **Rekomendasi lowongan:** Content-Based Filtering murni dengan preprocessing, TF-IDF, dan Cosine Similarity; tanpa Collaborative Filtering, rule-based salary/location/type scoring, IPK, expected salary, atau bobot manual.
12. **Kriteria rekomendasi:** program_studi, skills, track_records.position + track_records.description, certifications, job_interests, preferred_location, dan preferred_type.
13. **Lokasi profil:** `location` tetap domisili; `preferred_location` adalah preferensi kerja. `education_level` dipertahankan untuk legacy/Tracer Study, sedangkan `program_studi` menjadi kriteria rekomendasi.
14. **Netlify Build & Deploy Safety:** Setiap agent WAJIB menjalankan pre-flight verification (`npx tsc --noEmit`, `npx next lint`, `npm run build`) sebelum menyelesaikan task. Jangan commit file `.env` / API secrets, jangan tinggalkan temporary scripts di root, dan pastikan seluruh public domain/images terdaftar di config.
15. **Role matrix dikunci untuk super_user:** `/admin/roles` tidak mengizinkan edit permission `super_user` (server `updateRolePermissions` juga menolak) — cegah admin mengunci dirinya sendiri. Role lain (user/custom) bebas di-toggle.

---

## III. COMPONENT & PATTERN REFERENCE

### PageHeader
```tsx
<PageHeader icon={<span className="text-[11px]">◆</span>} label="Label" title="Judul." subtitle="Deskripsi." action={<button>+ Tambah</button>} />
```

### AlertDialog (Delete)
```tsx
const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
<AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
  <AlertDialogHeader><AlertDialogTitle>Hapus?</AlertDialogTitle><AlertDialogDescription>Tindakan tidak dapat dibatalkan.</AlertDialogDescription></AlertDialogHeader>
  <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600">Hapus</AlertDialogAction></AlertDialogFooter>
</AlertDialog>
```

### Delete with Toast Promise
```tsx
const promise = deleteItem(id)
toast.promise(promise, { loading: 'Menghapus...', success: () => { loadItems(); return 'Berhasil' }, error: (err) => err.message })
```

### Interactive Card
```tsx
<div role="button" tabIndex={0} onKeyDown={(e) => { if (e.key==='Enter'||e.key===' ') { e.preventDefault(); handleClick() }}} onClick={handleClick} className="... cursor-pointer">
```

### Quick Link Card
```tsx
<Link href="..." className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-sm hover:-translate-y-0.5 block">
  <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Label</p>
  <h3 className="font-sans text-lg font-semibold text-slate-900 mt-2">Judul</h3>
  <p className="text-sm text-slate-600 mt-1">Deskripsi.</p>
</Link>
```

### Data Fetching — `useCallback` + `useEffect`
```tsx
const loadRecords = useCallback(async () => {
  // gunakan state setters + variables dari closure
}, [currentPage])

useEffect(() => { loadRecords() }, [loadRecords])
```
- Fungsi data fetching dibungkus `useCallback` agar referensi stabil dan bisa dimasukkan ke dependency array `useEffect`
- Hindari `async` function langsung di `useEffect`; gunakan pola di atas

### Recommendation Document Builders
```ts
buildProfileDocument(profile, trackRecords)
buildJobDocument(job)
```
- Kedua fungsi adalah **helper murni sinkron** di `lib/recommendation-docs.ts` (tanpa `'use server'`). JANGAN definisikan fungsi sync export di file berlabel `'use server'` — Next.js build error "Server actions must be async functions".
- Profile memakai tujuh kriteria rekomendasi; track record hanya mengambil `position` dan `description`.
- Job memakai `title`, `description`, `skills`, `location`, dan `type`.
- Kedua dokumen masuk preprocessing → TF-IDF → Cosine Similarity; `MatchResult` hanya menyimpan `{ job, score }`.

### Kuesioner Conditional Logic (Tracer Study)
```ts
getQuestionSection(q)        // display_order <100 → identitas, ≤599 → wajib, else → opsional
isRequiredQuestion(q)        // display_order <600 → wajib diisi
isQuestionVisible(q, questions, answers) // status (order 100) + sub-branch "Ya/Tidak"/"Lainnya"
```
- Pertanyaan di-group & difilter via `sections.reduce()` saat render sehingga percabangan reaktif terhadap jawaban.
- Tipe jawaban baru: `checkbox` (multi-pilih, disimpan comma-separated) & `scale` (skala 1–5 simpan label penuh, mis. `4 = Baik`).
- Validasi wajib di `handleSubmit`: hanya pertanyaan yang terlihat + required yang dicek.
- ⚠️ Tipe `scale` harus sinkron dengan CHECK constraint DB `tracer_study_questions_question_type_check` (migration 015). Jika template insert gagal, cek constraint ini dulu.

### Server Action Permission Guard (Spatie-style hybrid, phase 1)
```ts
import { requirePermission } from '@/lib/permissions/guards'
import { PERMISSIONS } from '@/lib/permissions'

export async function someAdminAction() {
  const { supabase, user } = await requirePermission(PERMISSIONS.ALUMNI_MANAGE)
  // ...
}
```
- Definisi permission di kode: `lib/permissions/index.ts` (type-safe, `PERMISSIONS` const).
- Mapping role→permission di DB: tabel `permissions` + `role_permissions` (migration 017), di-cache 5 menit tag `'permissions'` via `can()` di `lib/permissions/can.ts`; fallback statis `ROLE_PERMISSIONS` jika tabel belum ada (deploy aman sebelum migration di-apply).
- `requirePermission`: tanpa session → `redirect('/login')`; tanpa permission → `throw Error('Forbidden')`. Ganti inline `role !== 'super_user'` dan duplikasi `checkAdminRole()`.
- `withAuth()` tetap untuk action milik user sendiri (profile, track-record, tracer-study) — cukup cek login.

### Dynamic Roles (phase 3, migration 019)
```ts
// Tabel roles generik (name, description, is_locked) — profiles.role & role_permissions.role = text FK → roles(name)
await createRole('humas_staff', 'Pengelola konten')   // guard role.manage, tanpa permission sampai di-centang
await setUserRole(userId, 'humas_staff')              // tolak ubah role sendiri; jaga ≥1 super_user
await deleteRole('humas_staff')                       // tolak LOCKED_ROLES (super_user/user) & role yang masih dipakai
```
- `RoleGuard` mendukung `allowedRoles` (role-based) DAN/OR `requiredActions` (permission-based via `can()`); tanpa kriteria = cukup punya profile.
- `/admin/layout` = `requiredActions={ADMIN_ACTIONS}`; `/super-user` tetap `allowedRoles=['super_user']`; middleware `/admin` cukup auth (gate pindah ke RoleGuard).
- `addUser(..., role)`: role selain `user` wajib `role.manage` (anti privilege-escalation). Dropdown add-user = hardcoded `super_user`/`user` + role custom dari tabel.
- RLS profiles select/update/delete-all kini berbasis `has_permission('alumni.manage')`; WITH CHECK update: role≠`user` wajib `role.manage`.
- Label tampilan: `roleLabel()` di `lib/permissions` (super_user→Super User, user→User, custom→nama asli).
- Menambah role baru di produksi: buat via `/admin/roles` → centang permission → tugaskan via `/admin/alumni` (Ubah Role) atau dropdown add-user. Tidak perlu ubah kode/konstanta.

### Seamless Infinite Marquee (Wisuda Gallery)
```tsx
<div className="wisuda-marquee-wrapper">
  <div className="wisuda-marquee-track">{items}</div>
  <div className="wisuda-marquee-track" aria-hidden="true">{items}</div>
</div>
```
- Dual-track pattern dengan animasi CSS `translate3d(calc(-100% - var(--marquee-gap)), 0, 0)`.
- Menggunakan `aria-hidden="true"` pada track kedua agar ramah aksesibilitas.
- Pause otomatis saat di-hover (`:hover .wisuda-marquee-track { animation-play-state: paused }`).
- Dikecualikan dari reset `prefers-reduced-motion` global agar galeri foto tetap berjalan mulus di semua perangkat.

### CSS Tokens (ganti hardcoded hex)
| Hex | Token |
|---|---|
| `#FAFBFC` | `bg-amikom-pearl` |
| `#1A1A1E` | `text-amikom-ink` |
| `#5A5A6E` | `text-amikom-ink-muted-48` |
| `#E8E8ED` | `border-amikom-hairline` |
| `#f0f0f0` | `border-amikom-divider-soft` |
| `#700070` | `bg-amikom-purple` |
| `#580058` | `bg-amikom-purple-hover` |
| `#e0e0e0` | `border-amikom-hairline` |
| `#ffffff` | `bg-amikom-canvas` |

---

## IV. PROGRESS LOG

| Item | File Utama | Status |
|---|---|---|
| Design token mapping | `tailwind.config.ts` | ✅ |
| `confirm()` → `AlertDialog` | track-record, kuesioner, career-center, alumni | ✅ |
| Skip-to-content + aria-label | `app/layout.tsx`, navbar, alumni table | ✅ |
| Profile consolidation | `/dashboard/profile` (canonical), `/user/profile` (redirect) | ✅ |
| Add-user consolidation | `/admin/add-user` (canonical), `/super-user/add-user` (redirect) | ✅ |
| PageHeader (14 pages) | `components/ui/page-header.tsx` | ✅ |
| `text-[10px]` → `text-[11px]` | Semua section label | ✅ |
| Password toggle login | `app/(auth)/login/login-form.tsx` | ✅ |
| `toast.promise()` delete | track-record, kuesioner, career-center | ✅ |
| Font swap (Work Sans → Geist) | `layout.tsx`, `tailwind.config.ts`, `globals.css` | ✅ |
| Font swap (Work Sans/DM Mono → Geist/Geist Mono) | `layout.tsx`, `tailwind.config.ts`, `globals.css`, `DESIGN_SYSTEM.md` | ✅ |
| Fix rekomendasi — tambah url & source di form admin career | `app/(protected)/admin/career-center/page.tsx` | ✅ |
| Fix rekomendasi — cache matching di-invalidate setelah update profil | `lib/actions/profile.ts` | ✅ |
| Fix rekomendasi — silent catch diganti console.error | `app/(protected)/user/rekomendasi/page.tsx` | ✅ |
| Fix rekomendasi — kolom url/source tidak ada di DB (migration 005) | `supabase/migrations/005_add_jobs_url_source.sql` | ✅ |
| Fix rekomendasi — url/source dijadikan optional di Zod + insert conditional | `lib/schemas/jobs.ts`, `lib/actions/jobs.ts` | ✅ |
| Admin dashboard redesain | `app/(protected)/admin/page.tsx` | ✅ |
| DESIGN_SYSTEM.md revisi | `DESIGN_SYSTEM.md` | ✅ |
| Idempotency key di `createTrackRecord` | `lib/actions/track-record.ts`, `app/(protected)/dashboard/track-record/page.tsx`, `supabase/migrations/006_add_idempotency_key.sql` | 🔄 Rollback — migration belum di-apply, column ga ada di DB. Dihapus dari kode. |
| Redirect guard di login form | `app/(auth)/login/login-form.tsx` | ✅ |
| Landing page alumni-first + motion | `app/page.tsx` | ✅ |
| Fix motion import (pre-existing) | `components/landing/motion-wrapper.tsx` | ✅ |
| Restruktur CV template — ATS professional layout | `components/cv/cv-preview-dialog.tsx`, `components/cv/cv-template.tsx` | ✅ |
| Sidebar dashboard layout (replace navbar + bottom bar) | `components/dashboard-sidebar.tsx`, `components/navbar.tsx`, `app/(protected)/layout.tsx` | ✅ |
| Sidebar mobile: add bg-white background | `components/dashboard-sidebar.tsx` | ✅ |
| Navbar mobile: non-transparent bg (no backdrop-blur) + hamburger visibility fix | `components/navbar.tsx` | ✅ |
| Navbar desktop: add breadcrumb (mobile hidden) | `components/navbar.tsx` | ✅ |
| Hapus bottom-bar.tsx (orphaned setelah sidebar layout) | `components/bottom-bar.tsx` | ✅ |
| CI/CD pipeline — Node 22 + E2E job | `.github/workflows/ci.yml` | ✅ |
| Playwright E2E testing — config + 3 test files | `playwright.config.ts`, `e2e/` | ✅ |
| Gitignore — playwright-report/ & test-results/ | `.gitignore` | ✅ |
| Script test:e2e + tsconfig exclude e2e/ | `package.json`, `tsconfig.json` | ✅ |
| Migrasi Shadcn HSL → amikom tokens — 13 HSL variables diselaraskan | `app/globals.css` | ✅ |
| Bersihkan conflicting CSS vars (--primary/--secondary → --amikom-*/--jonquil-*) | `app/globals.css` | ✅ |
| E2E auth helper — mock data + Supabase route interception | `e2e/helpers/auth.ts` | ✅ |
| E2E authenticated dashboard tests — 10 test cases untuk 5 halaman | `e2e/dashboard-auth.spec.ts` | ✅ |
| Revisi rekomendasi — CBF murni dengan preprocessing, TF-IDF, Cosine Similarity, tujuh kriteria profil, dan Top-N | `lib/actions/matching.ts`, `lib/tfidf.ts`, `types/database.ts`, `app/(protected)/user/rekomendasi/page.tsx` | ✅ |
| Field profil rekomendasi — `program_studi`, `certifications`, `job_interests`, `preferred_location` | `supabase/migrations/014_add_profile_extended_fields.sql`, `types/database.ts`, `lib/schemas/profile.ts`, `lib/actions/profile.ts`, `app/(protected)/dashboard/profile/page.tsx` | ✅ |
| Generate CV PDF (ATS-friendly) — 1 template, 2 bahasa (ID/EN), dialog preview + download | `lib/actions/cv.ts`, `components/cv/cv-template.tsx`, `components/cv/cv-preview-dialog.tsx`, `app/api/generate-cv/route.ts`, `app/(protected)/dashboard/profile/page.tsx` | ✅ |
| CV template — per-prodi config (D3/S1/S2): degree, field, focus otomatis dari `profile.program_studi` dengan fallback `education_level` | `components/cv/cv-template.tsx` | ✅ |
| CV preview dialog — perbaiki hardcoded "Teknologi Informasi", gunakan PRODI_CONFIG | `components/cv/cv-preview-dialog.tsx` | ✅ |
| CV template — per-prodi config lengkap (D3 Komputerisasi Akuntansi, D3 Manajemen Informatika, S1 Informatika, S1 Teknologi Informasi) | `components/cv/cv-template.tsx`, `components/cv/cv-preview-dialog.tsx` | ✅ |
| Fix Netlify build — `never[]` type error karena `interface` vs `Record<string, unknown>` di TS 5.7 | `types/database.ts` | ✅ |
| Fix Netlify build — tambah `Views`, `Functions`, `Relationships` ke Database type untuk `@supabase/supabase-js` v2.108 | `types/database.ts` | ✅ |
| Fix Netlify build — hapus `publish = ".next"`, perbaiki `ignore` command | `netlify.toml` | ✅ |
| Fix `useFormState` undefined state — tambah optional chaining (`state?.redirectTo`, `state?.error`) di login form | `app/(auth)/login/login-form.tsx` | ✅ |
| Fix ESLint compatibility — downgrade `eslint` v9 → v8 untuk Next.js 14 | `package.json`, `.eslintrc.json` | ✅ |
| Bersihkan `as never` casts (9 tempat) — type system sudah proper | `lib/actions/*.ts` | ✅ |
| Fix nullable fields — tambah `?? null` untuk Zod `.nullable().optional()` | `lib/actions/track-record.ts`, `jobs.ts`, `tracer-study.ts` | ✅ |
| Fix ESLint warnings — wrap `loadUsers`/`loadRecords`/`processFile` di `useCallback` | `app/(protected)/admin/alumni/page.tsx`, `track-record/page.tsx`, `components/super-user/bulk-import-form.tsx` | ✅ |
| Fix ESLint warning — tambah `loadingData` ke dependency array | `components/cv/cv-preview-dialog.tsx` | ✅ |
| Add `.nvmrc`, `.env.example`, `engines` field, exclude `__tests__` dari tsconfig | root | ✅ |
| Housekeeping — hapus `xlsx` (unused), hapus `hooks/` dari tailwind config, fix og-image + TODO metadata | `package.json`, `tailwind.config.ts`, `app/layout.tsx` | ✅ |
| Rebranding SITRACK → UNIKOM (Alumni AMIKOM) + logo amikom di navbar/sidebar | `app/layout.tsx`, `app/page.tsx`, `components/dashboard-sidebar.tsx`, `components/navbar.tsx` | ✅ |
| Template Smart Sistem Alumni — 63 pertanyaan dari Form_Pertanyaan_Tracer_Study.txt (Seksi B,C,D) | `lib/tracer-study-template.ts`, `lib/actions/questions.ts`, `app/(protected)/admin/kuesioner/page.tsx` | ✅ |
| Halaman Jaringan Alumni — networking cards + modal detail (pekerjaan, kontak, skills) | `app/(protected)/dashboard/network/page.tsx`, `components/dashboard-sidebar.tsx` | ✅ |
| Filter tahun angkatan di halaman Jaringan Alumni | `app/(protected)/dashboard/network/page.tsx` | ✅ |
| Verifikasi Alumni di landing page — cari by Nama/NIM, tampil status terverifikasi/tidak | `components/landing/alumni-verify.tsx`, `app/page.tsx` | ✅ |
| Halaman CRUD Konten — Berita, Sertifikasi, FAQ, Kisah Sukses (UI only, dummy data) | `app/(protected)/admin/content/berita/page.tsx`, `sertifikasi/page.tsx`, `faq/page.tsx`, `kisah-sukses/page.tsx` | ~~✅~~ → 🔄 Replaced: DB integration |
| Landing page visual audit — 8 bugs teridentifikasi | `app/page.tsx`, `components/landing/*` | ✅ |
| LandingNavbar component + mobile hamburger menu | `components/landing/landing-navbar.tsx`, `app/page.tsx` | ✅ |
| Fix bug #1: overflow-hidden clipping blurred orbs hero | `app/page.tsx` | ✅ |
| Fix bug #2: ScrollReveal + StaggerContainer conflict — hapus ScrollReveal wrapper di 4 komponen + orphan tag di features section | `components/landing/news-section.tsx`, `success-stories.tsx`, `certification-info.tsx`, `job-vacancies.tsx`, `app/page.tsx` | ✅ |
| Fix SmoothScrollLink — tambah optional `onClick` prop + fix mobile menu tidak tertutup setelah klik nav link | `components/landing/smooth-scroll-link.tsx` | ✅ |
| Fix landing page bugs — indentasi news/job sections, broken links → /login, teks redundant "AMIKOM STMIK AMIKOM" → "STMIK AMIKOM" (4 file) | `components/landing/news-section.tsx`, `job-vacancies.tsx`, `alumni-verify.tsx`, `app/page.tsx`, `app/layout.tsx` | ✅ |
| Migration 008 — tambah `gambar_url` ke `berita`, `icon_url` ke `sertifikasi` + update TypeScript types | `supabase/migrations/008_add_image_columns.sql`, `types/database.ts` | ✅ |
| Image upload dengan kompresi Canvas API — komponen `ImageUpload` reusable (max 5MB input → kompress ke 2MB, max 1280px, JPEG 0.82, drag-and-drop, preview) + `uploadImage`/`deleteImage` server actions ke Supabase Storage bucket `content` + integrasi ke 3 form admin (berita, kisah-sukses, sertifikasi) | `components/ui/image-upload.tsx`, `lib/actions/content.ts`, `lib/schemas/content.ts`, `app/(protected)/admin/content/berita/page.tsx`, `kisah-sukses/page.tsx`, `sertifikasi/page.tsx` | ✅ |
| Integrasi DB landing page — NewsSection, SuccessStories, JobVacancies, CertificationInfo fetch dari Supabase server-side via `Promise.all`, hapus semua hardcoded data, tambah empty state per section | `app/page.tsx`, `components/landing/news-section.tsx`, `success-stories.tsx`, `job-vacancies.tsx`, `certification-info.tsx` | ✅ |
| Ganti `<img>` → `<Image>` (next/image) untuk optimasi LCP + bandwidth — 7 file, tambah remotePattern `images.unsplash.com` di next.config | `app/page.tsx`, `components/landing/*`, `components/ui/image-upload.tsx`, admin content pages | ✅ |
| Shared template dashboard — `layout.tsx` jadi wrapper `page-container pb-8`, spacing `space-y-*` ditangani di masing-masing page agar bagian dalam page ter-spasi vertikal | `app/(protected)/dashboard/layout.tsx`, `dashboard/page.tsx`, `track-record/page.tsx`, `tracer-study/page.tsx`, `profile/page.tsx`, `network/page.tsx` | ✅ |
| Fix double-wrap — `page-container` di-remove dari `network/page.tsx` dan `components/job-list.tsx` karena dashboard layout + user page sudah menyediakan container | `network/page.tsx`, `components/job-list.tsx` | ✅ |
| Network page visual audit — konsistenkan card padding `p-6`, grid gap `gap-4`, filter label `text-[11px]`, modal `rounded-xl`, empty state `rounded-lg p-16 shadow-sm` | `app/(protected)/dashboard/network/page.tsx` | ✅ |
| Dashboard spacing fix — tambah `space-y-8` ke root div semua dashboard page (`dashboard`, `tracer-study`, `profile`, `network`) dan `space-y-6` ke `track-record` untuk menghindari konten terlalu berdempet | `app/(protected)/dashboard/*/page.tsx` | ✅ |
| Fix image upload "File bukan gambar yang valid" — ganti `new Image()` → `document.createElement('img')` + tambah timeout 15s + tambah `blob:` ke CSP `img-src` di `next.config.mjs` | `components/ui/image-upload.tsx`, `next.config.mjs` | ✅ |
| Dialog modal terlalu mepet ke atas pada form panjang — tambah `max-h-[calc(100vh-4rem)] overflow-y-auto` ke `DialogContent` agar modal scrollable dan tidak terpotong | `components/ui/dialog.tsx` | ✅ |
| Landing page hero image — fix 3 bug: (1) `overflow-hidden` clipping floating overlays + `-left-6`/`-right-4` keluar bounds, ganti jadi `left-4`/`right-4`, hapus `animate-bounce`; (2) `h-[500px]` fixed height → `aspect-[3/2]` responsif; (3) backdrop blur tak terlihat `bg-white/40` → `bg-white/70` | `app/page.tsx` | ✅ |
| FAQ landing page — integrasi DB: hardcoded 5 FAQ diganti fetch dari `faq` (`.eq('aktif', true).order('urutan')`), data di-pass dari server component `page.tsx` ke `FaqSection` sebagai props | `components/landing/faq-section.tsx`, `app/page.tsx` | ✅ |
| AlumniVerify — perbaiki deteksi NIM (regex `^\d{6,}$` → `/^[A-Za-z0-9.\-/]{4,20}$/` + `/\d/`), ambil `graduation_year` dari `tracer_study_responses` (bukan tebak dari NIM prefix), tampilkan multi-result (limit 5 + switcher) | `components/landing/alumni-verify.tsx` | ✅ |
| Hero floating cards — container overflow-hidden hapus, 2 card di-positioning absolute dengan offset negatif (-top/-left untuk card kiri, -bottom/-right untuk card kanan) + responsive lg prefixes | `app/page.tsx` | ✅ |
| Job vacancies card konsisten — grid `items-stretch`, card `flex flex-col h-full`, title `min-h-[56px] line-clamp-2`, konten `flex-1`, tombol `mt-auto` agar sejajar bawah | `components/landing/job-vacancies.tsx` | ✅ |
| News/berita publik — halaman listing `/berita` + halaman detail `/berita/[slug]` tanpa login, nav link `news-section.tsx` dari `/login` ke `/berita` dan `/berita/${slug}` + tambah `LandingNavbar variant="public"` di halaman berita agar navbar muncul + detail page restructure: image card only, text content on default pearl bg + judul/kategori/tanggal di atas, share buttons (WhatsApp/Facebook/X/Email) rata kanan, caption gambar + divider sebelum isi artikel + listing page: grid `items-stretch`, title judul `min-h-[56px] line-clamp-2`, image card aspect-ratio konsisten | `app/berita/page.tsx`, `app/berita/[slug]/page.tsx`, `components/landing/news-section.tsx`, `components/landing/landing-navbar.tsx` | ✅ |
| Landing reusable image component — ekstrak `components/landing/content-image.tsx` untuk image + badge + fallback (`gambar_url || categoryFallback || KATEGORI_FALLBACK`) + props `imageHeight`, `imageClassName`, `priority`; digunakan oleh `app/berita/page.tsx` dan `app/berita/[slug]/page.tsx` agar menghilangkan duplikasi fallback logic | `components/landing/content-image.tsx`, `app/berita/page.tsx`, `app/berita/[slug]/page.tsx` | ✅ |
| Fix navbar — pisah `NAV_LINKS` (landing, pakai `SmoothScrollLink`) dan `PUBLIC_LINKS` (public variant, pakai Next.js `Link`); sebelumnya `navLinks` ada `/berita` tetapi variant `landing` masih passing ke `SmoothScrollLink` sehingga klik tidak navigasi route + double-slash `//berita` bug pada public variant | `components/landing/landing-navbar.tsx` | ✅ |
| Sertifikasi publik — halaman listing `/sertifikasi` + halaman detail `/sertifikasi/[slug]` tanpa login, nav link `landing-navbar.tsx` tambah `/sertifikasi`, update `certification-info.tsx` CTA dari `/login` ke `/sertifikasi`, migration 009 tambah kolom `slug` ke tabel `sertifikasi` dengan trigger auto-generate dari `nama` + TypeScript type update + pages pakai DB slug | `supabase/migrations/009_add_slug_to_sertifikasi.sql`, `types/database.ts`, `app/sertifikasi/page.tsx`, `app/sertifikasi/[slug]/page.tsx`, `components/landing/certification-info.tsx`, `components/landing/landing-navbar.tsx` | ✅ |
| Kisah Sukses — refactor landing section jadi infinite marquee strip (auto-scroll horizontal, pause on hover, compact card dengan avatar + nama + quote), klik card navigasi ke `/kisah-sukses/[slug]` + halaman detail publik tanpa login dengan full cerita, foto, share buttons | `components/landing/success-stories.tsx`, `app/kisah-sukses/[slug]/page.tsx` | ✅ |
| Migration 010 — tambah `graduation_year` ke `profiles` + tabel `tracer_study_answers` | `supabase/migrations/010_add_graduation_year.sql` | ✅ |
| Graduation Year di profile — schema, action, form, completeness, preview | `lib/schemas/profile.ts`, `lib/actions/profile.ts`, `lib/utils/profile-completeness.ts`, `app/(protected)/dashboard/profile/page.tsx` | ✅ |
| Graduation Year di admin — tabel, export, add-user, bulk import, template | `app/(protected)/admin/alumni/page.tsx`, `lib/actions/export.ts`, `components/admin/add-user-form.tsx`, `lib/actions/bulk-import.ts`, `components/super-user/bulk-import-form.tsx`, `components/download-template-button.tsx` | ✅ |
| Graduation Year di landing — AlumniVerify pakai `profiles.graduation_year` | `components/landing/alumni-verify.tsx` | ✅ |
| Kuesioner dinamis — render pertanyaan admin + `tracer_study_answers` + `getProfileGraduationYear` | `app/(protected)/dashboard/tracer-study/page.tsx`, `lib/actions/tracer-study.ts` | ✅ |
| Admin lihat jawaban kuesioner per angkatan — tab Jawaban + statistik + detail jawaban per alumni | `app/(protected)/admin/kuesioner/page.tsx`, `lib/actions/questions.ts` | ✅ |
| Export Excel jawaban kuesioner — per angkatan, flat table (identitas + core fields + 63 jawaban per kolom) | `lib/actions/export.ts`, `app/(protected)/admin/kuesioner/page.tsx` | ✅ |
| Fix nomor urut pertanyaan — tampilkan sequential (1,2,3) bukan raw display_order (10,20,30) di admin + tracer-study + modal jawaban | `app/(protected)/admin/kuesioner/page.tsx`, `app/(protected)/dashboard/tracer-study/page.tsx` | ✅ |
| Breadcrumb dinamis — sync angkatan ke URL `?angkatan=2025`, tampil "Admin > Kuesioner > Angkatan 2025" | `components/dashboard-breadcrumb.tsx`, `app/(protected)/admin/kuesioner/page.tsx` | ✅ |
| Breadcrumb dinamis — sync filter ke URL di semua page (analytics year, network status/year, joblist type, alumni search/page, content search) | `components/dashboard-breadcrumb.tsx`, `components/job-list.tsx`, `app/(protected)/admin/analytics/page.tsx`, `dashboard/network/page.tsx`, `admin/alumni/page.tsx`, `admin/content/berita/page.tsx`, `sertifikasi/page.tsx`, `kisah-sukses/page.tsx`, `faq/page.tsx` | ✅ |
| Tambah label rute breadcrumb yang hilang (network, lowongan, content, berita, sertifikasi, kisah-sukses, faq, super-user, users) | `lib/breadcrumbs.ts` | ✅ |
| Fitur hapus angkatan card di admin/kuesioner — tombol X pojok kanan card + konfirmasi AlertDialog | `app/(protected)/admin/kuesioner/page.tsx`, `lib/actions/questions.ts` | ✅ |
| Fix Netlify `ignore` command — `HEAD^` gagal di shallow clone Netlify | `netlify.toml` | ✅ |
| Pre-deployment audit Step 1-8 — dependency, build, TS, lint, import, filesystem | — | ✅ |
| Pre-deployment audit Step 9 — env vars (5 vars, semua terdocument di .env.example) | — | ✅ |
| Pre-deployment audit Step 10 — security (no hardcoded secrets, CSP headers) | — | ✅ |
| Pre-deployment audit Step 11 — SSR (browser APIs only in client components) | — | ✅ |
| Pre-deployment audit Step 12-13 — API routes, Supabase config production-safe | — | ✅ |
| Pre-deployment audit Step 14 — asset audit (add favicon + apple-icon SVG) | `app/icon.svg`, `app/apple-icon.svg`, `app/layout.tsx` | ✅ |
| Pre-deployment audit Step 15 — Netlify config (fix `publish` + `ignore`) | `netlify.toml` | ✅ |
| Pre-deployment audit Step 16 — performance (loading.tsx, next/image, fonts) | — | ✅ |
| Pre-deployment audit Step 17 — production readiness (SEO, OG, JSON-LD, robots, sitemap) | — | ✅ |
| Pre-deployment audit Step 18-20 — git, final build (33 pages 0 error), report | — | ✅ |
| Revisi navigasi Alumni: Beranda→Dashboard, Sistem Alumni→Tracer Study, Lowongan→Lowongan Kerja, Jaringan→Jaringan Alumni; hapus Riwayat Kerja & Rekomendasi dari sidebar, pindah ke Profil/Lowongan; tambah banner Rekomendasi Kerja di career page + Riwayat Kerja card di profile page | `components/dashboard-sidebar.tsx`, `lib/breadcrumbs.ts`, `dashboard/page.tsx`, `track-record/page.tsx`, `tracer-study/page.tsx`, `career/page.tsx`, `network/page.tsx`, `profile/page.tsx`, `user/rekomendasi/page.tsx`, `components/dashboard/stats-grid.tsx`, `components/dashboard/quick-actions-grid.tsx` | ✅ |
| Revisi navigasi Admin: Alumni→Manajemen Alumni (group: Data Alumni, Tambahkan Alumni, Import CSV), Kuesioner→Tracer Study, Karir→Lowongan Kerja (masuk Manajemen Konten), Import User→Tambahkan Alumni, hapus Analitik & Kisah Sukses dari sidebar; update semua PageHeader labels + admin dashboard quick links | `components/dashboard-sidebar.tsx`, `lib/breadcrumbs.ts`, `admin/alumni/page.tsx`, `admin/kuesioner/page.tsx`, `admin/career-center/page.tsx`, `admin/bulk-import/page.tsx`, `admin/add-user/page.tsx`, `admin/analytics/page.tsx`, `admin/page.tsx` | ✅ |
| UX revisi: (1) Admin Manajemen Alumni jadi flat link (bukan dropdown), tambah tombol Import CSV di samping Export Excel; (2) Lowongan Kerja: ganti CTA banner dengan card "Rekomendasi Kerja Untukmu" (top-3 match + See More); (3) Profile: embed full Riwayat Kerja UI inline (bukan CTA); (4) Performance: sessionStorage cache profile, staleTimes di next.config; (5) Login: label "Kata Sandi" + placeholder "Masukkan kata sandi Anda"; (6) Favicon: gunakan logo-amikom-surakarta-1.png | `dashboard-sidebar.tsx`, `admin/alumni/page.tsx`, `dashboard/career/page.tsx`, `dashboard/profile/page.tsx`, `(protected)/layout.tsx`, `next.config.mjs`, `(auth)/login/login-form.tsx`, `app/layout.tsx` | ✅ |
| Landing page image upgrade — (1) Hero: ganti Unsplash → `image3.jpeg` (foto wisuda group XXIII) + caption badge "📸 Wisuda XXIII"; (2) Feature cards 6 buah → pakai `image1.png`–`image5.jpeg` + `image.png` dengan `fill` + `sizes`; (3) Photo gallery marquee strip (bg-amikom-purple, autoplay) dengan 12 frame (6 foto × 2 loop); (4) SVG doodle art education background di hero (opacity 0.045) — motif toga, buku terbuka, pensil, diploma, atom, bintang, lampu, trophy, laptop, WiFi | `app/page.tsx` | ✅ |
| Nonaktifkan / comment out navigasi Survey Perusahaan di landing navbar & admin sidebar | `components/landing/landing-navbar.tsx`, `components/dashboard-sidebar.tsx` | ✅ |
| Dashboard Manajemen Konten — Tambah navigasi parent untuk Manajemen Konten di sidebar & buat halaman `/admin/content` (opsi Kisah Sukses di-hide sementara) | `components/dashboard-sidebar.tsx`, `app/(protected)/admin/content/page.tsx` | ✅ |
| Pindahkan Rekomendasi Kerja (Smart Match) ke bawah filter pencarian di halaman Lowongan Kerja | `app/(protected)/dashboard/career/page.tsx`, `components/job-list.tsx` | ✅ |
| Riwayat Pengisian Tracer Study — tabel `tracer_study_history` (migration 012) dengan snapshot jsonb, server action `saveTracerStudyHistory` & `getTracerStudyHistory`, timeline histori pengisian pada submitted view alumni (`dashboard/tracer-study`), serta tab Riwayat pada modal detail jawaban admin (`admin/kuesioner`) | `supabase/migrations/012_tracer_study_history.sql`, `types/database.ts`, `lib/actions/tracer-study.ts`, `lib/actions/questions.ts`, `app/(protected)/dashboard/tracer-study/page.tsx`, `app/(protected)/admin/kuesioner/page.tsx` | ✅ |
| Verifikasi Alumni Landing Page — Tampilkan data Tahun Lulus dan Program Studi secara eksplisit pada card hasil verifikasi + fallback enrichment dari `tracer_study_responses` | `components/landing/alumni-verify.tsx`, `lib/actions/alumni-verify.ts` | ✅ |
| Riwayat Pembaruan Data Tracer Study UI & Fallback — Fallback otomatis dari `tracer_study_responses.submitted_at`/`updated_at`, status banner pembaruan data, tab switcher Data Terkini & Riwayat Pembaruan Data, serta snapshot log tiap versi | `lib/actions/tracer-study.ts`, `lib/actions/questions.ts`, `app/(protected)/dashboard/tracer-study/page.tsx` | ✅ |
| Pengisian Data Tracer Study User Dimah (D. Luthfi Aulia Rohman, NIM 10295) — Update `tracer_study_responses` (Bekerja, QA Engineer di Traveloka, S1 Informatika 2024, Sangat Erat) & isi 65 jawaban kuesioner dinamis di `tracer_study_answers` | `tracer_study_responses`, `tracer_study_answers`, `profiles` | ✅ |
| History Log Admin & Excel Export — Tabel `admin_activity_logs` (migration 013), server actions `lib/actions/admin-logs.ts`, sheet Riwayat & Info Export di semua file Excel, tab Riwayat Log di `/admin/kuesioner` (filter semua log, pembaruan alumni, unduh excel), dan dialog snapshot viewer | `supabase/migrations/013_admin_activity_logs.sql`, `types/database.ts`, `lib/actions/admin-logs.ts`, `lib/actions/export.ts`, `lib/actions/questions.ts`, `app/(protected)/admin/kuesioner/page.tsx` | ✅ |
| Hapus bagian "Unduh Excel" dari tab Riwayat Log admin — hapus stat card "Log Ekspor Excel", filter "Unduh Excel", entri export log dari list, dan badge isExport; tab kini hanya menampilkan log pembaruan alumni | `app/(protected)/admin/kuesioner/page.tsx` | ✅ |
| Fix export jawaban kuesioner hanya keunduh beberapa jawaban — `tracer_study_answers` punya RLS `auth.uid()=user_id` sehingga admin tidak bisa baca jawaban semua alumni; export sekarang pakai `createAdminClient()` (service_role bypass RLS) | `lib/actions/export.ts` | ✅ |
| Export Excel jawaban kuesioner — tambah sheet log pembaruan per hari (rentang 1 hari) dari `tracer_study_history`: aktivitas "Pengisian Kuesioner" (entri pertama per user) vs "Pembaruan Data" (entri berikutnya), kolom Waktu/Nama/NIM/Email/Aktivitas/Status/Perusahaan/Posisi | `lib/actions/export.ts` | ✅ |
| Landing page & halaman publik bisa diakses saat sudah login — hapus `redirect('/dashboard')` dari `app/page.tsx`; `LandingNavbar` dapat prop `isLoggedIn` & `dashboardHref` (role-aware: `/admin` untuk super_user, `/dashboard` untuk alumni) sehingga tombol CTA berubah jadi "Buka Dashboard"/"Dashboard"; prop sama diteruskan di semua halaman publik (`/berita`, `/berita/[slug]`, `/sertifikasi`, `/sertifikasi/[slug]`, `/kisah-sukses/[slug]`). Catatan: sesi admin & alumni tidak bisa aktif bersamaan di tab browser yang sama karena auth berbasis cookie (cookies dibagi per browser, bukan per tab) — gunakan browser/incognito/device berbeda | `app/page.tsx`, `components/landing/landing-navbar.tsx`, `app/berita/page.tsx`, `app/berita/[slug]/page.tsx`, `app/sertifikasi/page.tsx`, `app/sertifikasi/[slug]/page.tsx`, `app/kisah-sukses/[slug]/page.tsx` | ✅ |
| Landing hero job-seeking + section Cara Kerja + CTA prodi + restyle — (1) Hero "Baru Wisuda? Siap Masuk Dunia Kerja." dengan trust indicators; visual kanan ilustrasi kartu LOWONGAN KERJA (kartu putih -rotate-3 + backdrop gradient rotate-6, gaya sama dgn section CV Otomatis) berisi ikon briefcase, label mono "Lowongan Kerja", skeleton bars, meta rows lokasi/gaji/waktu, tombol "Lamar Sekarang" fake — tanpa badge apapun; (2) Section `HowItWorks` id=`#cara-kerja` 4 langkah dengan connector dashed line; (3) CTA "Info Lowongan Sesuai Prodimu." + chips prodi setelah Cara Kerja, styling dirapikan: eyebrow pill badge, border-white/10, shadow-2xl shadow-amikom-purple/20, heading max-w-640, chips white/15, dekor briefcase pindah ke kiri-bawah; (4) Galeri marquee wisuda dipindah ke BAWAH halaman (setelah CTA, sebelum footer); urutan final: Hero → Cara Kerja → CTA → CV Otomatis → Sertifikasi → Berita → Lowongan → Verifikasi → FAQ → Galeri → Footer. Label CTA login: navbar "Dashboard" → "Portal Karir", hero "Buka Dashboard" → "Lihat Lowongan" (tema cari kerja) | `app/page.tsx`, `components/landing/how-it-works.tsx`, `components/landing/landing-navbar.tsx` | ✅ |
| Tombol Unduh XLS di Riwayat Log admin kuesioner — `exportHistoryToExcel` server action + tombol download di tab Riwayat Log | `lib/actions/export.ts`, `app/(protected)/admin/kuesioner/page.tsx` | ✅ |
| Fix tombol Lamar di modal lowongan (job-list) agar membuka link `job.url` di tab baru (sebelumnya hanya menutup modal); saat `url` kosong tampil tombol Tutup | `components/job-list.tsx` | ✅ |
| Fix build "Server actions must be async functions" — pindahkan `buildProfileDocument` & `buildJobDocument` (helper murni sinkron) dari `lib/actions/matching.ts` (berlabel `'use server'`) ke module murni `lib/recommendation-docs.ts`; import di `matching.ts` & `__tests__/matching.test.ts` disesuaikan | `lib/recommendation-docs.ts`, `lib/actions/matching.ts`, `__tests__/matching.test.ts` | ✅ |
| Fix "Gagal menyimpan template pertanyaan" — root cause: CHECK constraint DB `tracer_study_questions_question_type_check` belum mengizinkan `'scale'`; tambah migration 015 & pesan error `bulkCreateFromTemplate` kini memuat detail error DB | `supabase/migrations/015_add_scale_question_type.sql`, `lib/actions/questions.ts` | ✅ |
| Fix ringkasan High/Medium Match di halaman Rekomendasi Kerja — card High Match & Medium Match kini hanya dirender jika ada minimal 1 hasil pada kategori tsb (hindari label "Medium: 0" yang menyesatkan); grid jadi 2 kolom (sm:3) | `app/(protected)/user/rekomendasi/page.tsx` | ✅ |
| Revisi total template kuesioner admin — 3 bagian (1. Identitas Responden, 2. Kuesioner Wajib, 3. Kuesioner Opsional), 62 pertanyaan sesuai panduan Dikti; tipe pertanyaan baru `checkbox` (multi-pilih) & `scale` (skala linier 1–5); logika percabangan (Bekerja/Wiraswasta/Studi lanjut/Pencarian kerja + sub-branching "Ya/Tidak" & "Lainnya"); badge Wajib/Opsional, validasi pertanyaan wajib saat submit, pesan penutup formulir | `lib/tracer-study-template.ts`, `types/database.ts`, `lib/actions/questions.ts`, `app/(protected)/admin/kuesioner/page.tsx`, `app/(protected)/dashboard/tracer-study/page.tsx` | ✅ |
| Housekeeping — hapus 11 orphan files + 22 unused imports + 1 orphaned import (Building2); net ~650 baris dead code terbuang | `components/ui/{empty-state,export-button,card,label,separator}.tsx`, `components/{skill-input,submit-button}.tsx`, `components/super-user/add-user-form-new.tsx`, `lib/supabase/queries.ts`, `components/landing/{success-stories,animated-counter}.tsx` + 15 page/component files | ✅ |
| Reload data lebih cepat — ekstrak profile cache ke module bersama `lib/profile-cache.ts` (layout + profile/lowongan/rekomendasi page memakainya, form profile terisi instan dari sessionStorage, hanya 1 query `track_records` saat cache fresh); hapus double-fetch `profiles.skills` di career page (`RekomendasiCard` terima prop `userSkills`, bukan re-query); skills lowongan/rekomendasi dibaca sinkron dari cache (fallback fetch jika cache kosong) | `lib/profile-cache.ts`, `app/(protected)/layout.tsx`, `app/(protected)/dashboard/profile/page.tsx`, `app/(protected)/dashboard/career/page.tsx`, `app/(protected)/user/lowongan/page.tsx`, `app/(protected)/user/rekomendasi/page.tsx` | ✅ |
| Fix & upgrade Galeri Foto Wisuda landing page — ganti strip statis/terputus dengan dual-track infinite seamless marquee (`WisudaGallery`), animasi CSS GPU-accelerated (`translate3d`), pause on hover, hover card micro-interaction (`scale-105` + `border-white/20`), ukuran foto diperbesar (135px desktop / 105px mobile + `rounded-xl`), mask edge fade, proteksi dari reduced-motion freeze di Windows, isi penuh layar ultra-wide/4K | `components/landing/wisuda-gallery.tsx`, `app/globals.css`, `app/page.tsx` | ✅ |
| Pre-deployment Netlify readiness audit — fix ESLint warning di `admin/career-center`, CSP `img-src` tambah `images.unsplash.com`, validasi `.nvmrc` (Node 20), build verification (38/38 static/dynamic routes 0 error), audit environment variables & Netlify plugin config | `app/(protected)/admin/career-center/page.tsx`, `next.config.mjs`, `netlify.toml` | ✅ |
| Setup SEO & GEO (AI Search) untuk https://alumni-amikomsolo.site/ — dynamic XML sitemap (query DB berita/sertifikasi/kisah-sukses), robots.txt multi-AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, ByteSpider, dll.), Web App Manifest (`app/manifest.ts`), JSON-LD schema (@graph CollegeOrUniversity, WebSite, WebApplication, NewsArticle, Course, Article), update `public/llms.txt` + `public/.well-known/llms.txt`, serta dukungan verification meta tags (Google/Bing/Yandex) | `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts`, `app/manifest.ts`, `public/llms.txt`, `public/.well-known/llms.txt`, `app/berita/[slug]/page.tsx`, `app/sertifikasi/[slug]/page.tsx`, `app/kisah-sukses/[slug]/page.tsx`, `.env.example` | ✅ |
| Pembersihan dead files & verifikasi Netlify build — hapus `replace.mjs`, `install.cmd`, `contoh-import-user.csv`, validasi `npx tsc --noEmit` (0 error), `npx next lint` (0 error/warning), dan `npm run build` (39/39 routes berhasil dikompilasi). Update AGENTS.md & BRAIN.md standar wajib pre-flight check sebelum selesai task | `AGENTS.md`, `BRAIN.md`, root | ✅ |
| Port fitur dari repo remote `cnqqi/skripsi-gue` (C1–C4 approved): chip tabs C1, format sertifikasi C2, merge rekomendasi/debug panel C3, merge test diverged C4; JANGAN sentuh Netlify/SEO/landing gallery lokal/role lock | `app/page.tsx`, `components/landing/job-vacancies.tsx`, `lib/*`, `components/*` | ✅ |
| Fix crash `PRODI_FALLBACK` — `PRODI_CONFIG['S1']` (key tidak ada → undefined) → `PRODI_CONFIG['S1 Informatika']` | `components/cv/cv-template.tsx` | ✅ |
| Selaraskan seluruh suite Jest ke hijau — 11 suite pre-existing gagal → 0: e2e di-`testPathIgnorePatterns`, key mock `tracerStudy`→`SistemAlumni`, label ekspektasi sinkron template (STMIK, Pengalaman Organisasi dan Proyek, plain-text skills, title `CV -`, header style, EN labels), bulk-import role-lock assertions, education_level enum | `jest.config.ts`, `__tests__/cv-generation.test.tsx`, `__tests__/cv-generation-api.test.tsx`, `__tests__/cv-generation.test.ts` (dihapus), `__tests__/bulk-import-*.ts(x)`, `__tests__/landing.test.tsx`, `__tests__/matching.test.ts`, `__tests__/tracer-study-analytics.test.ts` | ✅ |
| Pre-flight akhir — `npx jest` 344/344, `npx tsc --noEmit` 0, `npx next lint` clean, `npm run build` 39/39 | — | ✅ |
| Commit + push ke `origin/dimah` — `d1233e6` feat(rbac) 32 file + `401bac5` fix(ui) sync 10 file; baseline Netlify LIVE. **Fix merge `main`→`dimah` (`2983a14`, PR #3)** yang merusak JSX (`profile`/`rekomendasi` syntax error → Netlify Deploy Preview failed) — restore 4 file ke versi `401bac5` + BRAIN progress rows | git, PR #3 | ✅ |
| Permission management phase 1 (Spatie-style hybrid) — migration 017 (`permissions` + `role_permissions` + `has_permission()` + seed), core `lib/permissions/` (`PERMISSIONS`, `can()` cached, `requirePermission`), tutup celah keamanan (bulk-import & reset/delete user & 3 export & questions CRUD kini pakai guard; `checkAdminRole` duplikat di jobs/content konsolidasi), types DB + seed sinkron; migration 015+017 **sudah di-apply & diverifikasi live** (10 permissions, 14 mapping, role utuh), 016 jadi guarded no-op; verifikasi tsc 0 / lint clean / jest 344 / build 39/39 | `supabase/migrations/017_permissions_rbac.sql`, `lib/permissions/{index,can,guards}.ts`, `lib/actions/{bulk-import,alumni,export,questions,jobs,content,survey-perusahaan}.ts`, `types/database.ts`, `__tests__/bulk-import-{logic,batch5,bug-server}.test.ts` | ✅ |
| Permission management phase 2 (UI admin) — halaman `/admin/roles` matrix role×permission (super_user dikunci, role lain toggle + toast save + `revalidateTag('permissions')`), server actions `getPermissionMatrix`/`updateRolePermissions`/`getMyPermissions` (guard `role.manage`), permission `role.manage` (migration 018 + seed live via REST, 11 permission total), sidebar: link "Role & Akses" + item nav bertag `action` + `filterNavByActions` (fail-open) + fetch `getMyPermissions` hanya untuk role di luar super_user/user, breadcrumb label `roles`; pre-flight tsc 0 / lint clean / jest 344 / **build 40/40**; file `nul` (scratch dari redirect `2>nul`) & `supabase/.temp` dibersihkan | `app/(protected)/admin/roles/page.tsx`, `lib/actions/permissions.ts`, `lib/permissions/index.ts`, `components/dashboard-sidebar.tsx`, `app/(protected)/layout.tsx`, `lib/breadcrumbs.ts`, `supabase/migrations/018_add_role_manage_permission.sql` | ✅ |
| Permission management phase 3 (dynamic roles, opsi B) — migration `019_dynamic_roles.sql` (tabel `roles` + seed 2 role locked, enum `app_role` → `text` + FK, RLS profiles → `has_permission('alumni.manage')` + WITH CHECK anti-escalation, recreate `get_my_role`/`has_permission`); server actions `createRole`/`deleteRole`/`setUserRole`/`getRoleOptions`; `RoleGuard` + `requiredActions` (admin layout = `ADMIN_ACTIONS`, user layout = any profile, middleware `/admin` cukup auth, `/super-user` tetap super_user); UI: Tambah/Hapus Role di `/admin/roles`, Ubah Role di `/admin/alumni`, dropdown role di add-user (hardcoded super_user+user + dynamic, kini **terkirim ke `addUser`** — sebelumnya state role form tidak pernah dipakai = bug), badge/label via `roleLabel`; types `AppRole` → `string` + `RoleRow`; pre-flight tsc 0 / lint clean / jest 344 / build 40/40. **Migration 019 sudah di-apply & diverifikasi live 2026-09-23** (roles 2 locked, 8 profil utuh — trigger register jalan di kolom text, 15 mapping, 11 permission, enum `app_role` hilang, 5 policy profiles; insiden awal error 0A000 karena WITH CHECK policy `user: update own profile` menolak ALTER TYPE → fix: drop policy di awal + recreate identik di akhir; run pertama gagal menyisakan state partial `roles` terisi, re-run idempoten beres) | `supabase/migrations/019_dynamic_roles.sql`, `lib/actions/{permissions,alumni}.ts`, `lib/permissions/index.ts`, `components/auth/role-guard.tsx`, `components/admin/add-user-form.tsx`, `app/(protected)/admin/{layout,roles/page,alumni/page}.tsx`, `app/(protected)/user/layout.tsx`, `middleware.ts`, `types/database.ts` | ✅ |
| Sinkronisasi UI ke GitHub `cnqqi/skripsi-gue` (laporan QA — 5 area tidak sesuai referensi) — checkout versi GitHub: dashboard `/admin` (progress per-angkatan + `force-dynamic`, MiniStat/Alumni Terbaru lokal dibuang), `/admin/bulk-import` (info box "Ketentuan" lokal dihapus — isinya outdated), template CSV `download-template-button` (kolom Role kembali) + restore `contoh-import-user.csv`, `/dashboard/profile` (Card 1–6 + **kunci CV: wajib isi Tracer Study** via `hasCompletedTracerStudy`), `/user/rekomendasi` (tanpa sort/stats/chips — `scoreColor` kembali); **keep security**: server `bulk-import` tetap `role='user'` + password min 8 (patch preview client 6→8, Role tampil tapi tetap dipaksa user server-side — test Role column di-invert), `getAlumniStats` lokal dibackup `byAngkatan` (wajib page GitHub), `updateProfile` guard `formData.has()` untuk `education_level`/`expected_salary` (page GitHub tidak kirim → cegah null-wipe), `graduation_year`/`tanggal_lahir` tetap admin-only; pre-flight tsc 0 / lint clean / jest 344 / **build 40/40** | `app/(protected)/admin/page.tsx`, `app/(protected)/admin/bulk-import/page.tsx`, `app/(protected)/dashboard/profile/page.tsx`, `app/(protected)/user/rekomendasi/page.tsx`, `components/download-template-button.tsx`, `components/super-user/bulk-import-form.tsx`, `contoh-import-user.csv`, `lib/actions/{profile,alumni}.ts`, `__tests__/bulk-import-ui.test.tsx` | ✅ |


### Fitur Baru — Juli & Agustus 2026
- **History Log Admin & Excel Export:** Tabel `admin_activity_logs` (migration 013) mencatat aktivitas admin, sheet Riwayat & Info Export di semua file Excel, tab "Riwayat Log" di kelola kuesioner admin menampilkan log pembaruan data alumni + tombol Unduh XLS untuk export riwayat log. Export jawaban kuesioner kini menyertakan sheet log pembaruan per hari (dari `tracer_study_history`) dan memakai `createAdminClient()` agar semua 65 jawaban terunduh (sebelumnya terblokir RLS `tracer_study_answers`).
- **Riwayat Pengisian Tracer Study:** Tabel `tracer_study_history` (migration 012) menyimpan snapshot setiap pengisian kuesioner. Alumni dapat melihat histori pembaruan jawaban di halaman tracer study (timeline expandable), dan admin dapat melihat histori setiap alumni melalui tab "Riwayat" di modal kuesioner.
- **Graduation Year di Profile:** Kolom `graduation_year` ditambahkan ke tabel `profiles` (migration 010). Alumni bisa mengisi tahun lulus di halaman profile. Admin bisa melihat/mengatur tahun lulus di manajemen alumni, add user, bulk import, dan export Excel.
- **Kuesioner Dinamis:** Halaman tracer-study alumni kini merender pertanyaan secara dinamis dari `tracer_study_questions` yang dibuat admin (filter by `angkatan`). Jawaban disimpan ke tabel baru `tracer_study_answers` (migration 010). Core fields (employment_status, company, etc.) tetap di-sync ke `tracer_study_responses` untuk kebutuhan analytics admin.
- **AlumniVerify — Tahun Lulus dari Profile:** Landing page verifikasi alumni kini mengambil `graduation_year` langsung dari `profiles`, bukan dari `tracer_study_responses`.

### Security Fixes Applied (Juni 2026)
- **Role escalation prevention:** CSV import dan add user kini mengunci role ke 'user', tidak bisa diubah via input
- **Password validation:** Standard 8+ karakter dengan huruf besar, kecil, dan angka di semua form
- **CSP hardening:** Menghapus 'unsafe-eval' dari script-src
- **Error sanitization:** Pesan error Supabase disamarkan dari client

### Pre-existing Constraints
- **Shadcn HSL + amikom tokens:** Dua sistem berjalan paralel, migrasi bertahap
- **Toaster:** Hanya di `(protected)/layout.tsx`, bukan di root layout
- **Rekomendasi:** skor akhir adalah Cosine Similarity; tidak ada bobot manual, CF, IPK, atau expected salary dalam matching.

---

## V. NEXT STEPS (Belum Dikerjakan)

| Prioritas | Item | Lokasi |
|---|---|---|
| 🔴 | ~~Apply migration 017~~ ✅ **Sudah di-apply & diverifikasi 2026-09-23** (10 permissions, 14 role_permissions, role profiles utuh) | Supabase (via SQL) |
| ~~🔴~~ | ~~Apply migration 016~~ — kolom live **sudah `text`**, run pertama gagal `text = boolean`; file diganti guarded DO-block (no-op jika sudah text) — tidak perlu di-apply | `supabase/migrations/016_fix_study_field_match_type.sql` |
| ~~🔴~~ | ~~Apply migration 015~~ ✅ **Sudah di-apply 2026-09-23** (constraint `scale` OK) | Supabase (via SQL) |
| 🟡 | Verifikasi checkbox & scale di form alumni setelah reload template — isi `/dashboard/tracer-study`, cek percabangan status & validasi wajib | `app/(protected)/dashboard/tracer-study/page.tsx` |
| 🔴 | Setup Supabase Storage bucket `content` (public) — wajib sebelum upload gambar bisa berfungsi | Supabase Dashboard → Storage → New bucket |
| 🔴 | Jalankan migration 010 di Supabase SQL Editor (`010_add_graduation_year.sql`) | `supabase/migrations/010_add_graduation_year.sql` |
| 🔴 | Jalankan migration 012 di Supabase SQL Editor (`012_tracer_study_history.sql`) | `supabase/migrations/012_tracer_study_history.sql` |
| 🔴 | Jalankan migration 013 di Supabase SQL Editor (`013_admin_activity_logs.sql`) | `supabase/migrations/013_admin_activity_logs.sql` |
| 🟢 | Bug #6: Perbaiki gradient CTA (`from-amikom-purple` ke `to-amikom-purple-hover` terlalu subtle) | `app/page.tsx` |
| 🟢 | Bug #8: Perbaiki FAQ accordion height:auto micro-flash | `components/landing/faq-section.tsx` |
| 🟡 | Dashboard `career/page.tsx` — belum pakai `PageHeader` dan tidak konsisten dengan template layout | `app/(protected)/dashboard/career/page.tsx` |
| 🟡 | Ekstrak `AlumniModal`, `AlumniCardItem`, helper ke file terpisah — network page 574 lines terlalu besar | `app/(protected)/dashboard/network/page.tsx` |
| 🟡 | Tambah field LinkedIn URL ke profile form + CV header | `types/database.ts`, migration, profile page, CV template |
| 🟡 | Tambah field pendidikan (IPK, periode studi, fokus studi) ke profile + CV | `types/database.ts`, migration, profile page, CV template |
| 🟡 | Bikin input bullet points terpisah di form track record (bukan 1 textarea) | `app/(protected)/dashboard/track-record/page.tsx` |
| 🟡 | Poles CV template EN — pastikan paragraf fokus studi sesuai bahasa | `components/cv/cv-template.tsx` |
| 🟢 | Tambah `not-found.tsx` di root app — custom 404 halaman | `app/not-found.tsx` |
| ~~🔴~~ | ~~Apply migration 019~~ ✅ **Sudah di-apply & diverifikasi 2026-09-23** (roles 2, 8 profil utuh, 15 mapping, enum hilang, 5 policy) — fix error 0A000: drop+recreate policy `user: update own profile` | `supabase/migrations/019_dynamic_roles.sql` |
| 🟡 | Smoke test UI phase 3 **setelah Deploy Preview PR #3 hijau**: login 3 super_user, alumni tetap `/dashboard`, buat role `humas_staff` → assign user → sidebar terfilter & aksi lain ditolak; cek Ubah Role & dropdown add-user; verifikasi 5 area QA | — |
| 🔴 | Rotate password `superadmin@amikomsolo.ac.id` (+ akun demo) — masih `password` | Supabase / aplikasi |
| 🟡 | Fix CI trigger: `.github/workflows/ci.yml` branch `master` → `main`/`dimah` agar pre-flight jalan otomatis | `.github/workflows/ci.yml` |

### Fixed Bugs
- **CV Preview dialog kosong:** Data fetching ditaruh di `onOpenChange` handler, tapi Radix UI Dialog cuma manggil `onOpenChange` saat user menutup dialog, bukan saat parent set `open={true}`. Dipindah ke `useEffect` — `components/cv/cv-preview-dialog.tsx:150-172`

---

## VI. BUILD COMMANDS & PRE-DEPLOYMENT VERIFICATION

Sebelum commit / deploy ke Netlify, jalankan perintah pre-flight berikut:
```bash
npx tsc --noEmit     # TypeScript typecheck (0 error)
npx next lint        # ESLint check (0 warning/error)
npm run build        # Production build verification (39/39 routes berhasil)
npm run dev          # Development server
npx jest             # Test suite
```

