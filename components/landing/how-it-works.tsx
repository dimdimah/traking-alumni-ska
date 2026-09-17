import { ScrollReveal } from './scroll-reveal'
import { StaggerContainer, StaggerItem } from './motion-wrapper'

const STEPS = [
  {
    number: '01',
    title: 'Masuk ke Portal',
    description: 'Login menggunakan akun resmi @amikomsolo.ac.id yang dibuatkan oleh admin kampus.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Lengkapi Profil',
    description: 'Isi data diri, keahlian, dan kuesioner Tracer Study agar sistem mengenali profilmu.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-6.97M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Dapatkan Rekomendasi',
    description: 'Sistem mencocokkan lowongan aktif dengan program studi dan keahlianmu secara otomatis.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    number: '04',
    title: 'Lamar & Lacak Karir',
    description: 'Lamar lowongan terbaik, lalu catat riwayat pekerjaanmu di fitur Track Record.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
]

export function HowItWorks() {
  return (
    <section id="cara-kerja" className="bg-amikom-pearl py-[80px] lg:py-[120px] scroll-mt-20">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amikom-purple mb-3">Cara Kerja</p>
          <h2 className="text-[32px] md:text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] text-amikom-ink">
            Mulai Karirmu dalam 4 Langkah.
          </h2>
          <p className="mt-4 text-[18px] font-normal leading-[1.5] text-amikom-ink-muted-48 max-w-[600px] mx-auto">
            Dari wisuda sampai diterima kerja, UNIKOM menemani setiap langkahnya.
          </p>
        </div>

        <ScrollReveal>
          <StaggerContainer className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Connector line */}
            <div className="hidden lg:block absolute top-[52px] left-[12%] right-[12%] border-t-2 border-dashed border-amikom-purple/20" aria-hidden="true" />

            {STEPS.map((step) => (
              <StaggerItem key={step.number} className="relative">
                <div className="flex flex-col items-center h-full p-6 pt-8 rounded-2xl bg-white border border-amikom-hairline text-center hover:border-amikom-purple/30 hover:shadow-lg hover:shadow-amikom-purple/5 transition-all">
                  <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-amikom-purple/10 text-amikom-purple border border-amikom-purple/15 mb-5">
                    {step.icon}
                  </div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-amikom-purple/60">{`Langkah ${step.number}`}</span>
                  <h3 className="mt-1.5 text-[18px] font-bold text-amikom-ink">{step.title}</h3>
                  <p className="mt-2 text-[14px] leading-[1.6] text-amikom-ink-muted-48">{step.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </ScrollReveal>
      </div>
    </section>
  )
}
