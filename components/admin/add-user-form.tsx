'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addUser } from '@/lib/actions/alumni'

export default function AddUserForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'user' | 'super_user'>('user')
  const [graduationYear, setGraduationYear] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await addUser(email, password, name, graduationYear || null)

      if (!result.success) {
        setError(result.error || 'Gagal menambah user')
        return
      }

      setSuccess(true)
      setName('')
      setEmail('')
      setPassword('')
      setRole('user')
      setGraduationYear('')

      setTimeout(() => {
        if (onSuccess) {
          onSuccess()
        } else {
          router.push('/admin/alumni')
        }
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4">
          <span className="mt-0.5 text-red-500 text-sm flex-shrink-0">⚠</span>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-md border border-green-200 bg-green-50 p-4">
          <span className="mt-0.5 text-green-600 text-sm flex-shrink-0">✓</span>
          <div>
            <p className="text-sm font-medium text-green-800">User berhasil ditambahkan</p>
            <p className="mt-0.5 text-xs text-green-600">Mengalihkan ke halaman alumni...</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">
            Nama Lengkap
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama lengkap"
            className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@amikomsolo.ac.id"
            className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20"
          />
          <p className="text-[10px] text-slate-500 mt-1">Harus menggunakan domain @amikomsolo.ac.id</p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 8 karakter (huruf besar, kecil, angka)"
            minLength={8}
            className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'user' | 'super_user')}
            className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20"
          >
            <option value="user">User</option>
            <option value="super_user">Super User</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-600 font-mono uppercase tracking-wider">
            Tahun Lulus
          </label>
          <input
            type="number"
            value={graduationYear}
            onChange={(e) => setGraduationYear(e.target.value)}
            placeholder="Contoh: 2024"
            min={1990}
            max={2030}
            className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-amikom-purple focus:ring-2 focus:ring-amikom-purple/20"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-amikom-purple px-4 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98] hover:bg-amikom-purple-hover hover:text-amikom-jonquil-warm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Menambahkan...
          </>
        ) : (
          'Tambah User'
        )}
      </button>
    </form>
  )
}
