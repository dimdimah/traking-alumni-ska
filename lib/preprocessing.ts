// ─────────────────────────────────────────────────────────────
// Text Preprocessing Pipeline
// ─────────────────────────────────────────────────────────────
// Modul ini menyediakan fungsi-fungsi untuk membersihkan dan
// memproses teks sebelum dihitung TF-IDF.
// Tahapan: Case Folding → Cleaning → Tokenization → Stopword Removal

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
 * Output: array token bersih
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
  return stopwordRemoval(tokens)
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
