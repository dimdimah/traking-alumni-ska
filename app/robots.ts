import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/admin',
          '/super-user',
          '/user',
          '/api/',
        ],
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/dashboard', '/admin', '/super-user', '/user'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: ['/dashboard', '/admin', '/super-user', '/user'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: ['/dashboard', '/admin', '/super-user', '/user'],
      },
      {
        userAgent: 'Anthropic-ai',
        allow: '/',
        disallow: ['/dashboard', '/admin', '/super-user', '/user'],
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: ['/dashboard', '/admin', '/super-user', '/user'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: ['/dashboard', '/admin', '/super-user', '/user'],
      },
      {
        userAgent: 'YouBot',
        allow: '/',
        disallow: ['/dashboard', '/admin', '/super-user', '/user'],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://sitrack.amikomsolo.ac.id'}/sitemap.xml`,
  }
}
