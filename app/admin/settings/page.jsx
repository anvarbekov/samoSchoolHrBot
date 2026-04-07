'use client'
// app/admin/settings/page.jsx
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

function SettingCard({ title, description, children }) {
  return (
    <div className="glass-card p-6 space-y-4">
      <div>
        <h3 className="font-display font-semibold text-white">{title}</h3>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>
      <div className="border-t border-surface-border pt-4">
        {children}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookInfo, setWebhookInfo] = useState(null)
  const [loadingWebhook, setLoadingWebhook] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(false)

  useEffect(() => {
    // Get current webhook info
    fetch('/api/setup-webhook')
      .then(r => r.json())
      .then(d => setWebhookInfo(d.result))
      .catch(() => {})

    // Pre-fill with current URL
    setWebhookUrl(window.location.origin)
  }, [])

  async function setupWebhook() {
    if (!webhookUrl.trim()) {
      toast.error('URL kiriting!')
      return
    }
    setLoadingWebhook(true)
    try {
      const res = await fetch('/api/setup-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl.trim() }),
      })
      const data = await res.json()
      if (data.ok) {
        toast.success('Webhook muvaffaqiyatli o\'rnatildi! ✅')
        const info = await fetch('/api/setup-webhook').then(r => r.json())
        setWebhookInfo(info.result)
      } else {
        toast.error('Xatolik: ' + (data.description || 'Noma\'lum'))
      }
    } catch {
      toast.error('Xatolik yuz berdi')
    } finally {
      setLoadingWebhook(false)
    }
  }

  async function syncToSheets() {
    setSyncLoading(true)
    try {
      const res = await fetch('/api/sync-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' }),
      })
      const data = await res.json()
      if (data.ok) {
        toast.success(`${data.synced} ta yozuv Google Sheets ga yuklandi! ✅`)
      } else {
        toast.error('Xatolik: ' + data.error)
      }
    } catch {
      toast.error('Xatolik yuz berdi')
    } finally {
      setSyncLoading(false)
    }
  }

  async function initSheetHeaders() {
    setInitLoading(true)
    try {
      const res = await fetch('/api/sync-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'init' }),
      })
      const data = await res.json()
      if (data.ok) {
        toast.success('Google Sheets sarlavhalari yaratildi! ✅')
      } else {
        toast.error('Xatolik: ' + data.error)
      }
    } catch {
      toast.error('Xatolik')
    } finally {
      setInitLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-white">Sozlamalar</h1>
        <p className="text-slate-400 mt-1">Bot va integratsiya sozlamalari</p>
      </div>

      {/* Webhook */}
      <SettingCard
        title="🔗 Telegram Webhook"
        description="Botni ulash uchun webhook URL ni o'rnating"
      >
        <div className="space-y-3">
          {webhookInfo && (
            <div className="bg-surface-hover rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${webhookInfo.url ? 'bg-emerald-400' : 'bg-red-400'}`} />
                <span className="text-xs font-medium text-slate-300">
                  {webhookInfo.url ? 'Webhook faol' : 'Webhook o\'rnatilmagan'}
                </span>
              </div>
              {webhookInfo.url && (
                <p className="text-xs text-slate-500 font-mono break-all">{webhookInfo.url}</p>
              )}
              {webhookInfo.last_error_message && (
                <p className="text-xs text-red-400">⚠️ {webhookInfo.last_error_message}</p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <input
              type="url"
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              placeholder="https://your-app.vercel.app"
              className="flex-1 bg-surface-hover border border-surface-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
            <button
              onClick={setupWebhook}
              disabled={loadingWebhook}
              className="btn-primary shrink-0"
            >
              {loadingWebhook ? <span className="loading loading-spinner loading-sm" /> : '🔗'}
              O'rnatish
            </button>
          </div>
        </div>
      </SettingCard>

      {/* Google Sheets */}
      <SettingCard
        title="📊 Google Sheets Sinxronizatsiya"
        description="Barcha nomzod ma'lumotlarini Google Sheets ga yuklash"
      >
        <div className="space-y-3">
          <div className="bg-surface-hover rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-2">
              Har yangi ariza avtomatik Google Sheets ga yoziladi.
              Quyidagi tugma orqali barcha mavjud ma'lumotlarni sinxronlashingiz mumkin.
            </p>
            <p className="text-xs text-slate-500">
              Google Sheets ID: <code className="text-brand-400">{process.env.NEXT_PUBLIC_SHEETS_ID || 'Sozlanmagan'}</code>
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={initSheetHeaders}
              disabled={initLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-surface-border text-slate-400 hover:text-white text-sm transition-all"
            >
              {initLoading ? <span className="loading loading-spinner loading-xs" /> : '📋'}
              Sarlavhalarni yaratish
            </button>
            <button
              onClick={syncToSheets}
              disabled={syncLoading}
              className="btn-primary"
            >
              {syncLoading ? <span className="loading loading-spinner loading-sm" /> : '📊'}
              Hammani sinxronlash
            </button>
          </div>
        </div>
      </SettingCard>

      {/* Bot info */}
      <SettingCard
        title="🤖 Bot haqida"
        description="Joriy konfiguratsiya ma'lumotlari"
      >
        <div className="space-y-2">
          {[
            { label: 'Bot Token', value: process.env.NEXT_PUBLIC_BOT_STATUS || 'Sozlangan ✅', mono: false },
            { label: 'Webhook endpoint', value: '/api/webhook', mono: true },
            { label: 'Database', value: 'Firebase Firestore ✅', mono: false },
            { label: 'File storage', value: 'Cloudinary ✅', mono: false },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-surface-border last:border-0">
              <span className="text-sm text-slate-400">{item.label}</span>
              <span className={`text-sm text-white ${item.mono ? 'font-mono text-brand-400' : ''}`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </SettingCard>

      {/* Quick guide */}
      <SettingCard
        title="📖 Sozlash qo'llanmasi"
        description="Bot ishga tushirish uchun qadamlar"
      >
        <ol className="space-y-3 text-sm text-slate-400">
          {[
            '.env faylida barcha o\'zgaruvchilarni to\'ldiring',
            'Firebase proektini yarating va Firestore ni yoqing',
            'Cloudinary free akkaunt yarating',
            'Vercel ga deploy qiling',
            'Bu yerda Webhook URL ni o\'rnating',
            'Google Sheets sarlavhalarini yarating (ixtiyoriy)',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-brand-600/20 border border-brand-500/30 text-brand-400 text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </SettingCard>
    </div>
  )
}
