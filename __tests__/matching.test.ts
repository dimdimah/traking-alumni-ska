import { describe, it, expect } from '@jest/globals'

// ═══════════════════════════════════════════════════════════
// 1. TEXT PREPROCESSING PIPELINE
// ═══════════════════════════════════════════════════════════
import {
  caseFolding,
  cleaning,
  tokenization,
  stopwordRemoval,
  preprocess,
  buildDocument,
} from '@/lib/preprocessing'

describe('Case Folding', () => {
  it('should convert uppercase to lowercase', () => {
    expect(caseFolding('Backend Developer Laravel')).toBe('backend developer laravel')
  })

  it('should handle mixed case', () => {
    expect(caseFolding('ReAcT Js DeVelOper')).toBe('react js developer')
  })

  it('should handle empty string', () => {
    expect(caseFolding('')).toBe('')
  })
})

describe('Cleaning', () => {
  it('should remove punctuation', () => {
    expect(cleaning('Hello, World!')).toBe('Hello World')
  })

  it('should remove symbols and numbers', () => {
    expect(cleaning('Laravel 8, PHP 7.4 & MySQL')).toBe('Laravel PHP MySQL')
  })

  it('should normalize multiple spaces', () => {
    expect(cleaning('React    JS   Developer')).toBe('React JS Developer')
  })
})

describe('Tokenization', () => {
  it('should split text into words', () => {
    expect(tokenization('backend developer laravel')).toEqual(['backend', 'developer', 'laravel'])
  })

  it('should return empty array for empty string', () => {
    expect(tokenization('')).toEqual([])
  })

  it('should filter empty tokens', () => {
    expect(tokenization('  react  js  ')).toEqual(['react', 'js'])
  })
})

describe('Stopword Removal', () => {
  it('should remove Indonesian stopwords', () => {
    expect(stopwordRemoval(['saya', 'adalah', 'developer', 'dan', 'programmer'])).toEqual([
      'developer',
      'programmer',
    ])
  })

  it('should remove English stopwords', () => {
    expect(stopwordRemoval(['i', 'am', 'a', 'software', 'engineer'])).toEqual([
      'software',
      'engineer',
    ])
  })

  it('should keep meaningful words', () => {
    expect(stopwordRemoval(['laravel', 'react', 'python'])).toEqual([
      'laravel',
      'react',
      'python',
    ])
  })
})

describe('Full Preprocessing Pipeline', () => {
  it('should preprocess Indonesian text correctly', () => {
    const result = preprocess('Saya adalah seorang Backend Developer Laravel!')
    expect(result).toContain('backend')
    expect(result).toContain('developer')
    expect(result).toContain('laravel')
    expect(result).not.toContain('saya')
    expect(result).not.toContain('adalah')
    expect(result).not.toContain('seorang')
  })

  it('should preprocess English text correctly', () => {
    const result = preprocess('I am a Full Stack Developer with React and Node.js')
    expect(result).toContain('full')
    expect(result).toContain('stack')
    expect(result).toContain('developer')
    expect(result).toContain('react')
    expect(result).toContain('node')
    expect(result).toContain('js')
    expect(result).not.toContain('and')
  })

  it('should return empty array for empty input', () => {
    expect(preprocess('')).toEqual([])
    expect(preprocess('   ')).toEqual([])
  })
})

describe('Build Document', () => {
  it('should combine multiple fields', () => {
    const doc = buildDocument('Informatika', 'Laravel PHP MySQL', 'Backend Developer')
    expect(doc).toContain('informatika')
    expect(doc).toContain('laravel')
    expect(doc).toContain('php')
    expect(doc).toContain('mysql')
    expect(doc).toContain('backend')
    expect(doc).toContain('developer')
  })

  it('should filter null and undefined fields', () => {
    const doc = buildDocument('React', null, undefined, 'JavaScript')
    expect(doc).toContain('react')
    expect(doc).toContain('javascript')
  })

  it('should return empty array for all null fields', () => {
    expect(buildDocument(null, undefined)).toEqual([])
  })
})

// ═══════════════════════════════════════════════════════════
// 2. TF-IDF COMPUTATION
// ═══════════════════════════════════════════════════════════
import { computeTF, computeIDF, computeTFIDF } from '@/lib/tfidf'

describe('Term Frequency (TF)', () => {
  it('should count term frequency correctly', () => {
    const tokens = ['laravel', 'php', 'laravel', 'mysql', 'laravel']
    const tf = computeTF(tokens)
    expect(tf.get('laravel')).toBe(3)
    expect(tf.get('php')).toBe(1)
    expect(tf.get('mysql')).toBe(1)
  })

  it('should return empty map for empty tokens', () => {
    const tf = computeTF([])
    expect(tf.size).toBe(0)
  })

  it('should handle single token', () => {
    const tf = computeTF(['react'])
    expect(tf.get('react')).toBe(1)
  })
})

