'use client'

import { useState, useEffect, useCallback, useMemo, useDeferredValue } from 'react'
import { useRouter } from 'next/navigation'
import { getCachedProfile, setCachedProfile } from '@/lib/profile-cache'
import { updateProfile, changePassword, getProfileInitialData } from '@/lib/actions/profile'
import { createTrackRecord, updateTrackRecord, deleteTrackRecord } from '@/lib/actions/track-record'
import { getProfileCompletenessDetails } from '@/lib/utils/profile-completeness'
import SkillSelector from '@/components/skill-selector'
import TagInput from '@/components/tag-input'
import CertificationInput from '@/components/certification-input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/ui/page-header'
import dynamic from 'next/dynamic'
const CVPreviewDialog = dynamic(() => import('@/components/cv/cv-preview-dialog').then(m => m.CVPreviewDialog), { ssr: false })
import { Modal } from '@/components/ui/modal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CheckCircle2, AlertCircle, FileText, Briefcase, Plus } from 'lucide-react'
import type { Profile, TrackRecord } from '@/types/database'
import { JOB_INTERESTS, JOB_TYPES, PREFERRED_LOCATIONS, PROGRAM_STUDI } from '@/lib/constants'
import { toast } from 'sonner'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [completeness, setCompleteness] = useState({ percentage: 0, missingFields: [] as string[] })

  // Profile form
  const [fullName, setFullName] = useState('')
  const [nim, setNim] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')

  // Matching fields
  const [skills, setSkills] = useState('')
  const [location, setLocation] = useState('')
  const [programStudi, setProgramStudi] = useState('')
  const [certifications, setCertifications] = useState('')
  const [jobInterests, setJobInterests] = useState('')
  const [preferredLocation, setPreferredLocation] = useState('')
  const [preferredType, setPreferredType] = useState('')
  const [graduationYear, setGraduationYear] = useState('')

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  // CV dialog
  const [cvDialogOpen, setCvDialogOpen] = useState(false)
  const [hasCompletedTracerStudy, setHasCompletedTracerStudy] = useState(false)

  // ── Track Record State ──────────────────────────────
  const [records, setRecords] = useState<TrackRecord[]>([])
  const [trModal, setTrModal] = useState<{ open: boolean; mode: 'add' | 'edit'; record: TrackRecord | null }>({ open: false, mode: 'add', record: null })
  const [trSubmitting, setTrSubmitting] = useState(false)
  const [trDeleteConfirm, setTrDeleteConfirm] = useState<string | null>(null)
  const [trCompany, setTrCompany] = useState('')
  const [trPosition, setTrPosition] = useState('')
  const [trStartDate, setTrStartDate] = useState('')
  const [trEndDate, setTrEndDate] = useState('')
  const [trDescription, setTrDescription] = useState('')
  const [trIsCurrent, setTrIsCurrent] = useState(false)

  const loadRecords = useCallback(async () => {
    try {
      const { trackRecords, hasCompletedTracerStudy: ts } = await getProfileInitialData()
      setRecords(trackRecords)
      setHasCompletedTracerStudy(ts)
    } catch {}
  }, [])

  function applyProfile(profileData: Profile, trackData: TrackRecord[]) {
    setProfile(profileData)
    setRecords(trackData)
    setCompleteness(getProfileCompletenessDetails(profileData, trackData))
    setFullName(profileData.full_name || '')
    setNim(profileData.nim || '')
    setPhone(profileData.phone || '')
    setBio(profileData.bio || '')
    setSkills(Array.isArray(profileData.skills) ? profileData.skills.join(', ') : '')
    setLocation(profileData.location || '')
    setProgramStudi(profileData.program_studi || profileData.education_level || '')
    setCertifications(Array.isArray(profileData.certifications) ? profileData.certifications.join('\n') : '')
    setJobInterests(Array.isArray(profileData.job_interests) ? profileData.job_interests.join(', ') : '')
    setPreferredLocation(profileData.preferred_location || '')
    setPreferredType(profileData.preferred_type || '')
    setGraduationYear(profileData.graduation_year?.toString() || '')
  }

  useEffect(() => {
    async function load() {
      // Single BE RTT: 1× auth + paralel profiles + track_records; cache tetap dipakai untuk instant render
      try {
        const { profile: p, trackRecords, hasCompletedTracerStudy: ts } = await getProfileInitialData()
        if (!p) { router.push('/login'); return }
        applyProfile(p, trackRecords)
        setHasCompletedTracerStudy(ts)
        setCachedProfile(p)
      } catch {
        router.push('/login')
        return
      } finally {
        setLoading(false)
      }
    }
    // Instant dari cache dulu (full apply tanpa spinner), lalu sync BE
    const cached = getCachedProfile()
    if (cached) {
      applyProfile(cached, [])
      setLoading(false)
    }
    load()
  }, [router])

  function resetTrForm() {
    setTrCompany(''); setTrPosition(''); setTrStartDate(''); setTrEndDate(''); setTrDescription(''); setTrIsCurrent(false)
  }

  function openAddTr() { resetTrForm(); setTrModal({ open: true, mode: 'add', record: null }) }
  function openEditTr(r: TrackRecord) {
    setTrCompany(r.company); setTrPosition(r.position)
    setTrStartDate(r.start_date.split('T')[0]); setTrEndDate(r.end_date ? r.end_date.split('T')[0] : '')
    setTrDescription(r.description || ''); setTrIsCurrent(r.is_current)
    setTrModal({ open: true, mode: 'edit', record: r })
  }

  async function handleTrSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTrSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('company', trCompany); fd.append('position', trPosition)
      fd.append('start_date', trStartDate); fd.append('end_date', trIsCurrent ? '' : trEndDate)
      fd.append('description', trDescription); fd.append('is_current', trIsCurrent ? 'true' : 'false')
      if (trModal.mode === 'add') { await createTrackRecord(fd); toast.success('Riwayat kerja ditambahkan') }
      else if (trModal.record) { await updateTrackRecord(trModal.record.id, fd); toast.success('Riwayat kerja diperbarui') }
      setTrModal({ open: false, mode: 'add', record: null }); resetTrForm(); loadRecords()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan') }
    finally { setTrSubmitting(false) }
  }

  async function handleTrDelete() {
    if (!trDeleteConfirm) return
    toast.promise(deleteTrackRecord(trDeleteConfirm), {
      loading: 'Menghapus...', success: () => { setTrDeleteConfirm(null); loadRecords(); return 'Riwayat kerja dihapus' },
      error: (err) => err instanceof Error ? err.message : 'Terjadi kesalahan',
    })
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('full_name', fullName)
      fd.append('phone', phone)
      fd.append('bio', bio)
      fd.append('nim', nim)
      fd.append('skills', skills)
      fd.append('location', location)
      fd.append('program_studi', programStudi)
      fd.append('certifications', certifications)
      fd.append('job_interests', jobInterests)
      fd.append('preferred_location', preferredLocation)
      fd.append('preferred_type', preferredType)
      await updateProfile(fd)
      const updatedProfile = {
        ...profile,
        full_name: fullName,
        phone,
        bio,
        nim,
        skills: skills.split(/[,;]/).map(s => s.trim()).filter(Boolean),
        location: location || null,
        program_studi: programStudi || null,
        certifications: certifications.split(/\r?\n/).map(s => s.trim()).filter(Boolean),
        job_interests: jobInterests.split(/[,;]/).map(s => s.trim()).filter(Boolean),
        preferred_location: preferredLocation || null,
        preferred_type: preferredType || null,
      } as Profile
      setProfile(updatedProfile)
      setCachedProfile(updatedProfile)
      setCompleteness(getProfileCompletenessDetails(updatedProfile, records))
      toast.success('Profil berhasil diperbarui')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Password baru minimal 6 karakter')
      return
    }
    setChangingPassword(true)
    try {
      const fd = new FormData()
      fd.append('current_password', currentPassword)
      fd.append('new_password', newPassword)
      fd.append('confirm_password', confirmPassword)
      await changePassword(fd)
      toast.success('Password berhasil diubah')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-amikom-purple border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        icon={<span className="text-xs">👤</span>}
        label="Profil"
        title="Profil Saya."
        subtitle="Kelola informasi akun dan pengaturan Anda."
      />

      {/* Completeness Banner */}
      {completeness.percentage < 100 && (
        <div className={`rounded-lg border p-5 animate-fade-in-up ${
          completeness.percentage >= 80
            ? 'border-emerald-200 bg-emerald-50'
            : completeness.percentage >= 50
            ? 'border-amber-200 bg-amber-50'
            : 'border-red-200 bg-red-50'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border ${
              completeness.percentage >= 80
                ? 'bg-emerald-100 text-emerald-600 border-emerald-200'
                : completeness.percentage >= 50
                ? 'bg-amber-100 text-amber-600 border-amber-200'
                : 'bg-red-100 text-red-600 border-red-200'
            }`}>
              {completeness.percentage >= 80 ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-semibold ${
                completeness.percentage >= 80 ? 'text-emerald-800' : completeness.percentage >= 50 ? 'text-amber-800' : 'text-red-800'
              }`}>
                Profil {completeness.percentage}% lengkap
              </p>
              <p className={`mt-1 text-xs ${
                completeness.percentage >= 80 ? 'text-emerald-700' : completeness.percentage >= 50 ? 'text-amber-700' : 'text-red-700'
              }`}>
                {completeness.missingFields.length > 0
                  ? `Lengkapi data berikut untuk rekomendasi yang lebih akurat: ${completeness.missingFields.slice(0, 3).join(', ')}${completeness.missingFields.length > 3 ? '...' : ''}`
                  : 'Profil Anda sudah lengkap!'}
              </p>
              <div className="mt-3 h-2 rounded-full bg-white/60 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    completeness.percentage >= 80 ? 'bg-emerald-500' : completeness.percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${completeness.percentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Card 1 · Profile Preview ──────────────────────── */}
      <section className="animate-fade-in-up rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 border border-slate-200">
            <span className="text-2xl font-semibold text-slate-900 font-mono">
              {(fullName || profile?.email || '?').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-slate-900 truncate">{fullName || 'User'}</p>
            <p className="text-sm text-slate-600 truncate">{profile?.email}</p>
            <span className={`mt-2 inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-medium font-mono tracking-wider uppercase ${
              profile?.role === 'super_user' ? 'bg-amikom-purple text-amikom-jonquil-warm' : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${profile?.role === 'super_user' ? 'bg-amikom-jonquil-warm' : 'bg-slate-500'}`} />
              {profile?.role === 'super_user' ? 'Super User' : 'Alumni'}
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-3">
          {nim && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">NIM</p>
              <p className="mt-0.5 text-sm text-slate-900">{nim}</p>
            </div>
          )}
          {programStudi && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Program Studi</p>
              <p className="mt-0.5 text-sm text-slate-900">{programStudi}</p>
            </div>
          )}
          {graduationYear && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Tahun Lulus</p>
              <p className="mt-0.5 text-sm text-slate-900">{graduationYear}</p>
            </div>
          )}
          {phone && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Telepon</p>
              <p className="mt-0.5 text-sm text-slate-900">{phone}</p>
            </div>
          )}
          {preferredLocation && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Preferensi Lokasi</p>
              <p className="mt-0.5 text-sm text-slate-600">{preferredLocation}</p>
            </div>
          )}
          {preferredType && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Tipe Pekerjaan</p>
              <p className="mt-0.5 text-sm text-slate-600">{preferredType}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Bergabung Sejak</p>
            <p className="mt-0.5 text-sm text-slate-900">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                : '—'}
            </p>
          </div>
        </div>

        {bio && (
          <div className="mt-5 rounded-md bg-slate-50 border border-slate-200 px-4 py-3">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Bio</p>
            <p className="mt-1 text-sm text-slate-600 leading-relaxed">{bio}</p>
          </div>
        )}
      </section>

      {/* ── Card 2 · Data Diri ───────────────────────────── */}
      <section className="animate-fade-in-up rounded-lg border border-slate-200 bg-white p-6 shadow-sm" style={{ animationDelay: '0.05s' }}>
        <form onSubmit={handleProfileSubmit}>
          <div className="mb-6">
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Data Diri</p>
            <p className="mt-1 text-xs text-slate-500">Informasi identitas dan kontak alumni</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Nama Lengkap</label>
              <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                placeholder="Masukkan nama lengkap"
                className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20" />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">NIM</label>
              <input type="text" value={nim} onChange={(e) => setNim(e.target.value)}
                placeholder="Nomor Induk Mahasiswa"
                className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20" />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Email</label>
              <input type="email" value={profile?.email || ''} readOnly
                className="w-full rounded-md border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-500 outline-none cursor-not-allowed" />
              <p className="text-xs text-slate-500">Email tidak dapat diubah</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">No. Telepon</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="+62 812 3456 7890"
                className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20" />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Lokasi Domisili</label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih lokasi domisili..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="Solo Raya">Solo Raya</SelectItem>
                    <SelectItem value="STMIK AMIKOM Surakarta">STMIK AMIKOM Surakarta</SelectItem>
                    <SelectItem value="Semarang">Semarang</SelectItem>
                    <SelectItem value="Jakarta">Jakarta</SelectItem>
                    <SelectItem value="Bandung">Bandung</SelectItem>
                    <SelectItem value="Surabaya">Surabaya</SelectItem>
                    <SelectItem value="Malang">Malang</SelectItem>
                    <SelectItem value="Bali">Bali</SelectItem>
                    <SelectItem value="Luar Jawa">Luar Jawa</SelectItem>
                    <SelectItem value="Remote / WFH">Remote / WFH</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
                placeholder="Tulis bio singkat..."
                className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20 resize-none" />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Tahun Lulus</label>
              <input type="number" value={graduationYear} readOnly
                placeholder={graduationYear ? undefined : 'Belum diatur'}
                className="w-full rounded-md border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-500 outline-none cursor-not-allowed" />
              <p className="text-xs text-slate-500">Tahun lulus ditetapkan oleh admin.</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button type="submit" disabled={saving}
              className="rounded-md bg-amikom-purple px-5 py-2.5 text-sm font-medium text-white transition-all active:scale-[0.98] hover:bg-amikom-purple-hover hover:text-amikom-jonquil-warm disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? (
                <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Menyimpan...</>
              ) : 'Simpan Data Diri'}
            </button>
          </div>
        </form>
      </section>

      {/* ── Card 3 · Keamanan Akun ───────────────────────── */}
      <section className="animate-fade-in-up rounded-lg border border-slate-200 bg-white p-6 shadow-sm" style={{ animationDelay: '0.1s' }}>
        <form onSubmit={handlePasswordSubmit}>
          <div className="mb-6">
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Keamanan Akun</p>
            <p className="mt-1 text-xs text-slate-500">Ganti password untuk memperbarui keamanan akun Anda</p>
          </div>
          <div className="space-y-4 lg:max-w-xl">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Password Saat Ini</label>
              <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20" />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Password Baru</label>
              <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20" />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Konfirmasi Password Baru</label>
              <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20" />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button type="submit" disabled={changingPassword}
              className="rounded-md bg-amikom-purple px-5 py-2.5 text-sm font-medium text-white transition-all active:scale-[0.98] hover:bg-amikom-purple-hover hover:text-amikom-jonquil-warm disabled:opacity-50 flex items-center justify-center gap-2">
              {changingPassword ? (
                <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Mengganti...</>
              ) : 'Ganti Password'}
            </button>
          </div>
        </form>
      </section>

        {/* ── Card 4 · Atribut Rekomendasi ─────────────────── */}
        <form onSubmit={handleProfileSubmit}>
        <section className="animate-fade-in-up rounded-lg border border-slate-200 bg-white p-6 shadow-sm" style={{ animationDelay: '0.15s' }}>
          <div className="mb-6">
            <p className="text-[11px] font-mono uppercase tracking-wider text-amikom-purple">Atribut Rekomendasi</p>
            <p className="mt-1 text-xs text-slate-500">Atribut ini dipakai untuk menghitung tingkat kecocokan dengan lowongan kerja.</p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Program Studi</label>
              <select
                value={programStudi}
                onChange={(e) => setProgramStudi(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20"
              >
                <option value="">Pilih program studi...</option>
                {PROGRAM_STUDI.map((program) => (
                  <option key={program} value={program}>{program}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Skill / Keahlian</label>
              <SkillSelector value={skills} onChange={setSkills} />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Sertifikasi Kompetensi</label>
              <CertificationInput value={certifications} onChange={setCertifications} />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Bidang / Posisi Pekerjaan yang Diminati</label>
              <TagInput value={jobInterests} onChange={setJobInterests} placeholder="Contoh: Backend Developer" />
              <div className="flex flex-wrap gap-1.5">
                {JOB_INTERESTS.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => {
                      const selected = jobInterests.split(/[,;]/).map(item => item.trim()).filter(Boolean)
                      if (!selected.some(item => item.toLowerCase() === interest.toLowerCase())) {
                        setJobInterests([...selected, interest].join(', '))
                      }
                    }}
                    className="rounded-full border border-slate-200 px-2.5 py-1 text-[10px] text-slate-600 hover:border-amikom-purple hover:text-amikom-purple"
                  >
                    {interest}
                  </button>
                ))}
              </div>
              </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Preferensi Lokasi Kerja</label>
                <Select value={preferredLocation} onValueChange={setPreferredLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih preferensi lokasi..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {PREFERRED_LOCATIONS.map((preferred) => (
                        <SelectItem key={preferred} value={preferred}>{preferred}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Tipe Pekerjaan yang Diinginkan</label>
                <select value={preferredType} onChange={(e) => setPreferredType(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20">
                  <option value="">Pilih tipe...</option>
                  {JOB_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* ── Simpan Atribut ──────────────────────────────── */}
        <div className="animate-fade-in-up flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between" style={{ animationDelay: '0.25s' }}>
          <p className="text-xs text-slate-500">Perubahan tersimpan menyeluruh untuk atribut rekomendasi.</p>
          <button type="submit" disabled={saving}
            className="rounded-md bg-amikom-purple px-5 py-2.5 text-sm font-medium text-white transition-all active:scale-[0.98] hover:bg-amikom-purple-hover hover:text-amikom-jonquil-warm disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? (
              <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Menyimpan...</>
            ) : 'Simpan Perubahan'}
          </button>
        </div>
      </form>

      {/* ── Card 6 · Pengalaman Kerja (kiri) + Generate CV (kanan) ── */}
      <div className="grid items-start gap-6 lg:grid-cols-3">
        {/* Kiri — Riwayat Pekerjaan */}
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm animate-fade-in-up overflow-hidden lg:col-span-2" style={{ animationDelay: '0.05s' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amikom-purple/10 text-amikom-purple">
                <Briefcase className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Curriculum Vitae</p>
                <p className="text-sm font-semibold text-slate-900">Pengalaman Kerja</p>
                <p className="text-xs text-slate-400">Riwayat pekerjaan dipakai untuk CV sekaligus atribut rekomendasi.</p>
              </div>
            </div>
            <button
              onClick={openAddTr}
              className="flex items-center gap-1.5 rounded-md bg-amikom-purple px-3.5 py-2 text-xs font-semibold text-white transition-all active:scale-[0.98] hover:bg-amikom-purple-hover hover:text-amikom-jonquil-warm"
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah
            </button>
          </div>

        {/* List */}
        <div className="divide-y divide-slate-100">
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Briefcase className="h-8 w-8 text-slate-300 mb-3" />
              <p className="text-sm text-slate-500">Belum ada riwayat kerja</p>
              <p className="text-xs text-slate-400 mt-1">Tambahkan pengalaman kerja untuk melengkapi CV Anda</p>
              <button
                onClick={openAddTr}
                className="mt-4 rounded-md bg-amikom-purple px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-amikom-purple-hover"
              >
                + Tambah Riwayat Kerja
              </button>
            </div>
          ) : (
            records.map((record) => (
              <div key={record.id} className="flex items-start justify-between gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-900">{record.position}</p>
                    {record.is_current && (
                      <span className="inline-flex items-center rounded-md bg-amikom-purple/10 px-2 py-0.5 text-[10px] font-semibold text-amikom-purple font-mono uppercase tracking-wider">
                        Saat Ini
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-amikom-purple font-medium mt-0.5">{record.company}</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {new Date(record.start_date).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                    {' — '}
                    {record.is_current ? 'Sekarang' : record.end_date ? new Date(record.end_date).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : '—'}
                  </p>
                  {record.description && (
                    <p className="mt-1.5 text-xs text-slate-500 leading-relaxed line-clamp-2">{record.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => openEditTr(record)}
                    className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-all hover:border-slate-400 hover:text-slate-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setTrDeleteConfirm(record.id)}
                    className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-500 transition-all hover:bg-red-50 hover:border-red-300"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

        {/* Kanan — Generate CV */}
        <div className="animate-fade-in-up rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1" style={{ animationDelay: '0.1s' }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amikom-purple/10 text-amikom-purple">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="mt-4 text-[11px] font-mono uppercase tracking-wider text-slate-500">Curriculum Vitae</p>
          <h3 className="mt-1 text-base font-semibold text-slate-900">Generate CV</h3>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Susun CV ATS-friendly dari profil, pengalaman kerja, dan data Tracer Study —
            tersedia dalam format PDF Bahasa Indonesia &amp; English.
          </p>
          <div className="mt-5">
            {hasCompletedTracerStudy ? (
              <>
                <button
                  type="button"
                  onClick={() => setCvDialogOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-amikom-purple px-4 py-2.5 text-sm font-medium text-white transition-all active:scale-[0.98] hover:bg-amikom-purple-hover"
                >
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  Preview &amp; Unduh CV
                </button>
                <p className="mt-2 text-[10px] text-slate-400 text-center">
                  Format PDF · ATS-friendly · Bahasa Indonesia &amp; English
                </p>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/tracer-study')}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-amikom-jonquil-warm px-4 py-2.5 text-sm font-medium text-amikom-ink transition-all active:scale-[0.98] hover:brightness-95"
                >
                  Isi Tracer Study Dulu
                </button>
                <p className="mt-2 text-[10px] text-slate-400 text-center">
                  Selesaikan Tracer Study untuk mengaktifkan Generate CV
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Track Record Modal */}
      <Modal
        open={trModal.open}
        onClose={() => setTrModal({ open: false, mode: 'add', record: null })}
        title={trModal.mode === 'add' ? 'Tambah Riwayat Kerja' : 'Edit Riwayat Kerja'}
        description={trModal.mode === 'add' ? 'Tambah Baru' : 'Edit'}
        footer={
          <>
            <button type="button" onClick={() => setTrModal({ open: false, mode: 'add', record: null })}
              className="rounded-md border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition-all hover:border-slate-400 hover:text-slate-900">
              Batal
            </button>
            <button type="submit" disabled={trSubmitting} form="tr-form"
              className="rounded-md bg-amikom-purple px-5 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98] hover:bg-amikom-purple-hover disabled:opacity-50 flex items-center gap-2">
              {trSubmitting ? <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Menyimpan...</> : (trModal.mode === 'add' ? 'Tambah' : 'Simpan')}
            </button>
          </>
        }
      >
        <form id="tr-form" onSubmit={handleTrSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Perusahaan</label>
            <input type="text" required value={trCompany} onChange={(e) => setTrCompany(e.target.value)}
              placeholder="Nama perusahaan"
              className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20" />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Posisi</label>
            <input type="text" required value={trPosition} onChange={(e) => setTrPosition(e.target.value)}
              placeholder="Jabatan atau posisi"
              className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Mulai</label>
              <input type="date" required value={trStartDate} onChange={(e) => setTrStartDate(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20" />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Selesai</label>
              <input type="date" value={trEndDate} onChange={(e) => setTrEndDate(e.target.value)} disabled={trIsCurrent}
                className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20 disabled:bg-slate-100 disabled:cursor-not-allowed" />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={trIsCurrent} onChange={(e) => { setTrIsCurrent(e.target.checked); if (e.target.checked) setTrEndDate('') }}
              className="h-4 w-4 rounded border-slate-300 text-amikom-purple" />
            <span className="text-sm text-slate-600">Saya masih bekerja di sini</span>
          </label>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">Deskripsi</label>
            <textarea value={trDescription} onChange={(e) => setTrDescription(e.target.value)} rows={3}
              placeholder="Deskripsi pekerjaan (opsional)"
              className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20 resize-none" />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <AlertDialog open={!!trDeleteConfirm} onOpenChange={() => setTrDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Riwayat Kerja?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Data riwayat kerja akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleTrDelete} className="bg-red-600 hover:bg-red-700">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CV Preview Dialog */}
      <CVPreviewDialog open={cvDialogOpen} onOpenChange={setCvDialogOpen} />
    </div>
  )
}