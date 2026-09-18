import './globals.css'
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://alumni-amikomsolo.site'

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
    'stmik amikom',
    'amikom surakarta',
    'karir alumni',
    'tracer study amikom',
    'kuesioner sistem alumni',
    'akreditasi amikom',
    'career center alumni',
    'sistem informasi alumni',
    'employment rate alumni',
    'lowongan kerja alumni amikom',
    'surakarta',
    'jawa tengah',
  ],
  authors: [{ name: 'STMIK AMIKOM Surakarta', url: 'https://solo.amikom.ac.id' }],
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
    canonical: './',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || '',
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || '',
    other: {
      'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION || '',
    },
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'CollegeOrUniversity',
      '@id': `${SITE_URL}/#organization`,
      name: 'STMIK AMIKOM Surakarta',
      alternateName: ['Universitas AMIKOM Surakarta', 'AMIKOM Solo'],
      url: 'https://solo.amikom.ac.id',
      logo: `${SITE_URL}/logo-amikom-surakarta-1.png`,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Surakarta',
        addressRegion: 'Jawa Tengah',
        addressCountry: 'ID',
      },
      sameAs: [
        'https://solo.amikom.ac.id',
        'https://www.instagram.com/amikomsurakarta/',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'UNIKOM — Portal Alumni AMIKOM Surakarta',
      description:
        'Platform resmi sistem alumni dan tracer study STMIK AMIKOM Surakarta.',
      publisher: {
        '@id': `${SITE_URL}/#organization`,
      },
      inLanguage: 'id-ID',
    },
    {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}/#application`,
      name: 'UNIKOM',
      alternateName: 'Portal Alumni AMIKOM Surakarta',
      url: SITE_URL,
      description:
        'Platform resmi sistem alumni STMIK AMIKOM Surakarta untuk melacak karir, kontribusi, dan perkembangan lulusan.',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'All',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'IDR',
      },
      provider: {
        '@id': `${SITE_URL}/#organization`,
      },
      featureList: [
        'Track Record Alumni',
        'Tracer Study Kuesioner',
        'Career Center & Lowongan Kerja',
        'Jaringan & Direktori Alumni',
        'Verifikasi Keaslian Alumni',
        'Info Sertifikasi Profesi',
        'Berita & Kabar Kampus',
        'Analytics & Reporting',
      ],
      inLanguage: 'id',
    },
  ],
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
