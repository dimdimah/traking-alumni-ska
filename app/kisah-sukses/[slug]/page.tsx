import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import { LandingNavbar } from '@/components/landing/landing-navbar'
import { MessageCircle, Mail } from 'lucide-react'
import { notFound } from 'next/navigation'
import type { KisahSukses } from '@/types/database'

const AVATAR_FALLBACK = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=150'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, 'dan')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('kisah_sukses')
    .select('nama_alumni, kutipan, foto_url, cerita')
    .eq('status', 'published')
    .single()

  const story = data as Pick<KisahSukses, 'nama_alumni' | 'kutipan' | 'foto_url' | 'cerita'> | null

  if (!story) {
    return { title: 'Kisah Sukses Tidak Ditemukan — UNIKOM' }
  }

  return {
    title: `Kisah Sukses ${story.nama_alumni} — UNIKOM`,
    description: story.kutipan,
    openGraph: {
      title: `Kisah Sukses ${story.nama_alumni}`,
      description: story.kutipan,
      images: story.foto_url ? [story.foto_url] : [],
    },
  }
}

export default async function KisahSuksesDetailPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: items } = await supabase
    .from('kisah_sukses')
    .select('*')
    .eq('status', 'published')

  const all = (items ?? []) as KisahSukses[]
  const story = all.find((item) => slugify(item.nama_alumni) === params.slug) ?? null

  if (!story) {
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

  return (
    <>
      <LandingNavbar variant="public" isLoggedIn={isLoggedIn} dashboardHref={dashboardHref} />
      <section className="bg-amikom-pearl pt-[100px] pb-[80px] lg:pt-[120px] lg:pb-[120px] scroll-mt-20">
        <div className="mx-auto max-w-[780px] px-6 lg:px-12">
          
          {/* 1. Judul */}
          <h1 className="text-[28px] md:text-[36px] font-semibold leading-[1.2] tracking-[-0.02em] text-amikom-ink mb-4">
            Kisah Sukses {story.nama_alumni}
          </h1>

          {/* 2. Meta Info */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amikom-purple bg-amikom-purple/10 rounded-full px-3 py-1">
              {story.prodi}
            </span>
            <span className="text-[13px] text-amikom-ink-muted-48 font-medium">
              Angkatan {story.angkatan}
            </span>
            <span className="text-[13px] text-amikom-ink-muted-48 font-medium">
              {story.posisi_sekarang} di {story.perusahaan}
            </span>
          </div>

          {/* 3. Share Buttons */}
          <div className="flex items-center justify-end gap-1 mb-6">
            <ShareButtons title={`Kisah Sukses ${story.nama_alumni}`} slug={params.slug} />
          </div>

          {/* 4. Avatar */}
          <div className="flex justify-center mb-6">
            <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-full overflow-hidden border-4 border-white shadow-lg">
              <Image
                src={story.foto_url || AVATAR_FALLBACK}
                alt={story.nama_alumni}
                width={200}
                height={200}
                className="h-full w-full object-cover"
                priority
              />
            </div>
          </div>

          {/* 5. Caption */}
          <p className="text-[12px] text-slate-400 text-center mt-2 mb-4">Foto {story.nama_alumni}</p>

          {/* 6. Divider */}
          <div className="border-b border-amikom-hairline mb-8" />

          {/* 7. Kutipan */}
          <blockquote className="text-[20px] leading-[1.7] text-amikom-ink/90 italic mb-8 text-center">
            &ldquo;{story.kutipan}&rdquo;
          </blockquote>

          {/* 8. Isi Cerita */}
          <div className="text-[16px] leading-[1.8] text-amikom-ink-muted-48 whitespace-pre-line">
            {story.cerita}
          </div>
        </div>
      </section>
    </>
  )
}

function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://sitrack.amikomsolo.ac.id'}/kisah-sukses/${slug}`
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
