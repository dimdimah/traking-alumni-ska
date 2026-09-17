'use client'

import { Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { resolveBreadcrumbs } from '@/lib/breadcrumbs'

const STATUS_LABELS: Record<string, string> = {
  bekerja: 'Bekerja',
  kuliah: 'Melanjutkan Studi',
  belum: 'Mencari Kerja',
}

function BreadcrumbInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const items = resolveBreadcrumbs(pathname)

  // Baca search params per page
  const angkatan = searchParams.get('angkatan')
  const year = searchParams.get('year')
  const type = searchParams.get('type')
  const status = searchParams.get('status')
  const networkYear = searchParams.get('year')

  if (items.length === 0) return null

  // Tentukan extra items berdasarkan pathname
  const extraItems: { label: string; key: string }[] = []

  if (pathname === '/admin/kuesioner' && angkatan) {
    extraItems.push({ label: `Angkatan ${angkatan}`, key: 'angkatan' })
  }

  if (pathname === '/admin/analytics' && year) {
    extraItems.push({ label: `Tahun ${year}`, key: 'year' })
  }

  if (pathname === '/dashboard/network') {
    if (networkYear && networkYear !== 'all') {
      extraItems.push({ label: `Angkatan ${networkYear}`, key: 'year' })
    }
    if (status && status !== 'all' && STATUS_LABELS[status]) {
      extraItems.push({ label: STATUS_LABELS[status], key: 'status' })
    }
  }

  if ((pathname === '/dashboard/career' || pathname === '/user/lowongan') && type && type !== 'All') {
    extraItems.push({ label: type, key: 'type' })
  }

  const hasExtraItems = extraItems.length > 0

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item) => (
          <BreadcrumbItem key={item.href}>
            {item.isLast && !hasExtraItems ? (
              <BreadcrumbPage className="text-sm font-medium text-amikom-ink">
                {item.label}
              </BreadcrumbPage>
            ) : (
              <>
                <BreadcrumbLink asChild>
                  <Link href={item.href} className="text-sm text-amikom-ink/40 hover:text-amikom-purple transition-colors">
                    {item.label}
                  </Link>
                </BreadcrumbLink>
                <BreadcrumbSeparator />
              </>
            )}
          </BreadcrumbItem>
        ))}
        {extraItems.map((extra, i) => (
          <BreadcrumbItem key={extra.key}>
            {i === extraItems.length - 1 ? (
              <BreadcrumbPage className="text-sm font-medium text-amikom-ink">
                {extra.label}
              </BreadcrumbPage>
            ) : (
              <>
                <BreadcrumbLink asChild>
                  <Link href={pathname} className="text-sm text-amikom-ink/40 hover:text-amikom-purple transition-colors">
                    {extra.label}
                  </Link>
                </BreadcrumbLink>
                <BreadcrumbSeparator />
              </>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export default function DashboardBreadcrumb() {
  return (
    <Suspense fallback={null}>
      <BreadcrumbInner />
    </Suspense>
  )
}
