'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

const SC = {
  new:       { bg: 'rgba(82,101,245,0.15)',  text: '#818cf8', border: 'rgba(82,101,245,0.3)' },
  reviewing: { bg: 'rgba(251,191,36,0.15)',  text: '#fbbf24', border: 'rgba(251,191,36,0.3)' },
  interview: { bg: 'rgba(6,214,160,0.15)',   text: '#06d6a0', border: 'rgba(6,214,160,0.3)' },
  hired:     { bg: 'rgba(52,211,153,0.15)',  text: '#34d399', border: 'rgba(52,211,153,0.3)' },
  rejected:  { bg: 'rgba(248,113,113,0.15)', text: '#f87171', border: 'rgba(248,113,113,0.3)' },
}

const STATUS_LABELS = {
  new:       '🆕 Yangi',
  reviewing: "👀 Ko'rib chiqilmoqda",
  interview: '🤝 Intervyu',
  hired:     '✅ Qabul qilindi',
  rejected:  '❌ Rad etildi',
}

const FILTERS = [
  { value: 'all',       label: 'Barchasi' },
  { value: 'new',       label: '🆕 Yangi' },
  { value: 'reviewing', label: "👀 Ko'rib chiqilmoqda" },
  { value: 'interview', label: '🤝 Intervyu' },
  { value: 'hired',     label: '✅ Qabul' },
  { value: 'rejected',  label: '❌ Rad' },
]

const TEMPLATES = [
  {
    label: "👀 Ko'rib chiqilmoqda",
    status: 'reviewing',
    text: "Hurmatli nomzod, arizangiz qabul qilindi va ko'rib chiqilmoqda. Tez orada siz bilan bog'lanamiz.",
  },
  {
    label: '🤝 Intervyuga chaqiriq',
    status: 'interview',
    text: "Hurmatli nomzod, siz intervyuga taklif etildingiz! Iltimos, quyidagi raqamga qo'ng'iroq qiling yoki xabar yuboring: +998 XX XXX XX XX",
  },
  {
    label: '✅ Qabul qilindi',
    status: 'hired',
    text: "Tabriklaymiz! Siz Samo School maktabiga qabul qilindingiz. Ish boshlash sanasi va shartnoma uchun tez orada bog'lanamiz.",
  },
  {
    label: '❌ Rad etildi',
    status: 'rejected',
    text: "Hurmatli nomzod, arizangiz ko'rib chiqildi. Afsuski, hozircha sizga mos bo'sh ish o'rni topilmadi. Kelajakda omad tilaymiz!",
  },
  {
    label: "📋 Qo'shimcha hujjat",
    status: null,
    text: "Hurmatli nomzod, arizangizni ko'rib chiqdik. Iltimos, qo'shimcha hujjatlarni yuboring: diplom nusxasi, tajribani tasdiqlovchi hujjat.",
  },
  {
    label: '📅 Uchrashuv vaqti',
    status: null,
    text: "Hurmatli nomzod, uchrashuv vaqtini belgiladik. Sana: ___ kuni soat ___:00 da. Manzil: Samo School, ___.",
  },
]

