-- ============================================================
-- Migration 009: Add slug to sertifikasi table
-- ============================================================

-- 1. Tambah kolom slug (nullable dulu agar bisa backfill)
ALTER TABLE public.sertifikasi
  ADD COLUMN IF NOT EXISTS slug text;

-- 2. Backfill slug dari nama untuk data existing
UPDATE public.sertifikasi
SET slug = lower(regexp_replace(regexp_replace(nama, '&', 'dan', 'g'), '[^a-z0-9\s-]', '', 'g'))
WHERE slug IS NULL;

-- 3. Set not null + unique
ALTER TABLE public.sertifikasi
  ALTER COLUMN slug SET NOT NULL,
  ADD CONSTRAINT IF NOT EXISTS sertifikasi_slug_unique UNIQUE (slug);

-- 4. Trigger untuk auto-generate slug dari nama pada INSERT/UPDATE
CREATE OR REPLACE FUNCTION public.set_sertifikasi_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.slug := lower(regexp_replace(regexp_replace(NEW.nama, '&', 'dan', 'g'), '[^a-z0-9\s-]', '', 'g'));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_sertifikasi_slug ON public.sertifikasi;
CREATE TRIGGER set_sertifikasi_slug
  BEFORE INSERT OR UPDATE OF nama ON public.sertifikasi
  FOR EACH ROW EXECUTE FUNCTION public.set_sertifikasi_slug();
