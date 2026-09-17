'use server'

import { revalidatePath } from 'next/cache'
import { trackRecordSchema } from '@/lib/schemas/track-record'
import { withAuth, orThrow } from './helpers'

export async function createTrackRecord(formData: FormData) {
  const { supabase, user } = await withAuth()

  const raw = {
    company: formData.get('company') as string,
    position: formData.get('position') as string,
    start_date: formData.get('start_date') as string,
    end_date: (formData.get('end_date') as string) || null,
    description: (formData.get('description') as string) || null,
    is_current: formData.get('is_current') === 'true',
  }

  const parsed = trackRecordSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map(e => e.message).join(', '))
  }

  const { error } = await supabase
    .from('track_records')
    .insert({
      company: parsed.data.company,
      position: parsed.data.position,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date ?? null,
      description: parsed.data.description ?? null,
      is_current: parsed.data.is_current,
      idempotency_key: parsed.data.idempotency_key ?? null,
      user_id: user.id,
    })

  orThrow(error, 'Gagal buat track record', 'Gagal menyimpan riwayat kerja. Silakan coba lagi.')

  revalidatePath('/dashboard/track-record')
}

export async function updateTrackRecord(id: string, formData: FormData) {
  const { supabase, user } = await withAuth()

  const raw = {
    company: formData.get('company') as string,
    position: formData.get('position') as string,
    start_date: formData.get('start_date') as string,
    end_date: (formData.get('end_date') as string) || null,
    description: (formData.get('description') as string) || null,
    is_current: formData.get('is_current') === 'true',
  }

  const parsed = trackRecordSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map(e => e.message).join(', '))
  }

  const { error } = await supabase
    .from('track_records')
    .update({
      company: parsed.data.company,
      position: parsed.data.position,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date ?? null,
      description: parsed.data.description ?? null,
      is_current: parsed.data.is_current,
      idempotency_key: parsed.data.idempotency_key ?? null,
    })
    .eq('id', id)

  orThrow(error, 'Gagal update track record', 'Gagal menyimpan riwayat kerja. Silakan coba lagi.')

  revalidatePath('/dashboard/track-record')
}

export async function deleteTrackRecord(id: string) {
  const { supabase } = await withAuth()

  const { error } = await supabase
    .from('track_records')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Gagal hapus track record:', error.message)
    throw new Error('Gagal menghapus riwayat kerja. Silakan coba lagi.')
  }

  revalidatePath('/dashboard/track-record')
}
