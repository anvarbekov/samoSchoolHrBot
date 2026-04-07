'use client'
// app/admin/candidates/page.jsx
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  new: { bg: 'rgba(82,101,245,0.15)', text: '#818cf8', border: 'rgba(82,101,245,0.3)' },
  reviewing: { bg: 'rgba(251,191,36,0.15)', text: '#fbbf24', border: 'rgba(251,191,36,0.3)' },
  interview: { bg: 'rgba(6,214,160,0.15)', text: '#06d6a0', border: 'rgba(6,214,160,0.3)' },
  hired: { bg: 'rgba(52,211,153,0.15)', text: '#34d399', border: 'rgba(52,211,153,0.3)' },
  rejected: { bg: 'rgba(248,113,113,0.15)', text: '#f87171', border: 'rgba(248,113,113,0.3)' },
}

const STATUS_LABELS = {
  new: '🆕 Yangi',
  reviewing: '👀 Ko\'rib chiqilmoqda',
  interview: '🤝 Intervyu',
  hired: '✅ Qabul qilindi',
  rejected: '❌ Rad etildi',
}

const FILTERS = [
  { value: 'all', label: 'Barchasi' },
  { value: 'new', label: '🆕 Yangi' },
  { value: 'reviewing', label: '👀 Ko\'rib chiqilmoqda' },
  { value: 'interview', label: '🤝 Intervyu' },
  { value: 'hired', label: '✅ Qabul' },
  { value: 'rejected', label: '❌ Rad' },
]

