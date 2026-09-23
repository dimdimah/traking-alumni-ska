'use client'

// Halaman /admin/roles — kelola role & matrix role × permission (phase 3).
// super_user dikunci penuh; role lain bisa di-toggle per permission.
// Role custom bisa dibuat/dihapus (kecuali role bawaan yang is_locked).
import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  getPermissionMatrix,
  updateRolePermissions,
  createRole,
  deleteRole,
  type PermissionMatrix,
} from '@/lib/actions/permissions'
import { roleLabel, isValidRoleName, IMMUTABLE_PERMISSION_ROLES } from '@/lib/permissions'
import type { RoleRow } from '@/types/database'
import { toast } from 'sonner'
import { ShieldCheck, Lock, RefreshCw, Save, Loader2, Plus, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
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

type DraftState = Record<string, string[]>

export default function AdminRolesPage() {
  const [matrix, setMatrix] = useState<PermissionMatrix | null>(null)
  const [draft, setDraft] = useState<DraftState>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // State: tambah role
  const [showCreate, setShowCreate] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleDesc, setNewRoleDesc] = useState('')
  const [creating, setCreating] = useState(false)

  // State: hapus role
  const [deleteTarget, setDeleteTarget] = useState<RoleRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const m = await getPermissionMatrix()
      setMatrix(m)
      const initial: DraftState = {}
      for (const r of m.roles) initial[r.name] = [...(m.roleActions[r.name] || [])]
      setDraft(initial)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat matrix permission')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function toggle(role: string, action: string) {
    if (IMMUTABLE_PERMISSION_ROLES.includes(role)) return
    setDraft((prev) => {
      const current = prev[role] || []
      const next = current.includes(action)
        ? current.filter((a) => a !== action)
        : [...current, action]
      return { ...prev, [role]: next }
    })
  }

  const editableRoles = (matrix?.roles || []).filter((r) => !IMMUTABLE_PERMISSION_ROLES.includes(r.name))
  const isDirty = editableRoles.some((r) => {
    const before = [...(matrix?.roleActions[r.name] || [])].sort().join(',')
    const after = [...(draft[r.name] || [])].sort().join(',')
    return before !== after
  })

  async function handleSave() {
    if (!matrix || !isDirty) return
    setSaving(true)
    try {
      const changed = editableRoles.filter((r) => {
        const before = [...(matrix.roleActions[r.name] || [])].sort().join(',')
        const after = [...(draft[r.name] || [])].sort().join(',')
        return before !== after
      })
      for (const r of changed) {
        await updateRolePermissions(r.name, draft[r.name] || [])
      }
      toast.success(`Permission role ${changed.map((r) => roleLabel(r.name)).join(', ')} berhasil disimpan`)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan perubahan')
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    if (!matrix) return
    const initial: DraftState = {}
    for (const r of matrix.roles) initial[r.name] = [...(matrix.roleActions[r.name] || [])]
    setDraft(initial)
  }

  async function handleCreateRole() {
    const name = newRoleName.trim().toLowerCase()
    if (!isValidRoleName(name)) {
      toast.error('Nama role: huruf kecil/angka/underscore, 2–31 karakter, diawali huruf')
      return
    }
    setCreating(true)
    try {
      await createRole(name, newRoleDesc)
      toast.success(`Role "${name}" dibuat — sekarang centang permissionnya di matrix`)
      setShowCreate(false)
      setNewRoleName('')
      setNewRoleDesc('')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal membuat role')
    } finally {
      setCreating(false)
    }
  }

  async function handleDeleteRole() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteRole(deleteTarget.name)
      toast.success(`Role "${deleteTarget.name}" dihapus`)
      setDeleteTarget(null)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus role')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader
          icon={<span className="text-[11px]">◆</span>}
          label="Admin Panel"
          title="Role & Akses."
          subtitle="Matrix izin per role — siapa bisa apa."
        />
        <div className="rounded-lg border border-slate-200 bg-white p-16 shadow-sm flex items-center justify-center gap-2 text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Memuat matrix permission…
        </div>
      </div>
    )
  }

  if (!matrix) {
    return (
      <div className="space-y-8">
        <PageHeader
          icon={<span className="text-[11px]">◆</span>}
          label="Admin Panel"
          title="Role & Akses."
          subtitle="Matrix izin per role — siapa bisa apa."
        />
        <div className="rounded-lg border border-slate-200 bg-white p-16 shadow-sm text-center text-slate-500">
          Gagal memuat data permission.
        </div>
      </div>
    )
  }

  const roles = matrix.roles

  return (
    <div className="space-y-8">
      <PageHeader
        icon={<span className="text-[11px]">◆</span>}
        label="Admin Panel"
        title="Role & Akses."
        subtitle="Buat role, atur permissionnya, lalu tugaskan user di Manajemen Alumni."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCreate(true)} disabled={saving}>
              <Plus className="h-4 w-4" />
              Tambah Role
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset} disabled={!isDirty || saving}>
              <RefreshCw className="h-4 w-4" />
              Reset
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!isDirty || saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan Perubahan
            </Button>
          </div>
        }
      />

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 animate-fade-in-up" style={{ animationDelay: '0.03s' }}>
        <span className="inline-flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5" /> Super User — permission dikunci selalu penuh
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" /> Centang = role tersebut boleh melakukan aksi
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Trash2 className="h-3.5 w-3.5" /> Ikon hapus = role custom (bawaan dikunci)
        </span>
      </div>

      {/* Matrix table */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-x-auto animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left px-5 py-3.5 font-mono text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                Permission
              </th>
              {roles.map((r) => {
                const permLocked = IMMUTABLE_PERMISSION_ROLES.includes(r.name)
                return (
                  <th key={r.name} className="px-5 py-3.5 text-center w-40">
                    <div className="flex items-center justify-center gap-1.5">
                      <span
                        className="font-mono text-[10px] uppercase tracking-wider text-slate-600 font-medium"
                        title={r.description || undefined}
                      >
                        {roleLabel(r.name)}
                      </span>
                      {permLocked && <Lock className="h-3 w-3 text-slate-400" aria-label="Permission dikunci" />}
                      {!r.is_locked && (
                        <button
                          onClick={() => setDeleteTarget(r)}
                          disabled={saving}
                          className="rounded p-0.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          aria-label={`Hapus role ${r.name}`}
                          title="Hapus role"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    {r.description && (
                      <p className="mt-0.5 text-[9px] font-sans font-normal text-slate-400 normal-case leading-tight">
                        {r.description}
                      </p>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {matrix.permissions.map((perm, i) => (
              <tr key={perm.id} className={`border-b border-slate-100 last:border-0 ${i % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                <td className="px-5 py-3">
                  <p className="font-mono text-[11px] text-amikom-purple">{perm.action}</p>
                  {perm.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{perm.description}</p>
                  )}
                </td>
                {roles.map((r) => {
                  const isPermLocked = IMMUTABLE_PERMISSION_ROLES.includes(r.name)
                  const checked = isPermLocked
                    ? true
                    : (draft[r.name] || []).includes(perm.action)
                  return (
                    <td key={r.name} className="px-5 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={isPermLocked || saving}
                        onChange={() => toggle(r.name, perm.action)}
                        aria-label={`${perm.action} untuk role ${r.name}`}
                        className="h-4 w-4 rounded border-slate-300 accent-amikom-purple cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 animate-fade-in-up" style={{ animationDelay: '0.08s' }}>
        <Badge variant="outline" className="font-mono">{matrix.permissions.length} permission</Badge>
        <Badge variant="outline" className="font-mono">{roles.length} role</Badge>
        <Badge variant="outline" className="font-mono">{editableRoles.length} role dapat diubah</Badge>
        <span>Perubahan langsung aktif untuk guard server action (cache ≤ 5 menit).</span>
      </div>

      {/* Dialog: Tambah Role */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Role Baru</DialogTitle>
            <DialogDescription>
              Role baru lahir tanpa permission — centang dulu di matrix sebelum ditugaskan ke user.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">
                Nama Role
              </label>
              <input
                type="text"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value.toLowerCase())}
                placeholder="mis. humas_staff"
                maxLength={31}
                className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20 font-mono"
              />
              <p className="text-[10px] text-slate-500">Huruf kecil, angka, underscore — diawali huruf (mis. humas_staff)</p>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">
                Deskripsi
              </label>
              <input
                type="text"
                value={newRoleDesc}
                onChange={(e) => setNewRoleDesc(e.target.value)}
                placeholder="mis. Pengelola konten publikasi"
                maxLength={120}
                className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)} disabled={creating}>
                Batal
              </Button>
              <Button size="sm" onClick={handleCreateRole} disabled={creating || !newRoleName.trim()}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Buat Role
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Konfirmasi: Hapus Role */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus role {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Mapping permission role ini ikut terhapus. Role hanya bisa dihapus jika belum dipakai user mana pun.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRole} disabled={deleting} className="bg-red-600 hover:bg-red-700">
              {deleting ? 'Menghapus...' : 'Hapus Role'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
