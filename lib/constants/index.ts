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

export const JOB_INTERESTS = [
  'Backend Developer',
  'Frontend Developer',
  'Full Stack Developer',
  'Mobile Developer',
  'UI/UX Designer',
  'Data Analyst',
  'Data Scientist',
  'Machine Learning Engineer',
  'DevOps Engineer',
  'Cloud Engineer',
  'Cyber Security',
  'Network Engineer',
  'Database Administrator',
  'IT Support',
  'Software Engineer',
  'QA Engineer',
] as const

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
