'use client'

import { Badge } from '@/components/ui/badge'
import { MoreVertical } from 'lucide-react'
import { Pagination } from '@/components/ui/pagination'
import type { Profile } from '@/types/database'

interface UsersDataTableProps {
  users: Profile[]
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
}

export function UsersDataTable({ users, currentPage = 1, totalPages = 1, onPageChange }: UsersDataTableProps) {
  const hasPagination = totalPages > 1 && onPageChange

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100">
              <th className="px-6 py-3.5 text-left text-[10px] font-semibold font-mono uppercase tracking-wider text-slate-500">
                Email
              </th>
              <th className="px-6 py-3.5 text-left text-[10px] font-semibold font-mono uppercase tracking-wider text-slate-500">
                Name
              </th>
              <th className="px-6 py-3.5 text-left text-[10px] font-semibold font-mono uppercase tracking-wider text-slate-500">
                Role
              </th>
              <th className="px-6 py-3.5 text-left text-[10px] font-semibold font-mono uppercase tracking-wider text-slate-500">
                Joined
              </th>
              <th className="px-6 py-3.5 text-center text-[10px] font-semibold font-mono uppercase tracking-wider text-slate-500">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users && users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id} className="transition-colors duration-200 hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-900">{user.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">{user.full_name || '—'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={user.role === 'super_user' ? 'default' : 'secondary'}
                    >
                      {user.role === 'super_user' ? 'Super User' : 'User'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-500">
                      {new Date(user.created_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white hover:text-slate-600"
                      aria-label={`Aksi untuk ${user.email}`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-2xl text-slate-500">◆</span>
                    <p className="text-sm text-slate-500">No users found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {hasPagination && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
      )}
    </div>
  )
}