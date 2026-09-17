'use client'

import { useMemo } from 'react'
import { preprocess } from '@/lib/preprocessing'

interface SkillSuggestionsProps {
  description?: string | null
  jobSkills?: string[]
  userSkills?: string[]
  max?: number
}

const normalize = (s: string) => s.toLowerCase().trim()

export function SkillSuggestions({ description, jobSkills = [], userSkills = [], max = 3 }: SkillSuggestionsProps) {
  // Memoize agar preprocess(description) tidak jalan tiap parent re-render (12–20 cards per halaman)
  const suggestions = useMemo(() => {
    const owned = new Set(userSkills.map(normalize))

    // 1. Skill eksplisit lowongan yang belum dimiliki
    const fromList = jobSkills.filter((s) => !owned.has(normalize(s)))

    // 2. Kata kunci yang menonjol dari deskripsi (bukan milik user)
    const tokens = description ? preprocess(description) : []
    const freq = new Map<string, number>()
    for (const t of tokens) {
      if (t.length < 3) continue
      if (owned.has(t)) continue
      freq.set(t, (freq.get(t) || 0) + 1)
    }
    const fromDesc = [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, max)
      .map(([t]) => t)

    return [...new Set([...fromList, ...fromDesc])].slice(0, 5)
  }, [description, jobSkills, userSkills, max])

  if (suggestions.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-2">
      <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-amber-600">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
        </svg>
        Perlu ditambahkan
      </span>
      {suggestions.map((s) => (
        <span
          key={s}
          className="inline-flex items-center rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium font-mono text-amber-700"
        >
          {s}
        </span>
      ))}
    </div>
  )
}