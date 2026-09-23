// FILE: types/database.ts

export type AppRole = 'super_user' | 'user'

export type Profile = {
  id: string
  email: string
  role: AppRole
  full_name: string | null
  nim: string | null
  tanggal_lahir: string | null
  phone: string | null
  bio: string | null
  skills: string[] | null
  location: string | null
  education_level: string | null
  program_studi: string | null
  certifications: string[] | null
  job_interests: string[] | null
  preferred_location: string | null
  expected_salary: string | null
  preferred_type: string | null
  graduation_year: number | null
  created_at: string
  updated_at: string
}

// ─── Track Record (Riwayat Kerja) ───
export type TrackRecord = {
  id: string
  user_id: string
  company: string
  position: string
  start_date: string
  end_date: string | null
  description: string | null
  is_current: boolean
  idempotency_key: string | null
  created_at: string
  updated_at: string
}

// ─── Sistem Alumni ───
export type SistemAlumniResponse = {
  id: string
  user_id: string
  graduation_year: number
  education_level: string
  employment_status: string
  company: string | null
  position: string | null
  salary_range: string | null
  study_field_match: string | null
  suggestions: string | null
  submitted_at: string
  updated_at: string
}

export type SistemAlumniQuestion = {
  id: string
  question_text: string
  question_type: 'text' | 'textarea' | 'select' | 'radio' | 'number' | 'checkbox' | 'scale'
  options: string[] | null
  is_active: boolean
  display_order: number
  angkatan: string | null
  created_at: string
  updated_at: string
}

export type TracerStudyAnswer = {
  id: string
  user_id: string
  question_id: string
  answer_text: string | null
  created_at: string
}

export type TracerStudyHistorySnapshot = {
  core_fields: {
    education_level: string
    employment_status: string
    company: string | null
    position: string | null
    salary_range: string | null
    study_field_match: string | null
    suggestions: string | null
  }
  answers: {
    question_text: string
    question_type: string
    answer_text: string | null
  }[]
}

export type TracerStudyHistory = {
  id: string
  user_id: string
  angkatan: string
  snapshot: TracerStudyHistorySnapshot
  submitted_at: string
}

