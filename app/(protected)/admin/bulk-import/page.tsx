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

      </div>
  )
}
