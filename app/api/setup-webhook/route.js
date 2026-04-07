// app/api/setup-webhook/route.js
import { NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(request) {
  try {
    const { url } = await request.json()
    const token = process.env.TELEGRAM_BOT_TOKEN
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET

    const webhookUrl = `${url}/api/webhook`

    const response = await axios.post(
      `https://api.telegram.org/bot${token}/setWebhook`,
      {
        url: webhookUrl,
        secret_token: secret,
        allowed_updates: ['message', 'callback_query'],
        drop_pending_updates: true,
      }
    )

    return NextResponse.json(response.data)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN
    const response = await axios.get(
      `https://api.telegram.org/bot${token}/getWebhookInfo`
    )
    return NextResponse.json(response.data)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