// ── Modal ─────────────────────────────────────────────────────────
function CandidateModal({ candidate, onClose, onStatusUpdate }) {
  const [status, setStatus]           = useState(candidate.status)
  const [notes, setNotes]             = useState(candidate.notes || '')
  const [msgText, setMsgText]         = useState('')
  const [willSendMsg, setWillSendMsg] = useState(false)
  const [saving, setSaving]           = useState(false)
  const [sending, setSending]         = useState(false)
  const [msgHistory, setMsgHistory]   = useState(candidate.messages || [])

  function applyTemplate(tpl) {
    setMsgText(tpl.text)
    if (tpl.status) setStatus(tpl.status)
    setWillSendMsg(true)
  }

  async function handleSendNow() {
    if (!msgText.trim()) { toast.error('Xabar matnini kiriting!'); return }
    setSending(true)
    try {
      const res = await fetch('/api/notify-candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: candidate.id, message: msgText, status }),
      })
      if (res.ok) {
        toast.success('Xabar yuborildi! 📨')
        setMsgHistory(prev => [...prev, { text: msgText, sentAt: new Date().toISOString(), status }])
        setMsgText('')
        setWillSendMsg(false)
      } else {
        const d = await res.json()
        toast.error(d.error || 'Xabar yuborishda xatolik')
      }
    } catch { toast.error('Xatolik') }
    finally { setSending(false) }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/candidates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: candidate.id, status, notes }),
      })
      if (!res.ok) throw new Error('Saqlashda xatolik')

      if (willSendMsg && msgText.trim()) {
        const msgRes = await fetch('/api/notify-candidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidateId: candidate.id, message: msgText, status }),
        })
        toast.success(msgRes.ok ? 'Saqlandi + xabar yuborildi! ✅' : 'Saqlandi (xabar yuborishda xatolik)')
      } else {
        toast.success('Saqlandi! ✅')
      }

      onStatusUpdate(candidate.id, status, notes)
      onClose()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!confirm("O'chirmoqchimisiz?")) return
    try {
      await fetch(`/api/candidates?id=${candidate.id}`, { method: 'DELETE' })
      toast.success("O'chirildi")
      onStatusUpdate(candidate.id, null)
      onClose()
    } catch { toast.error('Xatolik') }
  }

  const date = candidate.createdAt ? new Date(candidate.createdAt).toLocaleString('uz-UZ') : '—'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-2xl max-h-[92vh] overflow-y-auto modal-enter">

        {/* Header */}
        <div className="flex items-start gap-4 p-6 border-b border-surface-border">
          <div className="w-16 h-16 rounded-2xl bg-brand-600/20 border border-brand-500/20 flex items-center justify-center text-3xl shrink-0">👤</div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-xl font-bold text-white">{candidate.fullName}</h2>
            <p className="text-slate-400 mt-0.5">{candidate.specialty}</p>
            <div className="flex flex-wrap gap-3 mt-2">
              <span className="text-xs text-slate-500">{date}</span>
              {candidate.phone && (
                <a href={`tel:${candidate.phone}`} className="text-xs text-emerald-400 hover:underline">📱 {candidate.phone}</a>
              )}
              {candidate.username && (
                <a href={`https://t.me/${candidate.username}`} target="_blank" rel="noreferrer" className="text-xs text-brand-400 hover:underline">
                  🔗 @{candidate.username}
                </a>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Info */}
        <div className="p-6 grid grid-cols-2 gap-3">
          {[
            { label: '🎯 Mutaxassislik', value: candidate.specialty },
            { label: '📱 Telefon',       value: candidate.phone },
            { label: '🔗 Telegram',      value: candidate.username ? '@' + candidate.username : null },
            { label: '🆔 Ariza ID',      value: candidate.id?.slice(0, 8).toUpperCase() },
          ].filter(i => i.value).map(item => (
            <div key={item.label} className="bg-surface-hover rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1">{item.label}</p>
              <p className="text-sm font-medium text-white">{item.value}</p>
            </div>
          ))}
        </div>

        {/* CV */}
        {candidate.cvUrl && (
          <div className="px-6 pb-4">
            <a href={candidate.cvUrl} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600/20 border border-brand-500/30 text-brand-400 text-sm hover:bg-brand-600/30 transition-colors font-medium">
              📄 CV ni ko'rish / Yuklab olish
            </a>
          </div>
        )}

        {/* Status */}
        <div className="px-6 pb-4 space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(STATUS_LABELS).map(([val, label]) => {
              const c = SC[val]
              return (
                <button key={val} onClick={() => setStatus(val)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
                  style={status === val
                    ? { background: c.bg, color: c.text, borderColor: c.border }
                    : { background: 'transparent', color: '#64748b', borderColor: '#2a2a45' }}>
                  {label}
                </button>
              )
            })}
          </div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            placeholder="Ichki izoh (nomzodga ko'rinmaydi)..."
            className="w-full bg-surface-hover border border-surface-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/50 transition-all resize-none" />
        </div>

        {/* Xabar yuborish */}
        <div className="px-6 pb-4 space-y-3 border-t border-surface-border pt-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">📨 Nomzodga Telegram xabar yuborish</p>

          {/* Shablonlar */}
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map((tpl, i) => (
              <button key={i} onClick={() => applyTemplate(tpl)}
                className="text-left px-3 py-2.5 rounded-xl border border-surface-border bg-surface-hover hover:border-brand-500/40 hover:bg-surface-card transition-all group">
                <p className="text-xs font-medium text-slate-300 group-hover:text-white">{tpl.label}</p>
              </button>
            ))}
          </div>

          {/* Matn */}
          <textarea value={msgText} onChange={e => setMsgText(e.target.value)} rows={4}
            placeholder="Xabar matni... (shablon tanlang yoki o'zingiz yozing)"
            className="w-full bg-surface-hover border border-surface-border rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all resize-none" />

          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={handleSendNow} disabled={sending || !msgText.trim()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              {sending ? <span className="loading loading-spinner loading-xs" /> : '📨'}
              Hozir yuborish
            </button>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={willSendMsg} onChange={e => setWillSendMsg(e.target.checked)}
                className="checkbox checkbox-primary checkbox-sm" />
              <span className="text-xs text-slate-400">Saqlashda ham yuborish</span>
            </label>
          </div>

          {/* Xabarlar tarixi */}
          {msgHistory.length > 0 && (
            <div className="space-y-2 mt-1">
              <p className="text-xs text-slate-500">Yuborilgan xabarlar:</p>
              {msgHistory.map((m, i) => (
                <div key={i} className="bg-surface-hover rounded-xl px-3 py-2 text-xs text-slate-400 border border-surface-border">
                  <span className="text-slate-500">{new Date(m.sentAt).toLocaleString('uz-UZ')} — </span>
                  {m.text.slice(0, 90)}{m.text.length > 90 ? '...' : ''}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between gap-3 border-t border-surface-border pt-4">
          <button onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm transition-colors">
            🗑️ O'chirish
          </button>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-surface-border text-slate-400 hover:text-white text-sm transition-colors">
              Bekor
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <span className="loading loading-spinner loading-sm" /> : '💾'}
              {willSendMsg && msgText ? 'Saqlash + Yuborish' : 'Saqlash'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Asosiy sahifa ─────────────────────────────────────────────────
export default function CandidatesContent() {
  const searchParams                  = useSearchParams()
  const [candidates, setCandidates]   = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [filter, setFilter]           = useState('all')
  const [selected, setSelected]       = useState(null)
  const [total, setTotal]             = useState(0)

  const fetchCandidates = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ status: filter, search, limit: '100' })
      const res = await fetch(`/api/candidates?${p}`)
      const d = await res.json()
      setCandidates(d.candidates || [])
      setTotal(d.total || 0)
    } catch { toast.error("Yuklab bo'lmadi") }
    finally { setLoading(false) }
  }, [filter, search])

  useEffect(() => { fetchCandidates() }, [fetchCandidates])

  useEffect(() => {
    const id = searchParams.get('id')
    if (id && candidates.length > 0) {
      const found = candidates.find(c => c.id === id)
      if (found) setSelected(found)
    }
  }, [searchParams, candidates])

  function handleStatusUpdate(id, newStatus, notes) {
    if (!newStatus) setCandidates(prev => prev.filter(c => c.id !== id))
    else setCandidates(prev => prev.map(c => c.id === id ? { ...c, status: newStatus, notes } : c))
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-white">Nomzodlar</h1>
          <p className="text-slate-400 mt-1">{total} ta ariza</p>
        </div>
        <button onClick={fetchCandidates}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-surface-border text-slate-400 hover:text-white text-sm transition-all">
          🔄 Yangilash
        </button>
      </div>

      {/* Search + Filter */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Ism, mutaxassislik bo'yicha qidirish..."
            className="w-full bg-surface-hover border border-surface-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-all" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all whitespace-nowrap ${
                filter === f.value ? 'bg-brand-600 border-brand-500 text-white' : 'bg-surface-hover border-surface-border text-slate-400 hover:text-white'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl shimmer bg-surface-hover" />)}
          </div>
        ) : candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <span className="text-6xl mb-4">📭</span>
            <p className="text-slate-400 font-medium">Nomzodlar topilmadi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nomzod</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Mutaxassislik</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Telefon</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">CV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {candidates.map(c => {
                  const sc = SC[c.status] || SC.new
                  return (
                    <tr key={c.id} onClick={() => setSelected(c)} className="table-row-hover">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand-600/20 border border-brand-500/20 flex items-center justify-center text-base shrink-0">👤</div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{c.fullName}</p>
                            <p className="text-xs text-slate-500">{new Date(c.createdAt).toLocaleDateString('uz-UZ')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <p className="text-sm text-slate-300 truncate max-w-[200px]">{c.specialty}</p>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <p className="text-xs text-slate-400">{c.phone || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="status-badge text-xs"
                          style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                          {STATUS_LABELS[c.status] || c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        {c.cvUrl
                          ? <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-brand-600/20 text-sm" title="CV bor">📄</span>
                          : <span className="text-xs text-slate-600">—</span>
                        }
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <CandidateModal
          candidate={selected}
          onClose={() => setSelected(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  )
}