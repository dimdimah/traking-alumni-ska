'use server'

import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'
import { logAdminActivity } from '@/lib/actions/admin-logs'

export async function exportAlumniToExcel(): Promise<string> {
  const XLSX = await import('xlsx-js-style')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null; error: unknown }

  if (profile?.role !== 'super_user') throw new Error('Forbidden')

  const { data } = await supabase
    .from('profiles')
    .select('email, full_name, nim, graduation_year, role, phone, created_at')
    .order('created_at', { ascending: false })

  const profiles = (data || []) as Pick<Profile, 'email' | 'full_name' | 'nim' | 'graduation_year' | 'role' | 'phone' | 'created_at'>[]

  const rows = profiles.map(p => ({
    'Email': p.email,
    'Nama': p.full_name || '',
    'NIM': p.nim || '',
    'Tahun Lulus': p.graduation_year?.toString() || '',
    'Role': p.role === 'super_user' ? 'Super User' : 'User',
    'Telepon': p.phone || '',
    'Bergabung': p.created_at ? new Date(p.created_at).toLocaleDateString('id-ID') : '',
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Alumni')

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
    { wch: 30 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 15 }
  ]
  ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2' }

  // Catat log unduhan excel admin
  await logAdminActivity(
    'EXPORT_EXCEL',
    'Unduh Rekap Excel Data Alumni',
    `Mengunduh rekapan data ${profiles.length} alumni terdaftar`,
    { total_records: profiles.length, file_name: 'alumni.xlsx' }
  )

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })
  return Buffer.from(buffer).toString('base64')
}

