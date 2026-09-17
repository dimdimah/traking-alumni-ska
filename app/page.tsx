import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { ScrollReveal } from '@/components/landing/scroll-reveal'
import { SmoothScrollLink } from '@/components/landing/smooth-scroll-link'
import { AlumniVerify } from '@/components/landing/alumni-verify'
import { NewsSection } from '@/components/landing/news-section'
import { CertificationInfo } from '@/components/landing/certification-info'
import { JobVacancies } from '@/components/landing/job-vacancies'
import { FaqSection } from '@/components/landing/faq-section'
import { LandingNavbar } from '@/components/landing/landing-navbar'
import { HowItWorks } from '@/components/landing/how-it-works'
import { WisudaGallery } from '@/components/landing/wisuda-gallery'

export const metadata: Metadata = {
  title: 'UNIKOM — Portal Alumni AMIKOM Surakarta',
  description:
    'Portal resmi alumni STMIK AMIKOM Surakarta. Lacak karir, kontribusi, dan perkembangan lulusan STMIK Amikom Surakarta. Data untuk akreditasi dan peningkatan kualitas pendidikan.',
  openGraph: {
    title: 'UNIKOM — Portal Alumni AMIKOM Surakarta',
    description:
      'Portal resmi alumni STMIK AMIKOM Surakarta. Lacak karir, kontribusi, dan perkembangan lulusan.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://sitrack.amikomsolo.ac.id',
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || 'https://sitrack.amikomsolo.ac.id',
  },
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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

  // Fetch data untuk landing page — semua parallel
  const [beritaResult, kisahSuksesResult, jobsResult, sertifikasiResult, faqResult] = await Promise.all([
    supabase
      .from('berita')
      .select('id, judul, slug, kategori, ringkasan, tanggal, gambar_url')
      .eq('status', 'published')
      .order('tanggal', { ascending: false })
      .limit(3),
    supabase
      .from('kisah_sukses')
      .select('id, nama_alumni, posisi_sekarang, perusahaan, angkatan, kutipan, foto_url')
      .eq('status', 'published')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('jobs')
      .select('id, title, company, location, type, salary, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('sertifikasi')
      .select('id, nama, penyelenggara, kategori, deskripsi, url_info, icon_url')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(4),
    supabase
      .from('faq')
      .select('id, pertanyaan, jawaban')
      .eq('aktif', true)
      .order('urutan', { ascending: true }),
  ])

  const beritaItems = beritaResult.data ?? []
  const kisahSuksesItems = kisahSuksesResult.data ?? []
  const jobItems = jobsResult.data ?? []
  const sertifikasiItems = sertifikasiResult.data ?? []
  const faqItems = faqResult.data ?? []

  const year = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-amikom-pearl overflow-x-hidden">

      {/* ═══════════════ GLOBAL NAV ═══════════════ */}
      <LandingNavbar isLoggedIn={isLoggedIn} dashboardHref={dashboardHref} />

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="bg-amikom-pearl pt-[100px] pb-[80px] lg:pt-[140px] lg:pb-[120px]">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="max-w-2xl text-center lg:text-left mx-auto lg:mx-0">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-amikom-purple/10 border border-amikom-purple/20 px-4 py-1.5">
                <span className="h-2 w-2 rounded-full bg-amikom-purple" />
                <span className="text-xs font-semibold text-amikom-purple tracking-wide">PLATFORM KARIR RESMI ALUMNI UNIKOM</span>
              </div>

              <h1 className="font-display text-[40px] sm:text-[52px] md:text-[58px] font-bold leading-[1.1] tracking-[-0.03em] text-amikom-ink">
                Baru Wisuda? Siap <br className="hidden lg:block" />
                <span className="text-amikom-purple">Masuk Dunia Kerja.</span>
              </h1>

              <p className="mt-5 text-[17px] font-normal leading-[1.6] text-amikom-ink/70">
                Sistem informasi alumni yang membantu lulusan STMIK AMIKOM Surakarta menemukan lowongan kerja sesuai program studi, melacak riwayat karir, dan membangun jaringan profesional.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <Link
                  href={isLoggedIn ? dashboardHref : '/login'}
                  className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-amikom-purple px-7 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-amikom-purple-hover"
                >
                  {isLoggedIn ? 'Lihat Lowongan' : 'Cari Lowongan Sekarang'}
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <SmoothScrollLink
                  href="#cara-kerja"
                  className="flex w-full sm:w-auto items-center justify-center rounded-lg border border-amikom-hairline bg-white px-7 py-3.5 text-[15px] font-semibold text-slate-700 transition-colors hover:border-amikom-purple/30 hover:text-amikom-purple"
                >
                  Cara Pakainya
                </SmoothScrollLink>
              </div>

              <div className="mt-7 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2">
                {['Gratis untuk alumni', 'Rekomendasi sesuai prodi', 'Akun resmi kampus'].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-amikom-ink-muted-48">
                    <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </span>
                ))}
              </div>

            </div>

            {/* Right — ilustrasi kartu lowongan kerja */}
            <div className="hidden lg:block">
              <div className="relative mx-auto w-full max-w-[420px]">
                {/* Decorative backdrop */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-amikom-purple/10 via-transparent to-amikom-jonquil-warm/25 transform rotate-6 border border-amikom-purple/10" aria-hidden="true" />
                <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-amikom-purple/5 blur-3xl" aria-hidden="true" />

                {/* Main card */}
                <div className="relative rounded-2xl bg-white shadow-2xl p-7 sm:p-8 flex flex-col transform -rotate-3 transition-transform hover:rotate-0 duration-500">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amikom-purple to-amikom-purple-hover text-white shadow-lg">
                      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-mono uppercase tracking-wider text-amikom-purple/80 mb-1.5">Lowongan Kerja</p>
                      <div className="h-4 w-4/5 rounded-full bg-slate-200" />
                      <div className="h-3 w-3/5 rounded-full bg-slate-100 mt-2" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="h-3 w-full rounded-full bg-slate-100" />
                    <div className="h-3 w-full rounded-full bg-slate-100" />
                    <div className="h-3 w-4/5 rounded-full bg-slate-100" />
                  </div>

                  <div className="my-6 border-t border-slate-100" />

                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div className="h-3 w-2/5 rounded-full bg-slate-100" />
                    </div>
                    <div className="flex items-center gap-2.5">
                      <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="h-3 w-3/5 rounded-full bg-slate-100" />
                    </div>
                    <div className="flex items-center gap-2.5">
                      <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="h-3 w-1/2 rounded-full bg-slate-100" />
                    </div>
                  </div>

                  <div className="mt-6 h-11 rounded-lg bg-amikom-purple/10 border border-amikom-purple/15 flex items-center justify-center">
                    <span className="text-[13px] font-bold text-amikom-purple">Lamar Sekarang</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ CARA KERJA (STEP BY STEP) ═══════════════ */}
      <HowItWorks />

      {/* ═══════════════ CTA SECTION ═══════════════ */}
      <section className="bg-amikom-pearl">
        <ScrollReveal>
          <div className="mx-auto max-w-[980px] px-6 pb-[80px] lg:pb-[120px] text-center lg:px-12">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amikom-purple to-amikom-purple-hover p-8 sm:p-12 md:p-16 text-center shadow-2xl shadow-amikom-purple/20 border border-white/10">
              {/* Decorative background elements */}
              <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-amikom-jonquil-warm/20 blur-3xl pointer-events-none" />
              <svg className="absolute -bottom-6 left-6 h-32 w-32 text-white/[0.06] hidden md:block rotate-[-12deg]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 mb-6">
                  <span className="h-2 w-2 rounded-full bg-amikom-jonquil-warm" />
                  <span className="text-xs font-semibold text-white tracking-wide uppercase">Smart Matching</span>
                </div>
                <h2 className="text-[30px] sm:text-[36px] md:text-[42px] font-bold leading-[1.15] text-white tracking-[-0.02em] max-w-[640px] mx-auto">
                  Info Lowongan Sesuai Prodimu.
                </h2>
                <p className="mt-5 text-[16px] md:text-[18px] font-normal leading-[1.65] text-white/85 max-w-[560px] mx-auto">
                  Ingin mendapat rekomendasi lowongan kerja yang cocok dengan program studi dan keahlian Anda? Langsung masuk, biarkan sistem mencocokkannya secara otomatis.
                </p>
                <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
                  {['S1 Informatika', 'S1 Teknologi Informasi', 'D3 Manajemen Informatika', 'D3 Komputerisasi Akuntansi'].map((prodi) => (
                    <span key={prodi} className="rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[13px] font-medium text-white/90">
                      {prodi}
                    </span>
                  ))}
                </div>
                <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-[16px] font-bold text-amikom-purple shadow-lg transition-all hover:bg-amikom-jonquil-warm hover:text-amikom-ink active:scale-[0.98]"
                  >
                    Masuk &amp; Lihat Rekomendasi
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                </div>
                <p className="mt-5 text-[13px] text-white/70">
                  Belum punya akun? Hubungi admin kampus untuk aktivasi akun alumni.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ═══════════════ CTA CV OTOMATIS ═══════════════ */}
      <section id="cv-otomatis" className="bg-white scroll-mt-20">
        <ScrollReveal>
          <div className="mx-auto max-w-[1280px] px-6 py-[80px] lg:px-12">
            <div className="relative overflow-hidden rounded-3xl bg-amikom-purple px-6 py-16 sm:px-12 lg:px-20 lg:py-20 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
              
              {/* Left text content */}
              <div className="relative z-10 flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 mb-6 border border-white/20">
                  <span className="h-2 w-2 rounded-full bg-amikom-jonquil-warm" />
                  <span className="text-xs font-semibold text-white tracking-wide uppercase">Fitur Baru</span>
                </div>
                <h2 className="text-[32px] md:text-[40px] font-bold leading-[1.1] tracking-[-0.02em] text-white">
                  Buat CV Profesional Secara Otomatis &amp; Gratis!
                </h2>
                <p className="mt-5 text-[18px] leading-[1.6] text-white/80 max-w-[520px] mx-auto lg:mx-0">
                  Tidak perlu repot mendesain dari awal. Dapatkan Curriculum Vitae dengan format standar industri langsung setelah Anda menyelesaikan pengisian kuesioner Tracer Study.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <Link
                    href="/login"
                    className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-amikom-jonquil-warm px-8 py-4 text-[16px] font-bold text-amikom-ink transition-colors hover:bg-white"
                  >
                    Mulai Isi Tracer Study
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Right decorative image/icon */}
              <div className="relative z-10 flex-1 flex justify-center lg:justify-end w-full">
                <div className="relative w-full max-w-[340px] aspect-[3/4]">
                  {/* Decorative backdrop elements */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/5 to-white/20 transform rotate-6 border border-white/10 backdrop-blur-sm" />
                  <div className="absolute inset-0 rounded-2xl bg-white shadow-2xl p-6 sm:p-8 flex flex-col transform -rotate-3 transition-transform hover:rotate-0 duration-500">
                    <div className="w-full flex justify-between items-start mb-6">
                      <div className="h-14 w-14 rounded-full bg-slate-200" />
                      <div className="h-6 w-20 rounded-full bg-amikom-purple/10" />
                    </div>
                    <div className="space-y-4">
                      <div className="h-4 w-3/4 rounded-full bg-slate-200" />
                      <div className="h-4 w-1/2 rounded-full bg-slate-200" />
                      <div className="h-4 w-5/6 rounded-full bg-slate-200" />
                    </div>
                    <div className="my-6 border-t border-slate-100" />
                    <div className="space-y-3">
                      <div className="h-3 w-full rounded-full bg-slate-100" />
                      <div className="h-3 w-full rounded-full bg-slate-100" />
                      <div className="h-3 w-4/5 rounded-full bg-slate-100" />
                      <div className="h-3 w-full rounded-full bg-slate-100" />
                    </div>
                    
                    {/* "CV Ready" Badge */}
                    <div className="absolute -bottom-4 -right-4 bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl shadow-lg transform rotate-6 flex items-center gap-2 text-sm">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      CV Siap Pakai
                    </div>
                  </div>
                </div>
              </div>

              {/* Background patterns */}
              <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" aria-hidden="true" />
              <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-amikom-jonquil-warm/10 blur-3xl" aria-hidden="true" />
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ═══════════════ CERTIFICATION INFO ═══════════════ */}
      <CertificationInfo items={sertifikasiItems} />



      {/* ═══════════════ NEWS SECTION ═══════════════ */}
      <NewsSection items={beritaItems} />

      {/* ═══════════════ JOB VACANCIES ═══════════════ */}
      <JobVacancies items={jobItems} />

      {/* ═══════════════ VERIFIKASI ALUMNI ═══════════════ */}
      <section id="verifikasi" className="bg-white scroll-mt-20">
        <ScrollReveal>
          <div className="mx-auto max-w-[980px] px-6 py-[80px] lg:px-12">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amikom-purple mb-3">Transparansi</p>
              <h2 className="text-[32px] md:text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] text-amikom-ink">
                Validasi Kelulusan.
              </h2>
              <p className="mt-3 text-[18px] font-normal leading-[1.5] text-amikom-ink-muted-48 max-w-[520px] mx-auto">
                Pastikan keaslian status alumni STMIK AMIKOM Surakarta dengan mudah dan cepat.
              </p>
            </div>
            <AlumniVerify />
          </div>
        </ScrollReveal>
      </section>

      {/* ═══════════════ FAQ SECTION ═══════════════ */}
      <FaqSection faqs={faqItems} />

      {/* ═══════════════ PHOTO GALLERY STRIP ═══════════════ */}
      <WisudaGallery />

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="bg-amikom-pearl border-t border-amikom-hairline">
        <div className="mx-auto max-w-[1280px] px-6 py-14 lg:px-12">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Column 1 — Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <Image
                  src="/logo-amikom-surakarta-1.png"
                  alt="Logo STMIK AMIKOM Surakarta"
                  width={36}
                  height={36}
                  className="h-9 w-auto"
                />
                <h4 className="text-[14px] font-semibold leading-[1.29] tracking-[-0.016em] text-amikom-ink">
                  UNIKOM
                </h4>
              </div>
              <p className="mt-0 text-[15px] leading-[1.6] text-amikom-ink-muted-48">
                Portal Alumni STMIK AMIKOM Surakarta.
              </p>
            </div>

            {/* Column 2 — Platform */}
            <div>
              <h4 className="text-[14px] font-semibold leading-[1.29] tracking-[-0.016em] text-amikom-ink">
                Platform
              </h4>
              <ul className="mt-3 space-y-2">
                <li><SmoothScrollLink href="#cara-kerja" className="text-[15px] leading-[1.6] text-amikom-ink-muted-48 hover:text-amikom-purple transition-colors">Cara Kerja</SmoothScrollLink></li>
                <li><SmoothScrollLink href="#berita" className="text-[15px] leading-[1.6] text-amikom-ink-muted-48 hover:text-amikom-purple transition-colors">Berita</SmoothScrollLink></li>
                <li><SmoothScrollLink href="#faq" className="text-[15px] leading-[1.6] text-amikom-ink-muted-48 hover:text-amikom-purple transition-colors">FAQ</SmoothScrollLink></li>
              </ul>
            </div>

            {/* Column 3 — Akun */}
            <div>
              <h4 className="text-[14px] font-semibold leading-[1.29] tracking-[-0.016em] text-amikom-ink">
                Akun
              </h4>
              <ul className="mt-3 space-y-2">
                <li><Link href="/login" className="text-[15px] leading-[1.6] text-amikom-ink-muted-48 hover:text-amikom-purple transition-colors">Masuk</Link></li>
                <li><span className="text-[15px] leading-[1.6] text-amikom-ink-muted-48">Akun dibuat oleh admin</span></li>
              </ul>
            </div>

            {/* Column 4 — Kampus */}
            <div>
              <h4 className="text-[14px] font-semibold leading-[1.29] tracking-[-0.016em] text-amikom-ink">
                Kampus
              </h4>
              <ul className="mt-3 space-y-2">
                <li><a href="https://solo.amikom.ac.id" target="_blank" rel="noopener noreferrer" className="text-[15px] leading-[1.6] text-amikom-ink-muted-48 hover:text-amikom-purple transition-colors">Website Resmi</a></li>
                <li><span className="text-[15px] leading-[1.6] text-amikom-ink-muted-48">Surakarta, Jawa Tengah</span></li>
              </ul>
              <div className="mt-4 w-full h-32 rounded-xl overflow-hidden border border-amikom-hairline">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3955.132840003022!2d110.7712398147766!3d-7.560490794547285!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a144e5907481b%3A0xc3b5ed1eb368a356!2sSTMIK%20Amikom%20Surakarta!5e0!3m2!1sen!2sid!4v1714486638012!5m2!1sen!2sid" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Peta STMIK Amikom Surakarta"
                />
              </div>
            </div>
          </div>

          {/* Legal */}
          <div className="mt-10 pt-8 border-t border-amikom-hairline flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[12px] text-amikom-ink-muted-48">
              STMIK Amikom Surakarta &copy; {year}
            </p>
            <p className="text-[12px] text-amikom-ink-muted-48">
              Dibangun untuk akreditasi &amp; peningkatan kualitas pendidikan.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
