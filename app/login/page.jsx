'use client'
// app/login/page.jsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        toast.success('Xush kelibsiz! 👋')
        router.push('/admin')
      } else {
        toast.error('Login yoki parol noto\'g\'ri!')
      }
    } catch {
      toast.error('Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mesh-bg min-h-screen flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-slide-up relative z-10">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-600/20 border border-brand-500/30 mb-4">
            <span className="text-4xl">🏢</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-white">HR Recruitment</h1>
          <p className="text-slate-400 mt-1 font-body">Admin boshqaruv paneli</p>
        </div>

        {/* Login card */}
        <div className="glass-card p-8">
          <h2 className="font-display text-lg font-semibold text-white mb-6">
            Tizimga kirish
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Foydalanuvchi nomi
              </label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                className="w-full bg-surface-hover border border-surface-border rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                placeholder="admin"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Parol
              </label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="w-full bg-surface-hover border border-surface-border rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center mt-6 py-3"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  Yuklanmoqda...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Kirish
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-sm mt-6">
          HR Recruitment System v1.0 • © 2025
        </p>
      </div>
    </div>
  )
}
