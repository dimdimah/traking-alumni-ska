'use client'

import { useState, useEffect, useCallback, useMemo, useDeferredValue } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { resetUserPassword, deleteUser } from '@/lib/actions/alumni'
import { setUserRole, getRoleOptions } from '@/lib/actions/permissions'
import { exportAlumniToExcel } from '@/lib/actions/export'
import { roleLabel } from '@/lib/permissions'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { MoreVertical, Search, UserPlus, Download, Upload } from 'lucide-react'
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
import { PageHeader } from '@/components/ui/page-header'
import { Pagination } from '@/components/ui/pagination'
import AddUserForm from '@/components/admin/add-user-form'
import type { Profile, RoleRow } from '@/types/database'
import { toast } from 'sonner'

const USERS_PER_PAGE = 20

export default function AdminAlumniPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [users, setUsers] = useState<Profile[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [showResetPw, setShowResetPw] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showChangeRole, setShowChangeRole] = useState(false)
  const [roleOptions, setRoleOptions] = useState<RoleRow[]>([])
  const [selectedRole, setSelectedRole] = useState('')
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1)
  const [totalPages, setTotalPages] = useState(1)

  // Opsi role untuk dialog Ubah Role (sekali per sesi)
  useEffect(() => {
    let cancelled = false
    getRoleOptions()
      .then((rows) => { if (!cancelled) setRoleOptions(rows) })
      .catch(() => { /* fallback: hanya opsi dari role yang sudah dimuat */ })
    return () => { cancelled = true }
  }, [])

  const deferredQuery = useDeferredValue(searchQuery)
  const filteredUsers = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    if (!q) return users
    return users.filter(u =>
      u.email.toLowerCase().includes(q) ||
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.nim || '').toLowerCase().includes(q)
    )
  }, [users, deferredQuery])

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const from = (currentPage - 1) * USERS_PER_PAGE
      const to = from + USERS_PER_PAGE - 1

      const { data, count } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, nim, phone, graduation_year, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (data) {
        setUsers(data as Profile[])
        setTotalUsers(count || 0)
        setTotalPages(Math.ceil((count || 0) / USERS_PER_PAGE))
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [currentPage])

  useEffect(() => {
    if (searchQuery) {
      setCurrentPage(1)
    }
  }, [searchQuery])

  // Sync search + page ke URL — debounce 300ms agar tidak replace tiap keystroke
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams()
      if (searchQuery) params.set('q', searchQuery)
      if (currentPage > 1) params.set('page', String(currentPage))
      const qs = params.toString()
      router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false })
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, currentPage])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  async function handleResetPassword() {
    if (!selectedUser || !newPassword) return
    setActionLoading(true)
    try {
      await resetUserPassword(selectedUser.id, newPassword)
      toast.success(`Password ${selectedUser.email} berhasil direset`)
      setShowResetPw(false)
      setNewPassword('')
      setSelectedUser(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal reset password')
    } finally {
      setActionLoading(false)
    }
  }

  function confirmDeleteUser() {
    if (!selectedUser) return
    setDeleteConfirm(true)
  }

  function openChangeRole() {
    if (!selectedUser) return
    setSelectedRole(selectedUser.role)
    setShowChangeRole(true)
  }

  async function handleChangeRole() {
    if (!selectedUser || !selectedRole) return
    setActionLoading(true)
    try {
      await setUserRole(selectedUser.id, selectedRole)
      toast.success(`Role ${selectedUser.email} → ${roleLabel(selectedRole)}`)
      setShowChangeRole(false)
      setSelectedUser(null)
      loadUsers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengubah role')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDelete() {
    if (!selectedUser) return
    setActionLoading(true)
    try {
      await deleteUser(selectedUser.id)
      toast.success(`Akun ${selectedUser.email} berhasil dihapus`)
      setSelectedUser(null)
      setDeleteConfirm(false)
      loadUsers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus akun')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        icon={<span className="text-[11px]">◆</span>}
        label="Manajemen Alumni"
        title="Manajemen Alumni."
        subtitle="Kelola akun alumni, reset password, dan hapus akun."
      />

      {/* Stats + Search + Add */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <div className="text-sm text-slate-600 font-mono">
          <span className="text-slate-900 font-medium">{totalUsers}</span> total akun
          {!loading && totalPages > 1 && (
            <span className="text-slate-400 ml-2">(Halaman {currentPage}/{totalPages})</span>
          )}
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari email, nama, atau NIM..."
              className="w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20" />
          </div>
          <button
            onClick={async () => {
              try {
                const base64 = await exportAlumniToExcel()
                const binaryString = atob(base64)
                const bytes = new Uint8Array(binaryString.length)
                for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i)
                const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `data-alumni-${new Date().toISOString().split('T')[0]}.xlsx`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
              } catch {
                toast.error('Gagal mengekspor data alumni')
              }
            }}
            className="rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all active:scale-[0.98] hover:border-slate-300 hover:text-slate-900 flex items-center gap-2 whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </button>
          <a
            href="/admin/bulk-import"
            className="rounded-md border border-amikom-purple/30 bg-amikom-purple/5 px-4 py-2.5 text-sm font-semibold text-amikom-purple transition-all active:scale-[0.98] hover:bg-amikom-purple/10 flex items-center gap-2 whitespace-nowrap"
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </a>
          <button
            onClick={() => setShowAddDialog(true)}
            className="rounded-md bg-amikom-purple px-4 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98] hover:bg-amikom-purple-hover hover:text-amikom-jonquil-warm flex items-center gap-2 whitespace-nowrap"
          >
            <UserPlus className="h-4 w-4" />
            Tambahkan Alumni
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-amikom-purple border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100">
                  <th className="px-6 py-3.5 text-left text-[10px] font-semibold font-mono uppercase tracking-wider text-slate-500">Email</th>
                  <th className="px-6 py-3.5 text-left text-[10px] font-semibold font-mono uppercase tracking-wider text-slate-500">Nama</th>
                  <th className="px-6 py-3.5 text-left text-[10px] font-semibold font-mono uppercase tracking-wider text-slate-500">NIM</th>
                  <th className="px-6 py-3.5 text-left text-[10px] font-semibold font-mono uppercase tracking-wider text-slate-500">Tahun Lulus</th>
                  <th className="px-6 py-3.5 text-left text-[10px] font-semibold font-mono uppercase tracking-wider text-slate-500">Role</th>
                  <th className="px-6 py-3.5 text-left text-[10px] font-semibold font-mono uppercase tracking-wider text-slate-500">Bergabung</th>
                  <th className="px-6 py-3.5 text-center text-[10px] font-semibold font-mono uppercase tracking-wider text-slate-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                  <tr key={user.id} className="transition-colors duration-200 hover:bg-slate-50">
                    <td className="px-6 py-4"><p className="text-sm font-medium text-slate-900">{user.email}</p></td>
                    <td className="px-6 py-4"><p className="text-sm text-slate-600">{user.full_name || '—'}</p></td>
                    <td className="px-6 py-4"><p className="text-sm text-slate-600 font-mono">{user.nim || '—'}</p></td>
                    <td className="px-6 py-4"><p className="text-sm text-slate-600">{user.graduation_year || '—'}</p></td>
                    <td className="px-6 py-4">
                      <Badge variant={user.role === 'super_user' ? 'default' : 'secondary'}>
                        {roleLabel(user.role)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-500">
                        {new Date(user.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedUser(user)}
                        aria-label={`Aksi untuk ${user.email}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <span className="text-2xl text-slate-500">◆</span>
                        <p className="text-sm text-slate-500">{searchQuery ? 'Tidak ada hasil' : 'Belum ada pengguna'}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}

      {/* Action Modal */}
      <Modal
        open={!!selectedUser && !showResetPw}
        onClose={() => setSelectedUser(null)}
        title={selectedUser?.email}
        description="Aksi"
      >
        <div className="space-y-3">
          <button onClick={openChangeRole}
            className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 text-left transition-all hover:border-slate-400 hover:bg-slate-50">
            Ubah Role
          </button>
          <button onClick={() => { setShowResetPw(true); setNewPassword('') }}
            className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 text-left transition-all hover:border-slate-400 hover:bg-slate-50">
            Reset Password
          </button>
          <button onClick={confirmDeleteUser}
            className="w-full rounded-md border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-600 text-left transition-all hover:bg-red-50 hover:border-red-300">
            Hapus Akun
          </button>
        </div>
      </Modal>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah User Baru</DialogTitle>
            <DialogDescription>
              Buat akun user baru. User akan langsung aktif tanpa verifikasi email.
            </DialogDescription>
          </DialogHeader>
          <AddUserForm onSuccess={() => { setShowAddDialog(false); loadUsers() }} />
        </DialogContent>
      </Dialog>

      {/* Ubah Role Modal */}
      <Modal
        open={showChangeRole}
        onClose={() => setShowChangeRole(false)}
        title="Ubah Role"
        footer={
          <>
            <button onClick={() => setShowChangeRole(false)}
              className="rounded-md border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition-all hover:border-slate-400 hover:text-slate-900">
              Batal
            </button>
            <button onClick={handleChangeRole} disabled={actionLoading || !selectedRole}
              className="rounded-md bg-amikom-purple px-5 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98] hover:bg-amikom-purple-hover hover:text-amikom-jonquil-warm disabled:opacity-50">
              {actionLoading ? 'Menyimpan...' : 'Simpan Role'}
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600 mb-4">
          Pilih role untuk <strong>{selectedUser?.email}</strong>. Permission mengikuti role
          (lihat tab Role &amp; Akses). Tidak bisa mengubah role sendiri.
        </p>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20"
        >
          {roleOptions.length === 0 && <option value="">Memuat role…</option>}
          {roleOptions.map((r) => (
            <option key={r.name} value={r.name}>
              {roleLabel(r.name)}
              {r.description ? ` — ${r.description}` : ''}
            </option>
          ))}
        </select>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        open={showResetPw}
        onClose={() => { setShowResetPw(false); setSelectedUser(null) }}
        title="Reset Password"
        footer={
          <>
            <button onClick={() => { setShowResetPw(false); setSelectedUser(null) }}
              className="rounded-md border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition-all hover:border-slate-400 hover:text-slate-900">
              Batal
            </button>
            <button onClick={handleResetPassword} disabled={actionLoading || newPassword.length < 6}
              className="rounded-md bg-amikom-purple px-5 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98] hover:bg-amikom-purple-hover hover:text-amikom-jonquil-warm disabled:opacity-50">
              {actionLoading ? 'Menyimpan...' : 'Reset Password'}
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600 mb-4">
          Masukkan password baru untuk <strong>{selectedUser?.email}</strong>
        </p>
        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Password baru (min. 6 karakter)" minLength={6}
          className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20" />
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Akun Alumni?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Akun <strong>{selectedUser?.email}</strong> dan semua data terkait akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={actionLoading} className="bg-red-600 hover:bg-red-700">
              {actionLoading ? 'Menghapus...' : 'Hapus Akun'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
