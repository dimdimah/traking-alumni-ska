import Link from 'next/link'
import Image from 'next/image'
import { StaggerContainer, StaggerItem, HoverScale } from './motion-wrapper'
import type { Sertifikasi } from '@/types/database'

// Fallback icon SVG per kategori (dipakai jika icon_url kosong)
function CategoryIcon({ kategori }: { kategori: Sertifikasi['kategori'] }) {
  switch (kategori) {
    case 'Cloud':
      return (
        <svg className="w-8 h-8 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
        </svg>
      )
    case 'Programming':
      return (
        <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
        </svg>
      )
    case 'Keamanan Siber':
      return (
        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      )
    case 'Data Science':
      return (
        <svg className="w-8 h-8 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      )
    case 'Manajemen':
      return (
        <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
        </svg>
      )
    default: // 'IT & Networking'
      return (
        <svg className="w-8 h-8 text-amikom-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-13.5 0v-1.5m13.5 1.5v-1.5m-13.5-9h13.5m-13.5 0a3 3 0 00-3 3m3-3a3 3 0 100-6h13.5a3 3 0 100 6m-13.5 0v1.5m13.5-1.5v1.5m0 0a3 3 0 013 3m-3-3a3 3 0 100 6" />
        </svg>
      )
  }
}

// Tags otomatis dari kategori jika tidak ada tag khusus
function getTagsFromKategori(kategori: Sertifikasi['kategori']): string[] {
  const map: Record<Sertifikasi['kategori'], string[]> = {
    'IT & Networking': ['IT', 'Network'],
    'Programming': ['Code', 'Dev'],
    'Data Science': ['Data', 'AI'],
    'Cloud': ['Cloud', 'Infra'],
    'Keamanan Siber': ['Security', 'Cyber'],
    'Manajemen': ['Management', 'Project'],
  }
  return map[kategori] ?? [kategori]
}

interface CertificationInfoProps {
  items: Pick<Sertifikasi, 'id' | 'nama' | 'penyelenggara' | 'kategori' | 'deskripsi' | 'url_info' | 'icon_url'>[]
}

export function CertificationInfo({ items }: CertificationInfoProps) {
  return (
    <section id="sertifikasi" className="bg-amikom-pearl py-[80px] lg:py-[120px] scroll-mt-20">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-12 items-center">

          {/* Left: heading + CTA */}
          <div className="lg:col-span-4 text-center lg:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amikom-purple mb-3">Tingkatkan Valuasi Diri</p>
            <h2 className="text-[32px] md:text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] text-amikom-ink mb-4">
              Sertifikasi IT.
            </h2>
            <p className="text-[17px] leading-[1.6] text-amikom-ink-muted-48 mb-8">
              Tingkatkan daya saing Anda di pasar global dengan sertifikasi profesional yang direkomendasikan untuk lulusan AMIKOM.
            </p>
            <Link
              href="/sertifikasi"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-amikom-hairline px-6 py-3 text-[15px] font-semibold text-amikom-ink transition-all hover:border-amikom-purple/30 hover:text-amikom-purple hover:shadow-sm"
            >
              Lihat Semua Sertifikasi
            </Link>
          </div>

          {/* Right: cards */}
          <div className="lg:col-span-8">
            {items.length === 0 ? (
              <div className="rounded-2xl border border-amikom-hairline bg-white p-12 text-center">
                <p className="text-sm text-amikom-ink-muted-48">Belum ada sertifikasi yang dipublikasikan.</p>
              </div>
            ) : (
              <StaggerContainer className="grid gap-4 sm:grid-cols-2">
                {items.map((cert) => {
                  const tags = getTagsFromKategori(cert.kategori)
                  return (
                    <StaggerItem key={cert.id}>
                      <HoverScale>
                        <div className="p-6 rounded-2xl bg-white border border-amikom-hairline hover:border-amikom-purple/30 hover:shadow-lg hover:shadow-amikom-purple/5 transition-all h-full flex flex-col">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                              {cert.icon_url ? (
                                <Image
                                   src={cert.icon_url}
                                   alt={cert.penyelenggara}
                                   width={36} height={36}
                                   className="w-9 h-9 object-contain"
                                />
                              ) : (
                                <CategoryIcon kategori={cert.kategori} />
                              )}
                            </div>
                            <div>
                              <h3 className="text-[16px] font-bold text-amikom-ink leading-tight">{cert.nama}</h3>
                              <p className="text-[13px] text-amikom-ink-muted-48 mt-1">{cert.penyelenggara}</p>
                            </div>
                          </div>

                          {cert.deskripsi && (
                            <p className="text-[14px] leading-[1.6] text-amikom-ink-muted-48 mb-4 flex-grow line-clamp-3">
                              {cert.deskripsi}
                            </p>
                          )}

                          <div className="flex items-center justify-between mt-auto">
                            <div className="flex gap-2 flex-wrap">
                              {tags.map(tag => (
                                <span key={tag} className="px-2.5 py-1 rounded-md bg-amikom-purple/5 text-[11px] font-semibold text-amikom-purple uppercase tracking-wider">
                                  {tag}
                                </span>
                              ))}
                            </div>
                            {cert.url_info && (
                              <a
                                href={cert.url_info}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[12px] font-semibold text-amikom-purple hover:underline shrink-0 ml-2"
                              >
                                Info →
                              </a>
                            )}
                          </div>
                        </div>
                      </HoverScale>
                    </StaggerItem>
                  )
                })}
              </StaggerContainer>
            )}
          </div>

        </div>
      </div>
    </section>
  )
}
