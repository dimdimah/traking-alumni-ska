'use client'

import { useState } from 'react'
import { Award, Plus, X } from 'lucide-react'
import { formatCertifications, parseCertifications } from '@/lib/utils/certifications'

interface CertificationInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function CertificationInput({
  value,
  onChange,
  placeholder = 'Nama sertifikasi, contoh: AWS Certified Cloud Practitioner',
}: CertificationInputProps) {
  const [name, setName] = useState('')
  const [issuer, setIssuer] = useState('')
  const [year, setYear] = useState('')
  const [error, setError] = useState('')

  const certifications = parseCertifications(value)

  function addCertification() {
    const certName = name.trim()
    if (!certName) {
      setError('Nama sertifikasi wajib diisi.')
      return
    }
    const exists = certifications.some(
      (c) => c.name.toLowerCase() === certName.toLowerCase(),
    )
    if (exists) {
      setError('Sertifikasi sudah tersimpan.')
      return
    }
    onChange(
      formatCertifications([
        ...certifications,
        { name: certName, issuer: issuer.trim() || undefined, year: year.trim() || undefined },
      ]),
    )
    setName('')
    setIssuer('')
    setYear('')
    setError('')
  }

  function removeCertification(index: number) {
    onChange(formatCertifications(certifications.filter((_, i) => i !== index)))
  }

  return (
    <div className="w-full">
      {/* Daftar sertifikasi — masing-masing dalam kartu terstruktur */}
      {certifications.length > 0 ? (
        <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {certifications.map((cert, index) => (
            <div
              key={`${cert.name}-${index}`}
              className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amikom-purple/10 text-amikom-purple">
                <Award className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Sertifikasi #{index + 1}
                </p>
                <p className="mt-0.5 text-xs font-medium text-slate-800" title={cert.name}>
                  {cert.name}
                </p>
                {(cert.issuer || cert.year) && (
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">
                    {[cert.issuer, cert.year].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeCertification(index)}
                className="rounded-sm p-0.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                aria-label={`Hapus sertifikasi ${cert.name}`}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs text-slate-400">
          Belum ada sertifikasi. Tambahkan nama, penerbit, dan tahun perolehannya.
        </p>
      )}

      {/* Input terstruktur: nama (wajib) + penerbit + tahun */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_88px_auto]">
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); if (error) setError('') }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addCertification()
            }
          }}
          placeholder={placeholder}
          aria-label="Nama sertifikasi"
          className="min-h-[40px] w-full rounded-md border border-amikom-hairline bg-amikom-canvas px-3.5 py-2.5 text-sm text-amikom-ink outline-none transition-all placeholder:text-amikom-ink/30 focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20"
        />
        <input
          type="text"
          value={issuer}
          onChange={(e) => setIssuer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addCertification()
            }
          }}
          placeholder="Penerbit (opsional)"
          aria-label="Penerbit sertifikasi"
          className="min-h-[40px] w-full rounded-md border border-amikom-hairline bg-amikom-canvas px-3.5 py-2.5 text-sm text-amikom-ink outline-none transition-all placeholder:text-amikom-ink/30 focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20"
        />
        <input
          type="text"
          value={year}
          onChange={(e) => setYear(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addCertification()
            }
          }}
          placeholder="Tahun"
          inputMode="numeric"
          aria-label="Tahun perolehan sertifikasi"
          className="min-h-[40px] w-full rounded-md border border-amikom-hairline bg-amikom-canvas px-3.5 py-2.5 text-sm text-amikom-ink outline-none transition-all placeholder:text-amikom-ink/30 focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20"
        />
        <button
          type="button"
          onClick={addCertification}
          className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-md border border-amikom-purple/30 bg-amikom-purple/5 px-3.5 py-2.5 text-xs font-semibold text-amikom-purple transition-all active:scale-[0.98] hover:bg-amikom-purple/10"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Tambah
        </button>
      </div>

      {error ? (
        <p className="mt-1.5 text-[10px] text-red-500" role="alert">{error}</p>
      ) : certifications.length > 0 ? (
        <p className="mt-1.5 text-[10px] text-slate-400">
          {certifications.length} sertifikasi tersimpan — tambahkan penerbit &amp; tahun agar lebih lengkap.
        </p>
      ) : null}
    </div>
  )
}