import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LandingNavbar } from '@/components/landing/landing-navbar'
import { ContentImage } from '@/components/landing/content-image'
import type { Sertifikasi } from '@/types/database'

const KATEGORI_FALLBACK: Record<string, string> = {
  'IT & Networking': 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=600',
  Programming: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=600',
  'Data Science': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600',
  Cloud: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=600',
  'Keamanan Siber': 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=600',
  Manajemen: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=600',
}

export const metadata = {
  title: 'Sertifikasi IT — UNIKOM',
  description: 'Tingkatkan daya saing Anda dengan sertifikasi profesional yang direkomendasikan untuk lulusan AMIKOM.',
}

export default async function SertifikasiPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: items } = await supabase
    .from('sertifikasi')
    .select('id, nama, slug, penyelenggara, kategori, level, durasi_valid, biaya, deskripsi, url_info, icon_url')
    .eq('status', 'published')
    .order('nama', { ascending: true })

  const sertifikasiItems = (items ?? []) as Pick<Sertifikasi, 'id' | 'nama' | 'slug' | 'penyelenggara' | 'kategori' | 'level' | 'durasi_valid' | 'biaya' | 'deskripsi' | 'url_info' | 'icon_url'>[]

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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amikom-purple mb-3">Tingkatkan Valuasi Diri</p>
            <h2 className="text-[32px] md:text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] text-amikom-ink">
              Sertifikasi IT.
            </h2>
            <p className="mt-4 text-[18px] font-normal leading-[1.5] text-amikom-ink-muted-48 max-w-[600px]">
              Tingkatkan daya saing Anda di pasar global dengan sertifikasi profesional yang direkomendasikan untuk lulusan AMIKOM.
            </p>
          </div>

          {sertifikasiItems.length === 0 ? (
            <div className="rounded-2xl border border-amikom-hairline bg-white p-12 text-center">
              <p className="text-sm text-amikom-ink-muted-48">Belum ada sertifikasi yang dipublikasikan.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
              {sertifikasiItems.map((cert) => (
                <Link key={cert.id} href={`/sertifikasi/${cert.slug}`} className="block group h-full">
                  <div className="flex flex-col h-full rounded-2xl bg-white border border-amikom-hairline overflow-hidden transition-all hover:border-amikom-purple/30 hover:shadow-lg hover:shadow-amikom-purple/5">
                    <ContentImage
                      src={cert.icon_url || undefined}
                      alt={cert.nama}
                      category={cert.kategori}
                      categoryFallback={KATEGORI_FALLBACK[cert.kategori] || KATEGORI_FALLBACK['IT & Networking']}
                      imageHeight="h-48"
                    />
                    <div className="p-6 flex flex-col flex-grow">
                      <p className="text-[13px] text-amikom-ink-muted-48 mb-2 font-medium">
                        {cert.penyelenggara}
                      </p>
                      <h3 className="text-[18px] font-semibold leading-[1.3] tracking-[-0.01em] text-amikom-ink mb-3 group-hover:text-amikom-purple transition-colors min-h-[56px] line-clamp-2">
                        {cert.nama}
                      </h3>
                      <p className="text-[14px] leading-[1.6] text-amikom-ink-muted-48 line-clamp-3 mt-auto">
                        {cert.deskripsi}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="px-2.5 py-1 rounded-md bg-amikom-purple/5 text-[11px] font-semibold text-amikom-purple uppercase tracking-wider">
                          {cert.level}
                        </span>
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                          {cert.kategori}
                        </span>
                      </div>
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
