import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request) {
  try {
    const { username, password } = await request.json()

    console.log('Login attempt:', username)
    console.log('Expected:', process.env.ADMIN_USERNAME)

    const isValid =
      username.trim() === process.env.ADMIN_USERNAME?.trim() &&
      password.trim() === process.env.ADMIN_PASSWORD?.trim()

    if (isValid) {
      const cookieStore = cookies()
      cookieStore.set('admin_session', process.env.NEXTAUTH_SECRET, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
        sameSite: 'lax',
      })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE() {
  const cookieStore = cookies()
  cookieStore.delete('admin_session')
  return NextResponse.json({ ok: true })
}