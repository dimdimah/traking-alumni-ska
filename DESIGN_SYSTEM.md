# SITRACK Design System

> Amikom design language · Amikom brand colors · STMIK AMIKOM Surakarta Solo

Sistem desain ini mengadaptasi bahasa visual Apple dengan warna identitas resmi STMIK AMIKOM Surakarta Solo.
Filosofi: UI meresap ke latar, konten berbicara. Satu aksen interaktif: **Amikom Purple**.

---

## 1. Colors

### Primary — Satu Aksen Interaktif

| Token | Tailwind | Hex | Peran |
|---|---|---|---|
| `--primary` | `bg-amikom-purple` | `#700070` | Semua elemen interaktif |
| `--primary-hover` | `bg-amikom-purple-hover` | `#580058` | Press/hover state |
| `--primary-focus` | `ring-amikom-purple-focus` | `#4A1B9D` | Focus ring keyboard |
| `--primary-on-dark` | `text-amikom-purple-bright` | `#9B30FF` | Link di atas dark tile |
| `--primary-light` | `bg-amikom-purple-light` | `#f0d4f0` | Background subtle |
| `--primary-dim` | `bg-amikom-purple-dim` | `rgba(112,0,112,0.06)` | Hover subtle |
| `--primary-glow` | `bg-amikom-purple-glow` | `rgba(112,0,112,0.12)` | Glow effect |

### Secondary — Dekoratif Saja (Tidak untuk Interaksi)

| Token | Tailwind | Hex | Peran |
|---|---|---|---|
| `--secondary` | `text-amikom-jonquil` | `#FFCC00` | Badge, label highlight |
| `--secondary-warm` | `text-amikom-jonquil-warm` | `#FFAC00` | Energi, achievement |
| `--secondary-vivid` | `text-amikom-jonquil-vivid` | `#FF7900` | Urgensi, status kritis |

### Surface

| Token | Tailwind | Hex | Peran |
|---|---|---|---|
| `--canvas` | `bg-amikom-canvas` | `#ffffff` | Canvas utama, card background |
| `--parchment` | `bg-amikom-parchment` | `#f5f5f7` | Off-white Apple |
| `--pearl` | `bg-amikom-pearl` | `#fafafc` | Pearl button, primary page background |
| `--tile-1` | `bg-amikom-tile-1` | `#272729` | Dark tile primer |
| `--tile-2` | `bg-amikom-tile-2` | `#2a2a2c` | Dark tile sekunder |
| `--tile-3` | `bg-amikom-tile-3` | `#252527` | Dark tile tersier |
| `--surface-black` | `bg-amikom-black` | `#000000` | Legacy dark nav, video |
| `--chip` | `bg-amikom-chip` | `rgba(210,210,215,0.64)` | Chip background |

### Soft White — Light Page Palette (v2)

Palet ini digunakan untuk **Landing Page** dan **Login Page** agar tidak menyilaukan mata.
Background tidak pernah menggunakan pure `#ffffff` secara full-page — hanya untuk card/komponen.

| Deskripsi | Amikom Token | Hex | Peran |
|---|---|---|---|
| Page background | `bg-amikom-pearl` | `#FAFBFC` | Primary page background (landing, login) |
| Section alt | `bg-amikom-parchment` | `#F2F3F5` | Alternating section background |
| Border | `border-amikom-hairline` | `#E8E8ED` | Soft border untuk card & nav |
| Heading | `text-amikom-ink` | `#1A1A1E` | Primary heading & text (soft black) |
| Body | `text-amikom-ink-muted-48` | `#5A5A6E` | Body copy & subtitle |
| Muted | `text-amikom-ink-muted-48` | `#8E8E93` | Muted label, fine print |
| Nav glass | `bg-white/80 backdrop-blur-sm` | — | Frosted glass navigation bar |
| Purple dim | `bg-amikom-purple-dim` | — | Nav button, subtle purple tint |

**Aturan pemakaian:**
- Page background: `bg-amikom-pearl` (jangan `bg-amikom-canvas` full-page)
- Card/component: `bg-amikom-canvas` dengan border `border-amikom-hairline`
- Heading: `text-amikom-ink` (bukan `text-black`)
- Body copy: `text-amikom-ink-muted-48` (bukan `text-amikom-ink`)
- Nav link: `text-amikom-ink-muted-48`, hover → `text-amikom-ink` atau `text-amikom-purple`

