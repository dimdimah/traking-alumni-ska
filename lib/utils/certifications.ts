export interface CertificationEntry {
  name: string
  issuer?: string
  year?: string
}

const FIELD_SEP = '|'
const ENTRY_SEP = '\n'

// Normalisasi nilai dari berbagai bentuk (array DB jsonb, string, null)
export function normalizeCertifications(value: string | string[] | null | undefined): string {
  if (!value) return ''
  return typeof value === 'string' ? value : value.join(ENTRY_SEP)
}

// Parse menjadi entri terstruktur { name, issuer, year }.
// Mendukung format baru ("Nama|Penerbit|2024", dipisah baris baru) dan
// format lama ("Nama, Nama2" atau "Nama; Nama2" tanpa metadata).
export function parseCertifications(value: string | string[] | null | undefined): CertificationEntry[] {
  const raw = normalizeCertifications(value)
  if (!raw.trim()) return []

  const entries: CertificationEntry[] = []
  for (const block of raw.split(ENTRY_SEP)) {
    const trimmed = block.trim()
    if (!trimmed) continue

    if (trimmed.includes(FIELD_SEP)) {
      const [name, issuer, year] = trimmed.split(FIELD_SEP).map(p => p?.trim() ?? '')
      if (name) entries.push({ name, issuer: issuer || undefined, year: year || undefined })
    } else {
      for (const part of trimmed.split(/[,;]/)) {
        const name = part.trim()
        if (name) entries.push({ name })
      }
    }
  }
  return entries
}

export function formatCertifications(entries: CertificationEntry[]): string {
  return entries
    .map(entry => {
      const name = entry.name.trim()
      if (!name) return ''
      const fields = [name, entry.issuer?.trim() ?? '', entry.year?.trim() ?? '']
      return fields
        .join(FIELD_SEP)
        .replace(/\|+$/, '')
        .trim()
    })
    .filter(Boolean)
    .join(ENTRY_SEP)
}

// Hanya nama sertifikasi — dipakai untuk dokumen similarity rekomendasi
// (penerbit & tahun metadata tidak ikut dibandingkan).
export function getCertificationNames(value: string | string[] | null | undefined): string[] {
  const names: string[] = []
  for (const entry of parseCertifications(value)) {
    if (!names.some(n => n.toLowerCase() === entry.name.toLowerCase())) {
      names.push(entry.name)
    }
  }
  return names
}