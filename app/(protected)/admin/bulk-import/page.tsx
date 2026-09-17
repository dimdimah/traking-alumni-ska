import BulkImportForm from '@/components/super-user/bulk-import-form'
import DownloadTemplateButton from '@/components/download-template-button'
import { PageHeader } from '@/components/ui/page-header'

export default function AdminBulkImportPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1.5 animate-fade-in-up">
        <PageHeader
          icon={<span className="text-[11px]">📋</span>}
          label="Manajemen Alumni"
          title="Import Massal Alumni."
          subtitle="Upload file CSV untuk menambah banyak user alumni sekaligus. Akun langsung aktif tanpa verifikasi email."
        />
      </div>

      {/* Download Template */}
      <DownloadTemplateButton />

      {/* Form Card */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <BulkImportForm />
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-100 p-5 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <span className="mt-0.5 text-slate-900 text-sm font-bold">✦</span>
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-900">Ketentuan Format File</p>
          <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
            <li>Format yang didukung: <code className="text-amikom-purple">.xlsx</code> (Excel) atau <code className="text-amikom-purple">.csv</code></li>
            <li>Kolom: <code className="text-amikom-purple">Nama, Email, Password, Role, Skills, Location, Education Level, Expected Salary, Preferred Type</code></li>
            <li>Email harus <code className="text-amikom-purple">@amikomsolo.ac.id</code></li>
            <li>Password minimal 6 karakter</li>
            <li>Kolom <code className="text-amikom-purple">Role</code> opsional — <code className="text-amikom-purple">super_user</code> atau <code className="text-amikom-purple">user</code> (default)</li>
            <li>Kolom Matching (<code className="text-amikom-purple">Skills, Location, Education Level, Expected Salary, Preferred Type</code>) opsional</li>
            <li>Skills dipisahkan dengan koma atau titik koma: <code className="text-amikom-purple">JavaScript; React; Node.js</code></li>
            <li>Expected Salary format: <code className="text-amikom-purple">5-8 juta</code></li>
            <li>Akun langsung aktif — tanpa verifikasi email</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