**Mapping ke hardcoded hex (referensi):**
| Hex | Amikom Token |
|---|---|
| `#FAFBFC` | `bg-amikom-pearl` |
| `#F2F3F5` | `bg-amikom-parchment` |
| `#E8E8ED` | `border-amikom-hairline` |
| `#1A1A1E` | `text-amikom-ink` |
| `#5A5A6E` | `text-amikom-ink-muted-48` |
| `#8E8E93` | `text-amikom-ink-muted-48` |

### Text

| Token | Tailwind | Hex | Peran |
|---|---|---|---|
| `--ink` | `text-amikom-ink` | `#1d1d1f` | Teks utama light surface |
| `--on-dark` | `text-amikom-on-dark` | `#ffffff` | Teks di dark tile |
| `--muted` | `text-amikom-muted` | `#cccccc` | Secondary copy dark tile |
| `--ink-muted-80` | `text-amikom-ink-muted-80` | `#333333` | Pearl button text |
| `--ink-muted-48` | `text-amikom-ink-muted-48` | `#7a7a7a` | Disabled, fine-print |

### Borders

| Token | Tailwind | Hex | Peran |
|---|---|---|---|
| `--divider-soft` | `border-amikom-divider-soft` | `#f0f0f0` | Border subtle |
| `--hairline` | `border-amikom-hairline` | `#e0e0e0` | Border 1px card |

### Semantic (Dashboard)

| Token | Tailwind | Hex | Peran |
|---|---|---|---|
| `--danger` | `text-amikom-danger` | `#ef4444` | Error/destructive |
| `--danger-bg` | `bg-amikom-danger-bg` | `#fef2f2` | Latar error |
| `--warning` | `text-amikom-warning` | `#f59e0b` | Warning |
| `--warning-bg` | `bg-amikom-warning-bg` | `#fffbeb` | Latar warning |
| `--success` | `text-amikom-success` | `#22c55e` | Success |
| `--success-bg` | `bg-amikom-success-bg` | `#f0fdf4` | Latar success |

---

## 2. Tipografi

| Style | Size | Weight | Line Height | Letter Spacing | Penggunaan |
|---|---|---|---|---|---|
| Page Title | 30px / 36px | 600 | 1.1 | -0.03em | Judul halaman dashboard |
| Hero Display | 56px | 600 | 1.07 | -0.28px | Headline hero landing |
| Display LG | 40px | 600 | 1.10 | 0 | Headline tile |
| Display MD | 34px | 600 | 1.47 | -0.374px | Section head |
| Lead | 28px | 400 | 1.14 | 0 | Subcopy |
| Lead Airy | 24px | 300 | 1.5 | 0 | Lead paragraph |
| Tagline | 21px | 600 | 1.19 | 0.231px | Sub-nav kategori |
| Body Strong | 17px | 600 | 1.24 | -0.374px | Inline strong |
| Body | 17px | 400 | 1.47 | -0.374px | Paragraf default |
| Caption | 14px | 400 | 1.43 | -0.224px | Secondary copy |
| Caption Strong | 14px | 600 | 1.29 | -0.224px | Label heading |
| Button Utility | 14px | 400 | 1.29 | -0.224px | Nav button label |
| Section Label | 11px | 400 | 1.0 | wider | Label section (mono, uppercase) |
| Fine Print | 12px | 400 | 1.0 | -0.12px | Legal, footer |
| Nav Link | 12px | 400 | 1.0 | -0.12px | Global nav item |

### Page Title (Dashboard Pages)

```tsx
// Judul halaman — dipakai via PageHeader
"font-sans text-3xl md:text-4xl font-semibold tracking-[-0.03em] text-amikom-ink leading-[1.1]"
```

### Section Label (Label di dalam card/form)

```tsx
// Label section — ukuran standar
"font-mono text-[11px] uppercase tracking-wider text-slate-500"
```

