'use client'

const HEADERS = [
  'Nama',
  'Email',
  'Password',
  'Role',
  'Tahun Lulus',
]

const SAMPLE_DATA = [
  ['Budi Santoso', 'budi@amikomsolo.ac.id', 'rahasia123', 'user', '2023'],
  ['Siti Aminah', 'siti@amikomsolo.ac.id', 'amikom456', 'user', '2022'],
  ['Ahmad Fauzi', 'ahmad@amikomsolo.ac.id', 'fauzi789', 'super_user', '2021'],
  ['Dewi Lestari', 'dewi@amikomsolo.ac.id', 'lestari321', 'user', '2024'],
  ['Rudi Hartono', 'rudi@amikomsolo.ac.id', 'hartono654', 'user', ''],
]

export async function generateExcelBlob(): Promise<Blob> {
  const XLSX = await import('xlsx-js-style')

  const wb = XLSX.utils.book_new()
  const wsData = [HEADERS, ...SAMPLE_DATA]
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:H1')
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C })
      if (!ws[cellRef]) continue
      const cell = ws[cellRef] as any
      if (R === 0) {
        cell.s = {
          fill: { patternType: 'solid', fgColor: { rgb: 'FF7E22CE' } },
          font: { color: { rgb: 'FFFFFFFF' }, bold: true },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: 1 },
          border: {
            top: { style: 'thin', color: { rgb: 'FF000000' } },
            bottom: { style: 'thin', color: { rgb: 'FF000000' } },
            left: { style: 'thin', color: { rgb: 'FF000000' } },
            right: { style: 'thin', color: { rgb: 'FF000000' } },
          },
        }
      } else {
        cell.s = {
          alignment: { vertical: 'center', wrapText: 1 },
          border: {
            top: { style: 'thin', color: { rgb: 'FF000000' } },
            bottom: { style: 'thin', color: { rgb: 'FF000000' } },
            left: { style: 'thin', color: { rgb: 'FF000000' } },
            right: { style: 'thin', color: { rgb: 'FF000000' } },
          },
        }
      }
    }
  }

  ws['!cols'] = [
    { wch: 20 }, { wch: 35 }, { wch: 20 }, { wch: 12 }, { wch: 14 },
  ]
  ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2' }

  XLSX.utils.book_append_sheet(wb, ws, 'Template Import')

  const xlsxBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return new Blob([xlsxBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

export async function excelFileToCSV(file: File): Promise<string> {
  const XLSX = await import('xlsx-js-style')

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const csv = XLSX.utils.sheet_to_csv(ws)
        resolve(csv)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Gagal membaca file Excel'))
    reader.readAsArrayBuffer(file)
  })
}

export async function exportPreviewToExcel(data: Array<{
  email: string
  name: string
  password: string
  role: string
  skills: string
  location: string
  valid: boolean
}>): Promise<void> {
  const XLSX = await import('xlsx-js-style')

  const wsData = [
    ['Nama', 'Email', 'Password', 'Role', 'Status'],
    ...data.map(d => [
      d.name, d.email, d.password, d.role,
      d.valid ? 'Valid' : 'Invalid'
    ])
  ]

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:F1')
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C })
      if (!ws[cellRef]) continue
      const cell = ws[cellRef] as any
      if (R === 0) {
        cell.s = {
          fill: { patternType: 'solid', fgColor: { rgb: 'FF7E22CE' } },
          font: { color: { rgb: 'FFFFFFFF' }, bold: true },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: 1 },
          border: {
            top: { style: 'thin', color: { rgb: 'FF000000' } },
            bottom: { style: 'thin', color: { rgb: 'FF000000' } },
            left: { style: 'thin', color: { rgb: 'FF000000' } },
            right: { style: 'thin', color: { rgb: 'FF000000' } },
          },
        }
      } else {
        const rowData = data[R - 1]
        cell.s = {
          fill: rowData?.valid ? { patternType: 'solid', fgColor: { rgb: 'FFDCFCE7' } } : { patternType: 'solid', fgColor: { rgb: 'FFFEE2E2' } },
          alignment: { vertical: 'center', wrapText: 1 },
          border: {
            top: { style: 'thin', color: { rgb: 'FF000000' } },
            bottom: { style: 'thin', color: { rgb: 'FF000000' } },
            left: { style: 'thin', color: { rgb: 'FF000000' } },
            right: { style: 'thin', color: { rgb: 'FF000000' } },
          },
        }
      }
    }
  }

  ws['!cols'] = [
    { wch: 20 }, { wch: 35 }, { wch: 20 }, { wch: 12 }, { wch: 10 }
  ]
  ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2' }

  XLSX.utils.book_append_sheet(wb, ws, 'Hasil Import')

  const statsWs = XLSX.utils.aoa_to_sheet([
    ['Statistik', ''],
    ['Total', data.length],
    ['Valid', data.filter(d => d.valid).length],
    ['Invalid', data.filter(d => !d.valid).length],
  ])
  statsWs['!cols'] = [{ wch: 15 }, { wch: 10 }]
  XLSX.utils.book_append_sheet(wb, statsWs, 'Statistik')

  const xlsxBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([xlsxBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `hasil-import-${new Date().toISOString().split('T')[0]}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function DownloadTemplateButton() {
  async function handleDownload() {
    const blob = await generateExcelBlob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'template-import-alumni.xlsx')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="rounded-lg border border-amikom-purple/20 bg-amikom-purple/5 p-5 animate-fade-in-up" style={{ animationDelay: '0.03s' }}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amikom-purple/10 text-amikom-purple">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Download Template Excel</p>
            <p className="text-xs text-slate-600 mt-0.5">Kolom wajib: Nama, Email, Password. Kolom opsional: Role, Tahun Lulus</p>
          </div>
        </div>
        <button
          onClick={handleDownload}
          className="flex-shrink-0 rounded-md bg-amikom-purple px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-amikom-purple-hover active:scale-[0.98] flex items-center gap-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download .xlsx
        </button>
      </div>
    </div>
  )
}