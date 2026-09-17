# ARCHITECTURE.md — SITRACK Technical Architecture

> Stack, data flow, auth flow, component hierarchy, dan pattern penting.

---

## I. TECH STACK

| Layer | Teknologi |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| UI Library | shadcn/ui + Tailwind CSS |
| Design Tokens | `amikom-*` custom tokens |
| Font | Geist (sans/display) + Geist Mono (mono) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (cookie-based SSR) |
| Validation | Zod (server-side + client-side) |
| Backend | Next.js Server Actions (RSC) |
| Testing | Jest + Testing Library |
| TF-IDF Engine | Custom (content-based recommendation) |

---

## II. AUTH FLOW

```
Request → Middleware (edge)
  ├── No session → allow /login, redirect protected → /login?next=<path>
  ├── Has session + /login → redirect ke role-based home
  │     super_user → /admin
  │     user → /dashboard
  └── Has session + protected → pass

Protected Layout (server)
  └── getCurrentProfile() → fetches dari Supabase
      └── Navbar, BottomBar, Toaster

Admin Layout (server)
  └── RoleGuard(allowedRoles=['super_user'])
      └── Jika bukan super_user → redirect ke /dashboard

Server Actions (protected)
  └── withAuth() → get user + client
      └── Redirect ke /login jika tidak authenticated
```

### Auth Clients
| Client | File | Use |
|---|---|---|
| `createClient()` (server) | `lib/supabase/server.ts` | Server Components, Server Actions |
| `createClient()` (client) | `lib/supabase/client.ts` | Browser (useEffect, event handlers) |
| `createMiddlewareClient()` | `lib/supabase/middleware.ts` | Edge Middleware |
| `createAdminClient()` | `lib/supabase/admin.ts` | Admin ops (service_role, bypass RLS) |

---

## III. ROUTE STRUCTURE

```
/(auth)           → No navbar, no guard
  /login          → Server Component + Client Form Island (login-form.tsx)

/public           → No navbar, no guard
  /berita         → Listing berita published (Server Component)
  /berita/[slug]  → Detail berita (Server Component)
  /sertifikasi    → Listing sertifikasi published (Server Component)
  /sertifikasi/[slug] → Detail sertifikasi (Server Component)
  /kisah-sukses/[slug] → Detail kisah sukses alumni (Server Component)

/(protected)      → Navbar + BottomBar + Toaster
  /admin/*        → RoleGuard(['super_user'])
    page.tsx      → Dashboard: stats + progress + recent alumni
    /alumni       → Tabel CRUD + AlertDialog
    /kuesioner    → Angkatan list → Questions CRUD + Export
    /career-center → CRUD lowongan + AlertDialog
    /analytics    → Charts + Filter
    /add-user     → Form create user
    /bulk-import  → CSV upload

  /dashboard/*    → Authenticated
    page.tsx      → Quick Actions + Account Info
    /track-record → CRUD pekerjaan + Pagination
    /profile      → Form edit + password + preview
    /tracer-study → Multi-step form / submitted view
    /career       → JobList component

  /user/*         → Regular user routes
    /rekomendasi  → Hasil matching
    /profile      → Redirect ke /dashboard/profile
    /lowongan     → JobList component

  /super-user/*   → Legacy (satu halaman)
    /users        → DataTable
    /add-user     → Redirect ke /admin/add-user
```

---

## IV. DATA FLOW

### Standard CRUD (Server Action Pattern)
```
Client Component → user interaction
  → Server Action (lib/actions/*.ts — 'use server')
    → Zod validation → Supabase query
    → revalidatePath() → response
  → Client: reload UI (loadItems via useEffect)
```

### Admin Delete Flow (with security)
```
User clicks "Hapus"
  → AlertDialog konfirmasi
  → toast.promise(
      deleteAction(id)    ← Server Action
        → withAuth() check
        → createAdminClient()  ← service_role key
        → auth.admin.deleteUser()
        → revalidatePath()
    )
```

