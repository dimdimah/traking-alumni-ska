import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { Briefcase, Newspaper, Award, HelpCircle } from 'lucide-react'

export default function ManajemenKontenPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        icon={<span className="text-[11px]">◆</span>}
        label="Admin Panel"
        title="Manajemen Konten."
        subtitle="Kelola semua konten publik yang tampil di website UNIKOM."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <Link href="/admin/career-center" className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-sm hover:-translate-y-0.5 block">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amikom-purple/10 text-amikom-purple border border-amikom-purple/20 mb-4">
            <Briefcase className="h-5 w-5" />
          </div>
          <h3 className="font-sans text-lg font-semibold text-slate-900">Lowongan Kerja</h3>
          <p className="text-sm text-slate-600 mt-1">Kelola informasi lowongan kerja untuk alumni.</p>
        </Link>
        <Link href="/admin/content/berita" className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-sm hover:-translate-y-0.5 block">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amikom-purple/10 text-amikom-purple border border-amikom-purple/20 mb-4">
            <Newspaper className="h-5 w-5" />
          </div>
          <h3 className="font-sans text-lg font-semibold text-slate-900">Berita</h3>
          <p className="text-sm text-slate-600 mt-1">Kelola artikel dan berita terbaru kampus.</p>
        </Link>
        <Link href="/admin/content/sertifikasi" className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-sm hover:-translate-y-0.5 block">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amikom-purple/10 text-amikom-purple border border-amikom-purple/20 mb-4">
            <Award className="h-5 w-5" />
          </div>
          <h3 className="font-sans text-lg font-semibold text-slate-900">Sertifikasi</h3>
          <p className="text-sm text-slate-600 mt-1">Kelola daftar sertifikasi profesi &amp; kompetensi.</p>
        </Link>
        <Link href="/admin/content/faq" className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-sm hover:-translate-y-0.5 block">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amikom-purple/10 text-amikom-purple border border-amikom-purple/20 mb-4">
            <HelpCircle className="h-5 w-5" />
          </div>
          <h3 className="font-sans text-lg font-semibold text-slate-900">FAQ</h3>
          <p className="text-sm text-slate-600 mt-1">Kelola daftar pertanyaan yang sering diajukan.</p>
        </Link>
      </div>
    </div>
  )
}
