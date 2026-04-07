'use client'
// app/admin/page.jsx
import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'

const STATUS_COLORS = {
  new: '#5265f5',
  reviewing: '#fbbf24',
  interview: '#06d6a0',
  hired: '#34d399',
  rejected: '#f87171',
}

const STATUS_LABELS = {
  new: 'Yangi',
  reviewing: 'Ko\'rib chiqilmoqda',
  interview: 'Intervyu',
  hired: 'Qabul qilindi',
  rejected: 'Rad etildi',
}

function StatCard({ emoji, label, value, sub, color = 'brand' }) {
  return (
    <div className="glass-card p-6 hover:scale-[1.02] transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-${color}-500/10 border border-${color}-500/20`}>
          {emoji}
        </div>
      </div>
      <p className="text-3xl font-display font-bold text-white mb-1">{value}</p>
      <p className="text-sm font-medium text-slate-300">{label}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-4 py-3 text-sm">
        <p className="text-slate-400 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="font-semibold" style={{ color: p.color }}>
            {p.value} ta ariza
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/candidates?limit=200')
      .then(r => r.json())
      .then(d => {
        setCandidates(d.candidates || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Stats
  const total = candidates.length
  const newCount = candidates.filter(c => c.status === 'new').length
  const hiredCount = candidates.filter(c => c.status === 'hired').length
  const withCv = candidates.filter(c => c.cvUrl).length

  // Status distribution for pie chart
  const statusData = Object.entries(
    candidates.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1
      return acc
    }, {})
  ).map(([status, count]) => ({
    name: STATUS_LABELS[status] || status,
    value: count,
    color: STATUS_COLORS[status] || '#64748b',
  }))

  // Daily applications for area chart (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const key = d.toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' })
    const count = candidates.filter(c => {
      const cd = new Date(c.createdAt)
      return cd.toDateString() === d.toDateString()
    }).length
    return { date: key, count }
  })

  // Position distribution
  const positionData = Object.entries(
    candidates.reduce((acc, c) => {
      const pos = c.targetPosition?.replace(/^[^\s]+\s/, '') || 'Boshqa'
      acc[pos] = (acc[pos] || 0) + 1
      return acc
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }))

  // Recent candidates
  const recent = [...candidates]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-6 h-32 shimmer" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-white">
          Dashboard
        </h1>
        <p className="text-slate-400 mt-1">Umumiy ko'rsatkichlar va statistika</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard emoji="👥" label="Jami arizalar" value={total} sub="Barcha vaqt" />
        <StatCard emoji="🆕" label="Yangi arizalar" value={newCount} sub="Ko'rib chiqilmagan" color="blue" />
        <StatCard emoji="✅" label="Qabul qilinganlar" value={hiredCount} sub="Muvaffaqiyatli" color="emerald" />
        <StatCard emoji="📄" label="CV yubordilar" value={withCv} sub={`${total ? Math.round(withCv / total * 100) : 0}% nomzodlar`} color="purple" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="font-display font-semibold text-white mb-1">Kunlik arizalar</h3>
          <p className="text-xs text-slate-500 mb-6">So'nggi 7 kun</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={last7Days}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5265f5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#5265f5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#2a2a45" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 11 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#5265f5"
                strokeWidth={2}
                fill="url(#areaGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold text-white mb-1">Status bo'yicha</h3>
          <p className="text-xs text-slate-500 mb-4">Taqsimot</p>
          {statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, n) => [v, n]}
                    contentStyle={{ background: '#16162a', border: '1px solid #2a2a45', borderRadius: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {statusData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-slate-400">{d.name}</span>
                    </div>
                    <span className="text-white font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-600">
              <p className="text-sm">Ma'lumot yo'q</p>
            </div>
          )}
        </div>
      </div>

      {/* Bar chart + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart by position */}
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold text-white mb-1">Yo'nalishlar</h3>
          <p className="text-xs text-slate-500 mb-6">Top 6 istalgan lavozim</p>
          {positionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={positionData} layout="vertical">
                <CartesianGrid stroke="#2a2a45" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" stroke="#475569" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke="#475569" tick={{ fontSize: 10 }} width={90} />
                <Tooltip
                  contentStyle={{ background: '#16162a', border: '1px solid #2a2a45', borderRadius: 12 }}
                  formatter={v => [v, 'Ariza']}
                />
                <Bar dataKey="count" fill="#5265f5" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-600 text-sm">
              Ma'lumot yo'q
            </div>
          )}
        </div>

        {/* Recent candidates */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-semibold text-white">So'nggi arizalar</h3>
              <p className="text-xs text-slate-500 mt-0.5">Eng yangi 5 ta</p>
            </div>
            <Link href="/admin/candidates" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
              Barchasini ko'rish →
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-600">
              <span className="text-4xl mb-2">📭</span>
              <p className="text-sm">Hali ariza yo'q</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map(c => (
                <Link
                  key={c.id}
                  href={`/admin/candidates?id=${c.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-hover transition-colors group"
                >
                  {c.photoUrl ? (
                    <img src={c.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-surface-border" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-brand-600/20 border border-brand-500/20 flex items-center justify-center text-lg">
                      👤
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{c.fullName}</p>
                    <p className="text-xs text-slate-500 truncate">{c.targetPosition}</p>
                  </div>
                  <span
                    className="status-badge text-xs shrink-0"
                    style={{
                      background: STATUS_COLORS[c.status] + '20',
                      color: STATUS_COLORS[c.status],
                      border: `1px solid ${STATUS_COLORS[c.status]}40`,
                    }}
                  >
                    {STATUS_LABELS[c.status] || c.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
