// app/api/candidates/route.js
import { adminDb } from '@/lib/firebase-admin'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    let query = adminDb.collection('candidates').orderBy('createdAt', 'desc')

    if (status && status !== 'all') {
      query = query.where('status', '==', status)
    }

    const snapshot = await query.limit(200).get()
    let candidates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Filter by search
    if (search) {
      const s = search.toLowerCase()
      candidates = candidates.filter(c =>
        c.fullName?.toLowerCase().includes(s) ||
        c.specialty?.toLowerCase().includes(s) ||
        c.targetPosition?.toLowerCase().includes(s) ||
        c.region?.toLowerCase().includes(s)
      )
    }

    const total = candidates.length
    const paginated = candidates.slice((page - 1) * limit, page * limit)

    return NextResponse.json({ candidates: paginated, total, page, limit })
  } catch (error) {
    console.error('Candidates fetch error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const { id, status, notes } = await request.json()

    const ref = adminDb.collection('candidates').doc(id)
    await ref.update({
      status,
      ...(notes ? { notes } : {}),
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    await adminDb.collection('candidates').doc(id).delete()
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
