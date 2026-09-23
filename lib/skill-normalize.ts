// ─────────────────────────────────────────────────────────────
// Normalisasi Skill & Peran Kerja — menyetarakan penulisan skill
// ─────────────────────────────────────────────────────────────
// Profil alumni dan lowongan menulis skill/peran dengan variasi
// penulisan yang berbeda ("UI/UX Design", "UX Designer", "Desainer
// UI", "ui ux designer"). Agar keduanya bisa dicocokkan, tiap
// penulisan di-encerkan ke konsep kanonik ("ui ux designer").
//
// Dua pemakaian:
// 1. canonicalSkillTokens() — mengubah teks/array skill → konsep kanonik.
// 2. hasSkillOverlap()    — gate rekomendasi (lihat catatan di fungsi):
//    konsep PERAN harus cocok dengan JUDUL lowongan — tag skills & deskripsi
//    tidak dihitung — sehingga lowongan berperan non-desain yang sekadar
//    mencantum "ui/ux" di antara puluhan tag skill (iOS/Flutter/Fullstack)
//    tidak lolos ke profil desain, dan seterusnya.

const SKILL_ALIASES: Record<string, string> = {
  // ── Software Engineer ──
  'software engineer': 'software engineer',
  'software engineering': 'software engineer',
  'software developer': 'software engineer',
  'software eng': 'software engineer',
  'insinyur perangkat lunak': 'software engineer',
  // ── Backend Developer ──
  'backend developer': 'backend developer',
  'backend engineer': 'backend developer',
  'back end developer': 'backend developer',
  'back end engineer': 'backend developer',
  'backend dev': 'backend developer',
  'developer backend': 'backend developer',
  'backend programmer': 'backend developer',
  'pengembang backend': 'backend developer',
  'server side developer': 'backend developer',
  'server side engineer': 'backend developer',
  // ── Frontend Developer ──
  'frontend developer': 'frontend developer',
  'front end developer': 'frontend developer',
  'front-end developer': 'frontend developer',
  'frontend engineer': 'frontend developer',
  'front end engineer': 'frontend developer',
  'frontend dev': 'frontend developer',
  'front end dev': 'frontend developer',
  'ui developer': 'frontend developer',
  'pengembang frontend': 'frontend developer',
  // ── Full Stack Developer ──
  'full stack developer': 'full stack developer',
  'full stack engineer': 'full stack developer',
  'fullstack developer': 'full stack developer',
  'fullstack engineer': 'full stack developer',
  'full stack dev': 'full stack developer',
  // ── Data Scientist ──
  'data scientist': 'data scientist',
  'data science': 'data scientist',
  'ilmuwan data': 'data scientist',
  // ── Data Analyst ──
  'data analyst': 'data analyst',
  'analis data': 'data analyst',
  'data analytics': 'data analyst',
  // ── DevOps Engineer ──
  'devops engineer': 'devops engineer',
  'devops developer': 'devops engineer',
  'dev ops engineer': 'devops engineer',
  'dev ops': 'devops engineer',
  devops: 'devops engineer',
  // ── Cloud Engineer ──
  'cloud engineer': 'cloud engineer',
  'cloud computing engineer': 'cloud engineer',
  'cloud developer': 'cloud engineer',
  'cloud architect': 'cloud engineer',
  // ── UI/UX Designer ──
  'ui ux designer': 'ui ux designer',
  'ui ux design': 'ui ux designer',
  'ui ux': 'ui ux designer',
  'ui designer': 'ui ux designer',
  'ux designer': 'ui ux designer',
  'ui design': 'ui ux designer',
  'ux design': 'ui ux designer',
  'user interface designer': 'ui ux designer',
  'user experience designer': 'ui ux designer',
  'user interface design': 'ui ux designer',
  'user experience design': 'ui ux designer',
  'product designer': 'ui ux designer',
  'ux researcher': 'ui ux designer',
  'desainer ui ux': 'ui ux designer',
  'desainer ui': 'ui ux designer',
  'desainer ux': 'ui ux designer',
  'desain ui ux': 'ui ux designer',
  'desain ui': 'ui ux designer',
  'desain ux': 'ui ux designer',
  // ── Graphic Designer ──
  'graphic designer': 'graphic designer',
  'graphic design': 'graphic designer',
  'graphics designer': 'graphic designer',
  'graphic artist': 'graphic designer',
  'desainer grafis': 'graphic designer',
  'desain grafis': 'graphic designer',
  'visual designer': 'graphic designer',
  // ── Multimedia Designer ──
  'multimedia designer': 'multimedia designer',
  'multimedia design': 'multimedia designer',
  'media designer': 'multimedia designer',
  'desainer multimedia': 'multimedia designer',
  // ── Video Editor ──
  'video editor': 'video editor',
  'video editing': 'video editor',
  'editor video': 'video editor',
  // ── Motion Graphic Designer ──
  'motion graphic designer': 'motion graphic designer',
  'motion graphics designer': 'motion graphic designer',
  'motion graphic design': 'motion graphic designer',
  'motion graphic': 'motion graphic designer',
  'motion designer': 'motion graphic designer',
  'motion graphics': 'motion graphic designer',
  'desainer motion graphic': 'motion graphic designer',
  // ── Animator ──
  animator: 'animator',
  'animator 2d': 'animator',
  'animator 3d': 'animator',
  '2d animator': 'animator',
  '3d animator': 'animator',
  'animation artist': 'animator',
  // ── 3D Artist ──
  '3d artist': '3d artist',
  '3d modeling': '3d artist',
  '3d modeler': '3d artist',
  '3d modeller': '3d artist',
  '3d designer': '3d artist',
  '3d modelling artist': '3d artist',
  'artist 3d': '3d artist',
  // ── Content Creator ──
  'content creator': 'content creator',
  'creator konten': 'content creator',
  'pembuat konten': 'content creator',
  // ── Mobile Developer ──
  'mobile developer': 'mobile developer',
  'mobile app developer': 'mobile developer',
  'mobile application developer': 'mobile developer',
  'mobile engineer': 'mobile developer',
  'mobile programmer': 'mobile developer',
  'pengembang mobile': 'mobile developer',
  // ── React Developer ──
  'react developer': 'react developer',
  'react js developer': 'react developer',
  'react engineer': 'react developer',
  'react dev': 'react developer',
  // ── Vue.js Developer ──
  'vue developer': 'vue js developer',
  'vue js developer': 'vue js developer',
  'vuejs developer': 'vue js developer',
  'vue engineer': 'vue js developer',
  // ── Angular Developer ──
  'angular developer': 'angular developer',
  'angular engineer': 'angular developer',
  'angularjs developer': 'angular developer',
  'angular js developer': 'angular developer',
  // ── Next.js Developer ──
  'next developer': 'next js developer',
  'next js developer': 'next js developer',
  'nextjs developer': 'next js developer',
  // ── Node.js Developer ──
  'node developer': 'node js developer',
  'node js developer': 'node js developer',
  'nodejs developer': 'node js developer',
  'node engineer': 'node js developer',
  // ── Python Developer ──
  'python developer': 'python developer',
  'python engineer': 'python developer',
  'python programmer': 'python developer',
  'pengembang python': 'python developer',
  // ── Java Developer ──
  'java developer': 'java developer',
  'java engineer': 'java developer',
  'java programmer': 'java developer',
  // ── Golang Developer ──
  'golang developer': 'golang developer',
  'golang engineer': 'golang developer',
  'golang programmer': 'golang developer',
  'go developer': 'golang developer',
  'go engineer': 'golang developer',
  // ── PHP Developer ──
  'php developer': 'php developer',
  'php engineer': 'php developer',
  'php programmer': 'php developer',
  'pengembang php': 'php developer',
  // ── Laravel Developer ──
  'laravel developer': 'laravel developer',
  'laravel engineer': 'laravel developer',
  'developer laravel': 'laravel developer',
  'pengembang laravel': 'laravel developer',
  // ── Django Developer ──
  'django developer': 'django developer',
  'django engineer': 'django developer',
  'django python developer': 'django developer',
  // ── Spring Boot Developer ──
  'spring boot developer': 'spring boot developer',
  'spring boot engineer': 'spring boot developer',
  'spring developer': 'spring boot developer',
  'springboot developer': 'spring boot developer',
  // ── Flutter Developer ──
  'flutter developer': 'flutter developer',
  'flutter engineer': 'flutter developer',
  'flutter programmer': 'flutter developer',
  'developer flutter': 'flutter developer',
  // ── React Native Developer ──
  'react native developer': 'react native developer',
  'reactnative developer': 'react native developer',
  'react native engineer': 'react native developer',
  'react native app developer': 'react native developer',
  // ── Android Developer ──
  'android developer': 'android developer',
  'android engineer': 'android developer',
  'android programmer': 'android developer',
  'android app developer': 'android developer',
  'pengembang android': 'android developer',
  // ── iOS Developer ──
  'ios developer': 'ios developer',
  'ios engineer': 'ios developer',
  'ios programmer': 'ios developer',
  'ios app developer': 'ios developer',
  'iphone developer': 'ios developer',
  'pengembang ios': 'ios developer',
  // ── Kubernetes Engineer ──
  'kubernetes engineer': 'kubernetes engineer',
  'kubernetes developer': 'kubernetes engineer',
  'kubernetes admin': 'kubernetes engineer',
  'kubernetes administrator': 'kubernetes engineer',
  'k8s engineer': 'kubernetes engineer',
  'k8s admin': 'kubernetes engineer',
  // ── Database Administrator ──
  'database administrator': 'database administrator',
  'database admin': 'database administrator',
  'administrator database': 'database administrator',
  'admin database': 'database administrator',
  'db administrator': 'database administrator',
  dba: 'database administrator',
  // ── Machine Learning Engineer ──
  'machine learning engineer': 'machine learning engineer',
  'ml engineer': 'machine learning engineer',
  'machine learning developer': 'machine learning engineer',
  'machine learning': 'machine learning engineer',
  'insinyur machine learning': 'machine learning engineer',
}

