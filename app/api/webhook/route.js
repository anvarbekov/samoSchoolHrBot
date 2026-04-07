// app/api/webhook/route.js
import { handleUpdate } from '@/lib/bot'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const secret = request.headers.get('x-telegram-bot-api-secret-token')
    
    if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const update = await request.json()
    await handleUpdate(update)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Webhook is active ✅' })
}
