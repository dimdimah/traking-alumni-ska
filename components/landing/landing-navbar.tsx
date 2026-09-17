'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SmoothScrollLink } from './smooth-scroll-link'
import { Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { href: '/', label: 'Beranda' },
  { href: '#cv-otomatis', label: 'CV Gratis' },
  { href: '#sertifikasi', label: 'Sertifikasi' },
  { href: '#berita', label: 'Berita' },
  { href: '#lowongan', label: 'Karir' },
  { href: '#faq', label: 'FAQ' },
  // { href: '/survey-perusahaan', label: 'Survey Perusahaan' },
]

const PUBLIC_LINKS = [
  { href: '/', label: 'Beranda' },
  { href: '/#cv-otomatis', label: 'CV Gratis' },
  { href: '/#sertifikasi', label: 'Sertifikasi' },
  { href: '/berita', label: 'Berita' },
  { href: '/#lowongan', label: 'Karir' },
  { href: '/#faq', label: 'FAQ' },
  // { href: '/survey-perusahaan', label: 'Survey Perusahaan' },
]

const EXTERNAL_LINKS = [
  { href: 'https://wa.me/', label: 'WhatsApp' },
]

interface LandingNavbarProps {
  variant?: 'landing' | 'public'
  isLoggedIn?: boolean
  dashboardHref?: string
}

export function LandingNavbar({ variant = 'landing', isLoggedIn = false, dashboardHref = '/dashboard' }: LandingNavbarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const closeMobile = useCallback(() => setIsMobileOpen(false), [])

  useEffect(() => {
    if (!isMobileOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobile()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isMobileOpen, closeMobile])

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isMobileOpen])

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 md:px-6 md:pt-6 pointer-events-none">
        <nav className="pointer-events-auto flex w-full max-w-7xl items-center justify-between rounded-full border border-white/40 bg-white/60 px-4 py-3 shadow-lg shadow-amikom-purple/5 backdrop-blur-xl transition-all hover:bg-white/80 hover:shadow-xl hover:shadow-amikom-purple/10">
          
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity pl-2" onClick={closeMobile}>
              <Image
                src="/logo-amikom-surakarta-1.png"
                alt="Logo STMIK AMIKOM Surakarta"
                width={36}
                height={36}
                className="h-9 w-auto"
              />
              <div className="hidden sm:flex flex-col">
                <span className="text-amikom-ink text-[16px] font-extrabold tracking-tight leading-none">
                  UNIKOM
                </span>
                <span className="text-amikom-ink/60 text-[10px] font-semibold tracking-wide uppercase mt-0.5">
                  Alumni Amikom
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1 rounded-full bg-white/50 px-3 py-1">
            {variant === 'public' ? (
              PUBLIC_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full px-4 py-1.5 text-[14px] font-semibold text-amikom-ink/60 hover:bg-white hover:text-amikom-purple hover:shadow-sm transition-all"
                >
                  {link.label}
                </Link>
              ))
            ) : (
              NAV_LINKS.map((link) =>
                link.href.startsWith('#') ? (
                  <SmoothScrollLink
                    key={link.href}
                    href={link.href}
                    className="rounded-full px-4 py-1.5 text-[14px] font-semibold text-amikom-ink/60 hover:bg-white hover:text-amikom-purple hover:shadow-sm transition-all"
                  >
                    {link.label}
                  </SmoothScrollLink>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-full px-4 py-1.5 text-[14px] font-semibold text-amikom-ink/60 hover:bg-white hover:text-amikom-purple hover:shadow-sm transition-all"
                  >
                    {link.label}
                  </Link>
                )
              )
            )}
          </div>

          {/* Right section: Mobile Hamburger + Login */}
          <div className="flex items-center gap-2 pr-1">
            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMobileOpen((prev) => !prev)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-amikom-ink/60 hover:bg-white/80 hover:text-amikom-purple transition-colors lg:hidden"
              aria-label={isMobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            >
              {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link
              href={isLoggedIn ? dashboardHref : '/login'}
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-amikom-purple px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-amikom-purple-hover hover:scale-105 active:scale-95"
            >
              <span>{isLoggedIn ? 'Portal Karir' : 'Masuk Portal'}</span>
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </nav>
      </div>

      {/* Mobile overlay menu */}
      <div
        className={`fixed inset-0 z-40 bg-amikom-pearl/95 backdrop-blur-xl transition-all duration-300 lg:hidden ${
          isMobileOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <nav className="flex flex-col items-center justify-center h-full gap-6 px-6">
          {variant === 'public' ? (
            PUBLIC_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[24px] font-semibold text-amikom-ink/70 hover:text-amikom-purple transition-colors"
                onClick={closeMobile}
              >
                {link.label}
              </Link>
            ))
          ) : (
            NAV_LINKS.map((link) =>
              link.href.startsWith('#') ? (
                <SmoothScrollLink
                  key={link.href}
                  href={link.href}
                  className="text-[24px] font-semibold text-amikom-ink/70 hover:text-amikom-purple transition-colors"
                  onClick={closeMobile}
                >
                  {link.label}
                </SmoothScrollLink>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[24px] font-semibold text-amikom-ink/70 hover:text-amikom-purple transition-colors"
                  onClick={closeMobile}
                >
                  {link.label}
                </Link>
              )
            )
          )}
        </nav>
      </div>
    </>
  )
}