// Alias dipetakan sekali: { keyTokens: string[], canonical }
const ALIAS_ENTRIES: { keyTokens: string[]; canonical: string }[] = Object.entries(
  SKILL_ALIASES,
).map(([key, canonical]) => ({ keyTokens: key.split(' '), canonical }))

// Kata sapaan jenjang yang disaring dari frasa saat mencari sub-frasa alias
const ROLE_NOISE_WORDS = new Set([
  'senior', 'junior', 'mid', 'middle', 'lead', 'staff', 'principal',
  'head', 'intern', 'magang', 'trainee', 'remote', 'hybrid', 'part',
  'contract', 'freelance', 'lowongan', 'posisi', 'profesional', 'experienced',
])

// Normalisasi satu string: lowercase, separator → spasi, rapatkan spasi.
function normalizeItem(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[-–—.]/g, ' ')
    .replace(/[/,;()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Menentukan apakah `sub` muncul kontigu di dalam `words`.
function isContiguous(sub: string[], words: string[]): boolean {
  for (let i = 0; i + sub.length <= words.length; i++) {
    let match = true
    for (let j = 0; j < sub.length; j++) {
      if (sub[j] !== words[i + j]) {
        match = false
        break
      }
    }
    if (match) return true
  }
  return false
}

// Memilih alias terpanjang yang tampil kontigu dalam frasa.
// "senior frontend engineer" → "frontend engineer" → "frontend developer".
function longestContiguousAlias(words: string[]): string | null {
  let best: string | null = null
  let bestLen = 0
  for (const entry of ALIAS_ENTRIES) {
    if (entry.keyTokens.length <= bestLen) continue
    if (isContiguous(entry.keyTokens, words)) {
      best = entry.canonical
      bestLen = entry.keyTokens.length
    }
  }
  return best
}

function toItems(
  value: string | string[] | (string | string[])[] | null | undefined,
): string[] {
  if (!value) return []
  const list: (string | string[])[] = Array.isArray(value) ? value : [value]
  const out: string[] = []
  for (const item of list) {
    if (typeof item === 'string') out.push(...item.split(/[,;\n]+/))
    else out.push(...item)
  }
  return out
}

/**
 * Mengubah penulisan skill/peran menjadi daftar konsep kanonik.
 * - "UI/UX Design"           → ["ui ux designer"]  (satu konsep, TIDAK pecah)
 * - "Desainer Grafis"        → ["graphic designer"]
 * - "Senior Frontend Engineer" → ["frontend developer"] (sub-frasa alias)
 * - "React, Tailwind CSS"    → ["react", "tailwind", "css"] (skill bebas dipertahankan)
 * - nilai kosong             → []
 */
export function canonicalSkillTokens(
  value: string | string[] | (string | string[])[] | null | undefined,
): string[] {
  const items = toItems(value)
  const result: string[] = []
  const seen = new Set<string>()

  const push = (token: string) => {
    const t = token.trim()
    if (t && !seen.has(t)) {
      seen.add(t)
      result.push(t)
    }
  }

  for (const item of items) {
    if (!item) continue
    const norm = normalizeItem(item)
    if (!norm) continue

    // 1) Alias frasa utuh (termasuk penulisan lain yang sudah dinormalisasi)
    const full = SKILL_ALIASES[norm]
    if (full) {
      push(full)
      continue
    }

    const words = norm.split(/\s+/)

    // 2) Sub-frasa alias kontigu (tahan kata sapaan jenjang di depan/belakang)
    const sub = longestContiguousAlias(words)
    if (sub) {
      push(sub)
      continue
    }

    // 3) Token per kata — skill/teknologi bebas dipertahankan apa adanya
    const meaningful = words.filter((w) => !ROLE_NOISE_WORDS.has(w))
    for (const w of meaningful.length > 0 ? meaningful : words) push(w)
  }

  return result
}

/**
 * Gate skill untuk rekomendasi.
 *
 * Token peran (alias multi-kata, mis. "ui ux designer", "flutter developer")
 * harus cocok dengan JUDUL lowongan. Field skills lowongan TIDAK dihitung
 * untuk peran — di data nyata banyak lowongan developer (Flutter, iOS,
 * Fullstack, Software Engineer) mencantum "ui/ux" sebagai salah satu dari
 * puluhan tag skill, padahal peran intinya bukan desain; kalau tag itu ikut
 * dihitung, profil UI/UX-only tetap dapat rekomendasi iOS/Flutter.
 *
 * Token tools/skill bebas (kata tunggal: "react", "figma", "postgresql")
 * tetap dicocokkan lewat judul ATAU field skills lowongan, sehingga profil
 * yang murni isi tool (tanpa peran) tidak kehilangan recall.
 *
 * Profil tanpa skill tidak dihambat (kembali ke pencocokan TF-IDF murni).
 */
export function hasSkillOverlap(
  profileSkills: string | string[] | null | undefined,
  jobTitle: string | null | undefined,
  jobSkills: string | string[] | null | undefined,
): boolean {
  const profileTokens = canonicalSkillTokens(profileSkills)
  if (profileTokens.length === 0) return true

  const profileRoles = profileTokens.filter((token) => token.includes(' '))
  const profileTools = profileTokens.filter((token) => !token.includes(' '))

  // Profil memuat peran → harus cocok dengan peran di JUDUL lowongan.
  // Tool yang ikut tercantum di profil hanya bonus, tidak menolak lowongan.
  if (profileRoles.length > 0) {
    const titleRoles = new Set(
      canonicalSkillTokens(jobTitle).filter((token) => token.includes(' ')),
    )
    return profileRoles.some((role) => titleRoles.has(role))
  }

  // Tanpa peran (murni tools) → cocokkan lewat judul ATAU field skills.
  const source: (string | string[])[] = [
    typeof jobTitle === 'string' ? jobTitle : '',
    ...(Array.isArray(jobSkills) ? jobSkills : [jobSkills ?? '']),
  ]
  const jobTokens = new Set(canonicalSkillTokens(source))
  return profileTools.some((tool) => jobTokens.has(tool))
}