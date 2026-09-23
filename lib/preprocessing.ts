// ─────────────────────────────────────────────────────────────
// Text Preprocessing Pipeline
// ─────────────────────────────────────────────────────────────
// Modul ini menyediakan fungsi-fungsi untuk membersihkan dan
// memproses teks sebelum dihitung TF-IDF.
// Tahapan: Case Folding → Cleaning → Tokenization → Stopword Removal → Stemming

const INDONESIAN_STOPWORDS = new Set([
  'dan', 'di', 'ke', 'dari', 'yang', 'dengan', 'ini', 'itu', 'untuk',
  'pada', 'adalah', 'akan', 'telah', 'sudah', 'bisa', 'dapat', 'tidak',
  'ada', 'juga', 'oleh', 'sebagai', 'dalam', 'saya', 'kami', 'kita',
  'mereka', 'dia', 'anda', 'atau', 'karena', 'jika', 'seperti', 'lebih',
  'sangat', 'antara', 'setelah', 'sebelum', 'tentang', 'tanpa', 'hanya',
  'banyak', 'lain', 'masih', 'serta', 'namun', 'tetapi', 'sedangkan',
  'melalui', 'sehingga', 'mengapa', 'bagaimana', 'maupun', 'sejak',
  'saat', 'secara', 'tersebut', 'merupakan', 'yakni', 'ialah', 'bahwa',
  'untuk', 'bagi', 'pernah', 'belum', 'selalu', 'semua', 'salah', 'hal',
  'para', 'ia', 'si', 'sang', 'para', 'se', 'ter', 'per', 'ber', 'me',
  'kan', 'nya', 'i', 'pun', 'kah', 'lah', 'tah', 'hei', 'hai',
  'oh', 'ya', 'yaitu', 'adapun', 'ialah',
  'seorang', 'sebuah', 'beberapa', 'semacam', 'sesuatu',
  'seseorang', 'suatu', 'setiap', 'masing', 'masingmasing',
  'seluruh', 'segala', 'segenap', 'sendiri', 'sama',
])

const ENGLISH_STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'need',
  'dare', 'ought', 'used', 'this', 'that', 'these', 'those', 'it',
  'its', 'we', 'our', 'you', 'your', 'they', 'them', 'their', 'he',
  'she', 'his', 'her', 'him', 'who', 'whom', 'which', 'what', 'why',
  'how', 'when', 'where', 'not', 'no', 'nor', 'so', 'if', 'than',
  'too', 'very', 'just', 'about', 'above', 'after', 'again', 'all',
  'also', 'any', 'because', 'before', 'between', 'both', 'each',
  'few', 'more', 'most', 'other', 'some', 'such', 'only', 'own',
  'same', 'into', 'over', 'under', 'up', 'out', 'off', 'down',
  'am', 'me', 'my', 'myself', 'yourself', 'himself', 'herself',
  'itself', 'ourselves', 'themselves', 'every', 'anyone', 'everyone',
  'someone', 'nobody', 'everybody', 'somebody',
])

const ALL_STOPWORDS = new Set([...INDONESIAN_STOPWORDS, ...ENGLISH_STOPWORDS])

// Kata kunci teknis/brand/kota yang TIDAK boleh di-stem agar akurasinya
// tidak rusak (mis. "react", "developer", "jakarta", "aku".
const PROTECTED_WORDS = new Set([
  // brand & framework
  'laravel', 'react', 'reactjs', 'django', 'flutter', 'angular', 'vue', 'vuejs',
  'nextjs', 'nestjs', 'node', 'nodejs', 'express', 'expressjs', 'spring', 'springboot',
  'wordpress', 'laragon', 'tailwind', 'bootstrap', 'jquery', 'svelte', 'nuxt',
  // bahasa pemrograman
  'javascript', 'typescript', 'golang', 'go', 'python', 'php', 'mysql',
  'postgresql', 'postgres', 'mongodb', 'sqlite', 'redis', 'sql', 'nosql',
  'java', 'kotlin', 'swift', 'cobol', 'ruby', 'perl', 'rust', 'scala', 'csharp',
  'delphi', 'visual', 'basic', 'matlab', 'rstudio',
  // tool & infra
  'docker', 'kubernetes', 'kubernet', 'jenkins', 'gitlab', 'github', 'git',
  'aws', 'azure', 'gcp', 'firebase', 'supabase', 'cloudflare', 'nginx', 'apache',
  'linux', 'ubuntu', 'windows', 'android', 'ios', 'flutterflow', 'powerbi', 'tableau',
  'drawio', 'figma', 'adobe', 'photoshop', 'illustrator', 'canva', 'blender',
  // kata kerja umum yang harusnya tetap utuh
  'data', 'api', 'rest', 'json', 'apiis', 'ui', 'ux', 'seo', 'crm', 'erp', 'sap',
  'git', 'pemrograman', 'programming', 'software', 'hardware', 'website', 'aplikasi',
  'aplikas', 'backend', 'frontend', 'fullstack', 'devops', 'analytic', 'analyst',
  'admin', 'manager', 'staff', 'kepala', 'supervisor', 'spv', 'intern', 'magang',
  'freelance', 'karyawan', 'pekerja', 'perusahaan', 'perusahaanperusahaan',
  // kota & kawasan
  'jakarta', 'bandung', 'surabaya', 'semarang', 'yogyakarta', 'jogja', 'solo',
  'surakarta', 'malang', 'bali', 'denpasar', 'sleman', 'bantul', 'klaten',
  'bekasi', 'depok', 'tangerang', 'bogor', 'medan', 'makassar', 'sidoarjo',
  // peran umum
  'developer', 'engineer', 'designer', 'programmer', 'tester', 'quality', 'guarantee',
  'accounting', 'akuntansi', 'akuntan', 'keuangan', 'pajak', 'proyek', 'produksi',
])