describe('Inverse Document Frequency (IDF)', () => {
  it('should give low IDF to common words', () => {
    const docs = [
      ['developer', 'laravel', 'php'],
      ['developer', 'react', 'javascript'],
      ['developer', 'python', 'django'],
    ]
    const idf = computeIDF(docs)
    // 'developer' muncul di semua dokumen → IDF rendah
    const developerIdf = idf.get('developer')!
    const laravelIdf = idf.get('laravel')!
    expect(developerIdf).toBeLessThan(laravelIdf)
  })

  it('should give high IDF to rare words', () => {
    const docs = [
      ['laravel', 'php', 'mysql'],
      ['react', 'javascript', 'node'],
      ['python', 'django', 'postgresql'],
    ]
    const idf = computeIDF(docs)
    // Setiap term spesifik hanya muncul di 1 dari 3 dokumen → IDF tinggi
    expect(idf.get('laravel')).toBeGreaterThan(0)
    expect(idf.get('react')).toBeGreaterThan(0)
    expect(idf.get('python')).toBeGreaterThan(0)
  })

  it('should return empty map for empty documents', () => {
    expect(computeIDF([]).size).toBe(0)
  })

  it('should apply smoothing (+1) for terms in all documents', () => {
    const docs = [['react'], ['react']]
    const idf = computeIDF(docs)
    // ln(2/2) + 1 = 1
    expect(idf.get('react')).toBeCloseTo(1, 2)
  })
})

