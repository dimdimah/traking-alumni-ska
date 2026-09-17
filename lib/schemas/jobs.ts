import { z } from 'zod'

export const jobSchema = z.object({
  title: z.string().min(1, 'Judul lowongan wajib diisi'),
  company: z.string().min(1, 'Nama perusahaan wajib diisi'),
  location: z.string().min(1, 'Lokasi wajib diisi'),
  type: z.enum(['Full-time', 'Part-time', 'Contract', 'Internship']),
  salary: z.string().nullable().optional(),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  skills: z.string().nullable().optional(),
  contact_info: z.string().nullable().optional(),
  url: z.string().url('URL harus valid').or(z.literal('')).default(''),
  source: z.string().default('Internal'),
  is_active: z.boolean().default(true),
})

export type JobFormData = z.infer<typeof jobSchema>
