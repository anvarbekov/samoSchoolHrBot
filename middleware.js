// middleware.js
import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Public paths
  if (
    pathname.startsWith('/api/webhook') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  // Check admin auth
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/')) {
    const session = request.cookies.get('admin_session')?.value
    const secret = process.env.NEXTAUTH_SECRET

    if (!session || session !== secret) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
