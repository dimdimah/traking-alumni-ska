// ─────────────────────────────────────────────────────────────
// TF-IDF & Cosine Similarity Engine
// ─────────────────────────────────────────────────────────────
// Modul ini mengimplementasikan algoritma pembobotan TF-IDF
// (Term Frequency - Inverse Document Frequency) dan perhitungan
// Cosine Similarity untuk sistem rekomendasi Content-Based
// Filtering (CBF).

// Tipe vektor TF-IDF: mapping dari term → bobot
export type TfIdfVector = Map<string, number>

/**
 * Term Frequency (TF) — menghitung frekuensi kemunculan setiap
 * term dalam sebuah dokumen.
 *
 * Rumus: TF(t, d) = jumlah kemunculan term t dalam dokumen d
 *
 * Bobot TF mentah (raw count) digunakan karena dokumen yang
 * dibandingkan memiliki panjang yang relatif seimbang.
 */
export function computeTF(tokens: string[]): TfIdfVector {
  const tf = new Map<string, number>()
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1)
  }
  return tf
}

/**
 * Inverse Document Frequency (IDF) — menghitung seberapa langka
 * sebuah term di seluruh koleksi dokumen.
 *
 * Rumus: IDF(t) = log(N / df(t))
 *   N  = jumlah total dokumen
 *   df(t) = jumlah dokumen yang mengandung term t
 *
 * Log base e (natural log) digunakan.
 * Kata yang muncul di banyak dokumen mendapat bobot IDF rendah.
 * Kata yang jarang muncul mendapat bobot IDF tinggi.
 */
export function computeIDF(documents: string[][]): Map<string, number> {
  const N = documents.length
  if (N === 0) return new Map()

  // df(t) = document frequency: jumlah dokumen yang mengandung term t
  const df = new Map<string, number>()

  for (const doc of documents) {
    const uniqueTerms = new Set(doc)
    for (const term of uniqueTerms) {
      df.set(term, (df.get(term) || 0) + 1)
    }
  }

  // IDF(t) = ln(N / df(t)) + 1  (smoothing agar term dengan df=N tetap > 0)
  const idf = new Map<string, number>()
  for (const [term, docCount] of df) {
    idf.set(term, Math.log(N / docCount) + 1)
  }

  return idf
}

/**
 * TF-IDF — mengalikan TF dengan IDF untuk mendapatkan bobot akhir
 * setiap term dalam sebuah dokumen.
 *
 * Rumus: TF-IDF(t, d) = TF(t, d) × IDF(t)
 *
 * Hasil: term yang sering muncul di dokumen tertentu (TF tinggi)
 * DAN jarang muncul di dokumen lain (IDF tinggi) mendapat bobot
 * tertinggi — inilah inti dari Content-Based Filtering.
 */
export function computeTFIDF(tf: TfIdfVector, idf: Map<string, number>): TfIdfVector {
  const tfidf = new Map<string, number>()
  for (const [term, freq] of tf) {
    const weight = idf.get(term) || 0
    if (weight > 0) {
      tfidf.set(term, freq * weight)
    }
  }
  return tfidf
}

/**
 * Cosine Similarity — mengukur kemiripan antara dua vektor TF-IDF.
 *
 * Rumus:
 *   cos(θ) = (A · B) / (||A|| × ||B||)
 *
 * Di mana:
 *   A · B   = dot product (jumlah perkalian bobot term yang sama)
 *   ||A||   = magnitude (akar dari jumlah kuadrat bobot)
 *   ||B||   = magnitude vektor B
 *
 * Nilai: 0.0 (tidak mirip) hingga 1.0 (identik secara vektor)
 */
export function cosineSimilarity(vecA: TfIdfVector, vecB: TfIdfVector): number {
  // Dot product: jumlah bobot term yang muncul di kedua vektor
  let dotProduct = 0
  for (const [term, weightA] of vecA) {
    const weightB = vecB.get(term)
    if (weightB !== undefined) {
      dotProduct += weightA * weightB
    }
  }

  // Magnitude vektor A
  let magA = 0
  for (const [_term, weight] of vecA) {
    magA += weight * weight
  }
  magA = Math.sqrt(magA)

  // Magnitude vektor B
  let magB = 0
  for (const [_term, weight] of vecB) {
    magB += weight * weight
  }
  magB = Math.sqrt(magB)

  // Hindari pembagian dengan nol
  if (magA === 0 || magB === 0) return 0

  return dotProduct / (magA * magB)
}

/**
 * Menghitung matriks TF-IDF untuk satu dokumen kueri (profil alumni)
 * terhadap N dokumen (lowongan kerja), lalu mengembalikan skor
 * cosine similarity untuk setiap pasangan.
 *
 * @param queryTokens - Token hasil preprocessing dari profil alumni
 * @param docTokens - Array token hasil preprocessing dari setiap lowongan
 * @returns Array skor cosine similarity [0..1] untuk setiap dokumen
 */
export function computeSimilarityScores(
  queryTokens: string[],
  docTokens: string[][],
): number[] {
  // Jika kueri kosong atau tidak ada dokumen, semua skor = 0
  if (queryTokens.length === 0 || docTokens.length === 0) {
    return docTokens.map(() => 0)
  }

  // Gabungkan semua dokumen termasuk kueri untuk perhitungan IDF
  const allDocuments = [queryTokens, ...docTokens]

  // Hitung IDF dari seluruh koleksi
  const idf = computeIDF(allDocuments)

  // Hitung TF-IDF untuk kueri
  const queryTF = computeTF(queryTokens)
  const queryVector = computeTFIDF(queryTF, idf)

  // Hitung TF-IDF untuk setiap dokumen lalu cosine similarity
  return docTokens.map((tokens) => {
    const docTF = computeTF(tokens)
    const docVector = computeTFIDF(docTF, idf)
    return cosineSimilarity(queryVector, docVector)
  })
}
