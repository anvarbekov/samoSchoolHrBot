// app/api/notify-candidate/route.js
import { adminDb } from '@/lib/firebase-admin'
import { sendMessage } from '@/lib/bot'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { candidateId, message, status } = await request.json()

    // Get candidate from DB
    const doc = await adminDb.collection('candidates').doc(candidateId).get()
    if (!doc.exists) {
      return NextResponse.json({ error: 'Nomzod topilmadi' }, { status: 404 })
    }

    const candidate = doc.data()
    const userId = candidate.userId

    if (!userId) {
      return NextResponse.json({ error: 'Nomzodning Telegram ID si yo\'q' }, { status: 400 })
    }

    // Status emoji map
    const statusEmoji = {
      new: '🆕',
      reviewing: '👀',
      interview: '🤝',
      hired: '✅',
      rejected: '❌',
    }

    const statusLabel = {
      new: 'Yangi',
      reviewing: "Ko'rib chiqilmoqda",
      interview: 'Intervyuga taklif etildi',
      hired: 'Qabul qilindi',
      rejected: 'Rad etildi',
    }

    // Build notification message
    const emoji = statusEmoji[status] || '📢'
    const label = statusLabel[status] || status

    let text =
      `${emoji} <b>Samo School HR - Ariza holati yangilandi</b>\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 <b>${candidate.fullName}</b>\n` +
      `🆔 Ariza: <code>${candidateId.slice(0, 8).toUpperCase()}</code>\n` +
      `📌 <b>Holat:</b> ${emoji} ${label}\n`

    if (message && message.trim()) {
      text += `\n💬 <b>HR Izoh:</b>\n${message.trim()}\n`
    }

    text += `\n━━━━━━━━━━━━━━━━━━━━\n🏫 <i>Samo School HR</i>`

    await sendMessage(userId, text)

    // Save notification to DB
    await adminDb.collection('candidates').doc(candidateId).update({
      lastNotified: new Date().toISOString(),
      lastNotifyMessage: message,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Notify error:', error)
    return NextResponse.json({ error: 'Xabar yuborishda xatolik' }, { status: 500 })
  }
}