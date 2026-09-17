import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import type { CvData } from '@/lib/actions/cv'

// --- i18n labels ------------------------------------------------------------
const LABELS = {
  id: {
    summary: 'Ringkasan Profesional',
    skills: 'Kemampuan',
    experience: 'Pengalaman Organisasi dan Proyek',
    education: 'Pendidikan',
    present: 'Sekarang',
    university: 'STMIK Amikom Surakarta',
  },
  en: {
    summary: 'Professional Summary',
    skills: 'Skills',
    experience: 'Organizational and Project Experience',
    education: 'Education',
    present: 'Present',
    university: 'STMIK Amikom Surakarta',
  },
} as const

export type CvLang = keyof typeof LABELS

// --- Program studi config ---------------------------------------------------
// Dipetakan dari profile.education_level ke label & deskripsi per bahasa.
// Tambah entri baru di sini jika ada prodi lain.
interface ProdiLabel {
  degree: string
  field: string
  focus: string
}

const PRODI_CONFIG: Record<string, { id: ProdiLabel; en: ProdiLabel }> = {
  'D3 Komputerisasi Akuntansi': {
    id: {
      degree: 'D3',
      field: 'Komputerisasi Akuntansi',
      focus:
        'Fokus pada integrasi teknologi informasi dengan akuntansi, pengolahan data keuangan, dan sistem informasi akuntansi dengan kemampuan dalam pembukuan, pelaporan keuangan, serta audit sistem.',
    },
    en: {
      degree: 'D3',
      field: 'Informatics Accounting',
      focus:
        'Focused on integrating IT with accounting, financial data processing, and accounting information systems with skills in bookkeeping, financial reporting, and system auditing.',
    },
  },
  'D3 Manajemen Informatika': {
    id: {
      degree: 'D3',
      field: 'Manajemen Informatika',
      focus:
        'Fokus pada pengelolaan sistem informasi, pemrograman aplikasi, dan administrasi basis data dengan keterampuan dalam analisis kebutuhan bisnis dan implementasi teknologi informasi.',
    },
    en: {
      degree: 'D3',
      field: 'Informatics Management',
      focus:
        'Focused on information systems management, application programming, and database administration with skills in business requirements analysis and IT implementation.',
    },
  },
  'S1 Informatika': {
    id: {
      degree: 'S1',
      field: 'Informatika',
      focus:
        'Fokus pada pengembangan aplikasi web, basis data, dan rekayasa perangkat lunak dengan keterampuan dalam pemrograman, analisis sistem, desain sistem, inovasi teknologi, serta pemecahan masalah teknis.',
    },
    en: {
      degree: 'S1',
      field: 'Informatics',
      focus:
        'Focuses on web application development, databases, and software engineering, with skills in programming, systems analysis, system design, technological innovation, and technical problem-solving.',
    },
  },
  'S1 Teknologi Informasi': {
    id: {
      degree: 'S1',
      field: 'Teknologi Informasi',
      focus:
        'Fokus pada infrastruktur TI, manajemen jaringan, keamanan siber, dan solusi teknologi untuk mendukung operasional organisasi dengan keterampuan dalam administrasi server, cloud computing, dan sistem integrasi.',
    },
    en: {
      degree: 'S1',
      field: 'Information Technology',
      focus:
        'Focuses on IT infrastructure, network management, cybersecurity, and technology solutions to support organizational operations with skills in server administration, cloud computing, and system integration.',
    },
  },
}

/** Fallback jika education_level tidak dikenali */
const PRODI_FALLBACK = PRODI_CONFIG['S1']

function getProdiLabels(programStudi: string | null, lang: CvLang): ProdiLabel {
  const key = (programStudi ?? '').trim()
  const config = PRODI_CONFIG[key] ?? PRODI_FALLBACK
  return config[lang]
}

// --- Styles - ATS-safe: single column, no images, no tables -----------------
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 48,
    lineHeight: 1.45,
  },
  header: {
    marginBottom: 18,
    paddingBottom: 12,
  },
  name: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 22,
    color: '#1a1a1a',
    marginBottom: 3,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  contactItem: {
    fontSize: 9,
    color: '#444444',
  },
  contactSep: {
    fontSize: 9,
    color: '#aaaaaa',
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: '#700070',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#cccccc',
    paddingBottom: 3,
  },
  summaryText: {
    fontSize: 10,
    color: '#333333',
    lineHeight: 1.5,
  },
  skillsText: {
    fontSize: 10,
    color: '#333333',
    lineHeight: 1.5,
  },
  expItem: {
    marginBottom: 10,
  },
  expHeader: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10.5,
    color: '#1a1a1a',
    marginBottom: 1,
  },
  expPeriod: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 3,
  },
  expBullet: {
    fontSize: 9.5,
    color: '#555555',
    lineHeight: 1.5,
    marginLeft: 10,
    marginBottom: 1,
  },
  eduDegree: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10.5,
    color: '#1a1a1a',
    marginBottom: 1,
  },
  eduInstitution: {
    fontSize: 10,
    color: '#444444',
    marginBottom: 1,
  },
  eduPeriod: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 3,
  },
  eduFocus: {
    fontSize: 9.5,
    color: '#555555',
    lineHeight: 1.5,
  },
})

