import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Public paths - bularni tekshirmasdan o'tkazib yubor
  if (
    pathname.startsWith('/api/webhook') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  // Login API ni ham o'tkazib yubor
  if (pathname === '/api/auth/login') {
    return NextResponse.next()
  }

  // Admin sahifalarini tekshir
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