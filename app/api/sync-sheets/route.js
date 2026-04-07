// app/api/sync-sheets/route.js
import { adminDb } from '@/lib/firebase-admin'
import { appendToSheet, initSheet } from '@/lib/google-sheets'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { action } = await request.json()

    if (action === 'init') {
      await initSheet()
      return NextResponse.json({ ok: true, message: 'Sheet initialized' })
    }

    // Sync all candidates
    const snapshot = await adminDb.collection('candidates')
      .orderBy('createdAt', 'asc')
      .get()

    const candidates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    let synced = 0
    for (const candidate of candidates) {
      await appendToSheet(candidate)
      synced++
    }

    return NextResponse.json({ ok: true, synced })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