function CandidateModal({ candidate, onClose, onStatusUpdate }) {
  const [status, setStatus] = useState(candidate.status)
  const [notes, setNotes] = useState(candidate.notes || '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/candidates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: candidate.id, status, notes }),
      })
      if (res.ok) {
        toast.success('Saqlandi!')
        onStatusUpdate(candidate.id, status, notes)
        onClose()
      } else {
        toast.error('Xatolik yuz berdi')
      }
    } catch {
      toast.error('Xatolik yuz berdi')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Ushbu nomzodni o\'chirmoqchimisiz?')) return
    try {
      const res = await fetch(`/api/candidates?id=${candidate.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('O\'chirildi')
        onStatusUpdate(candidate.id, null)
        onClose()
      }
    } catch {
      toast.error('Xatolik')
    }
  }

  const sc = STATUS_COLORS[status] || STATUS_COLORS.new
  const date = candidate.createdAt
    ? new Date(candidate.createdAt).toLocaleString('uz-UZ')
    : '—'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto modal-enter">
        {/* Header */}
        <div className="flex items-start gap-4 p-6 border-b border-surface-border">
          {candidate.photoUrl ? (
            <img
              src={candidate.photoUrl}
              alt=""
              className="w-20 h-20 rounded-2xl object-cover border-2 border-surface-border shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-brand-600/20 border border-brand-500/20 flex items-center justify-center text-4xl shrink-0">
              👤
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-xl font-bold text-white">{candidate.fullName}</h2>
            <p className="text-slate-400 mt-0.5">{candidate.specialty}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs text-slate-500">{date}</span>
              {candidate.username && (
                <a
                  href={`https://t.me/${candidate.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-brand-400 hover:underline"
                >
                  @{candidate.username}
                </a>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Info grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: '🎯 Mutaxassislik', value: candidate.specialty },
            { label: '⏱️ Ish staji', value: candidate.experience },
            { label: '🏢 Hozirgi ish joyi', value: candidate.currentWork },
            { label: '💼 Istalgan lavozim', value: candidate.targetPosition },
            { label: '📍 Hudud', value: candidate.region },
            { label: '🆔 Ariza ID', value: candidate.id?.slice(0, 8).toUpperCase() },
          ].map(item => (
            <div key={item.label} className="bg-surface-hover rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">{item.label}</p>
              <p className="text-sm font-medium text-white">{item.value || '—'}</p>
            </div>
          ))}
        </div>

        {/* Files */}
        {(candidate.cvUrl || candidate.photoUrl) && (
          <div className="px-6 pb-4 flex gap-3 flex-wrap">
            {candidate.cvUrl && (
              <a
                href={candidate.cvUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600/20 border border-brand-500/30 text-brand-400 text-sm hover:bg-brand-600/30 transition-colors"
              >
                📄 CV ko'rish
              </a>
            )}
            {candidate.photoUrl && (
              <a
                href={candidate.photoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-hover border border-surface-border text-slate-300 text-sm hover:bg-surface-card transition-colors"
              >
                🖼️ Rasmni ko'rish
              </a>
            )}
          </div>
        )}

        {/* Status update */}
        <div className="px-6 pb-4 space-y-3">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Status yangilash</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(STATUS_LABELS).map(([val, label]) => {
              const sc2 = STATUS_COLORS[val]
              return (
                <button
                  key={val}
                  onClick={() => setStatus(val)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 border"
                  style={status === val ? {
                    background: sc2.bg,
                    color: sc2.text,
                    borderColor: sc2.border,
                  } : {
                    background: 'transparent',
                    color: '#64748b',
                    borderColor: '#2a2a45',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>

          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Izohlar qo'shish (ixtiyoriy)..."
            className="w-full bg-surface-hover border border-surface-border rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all resize-none"
          />
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex items-center justify-between gap-3">
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm transition-colors"
          >
            🗑️ O'chirish
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-surface-border text-slate-400 hover:text-white text-sm transition-colors">
              Bekor
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <span className="loading loading-spinner loading-sm" /> : '💾'}
              Saqlash
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CandidatesPage() {
  const searchParams = useSearchParams()
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [total, setTotal] = useState(0)

  const fetchCandidates = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        status: filter,
        search,
        limit: '100',
      })
      const res = await fetch(`/api/candidates?${params}`)
      const data = await res.json()
      setCandidates(data.candidates || [])
      setTotal(data.total || 0)
    } catch {
      toast.error('Ma\'lumotlarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }, [filter, search])

  useEffect(() => { fetchCandidates() }, [fetchCandidates])

  // Auto-open candidate from URL param
  useEffect(() => {
    const id = searchParams.get('id')
    if (id && candidates.length > 0) {
      const found = candidates.find(c => c.id === id)
      if (found) setSelected(found)
    }
  }, [searchParams, candidates])

  function handleStatusUpdate(id, newStatus, notes) {
    if (!newStatus) {
      setCandidates(prev => prev.filter(c => c.id !== id))
    } else {
      setCandidates(prev =>
        prev.map(c => c.id === id ? { ...c, status: newStatus, notes } : c)
      )
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-white">Nomzodlar</h1>
          <p className="text-slate-400 mt-1">{total} ta ariza topildi</p>
        </div>
        <button
          onClick={fetchCandidates}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-surface-border text-slate-400 hover:text-white hover:border-brand-500/50 text-sm transition-all"
        >
          🔄 Yangilash
        </button>
      </div>

      {/* Search and filter */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Ism, mutaxassislik, hudud bo'yicha qidirish..."
            className="w-full bg-surface-hover border border-surface-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all whitespace-nowrap ${
                filter === f.value
                  ? 'bg-brand-600 border-brand-500 text-white'
                  : 'bg-surface-hover border-surface-border text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl shimmer bg-surface-hover" />
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-600">
            <span className="text-6xl mb-4">📭</span>
            <p className="text-lg font-medium text-slate-400">Nomzodlar topilmadi</p>
            <p className="text-sm mt-1">Filter yoki qidiruvni o'zgartiring</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border text-left">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nomzod</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Mutaxassislik</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Hudud</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Staj</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Fayllar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {candidates.map(c => {
                  const sc = STATUS_COLORS[c.status] || STATUS_COLORS.new
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelected(c)}
                      className="table-row-hover"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {c.photoUrl ? (
                            <img src={c.photoUrl} alt="" className="w-9 h-9 rounded-full object-cover border border-surface-border shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-brand-600/20 border border-brand-500/20 flex items-center justify-center text-base shrink-0">
                              👤
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{c.fullName}</p>
                            <p className="text-xs text-slate-500 truncate">
                              {new Date(c.createdAt).toLocaleDateString('uz-UZ')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <p className="text-sm text-slate-300 truncate max-w-[180px]">{c.specialty}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[180px]">{c.targetPosition}</p>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <p className="text-sm text-slate-400">{c.region}</p>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <p className="text-xs text-slate-400">{c.experience}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="status-badge"
                          style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}
                        >
                          {STATUS_LABELS[c.status] || c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <div className="flex gap-2">
                          {c.cvUrl && (
                            <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-brand-600/20 text-xs" title="CV bor">📄</span>
                          )}
                          {c.photoUrl && (
                            <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-purple-600/20 text-xs" title="Rasm bor">🖼️</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
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