### Font Families
- `font-sans` → **Geist** via `var(--font-geist-sans)` (fallback: system-ui, -apple-system)
- `font-display` → **Geist** via `var(--font-geist-sans)` (headline, tighter tracking)
- `font-mono` → **Geist Mono** via `var(--font-geist-mono)` (angka, label teknis, statistik)

### Prinsip
- Letter-spacing negatif pada display size (≥17px) → "Apple tight"
- Body copy pada 17px, bukan 16px
- Weight: 300 / 400 / 600 / 700 (500 sengaja tidak ada)
- Section label: `text-[11px]` (bukan `text-[10px]`)

### Kapan pakai `text-[10px]` vs `text-[11px]`

| Ukuran | Konteks | Contoh |
|---|---|---|
| `text-[11px]` | **Section label** — `font-mono uppercase tracking-wider` | "Edit Profile", "Data Kelulusan", quick link labels |
| `text-[11px]` | Badge/chip text | Skill tags, status badges |
| `text-[10px]` | **Table header** — `font-mono uppercase tracking-wider font-semibold` | Kolom tabel (Email, Nama, NIM) |
| `text-[10px]` | Stat card value label | Angka stat kecil, tanggal |

---

## 3. Layout

### Page Template (Dashboard)

Setiap halaman dashboard WAJIB mengikuti struktur ini:

```tsx
<div className="page-container space-y-8 pb-8">
  <PageHeader
    icon={<span className="text-[11px]">◆</span>}
    label="Label"
    title="Judul Halaman."
    subtitle="Deskripsi singkat."
    action={<button>+ Tambah</button>}
  />

  {/* ─── Baris konten 1 ─── */}
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
    ...
  </div>

  {/* ─── Baris konten 2 ─── */}
  <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
    ...
  </div>
</div>
```

**Aturan animasi:**
- `0s` → PageHeader (built-in)
- `0.05s` → Baris pertama setelah header
- `0.1s` → Baris kedua
- `0.12s`, `0.15s` → Baris selanjutnya (increment 0.03-0.05s)

### Form Layout Pattern

```tsx
<div className="max-w-2xl space-y-8">
  {/* Card form */}
  <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
    {/* Section divider */}
    <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-6">
      Judul Section
    </p>

    {/* Grid field */}
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-2">
        <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">
          Label Field
        </label>
        <Input ... />
      </div>
    </div>

    {/* Submit */}
    <div className="mt-6 flex items-center gap-3 justify-end">
      <button type="button" onClick={onCancel}
        className="rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-all hover:border-slate-300 hover:text-slate-900">
        Batal
      </button>
      <button type="submit"
        className="rounded-md bg-amikom-purple px-5 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98] hover:bg-amikom-purple-hover hover:text-amikom-jonquil-warm">
        Simpan
      </button>
    </div>
  </div>
</div>
```

### Table Pattern

```tsx
<div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
  <table className="w-full">
    <thead>
      <tr className="border-b border-slate-200">
        <th className="px-6 py-3.5 text-left text-[10px] font-semibold font-mono uppercase tracking-wider text-slate-500">
          Nama Kolom
        </th>
        <th className="px-6 py-3.5 text-center text-[10px] font-semibold font-mono uppercase tracking-wider text-slate-500">
          Aksi
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-100">
      {items.map((item) => (
        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
          <td className="px-6 py-4 text-sm text-slate-900">...</td>
          <td className="px-6 py-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => handleEdit(item)} className="...">Edit</button>
              <button onClick={() => setDeleteConfirm(item.id)} className="...">Hapus</button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### Empty State Pattern

```tsx
<div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
  <span className="text-3xl text-slate-500">📋</span>
  <p className="mt-4 text-sm text-slate-500">Belum ada data.</p>
  <button onClick={openAdd}
    className="mt-4 rounded-md bg-amikom-purple px-5 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98]">
    + Tambah
  </button>
</div>
```

### Loading State Pattern

```tsx
<div className="flex items-center justify-center py-16">
  <div className="h-6 w-6 animate-spin rounded-full border-2 border-amikom-purple border-t-transparent" />
  <span className="ml-3 text-sm text-slate-500">Memuat data...</span>
