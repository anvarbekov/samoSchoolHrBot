// app/api/candidates/route.js
import { adminDb } from '@/lib/firebase-admin'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '100')

    let query = adminDb.collection('candidates').orderBy('createdAt', 'desc')

    if (status && status !== 'all') {
      query = query.where('status', '==', status)
    }

    const snapshot = await query.limit(200).get()
    let candidates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    if (search) {
      const s = search.toLowerCase()
      candidates = candidates.filter(c =>
        c.fullName?.toLowerCase().includes(s) ||
        c.specialty?.toLowerCase().includes(s) ||
        c.phone?.includes(s)
      )
    }

    const total = candidates.length
    const paginated = candidates.slice(0, limit)

    return NextResponse.json({ candidates: paginated, total })
  } catch (error) {
    console.error('GET candidates error:', error)
    return NextResponse.json({ error: 'Xatolik' }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const { id, status, notes } = await request.json()

    if (!id) return NextResponse.json({ error: 'ID topilmadi' }, { status: 400 })

    await adminDb.collection('candidates').doc(id).update({
      status,
      notes,
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('PATCH error:', error)
    return NextResponse.json({ error: 'Yangilashda xatolik' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID topilmadi' }, { status: 400 })

    await adminDb.collection('candidates').doc(id).delete()
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE error:', error)
    return NextResponse.json({ error: "O'chirishda xatolik" }, { status: 500 })
  }
}