-- Migration 012: Riwayat Pengisian Tracer Study
-- Tabel ini menyimpan snapshot setiap kali alumni submit/memperbarui kuesioner.
-- Snapshot disimpan sebagai jsonb agar pertanyaan yang dihapus/diedit tetap terdokumentasi.

CREATE TABLE IF NOT EXISTS tracer_study_history (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  angkatan     text        NOT NULL,
  snapshot     jsonb       NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

-- Index untuk query per user (alumni lihat riwayat sendiri)
CREATE INDEX IF NOT EXISTS idx_tracer_history_user_id
  ON tracer_study_history(user_id, submitted_at DESC);

-- Index untuk query per angkatan (admin lihat riwayat per angkatan)
CREATE INDEX IF NOT EXISTS idx_tracer_history_angkatan
  ON tracer_study_history(angkatan);

-- ─── Row Level Security ───
ALTER TABLE tracer_study_history ENABLE ROW LEVEL SECURITY;

-- Alumni hanya bisa baca riwayat milik sendiri
CREATE POLICY "Alumni baca riwayat sendiri"
  ON tracer_study_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Alumni bisa insert riwayat milik sendiri
CREATE POLICY "Alumni insert riwayat sendiri"
  ON tracer_study_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin (super_user) bisa baca semua riwayat
CREATE POLICY "Admin baca semua riwayat"
  ON tracer_study_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_user'
    )
  );
