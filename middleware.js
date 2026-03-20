import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnDashboard = req.nextUrl.pathname.startsWith('/dashboard')
  const isOnLogin = req.nextUrl.pathname === '/login'
  const isPublicRsvp = req.nextUrl.pathname.startsWith('/rsvp/')
  const isApi = req.nextUrl.pathname.startsWith('/api')

  // Allow public routes and API
  if (isPublicRsvp || isApi || req.nextUrl.pathname === '/') {
    return NextResponse.next()
  }

  // Redirect logged-in users from login to dashboard
  if (isOnLogin && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
  }

  // Protect dashboard routes
  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}