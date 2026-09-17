'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-2 pt-4">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-all hover:border-slate-300 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Sebelumnya
      </button>
      <span className="text-xs text-slate-500 font-mono">
        Halaman {currentPage} dari {totalPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-all hover:border-slate-300 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Selanjutnya
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
