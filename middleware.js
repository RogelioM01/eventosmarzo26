import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const userRole = req.auth?.user?.role
  const pathname = req.nextUrl.pathname

  const isOnDashboard = pathname.startsWith('/dashboard')
  const isOnAdmin = pathname.startsWith('/admin')
  const isOnLogin = pathname === '/login'
  const isPublicRsvp = pathname.startsWith('/rsvp/')
  const isApi = pathname.startsWith('/api')

  // Allow public routes and API
  if (isPublicRsvp || isApi || pathname === '/') {
    return NextResponse.next()
  }

  // Redirect logged-in users from login based on role
  if (isOnLogin && isLoggedIn) {
    const redirectUrl = userRole === 'admin' ? '/admin' : '/dashboard'
    return NextResponse.redirect(new URL(redirectUrl, req.nextUrl))
  }

  // Protect dashboard routes (for hosts)
  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  // Protect admin routes
  if (isOnAdmin && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  // Redirect non-admins away from admin panel
  if (isOnAdmin && isLoggedIn && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}

export const runtime = 'nodejs'