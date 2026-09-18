import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://alumni-amikomsolo.site'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, 'dan')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/berita`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/sertifikasi`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  try {
    const supabase = await createClient()

    // 1. Fetch published berita
    const { data: beritaData } = await supabase
      .from('berita')
      .select('slug, updated_at, tanggal')
      .eq('status', 'published')

    const beritaEntries: MetadataRoute.Sitemap = (beritaData || [])
      .filter((b) => Boolean(b.slug))
      .map((b) => ({
        url: `${BASE_URL}/berita/${b.slug}`,
        lastModified: b.updated_at ? new Date(b.updated_at) : (b.tanggal ? new Date(b.tanggal) : new Date()),
        changeFrequency: 'weekly',
        priority: 0.8,
      }))

    // 2. Fetch published sertifikasi
    const { data: sertifikasiData } = await supabase
      .from('sertifikasi')
      .select('slug, updated_at')
      .eq('status', 'published')

    const sertifikasiEntries: MetadataRoute.Sitemap = (sertifikasiData || [])
      .filter((s) => Boolean(s.slug))
      .map((s) => ({
        url: `${BASE_URL}/sertifikasi/${s.slug}`,
        lastModified: s.updated_at ? new Date(s.updated_at) : new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      }))

    // 3. Fetch published kisah sukses
    const { data: kisahData } = await supabase
      .from('kisah_sukses')
      .select('nama_alumni, updated_at')
      .eq('status', 'published')

    const kisahEntries: MetadataRoute.Sitemap = (kisahData || [])
      .filter((k) => Boolean(k.nama_alumni))
      .map((k) => ({
        url: `${BASE_URL}/kisah-sukses/${slugify(k.nama_alumni)}`,
        lastModified: k.updated_at ? new Date(k.updated_at) : new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      }))

    return [...staticPages, ...beritaEntries, ...sertifikasiEntries, ...kisahEntries]
  } catch {
    return staticPages
  }
}

