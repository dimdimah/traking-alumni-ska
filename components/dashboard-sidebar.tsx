'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { logout } from '@/lib/auth-actions'
import { isActiveLink } from '@/lib/utils'
import { ADMIN_ACTIONS } from '@/lib/permissions'
import type { Profile } from '@/types/database'
import {
  Home, ClipboardList, Search, User,
  Users, LogOut, ChevronLeft, X, ChevronRight, Network, FileText, ChevronDown,
  Briefcase, Newspaper, Award, HelpCircle, ShieldCheck
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface SidebarProps {
  profile: Profile | null
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
  /** Permission role user (dari getMyPermissions). null = tanpa filter (fail-open). */
  allowedActions?: string[] | null
}

const sidebarWidth = 240
const sidebarCollapsedWidth = 64

const iconClass = 'h-[18px] w-[18px] shrink-0'
const childIconClass = 'h-[16px] w-[16px] shrink-0'

type NavChild = { href: string; label: string; icon?: ReactNode; action?: string }
type NavItem = {
  href?: string
  label: string
  icon: ReactNode
  action?: string
  children?: NavChild[]
}

const userNav: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <Home className={iconClass} /> },
  { href: '/dashboard/tracer-study', label: 'Tracer Study', icon: <ClipboardList className={iconClass} /> },
  { href: '/dashboard/career', label: 'Lowongan Kerja', icon: <Search className={iconClass} /> },
  { href: '/dashboard/network', label: 'Jaringan Alumni', icon: <Network className={iconClass} /> },
  { href: '/dashboard/profile', label: 'Profil', icon: <User className={iconClass} /> },
]

const adminNav: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: <Home className={iconClass} /> },
  { href: '/admin/alumni', label: 'Manajemen Alumni', icon: <Users className={iconClass} />, action: 'alumni.manage' },
  { href: '/admin/kuesioner', label: 'Tracer Study', icon: <ClipboardList className={iconClass} />, action: 'question.manage' },
  // { href: '/admin/survey-perusahaan', label: 'Survey Perusahaan', icon: <Building2 className={iconClass} />, action: 'survey.view' },
  // { href: '/admin/roles', label: 'Role & Akses', icon: <ShieldCheck className={iconClass} />, action: 'role.manage' },
  {
    href: '/admin/content',
    label: 'Manajemen Konten',
    icon: <FileText className={iconClass} />,
    action: 'content.manage',
    children: [
      { href: '/admin/career-center', label: 'Lowongan Kerja', icon: <Briefcase className={childIconClass} />, action: 'job.manage' },
      { href: '/admin/content/berita', label: 'Berita', icon: <Newspaper className={childIconClass} />, action: 'content.manage' },
      { href: '/admin/content/sertifikasi', label: 'Sertifikasi', icon: <Award className={childIconClass} />, action: 'content.manage' },
      { href: '/admin/content/faq', label: 'FAQ', icon: <HelpCircle className={childIconClass} />, action: 'content.manage' },
    ]
  },
]

function filterNavChildren(items: NavChild[], allowed: string[]): NavChild[] {
  return items.filter((item) => !item.action || allowed.includes(item.action))
}

function filterNavByActions(
  items: NavItem[],
  allowed: string[] | null | undefined
): NavItem[] {
  // Fail-open: null/undefined (belum terload / error) → tampilkan semua
  if (!allowed) return items

  const out: NavItem[] = []
  for (const item of items) {
    const itemAllowed = !item.action || allowed.includes(item.action)
    if (item.children) {
      const children = filterNavChildren(item.children, allowed)
      if (children.length > 0) {
        out.push({ ...item, children })
      } else if (itemAllowed) {
        out.push(item)
      }
      // children habis & parent tak punya akses → sembunyikan parent
    } else if (itemAllowed) {
      out.push(item)
    }
  }
  return out
}

const ADMIN_NAV_ACTIONS: readonly string[] = ADMIN_ACTIONS

export default function DashboardSidebar({ profile, collapsed, onToggle, mobileOpen, onMobileClose, allowedActions }: SidebarProps) {
  const pathname = usePathname()
  const isSuperUser = profile?.role === 'super_user'
  // Nav admin tampil untuk super_user, atau role lain yang punya minimal 1 permission admin.
  // Role 'user' murni (hanya permission milik sendiri) → userNav seperti biasa.
  const hasAdminAccess =
    isSuperUser ||
    (allowedActions !== null && allowedActions !== undefined &&
      allowedActions.some((a) => ADMIN_NAV_ACTIONS.includes(a)))
  const navItems = hasAdminAccess
    ? filterNavByActions(adminNav, allowedActions)
    : userNav

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/20 md:hidden"
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar (sheet) */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -sidebarWidth }}
            animate={{ x: 0 }}
            exit={{ x: -sidebarWidth }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 z-50 h-full bg-white md:hidden"
            style={{ width: sidebarWidth }}
          >
            <SidebarContent
              navItems={navItems}
              pathname={pathname}
              profile={profile}
              collapsed={false}
              onToggle={() => {}}
              onClose={onMobileClose}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? sidebarCollapsedWidth : sidebarWidth }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="hidden md:block fixed left-0 top-0 z-30 h-full border-r border-amikom-hairline bg-white"
      >
        <SidebarContent
          navItems={navItems}
          pathname={pathname}
          profile={profile}
          collapsed={collapsed}
          onToggle={onToggle}
          onClose={() => {}}
        />
      </motion.aside>
    </>
  )
}

