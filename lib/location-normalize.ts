// ─────────────────────────────────────────────────────────────
// Normalisasi Lokasi — menyetarakan penulisan lokasi
// ─────────────────────────────────────────────────────────────
// `preferred_location` alumni memakai label kawasan ("Solo Raya",
// "Remote / WFH") sedangkan `jobs.location` adalah teks bebas
// ("Solo", "Kota Yogyakarta", "Hybrid"). Agar keduanya bisa cocok
// satu sama lain, masing-masing diencerkan ke token kanonik.

const LOCATION_ALIASES: Record<string, string> = {
  // Solo Raya (Surakarta + kabupaten sekitarnya)
  solo: 'solo',
  surakarta: 'solo',
  soloraya: 'solo',
  klaten: 'solo',
  sukoharjo: 'solo',
  karanganyar: 'solo',
  wonogiri: 'solo',
  sragen: 'solo',
  boyolali: 'solo',
  // Yogyakarta
  jogja: 'yogyakarta',
  yogya: 'yogyakarta',
  yogyakarta: 'yogyakarta',
  kotayogyakarta: 'yogyakarta',
  diy: 'yogyakarta',
  sleman: 'yogyakarta',
  bantul: 'yogyakarta',
  kulonprogo: 'yogyakarta',
  gunungkidul: 'yogyakarta',
  // Semarang
  semarang: 'semarang',
  kotasemarang: 'semarang',
  // Jakarta
  jakarta: 'jakarta',
  jakartaselatan: 'jakarta',
  jakartapusat: 'jakarta',
  jakartautara: 'jakarta',
  jakartabarat: 'jakarta',
  jakartatimur: 'jakarta',
  dki: 'jakarta',
  jabodetabek: 'jakarta',
  // Bandung
  bandung: 'bandung',
  kotabandung: 'bandung',
  // Surabaya
  surabaya: 'surabaya',
  kotasurabaya: 'surabaya',
  // Malang
  malang: 'malang',
  kotamalang: 'malang',
  // Bali
  bali: 'bali',
  denpasar: 'bali',
  badung: 'bali',
  gianyar: 'bali',
  kutabali: 'bali',
  // Remote / WFH / Hybrid
  remote: 'remote',
  hybrid: 'remote',
  wfh: 'remote',
  workfromhome: 'remote',
  workfromanywhere: 'remote',
  fullyremote: 'remote',
  telework: 'remote',
  telecommute: 'remote',
  online: 'remote',
  onsite: 'onsite',
}

const ALL_INDONESIA_KEYS = new Set(['seluruh indonesia', 'seluruhindonesia'])

/**
 * Mengubah string lokasi menjadi token kanonik (satu kata, lowercase).
 * - "Solo Raya" → ["solo"]  |  "Kota Yogyakarta" → ["yogyakarta"]
 * - "Remote / WFH" → ["remote"]  |  "Jakarta Selatan" → ["jakarta"]
 * - "Seluruh Indonesia" → [] (tidak membatasi lokasi)
 */
export function canonicalLocationTokens(
  location: string | null | undefined,
): string[] {
  if (!location) return []
  const raw = location.toLowerCase().replace(/\s+/g, ' ').trim()

  if (ALL_INDONESIA_KEYS.has(raw)) return []

  const seen = new Set<string>()
  const result: string[] = []

  const add = (token: string) => {
    if (!seen.has(token)) {
      seen.add(token)
      result.push(token)
    }
  }

  // 1) Coba frasa utuh sebagai satu kata (tanpa spasi/separator):
  //    "Kota Yogyakarta" → "kotayogyakarta", "Work From Home" → "workfromhome".
  const compact = raw.replace(/[^a-z0-9]/g, '')
  const compactAlias = LOCATION_ALIASES[compact]
  if (compactAlias && compactAlias !== compact) {
    return [compactAlias]
  }

  // 2) Pecah per kata berdasar pemisah umum: koma, slash, strip, plus, kurung.
  const pieces = raw.split(/[\s,/()\-+]+/).filter(Boolean)

  for (const piece of pieces) {
    if (piece.length < 2) continue
    // Coba alias dulu (termasuk penulisan tanpa spasi, mis. "jakartaselatan")
    const canonical =
      LOCATION_ALIASES[piece] ?? LOCATION_ALIASES[piece.replace(/\s+/g, '')]
    add(canonical ?? piece)
  }

  return result
}