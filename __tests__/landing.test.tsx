import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import HomePage from '../app/page'

/* ── shared mocks ────────────────────────────────────────── */

jest.mock('next/link', () => {
  const { default: NextLink } = jest.requireActual('next/link')
  return NextLink
})

jest.mock('next/navigation', () => ({ redirect: jest.fn() }))

const mockQuery = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null }),
  maybeSingle: jest.fn().mockResolvedValue({ data: null }),
}

function makeSupabase(user: { id: string } | null, profileRole: string | null) {
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user } }),
    },
    from: jest.fn().mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue(
            profileRole ? { data: { role: profileRole } } : { data: null },
          ),
        }
      }
      return { ...mockQuery }
    }),
  }
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

function setSupabase(user: { id: string } | null = null, profileRole: string | null = null) {
  const { createClient } = require('@/lib/supabase/server') as {
    createClient: jest.Mock
  }
  createClient.mockResolvedValue(makeSupabase(user, profileRole))
}

/* ── tests: logged-out (default) ─────────────────────────── */

describe('Landing page — logged-out visitor', () => {
  beforeEach(() => setSupabase())

  it('renders the UNIKOM branding in navbar', async () => {
    render(await HomePage())
    expect(screen.getAllByText('UNIKOM').length).toBeGreaterThanOrEqual(1)
  })

  it('navbar shows "Masuk Portal" linking to /login', async () => {
    render(await HomePage())
    const btn = screen.getByRole('link', { name: /^masuk portal$/i })
    expect(btn).toHaveAttribute('href', '/login')
  })

  it('renders hero headline', async () => {
    render(await HomePage())
    expect(screen.getByText(/Masuk Dunia Kerja/i)).toBeInTheDocument()
  })

  it('hero CTA "Cari Lowongan Sekarang" links to /login', async () => {
    render(await HomePage())
    const btn = screen.getByRole('link', { name: /cari lowongan sekarang/i })
    expect(btn).toHaveAttribute('href', '/login')
  })

  it('"Masuk & Lihat Rekomendasi" links to /login?next=…', async () => {
    render(await HomePage())
    const btn = screen.getByRole('link', { name: /masuk.*lihat rekomendasi/i })
    expect(btn).toHaveAttribute('href', '/login?next=%2Fuser%2Frekomendasi')
  })

  it('"Mulai Isi Tracer Study" links to /login?next=…', async () => {
    render(await HomePage())
    const btn = screen.getByRole('link', { name: /mulai isi tracer study/i })
    expect(btn).toHaveAttribute('href', '/login?next=%2Fdashboard%2Ftracer-study')
  })

  it('renders Cara Pakainya / HowItWorks section', async () => {
    render(await HomePage())
    expect(screen.getAllByText(/Cara Kerja/i).length).toBeGreaterThanOrEqual(1)
  })

  it('renders FAQ section', async () => {
    render(await HomePage())
    expect(screen.getAllByText(/FAQ/i).length).toBeGreaterThanOrEqual(1)
  })

  it('renders footer with Platform and Akun headings', async () => {
    render(await HomePage())
    expect(screen.getByText('Platform')).toBeInTheDocument()
    expect(screen.getByText('Akun')).toBeInTheDocument()
  })

  it('footer "Masuk" links to /login', async () => {
    render(await HomePage())
    const footer = screen.getByRole('contentinfo')
    const masukLink = within(footer).getByText('Masuk')
    expect(masukLink).toHaveAttribute('href', '/login')
  })

  it('career bottom link "Lihat lebih banyak lowongan di portal" links to /login', async () => {
    render(await HomePage())
    const link = screen.getByRole('link', { name: /lihat lebih banyak lowongan di portal/i })
    expect(link).toHaveAttribute('href', '/login?next=%2Fdashboard%2Fcareer')
  })
})

/* ── tests: logged-in alumni ─────────────────────────────── */

describe('Landing page — logged-in alumni', () => {
  beforeEach(() => setSupabase({ id: 'user-1' }, 'alumni'))

  it('navbar shows "Portal Karir" linking to /dashboard', async () => {
    render(await HomePage())
    const btn = screen.getByRole('link', { name: /^portal karir$/i })
    expect(btn).toHaveAttribute('href', '/dashboard')
  })

  it('hero CTA shows "Lihat Lowongan" and links to /dashboard', async () => {
    render(await HomePage())
    const btn = screen.getByRole('link', { name: /^lihat lowongan$/i })
    expect(btn).toHaveAttribute('href', '/dashboard')
  })

  it('"Lihat Rekomendasi" links to /user/rekomendasi', async () => {
    render(await HomePage())
    const btn = screen.getByRole('link', { name: /lihat rekomendasi/i })
    expect(btn).toHaveAttribute('href', '/user/rekomendasi')
  })

  it('"Isi/Perbarui Tracer Study" links to /dashboard/tracer-study', async () => {
    render(await HomePage())
    const btn = screen.getByRole('link', { name: /isi\/perbarui tracer study/i })
    expect(btn).toHaveAttribute('href', '/dashboard/tracer-study')
  })

  it('footer "Buka Portal" links to /dashboard', async () => {
    render(await HomePage())
    const footer = screen.getByRole('contentinfo')
    const portalLink = within(footer).getByText('Buka Portal')
    expect(portalLink).toHaveAttribute('href', '/dashboard')
  })

  it('career bottom link "Lihat semua lowongan di portal" links to /dashboard/career', async () => {
    render(await HomePage())
    const link = screen.getByRole('link', { name: /lihat semua lowongan di portal/i })
    expect(link).toHaveAttribute('href', '/dashboard/career')
  })
})

/* ── tests: logged-in super_user / admin ─────────────────── */

describe('Landing page — logged-in super_user', () => {
  beforeEach(() => setSupabase({ id: 'admin-1' }, 'super_user'))

  it('navbar shows "Portal Karir" linking to /admin', async () => {
    render(await HomePage())
    const btn = screen.getByRole('link', { name: /^portal karir$/i })
    expect(btn).toHaveAttribute('href', '/admin')
  })

  it('hero CTA "Lihat Lowongan" links to /admin', async () => {
    render(await HomePage())
    const btn = screen.getByRole('link', { name: /^lihat lowongan$/i })
    expect(btn).toHaveAttribute('href', '/admin')
  })

  it('"Buka Portal" links to /admin', async () => {
    render(await HomePage())
    const btns = screen.getAllByRole('link', { name: /^buka portal$/i })
    expect(btns.length).toBeGreaterThanOrEqual(1)
    btns.forEach((btn) => expect(btn).toHaveAttribute('href', '/admin'))
  })

  it('"Kelola Kuesioner" links to /admin/kuesioner', async () => {
    render(await HomePage())
    const btn = screen.getByRole('link', { name: /kelola kuesioner/i })
    expect(btn).toHaveAttribute('href', '/admin/kuesioner')
  })

  it('footer "Buka Portal" links to /admin', async () => {
    render(await HomePage())
    const footer = screen.getByRole('contentinfo')
    const portalLink = within(footer).getByText('Buka Portal')
    expect(portalLink).toHaveAttribute('href', '/admin')
  })

  it('career bottom link "Lihat semua lowongan di portal" links to /admin/career-center', async () => {
    render(await HomePage())
    const link = screen.getByRole('link', { name: /lihat semua lowongan di portal/i })
    expect(link).toHaveAttribute('href', '/admin/career-center')
  })
})
