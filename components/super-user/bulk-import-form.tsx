'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import { bulkImportUsers, type BulkImportResult } from '@/lib/actions/bulk-import'
import { excelFileToCSV, exportPreviewToExcel } from '@/components/download-template-button'
import { parseCSVLine } from '@/lib/csv-utils'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls']

export default function BulkImportForm() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [raw, setRaw] = useState('')
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BulkImportResult | null>(null)
  const [dragOver, setDragOver] = useState(false)

  // ── Drag & Drop handlers ──
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }, [])

  const processFile = useCallback((file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setResult({
        total: 0, success: 0, failed: 1,
        errors: [{ row: 0, message: `Format .${ext} tidak didukung. Upload file .csv atau .xlsx/.xls` }],
      })
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setResult({
        total: 0, success: 0, failed: 1,
        errors: [{ row: 0, message: `File terlalu besar (${(file.size / 1024 / 1024).toFixed(1)} MB). Maksimal 10 MB.` }],
      })
      return
    }

    setFileName(file.name)
    setResult(null)
    setLoading(true)

    ;(async () => {
      try {
        const isExcel = ext === '.xlsx' || ext === '.xls'
        if (isExcel) {
          const csv = await excelFileToCSV(file)
          setRaw(csv)
        } else {
          const text = await readFileAsText(file)
          setRaw(text)
        }
      } catch {
        setResult({
          total: 0, success: 0, failed: 1,
          errors: [{ row: 0, message: 'Gagal membaca file. Pastikan format file benar.' }],
        })
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }, [processFile])

  // ── File processing ──
  const handleExportPreview = async () => {
    if (preview.length > 0) await exportPreviewToExcel(preview)
  }

  function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Gagal membaca file'))
      reader.readAsText(file)
    })
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    processFile(file)
  }

  function clearFile() {
    setRaw('')
    setFileName('')
    setResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Preview (dengan validasi selaras dengan server) ──
  const preview = useMemo(() => {
    if (!raw.trim()) return []
    const clean = raw.replace(/\r\n/g, '\n').replace(/\r/g, '')
    const lines = clean.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    if (lines.length < 2) return []
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase())
    return lines.slice(1).map((line, i) => {
      const cols = parseCSVLine(line)
      const email = cols[headers.findIndex(h => h === 'email')] || ''
      const name = cols[headers.findIndex(h => h === 'nama' || h === 'name' || h === 'display_name')] || ''
      const password = cols[headers.findIndex(h => h === 'password' || h === 'pass')] || ''
      const role = cols[headers.findIndex(h => h === 'role' || h === 'roles')] || 'user'
      const skills = cols[headers.findIndex(h => h === 'skills' || h === 'skill')] || ''
      const location = cols[headers.findIndex(h => h === 'location' || h === 'lokasi')] || ''
      const graduationYear = cols[headers.findIndex(h => h === 'tahun lulus' || h === 'graduation_year' || h === 'angkatan')] || ''

      // Validasi preview selaras dengan Zod server:
      // - email harus @amikomsolo.ac.id
      // - nama tidak boleh kosong
      // - password minimal 8 karakter (uppercase, lowercase, digit)
      // - role di-hardcode 'user' (tidak diproses dari CSV untuk keamanan)
      const valid =
        name.length > 0 &&
        email.endsWith('@amikomsolo.ac.id') &&
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password)

      return { row: i + 2, email, name, password, role, skills, location, graduationYear, valid }
      // role diabaikan, akan di-set 'user' oleh server
    })
  }, [raw])

  async function handleImport() {
    if (!raw.trim()) return
    setImporting(true)
    setResult(null)
    try {
      const res = await bulkImportUsers(raw)
      setResult(res)
    } catch (err) {
      setResult({
        total: 0, success: 0, failed: 1,
        errors: [{ row: 0, message: err instanceof Error ? err.message : 'Gagal mengimpor' }],
      })
    } finally {
      setImporting(false)
    }
  }

  const isExcelFile = fileName.endsWith('.xlsx') || fileName.endsWith('.xls')

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">
          Upload File
        </label>
        <p className="text-xs text-slate-500">
          Format yang didukung: <code className="text-amikom-purple bg-sky-50 px-1 rounded">.xlsx</code> (Excel) atau <code className="text-amikom-purple bg-sky-50 px-1 rounded">.csv</code>
        </p>

        {!raw ? (
          <label
            className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-all ${
              dragOver
                ? 'border-amikom-purple bg-amikom-purple/5'
                : 'border-slate-300 bg-slate-50 hover:border-amikom-purple hover:bg-sky-50/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {loading ? (
              <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-amikom-purple border-t-transparent" />
            ) : (
              <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            )}
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600">
                {loading ? 'Membaca file...' : 'Klik untuk upload file'}
              </p>
              <p className="text-xs text-slate-400 mt-1">atau seret file ke sini</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFile}
              className="hidden"
            />
          </label>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-md ${
              isExcelFile ? 'bg-emerald-100 text-emerald-600' : 'bg-amikom-purple/10 text-amikom-purple'
            }`}>
              {isExcelFile ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{fileName}</p>
              <p className="text-xs text-slate-500">
                {isExcelFile ? 'Excel → CSV' : 'CSV'} · {preview.length} baris data
              </p>
            </div>
            <button
              onClick={clearFile}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-all hover:border-slate-400 hover:text-slate-900"
            >
              Ganti File
            </button>
          </div>
        )}
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <p className="text-xs font-mono text-slate-600">
              <span className="text-slate-900 font-medium">{preview.length}</span> baris akan diimpor
              <span className="text-slate-400 ml-2">
                ({preview.filter(p => p.valid).length} valid, {preview.filter(p => !p.valid).length} bermasalah)
              </span>
            </p>
          </div>
          <div className="overflow-x-auto max-h-48 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">#</th>
                  <th className="px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">Nama</th>
                  <th className="px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">Email</th>
                  <th className="px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">Password</th>
                  <th className="px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">Skills</th>
                  <th className="px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">Lokasi</th>
                  <th className="px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">Tahun Lulus</th>
                  <th className="px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {preview.map((p) => (
                  <tr key={p.row} className={`${!p.valid ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-2 text-slate-500 font-mono">{p.row}</td>
                    <td className="px-4 py-2 text-slate-900">{p.name || <span className="text-red-400">(kosong)</span>}</td>
                    <td className="px-4 py-2 text-slate-600">{p.email}</td>
                    <td className="px-4 py-2 text-slate-400 font-mono">{'•'.repeat(Math.min(p.password.length, 8))}</td>
                    <td className="px-4 py-2 text-slate-600 text-xs max-w-[150px] truncate">{p.skills || '—'}</td>
                    <td className="px-4 py-2 text-slate-600 text-xs">{p.location || '—'}</td>
                    <td className="px-4 py-2 text-slate-600 text-xs">{p.graduationYear || '—'}</td>
                    <td className="px-4 py-2">
                      {p.valid
                        ? <span className="text-green-600 text-[10px] font-mono" title="Valid">✓</span>
                        : <span className="text-red-500 text-[10px] font-mono" title={!p.name ? 'Nama kosong' : !p.email.endsWith('@amikomsolo.ac.id') ? 'Harus @amikomsolo.ac.id' : !/(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])/.test(p.password) || p.password.length < 8 ? 'Password: 8+ karakter (huruf besar, kecil, angka)' : 'Data tidak valid'}>✗</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import Button */}
      <button
        onClick={handleImport}
        disabled={importing || preview.length === 0}
        className="w-full rounded-md bg-amikom-purple px-5 py-3 text-sm font-semibold text-white transition-all active:scale-[0.98] hover:bg-amikom-purple-hover hover:text-amikom-jonquil-warm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {importing ? (
          <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Mengimpor...</>
        ) : (
          `Import ${preview.length > 0 ? `${preview.length} User` : 'Data'}`
        )}
      </button>

      {/* Results */}
      {result && (
        <div className={`rounded-lg border p-5 ${
          result.failed === 0
            ? 'border-green-200 bg-green-50'
            : result.success > 0
            ? 'border-amber-200 bg-amber-50'
            : 'border-red-200 bg-red-50'
        }`}>
          <div className="flex items-start gap-3">
            <span className={`mt-0.5 text-sm flex-shrink-0 ${
              result.failed === 0 ? 'text-green-600' : result.success > 0 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {result.failed === 0 ? '✓' : result.success > 0 ? '⚠' : '✗'}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${
                result.failed === 0 ? 'text-green-800' : result.success > 0 ? 'text-amber-800' : 'text-red-800'
              }`}>
                {result.success}/{result.total} berhasil diimpor
              </p>
              {result.errors.length > 0 && (
                <div className="mt-3 space-y-1">
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-red-600 font-mono">
                      {e.row > 0 ? `Baris ${e.row}: ` : ''}{e.message}
                    </p>
                  ))}
                </div>
              )}
              {result.success > 0 && (
                <p className="mt-2 text-xs text-green-700">
                  Akun langsung aktif tanpa verifikasi email.
                </p>
              )}
              {preview.length > 0 && (
                <button
                  onClick={handleExportPreview}
                  className="mt-3 rounded-md bg-slate-700 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-slate-800 active:scale-[0.98]"
                >
                  Export Preview ke Excel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
