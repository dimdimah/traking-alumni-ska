export const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  'track-record': 'Riwayat Kerja',
  'tracer-study': 'Tracer Study',
  career: 'Lowongan Kerja',
  profile: 'Profil',
  rekomendasi: 'Rekomendasi Kerja',
  network: 'Jaringan Alumni',
  lowongan: 'Lowongan Kerja',
  admin: 'Admin',
  alumni: 'Manajemen Alumni',
  kuesioner: 'Tracer Study',
  'career-center': 'Lowongan Kerja',
  analytics: 'Analitik',
  'bulk-import': 'Import CSV',
  'add-user': 'Tambahkan Alumni',
  content: 'Manajemen Konten',
  berita: 'Berita',
  sertifikasi: 'Sertifikasi',
  'kisah-sukses': 'Kisah Sukses',
  faq: 'FAQ',
  'super-user': 'Super User',
  users: 'Manajemen User',
}

export interface BreadcrumbItem {
  label: string
  href: string
  isLast: boolean
}

export function resolveBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return []

  const items: BreadcrumbItem[] = []

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    const label = routeLabels[segment]
    if (!label) continue

    const href = '/' + segments.slice(0, i + 1).join('/')
    items.push({ label, href, isLast: i === segments.length - 1 })
  }

  return items
}
