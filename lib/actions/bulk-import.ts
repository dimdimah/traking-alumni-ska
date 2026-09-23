'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseCSVLine } from '@/lib/csv-utils'
import { requirePermission } from '@/lib/permissions/guards'
import { PERMISSIONS } from '@/lib/permissions'

const rowSchema = z.object({
  email: z.string().email('Email tidak valid').refine(
    (e) => e.toLowerCase().endsWith('@amikomsolo.ac.id'),
    'Hanya email @amikomsolo.ac.id'
  ),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  display_name: z.string().min(1, 'Nama wajib diisi'),
  skills: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  education_level: z.string().nullable().optional(),
  expected_salary: z.string().nullable().optional(),
  preferred_type: z.string().nullable().optional(),
  graduation_year: z.string().nullable().optional(),
})

export interface BulkImportResult {
  total: number
  success: number
  failed: number
  errors: { row: number; message: string }[]
}

export async function bulkImportUsers(raw: string): Promise<BulkImportResult> {
  await requirePermission(PERMISSIONS.ALUMNI_MANAGE)

  const lines = raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)

  if (lines.length > 0) {
    const firstLine = lines[0]
    if (/[\x00-\x08\x0E-\x1F]/.test(firstLine) || firstLine.startsWith('PK')) {
      return {
        total: 0, success: 0, failed: 0,
        errors: [{ row: 0, message: 'Format file tidak didukung. Upload file .csv (kompatibel) atau gunakan upload Excel dari form.' }],
      }
    }
  }

  if (lines.length < 2) {
    return { total: 0, success: 0, failed: 0, errors: [{ row: 0, message: 'Data kosong atau hanya header. Pastikan ada minimal 1 baris data.' }] }
  }

  const adminSupabase = createAdminClient()
  const result: BulkImportResult = { total: 0, success: 0, failed: 0, errors: [] }

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase())
  const nameIdx = headers.findIndex(h => h === 'nama' || h === 'name' || h === 'display_name')
  const emailIdx = headers.findIndex(h => h === 'email')
  const passwordIdx = headers.findIndex(h => h === 'password' || h === 'pass')
  const skillsIdx = headers.findIndex(h => h === 'skills' || h === 'skill')
  const locationIdx = headers.findIndex(h => h === 'location' || h === 'lokasi')
  const educationIdx = headers.findIndex(h => h === 'education level' || h === 'education_level' || h === 'pendidikan')
  const salaryIdx = headers.findIndex(h => h === 'expected salary' || h === 'expected_salary' || h === 'gaji')
  const typeIdx = headers.findIndex(h => h === 'preferred type' || h === 'preferred_type' || h === 'tipe')
  const graduationIdx = headers.findIndex(h => h === 'tahun lulus' || h === 'graduation_year' || h === 'angkatan')

  if (emailIdx === -1 || passwordIdx === -1 || nameIdx === -1) {
    return {
      total: 0, success: 0, failed: 0,
      errors: [{ row: 0, message: 'Header wajib: Nama, Email, Password. Opsional: Skills, Location, Education Level, Expected Salary, Preferred Type, Tahun Lulus' }],
    }
  }

  const dataLines = lines.slice(1)
  result.total = dataLines.length

  const CHUNK_SIZE = 5

  for (let chunkStart = 0; chunkStart < dataLines.length; chunkStart += CHUNK_SIZE) {
    const chunk = dataLines.slice(chunkStart, chunkStart + CHUNK_SIZE)
    const chunkResults = await Promise.allSettled(
      chunk.map(async (line, i) => {
        const rowNum = chunkStart + i + 2
        const cols = parseCSVLine(line)

        const display_name = cols[nameIdx] || ''
        const email = cols[emailIdx] || ''
        const password = cols[passwordIdx] || ''
        const skills = skillsIdx !== -1 ? (cols[skillsIdx] || null) : null
        const location = locationIdx !== -1 ? (cols[locationIdx] || null) : null
        const education_level = educationIdx !== -1 ? (cols[educationIdx] || null) : null
        const expected_salary = salaryIdx !== -1 ? (cols[salaryIdx] || null) : null
        const preferred_type = typeIdx !== -1 ? (cols[typeIdx] || null) : null
        const graduation_year = graduationIdx !== -1 ? (cols[graduationIdx] || null) : null

        const parsed = rowSchema.safeParse({ email, password, display_name, skills, location, education_level, expected_salary, preferred_type, graduation_year })
        if (!parsed.success) {
          return { success: false as const, rowNum, message: parsed.error.issues.map(e => e.message).join(', ') }
        }

        const { data: userData, error } = await adminSupabase.auth.admin.createUser({
          email: parsed.data.email,
          password: parsed.data.password,
          email_confirm: true,
          user_metadata: {
            display_name: parsed.data.display_name,
          },
        })

        if (error) {
          return { success: false as const, rowNum, message: error.message }
        }

        if (userData?.user) {
          const skillsArray = parsed.data.skills
            ? parsed.data.skills.split(/[,;]/).map(s => s.trim()).filter(Boolean)
            : []

          const graduationYear = parsed.data.graduation_year
            ? parseInt(parsed.data.graduation_year, 10)
            : null

          const { error: profileError } = await adminSupabase
            .from('profiles')
            .update({
              full_name: parsed.data.display_name,
              role: 'user',
              skills: skillsArray,
              location: parsed.data.location,
              education_level: parsed.data.education_level,
              expected_salary: parsed.data.expected_salary,
              preferred_type: parsed.data.preferred_type,
              graduation_year: graduationYear && !isNaN(graduationYear) ? graduationYear : null,
            })
            .eq('id', userData.user.id)

          if (profileError) {
            return { success: true as const, rowNum, message: `User dibuat tapi gagal update profil: ${profileError.message}` }
          }
        }

        return { success: true as const, rowNum, message: '' }
      })
    )

    for (const r of chunkResults) {
      if (r.status === 'fulfilled') {
        if (r.value.success) {
          result.success++
          if (r.value.message) result.errors.push({ row: r.value.rowNum, message: r.value.message })
        } else {
          result.failed++
          result.errors.push({ row: r.value.rowNum, message: r.value.message })
        }
      } else {
        result.failed++
        result.errors.push({ row: 0, message: r.reason?.message || 'Unknown error' })
      }
    }
  }

  revalidatePath('/super-user/users')
  revalidatePath('/admin/bulk-import')

  return result
}