### Job Recommendation Flow
```
User opens /user/rekomendasi
  → Server Action: getJobRecommendations()
    → Authenticated user → profile + track records + active jobs
    → Build profile document from seven criteria
      → program_studi
      → skills
      → track_records.position + track_records.description
      → certifications
      → job_interests
      → preferred_location
      → preferred_type
    → Build job document from title + description + skills + location + type
    → Preprocess: case folding → cleaning → tokenization → stopword removal
    → TF-IDF vectorization (profile vs each job)
    → Cosine similarity scoring
    → Sort by score descending → Top-N results
  → Return MatchResult[] with job and score only
```

### Sistem Alumni Submission
```
User fills multi-step form → Submit
  → Server Action: submitSistemAlumni()
    → Zod validation (conditional: company wajib jika Bekerja)
    → supabase.from('tracer_study_responses').upsert()
    → revalidatePath('/dashboard/tracer-study')
  → UI: submitted view (summary)
```

---

## V. KEY FILES

### Config & Setup
| File | Purpose |
|---|---|
| `tailwind.config.ts` | Design tokens, fonts, animations |
| `app/globals.css` | CSS variables, reset, animations |
| `middleware.ts` | Auth guard (edge) |
| `app/layout.tsx` | Root layout: fonts, SEO, JSON-LD |

### Auth
| File | Purpose |
|---|---|
| `lib/auth-actions.ts` | `login()`, `logout()` server actions |
| `lib/supabase/server.ts` | SSR Supabase client |
| `lib/supabase/client.ts` | Browser Supabase client |
| `lib/supabase/middleware.ts` | Edge middleware client |
| `lib/supabase/admin.ts` | Service role client |

### UI Components
| File | Purpose |
|---|---|
| `components/ui/page-header.tsx` | Reusable header (14 halaman) |
| `components/ui/modal.tsx` | Modal dialog |
| `components/ui/alert-dialog.tsx` | Delete confirmation |
| `components/navbar.tsx` | Top navigation |
| `components/job-list.tsx` | Job listings (shared) |
| `components/admin/add-user-form.tsx` | Create user form (canonical) |

### Server Actions
| File | Actions |
|---|---|
| `lib/actions/alumni.ts` | Stats, paginated users, reset password, delete user |
| `lib/actions/jobs.ts` | CRUD + toggle job listings |
| `lib/actions/questions.ts` | CRUD sistem alumni questions + analytics |
| `lib/actions/tracer-study.ts` | Submit/get sistem alumni response |
| `lib/actions/track-record.ts` | CRUD work history |
| `lib/actions/matching.ts` | Job recommendations + matching stats |
| `lib/actions/profile.ts` | Update profile, change password |
| `lib/actions/bulk-import.ts` | CSV bulk user import |
| `lib/actions/export.ts` | Excel export |

### Business Logic
| File | Purpose |
|---|---|
| `lib/tfidf.ts` | TF-IDF + cosine similarity engine |
| `lib/preprocessing.ts` | Text preprocessing (Indonesian stopwords) |
| `lib/schemas/*.ts` | Zod validation schemas |
| `lib/constants/index.ts` | Pilihan program studi, job interests, lokasi, tipe pekerjaan, dan enum legacy |

---

## VI. DESIGN SYSTEM (Ringkasan)

### Tokens
- **Aksen:** `amikom-purple (#700070)` — satu-satunya warna interaktif
- **Background:** `amikom-pearl (#FAFBFC)` untuk page, `amikom-canvas (#ffffff)` untuk card
- **Teks:** `amikom-ink (#1d1d1f)` heading, `amikom-ink-muted-48 (#7a7a7a)` body
- **Border:** `amikom-hairline (#e0e0e0)`

### Component Patterns
- **PageHeader** → Setiap halaman punya header reusable
- **AlertDialog** → Gantikan `confirm()` native
- **toast.promise()** → Loading/success/error untuk operasi delete
- **Interactive Card** → `role="button"` + `tabIndex={0}` + keyboard handler
- **Redirect** → Halaman deprecated pake Server Component redirect

---

## VII. PERFORMANCE NOTES

- Admin dashboard: **Server Component**, 4 data fetches paralel via `Promise.all()`
- Job recommendations: cached 1 jam via `unstable_cache` with tag `'matching'`
- Pagination: server-side (20 items/page untuk alumni, per-page untuk questions)
- No client-side state management (React state + prop drilling only)
- Login page: Server/Client split (form adalah Client Island)
