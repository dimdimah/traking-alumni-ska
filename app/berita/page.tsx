import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LandingNavbar } from '@/components/landing/landing-navbar'
import { ContentImage } from '@/components/landing/content-image'
import type { Berita } from '@/types/database'

export const metadata = {
  title: 'Info & Berita Alumni — UNIKOM STMIK AMIKOM Surakarta',
  description: 'Update terbaru seputar Alumni STMIK AMIKOM Surakarta. Berita akademik, peluang karir, kabar kampus, dan perkembangan teknologi.',
  alternates: {
    canonical: '/berita',
  },
  openGraph: {
    title: 'Info & Berita Alumni — UNIKOM STMIK AMIKOM Surakarta',
    description: 'Update berita, agenda, dan informasi seputar karir dan alumni STMIK AMIKOM Surakarta.',
    url: '/berita',
  },
}

export default async function BeritaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: items } = await supabase
    .from('berita')
    .select('id, judul, slug, kategori, ringkasan, tanggal, gambar_url')
    .eq('status', 'published')
    .order('tanggal', { ascending: false })

  const beritaItems = (items ?? []) as Pick<Berita, 'id' | 'judul' | 'slug' | 'kategori' | 'ringkasan' | 'tanggal' | 'gambar_url'>[]

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
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amikom-purple mb-3">Update Terbaru</p>
          <h2 className="text-[32px] md:text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] text-amikom-ink">
            Info & Berita.
          </h2>
        </div>

        {beritaItems.length === 0 ? (
          <div className="rounded-2xl border border-amikom-hairline bg-white p-12 text-center">
            <p className="text-sm text-amikom-ink-muted-48">Belum ada berita yang dipublikasikan.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
            {beritaItems.map((item) => (
              <Link key={item.id} href={`/berita/${item.slug}`} className="block group h-full">
                <div className="flex flex-col h-full rounded-2xl bg-white border border-amikom-hairline overflow-hidden transition-all hover:border-amikom-purple/30 hover:shadow-lg hover:shadow-amikom-purple/5">
                  <div className="relative h-48 w-full overflow-hidden">
                    <ContentImage
                      src={item.gambar_url}
                      alt={item.judul}
                      category={item.kategori}
                      imageHeight="h-48"
                      imageClassName="transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <p className="text-[13px] text-amikom-ink-muted-48 mb-2 font-medium">
                      {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                     <h3 className="text-[18px] font-semibold leading-[1.3] tracking-[-0.01em] text-amikom-ink mb-3 group-hover:text-amikom-purple transition-colors min-h-[56px] line-clamp-2">
                       {item.judul}
                     </h3>
                    <p className="text-[14px] leading-[1.6] text-amikom-ink-muted-48 line-clamp-3 mt-auto">
                      {item.ringkasan}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
    </>
  )
}