</div>
```

### Spacing

| Token | Value |
|---|---|
| `spacing.xxs` | 4px |
| `spacing.xs` | 8px |
| `spacing.sm` | 12px |
| `spacing.md` | 17px |
| `spacing.lg` | 24px |
| `spacing.xl` | 32px |
| `spacing.xxl` | 48px |
| `spacing.section` | 80px |

### Container
- Halaman dashboard: `.page-container` (padding horizontal 20-24px, max-width sesuai)
- Max content: `1440px` (product grid), `980px` (text-heavy section)
- Gutter: 20–24px
- Section padding vertikal: `80px`

### Border Radius

| Token | Value | Penggunaan |
|---|---|---|
| `rounded-xs` | 5px | Inline chip |
| `rounded-sm` | 8px | Utility button |
| `rounded-md` | 11px | Pearl button / form input |
| `rounded-lg` | 18px | Card |
| `rounded-pill` | 9999px | Primary CTA, search input |

---

## 4. Komponen

### PageHeader (Reusable)

Digunakan di **12+ halaman** sebagai pengganti pola header manual.

```tsx
import { PageHeader } from '@/components/ui/page-header'

<PageHeader
  icon={<span className="text-[11px]">◆</span>}
  label="Label"
  title="Judul Halaman."
  subtitle="Deskripsi singkat."
  action={<button className="...">+ Tambah</button>}
/>
```

**Props:**
| Prop | Type | Required | Deskripsi |
|---|---|---|---|
| `icon` | `ReactNode` | ✅ | Icon di dalam wrapper purple |
| `label` | `string` | ✅ | Label mono uppercase (11px) |
| `title` | `string` | ✅ | Judul halaman (30-36px) |
| `subtitle` | `string` | ✅ | Deskripsi di bawah judul |
| `action` | `ReactNode` | ❌ | Tombol/elemen aksi di kanan |

**Varian aksi:**
- Tombol "+ Tambah" (kuesioner, career-center, super-user/users)
- Filter select tahun (admin/analytics)
- Tanpa action (dashboard, profile, tracer-study)

### Buttons

**Primary**
```tsx
className="rounded-md bg-amikom-purple px-5 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98] hover:bg-amikom-purple-hover hover:text-amikom-jonquil-warm"
```

**Primary Pill (Landing)**
```tsx
className="rounded-pill bg-amikom-purple px-7 py-2.5 text-[17px] font-normal text-white transition-all hover:bg-amikom-purple-hover active:scale-[0.95]"
```

**Secondary Ghost Pill**
```tsx
className="rounded-pill border border-amikom-purple px-7 py-2.5 text-[17px] font-normal text-amikom-purple transition-all hover:bg-amikom-purple/5 active:scale-[0.95]"
```

**Dark Utility**
```tsx
className="rounded-sm bg-amikom-ink px-3.5 py-1.5 text-xs font-medium text-amikom-on-dark transition-all hover:bg-amikom-ink/90 active:scale-[0.95]"
```

**Outline**
```tsx
className="rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-all hover:border-slate-300 hover:text-slate-900 flex items-center gap-2"
```

**Export Button**
```tsx
className="rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-all hover:border-slate-300 hover:text-slate-900 flex items-center gap-2"
```

### Cards

**Standard Card**
```tsx
className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
```

**Quick Link Card**
```tsx
<Link href="..." className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-sm hover:-translate-y-0.5 block">
  <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Label</p>
  <h3 className="font-sans text-lg font-semibold text-slate-900 mt-2">Judul</h3>
  <p className="text-sm text-slate-600 mt-1">Deskripsi.</p>
</Link>
```

**Dark Stat Card**
```tsx
className="rounded-lg bg-amikom-tile-2 border border-amikom-glass-border px-6 py-6 text-center"
```

### AlertDialog (Delete Confirmation)

Menggantikan `confirm()` native untuk aksesibilitas dan konsistensi UI.

```tsx
// State
const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

// Trigger
<button onClick={() => setDeleteConfirm(id)}>Hapus</button>

