'use client'

import { useState, useRef } from 'react'
import { Search, CheckCircle2, XCircle, Loader2, GraduationCap, User, Hash, Users, Calendar } from 'lucide-react'
import { verifyAlumni, type VerifyResult } from '@/lib/actions/alumni-verify'

export function AlumniVerify() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<VerifyResult[]>([])
  const [selectedResult, setSelectedResult] = useState<VerifyResult | null>(null)
  const [searched, setSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return

    setLoading(true)
    setResults([])
    setSelectedResult(null)
    setSearched(false)

    try {
      const resultData = await verifyAlumni(q)

      if (resultData && resultData.length > 0) {
        setResults(resultData)
        setSelectedResult(resultData[0])
      } else {
        setResults([])
        setSelectedResult({ found: false })
      }
    } catch {
      setSelectedResult({ found: false })
    } finally {
      setLoading(false)
      setSearched(true)
    }
  }

  function handleReset() {
    setQuery('')
    setResults([])
    setSelectedResult(null)
    setSearched(false)
    inputRef.current?.focus()
  }

  return (
    <div className="mx-auto w-full max-w-[560px]">
      <form onSubmit={handleSearch} className="relative">
        <div className="flex items-center gap-2 rounded-2xl border border-amikom-hairline bg-white p-2 shadow-sm transition-all focus-within:border-amikom-purple/40 focus-within:shadow-md focus-within:shadow-amikom-purple/10">
          <Search className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Masukkan Nama atau NIM alumni..."
            aria-label="Cari alumni untuk verifikasi"
            className="flex-1 bg-transparent py-2 text-sm text-slate-900 placeholder-slate-400 outline-none"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="shrink-0 rounded-xl bg-amikom-purple px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-amikom-purple-hover disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cek'}
          </button>
        </div>
      </form>

      {searched && selectedResult && (
        <div className={`mt-4 rounded-2xl border p-5 transition-all animate-fade-in-up ${
          selectedResult.found
            ? 'border-emerald-200 bg-emerald-50'
            : 'border-red-200 bg-red-50'
        }`}>
          {selectedResult.found ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Alumni Terverifikasi</p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    Data terdaftar di sistem resmi STMIK AMIKOM Surakarta
                  </p>
                </div>
              </div>

              {results.length > 1 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <Users className="h-3 w-3 text-emerald-600" />
                  {results.map((r, i) => (
                    <button
                      key={r.nim ?? i}
                      onClick={() => setSelectedResult(r)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                        selectedResult.full_name === r.full_name
                          ? 'bg-emerald-200 text-emerald-800'
                          : 'bg-white/70 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {r.full_name}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 rounded-xl bg-white/80 p-4 border border-emerald-100/80 shadow-xs">
                {selectedResult.full_name && (
                  <div className="col-span-2 flex items-center gap-2.5">
                    <User className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Nama Lengkap</p>
                      <p className="text-sm font-semibold text-slate-900">{selectedResult.full_name}</p>
                    </div>
                  </div>
                )}
                {selectedResult.nim && (
                  <div className="flex items-center gap-2.5">
                    <Hash className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">NIM</p>
                      <p className="text-sm font-medium text-slate-800 font-mono">{selectedResult.nim}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Tahun Lulus</p>
                    <p className="text-sm font-medium text-slate-800">
                      {selectedResult.graduation_year ? `${selectedResult.graduation_year}` : '—'}
                    </p>
                  </div>
                </div>
                <div className="col-span-2 flex items-center gap-2.5">
                  <GraduationCap className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Program Studi</p>
                    <p className="text-sm font-medium text-slate-800">
                      {selectedResult.education_level || '—'}
                    </p>
                  </div>
                </div>
              </div>

              <button onClick={handleReset} className="text-xs text-emerald-600 hover:underline">
                Cari alumni lain
              </button>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white">
                <XCircle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800">Tidak Ditemukan</p>
                <p className="text-xs text-red-600 mt-0.5">
                  Alumni dengan nama atau NIM &ldquo;<span className="font-medium">{query}</span>&rdquo; tidak terdaftar di sistem UNIKOM.
                </p>
                <button onClick={handleReset} className="mt-3 text-xs text-red-600 hover:underline">
                  Coba lagi
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <p className="mt-3 text-center text-[11px] text-slate-400">
        Verifikasi menggunakan data resmi sistem alumni STMIK AMIKOM Surakarta
      </p>
    </div>
  )
}