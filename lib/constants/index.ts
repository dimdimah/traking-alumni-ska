export const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'] as const
export type JobType = (typeof JOB_TYPES)[number]

export const EMPLOYMENT_STATUSES = [
  'Bekerja',
  'Belum Bekerja',
  'Wirausaha',
  'Melanjutkan Studi',
  'Tidak bekerja / Mencari pekerjaan',
] as const
export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number]

export const EDUCATION_LEVELS = ['D3 Komputerisasi Akuntansi', 'D3 Manajemen Informatika', 'S1 Informatika', 'S1 Teknologi Informasi'] as const
export type EducationLevel = (typeof EDUCATION_LEVELS)[number]

export const PROGRAM_STUDI = [
  'D3 Komputerisasi Akuntansi',
  'D3 Manajemen Informatika',
  'S1 Informatika',
  'S1 Teknologi Informasi',
] as const
export type ProgramStudi = (typeof PROGRAM_STUDI)[number]

// Daftar peran/posisi kerja yang dipakai untuk chip skill & minat kerja
// (rekomendasi). Kategori diurutkan agar chip di profil tampil rapi.
export const JOB_ROLE_CATEGORIES = {
  'Design & Kreatif': [
    'UI/UX Designer',
    'Graphic Designer',
    'Multimedia Designer',
    'Video Editor',
    'Motion Graphic Designer',
    'Animator',
    '3D Artist',
    'Content Creator',
  ],
  Frontend: [
    'Frontend Developer',
    'React Developer',
    'Vue.js Developer',
    'Angular Developer',
    'Next.js Developer',
  ],
  Backend: [
    'Software Engineer',
    'Backend Developer',
    'Full Stack Developer',
    'Node.js Developer',
    'Python Developer',
    'Java Developer',
    'Golang Developer',
    'PHP Developer',
    'Laravel Developer',
    'Django Developer',
    'Spring Boot Developer',
  ],
  Mobile: [
    'Mobile Developer',
    'Flutter Developer',
    'React Native Developer',
    'Android Developer',
    'iOS Developer',
  ],
  'Data & AI': [
    'Data Scientist',
    'Data Analyst',
    'Machine Learning Engineer',
    'Database Administrator',
  ],
  'DevOps & Cloud': [
    'DevOps Engineer',
    'Cloud Engineer',
    'Kubernetes Engineer',
  ],
} as const

// Gabungan: nilai kategori peran + peran tambahan lokal (dedup, urutan stabil)
export const JOB_INTERESTS: readonly string[] = Array.from(
  new Set([
    ...Object.values(JOB_ROLE_CATEGORIES).flat(),
    'Cyber Security',
    'Network Engineer',
    'IT Support',
    'QA Engineer',
  ]),
)

export const PREFERRED_LOCATIONS = [
  'Solo Raya',
  'Semarang',
  'Yogyakarta',
  'Jakarta',
  'Bandung',
  'Surabaya',
  'Malang',
  'Bali',
  'Remote / WFH',
  'Seluruh Indonesia',
] as const

export const SALARY_RANGES = [
  { value: '< 3 juta', label: '< Rp 3.000.000' },
  { value: '3-5 juta', label: 'Rp 3.000.000 - Rp 5.000.000' },
  { value: '5-10 juta', label: 'Rp 5.000.000 - Rp 10.000.000' },
  { value: '10-20 juta', label: 'Rp 10.000.000 - Rp 20.000.000' },
  { value: '> 20 juta', label: '> Rp 20.000.000' },
] as const

export const FIELD_MATCH_OPTIONS = [
  'Sangat Sesuai',
  'Sesuai',
  'Kurang Sesuai',
  'Tidak Sesuai',
] as const
