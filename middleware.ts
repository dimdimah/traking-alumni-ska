import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse } = await createMiddlewareClient(request)
  const { pathname } = request.nextUrl

  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/super-user') ||
    pathname.startsWith('/user') ||
    pathname.startsWith('/admin')
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/sign-up')
  const needsRoleCheck = isAuthRoute || pathname.startsWith('/super-user') || pathname.startsWith('/admin')

  // Fast-path: public routes (landing, berita, sertifikasi, kisah-sukses, _next, api) tanpa auth
  if (!isProtectedRoute && !needsRoleCheck) {
    return supabaseResponse
  }

  // Hanya untuk protected/auth/admin: lakukan sekali getUser (validasi JWT via Supabase)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user && needsRoleCheck) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = (profile as { role: string } | null)?.role

    if (isAuthRoute) {
      const redirectTo = role === 'super_user' ? '/admin' : '/dashboard'
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }

    if (pathname.startsWith('/super-user')) {
      // /admin TIDAK digate role di sini — RoleGuard berbasis permission
      // (app/(protected)/admin/layout.tsx) yang menentukan, agar role custom
      // dengan permission admin bisa masuk tanpa sync daftar permission di edge.
      if (role !== 'super_user') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_next/data|api|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
