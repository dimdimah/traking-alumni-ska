-- Migration 013: Admin Activity & Export History Logs
-- Menyimpan log aktivitas admin, termasuk riwayat unduh/export excel, update tracer study, dll.

CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  user_email  text,
  user_name   text,
  action_type text        NOT NULL, -- 'EXPORT_EXCEL', 'QUESTION_UPDATE', 'ALUMNI_UPDATE', etc.
  title       text        NOT NULL,
  description text,
  metadata    jsonb,      -- contoh: { angkatan: '2024', total_records: 30, file_name: '...' }
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index untuk sorting log berdasarkan waktu
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at
  ON admin_activity_logs(created_at DESC);

-- Index berdasarkan tipe aksi
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_action_type
  ON admin_activity_logs(action_type);

-- ─── Row Level Security ───
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Super user bisa membaca semua log aktivitas
CREATE POLICY "Admin select all activity logs"
  ON admin_activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_user'
    )
  );

-- Super user bisa memasukkan log aktivitas
CREATE POLICY "Admin insert activity logs"
  ON admin_activity_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_user'
    )
  );
