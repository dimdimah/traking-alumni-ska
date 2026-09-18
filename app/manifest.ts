import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'UNIKOM — Portal Alumni STMIK AMIKOM Surakarta',
    short_name: 'UNIKOM',
    description:
      'Portal resmi sistem alumni dan tracer study STMIK AMIKOM Surakarta untuk melacak karir, kontribusi, dan lowongan kerja lulusan.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAFBFC',
    theme_color: '#700070',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/logo-amikom-surakarta-1.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
