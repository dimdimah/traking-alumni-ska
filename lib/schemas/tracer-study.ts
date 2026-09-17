import { z } from 'zod'
import { EMPLOYMENT_STATUSES, EDUCATION_LEVELS } from '@/lib/constants'

const employmentStatusEnum = z.enum(EMPLOYMENT_STATUSES)
const educationLevelEnum = z.enum(EDUCATION_LEVELS)

export const SistemAlumniSchema = z.object({
  graduation_year: z.coerce.number().min(1990, 'Tahun lulus tidak valid').max(2030, 'Tahun lulus tidak valid'),
  education_level: educationLevelEnum,
  employment_status: employmentStatusEnum,
  company: z.string().nullable().optional(),
  position: z.string().nullable().optional(),
  salary_range: z.string().nullable().optional(),
  study_field_match: z.string().nullable().optional(),
  suggestions: z.string().nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.employment_status === 'Bekerja' || data.employment_status === 'Wirausaha') {
    if (!data.company || data.company.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Nama perusahaan wajib diisi',
        path: ['company'],
      })
    }
    if (!data.position || data.position.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Posisi/jabatan wajib diisi',
        path: ['position'],
      })
    }
  }
})

export type SistemAlumniFormData = z.infer<typeof SistemAlumniSchema>
