import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import HomePage from '../app/page'

// Mock next/link to render as a plain anchor
jest.mock('next/link', () => {
  return ({ children, href, className, ...props }: any) => (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  )
})

// Mock next/navigation redirect
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
    },
  }),
}))

describe('HomePage Landing Page', () => {
  it('renders the global navigation with SITRACK branding', async () => {
    const Component = await HomePage()
    render(Component)
    const sitracks = screen.getAllByText('SITRACK')
    expect(sitracks.length).toBeGreaterThanOrEqual(1)
  })

  it('renders navigation links (Cara Kerja, Fitur, Analytics)', async () => {
    const Component = await HomePage()
    render(Component)
    const caraKerja = screen.getAllByText('Cara Kerja')
    const fitur = screen.getAllByText('Fitur')
    const analytics = screen.getAllByText('Analytics')
    expect(caraKerja.length).toBeGreaterThanOrEqual(1)
    expect(fitur.length).toBeGreaterThanOrEqual(1)
    expect(analytics.length).toBeGreaterThanOrEqual(1)
  })

  it('renders the "Masuk" login button', async () => {
    const Component = await HomePage()
    render(Component)
    const masuks = screen.getAllByText('Masuk')
    expect(masuks.length).toBeGreaterThanOrEqual(1)
  })

  it('renders the hero headline', async () => {
    const Component = await HomePage()
    render(Component)
    expect(screen.getByText(/Telusuri Jejak/i)).toBeInTheDocument()
  })

  it('renders the hero description', async () => {
    const Component = await HomePage()
    render(Component)
    expect(screen.getByText(/Sistem informasi tracer study/i)).toBeInTheDocument()
  })

  it('renders hero CTA buttons', async () => {
    const Component = await HomePage()
    render(Component)
    const portalButtons = screen.getAllByText('Masuk ke Portal')
    const pelajariButtons = screen.getAllByText('Pelajari Lebih Lanjut')
    expect(portalButtons.length).toBeGreaterThanOrEqual(1)
    expect(pelajariButtons.length).toBeGreaterThanOrEqual(1)
  })

  it('renders the "Cara Kerja" section with 3 steps', async () => {
    const Component = await HomePage()
    render(Component)
    expect(screen.getByText('Cara Kerja.')).toBeInTheDocument()
    expect(screen.getAllByText('Masuk ke Portal').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Isi Data & Kuesioner')).toBeInTheDocument()
    expect(screen.getByText('Akses Career Center')).toBeInTheDocument()
  })

  it('renders the Analytics section with "Data yang Berbicara" heading', async () => {
    const Component = await HomePage()
    render(Component)
    expect(screen.getByText('Data yang Berbicara.')).toBeInTheDocument()
  })

  it('renders the stat cards (Employment Rate, Response Rate, Field Match)', async () => {
    const Component = await HomePage()
    render(Component)
    expect(screen.getByText('Employment Rate')).toBeInTheDocument()
    expect(screen.getByText('Response Rate')).toBeInTheDocument()
    expect(screen.getByText('Field Match')).toBeInTheDocument()
  })

  it('renders the Features section heading', async () => {
    const Component = await HomePage()
    render(Component)
    expect(screen.getByText('Fitur Lengkap.')).toBeInTheDocument()
  })

  it('renders all 6 feature cards', async () => {
    const Component = await HomePage()
    render(Component)
    expect(screen.getByText('Track Record')).toBeInTheDocument()
    expect(screen.getByText('Tracer Study')).toBeInTheDocument()
    expect(screen.getByText('Career Center')).toBeInTheDocument()
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Analytics & Laporan')).toBeInTheDocument()
    expect(screen.getByText('Keamanan RBAC')).toBeInTheDocument()
  })

  it('renders the CTA section with "Siap Memulai?" heading', async () => {
    const Component = await HomePage()
    render(Component)
    expect(screen.getByText('Siap Memulai?')).toBeInTheDocument()
  })

  it('renders the footer with brand and sections', async () => {
    const Component = await HomePage()
    render(Component)
    expect(screen.getByText('Platform')).toBeInTheDocument()
    expect(screen.getByText('Akun')).toBeInTheDocument()
    expect(screen.getByText('Kampus')).toBeInTheDocument()
  })

  it('renders footer link to official university website', async () => {
    const Component = await HomePage()
    render(Component)
    expect(screen.getByText('Website Resmi')).toBeInTheDocument()
  })

  it('uses soft off-white background (#FAFBFC) instead of pure white', async () => {
    const Component = await HomePage()
    const { container } = render(Component)
    const mainDiv = container.querySelector('.min-h-screen')
    expect(mainDiv).toHaveClass('bg-[#FAFBFC]')
  })

  it('renders trust indicators (Terdata & Terverifikasi, Aman & Privat, Untuk Akreditasi)', async () => {
    const Component = await HomePage()
    render(Component)
    expect(screen.getByText('Terdata & Terverifikasi')).toBeInTheDocument()
    expect(screen.getByText('Aman & Privat')).toBeInTheDocument()
    expect(screen.getAllByText('Untuk Akreditasi').length).toBeGreaterThanOrEqual(1)
  })
})
