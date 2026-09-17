import './globals.css'
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sitrack.amikomsolo.ac.id'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'UNIKOM — Portal Alumni AMIKOM Surakarta',
    template: '%s | UNIKOM — STMIK AMIKOM Surakarta',
  },
  description:
    'UNIKOM adalah portal resmi alumni STMIK AMIKOM Surakarta untuk melacak karir, kontribusi, dan perkembangan lulusan. Fitur track record, kuesioner akreditasi, career center, dan analytics data alumni.',
  keywords: [
    'sistem alumni',
    'alumni amikom',
    'track record alumni',
    'STMIK AMIKOM Surakarta',
    'stmiK amikom',
    'karir alumni',
    'kuesioner sistem alumni',
    'akreditasi',
    'career center alumni',
    'sistem informasi alumni',
    'employment rate alumni',
    'lowongan kerja alumni amikom',
    'surakarta',
    'jawa tengah',
  ],
  authors: [{ name: 'STMIK AMIKOM Surakarta' }],
  creator: 'STMIK AMIKOM Surakarta',
  publisher: 'STMIK AMIKOM Surakarta',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: SITE_URL,
    siteName: 'UNIKOM — STMIK AMIKOM Surakarta',
    title: 'UNIKOM — Portal Alumni AMIKOM Surakarta',
    description:
      'Platform resmi sistem alumni STMIK AMIKOM Surakarta. Lacak karir, kontribusi, dan perkembangan lulusan STMIK Amikom Surakarta.',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'UNIKOM — Portal Alumni STMIK AMIKOM Surakarta',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UNIKOM — Portal Alumni AMIKOM Surakarta',
    description:
      'Platform resmi sistem alumni STMIK AMIKOM Surakarta. Lacak karir dan perkembangan lulusan.',
    images: ['/api/og'],
    creator: '@amikomsolo',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },

  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || '',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'UNIKOM',
  alternateName: 'Portal Alumni AMIKOM Surakarta',
  url: SITE_URL,
  description:
    'Platform resmi sistem alumni STMIK AMIKOM Surakarta untuk melacak karir, kontribusi, dan perkembangan lulusan STMIK Amikom Surakarta.',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'IDR',
  },
  provider: {
    '@type': 'CollegeOrUniversity',
    name: 'STMIK AMIKOM Surakarta',
    url: 'https://solo.amikom.ac.id',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Surakarta',
      addressRegion: 'Jawa Tengah',
      addressCountry: 'ID',
    },
  },
  featureList: [
    'Track Record Alumni',
    'Sistem Alumni Questionnaires',
    'Career Center',
    'Analytics & Reporting',
    'Admin Dashboard',
    'Role-Based Access Control',
  ],
  inLanguage: 'id',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-sm focus:bg-amikom-purple focus:px-4 focus:py-2 focus:text-sm focus:text-white focus:outline-none"
        >
          Lewati ke konten utama
        </a>
        <div id="main-content">
          {children}
        </div>
      </body>
    </html>
  )
}