describe('TF-IDF Weight', () => {
  it('should multiply TF by IDF', () => {
    const tf = new Map([['laravel', 3]])
    const idf = new Map([['laravel', 1.5]])
    const tfidf = computeTFIDF(tf, idf)
    expect(tfidf.get('laravel')).toBeCloseTo(4.5, 2)
  })

  it('should return empty map for terms not in IDF', () => {
    const tf = new Map([['unknown', 1]])
    const idf = new Map([['laravel', 1.5]])
    const tfidf = computeTFIDF(tf, idf)
    expect(tfidf.has('unknown')).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════
// 3. COSINE SIMILARITY
// ═══════════════════════════════════════════════════════════
import { cosineSimilarity, computeSimilarityScores } from '@/lib/tfidf'

describe('Cosine Similarity', () => {
  it('should return 1 for identical vectors', () => {
    const vec = new Map([
      ['laravel', 2],
      ['php', 1],
    ])
    expect(cosineSimilarity(vec, vec)).toBeCloseTo(1, 2)
  })

  it('should return 0 for orthogonal vectors (no common terms)', () => {
    const vecA = new Map([['laravel', 1]])
    const vecB = new Map([['akuntansi', 1]])
    expect(cosineSimilarity(vecA, vecB)).toBe(0)
  })

  it('should return value between 0 and 1 for partial match', () => {
    const vecA = new Map([
      ['laravel', 2],
      ['php', 1],
      ['mysql', 1],
    ])
    const vecB = new Map([
      ['laravel', 1],
      ['php', 2],
      ['react', 2],
    ])
    const sim = cosineSimilarity(vecA, vecB)
    expect(sim).toBeGreaterThan(0)
    expect(sim).toBeLessThan(1)
  })

  it('should return 0 for empty vector', () => {
    const vecA = new Map()
    const vecB = new Map([['react', 1]])
    expect(cosineSimilarity(vecA, vecB)).toBe(0)
  })
})

describe('End-to-End Similarity Scores', () => {
  it('should return 0 for empty query', () => {
    const scores = computeSimilarityScores([], [['developer'], ['akuntan']])
    expect(scores).toEqual([0, 0])
  })

  it('should return 0 for empty documents', () => {
    const scores = computeSimilarityScores(['developer'], [])
    expect(scores).toEqual([])
  })

  it('should give higher score to matching documents', () => {
    // Query: alumni dengan skill backend
    const query = ['laravel', 'php', 'mysql', 'backend', 'developer']

    // Dokumen 1: lowongan Backend Developer (cocok)
    const doc1 = ['backend', 'developer', 'laravel', 'php', 'mysql', 'fullstack']

    // Dokumen 2: lowongan Akuntan (tidak cocok)
    const doc2 = ['akuntan', 'pajak', 'keuangan', 'laporan']

    const scores = computeSimilarityScores(query, [doc1, doc2])

    // Skor lowongan backend harus lebih tinggi dari lowongan akuntan
    expect(scores[0]).toBeGreaterThan(scores[1])
  })
})

// ═══════════════════════════════════════════════════════════
// 4. RECOMMENDATION DOCUMENT BUILDING
// ═══════════════════════════════════════════════════════════
import { buildJobDocument, buildProfileDocument } from '@/lib/recommendation-docs'
import type { Job, Profile, TrackRecord } from '@/types/database'

describe('Recommendation Document Building', () => {
  const profile = {
    id: 'user-1',
    email: 'user@example.com',
    role: 'user',
    full_name: 'Test User',
    nim: null,
    tanggal_lahir: null,
    phone: null,
    bio: null,
    skills: ['Laravel', 'PHP', 'MySQL'],
    location: 'Yogyakarta',
    education_level: 'S1 Informatika',
    program_studi: 'S1 Informatika',
    certifications: ['Laravel Developer'],
    job_interests: ['Backend Developer'],
    preferred_location: 'Yogyakarta',
    expected_salary: '8-12 juta',
    preferred_type: 'Full-time',
    graduation_year: 2024,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  } as Profile

  const trackRecords = [
    {
      id: 'record-1',
      user_id: 'user-1',
      company: 'PT Teknologi Maju',
      position: 'Backend Developer',
      start_date: '2024-01-01',
      end_date: null,
      description: 'Membangun API dan layanan backend',
      is_current: true,
      idempotency_key: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ] as TrackRecord[]

  it('builds a profile document from the seven recommendation criteria', () => {
    const doc = buildProfileDocument(profile, trackRecords)

    expect(doc).toContain('S1 Informatika')
    expect(doc).toContain('Laravel')
    expect(doc).toContain('Backend Developer')
    expect(doc).toContain('Membangun API')
    expect(doc).toContain('Laravel Developer')
    expect(doc).toContain('Yogyakarta')
    expect(doc).toContain('Full-time')
    expect(doc).not.toContain('8-12 juta')
  })

  it('uses position and description without prioritizing company names', () => {
    const doc = buildProfileDocument(profile, trackRecords)

    expect(doc).toContain('Backend Developer')
    expect(doc).toContain('Membangun API dan layanan backend')
    expect(doc).not.toContain('PT Teknologi Maju')
  })

  it('builds a job document from searchable job content', () => {
    const job = {
      id: 'job-1',
      title: 'Backend Developer',
      company: 'PT Teknologi Maju',
      location: 'Yogyakarta',
      type: 'Full-time',
      salary: '8-12 juta',
      description: 'Membangun API menggunakan Laravel dan MySQL',
      skills: ['Laravel', 'PHP', 'MySQL', 'REST API'],
      contact_info: null,
      url: 'https://example.com/job-1',
      source: 'Career Center',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    } as const

    const doc = buildJobDocument(job)

    expect(doc).toContain('Backend Developer')
    expect(doc).toContain('Membangun API menggunakan Laravel dan MySQL')
    expect(doc).toContain('Laravel')
    expect(doc).toContain('Yogyakarta')
    expect(doc).toContain('Full-time')
    expect(doc).not.toContain('PT Teknologi Maju')
    expect(doc).not.toContain('8-12 juta')
  })
})

// ═══════════════════════════════════════════════════════════
// 5. DOKUMEN BUILDING (INTEGRATION TEST)
// ═══════════════════════════════════════════════════════════

describe('Document Building Integration', () => {
  it('builds a profile document from the seven recommendation criteria', () => {
    const profileFields = {
      program_studi: 'S1 Informatika',
      skills: ['Laravel', 'PHP', 'MySQL'],
      certifications: ['Laravel Developer'],
      job_interests: ['Backend Developer'],
      preferred_location: 'Yogyakarta',
      preferred_type: 'Full-time',
    }

    const trackRecords = [
      { position: 'Backend Developer', description: 'Membangun API backend' },
      { position: 'Full Stack Developer', description: 'Mengembangkan aplikasi web' },
    ]

    const doc = buildProfileDocument(
      profileFields as unknown as Profile,
      trackRecords as unknown as TrackRecord[],
    )

    expect(doc).toContain('S1 Informatika')
    expect(doc).toContain('Laravel')
    expect(doc).toContain('Backend Developer')
    expect(doc).toContain('Membangun API backend')
    expect(doc).toContain('Laravel Developer')
    expect(doc).toContain('Yogyakarta')
    expect(doc).toContain('Full-time')
  })

  it('builds a job document from searchable job content', () => {
    const job = {
      title: 'Backend Developer',
      description:
        'Mengembangkan API menggunakan Laravel dan MySQL. Membangun fitur backend untuk aplikasi perusahaan.',
      skills: ['Laravel', 'PHP', 'MySQL', 'REST API'],
      location: 'Yogyakarta',
      type: 'Full-time',
    }

    const doc = buildJobDocument(job as unknown as Job)
    const tokens = doc.toLowerCase().split(/\s+/).filter(Boolean)
    expect(tokens).toContain('laravel')
    expect(tokens).toContain('mysql')
    expect(tokens).toContain('backend')
    expect(tokens).toContain('developer')
    expect(tokens).toContain('api')
  })
})
