import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { LandingNavbar } from '@/components/landing/landing-navbar'
import { ContentImage } from '@/components/landing/content-image'
import { ExternalLink, MessageCircle, Mail } from 'lucide-react'
import { notFound } from 'next/navigation'
import type { Sertifikasi } from '@/types/database'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://alumni-amikomsolo.site'

const KATEGORI_FALLBACK: Record<string, string> = {
  'IT & Networking': 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=600',
  Programming: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=600',
  'Data Science': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600',
  Cloud: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=600',
  'Keamanan Siber': 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=600',
  Manajemen: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=600',
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('sertifikasi')
    .select('nama, deskripsi, icon_url, kategori, penyelenggara')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single()

  const cert = data as Pick<Sertifikasi, 'nama' | 'deskripsi' | 'icon_url' | 'kategori' | 'penyelenggara'> | null

  if (!cert) {
    return { title: 'Sertifikasi Tidak Ditemukan — UNIKOM' }
  }

  const pageUrl = `${SITE_URL}/sertifikasi/${params.slug}`
  const ogImage = cert.icon_url || `${SITE_URL}/api/og`

  return {
    title: `${cert.nama} — Sertifikasi IT UNIKOM`,
    description: cert.deskripsi,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type: 'website',
      locale: 'id_ID',
      url: pageUrl,
      title: `${cert.nama} — Sertifikasi ${cert.penyelenggara}`,
      description: cert.deskripsi,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: cert.nama,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${cert.nama} — UNIKOM`,
      description: cert.deskripsi,
      images: [ogImage],
    },
  }
}

export default async function SertifikasiDetailPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data } = await supabase
    .from('sertifikasi')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single()

  const cert = data as Sertifikasi | null

  if (!cert) {
    notFound()
  }

  let isLoggedIn = false
  let dashboardHref = '/dashboard'
  if (user) {
    isLoggedIn = true
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    if ((profile as { role: string } | null)?.role === 'super_user') {
      dashboardHref = '/admin'
    }
  }

  const certJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: cert.nama,
    description: cert.deskripsi,
    provider: {
      '@type': 'Organization',
      name: cert.penyelenggara,
    },
    educationalCredentialAwarded: cert.nama,
    courseCategory: cert.kategori,
    url: `${SITE_URL}/sertifikasi/${params.slug}`,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(certJsonLd) }}
      />
      <LandingNavbar variant="public" isLoggedIn={isLoggedIn} dashboardHref={dashboardHref} />
      <section className="bg-amikom-pearl pt-[100px] pb-[80px] lg:pt-[120px] lg:pb-[120px] scroll-mt-20">
        <div className="mx-auto max-w-[780px] px-6 lg:px-12">
          
          {/* 1. Judul */}
          <h1 className="text-[28px] md:text-[36px] font-semibold leading-[1.2] tracking-[-0.02em] text-amikom-ink mb-4">
            {cert.nama}
          </h1>

          {/* 2. Kategori & Level */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amikom-purple bg-amikom-purple/10 rounded-full px-3 py-1">
              {cert.kategori}
            </span>
            <span className="text-[13px] text-amikom-ink-muted-48 font-medium">
              {cert.level}
            </span>
            <span className="text-[13px] text-amikom-ink-muted-48 font-medium">
              {cert.penyelenggara}
            </span>
          </div>

          {/* 3. Share Buttons */}
          <div className="flex items-center justify-end gap-1 mb-6">
            <ShareButtons title={cert.nama} slug={params.slug} />
          </div>

          {/* 4. Hero Image / Icon */}
          <ContentImage
            src={cert.icon_url || undefined}
            alt={cert.nama}
            category={cert.kategori}
            categoryFallback={KATEGORI_FALLBACK[cert.kategori] || KATEGORI_FALLBACK['IT & Networking']}
            imageHeight="h-[300px] md:h-[400px]"
            priority
          />

          {/* 5. Caption Gambar */}
          <p className="text-[12px] text-slate-400 mt-2 mb-4">Logo {cert.penyelenggara}</p>

          {/* 6. Divider */}
          <div className="border-b border-amikom-hairline mb-8" />

          {/* 7. Isi Artikel */}
          <div className="text-[16px] leading-[1.8] text-amikom-ink-muted-48 whitespace-pre-line">
            {cert.deskripsi}
          </div>

          {cert.durasi_valid && (
            <div className="mt-6 rounded-2xl bg-white border border-amikom-hairline p-6">
              <h3 className="text-[16px] font-bold text-amikom-ink mb-3">Detail</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[12px] uppercase tracking-wider text-amikom-ink-muted-48">Durasi Valid</p>
                  <p className="text-[14px] font-medium text-amikom-ink mt-0.5">{cert.durasi_valid}</p>
                </div>
                <div>
                  <p className="text-[12px] uppercase tracking-wider text-amikom-ink-muted-48">Biaya</p>
                  <p className="text-[14px] font-medium text-amikom-ink mt-0.5">{cert.biaya || 'Hubungi penyelenggara'}</p>
                </div>
              </div>
              {cert.url_info && (
                <a
                  href={cert.url_info}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 text-[14px] font-semibold text-amikom-purple hover:text-amikom-purple-hover transition-colors"
                >
                  Info lebih lanjut
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  )
}

function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const url = `${SITE_URL}/sertifikasi/${slug}`
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const items = [
    {
      label: 'WhatsApp',
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      className: 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50',
    },
    {
      label: 'Facebook',
      icon: FacebookIcon,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50',
    },
    {
      label: 'X',
      icon: XIcon,
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      className: 'text-slate-900 hover:text-slate-700 hover:bg-slate-100',
    },
    {
      label: 'Email',
      icon: Mail,
      href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
      className: 'text-slate-600 hover:text-slate-700 hover:bg-slate-100',
    },
  ]

  return (
    <div className="flex items-center gap-1.5">
      {items.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Bagikan ke ${item.label}`}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${item.className}`}
        >
          <item.icon className="h-4 w-4" />
        </a>
      ))}
    </div>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