// --- Helpers -----------------------------------------------------------------

function formatPeriod(
  startDate: string,
  endDate: string | null,
  presentLabel: string
): string {
  const fmt = (d: string) => {
    const date = new Date(d)
    return date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
  }
  return `${fmt(startDate)} - ${endDate ? fmt(endDate) : presentLabel}`
}

function formatPeriodLong(
  startDate: string,
  endDate: string | null,
  presentLabel: string
): string {
  const fmt = (d: string) => {
    const date = new Date(d)
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  }
  return `${fmt(startDate)} - ${endDate ? fmt(endDate) : presentLabel}`
}

function splitBullets(text: string): string[] {
  return text
    .split(/\n|bullet|-/)
    .map((s) => s.trim())
    .filter(Boolean)
}

// --- Component ---------------------------------------------------------------

interface CvTemplateProps {
  data: CvData
  lang: CvLang
}

export function CvTemplate({ data, lang }: CvTemplateProps) {
  const { profile, trackRecords, SistemAlumni } = data
  const t = LABELS[lang]
  const prodi = getProdiLabels(profile.program_studi ?? profile.education_level, lang)

  const skillList: string[] = Array.isArray(profile.skills)
    ? (profile.skills as string[])
    : []
  const certificationList: string[] = Array.isArray(profile.certifications)
    ? profile.certifications
    : []
  const jobInterestList: string[] = Array.isArray(profile.job_interests)
    ? profile.job_interests
    : []

  const contacts: string[] = []
  if (profile.email) contacts.push(profile.email)
  if (profile.phone) contacts.push(profile.phone)
  if (profile.location) contacts.push(profile.location)

  return (
    <Document
      title={`CV - ${profile.full_name ?? 'Alumni'}`}
      author={profile.full_name ?? 'Alumni'}
      subject="Curriculum Vitae"
      creator="SITRACK - STMIK Amikom Surakarta"
      producer="SITRACK"
    >
      <Page size="A4" style={styles.page}>
        {/* -- Header -- */}
        <View style={styles.header}>
          <Text style={styles.name}>{profile.full_name ?? 'Alumni'}</Text>

          {contacts.length > 0 && (
            <View style={styles.contactRow}>
              {contacts.map((c, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
                  {i > 0 && <Text style={styles.contactSep}>•</Text>}
                  <Text style={styles.contactItem}>{c}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* -- Professional Summary -- */}
        {profile.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.summary}</Text>
            <Text style={styles.summaryText}>{profile.bio}</Text>
          </View>
        )}

        {/* -- Experience -- */}
        {trackRecords.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.experience}</Text>
            {trackRecords.map((rec) => (
              <View key={rec.id} style={styles.expItem}>
                <Text style={styles.expHeader}>
                  {rec.position}, {rec.company}
                </Text>
                <Text style={styles.expPeriod}>
                  {formatPeriodLong(rec.start_date, rec.end_date, t.present)}
                </Text>
                {rec.description &&
                  splitBullets(rec.description).map((bullet, i) => (
                    <Text key={i} style={styles.expBullet}>
                      {'• '}{bullet}
                    </Text>
                  ))}
              </View>
            ))}
          </View>
        )}

        {/* -- Education -- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.education}</Text>
          <View>
            <Text style={styles.eduDegree}>
              {prodi.degree} — {prodi.field}
            </Text>
            <Text style={styles.eduInstitution}>{t.university}</Text>
            {SistemAlumni?.graduation_year && (
              <Text style={styles.eduPeriod}>
                Periode Studi: - {SistemAlumni.graduation_year}
              </Text>
            )}
            <Text style={styles.eduFocus}>{prodi.focus}</Text>
          </View>
        </View>

        {/* -- Skills (plain text) -- */}
        {skillList.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.skills}</Text>
            <Text style={styles.skillsText}>{skillList.join(', ')}</Text>
          </View>
        )}

        {certificationList.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{lang === 'id' ? 'Sertifikasi Kompetensi' : 'Certifications'}</Text>
            <Text style={styles.skillsText}>{certificationList.join(', ')}</Text>
          </View>
        )}

        {jobInterestList.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{lang === 'id' ? 'Bidang Pekerjaan yang Diminati' : 'Job Interests'}</Text>
            <Text style={styles.skillsText}>{jobInterestList.join(', ')}</Text>
          </View>
        )}
      </Page>
    </Document>
  )
}