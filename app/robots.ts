import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://alumni-amikomsolo.site'

export default function robots(): MetadataRoute.Robots {
  const privateRoutes = [
    '/dashboard',
    '/dashboard/',
    '/admin',
    '/admin/',
    '/super-user',
    '/super-user/',
    '/user',
    '/user/',
    '/api/',
  ]

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: privateRoutes,
      },
      // Search Engines
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: privateRoutes,
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: privateRoutes,
      },
      {
        userAgent: 'YandexBot',
        allow: '/',
        disallow: privateRoutes,
      },
      // AI Crawlers & Search Assistants (GEO - Generative Engine Optimization)
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: privateRoutes,
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: privateRoutes,
      },
      {
        userAgent: 'OAI-SearchBot',
        allow: '/',
        disallow: privateRoutes,
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: privateRoutes,
      },
      {
        userAgent: 'Anthropic-ai',
        allow: '/',
        disallow: privateRoutes,
      },
      {
        userAgent: 'Claude-Web',
        allow: '/',
        disallow: privateRoutes,
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: privateRoutes,
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: privateRoutes,
      },
      {
        userAgent: 'YouBot',
        allow: '/',
        disallow: privateRoutes,
      },
      {
        userAgent: 'Applebot-Extended',
        allow: '/',
        disallow: privateRoutes,
      },
      {
        userAgent: 'cohere-ai',
        allow: '/',
        disallow: privateRoutes,
      },
      {
        userAgent: 'ByteSpider',
        allow: '/',
        disallow: privateRoutes,
      },
      {
        userAgent: 'Meta-ExternalAgent',
        allow: '/',
        disallow: privateRoutes,
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}

