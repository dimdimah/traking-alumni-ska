'use client'

export async function exportAnalyticsSummaryToExcelClient(stats: {
  totalResponses: number
  employmentRate: number
  studyingRate: number
  salaryDistribution: Record<string, number>
  fieldMatchRate: number
}, year?: string) {
  const XLSX = await import('xlsx-js-style')

  const summaryRows = [
    ['Ringkasan Sistem Alumni' + (year ? ` - Tahun ${year}` : '')],
    [],
    ['Metrik', 'Nilai'],
    ['Total Responden', stats.totalResponses],
    ['Tingkat Bekerja', `${stats.employmentRate}%`],
    ['Tingkat Melanjutkan Studi', `${stats.studyingRate}%`],
    ['Kesesuaian Bidang', `${stats.fieldMatchRate}%`],
  ]

  const salaryEntries = Object.entries(stats.salaryDistribution).sort()
  const salaryRows = [
    [],
    ['Distribusi Gaji'],
    ['Range Gaji', 'Jumlah Alumni'],
    ...salaryEntries.map(([range, count]) => [range, count]),
  ]

  const ws = XLSX.utils.aoa_to_sheet([...summaryRows, ...salaryRows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Analytics Summary')

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `analytics-summary${year ? `-${year}` : ''}-${new Date().toISOString().split('T')[0]}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
