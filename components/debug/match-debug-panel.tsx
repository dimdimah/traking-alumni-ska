'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { getMatchDebug } from '@/lib/actions/matching'
import type { MatchDebugPayload, JobMatchDebug, JobDocSample, ProfileSourceField } from '@/types/database'

function fmt(n: number): string {
  return n.toFixed(3)
}

function fmtCount(n: number): string {
  return n.toLocaleString('id-ID')
}

function FmtTime({ iso }: { iso: string }) {
  const [label, setLabel] = useState<string>(iso)
  useEffect(() => {
    const d = new Date(iso)
    setLabel(d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
  }, [iso])
  return <span>{label}</span>
}

function MatchTermsTable({ entry }: { entry: JobMatchDebug }) {
  if (entry.matchedTerms.length === 0) {
    return (
      <p className="text-[11px] text-slate-400">Tidak ada kata yang cocok dengan token profil.</p>
    )
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px] font-mono">
        <thead>
          <tr className="text-left text-slate-400 uppercase tracking-wider border-b border-slate-200">
            <th className="py-1 pr-3">term</th>
            <th className="py-1 px-2">TF profil</th>
            <th className="py-1 px-2">TF job</th>
            <th className="py-1 px-2">IDF</th>
            <th className="py-1 px-2">bobot prof</th>
            <th className="py-1 px-2">bobot job</th>
            <th className="py-1 px-2 text-right">kontribusi</th>
          </tr>
        </thead>
        <tbody>
          {entry.matchedTerms.map((t) => (
            <tr key={t.term} className="border-b border-slate-100">
              <td className="py-1 pr-3 font-semibold text-amikom-purple">{t.term}</td>
              <td className="py-1 px-2">{fmt(t.profileTf)}</td>
              <td className="py-1 px-2">{fmt(t.jobTf)}</td>
              <td className="py-1 px-2">{fmt(t.idf)}</td>
              <td className="py-1 px-2">{fmt(t.profileWeight)}</td>
              <td className="py-1 px-2">{fmt(t.jobWeight)}</td>
              <td className="py-1 px-2 text-right font-semibold">{fmt(t.contribution)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CosineFormula({ entry }: { entry: JobMatchDebug }) {
  const { dotProduct, magnitudeProfile, magnitudeJob } = entry.cosine
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50/70 px-3 py-2 font-mono text-[11px] text-slate-600">
      <p className="text-slate-400 uppercase tracking-wider text-[10px] mb-1">Rumus cosine</p>
      <p className="truncate">
        cos(θ) = (A·B) / (||A|| × ||B||)
      </p>
      <p className="truncate mt-1">
        = {fmt(dotProduct)} / ({fmt(magnitudeProfile)} × {fmt(magnitudeJob)})
      </p>
      <p className="truncate mt-1">
        = {fmt(entry.cosine.score)}
      </p>
    </div>
  )
}

function EntryCard({
  rank,
  entry,
  onToggle,
  expanded,
}: {
  rank: number
  entry: JobMatchDebug
  onToggle: () => void
  expanded: boolean
}) {
  const percent = Math.round(entry.score * 100)
  const topTerm = entry.matchedTerms[0]?.term ?? '—'
  const topContrib = entry.matchedTerms[0]?.contribution ?? 0
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50/60 transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-[11px] font-bold font-mono text-slate-600">
            {rank}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{entry.title}</p>
            <p className="text-[11px] text-slate-500 truncate">
              {entry.company} · {entry.location ?? '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-mono text-xs text-slate-600">
            {entry.matchedTerms.length} cocok
          </span>
          <span className={`font-mono text-sm font-bold ${percent >= 40 ? 'text-emerald-600' : 'text-slate-600'}`}>
            {percent}%
          </span>
          <span className="text-slate-300">{expanded ? '−' : '+'}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3 space-y-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
              Token lowongan (setelah preprocessing)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {entry.jobTokens.length > 0 ? (
                entry.jobTokens.map((t) => (
                  <span key={t} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600">
                    {t}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-slate-400">—</span>
              )}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
              Perhitungan TF-IDF — bobot tiap kata yang cocok (TF × IDF)
            </p>
            <MatchTermsTable entry={entry} />
          </div>

          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
              Perhitungan Cosine — similaritas antara vektor profil & lowongan
            </p>
            <CosineFormula entry={entry} />
            <p className="mt-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
              Kata pendorong utama: <span className="text-amikom-purple">{topTerm}</span> (kontribusi {fmt(topContrib)})
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function SourceList({ source }: { source: ProfileSourceField[] }) {
  if (source.length === 0) {
    return <p className="text-[11px] text-slate-400">Profil kosong.</p>
  }
  return (
    <ul className="space-y-1.5">
      {source.map((field) => (
        <li key={field.label} className="text-[11px]">
          <span className="font-mono text-slate-400">{field.label}</span>
          {field.value ? (
            <span className="ml-2 text-slate-700">{field.value}</span>
          ) : (
            <span className="ml-2 text-slate-300 italic">kosong</span>
          )}
        </li>
      ))}
    </ul>
  )
}

function StepItem({
  n,
  title,
  children,
}: {
  n: number
  title: string
  children: React.ReactNode
}) {
  return (
    <li className="flex gap-3">
      <span className="shrink-0 mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amikom-purple text-[10px] font-bold font-mono text-white">
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">{title}</p>
        <div className="mt-1">{children}</div>
      </div>
    </li>
  )
}

function TokensRow({ tokens, emptyLabel }: { tokens: string[]; emptyLabel: string }) {
  if (tokens.length === 0) {
    return <p className="text-[11px] text-slate-400 italic">{emptyLabel}</p>
  }
  return (
    <div className="flex flex-wrap gap-1">
      {tokens.map((t) => (
        <span key={t} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600">
          {t}
        </span>
      ))}
    </div>
  )
}

// Baris collapsible generik: header tombol + isi yang bisa dibuka/ditutup.
function AccordionRow({
  rank,
  headerLeft,
  badge,
  defaultOpen,
  children,
}: {
  rank?: number
  headerLeft: React.ReactNode
  badge?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <li className="rounded-md border border-slate-200">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-slate-50/60 transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 min-w-0">
          {rank !== undefined && (
            <span className="shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold font-mono text-slate-600">
              {rank}
            </span>
          )}
          <span className="min-w-0 truncate text-xs font-medium text-slate-800">{headerLeft}</span>
        </span>
        <span className="flex items-center gap-2 shrink-0">
          {badge}
          <span className="text-slate-300">{open ? '−' : '+'}</span>
        </span>
      </button>
      {open && (
        <div className="border-t border-slate-100 px-3 py-2.5">
          {children}
        </div>
      )}
    </li>
  )
}

// Daftar dengan pagination + accordion per item.
function PagedRows<T>({
  items,
  pageSize,
  resetKey,
  label,
  emptyLabel,
  renderRow,
}: {
  items: T[]
  pageSize: number
  resetKey: string
  label: string
  emptyLabel: string
  renderRow: (item: T, index: number) => React.ReactNode
}) {
  const [page, setPage] = useState(1)
  useEffect(() => setPage(1), [resetKey])
  const start = (page - 1) * pageSize
  const slice = items.slice(start, start + pageSize)
  return (
    <div className="space-y-1.5">
      {items.length > 0 && (
        <div className="mb-1.5">
          <Pager page={page} pageSize={pageSize} total={items.length} onChange={setPage} label={label} />
        </div>
      )}
      {items.length === 0 ? (
        <p className="text-[11px] text-slate-400 italic">{emptyLabel}</p>
      ) : (
        <ul className="space-y-1.5">
          {slice.map((item, index) => (
            <li key={index}>{renderRow(item, start + index + 1)}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Lapisan pemformatan dokumen profil (raw mentah).
function ProfileRaw({ raw }: { raw: string }) {
  if (!raw) {
    return <p className="text-[11px] text-slate-400 italic">Profil belum diisi atau tidak ada data.</p>
  }
  return (
    <div>
      <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
        Dokumen Profil Mentah <span className="text-slate-400">· {fmtCount(raw.length)} karakter</span>
      </p>
      <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-slate-700 bg-slate-50 rounded-md p-2.5">
        {raw}
      </pre>
    </div>
  )
}

// Langkah 2 — pembentukan dokumen lowongan: gabung 5 bagian → dokumen mentah.
function JobDocumentBuild({ sample }: { sample: JobDocSample }) {
  return (
    <div className="space-y-3">
      <div className="rounded-md border border-slate-200 bg-slate-50/70 px-3 py-2 space-y-1">
        <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
          Langkah A · gabung {JOB_DOC_FIELDS.length} bagian secara berurutan
        </p>
        {JOB_DOC_FIELDS.map((field) => {
          const value = sample.fields[field]
          return (
            <p key={field} className="font-mono text-[11px] leading-relaxed">
              <span className="text-slate-400">{field}</span>
              <span className="text-slate-300"> → </span>
              {value ? (
                <span className="text-slate-700">{value}</span>
              ) : (
                <span className="text-slate-300 italic">kosong</span>
              )}
            </p>
          )
        })}
      </div>

      <div>
        <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
          Langkah B · dokumen mentah <span className="text-slate-400">· {fmtCount(sample.raw.length)} karakter</span>
        </p>
        <pre className="mt-1 max-h-28 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-slate-700 bg-slate-50 rounded-md p-2.5">
          {sample.raw}
        </pre>
      </div>
    </div>
  )
}

// Langkah 3 — preprocessing teks: dokumen mentah → token (tanpa skor, sesuai urutan database).
function JobPreprocess({ sample }: { sample: JobDocSample }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
          Langkah C · preprocessing (case fold → bersihkan → tokenisasi → stopword → stem)
        </p>
        <p className="mt-1 text-[10px] font-mono text-slate-400">
          Sumber mentah · {fmtCount(sample.raw.length)} karakter → token · {fmtCount(sample.tokens.length)}
        </p>
        <div className="mt-1">
          <TokensRow tokens={sample.tokens} emptyLabel="Tidak ada token setelah preprocessing." />
        </div>
      </div>
    </div>
  )
}

// Bagian-bagian yang menyusun dokumen lowongan (urutan penggabungan di buildJobDocument)
const JOB_DOC_FIELDS = ['title', 'description', 'skills', 'location', 'type'] as const

function CorpusNote({ totalJobs }: { totalJobs: number }) {
  const totalDocs = totalJobs + 1
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50/70 px-3 py-2 font-mono text-[11px] text-slate-600">
      <p>
        Korpus untuk IDF: <span className="font-semibold text-slate-800">1</span> dokumen profil +{' '}
        <span className="font-semibold text-slate-800">{fmtCount(totalJobs)}</span>{' '}
        dokumen lowongan = <span className="text-amikom-purple font-bold">{fmtCount(totalDocs)} dokumen</span>
      </p>
    </div>
  )
}

function Pager({
  page,
  pageSize,
  total,
  onChange,
  label,
}: {
  page: number
  pageSize: number
  total: number
  onChange: (next: number) => void
  label: string
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:border-slate-400 disabled:opacity-40 transition-colors"
      >
        ‹ Sebelumnya
      </button>
      <span className="font-mono text-[11px] text-slate-500">
        {label} {total === 0 ? '0' : `${fmtCount(start)}–${fmtCount(end)}`} dari{' '}
        <span className="font-semibold text-slate-700">{fmtCount(total)}</span> · hal {fmtCount(page)}/{fmtCount(totalPages)}
      </span>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:border-slate-400 disabled:opacity-40 transition-colors"
      >
        Berikutnya ›
      </button>
    </div>
  )
}

function DocumentStepsPanel({
  data,
  expandedEntry,
  onToggleEntry,
}: {
  data: MatchDebugPayload
  expandedEntry: string | null
  onToggleEntry: (jobId: string) => void
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
      <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
        Tahapan Pembentukan Dokumen
      </p>
      <ol className="space-y-4">
        <StepItem n={1} title="Ambil data profil alumni & lowongan aktif">
          <SourceList source={data.profileSource} />
          <div className="mt-2 rounded-md border border-slate-200 bg-slate-50/70 px-3 py-2 font-mono text-[11px] text-slate-600">
            <p>
              Lowongan aktif yang diambil: <span className="font-semibold text-slate-800">{fmtCount(data.totalJobs)}</span>{' '}
              (urutan sesuai database, diperbarui otomatis)
            </p>
          </div>
        </StepItem>

        <StepItem n={2} title="Pembentukan dokumen">
          <p className="text-[11px] text-slate-600">
            Dokumen profil {data.profileRaw ? `(${fmtCount(data.profileRaw.length)} karakter)` : '(kosong)'} dan
            dokumen lowongan diurutkan sesuai urutan database dibentuk dari beberapa bagian yang digabung:
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {JOB_DOC_FIELDS.map((field) => (
              <span
                key={field}
                className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600"
              >
                {field}
              </span>
            ))}
          </div>
          <div className="mt-2">
            <ProfileRaw raw={data.profileRaw} />
          </div>
          <p className="mt-3 text-[11px] font-mono uppercase tracking-wider text-slate-500">
            Dokumen lowongan ({fmtCount(data.jobSamples.length)})
          </p>
          <PagedRows
            key="build"
            items={data.jobSamples}
            pageSize={10}
            resetKey={data.generatedAt}
            label="Lowongan"
            emptyLabel="Belum ada lowongan."
            renderRow={(sample) => (
              <AccordionRow
                headerLeft={sample.title}
                badge={<span className="font-mono text-[10px] text-slate-400">{fmtCount(sample.raw.length)} char</span>}
                defaultOpen={false}
              >
                <JobDocumentBuild sample={sample} />
              </AccordionRow>
            )}
          />
        </StepItem>

        <StepItem n={3} title="Preprocessing teks">
          <p className="text-[11px] text-slate-600">
            Dokumen di-preprocess: case fold → bersihkan simbol → tokenisasi → hapus stopword →
            stemming. Tahap ini <span className="font-semibold text-slate-800">belum menghitung skor</span> —
            hanya menyiapkan daftar token.
          </p>
          <div className="mt-2">
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1">
              Token profil ({fmtCount(data.profileTokens.length)})
            </p>
            <TokensRow tokens={data.profileTokens} emptyLabel="Profil kosong — tidak ada token." />
          </div>
          <p className="mt-3 text-[11px] font-mono uppercase tracking-wider text-slate-500">
            Token per lowongan — sesuai urutan database
          </p>
          <PagedRows
            key="preprocess"
            items={data.jobSamples}
            pageSize={10}
            resetKey={data.generatedAt}
            label="Lowongan"
            emptyLabel="Belum ada lowongan."
            renderRow={(sample) => (
              <AccordionRow
                headerLeft={sample.title}
                badge={<span className="font-mono text-[10px] text-slate-400">{fmtCount(sample.tokens.length)} token</span>}
                defaultOpen={false}
              >
                <JobPreprocess sample={sample} />
              </AccordionRow>
            )}
          />
        </StepItem>

        <StepItem n={4} title="Pembobotan (TF-IDF)">
          <p className="text-[11px] text-slate-600">
            Setiap kata yang cocok antara profil & lowongan diberi bobot:
            <span className="font-mono font-semibold text-slate-800"> bobot = TF × IDF</span>, dengan
            IDF = ln(N/df) + 1. Semakin langka kata (df kecil), semakin besar bobotnya.
          </p>
          <div className="mt-2">
            <CorpusNote totalJobs={data.totalJobs} />
          </div>
          <p className="mt-3 text-[11px] font-mono uppercase tracking-wider text-slate-500">
            Bobot tiap lowongan
          </p>
          <PagedRows
            key="weight"
            items={data.entries}
            pageSize={10}
            resetKey={data.generatedAt}
            label="Lowongan"
            emptyLabel="Tidak ada lowongan untuk dihitung."
            renderRow={(entry) => (
              <AccordionRow
                headerLeft={entry.title}
                badge={<span className="font-mono text-[11px] font-semibold text-amikom-purple">{Math.round(entry.score * 100)}%</span>}
                defaultOpen={false}
              >
                <MatchTermsTable entry={entry} />
              </AccordionRow>
            )}
          />
        </StepItem>

        <StepItem n={5} title="Cosine similarity">
          <p className="text-[11px] text-slate-600">
            Vektor bobot profil (A) dan lowongan (B) dibandingkan:
            <span className="font-mono font-semibold text-slate-800"> cos(θ) = (A·B) / (||A|| × ||B||)</span>.
            Hasil 0–1 → persen skor.
          </p>
          <p className="mt-3 text-[11px] font-mono uppercase tracking-wider text-slate-500">
            Cosine tiap lowongan
          </p>
          <PagedRows
            key="cosine"
            items={data.entries}
            pageSize={10}
            resetKey={data.generatedAt}
            label="Lowongan"
            emptyLabel="Tidak ada lowongan untuk dihitung."
            renderRow={(entry) => (
              <AccordionRow
                headerLeft={entry.title}
                badge={<span className="font-mono text-[11px] font-semibold text-amikom-purple">{Math.round(entry.score * 100)}%</span>}
                defaultOpen={false}
              >
                <CosineFormula entry={entry} />
              </AccordionRow>
            )}
          />
        </StepItem>

        <StepItem n={6} title="Perangkingan & hasil">
          <p className="text-[11px] text-slate-600">
            Skor diurutkan menurun, lalu dipotong Top-N untuk daftar rekomendasi. Perangkingan
            lengkap bisa dibuka untuk melihat breakdown bobot & cosine.
          </p>
          <div className="mt-1.5 space-y-2">
            {data.entries.length > 0 ? (
              <PagedRows
                key="rank"
                items={data.entries}
                pageSize={10}
                resetKey={data.generatedAt}
                label="Lowongan"
                emptyLabel="Tidak ada lowongan."
                renderRow={(entry, rank) => (
                  <EntryCard
                    entry={entry}
                    rank={rank}
                    expanded={expandedEntry === entry.jobId}
                    onToggle={() => onToggleEntry(entry.jobId)}
                  />
                )}
              />
            ) : (
              <p className="text-[11px] text-slate-400 italic mt-1">Tidak ada lowongan untuk dianalisa.</p>
            )}
          </div>
        </StepItem>
      </ol>
    </section>
  )
}

export default function MatchDebugPanel() {
  const [data, setData] = useState<MatchDebugPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [auto, setAuto] = useState(true)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    setRefreshing(true)
    try {
      const next = await getMatchDebug()
      setData(next)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Auto-refresh: lowongan terus bertambah, panel disegarkan berkala tanpa render ulang penuh.
  useEffect(() => {
    if (!auto) return
    timerRef.current = setInterval(() => {
      load()
    }, 30000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [auto, load])

  if (error && !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600 font-mono">
        Gagal memuat debug: {error}
      </div>
    )
  }
  if (!data) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-amikom-purple border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border-2 border-dashed border-amber-400 bg-amber-50/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-amber-700">
              Mode Diagnostik · {fmtCount(data.totalJobs)} lowongan aktif
            </p>
            <p className="text-xs text-slate-600">
              Diperbarui otomatis tiap 30 detik sebagai respons lowongan baru.
              Terakhir: <FmtTime iso={data.generatedAt} />
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-[11px] text-slate-600">
              <input
                type="checkbox"
                checked={auto}
                onChange={(e) => setAuto(e.target.checked)}
                className="h-3.5 w-3.5 accent-amikom-purple"
              />
              Auto-refresh
            </label>
            <button
              type="button"
              onClick={load}
              disabled={refreshing}
              className="shrink-0 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-[11px] font-medium text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-60"
            >
              {refreshing ? 'Menyegarkan…' : 'Segarkan Sekarang'}
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-600 font-mono">
          Refresh gagal (data lama tetap tampil): {error}
        </div>
      )}

      <DocumentStepsPanel
        data={data}
        expandedEntry={expanded}
        onToggleEntry={(jobId) => setExpanded(expanded === jobId ? null : jobId)}
      />
    </div>
  )
}