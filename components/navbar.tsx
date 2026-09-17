'use client'

import Link from 'next/link'
import Image from 'next/image'
import { logout } from '@/lib/auth-actions'
import type { Profile } from '@/types/database'
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from '@/components/ui/menubar'
import LogoutButton from '@/components/logout-button'
import DashboardBreadcrumb from '@/components/dashboard-breadcrumb'
import { Menu } from 'lucide-react'

interface NavbarProps {
  profile: Profile | null
  onSidebarToggle: () => void
  sidebarCollapsed: boolean
}

export default function Navbar({ profile, onSidebarToggle, sidebarCollapsed }: NavbarProps) {
  const initals = profile?.email?.charAt(0).toUpperCase() || '?'

  return (
    <nav className="sticky top-0 left-0 right-0 z-20 h-14 border-b border-amikom-hairline bg-white md:bg-white md:backdrop-blur-md">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          {/* Mobile: hamburger — buka sidebar overlay */}
          <button
            onClick={onSidebarToggle}
            className="flex h-8 w-8 items-center justify-center rounded-md text-amikom-ink/40 hover:bg-amikom-parchment hover:text-amikom-ink transition-colors md:hidden"
            aria-label="Buka menu navigasi"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Image
            src="/logo-amikom-surakarta-1.png"
            alt="Logo STMIK AMIKOM Surakarta"
            width={28}
            height={28}
            className="h-7 w-auto md:hidden"
          />

          {/* Desktop breadcrumb */}
          <div className="hidden md:block">
            <DashboardBreadcrumb />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Menubar className="border-none bg-transparent p-0">
            <MenubarMenu>
              <MenubarTrigger
                aria-label={`Menu pengguna: ${profile?.full_name || profile?.email || 'Pengguna'}`}
                className="rounded-md focus:bg-amikom-parchment focus:text-amikom-ink data-[state=open]:bg-amikom-parchment data-[state=open]:text-amikom-ink">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amikom-purple text-amikom-jonquil-warm text-sm font-semibold">
                  {initals}
                </div>
              </MenubarTrigger>
              <MenubarContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-amikom-ink truncate">
                    {profile?.full_name || profile?.email || 'Pengguna'}
                  </p>
                </div>
                <MenubarSeparator />
                <MenubarItem asChild>
                  <Link href="/dashboard/profile">Profile</Link>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem
                  className="text-amikom-danger focus:bg-amikom-danger-bg focus:text-amikom-danger"
                  onClick={() => logout()}
                >
                  <LogoutButton />
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>
      </div>
    </nav>
  )
}