// Dialog
<AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
  <AlertDialogHeader>
    <AlertDialogTitle>Hapus [item]?</AlertDialogTitle>
    <AlertDialogDescription>Tindakan tidak dapat dibatalkan.</AlertDialogDescription>
  </AlertDialogHeader>
  <AlertDialogFooter>
    <AlertDialogCancel>Batal</AlertDialogCancel>
    <AlertDialogAction onClick={handleDelete} className="bg-red-600">Hapus</AlertDialogAction>
  </AlertDialogFooter>
</AlertDialog>
```

### Promise-based Toast untuk Delete

Memberikan feedback loading/success/error yang lebih baik.

```tsx
async function handleDelete() {
  if (!deleteConfirm) return
  const promise = deleteItem(deleteConfirm)
  toast.promise(promise, {
    loading: 'Menghapus...',
    success: () => {
      setDeleteConfirm(null)
      loadItems()
      return 'Item berhasil dihapus'
    },
    error: (err) => err instanceof Error ? err.message : 'Terjadi kesalahan',
  })
}
```

### Inputs

**Text Input**
```tsx
className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20"
```

**Search Input**
```tsx
className="w-full rounded-pill border border-amikom-hairline bg-amikom-canvas px-10 py-2.5 text-sm ..."
```

**Password Toggle**
```tsx
<div className="relative">
  <Input type={showPassword ? 'text' : 'password'} className="pr-10" />
  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900"
  >
    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
  </button>
</div>
```

### Badge

```tsx
<Badge variant="default">     // Amikom Purple bg, white text
<Badge variant="secondary">   // Parchment bg, muted text
<Badge variant="accent">      // Jonquil bg, decorative
<Badge variant="warning">     // Amber bg
<Badge variant="destructive"> // Red bg
<Badge variant="success">     // Green bg
```

### Interactive Card (Job List)

Untuk kartu yang bisa diklik, gunakan `role="button"` + keyboard handler:

```tsx
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() }}}
  onClick={handleClick}
  className="... cursor-pointer"
>
```

### Navigation

**Global Nav — Dark (Legacy)** — 44px, `bg-amikom-black`, text 12px
**Global Nav — Light (v2)** — 44px, `bg-white/80 backdrop-blur-sm border-b border-amikom-hairline`, text `text-amikom-ink` / `text-amikom-ink-muted-48`
**Sub-nav Frosted** — 52px, `bg-amikom-parchment/80 backdrop-blur-xl`

**Light Nav Pattern:**
```tsx
// Navbar
className="sticky top-0 z-50 h-11 bg-white/80 backdrop-blur-sm border-b border-amikom-hairline"

// Brand link
className="text-amikom-ink text-xs font-semibold hover:text-amikom-purple transition-colors"

// Nav links
className="text-amikom-ink-muted-48 text-xs hover:text-amikom-purple transition-colors"

// Masuk button
className="rounded-sm bg-amikom-purple/10 px-3.5 py-1.5 text-xs font-medium text-amikom-purple hover:bg-amikom-purple/20"
```

### Page Consolidation Pattern

Untuk menghindari dual component dengan fungsi sama, gunakan redirect:

```tsx
// Server Component — redirect ke canonical page
import { redirect } from 'next/navigation'

