'use client'

import { useRef, useState, useCallback } from 'react'
import NextImage from 'next/image'
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react'

// ─── Konstanta ───
const MAX_INPUT_BYTES = 5 * 1024 * 1024   // 5MB — batas file yang boleh dimasukkan
const MAX_OUTPUT_BYTES = 2 * 1024 * 1024  // 2MB — batas setelah kompresi (untuk validasi)
const MAX_DIMENSION = 1280                 // px — sisi terpanjang gambar hasil kompresi
const JPEG_QUALITY = 0.82                  // kualitas JPEG output (0–1)

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * Kompres gambar menggunakan Canvas API browser.
 * - Resize ke MAX_DIMENSION px di sisi terpanjang
 * - Output JPEG dengan JPEG_QUALITY
 */
async function compressImage(file: File): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img')
    const objectUrl = URL.createObjectURL(file)

    const timeout = setTimeout(() => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Waktu kompresi habis. Coba lagi dengan file yang lebih kecil.'))
    }, 15000)

    img.onload = () => {
      clearTimeout(timeout)
      URL.revokeObjectURL(objectUrl)

      let { width, height } = img
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width >= height) {
          height = Math.round((height * MAX_DIMENSION) / width)
          width = MAX_DIMENSION
        } else {
          width = Math.round((width * MAX_DIMENSION) / height)
          height = MAX_DIMENSION
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas tidak tersedia'))

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Gagal mengompres gambar'))
          const reader = new FileReader()
          reader.onload = () => resolve({ blob, dataUrl: reader.result as string })
          reader.onerror = () => reject(new Error('Gagal membaca gambar'))
          reader.readAsDataURL(blob)
        },
        'image/jpeg',
        JPEG_QUALITY
      )
    }

    img.onerror = () => {
      clearTimeout(timeout)
      URL.revokeObjectURL(objectUrl)
      reject(new Error('File bukan gambar yang valid. Pastikan file adalah JPG, PNG, atau WebP yang tidak rusak.'))
    }

    img.src = objectUrl
  })
}

// ─── Props ───
interface ImageUploadProps {
  /** URL gambar saat ini (dari DB saat edit) */
  currentUrl?: string
  /** Dipanggil saat gambar berhasil diproses. Kembalikan compressed Blob untuk di-upload */
  onImageReady: (blob: Blob | null) => void
  /** Label untuk field ini */
  label?: string
  /** Apakah field ini required */
  required?: boolean
  /** Hint di bawah uploader */
  hint?: string
}

export function ImageUpload({
  currentUrl,
  onImageReady,
  label = 'Gambar',
  required = false,
  hint,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const [status, setStatus] = useState<'idle' | 'compressing' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [sizeInfo, setSizeInfo] = useState<{ before: number; after: number } | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const processFile = useCallback(async (file: File) => {
    setError(null)
    setSizeInfo(null)

    // Validasi tipe
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (JPG, PNG, WebP)')
      return
    }

    // Validasi ukuran input
    if (file.size > MAX_INPUT_BYTES) {
      setError(`Ukuran file terlalu besar. Maksimal ${formatBytes(MAX_INPUT_BYTES)} sebelum kompresi.`)
      return
    }

    setStatus('compressing')

    try {
      const { blob, dataUrl } = await compressImage(file)

      // Peringatan jika hasil kompresi masih > 2MB (sangat jarang, tapi bisa terjadi pada gambar yang sangat besar)
      if (blob.size > MAX_OUTPUT_BYTES) {
        setError(`Gambar masih ${formatBytes(blob.size)} setelah kompresi. Coba gunakan gambar yang lebih kecil.`)
        setStatus('error')
        return
      }

      setSizeInfo({ before: file.size, after: blob.size })
      setPreview(dataUrl)
      setStatus('done')
      onImageReady(blob)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memproses gambar')
      setStatus('error')
    }
  }, [onImageReady])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    // reset input agar file yang sama bisa dipilih ulang
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  function handleRemove() {
    setPreview(null)
    setStatus('idle')
    setError(null)
    setSizeInfo(null)
    onImageReady(null)
  }

  return (
    <div>
      <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {preview ? (
        // ─── Preview state ───
        <div className="relative rounded-xl border border-amikom-hairline overflow-hidden bg-slate-50">
          <NextImage
             src={preview}
             alt="Preview gambar"
             width={800} height={400}
             className="w-full max-h-48 object-cover"
          />
          {/* Overlay actions */}
          <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors group flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="hidden group-hover:flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow hover:bg-slate-50 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              Ganti
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="hidden group-hover:flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-red-700 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Hapus
            </button>
          </div>
          {/* Size info badge */}
          {sizeInfo && (
            <div className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-1 text-[10px] text-white backdrop-blur-sm">
              {formatBytes(sizeInfo.before)} → {formatBytes(sizeInfo.after)}
              {' '}
              <span className="text-emerald-300">
                (-{Math.round((1 - sizeInfo.after / sizeInfo.before) * 100)}%)
              </span>
            </div>
          )}
        </div>
      ) : (
        // ─── Drop zone ───
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload gambar — klik atau seret file ke sini"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click() } }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-8 cursor-pointer transition-all ${
            dragOver
              ? 'border-amikom-purple bg-amikom-purple/5 scale-[1.01]'
              : 'border-slate-200 bg-slate-50 hover:border-amikom-purple/50 hover:bg-slate-100'
          }`}
        >
          {status === 'compressing' ? (
            <Loader2 className="h-7 w-7 animate-spin text-amikom-purple" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm">
              <ImageIcon className="h-6 w-6 text-slate-400" />
            </div>
          )}
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">
              {status === 'compressing' ? 'Mengompres gambar...' : 'Klik atau seret gambar ke sini'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              JPG, PNG, WebP · Maks. {formatBytes(MAX_INPUT_BYTES)} · Auto-kompres ke {formatBytes(MAX_OUTPUT_BYTES)}
            </p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
          <X className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      {/* Hint */}
      {hint && !error && (
        <p className="mt-1.5 text-xs text-slate-400">{hint}</p>
      )}

      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="sr-only"
        aria-hidden="true"
      />
    </div>
  )
}