function SidebarContent({
  navItems, pathname, profile, collapsed, onToggle, onClose,
}: {
  navItems: NavItem[]
  pathname: string
  profile: Profile | null
  collapsed: boolean
  onToggle: () => void
  onClose: () => void
}) {
  const initials = profile?.email?.charAt(0).toUpperCase() || '?'

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center justify-between border-b border-amikom-hairline px-4">
        <Link href={profile?.role === 'super_user' ? '/admin' : '/dashboard'} className="flex items-center gap-2.5 overflow-hidden">
          <Image
            src="/logo-amikom-surakarta-1.png"
            alt="Logo STMIK AMIKOM Surakarta"
            width={28}
            height={28}
            className="h-7 w-auto shrink-0"
          />
          <motion.span
            animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }}
            className="font-sans text-sm font-semibold tracking-[-0.02em] text-amikom-ink whitespace-nowrap"
          >
            UNIKOM
          </motion.span>
        </Link>
        {/* Mobile close */}
        <button
          onClick={onClose}
          className="md:hidden h-8 w-8 flex items-center justify-center rounded-md text-amikom-ink/60 hover:bg-amikom-parchment hover:text-amikom-ink transition-colors"
          aria-label="Tutup sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navItems.map((item) => {
          if (item.children) {
            return (
              <CollapsibleNavItem
                key={item.label}
                item={item as NavItem & { children: NavChild[] }}
                pathname={pathname}
                collapsed={collapsed}
                onClose={onClose}
              />
            )
          }

          const active = isActiveLink(pathname, item.href!)
          return (
            <Link
              key={item.href}
              href={item.href!}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-amikom-purple/10 text-amikom-purple'
                  : 'text-amikom-ink/60 hover:bg-amikom-parchment hover:text-amikom-ink'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <span className="shrink-0 flex items-center">{item.icon}</span>
              <motion.span
                animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }}
                className="whitespace-nowrap overflow-hidden"
              >
                {item.label}
              </motion.span>
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-amikom-hairline p-3 space-y-1">
        {/* Collapse toggle (desktop only) */}
        <button
          onClick={onToggle}
          className="hidden md:flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-amikom-ink/40 hover:text-amikom-ink hover:bg-amikom-parchment transition-colors overflow-hidden"
          aria-label={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
        >
          <ChevronLeft className={`h-4 w-4 shrink-0 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          <motion.span
            animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }}
            className="whitespace-nowrap overflow-hidden"
          >
            Ciutkan
          </motion.span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg px-1 py-2 transition-colors hover:bg-amikom-parchment text-left overflow-hidden">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amikom-purple text-amikom-jonquil-warm text-xs font-semibold">
                {initials}
              </span>
              <motion.div
                animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }}
                className="overflow-hidden flex items-center gap-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amikom-ink truncate">{profile?.full_name || profile?.email || 'Pengguna'}</p>
                  <p className="text-[11px] text-amikom-ink/40 truncate">{profile?.email || ''}</p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-amikom-ink/20" />
              </motion.div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile" onClick={onClose}>
                <User className="h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()} className="text-red-600 focus:text-red-600 focus:bg-red-50">
              <LogOut className="h-4 w-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

function CollapsibleNavItem({
  item, pathname, collapsed, onClose
}: {
  item: NavItem & { children: NavChild[] }
  pathname: string
  collapsed: boolean
  onClose: () => void
}) {
  const isActive = item.children.some(child => isActiveLink(pathname, child.href)) || (item.href ? isActiveLink(pathname, item.href) : false)
  const [isOpen, setIsOpen] = useState(isActive)
  const router = useRouter()
  
  return (
    <div className="space-y-1">
      <button
        onClick={() => {
          if (item.href) {
            router.push(item.href)
            if (window.innerWidth < 768) {
              onClose()
            }
          }
          setIsOpen(!isOpen)
        }}
        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'text-amikom-purple'
            : 'text-amikom-ink/60 hover:bg-amikom-parchment hover:text-amikom-ink'
        }`}
        title={collapsed ? item.label : undefined}
      >
        <div className="flex items-center gap-3">
          <span className="shrink-0 flex items-center">{item.icon}</span>
          <motion.span
            animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }}
            className="whitespace-nowrap overflow-hidden"
          >
            {item.label}
          </motion.span>
        </div>
        {!collapsed && (
          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>
      <AnimatePresence>
        {isOpen && !collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden pl-10 pr-2 space-y-1"
          >
            {item.children.map(child => {
              const childActive = isActiveLink(pathname, child.href)
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                    childActive
                      ? 'bg-amikom-purple/10 text-amikom-purple font-medium'
                      : 'text-amikom-ink/60 hover:text-amikom-ink hover:bg-amikom-parchment'
                  }`}
                >
                  {child.icon && <span>{child.icon}</span>}
                  {child.label}
                </Link>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