export async function exportResponsesToExcel(angkatan: string): Promise<string> {
  const XLSX = await import('xlsx-js-style')
  const { createAdminClient } = await import('@/lib/supabase/admin')

  // Gunakan admin client (service_role) agar RLS (auth.uid() = user_id) tidak
  // membatasi jawaban yang bisa dibaca admin — fix "cuma beberapa jawaban keunduh".
  const supabase = createAdminClient()

  // 1. Fetch core responses + profiles
  const { data: responses } = await supabase
    .from('tracer_study_responses')
    .select(`
      user_id, graduation_year, education_level, employment_status,
      company, position, salary_range, study_field_match, suggestions, submitted_at
    `)
    .eq('graduation_year', Number(angkatan))
    .order('submitted_at', { ascending: false })

  if (!responses || responses.length === 0) {
    throw new Error('Belum ada data kuesioner untuk angkatan ini')
  }

  const userIds = responses.map(r => (r as Record<string, unknown>).user_id as string)

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, nim, email')
    .in('id', userIds)

  const profileMap = new Map(
    (profiles || []).map(p => [p.id, p])
  )

  // 2. Fetch all questions for column headers
  const { data: questions } = await supabase
    .from('tracer_study_questions')
    .select('id, question_text, display_order')
    .eq('angkatan', angkatan)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  const questionList = (questions || []) as { id: string; question_text: string; display_order: number }[]

  // 3. Fetch all answers
  const { data: allAnswers } = await supabase
    .from('tracer_study_answers')
    .select('user_id, question_id, answer_text')
    .in('user_id', userIds)

  const answerMap = new Map<string, Record<string, string>>()
  for (const a of (allAnswers || []) as { user_id: string; question_id: string; answer_text: string | null }[]) {
    if (!answerMap.has(a.user_id)) answerMap.set(a.user_id, {})
    if (a.answer_text) answerMap.get(a.user_id)![a.question_id] = a.answer_text
  }

  // 4. Build rows
  const baseHeaders: Record<string, string> = {
    no: 'No',
    nama: 'Nama',
    nim: 'NIM',
    email: 'Email',
    angkatan: 'Tahun Lulus',
    pendidikan: 'Pendidikan',
    status: 'Status Pekerjaan',
    perusahaan: 'Nama Perusahaan',
    posisi: 'Posisi',
    gaji: 'Kisaran Gaji',
    kesesuaian: 'Kesesuaian Bidang',
    saran: 'Kritik & Saran',
    tanggal: 'Tanggal Isi',
  }

  const questionHeaders = questionList.map(q => q.question_text)

  const rows = responses.map((r, i) => {
    const row = r as Record<string, unknown>
    const profile = profileMap.get(row.user_id as string) as { full_name: string | null; nim: string | null; email: string } | undefined
    const userAnswers = answerMap.get(row.user_id as string) || {}

    const rowData: Record<string, string | number> = {
      no: i + 1,
      nama: profile?.full_name || '',
      nim: profile?.nim || '',
      email: profile?.email || '',
      angkatan: row.graduation_year as number,
      pendidikan: (row.education_level as string) || '',
      status: (row.employment_status as string) || '',
      perusahaan: (row.company as string) || '',
      posisi: (row.position as string) || '',
      gaji: (row.salary_range as string) || '',
      kesesuaian: (row.study_field_match as string) || '',
      saran: (row.suggestions as string) || '',
      tanggal: row.submitted_at
        ? new Date(row.submitted_at as string).toLocaleDateString('id-ID')
        : '',
    }

    for (const q of questionList) {
      rowData[`q_${q.id}`] = userAnswers[q.id] || ''
    }

    return rowData
  })

  // 5. Create Excel
  const wsData = [
    Object.values(baseHeaders).concat(questionHeaders),
    ...rows.map(r => {
      const base = Object.keys(baseHeaders).map(k => r[k as keyof typeof r] ?? '')
      const qValues = questionList.map(q => r[`q_${q.id}`] ?? '')
      return base.concat(qValues)
    }),
  ]

  const ws = XLSX.utils.aoa_to_sheet(wsData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, `Responden ${angkatan}`)

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:Z1')
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C })
      if (!ws[cellRef]) continue
      const cell = ws[cellRef] as any
      if (R === 0) {
        cell.s = {
          fill: { patternType: 'solid', fgColor: { rgb: 'FF7E22CE' } },
          font: { color: { rgb: 'FFFFFFFF' }, bold: true, sz: 10 },
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
    { wch: 5 },   // No
    { wch: 30 },  // Nama
    { wch: 15 },  // NIM
    { wch: 30 },  // Email
    { wch: 12 },  // Tahun Lulus
    { wch: 20 },  // Pendidikan
    { wch: 18 },  // Status
    { wch: 25 },  // Perusahaan
    { wch: 20 },  // Posisi
    { wch: 15 },  // Gaji
    { wch: 18 },  // Kesesuaian
    { wch: 30 },  // Saran
    { wch: 15 },  // Tanggal
    ...questionList.map(() => ({ wch: 35 })),
  ]
  ws['!freeze'] = { xSplit: 1, ySplit: 1, topLeftCell: 'B2' }

  // 6. Sheet log pembaruan — satu sheet per hari (rentang 1 hari) dari tracer_study_history
  try {
    const { data: historyRows } = await supabase
      .from('tracer_study_history')
      .select(`
        user_id,
        submitted_at,
        snapshot,
        profiles ( full_name, nim, email )
      `)
      .eq('angkatan', angkatan)
      .order('submitted_at', { ascending: true }) as { data: any[] | null }

    if (historyRows && historyRows.length > 0) {
      // Hitung urutan pengisian per user: entri pertama = "Pengisian Kuesioner", berikutnya = "Pembaruan Data"
      const userEntryCount = new Map<string, number>()
      const allHistory = (historyRows as any[]).sort(
        (a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
      )
      for (const h of allHistory) {
        const count = (userEntryCount.get(h.user_id) || 0) + 1
        userEntryCount.set(h.user_id, count)
        h._entryNumber = count
      }

      const dayGroups = new Map<string, any[]>()

      for (const h of allHistory) {
        const d = new Date(h.submitted_at)
        const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        if (!dayGroups.has(dayKey)) dayGroups.set(dayKey, [])
        dayGroups.get(dayKey)!.push(h)
      }

      const days = [...dayGroups.keys()].sort().reverse()

      for (const day of days) {
        const entries = dayGroups.get(day)!
        const dayLabel = new Date(`${day}T12:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })

        const logRows: (string | number)[][] = [
          ['Waktu', 'Nama', 'NIM', 'Email', 'Aktivitas', 'Status Pekerjaan', 'Perusahaan', 'Posisi'],
          ...entries.map((e: any) => {
            const core = e.snapshot?.core_fields || {}
            const isUpdate = (e._entryNumber || 1) > 1
            return [
              new Date(e.submitted_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB',
              e.profiles?.full_name || 'Alumni',
              e.profiles?.nim || '',
              e.profiles?.email || '',
              isUpdate ? 'Pembaruan Data' : 'Pengisian Kuesioner',
              core.employment_status || '—',
              core.company || '',
              core.position || '',
            ]
          }),
        ]

        const wsLog = XLSX.utils.aoa_to_sheet(logRows)
        const logRange = XLSX.utils.decode_range(wsLog['!ref'] || 'A1:H1')
        for (let R = logRange.s.r; R <= logRange.e.r; R++) {
          for (let C = logRange.s.c; C <= logRange.e.c; C++) {
            const cellRef = XLSX.utils.encode_cell({ r: R, c: C })
            if (!wsLog[cellRef]) continue
            const cell = wsLog[cellRef] as any
            if (R === 0) {
              cell.s = {
                fill: { patternType: 'solid', fgColor: { rgb: 'FF7E22CE' } },
                font: { color: { rgb: 'FFFFFFFF' }, bold: true, sz: 10 },
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

        wsLog['!cols'] = [
          { wch: 22 }, { wch: 30 }, { wch: 15 }, { wch: 30 },
          { wch: 18 }, { wch: 18 }, { wch: 25 }, { wch: 20 },
        ]
        wsLog['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2' }

        XLSX.utils.book_append_sheet(wb, wsLog, `Log ${dayLabel}`)
      }
    }
  } catch (err) {
    console.error('Gagal membuat sheet log pembaruan:', err)
  }

  // Catat log unduhan excel rekapan kuesioner ke history log admin
  await logAdminActivity(
    'EXPORT_EXCEL',
    `Unduh Rekap Excel Kuesioner Angkatan ${angkatan}`,
    `Mengunduh rekapan data ${responses.length} responden alumni angkatan ${angkatan}`,
    {
      angkatan,
      total_records: responses.length,
      file_name: `jawaban-kuesioner-${angkatan}.xlsx`,
    }
  )

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })
  return Buffer.from(buffer).toString('base64')
}

export async function exportQuestionsToExcel(angkatan: string): Promise<string> {
  const XLSX = await import('xlsx-js-style')

  const supabase = await createClient()
  const { data } = await supabase
    .from('tracer_study_questions')
    .select('id, question_text, question_type, options, is_active, display_order, angkatan')
    .eq('angkatan', angkatan)
    .order('display_order', { ascending: true })

  const questions = (data || []) as {
    id: string
    question_text: string
    question_type: string
    options: string[] | null
    is_active: boolean
    display_order: number
  }[]

  const rows = questions.map(q => ({
    'No.': q.display_order,
    'Pertanyaan': q.question_text,
    'Tipe': q.question_type,
    'Opsi': q.options ? q.options.join(', ') : '',
    'Status': q.is_active ? 'Aktif' : 'Nonaktif',
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, `Pertanyaan ${angkatan}`)

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:E1')
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
    { wch: 8 }, { wch: 50 }, { wch: 20 }, { wch: 60 }, { wch: 12 }
  ]
  ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2' }

  // Catat log unduhan template kuesioner ke history log admin
  await logAdminActivity(
    'EXPORT_EXCEL',
    `Unduh Template Pertanyaan Angkatan ${angkatan}`,
    `Mengunduh ${questions.length} butir pertanyaan kuesioner angkatan ${angkatan}`,
    { angkatan, total_records: questions.length, file_name: `kuesioner-angkatan-${angkatan}.xlsx` }
  )

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })
  return Buffer.from(buffer).toString('base64')
}

export async function exportHistoryToExcel(angkatan: string): Promise<string> {
  const XLSX = await import('xlsx-js-style')
  const { createAdminClient } = await import('@/lib/supabase/admin')

  const supabase = createAdminClient()

  // 1. Ambil dari tracer_study_history
  const { data: historyRows } = await supabase
    .from('tracer_study_history')
    .select(`
      id, user_id, angkatan, snapshot, submitted_at,
      profiles ( full_name, nim, email )
    `)
    .eq('angkatan', angkatan)
    .order('submitted_at', { ascending: false }) as { data: any[] | null }

  let entries: any[] = []

  if (historyRows && historyRows.length > 0) {
    // Hitung urutan per user untuk menentukan "Pengisian Pertama" vs "Pembaruan"
    const sortedAsc = [...historyRows].sort(
      (a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
    )
    const userEntryCount = new Map<string, number>()
    const entryMap = new Map<string, number>()
    for (const h of sortedAsc) {
      const count = (userEntryCount.get(h.user_id) || 0) + 1
      userEntryCount.set(h.user_id, count)
      entryMap.set(h.id, count)
    }

    entries = historyRows.map(h => {
      const core = h.snapshot?.core_fields || {}
      const entryNum = entryMap.get(h.id) || 1
      return {
        full_name: h.profiles?.full_name || 'Alumni',
        nim: h.profiles?.nim || '',
        email: h.profiles?.email || '',
        submitted_at: h.submitted_at,
        type: entryNum === 1 ? 'Pengisian Kuesioner' : 'Pembaruan Data',
        education_level: core.education_level || '',
        employment_status: core.employment_status || '',
        company: core.company || '',
        position: core.position || '',
      }
    })
  } else {
    // Fallback dari tracer_study_responses
    const { data: responses } = await supabase
      .from('tracer_study_responses')
      .select(`
        user_id, graduation_year, education_level, employment_status,
        company, position, submitted_at, updated_at,
        profiles ( full_name, nim, email )
      `)
      .eq('graduation_year', Number(angkatan))
      .order('updated_at', { ascending: false })

    for (const r of (responses || []) as any[]) {
      const isUpdate = r.updated_at && r.submitted_at &&
        new Date(r.updated_at).getTime() - new Date(r.submitted_at).getTime() > 5000
      entries.push({
        full_name: r.profiles?.full_name || 'Alumni',
        nim: r.profiles?.nim || '',
        email: r.profiles?.email || '',
        submitted_at: r.updated_at || r.submitted_at,
        type: isUpdate ? 'Pembaruan Data' : 'Pengisian Kuesioner',
        education_level: r.education_level || '',
        employment_status: r.employment_status || '',
        company: r.company || '',
        position: r.position || '',
      })
    }
  }

  if (entries.length === 0) {
    throw new Error('Belum ada data riwayat untuk angkatan ini')
  }

  // 2. Build rows
  const rows = entries.map((e, i) => ({
    'No': i + 1,
    'Nama': e.full_name,
    'NIM': e.nim,
    'Email': e.email,
    'Waktu': e.submitted_at
      ? new Date(e.submitted_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB'
      : '',
    'Aktivitas': e.type,
    'Status Kerja': e.employment_status,
    'Perusahaan': e.company,
    'Posisi': e.position,
    'Pendidikan': e.education_level,
  }))

  // 3. Create Excel
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, `Riwayat ${angkatan}`)

  // 4. Style
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:J1')
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C })
      if (!ws[cellRef]) continue
      const cell = ws[cellRef] as any
      if (R === 0) {
        cell.s = {
          fill: { patternType: 'solid', fgColor: { rgb: 'FF7E22CE' } },
          font: { color: { rgb: 'FFFFFFFF' }, bold: true, sz: 10 },
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
    { wch: 5 },   // No
    { wch: 30 },  // Nama
    { wch: 15 },  // NIM
    { wch: 30 },  // Email
    { wch: 22 },  // Waktu
    { wch: 20 },  // Aktivitas
    { wch: 18 },  // Status Kerja
    { wch: 25 },  // Perusahaan
    { wch: 20 },  // Posisi
    { wch: 20 },  // Pendidikan
  ]
  ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2' }

  // 5. Catat log
  await logAdminActivity(
    'EXPORT_EXCEL',
    `Unduh Riwayat Log Angkatan ${angkatan}`,
    `Mengunduh ${entries.length} entri riwayat pengisian/pembaruan tracer study angkatan ${angkatan}`,
    { angkatan, total_records: entries.length, file_name: `riwayat-log-${angkatan}.xlsx` }
  )

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })
  return Buffer.from(buffer).toString('base64')
}

export async function exportCompanySurveysToExcel(): Promise<string> {
  const XLSX = await import('xlsx-js-style')
  const { createAdminClient } = await import('@/lib/supabase/admin')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null; error: unknown }

  if (profile?.role !== 'super_user') throw new Error('Forbidden')

  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('company_surveys')
    .select('*')
    .order('created_at', { ascending: false })

  const rows = (data || []).map((s: Record<string, unknown>, i: number) => ({
    'No': i + 1,
    'Tanggal': s.created_at ? new Date(s.created_at as string).toLocaleDateString('id-ID') : '',
    'Perusahaan': s.company_name,
    'Nama PIC': s.pic_name,
    'Jabatan PIC': s.position,
    'Email PIC': s.email,
    'Nama Alumni': s.alumni_name,
    'Tahun Lulus': s.alumni_graduation_year,
    'Program Studi': s.alumni_major,
    'Teamwork': s.teamwork,
    'IT Skill': s.it_skill,
    'Bahasa Inggris': s.english,
    'Komunikasi': s.communication,
    'Pengembangan Diri': s.self_development,
    'Kepemimpinan': s.leadership,
    'Etika Kerja': s.work_ethic,
    'Harapan': s.expectation || '',
    'Saran': s.suggestion || '',
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Survey Perusahaan')

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:R1')
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C })
      if (!ws[cellRef]) continue
      const cell = ws[cellRef] as Record<string, unknown>
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
    { wch: 5 }, { wch: 14 }, { wch: 28 }, { wch: 22 }, { wch: 18 }, { wch: 28 },
    { wch: 25 }, { wch: 12 }, { wch: 28 },
    { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 14 },
    { wch: 35 }, { wch: 35 },
  ]
  ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2' }

  // Catat log unduhan excel survey ke history log admin
  await logAdminActivity(
    'EXPORT_EXCEL',
    'Unduh Rekap Excel Survey Pengguna Lulusan',
    `Mengunduh rekapan data survey penilaian perusahaan (${rows.length} instansi)`,
    { total_records: rows.length, file_name: 'survey-perusahaan.xlsx' }
  )

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })
  return Buffer.from(buffer).toString('base64')
}