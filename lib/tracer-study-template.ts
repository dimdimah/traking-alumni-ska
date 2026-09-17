// Template pertanyaan Tracer Study — STMIK AMIKOM Surakarta
// Struktur: 3 Bagian (Identitas, Wajib, Opsional) sesuai panduan Dikti

export interface TemplateQuestion {
  question_text: string
  question_type: 'text' | 'textarea' | 'select' | 'radio' | 'number' | 'checkbox' | 'scale'
  options: string[] | null
  is_active: boolean
  display_order: number
  section: 'identitas' | 'wajib' | 'opsional'
  required: boolean
}

// ══════════════════════════════════════════════════
// SKALA
// ══════════════════════════════════════════════════

const SCALE_KOMPETENSI = [
  '1 = Kurang',
  '2 = Kurang',
  '3 = Cukup',
  '4 = Baik',
  '5 = Sangat Baik',
]

const SCALE_METODE = [
  '1 = Sangat Besar',
  '2 = Besar',
  '3 = Cukup',
  '4 = Kurang',
  '5 = Tidak Sama Sekali',
]

const YA_TIDAK = ['Ya', 'Tidak']

// ══════════════════════════════════════════════════
// TEMPLATE
// ══════════════════════════════════════════════════

export const TRACER_STUDY_TEMPLATE: TemplateQuestion[] = [

  // ══════════════════════════════════════════════════
  // BAGIAN 1 — IDENTITAS RESPONDEN (display_order 1–99)
  // ══════════════════════════════════════════════════

  {
    question_text: 'Nomor Mahasiswa',
    question_type: 'text',
    options: null,
    is_active: true,
    display_order: 1,
    section: 'identitas',
    required: true,
  },
  {
    question_text: 'Kode Perguruan Tinggi',
    question_type: 'text',
    options: null,
    is_active: true,
    display_order: 2,
    section: 'identitas',
    required: true,
  },
  {
    question_text: 'Tahun Lulus',
    question_type: 'text',
    options: null,
    is_active: true,
    display_order: 3,
    section: 'identitas',
    required: true,
  },
  {
    question_text: 'Kode Program Studi',
    question_type: 'text',
    options: null,
    is_active: true,
    display_order: 4,
    section: 'identitas',
    required: true,
  },
  {
    question_text: 'Nama Lengkap',
    question_type: 'text',
    options: null,
    is_active: true,
    display_order: 5,
    section: 'identitas',
    required: true,
  },
  {
    question_text: 'Nomor Telepon/HP',
    question_type: 'text',
    options: null,
    is_active: true,
    display_order: 6,
    section: 'identitas',
    required: true,
  },
  {
    question_text: 'Alamat Email',
    question_type: 'text',
    options: null,
    is_active: true,
    display_order: 7,
    section: 'identitas',
    required: true,
  },
  {
    question_text: 'NIK',
    question_type: 'text',
    options: null,
    is_active: true,
    display_order: 8,
    section: 'identitas',
    required: true,
  },
  {
    question_text: 'NPWP',
    question_type: 'text',
    options: null,
    is_active: true,
    display_order: 9,
    section: 'identitas',
    required: true,
  },

  // ══════════════════════════════════════════════════
  // BAGIAN 2 — KUESIONER WAJIB (display_order 100–599)
  // ══════════════════════════════════════════════════

  // ─── STATUS & PEKERJAAN ───

  {
    question_text: 'Jelaskan status Anda saat ini.',
    question_type: 'radio',
    options: [
      'Bekerja (full time/part time)',
      'Wiraswasta',
      'Melanjutkan pendidikan',
      'Tidak bekerja tetapi sedang mencari pekerjaan',
      'Belum memungkinkan bekerja',
    ],
    is_active: true,
    display_order: 100,
    section: 'wajib',
    required: true,
  },

  // ─── Waktu mendapatkan pekerjaan (kondisional: Bekerja / Wiraswasta / Mencari) ───

  {
    question_text: 'Apakah Anda telah mendapatkan pekerjaan dalam waktu kurang dari atau sama dengan 6 bulan setelah lulus, termasuk jika sudah bekerja sebelum lulus?',
    question_type: 'radio',
    options: YA_TIDAK,
    is_active: true,
    display_order: 110,
    section: 'wajib',
    required: true,
  },
  {
    question_text: 'Dalam berapa bulan Anda mendapatkan pekerjaan?',
    question_type: 'number',
    options: null,
    is_active: true,
    display_order: 115,
    section: 'wajib',
    required: true,
  },
  {
    question_text: 'Berapa bulan waktu yang Anda butuhkan untuk mendapatkan pekerjaan pertama?',
    question_type: 'number',
    options: null,
    is_active: true,
    display_order: 116,
    section: 'wajib',
    required: true,
  },

  // ─── PENDAPATAN (kondisional: Bekerja / Wiraswasta) ───

  {
    question_text: 'Berapa rata-rata pendapatan Anda per bulan (take home pay)?',
    question_type: 'text',
    options: null,
    is_active: true,
    display_order: 120,
    section: 'wajib',
    required: true,
  },

  // ─── LOKASI KERJA (kondisional: Bekerja / Wiraswasta) ───

  {
    question_text: 'Di mana lokasi tempat Anda bekerja?',
    question_type: 'text',
    options: null,
    is_active: true,
    display_order: 130,
    section: 'wajib',
    required: true,
  },

  // ─── JENIS PERUSAHAAN (kondisional: Bekerja) ───

  {
    question_text: 'Apa jenis perusahaan/instansi/institusi tempat Anda bekerja sekarang?',
    question_type: 'radio',
    options: [
      'Instansi pemerintah',
      'BUMN/BUMD',
      'Institusi/Organisasi Multilateral',
      'Organisasi non-profit/Lembaga Swadaya Masyarakat',
      'Perusahaan swasta',
      'Wiraswasta/perusahaan sendiri',
      'Lainnya',
    ],
    is_active: true,
    display_order: 140,
    section: 'wajib',
    required: true,
  },
  {
    question_text: 'Jika memilih "Lainnya" pada jenis perusahaan, sebutkan:',
    question_type: 'text',
    options: null,
    is_active: true,
    display_order: 145,
    section: 'wajib',
    required: false,
  },

  // ─── NAMA PERUSAHAAN (kondisional: Bekerja) ───

  {
    question_text: 'Apa nama perusahaan/kantor tempat Anda bekerja?',
    question_type: 'text',
    options: null,
    is_active: true,
    display_order: 150,
    section: 'wajib',
    required: true,
  },

  // ─── POSISI WIRASWASTA (kondisional: Wiraswasta) ───

  {
    question_text: 'Bila Anda berwiraswasta, apa posisi/jabatan Anda saat ini?',
    question_type: 'radio',
    options: [
      'Founder',
      'Co-Founder',
      'Staff',
      'Freelance/Kerja Lepas',
    ],
    is_active: true,
    display_order: 160,
    section: 'wajib',
    required: true,
  },

  // ─── TINGKAT TEMPAT KERJA (kondisional: Bekerja / Wiraswasta) ───

  {
    question_text: 'Apa tingkat tempat kerja Anda?',
    question_type: 'radio',
    options: [
      'Lokal/wilayah/wiraswasta tidak berbadan hukum',
      'Nasional/wiraswasta berbadan hukum',
      'Multinasional/internasional',
    ],
    is_active: true,
    display_order: 170,
    section: 'wajib',
    required: true,
  },

  // ─── STUDI LANJUT (kondisional: Melanjutkan pendidikan) ───

  {
    question_text: 'Sumber biaya studi lanjut',
    question_type: 'radio',
    options: [
      'Biaya sendiri',
      'Beasiswa',
    ],
    is_active: true,
    display_order: 180,
    section: 'wajib',
    required: true,
  },
  {
    question_text: 'Nama Perguruan Tinggi (studi lanjut)',
    question_type: 'text',
    options: null,
    is_active: true,
    display_order: 185,
    section: 'wajib',
    required: true,
  },
  {
    question_text: 'Program Studi (studi lanjut)',
    question_type: 'text',
    options: null,
    is_active: true,
    display_order: 190,
    section: 'wajib',
    required: true,
  },
  {
    question_text: 'Tanggal Masuk (studi lanjut)',
    question_type: 'text',
    options: null,
    is_active: true,
    display_order: 195,
    section: 'wajib',
    required: true,
  },

  // ─── SUMBER DANA KULIAH ───

  {
    question_text: 'Sebutkan sumber dana dalam pembiayaan kuliah Anda sebelumnya, bukan ketika studi lanjut.',
    question_type: 'checkbox',
    options: [
      'Biaya sendiri/keluarga',
      'Beasiswa ADIK',
      'Beasiswa BIDIKMISI',
      'Beasiswa PPA',
      'Beasiswa AFIRMASI',
      'Beasiswa perusahaan/swasta',
      'Lainnya',
    ],
    is_active: true,
    display_order: 200,
    section: 'wajib',
    required: true,
  },
  {
    question_text: 'Jika memilih "Lainnya" pada sumber dana kuliah, sebutkan:',
    question_type: 'text',
    options: null,
    is_active: true,
    display_order: 205,
    section: 'wajib',
    required: false,
  },

  // ─── KESESUAIAN BIDANG (kondisional: Bekerja / Wiraswasta) ───

  {
    question_text: 'Seberapa erat hubungan antara bidang studi dengan pekerjaan Anda?',
    question_type: 'radio',
    options: [
      'Sangat Erat',
      'Erat',
      'Cukup Erat',
      'Kurang Erat',
      'Tidak Sama Sekali',
    ],
    is_active: true,
    display_order: 210,
    section: 'wajib',
    required: true,
  },
  {
    question_text: 'Tingkat pendidikan apa yang paling tepat/sesuai untuk pekerjaan Anda saat ini?',
    question_type: 'radio',
    options: [
      'Setingkat lebih tinggi',
      'Tingkat yang sama',
      'Setingkat lebih rendah',
      'Tidak perlu pendidikan tinggi',
    ],
    is_active: true,
    display_order: 220,
    section: 'wajib',
    required: true,
  },

  // ─── TINGKAT KOMPETENSI (kondisional: Bekerja / Wiraswasta) ───

  {
    question_text: '[Kompetensi] Etika — Tingkat penguasaan saat lulus (A)',
    question_type: 'scale',
    options: SCALE_KOMPETENSI,
    is_active: true,
    display_order: 230,
    section: 'wajib',
    required: true,
  },
  {
    question_text: '[Kompetensi] Etika — Tingkat kebutuhan dalam pekerjaan saat ini (B)',
    question_type: 'scale',
    options: SCALE_KOMPETENSI,
    is_active: true,
    display_order: 235,
    section: 'wajib',
    required: true,
  },
  {
    question_text: '[Kompetensi] Keahlian berdasarkan bidang ilmu/profesionalisme — Tingkat penguasaan saat lulus (A)',
    question_type: 'scale',
    options: SCALE_KOMPETENSI,
    is_active: true,
    display_order: 240,
    section: 'wajib',
    required: true,
  },
  {
    question_text: '[Kompetensi] Keahlian berdasarkan bidang ilmu/profesionalisme — Tingkat kebutuhan dalam pekerjaan saat ini (B)',
    question_type: 'scale',
    options: SCALE_KOMPETENSI,
    is_active: true,
    display_order: 245,
    section: 'wajib',
    required: true,
  },
  {
    question_text: '[Kompetensi] Bahasa Inggris — Tingkat penguasaan saat lulus (A)',
    question_type: 'scale',
    options: SCALE_KOMPETENSI,
    is_active: true,
    display_order: 250,
    section: 'wajib',
    required: true,
  },
  {
    question_text: '[Kompetensi] Bahasa Inggris — Tingkat kebutuhan dalam pekerjaan saat ini (B)',
    question_type: 'scale',
    options: SCALE_KOMPETENSI,
    is_active: true,
    display_order: 255,
    section: 'wajib',
    required: true,
  },
  {
    question_text: '[Kompetensi] Penggunaan Teknologi Informasi — Tingkat penguasaan saat lulus (A)',
    question_type: 'scale',
    options: SCALE_KOMPETENSI,
    is_active: true,
    display_order: 260,
    section: 'wajib',
    required: true,
  },
  {
    question_text: '[Kompetensi] Penggunaan Teknologi Informasi — Tingkat kebutuhan dalam pekerjaan saat ini (B)',
    question_type: 'scale',
    options: SCALE_KOMPETENSI,
    is_active: true,
    display_order: 265,
    section: 'wajib',
    required: true,
  },
  {
    question_text: '[Kompetensi] Komunikasi — Tingkat penguasaan saat lulus (A)',
    question_type: 'scale',
    options: SCALE_KOMPETENSI,
    is_active: true,
    display_order: 270,
    section: 'wajib',
    required: true,
  },
  {
    question_text: '[Kompetensi] Komunikasi — Tingkat kebutuhan dalam pekerjaan saat ini (B)',
    question_type: 'scale',
    options: SCALE_KOMPETENSI,
    is_active: true,
    display_order: 275,
    section: 'wajib',
    required: true,
  },
  {
    question_text: '[Kompetensi] Kerjasama tim — Tingkat penguasaan saat lulus (A)',
    question_type: 'scale',
    options: SCALE_KOMPETENSI,
    is_active: true,
    display_order: 280,
    section: 'wajib',
    required: true,
  },
  {
    question_text: '[Kompetensi] Kerjasama tim — Tingkat kebutuhan dalam pekerjaan saat ini (B)',
    question_type: 'scale',
    options: SCALE_KOMPETENSI,
    is_active: true,
    display_order: 285,
    section: 'wajib',
    required: true,
  },
  {
    question_text: '[Kompetensi] Pengembangan diri — Tingkat penguasaan saat lulus (A)',
    question_type: 'scale',
    options: SCALE_KOMPETENSI,
    is_active: true,
    display_order: 290,
    section: 'wajib',
    required: true,
  },
  {
    question_text: '[Kompetensi] Pengembangan diri — Tingkat kebutuhan dalam pekerjaan saat ini (B)',
    question_type: 'scale',
    options: SCALE_KOMPETENSI,
    is_active: true,
    display_order: 295,
    section: 'wajib',
    required: true,
  },

  // ══════════════════════════════════════════════════
  // BAGIAN 3 — KUESIONER OPSIONAL (display_order 600+)
  // ══════════════════════════════════════════════════

  // ─── METODE PEMBELAJARAN ───

  {
    question_text: '[Metode Pembelajaran] Perkuliahan — Seberapa besar penekanannya di program studi Anda?',
    question_type: 'scale',
    options: SCALE_METODE,
    is_active: true,
    display_order: 600,
    section: 'opsional',
    required: false,
  },
  {
    question_text: '[Metode Pembelajaran] Demonstrasi — Seberapa besar penekanannya di program studi Anda?',
    question_type: 'scale',
    options: SCALE_METODE,
    is_active: true,
    display_order: 610,
    section: 'opsional',
    required: false,
  },
  {
    question_text: '[Metode Pembelajaran] Partisipasi dalam proyek riset — Seberapa besar penekanannya di program studi Anda?',
    question_type: 'scale',
    options: SCALE_METODE,
    is_active: true,
    display_order: 620,
    section: 'opsional',
    required: false,
  },
  {
    question_text: '[Metode Pembelajaran] Magang — Seberapa besar penekanannya di program studi Anda?',
    question_type: 'scale',
    options: SCALE_METODE,
    is_active: true,
    display_order: 630,
    section: 'opsional',
    required: false,
  },
  {
    question_text: '[Metode Pembelajaran] Praktikum — Seberapa besar penekanannya di program studi Anda?',
    question_type: 'scale',
    options: SCALE_METODE,
    is_active: true,
    display_order: 640,
    section: 'opsional',
    required: false,
  },
  {
    question_text: '[Metode Pembelajaran] Kerja Lapangan — Seberapa besar penekanannya di program studi Anda?',
    question_type: 'scale',
    options: SCALE_METODE,
    is_active: true,
    display_order: 650,
    section: 'opsional',
    required: false,
  },
  {
    question_text: '[Metode Pembelajaran] Diskusi — Seberapa besar penekanannya di program studi Anda?',
    question_type: 'scale',
    options: SCALE_METODE,
    is_active: true,
    display_order: 660,
    section: 'opsional',
    required: false,
  },

  // ─── PENCARIAN KERJA ───

  {
    question_text: 'Kapan Anda mulai mencari pekerjaan? (Pekerjaan sambilan tidak dimasukkan)',
    question_type: 'radio',
    options: [
      'Kira-kira .... bulan sebelum lulus',
      'Kira-kira .... bulan sesudah lulus',
      'Saya tidak mencari pekerjaan',
    ],
    is_active: true,
    display_order: 670,
    section: 'opsional',
    required: false,
  },
  {
    question_text: 'Berapa bulan sebelum/sesudah lulus Anda mulai mencari pekerjaan?',
    question_type: 'number',
    options: null,
    is_active: true,
    display_order: 675,
    section: 'opsional',
    required: false,
  },

  // ─── CARA MENCARI PEKERJAAN (checkbox — multi select) ───

  {
    question_text: 'Bagaimana Anda mencari pekerjaan tersebut?',
    question_type: 'checkbox',
    options: [
      'Melalui iklan di koran/majalah/brosur',
      'Melamar ke perusahaan tanpa mengetahui lowongan yang tersedia',
      'Pergi ke bursa/pameran kerja',
      'Mencari melalui internet/iklan online/milis',
      'Dihubungi oleh perusahaan',
      'Menghubungi Kemenakertrans',
      'Menghubungi agen tenaga kerja komersial/swasta',
      'Memperoleh informasi dari pusat/kantor pengembangan karier fakultas/universitas',
      'Menghubungi kantor kemahasiswaan/hubungan alumni',
      'Membangun jejaring/network sejak masih kuliah',
      'Melalui relasi, misalnya dosen, orang tua, saudara, teman, dan lain-lain',
      'Membangun bisnis sendiri',
      'Melalui penempatan kerja atau magang',
      'Bekerja di tempat yang sama dengan tempat kerja semasa kuliah',
      'Lainnya',
    ],
    is_active: true,
    display_order: 680,
    section: 'opsional',
    required: false,
  },
  {
    question_text: 'Jika memilih "Lainnya" pada cara mencari pekerjaan, sebutkan:',
    question_type: 'text',
    options: null,
    is_active: true,
    display_order: 685,
    section: 'opsional',
    required: false,
  },

  // ─── STATISTIK LAMARAN ───

  {
    question_text: 'Berapa perusahaan/instansi/institusi yang sudah Anda lamar sebelum memperoleh pekerjaan?',
    question_type: 'number',
    options: null,
    is_active: true,
    display_order: 690,
    section: 'opsional',
    required: false,
  },
  {
    question_text: 'Berapa banyak perusahaan/instansi/institusi yang merespons lamaran Anda?',
    question_type: 'number',
    options: null,
    is_active: true,
    display_order: 695,
    section: 'opsional',
    required: false,
  },
  {
    question_text: 'Berapa banyak perusahaan/instansi/institusi yang mengundang Anda untuk wawancara?',
    question_type: 'number',
    options: null,
    is_active: true,
    display_order: 700,
    section: 'opsional',
    required: false,
  },

  // ─── SITUASI SAAT INI ───

  {
    question_text: 'Bagaimana Anda menggambarkan situasi Anda saat ini?',
    question_type: 'checkbox',
    options: [
      'Saya masih belajar/melanjutkan kuliah profesi atau pascasarjana',
      'Saya menikah',
      'Saya sibuk dengan keluarga dan anak-anak',
      'Saya sekarang sedang mencari pekerjaan',
      'Lainnya',
    ],
    is_active: true,
    display_order: 710,
    section: 'opsional',
    required: false,
  },
  {
    question_text: 'Jika memilih "Lainnya" pada situasi saat ini, sebutkan:',
    question_type: 'text',
    options: null,
    is_active: true,
    display_order: 715,
    section: 'opsional',
    required: false,
  },

  // ─── AKTIF MENCARI PEKERJAAN ───

  {
    question_text: 'Apakah Anda aktif mencari pekerjaan dalam 4 minggu terakhir?',
    question_type: 'radio',
    options: [
      'Tidak',
      'Tidak, tetapi saya sedang menunggu hasil lamaran kerja',
      'Ya, saya akan mulai bekerja dalam 2 minggu ke depan',
      'Ya, tetapi saya belum pasti akan bekerja dalam 2 minggu ke depan',
      'Lainnya',
    ],
    is_active: true,
    display_order: 720,
    section: 'opsional',
    required: false,
  },
  {
    question_text: 'Jika memilih "Lainnya" pada aktif mencari pekerjaan, sebutkan:',
    question_type: 'text',
    options: null,
    is_active: true,
    display_order: 725,
    section: 'opsional',
    required: false,
  },

  // ─── ALASAN PEKERJAAN TIDAK SESUAI PENDIDIKAN ───

  {
    question_text: 'Jika menurut Anda pekerjaan saat ini tidak sesuai dengan pendidikan Anda, mengapa Anda mengambil pekerjaan tersebut?',
    question_type: 'checkbox',
    options: [
      'Pertanyaan tidak sesuai, pekerjaan saya saat ini sudah sesuai dengan pendidikan saya',
      'Saya belum mendapatkan pekerjaan yang lebih sesuai dengan pendidikan saya',
      'Di pekerjaan ini saya memperoleh prospek karier yang baik',
      'Saya lebih suka bekerja di area pekerjaan yang tidak ada hubungannya dengan pendidikan saya',
      'Saya dipromosikan ke posisi yang kurang berhubungan dengan pendidikan saya dibanding posisi sebelumnya',
      'Saya dapat memperoleh pendapatan yang lebih tinggi di pekerjaan ini',
      'Pekerjaan saya saat ini lebih aman/terjamin',
      'Pekerjaan saya saat ini lebih menarik',
      'Pekerjaan saya saat ini memungkinkan saya mengambil pekerjaan tambahan atau memiliki jadwal yang fleksibel',
      'Lokasi pekerjaan saya saat ini lebih dekat dari rumah',
      'Pekerjaan saya saat ini dapat lebih menjamin kebutuhan keluarga',
      'Pada awal meniti karier, saya harus menerima pekerjaan yang tidak berhubungan dengan pendidikan saya',
      'Lainnya',
    ],
    is_active: true,
    display_order: 730,
    section: 'opsional',
    required: false,
  },
  {
    question_text: 'Jika memilih "Lainnya" pada alasan pekerjaan tidak sesuai pendidikan, sebutkan:',
    question_type: 'text',
    options: null,
    is_active: true,
    display_order: 735,
    section: 'opsional',
    required: false,
  },
]

export const TEMPLATE_QUESTION_COUNT = TRACER_STUDY_TEMPLATE.length
