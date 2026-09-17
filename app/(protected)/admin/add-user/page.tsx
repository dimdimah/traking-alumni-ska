import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import AddUserForm from '@/components/admin/add-user-form'
import { PageHeader } from '@/components/ui/page-header'

export default function AdminAddUserPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <div className="space-y-1.5 animate-fade-in-up">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Dashboard
        </Link>
        <PageHeader
          icon={<span className="text-[11px]">+</span>}
          label="Tambahkan Alumni"
          title="Tambahkan Alumni Baru."
          subtitle="Buat akun alumni baru secara manual."
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <AddUserForm />
      </div>

      <div className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-100 p-5 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <span className="mt-0.5 text-slate-900 text-sm font-bold">✦</span>
        <div>
          <p className="text-sm font-medium text-slate-900">Info</p>
          <p className="mt-1 text-xs text-slate-600">
            User akan langsung aktif tanpa perlu verifikasi email. Password minimal 6 karakter dan email harus menggunakan domain <strong>@amikomsolo.ac.id</strong>.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-md border border-sky-200 bg-sky-50 p-5 animate-fade-in-up" style={{ animationDelay: '0.12s' }}>
        <span className="mt-0.5 text-amikom-purple text-sm flex-shrink-0">◇</span>
        <div>
          <p className="text-sm font-medium text-amikom-purple">Import Massal?</p>
          <p className="mt-1 text-xs text-slate-600">
            Ingin menambah banyak user sekaligus?{' '}
            <Link href="/admin/bulk-import" className="font-semibold text-amikom-purple underline decoration-amikom-purple/20 underline-offset-2 hover:decoration-amikom-purple">
              Gunakan import CSV
            </Link>
            untuk mengupload data puluhan user dalam sekali proses.
          </p>
        </div>
      </div>
    </div>
  )
}