// Urutan awalan yang paling aman: kata yang bersisa tetap konsonan
// (untuk awalan berakhiran nasal, pulihkan konsonan awal akar kata).
// [prefix, konsonan awal yang dipulihkan jika sisa diawali vokal]
const PREFIX_RULES: Array<[string, string | null]> = [
  ['meng', 'k'],
  ['peng', 'k'],
  ['meny', 's'],
  ['peny', 's'],
  ['men', 't'],
  ['pen', 't'],
  ['mem', null],
  ['pem', null],
  ['per', 'r'],
  ['ber', 'r'],
  ['me', null],
  ['pe', null],
  ['ter', null],
  ['ke', null],
  ['di', null],
]

const STABLE_SUFFIXES = ['kah', 'lah', 'pun', 'nya', 'kan', 'an'] as const

/**
 * Stemming Indonesia konservatif — menyatukan variasi imbuhan
 * (membangun/bangun, mengembangkan/pengembangan → kembang) agar
 * kata yang sama dapat cocok meski ditulis berbeda bentuk.
 * Kata yang berisiko (brand, kota, kata pendek) dilindungi.
 */
export function stemIndonesian(word: string): string {
  if (word.length < 5) return word
  if (PROTECTED_WORDS.has(word)) return word

  let stem = word

  // 1) Hapus imbuhan akhiran (sufiks) secara berulang sambil menjaga
  //    sisa minimal 4 huruf.
  let changed = true
  let guard = 0
  while (changed && guard < 10) {
    changed = false
    guard += 1
    for (const suffix of STABLE_SUFFIXES) {
      if (stem.endsWith(suffix) && stem.length - suffix.length >= 4) {
        stem = stem.slice(0, stem.length - suffix.length)
        changed = true
        break
      }
    }
  }

  // 2) Hapus satu awalan (prefix) yang paling panjang, sisa minimal 3 huruf.
  for (const [prefix, restore] of PREFIX_RULES) {
    if (!stem.startsWith(prefix)) continue
    const rest = stem.slice(prefix.length)
    if (rest.length < 3) break
    // Pulihkan konsonan awal akar kata bila sisa diawali vokal
    // (menyatu setelah gulung awalan nasal): "mengembangkan" → "kembangkan".
    if (restore && /^[aeiou]/.test(rest)) {
      stem = restore + rest
    } else {
      stem = rest
    }
    break
  }

  return stem
}

/**
 * Case Folding — mengubah semua huruf menjadi lowercase.
 */
export function caseFolding(text: string): string {
  return text.toLowerCase()
}

/**
 * Cleaning — menghapus tanda baca, simbol, angka berdiri sendiri,
 * dan karakter non-alfabet, namun mempertahankan spasi.
 */
export function cleaning(text: string): string {
  return text
    .replace(/[^a-zA-Z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Tokenization — memecah teks menjadi array kata.
 */
export function tokenization(text: string): string[] {
  if (!text.trim()) return []
  return text.split(/\s+/).filter(Boolean)
}

/**
 * Stopword Removal — menghapus kata-kata umum yang tidak bermakna.
 */
export function stopwordRemoval(tokens: string[]): string[] {
  return tokens.filter((t) => t.length > 1 && !ALL_STOPWORDS.has(t))
}

/**
 * Preprocessing Pipeline — menjalankan semua tahapan sekaligus.
 * Input: teks mentah
 * Output: array token bersih (di-stem)
 *
 * Contoh:
 *   preprocess("Saya adalah seorang Backend Developer Laravel!")
 *   → ["backend", "developer", "laravel"]
 */
export function preprocess(text: string): string[] {
  if (!text || !text.trim()) return []
  const folded = caseFolding(text)
  const cleaned = cleaning(folded)
  const tokens = tokenization(cleaned)
  return stopwordRemoval(tokens).map(stemIndonesian)
}

/**
 * Menggabungkan beberapa field teks menjadi satu dokumen
 * lalu diproses melalui pipeline preprocessing.
 */
export function buildDocument(...fields: (string | null | undefined)[]): string[] {
  const raw = fields
    .filter((f): f is string => Boolean(f))
    .join(' ')
  return preprocess(raw)
}
