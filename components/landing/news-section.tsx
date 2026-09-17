import Link from 'next/link'
import Image from 'next/image'
import { StaggerContainer, StaggerItem, HoverScale } from './motion-wrapper'
import type { Berita } from '@/types/database'

// Fallback per kategori jika gambar_url kosong
const KATEGORI_FALLBACK: Record<string, string> = {
  Akademik: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=600',
  Karir: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=600',
  Kampus: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=600',
  Teknologi: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=600',
  Umum: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=600',
}

interface NewsSectionProps {
  items: Pick<Berita, 'id' | 'judul' | 'slug' | 'kategori' | 'ringkasan' | 'tanggal' | 'gambar_url'>[]
}

export function NewsSection({ items }: NewsSectionProps) {
  return (
    <section id="berita" className="bg-amikom-pearl py-[80px] lg:py-[120px] scroll-mt-20">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amikom-purple mb-3">Update Terbaru</p>
            <h2 className="text-[32px] md:text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] text-amikom-ink">
              Info & Berita.
            </h2>
          </div>
          <Link
            href="/berita"
            className="inline-flex items-center gap-2 text-sm font-semibold text-amikom-purple hover:text-amikom-purple-hover transition-colors group"
          >
            Lihat semua berita
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-amikom-hairline bg-white p-12 text-center">
            <p className="text-sm text-amikom-ink-muted-48">Belum ada berita yang dipublikasikan.</p>
          </div>
        ) : (
          <StaggerContainer className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <StaggerItem key={item.id}>
                <HoverScale>
                   <Link href={`/berita/${item.slug}`} className="block group h-full">
                    <div className="flex flex-col h-full rounded-2xl bg-white border border-amikom-hairline overflow-hidden transition-all hover:border-amikom-purple/30 hover:shadow-lg hover:shadow-amikom-purple/5">
                      <div className="relative h-48 w-full overflow-hidden">
                        <Image
                           src={item.gambar_url || KATEGORI_FALLBACK[item.kategori] || KATEGORI_FALLBACK.Umum}
                           alt={item.judul}
                           width={800} height={400}
                           className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute top-4 left-4 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amikom-purple">
                          {item.kategori}
                        </div>
                      </div>
                      <div className="p-6 flex flex-col flex-grow">
                        <p className="text-[13px] text-amikom-ink-muted-48 mb-2 font-medium">
                          {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <h3 className="text-[18px] font-semibold leading-[1.3] tracking-[-0.01em] text-amikom-ink mb-3 group-hover:text-amikom-purple transition-colors">
                          {item.judul}
                        </h3>
                        <p className="text-[14px] leading-[1.6] text-amikom-ink-muted-48 line-clamp-3 mt-auto">
                          {item.ringkasan}
                        </p>
                      </div>
                    </div>
                  </Link>
                </HoverScale>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </section>
  )
}