export default function DeprecatedPage() {
  redirect('/canonical-path')
}
```

**Canonical pages:**
| Fungsi | Canonical | Redirect dari |
|---|---|---|
| Profile | `/dashboard/profile` | `/user/profile` |
| Add user | `/admin/add-user` | `/super-user/add-user` |

---

## 5. Shadows

| Token | Value | Penggunaan |
|---|---|---|
| `shadow-card` | `0 1px 2px rgba(0,0,0,0.05)` | Utility card (dashboard) |
| `shadow-product` | `0 3px 5px 30px rgba(0,0,0,0.22)` | Product render / logo hero |

**Filosofi:** Satu drop-shadow pada product render saja. Tidak ada shadow pada card, button, atau teks di landing page. Dashboard card menggunakan `shadow-sm` (Tailwind default).

---

## 6. Animasi

| Class | Efek |
|---|---|
| `animate-fade-in-up` | Fade + geser 16px ke atas, 0.6s, `ease-out both` |
| `animate-fade-in` | Fade in, 0.5s, `ease-out both` |
| `animate-press` | Scale 0.95, 0.1s |
| `active:scale-[0.98]` | Press state pada semua button dashboard |
| `active:scale-[0.95]` | Press state pada landing page button |

**Delay bertahap (untuk animasi grid/list):**
```tsx
style={{ animationDelay: '0s' }}    // Header
style={{ animationDelay: '0.05s' }} // Card pertama
style={{ animationDelay: '0.1s' }}  // Card kedua
```

---

## 7. Responsive Breakpoints

| Nama | Lebar | Perubahan |
|---|---|---|
| Phone | ≤ 640px | Single column, hero 34px |
| Tablet | 641–1023px | 2-column grid |
| Desktop | ≥ 1024px | Layout penuh, 3-column grid |

---

## 8. Do's and Don'ts

### Do
- Gunakan `amikom-purple` untuk SEMUA elemen interaktif
- Jonquil hanya untuk badge/dekorasi non-interaktif
- `active:scale-[0.98]` pada setiap button dashboard (landing: `active:scale-[0.95]`)
- Gunakan `<PageHeader>` component untuk header halaman
- Gunakan `text-[11px]` untuk section label, `text-[10px]` hanya untuk table header
- Gunakan `tracking-wider` (bukan `tracking-[0.25em]`) pada label mono uppercase
- Gunakan `toast.promise()` untuk operasi delete
- Gunakan `<AlertDialog>` untuk konfirmasi delete (bukan `confirm()`)
- Gunakan `role="button"` + `tabIndex={0}` + `onKeyDown` untuk kartu interaktif
- Redirect halaman deprecated ke canonical page (Server Component)
- Alternasikan light ↔ dark tile untuk pemisah section
- Body copy 17px, bukan 16px
- Page background: `bg-amikom-pearl`, card: `bg-amikom-canvas`
- Heading: `text-amikom-ink`, body: `text-amikom-ink-muted-48`
- Nav light: `bg-white/80 backdrop-blur-sm` dengan border `border-amikom-hairline`

### Don't
- Jangan gunakan Jonquil untuk button/link
- Jangan tambahkan shadow pada card/button (kecuali dashboard `shadow-sm`)
- Jangan gunakan gradient dekoratif
- Jangan gunakan weight 500
- Jangan gunakan `bg-amikom-canvas` (`#ffffff`) sebagai full-page background
- Jangan gunakan `text-black` atau `#000000` sebagai teks di light surface
- Jangan gunakan dark nav di halaman yang sudah light (inkonsisten)
- Jangan buat dual component untuk fungsi yang sama — gunakan redirect
- Jangan gunakan `text-[10px]` untuk section label, gunakan `text-[11px]`
- Jangan gunakan `confirm()` native — gunakan `<AlertDialog>`

---

## 9. CSS Variable Reference

```css
/* Primary */
--primary: #700070;
--primary-hover: #580058;
--primary-focus: #4A1B9D;
--primary-on-dark: #9B30FF;
--primary-light: #f0d4f0;

/* Secondary */
--secondary: #FFCC00;

/* Surface */
--canvas: #ffffff;
--parchment: #f5f5f7;
--pearl: #fafafc;
--tile-1: #272729;
--tile-2: #2a2a2c;
--tile-3: #252527;
--black: #000000;
--chip: rgba(210, 210, 215, 0.64);

/* Soft White (v2) → gunakan amikom tokens */
--pearl: #FAFBFC;       → bg-amikom-pearl
--parchment: #F2F3F5;   → bg-amikom-parchment
--hairline: #E8E8ED;    → border-amikom-hairline
--ink: #1A1A1E;          → text-amikom-ink
--ink-muted-48: #5A5A6E; → text-amikom-ink-muted-48

/* Text */
--ink: #1d1d1f;
--on-dark: #ffffff;
--muted: #cccccc;
--ink-muted-80: #333333;
--ink-muted-48: #7a7a7a;

/* Semantic */
--danger: #ef4444;
--danger-bg: #fef2f2;
--warning: #f59e0b;
--warning-bg: #fffbeb;
--success: #22c55e;
--success-bg: #f0fdf4;

/* Borders */
--divider-soft: #f0f0f0;
--hairline: #e0e0e0;
```
