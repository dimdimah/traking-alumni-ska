'use client'

import { QuickActionCard } from '@/components/ui/quick-action-card'

interface QuickActionsGridProps {
  trackCount: number
  tracerFilled: boolean
  jobCount: number
}

export function QuickActionsGrid({ trackCount, tracerFilled, jobCount }: QuickActionsGridProps) {
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      <QuickActionCard
        href="/dashboard/track-record"
        label="Riwayat Kerja"
        title="Kelola Riwayat Kerja"
        description={`${trackCount} record tersimpan`}
        iconColor="purple"
      />
      <QuickActionCard
        href="/dashboard/tracer-study"
        label="Tracer Study"
        title="Isi Kuesioner"
        description={tracerFilled ? 'Sudah diisi' : 'Belum diisi'}
        iconColor="green"
      />
      <QuickActionCard
        href="/dashboard/career"
        label="Lowongan Kerja"
        title="Lihat Lowongan"
        description={`${jobCount} lowongan aktif`}
        iconColor="blue"
      />
      <QuickActionCard
        href="/dashboard/profile"
        label="Profile"
        title="Edit Profil"
        description="Perbarui data diri"
        iconColor="slate"
      />
    </div>
  )
}