// ─── Jobs (Lowongan Kerja) ───
export type Job = {
  id: string
  title: string
  company: string
  location: string
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship'
  salary: string | null
  description: string
  skills: string[]
  contact_info: string | null
  url: string
  source: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// ─── Content: Berita ───
export type Berita = {
  id: string
  judul: string
  slug: string
  kategori: 'Akademik' | 'Karir' | 'Kampus' | 'Teknologi' | 'Umum'
  penulis: string
  tanggal: string
  status: 'published' | 'draft'
  ringkasan: string
  konten: string
  gambar_url: string
  views: number
  created_at: string
  updated_at: string
}

// ─── Content: Sertifikasi ───
export type Sertifikasi = {
  id: string
  nama: string
  slug: string
  penyelenggara: string
  kategori: 'IT & Networking' | 'Programming' | 'Data Science' | 'Cloud' | 'Keamanan Siber' | 'Manajemen'
  level: 'Nasional' | 'Internasional' | 'Vendor'
  durasi_valid: string
  biaya: string
  deskripsi: string
  url_info: string
  icon_url: string
  status: 'published' | 'draft'
  created_at: string
  updated_at: string
}

// ─── Content: FAQ ───
export type FAQ = {
  id: string
  pertanyaan: string
  jawaban: string
  kategori: 'Akademik' | 'Karir' | 'Sistem Alumni' | 'Teknis' | 'Umum'
  urutan: number
  aktif: boolean
  created_at: string
  updated_at: string
}

// ─── Content: Kisah Sukses ───
export type KisahSukses = {
  id: string
  nama_alumni: string
  angkatan: number
  prodi: 'S1 Informatika' | 'S1 Teknologi Informasi' | 'D3 Manajemen Informatika' | 'D3 Komputerisasi Akuntansi'
  posisi_sekarang: string
  perusahaan: string
  lokasi: string
  foto_url: string
  kutipan: string
  cerita: string
  status: 'published' | 'draft'
  featured: boolean
  created_at: string
  updated_at: string
}

// ─── Matching (Content-Based Filtering) ───
export type MatchResult = {
  job: Job
  score: number
}

// ─── Diagnostic payload (mode debug ?debug=1 di halaman rekomendasi) ───
export type DebugTermWeight = {
  term: string
  profileTf: number
  jobTf: number
  idf: number
  profileWeight: number
  jobWeight: number
  contribution: number
}

// Rincian rumus cosine similarity untuk satu pasangan profil ↔ lowongan
export type CosineBreakdown = {
  dotProduct: number
  magnitudeProfile: number
  magnitudeJob: number
  score: number
}

export type JobMatchDebug = {
  jobId: string
  title: string
  company: string
  location: string | null
  score: number
  jobTokens: string[]
  matchedTerms: DebugTermWeight[]
  cosine: CosineBreakdown
}

// Sumber satu atribut saat dokumen profil disusun
export type ProfileSourceField = {
  label: string
  value: string | null
}

// Contoh dokumen lowongan (raw + token) untuk panel "Tahapan Pembentukan Dokumen"
export type JobDocSample = {
  title: string
  company: string
  raw: string
  tokens: string[]
  score: number
  // Nilai mentah tiap bagian yang digabung jadi dokumen (buildJobDocument)
  fields: {
    title: string
    description: string
    skills: string
    location: string
    type: string
  }
}

export type MatchDebugPayload = {
  generatedAt: string
  totalJobs: number
  profileSource: ProfileSourceField[]
  profileRaw: string
  profileTokens: string[]
  jobSamples: JobDocSample[]
  entries: JobMatchDebug[]
}

// ─── Database type helper ───
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
        Relationships: []
      }
      track_records: {
        Row: TrackRecord
        Insert: Omit<TrackRecord, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<TrackRecord, 'id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
      tracer_study_responses: {
        Row: SistemAlumniResponse
        Insert: Omit<SistemAlumniResponse, 'id' | 'submitted_at' | 'updated_at'>
        Update: Partial<Omit<SistemAlumniResponse, 'id' | 'user_id' | 'submitted_at'>>
        Relationships: []
      }
      tracer_study_questions: {
        Row: SistemAlumniQuestion
        Insert: Omit<SistemAlumniQuestion, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<SistemAlumniQuestion, 'id' | 'created_at'>>
        Relationships: []
      }
      tracer_study_answers: {
        Row: TracerStudyAnswer
        Insert: Omit<TracerStudyAnswer, 'id' | 'created_at'>
        Update: Partial<Omit<TracerStudyAnswer, 'id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
      tracer_study_history: {
        Row: TracerStudyHistory
        Insert: Omit<TracerStudyHistory, 'id' | 'submitted_at'>
        Update: Partial<Omit<TracerStudyHistory, 'id' | 'user_id' | 'submitted_at'>>
        Relationships: []
      }
      jobs: {
        Row: Job
        Insert: Omit<Job, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Job, 'id' | 'created_at'>>
        Relationships: []
      }
      berita: {
        Row: Berita
        Insert: Omit<Berita, 'id' | 'views' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Berita, 'id' | 'created_at'>>
        Relationships: []
      }
      sertifikasi: {
        Row: Sertifikasi
        Insert: Omit<Sertifikasi, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Sertifikasi, 'id' | 'created_at'>>
        Relationships: []
      }
      faq: {
        Row: FAQ
        Insert: Omit<FAQ, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<FAQ, 'id' | 'created_at'>>
        Relationships: []
      }
      kisah_sukses: {
        Row: KisahSukses
        Insert: Omit<KisahSukses, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<KisahSukses, 'id' | 'created_at'>>
        Relationships: []
      }
      company_surveys: {
        Row: CompanySurvey
        Insert: Omit<CompanySurvey, 'id' | 'created_at'>
        Update: Partial<Omit<CompanySurvey, 'id' | 'created_at'>>
        Relationships: []
      }
      admin_activity_logs: {
        Row: AdminActivityLog
        Insert: Omit<AdminActivityLog, 'id' | 'created_at'>
        Update: Partial<Omit<AdminActivityLog, 'id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      app_role: AppRole
    }
  }
}

// ─── Survey Penilaian Perusahaan ───
export type SurveyRating = 'sangat_baik' | 'baik' | 'cukup' | 'kurang'

export type CompanySurvey = {
  id: string
  pic_name: string
  company_name: string
  position: string
  email: string
  alumni_name: string
  alumni_graduation_year: number
  alumni_major: string
  teamwork: SurveyRating
  it_skill: SurveyRating
  english: SurveyRating
  communication: SurveyRating
  self_development: SurveyRating
  leadership: SurveyRating
  work_ethic: SurveyRating
  expectation: string | null
  suggestion: string | null
  created_at: string
}

// ─── Admin Activity & Export Logs ───
export type AdminActivityAction = 'EXPORT_EXCEL' | 'QUESTION_UPDATE' | 'ALUMNI_UPDATE' | 'TRACER_STUDY_SYNC' | 'SYSTEM'

export type AdminActivityLog = {
  id: string
  user_id: string | null
  user_email: string | null
  user_name: string | null
  action_type: AdminActivityAction | string
  title: string
  description: string | null
  metadata: Record<string, any> | null
  created_at: string
}

