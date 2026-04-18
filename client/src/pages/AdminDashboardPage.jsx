import { useState, useCallback, useMemo } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  ink:    '#1C1A17',
  paper:  '#F8F4EE',
  white:  '#FFFFFF',
  muted:  '#8C8478',
  border: 'rgba(28,26,23,0.09)',
  tc:     '#C4633A',
  sage:   '#6B9E8A',
  purple: '#8B7EC8',
  gold:   '#C9A84C',
  red:    '#B85450',
  google: '#EA4335',
}

const PER_PAGE = 10

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n)    { return (n ?? 0).toLocaleString() }
function pct(a, b) { return b > 0 ? Math.round((a / b) * 100) : 0 }
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
}
function initials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
}

// ── Sparkline (SVG, no deps) ──────────────────────────────────────────────────
function Sparkline({ data, color = C.tc, height = 40, width = 160 }) {
  if (!data || data.length < 2) return <span style={{ fontSize: 11, color: C.muted }}>No trend data</span>
  const vals = data.map(d => d.count ?? d.letters ?? 0)
  const max  = Math.max(...vals, 1)
  const step = width / (vals.length - 1)
  const pts  = vals.map((v, i) => `${i * step},${height - (v / max) * (height - 4)}`).join(' ')
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={pts} />
      {vals.map((v, i) => (
        <circle key={i} cx={i * step} cy={height - (v / max) * (height - 4)} r="2.5" fill={color} />
      ))}
    </svg>
  )
}

// ── Horizontal bar (for breakdown lists) ─────────────────────────────────────
function BarRow({ label, value, max, color, icon }) {
  const pctVal = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      {icon && <span style={{ fontSize: 15, width: 20, flexShrink: 0 }}>{icon}</span>}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 12.5, color: C.ink, fontFamily: '"DM Sans",sans-serif', fontWeight: 500, textTransform: 'capitalize' }}>{label}</span>
          <span style={{ fontSize: 12, color, fontFamily: '"DM Sans",sans-serif', fontWeight: 700 }}>{fmt(value)}</span>
        </div>
        <div style={{ width: '100%', background: `${color}18`, borderRadius: 99, height: 6, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(pctVal, 100)}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
        </div>
      </div>
    </div>
  )
}

// ── Letter Lifecycle Funnel ───────────────────────────────────────────────────
function Funnel({ steps }) {
  const max = steps[0]?.value || 1
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {steps.map((step, i) => {
        const width = max > 0 ? Math.max((step.value / max) * 100, 4) : 4
        const dropPct = i > 0 && steps[i - 1].value > 0
          ? Math.round(((steps[i - 1].value - step.value) / steps[i - 1].value) * 100)
          : null
        return (
          <div key={step.label}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15 }}>{step.icon}</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: C.ink, fontFamily: '"DM Sans",sans-serif' }}>{step.label}</span>
                {dropPct !== null && (
                  <span style={{ fontSize: 10.5, color: C.muted, background: `${C.muted}12`, borderRadius: 99, padding: '1px 7px', fontFamily: '"DM Sans",sans-serif' }}>
                    −{dropPct}% drop-off
                  </span>
                )}
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: step.color, fontFamily: '"Lora",serif' }}>{fmt(step.value)}</span>
            </div>
            <div style={{ height: 10, background: `${step.color}18`, borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ width: `${width}%`, height: '100%', background: step.color, borderRadius: 99, transition: 'width 0.7s ease' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Section Header ────────────────────────────────────────────────────────────
function SectionHeading({ children, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: C.muted, fontFamily: '"DM Sans",sans-serif' }}>
        {children}
      </div>
      {sub && <div style={{ fontSize: 12, color: C.muted, marginTop: 3, fontFamily: '"DM Sans",sans-serif' }}>{sub}</div>}
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, desc, accent = C.tc, iconBg }) {
  const bg = iconBg || `${accent}15`
  return (
    <div
      style={{
        background: C.white, border: `1px solid ${C.border}`, borderRadius: 16,
        padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10,
        boxShadow: '0 1px 4px rgba(28,26,23,0.04)',
        transition: 'box-shadow 0.18s, transform 0.18s', cursor: 'default',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(28,26,23,0.09)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(28,26,23,0.04)'; e.currentTarget.style.transform = 'none' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: C.muted, fontFamily: '"DM Sans",sans-serif' }}>
          {label}
        </div>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: C.ink, fontFamily: '"Lora",serif', lineHeight: 1, letterSpacing: '-1.5px' }}>
        {fmt(value)}
      </div>
      <div style={{ fontSize: 11.5, color: C.muted, fontFamily: '"DM Sans",sans-serif', lineHeight: 1.5 }}>
        {desc}
      </div>
    </div>
  )
}

// ── Progress Metric ───────────────────────────────────────────────────────────
function ProgressMetric({ label, desc, value, max, color }) {
  const pctVal = pct(value, max)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <div>
          <span style={{ fontSize: 13, color: C.ink, fontFamily: '"DM Sans",sans-serif', fontWeight: 600 }}>{label}</span>
          {desc && <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{desc}</div>}
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color, fontFamily: '"Lora",serif' }}>{pctVal}%</span>
      </div>
      <div style={{ width: '100%', background: `${color}18`, borderRadius: 99, height: 8, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(pctVal, 100)}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.7s cubic-bezier(.4,0,.2,1)' }} />
      </div>
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ label, color }) {
  return (
    <span style={{
      fontSize: 10, padding: '3px 8px', borderRadius: 99, fontWeight: 600,
      letterSpacing: '0.4px', textTransform: 'uppercase',
      background: `${color}15`, color, border: `1px solid ${color}28`,
      fontFamily: '"DM Sans",sans-serif', whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

// ── Sort / Filter Chip ────────────────────────────────────────────────────────
function Chip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 12px', borderRadius: 99, fontSize: 11.5, cursor: 'pointer',
      fontFamily: '"DM Sans",sans-serif', fontWeight: active ? 600 : 400,
      background: active ? C.ink : C.white,
      color: active ? '#F7F2EA' : '#4A4640',
      border: active ? `1px solid ${C.ink}` : `1px solid ${C.border}`,
      transition: 'all 0.12s',
    }}>{label}</button>
  )
}

// ── Day Filter ────────────────────────────────────────────────────────────────
const DAY_OPTIONS = [1, 3, 7, 15, 30, 90]
function DayFilter({ active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
      {DAY_OPTIONS.map(d => (
        <button key={d} onClick={() => onChange(d)} style={{
          padding: '5px 13px', borderRadius: 99, fontSize: 12, cursor: 'pointer',
          fontFamily: '"DM Sans",sans-serif', fontWeight: active === d ? 600 : 400,
          background: active === d ? 'rgba(247,242,234,0.95)' : 'rgba(247,242,234,0.12)',
          color: active === d ? C.ink : 'rgba(247,242,234,0.65)',
          border: active === d ? '1px solid rgba(247,242,234,0.7)' : '1px solid rgba(247,242,234,0.15)',
          transition: 'all 0.15s',
        }}>
          {d}d
        </button>
      ))}
    </div>
  )
}

// ── Colors ────────────────────────────────────────────────────────────────────
const STATUS_COLOR   = { sent: C.sage, scheduled: C.purple, opened: C.tc, clicked: C.gold, failed: C.red, personal: '#4A4640', stranger: '#7A6E5C' }
const ROLE_COLOR     = { seeker: C.tc, listener: C.sage, both: C.purple }
const PROVIDER_COLOR = { email: '#4A4640', google: C.google }
const AVATAR_COLORS  = [C.tc, C.sage, C.purple, C.gold, '#4A90C4', '#7A6E5C']

function Avatar({ name, idx = 0 }) {
  const color = AVATAR_COLORS[idx % AVATAR_COLORS.length]
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%', background: `${color}20`,
      border: `1.5px solid ${color}40`, color, fontSize: 10.5, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      fontFamily: '"DM Sans",sans-serif',
    }}>
      {initials(name)}
    </div>
  )
}

function TH({ children, center }) {
  return (
    <th style={{
      textAlign: center ? 'center' : 'left',
      padding: '11px 12px', fontSize: 10, letterSpacing: '1.2px',
      textTransform: 'uppercase', color: C.muted, fontWeight: 700,
      whiteSpace: 'nowrap', background: '#F5F1EB',
      fontFamily: '"DM Sans",sans-serif',
    }}>{children}</th>
  )
}

function TD({ children, center, muted, bold, color, nowrap, small, maxW }) {
  return (
    <td style={{
      padding: '10px 12px',
      textAlign: center ? 'center' : 'left',
      color: color || (muted ? C.muted : C.ink),
      fontWeight: bold ? 700 : 400,
      fontSize: small ? 12 : 13,
      whiteSpace: nowrap ? 'nowrap' : undefined,
      maxWidth: maxW,
      overflow: maxW ? 'hidden' : undefined,
      textOverflow: maxW ? 'ellipsis' : undefined,
      fontFamily: '"DM Sans",sans-serif',
    }}>{children}</td>
  )
}

// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',      icon: '📊', label: 'Overview',      desc: 'Platform health & totals' },
  { id: 'engagement',    icon: '📈', label: 'Engagement',    desc: 'Activity, rates & funnel' },
  { id: 'users',         icon: '👤', label: 'Users',         desc: 'Directory & demographics' },
  { id: 'letters',       icon: '📬', label: 'Letters',       desc: 'Recent activity & moods' },
  { id: 'notifications', icon: '🔔', label: 'Notifications', desc: 'Platform notifications' },
  { id: 'trends',        icon: '📉', label: 'Trends',        desc: 'Daily activity charts' },
]

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [key,       setKey]       = useState('')
  const [days,      setDays]      = useState(7)
  const [data,      setData]      = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [unlocked,  setUnlocked]  = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [userSort,  setUserSort]  = useState('written')
  const [search,    setSearch]    = useState('')
  const [page,      setPage]      = useState(1)

  const fetchData = useCallback(async (k, d) => {
    setLoading(true)
    setError('')
    try {
      const res  = await fetch(`${API}/api/admin/analytics?key=${encodeURIComponent(k)}&days=${d}`)
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Failed to fetch.'); return }
      setData(json.data)
      setUnlocked(true)
    } catch {
      setError('Network error — is the server running?')
    } finally {
      setLoading(false)
    }
  }, [])

  // Must be before early returns — Rules of Hooks
  const filteredUsers = useMemo(() => {
    if (!data) return []
    const q = search.toLowerCase()
    return [...(data.userStats || [])]
      .filter(u => !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
      .sort((a, b) => {
        if (userSort === 'written') return b.written - a.written
        if (userSort === 'sent')    return b.sent    - a.sent
        if (userSort === 'opened')  return b.opened  - a.opened
        if (userSort === 'joined')  return new Date(b.joinedAt) - new Date(a.joinedAt)
        return 0
      })
  }, [data, userSort, search])

  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  }, [filteredUsers, page])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PER_PAGE))

  function handleSubmit(e) {
    e.preventDefault()
    if (!key.trim()) { setError('Enter access key.'); return }
    fetchData(key, days)
  }

  function handleDayChange(d) {
    setDays(d)
    if (unlocked) fetchData(key, d)
  }

  function handleSearch(val) {
    setSearch(val)
    setPage(1)
  }

  // ── Lock screen ──────────────────────────────────────────────────────────────
  if (!unlocked) {
    return (
      <div style={{ minHeight: '100vh', background: C.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"DM Sans",sans-serif', padding: 16 }}>
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 20, padding: '44px 40px', width: '100%', maxWidth: 400, boxShadow: '0 12px 40px rgba(28,26,23,0.10)' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: `${C.ink}0D`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 16px' }}>🔐</div>
            <div style={{ fontFamily: '"Lora",serif', fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 6 }}>Admin Dashboard</div>
            <div style={{ fontSize: 13, color: C.muted }}>Letter from Heart — internal analytics</div>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="password" placeholder="Enter access key" value={key}
              onChange={e => { setKey(e.target.value); setError('') }}
              autoFocus
              style={{
                padding: '12px 16px', borderRadius: 12, fontSize: 14,
                border: error ? `1.5px solid ${C.tc}` : `1px solid ${C.border}`,
                outline: 'none', fontFamily: '"DM Sans",sans-serif', color: C.ink,
                background: '#FAFAFA', transition: 'border 0.15s',
              }}
              onFocus={e => !error && (e.target.style.border = `1.5px solid ${C.ink}`)}
              onBlur={e  => !error && (e.target.style.border = `1px solid ${C.border}`)}
            />
            {error && (
              <div style={{ fontSize: 12.5, color: C.tc, background: `${C.tc}0D`, border: `1px solid ${C.tc}25`, borderRadius: 10, padding: '9px 14px' }}>
                {error}
              </div>
            )}
            <button type="submit" disabled={loading} style={{
              padding: '12px', borderRadius: 99, background: loading ? '#aaa' : C.ink,
              color: '#F7F2EA', border: 'none', fontSize: 14, fontWeight: 600,
              fontFamily: '"DM Sans",sans-serif', cursor: loading ? 'default' : 'pointer',
              transition: 'background 0.15s',
            }}>
              {loading ? 'Verifying…' : 'Enter Dashboard →'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Derived values ────────────────────────────────────────────────────────────
  const d         = data
  const openRate  = pct(d.openedLetters,  d.sentLetters)
  const sendRate  = pct(d.sentLetters,    d.totalLetters)
  const claimRate = pct(d.claimedLetters, d.strangerLetters)
  const endRate   = pct(d.endedConversations, d.totalConversations)
  const avgLetters = d.totalUsers > 0 ? (d.totalLetters / d.totalUsers).toFixed(1) : '0'
  const funnel    = d.letterFunnel || {}

  return (
    <div style={{ minHeight: '100vh', background: C.paper, fontFamily: '"DM Sans",sans-serif', paddingBottom: 80 }}>

      {/* ── Top Bar ── */}
      <div style={{
        background: C.ink, padding: '16px clamp(16px,4vw,52px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>💌</span>
          <span style={{ fontFamily: '"Lora",serif', fontStyle: 'italic', fontSize: 18, color: '#F7F2EA', fontWeight: 600 }}>Letter from Heart</span>
          <span style={{ width: 1, height: 14, background: 'rgba(247,242,234,0.2)', display: 'inline-block' }} />
          <span style={{ fontSize: 10.5, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(247,242,234,0.4)' }}>Admin Analytics</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {loading && <span style={{ fontSize: 12, color: 'rgba(247,242,234,0.4)', fontStyle: 'italic' }}>Refreshing…</span>}
          <DayFilter active={days} onChange={handleDayChange} />
          <button
            onClick={() => fetchData(key, days)}
            style={{ padding: '6px 14px', borderRadius: 99, fontSize: 12, cursor: 'pointer', background: 'rgba(247,242,234,0.1)', color: '#F7F2EA', border: '1px solid rgba(247,242,234,0.18)', transition: 'background 0.15s', fontFamily: '"DM Sans",sans-serif' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(247,242,234,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(247,242,234,0.1)'}
          >↻ Refresh</button>
          <button
            onClick={() => { setUnlocked(false); setData(null); setKey('') }}
            style={{ padding: '6px 14px', borderRadius: 99, fontSize: 12, cursor: 'pointer', background: 'rgba(196,99,58,0.15)', color: '#f0a080', border: '1px solid rgba(196,99,58,0.25)', fontFamily: '"DM Sans",sans-serif' }}
          >🔒 Lock</button>
        </div>
      </div>

      {/* ── KPI sub-header ── */}
      <div style={{ background: C.white, padding: '14px clamp(16px,4vw,52px)', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: '"Lora",serif', fontSize: 20, fontWeight: 700, color: C.ink }}>Analytics</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
            Last <strong style={{ color: C.ink }}>{d.days}d</strong> ·{' '}
            <strong style={{ color: C.ink }}>{fmt(d.totalUsers)}</strong> total users ·{' '}
            <strong style={{ color: C.tc }}>{fmt(d.activeUsers)}</strong> active this period
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Open Rate',    value: `${d.openRate}%`,         color: C.tc },
            { label: 'New Signups',  value: fmt(d.newUsers),          color: C.sage },
            { label: 'Scheduled',    value: fmt(d.scheduledLetters),  color: C.purple },
            { label: 'Active Convos',value: fmt(d.activeConversations), color: C.gold },
          ].map((kpi, i, arr) => (
            <div key={kpi.label} style={{ display: 'flex', gap: 20 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: kpi.color, fontFamily: '"Lora",serif', lineHeight: 1 }}>{kpi.value}</div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', color: C.muted, marginTop: 3 }}>{kpi.label}</div>
              </div>
              {i < arr.length - 1 && <div style={{ width: 1, background: C.border, alignSelf: 'stretch' }} />}
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab strip ── */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '12px 20px', fontSize: 13, border: 'none', whiteSpace: 'nowrap',
            background: activeTab === tab.id ? C.white : 'transparent',
            fontFamily: '"DM Sans",sans-serif', cursor: 'pointer',
            color: activeTab === tab.id ? C.ink : C.muted,
            fontWeight: activeTab === tab.id ? 600 : 400,
            borderBottom: activeTab === tab.id ? `2.5px solid ${C.tc}` : '2.5px solid transparent',
            transition: 'all 0.15s',
          }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div style={{ padding: '28px clamp(16px,4vw,52px)', display: 'flex', flexDirection: 'column', gap: 36 }}>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB: OVERVIEW
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <>
            <section>
              <SectionHeading sub="All-time platform totals across both user types">Platform Totals</SectionHeading>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px,1fr))', gap: 12 }}>
                <StatCard icon="👥" label="Total Users"       accent={C.ink}    iconBg="rgba(28,26,23,0.08)"
                  value={d.totalUsers} desc="All registered accounts — email + Google" />
                <StatCard icon="📧" label="Email / Password"  accent="#4A4640"  iconBg="rgba(74,70,64,0.09)"
                  value={d.totalEmailUsers} desc="Signed up with email & password" />
                <StatCard icon="🔑" label="Google Sign-In"    accent={C.google} iconBg="rgba(234,67,53,0.09)"
                  value={d.totalGoogleUsers} desc="Authenticated via Google OAuth" />
                <StatCard icon="🔗" label="Custom SMTP"       accent={C.sage}   iconBg={`${C.sage}15`}
                  value={d.emailConnections} desc="Users with their own email connected" />
              </div>
            </section>

            <section>
              <SectionHeading sub={`Activity within the last ${d.days} day${d.days !== 1 ? 's' : ''}`}>Period Activity</SectionHeading>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px,1fr))', gap: 12 }}>
                <StatCard icon="✅" label="Active Users"      accent={C.tc}
                  value={d.activeUsers} desc={`Users who wrote a letter in the last ${d.days}d`} />
                <StatCard icon="😴" label="Inactive Users"    accent={C.muted}  iconBg="rgba(140,132,120,0.1)"
                  value={d.inactiveUsers} desc="Registered but no letters this period" />
                <StatCard icon="🆕" label="New Signups"       accent={C.sage}
                  value={d.newUsers} desc={`Joined in the last ${d.days} day${d.days !== 1 ? 's' : ''}`} />
                <StatCard icon="⏳" label="Scheduled Queue"   accent={C.purple} iconBg={`${C.purple}15`}
                  value={d.scheduledLetters} desc="Letters queued for future delivery" />
              </div>
            </section>

            <section>
              <SectionHeading sub="Conversations currently in progress vs closed">Conversation Snapshot</SectionHeading>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px,1fr))', gap: 12 }}>
                <StatCard icon="💬" label="Active Convos"     accent={C.gold}   iconBg={`${C.gold}15`}
                  value={d.activeConversations} desc="Caring Stranger conversations still open" />
                <StatCard icon="✅" label="Ended Convos"      accent={C.sage}
                  value={d.endedConversations} desc={`Closed conversations · ${endRate}% end rate`} />
                <StatCard icon="📨" label="Total Messages"    accent={C.tc}
                  value={d.totalRepliesSent} desc="All messages sent across all conversations" />
                <StatCard icon="🫂" label="Stranger Letters"  accent="#7A6E5C"  iconBg="rgba(122,110,92,0.1)"
                  value={d.strangerLetters} desc={`Sent to anonymous readers · ${claimRate}% claimed`} />
              </div>
            </section>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB: ENGAGEMENT
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'engagement' && (
          <>
            <section>
              <SectionHeading sub={`Activity metrics over the last ${d.days} day${d.days !== 1 ? 's' : ''}`}>Activity This Period</SectionHeading>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 12 }}>
                <StatCard icon="✍️" label="Letters Created"  accent={C.tc}
                  value={d.totalLetters} desc={`Avg ${avgLetters} per registered user`} />
                <StatCard icon="📨" label="Letters Sent"     accent={C.gold}   iconBg={`${C.gold}15`}
                  value={d.sentLetters} desc={`${sendRate}% of all written letters were emailed`} />
                <StatCard icon="👁"  label="Unique Opens"    accent={C.sage}
                  value={d.openedLetters} desc={`${openRate}% open rate · per unique recipient`} />
                <StatCard icon="💬" label="Replies Received" accent={C.purple} iconBg={`${C.purple}15`}
                  value={d.totalRepliesSent} desc="Messages exchanged across all conversations" />
              </div>
            </section>

            {/* Open source breakdown */}
            {((d.openSources?.email ?? 0) > 0 || (d.openSources?.platform ?? 0) > 0) && (
              <section>
                <SectionHeading sub="How recipients opened letters — email pixel vs in-app view">Open Source Breakdown</SectionHeading>
                <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 28px', boxShadow: '0 1px 4px rgba(28,26,23,0.04)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 24 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 28, fontWeight: 700, fontFamily: '"Lora",serif', color: C.ink }}>{d.openSources?.email ?? 0}</span>
                      <span style={{ fontSize: 12, color: C.muted }}>letters</span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, marginBottom: 3 }}>📧 Opened via Email</div>
                    <div style={{ fontSize: 11, color: C.muted }}>Tracked by pixel when email client loaded the image</div>
                    <div style={{ marginTop: 10, height: 5, background: `${C.gold}20`, borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${pct(d.openSources?.email ?? 0, d.openedLetters || 1)}%`, height: '100%', background: C.gold, borderRadius: 99 }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 28, fontWeight: 700, fontFamily: '"Lora",serif', color: C.ink }}>{d.openSources?.platform ?? 0}</span>
                      <span style={{ fontSize: 12, color: C.muted }}>letters</span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, marginBottom: 3 }}>📱 Opened via App</div>
                    <div style={{ fontSize: 11, color: C.muted }}>Tracked when recipient opened letter in the platform</div>
                    <div style={{ marginTop: 10, height: 5, background: `${C.purple}20`, borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${pct(d.openSources?.platform ?? 0, d.openedLetters || 1)}%`, height: '100%', background: C.purple, borderRadius: 99 }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 28, fontWeight: 700, fontFamily: '"Lora",serif', color: C.ink }}>{d.openedLetters ?? 0}</span>
                      <span style={{ fontSize: 12, color: C.muted }}>letters</span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, marginBottom: 3 }}>👁 Unique Opens (Total)</div>
                    <div style={{ fontSize: 11, color: C.muted }}>One entry per person regardless of how they opened</div>
                    <div style={{ marginTop: 10, height: 5, background: `${C.sage}20`, borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${pct(d.openedLetters ?? 0, d.sentLetters || 1)}%`, height: '100%', background: C.sage, borderRadius: 99 }} />
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section>
              <SectionHeading sub="How well are letters being sent, read, and claimed?">Engagement Rates</SectionHeading>
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 28px', boxShadow: '0 1px 4px rgba(28,26,23,0.04)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 28 }}>
                <ProgressMetric
                  label="Email Open Rate"
                  desc="Of all sent emails, how many were opened"
                  value={d.openedLetters} max={d.sentLetters} color={C.tc} />
                <ProgressMetric
                  label="Send Rate"
                  desc="Of all letters written, how many were emailed"
                  value={d.sentLetters} max={d.totalLetters} color={C.gold} />
                <ProgressMetric
                  label="Stranger Claim Rate"
                  desc="Of stranger letters, how many were claimed"
                  value={d.claimedLetters} max={d.strangerLetters} color={C.purple} />
                <ProgressMetric
                  label="Conversation End Rate"
                  desc="Of all conversations, how many have ended"
                  value={d.endedConversations} max={d.totalConversations} color={C.sage} />
              </div>
            </section>

            <section>
              <SectionHeading sub="All-time letter lifecycle from creation to claimed — no date filter">Letter Lifecycle Funnel</SectionHeading>
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 28px', boxShadow: '0 1px 4px rgba(28,26,23,0.04)' }}>
                <Funnel steps={[
                  { label: 'Created',        value: funnel.total   || 0, icon: '✍️', color: C.ink    },
                  { label: 'Sent via Email', value: funnel.sent    || 0, icon: '📨', color: C.gold   },
                  { label: 'Opened',         value: funnel.opened  || 0, icon: '💌', color: C.tc     },
                  { label: 'Replied (Convos)',value: funnel.replied || 0, icon: '💬', color: C.sage   },
                  { label: 'Stranger Claimed',value: funnel.claimed || 0, icon: '🎯', color: C.purple },
                ]} />
              </div>
            </section>

            <section>
              <SectionHeading sub="Most prolific writers and most active listeners">Top Contributors</SectionHeading>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
                {/* Top senders */}
                <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(28,26,23,0.04)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: C.muted, marginBottom: 16 }}>Top Senders (by letters written)</div>
                  {(d.topSenders || []).length === 0
                    ? <div style={{ fontSize: 12.5, color: C.muted, fontStyle: 'italic' }}>No data yet.</div>
                    : (d.topSenders || []).map((u, i) => (
                        <BarRow key={i} label={u.name !== '—' ? u.name : u.email} value={u.count}
                          max={(d.topSenders || [])[0]?.count || 1}
                          color={AVATAR_COLORS[i % AVATAR_COLORS.length]} />
                      ))
                  }
                </div>
                {/* Top listeners */}
                <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(28,26,23,0.04)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: C.muted, marginBottom: 16 }}>Top Listeners (by conversations)</div>
                  {(d.topListeners || []).length === 0
                    ? <div style={{ fontSize: 12.5, color: C.muted, fontStyle: 'italic' }}>No data yet.</div>
                    : (d.topListeners || []).map((u, i) => (
                        <BarRow key={i} label={u.name !== '—' ? u.name : u.email} value={u.count}
                          max={(d.topListeners || [])[0]?.count || 1}
                          color={AVATAR_COLORS[(i + 2) % AVATAR_COLORS.length]} />
                      ))
                  }
                </div>
              </div>
            </section>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB: USERS
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'users' && (
          <>
            <section>
              <SectionHeading sub="User role distribution and signup acquisition channels">Demographics</SectionHeading>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
                <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(28,26,23,0.04)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: C.muted, marginBottom: 16 }}>Users by Role</div>
                  {[
                    { key: 'seeker',   label: 'Seeker',   icon: '✍️', color: C.tc },
                    { key: 'listener', label: 'Listener', icon: '🫂', color: C.sage },
                    { key: 'both',     label: 'Both',     icon: '🌿', color: C.purple },
                  ].map(r => (
                    <BarRow key={r.key} label={r.label} value={(d.roles || {})[r.key] || 0} max={d.totalUsers} color={r.color} icon={r.icon} />
                  ))}
                </div>
                <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(28,26,23,0.04)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: C.muted, marginBottom: 16 }}>Where Did They Hear About Us</div>
                  {(d.sources || []).length === 0
                    ? <div style={{ fontSize: 12.5, color: C.muted, fontStyle: 'italic' }}>No source data yet.</div>
                    : (d.sources || []).map((s, i) => (
                        <BarRow key={s._id} label={s._id} value={s.count} max={(d.sources || [])[0]?.count || 1}
                          color={[C.tc, C.sage, C.purple, C.gold, '#4A90C4', '#7A6E5C'][i % 6]} />
                      ))
                  }
                </div>
              </div>
            </section>

            <section>
              <SectionHeading sub="All users with full activity breakdown — sortable & searchable">User Directory</SectionHeading>
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(28,26,23,0.04)' }}>
                {/* Controls */}
                <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, background: '#FAFAF7', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="🔍  Search by name or email…"
                    value={search}
                    onChange={e => handleSearch(e.target.value)}
                    style={{
                      padding: '8px 14px', borderRadius: 99, fontSize: 13,
                      border: `1px solid ${C.border}`, outline: 'none',
                      fontFamily: '"DM Sans",sans-serif', color: C.ink,
                      background: C.white, width: '100%', maxWidth: 280,
                      transition: 'border 0.15s',
                    }}
                    onFocus={e => e.target.style.border = `1.5px solid ${C.ink}`}
                    onBlur={e  => e.target.style.border  = `1px solid ${C.border}`}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: C.muted }}>Sort by:</span>
                    {[
                      { id: 'written', label: 'Letters' },
                      { id: 'sent',    label: 'Sent' },
                      { id: 'opened',  label: 'Opened' },
                      { id: 'joined',  label: 'Newest' },
                    ].map(s => (
                      <Chip key={s.id} label={s.label} active={userSort === s.id} onClick={() => setUserSort(s.id)} />
                    ))}
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: 11.5, color: C.muted, whiteSpace: 'nowrap' }}>
                    {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr>
                        <TH>User</TH>
                        <TH>Email</TH>
                        <TH>Auth</TH>
                        <TH>Role</TH>
                        <TH center>Written</TH>
                        <TH center>Sent</TH>
                        <TH center>Opened</TH>
                        <TH center>Scheduled</TH>
                        <TH center>Personal</TH>
                        <TH center>Strangers</TH>
                        <TH>Joined</TH>
                        <TH>Last Active</TH>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={12} style={{ padding: '48px', textAlign: 'center', color: C.muted, fontFamily: '"DM Sans",sans-serif', fontSize: 13 }}>
                            {search ? `No users match "${search}"` : 'No users registered yet.'}
                          </td>
                        </tr>
                      ) : paginatedUsers.map((u, i) => (
                        <tr key={i}
                          style={{ borderTop: `1px solid rgba(28,26,23,0.05)`, background: i % 2 === 0 ? C.white : '#FAFAF7', transition: 'background 0.12s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#F5F1EA'}
                          onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? C.white : '#FAFAF7'}
                        >
                          <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Avatar name={u.name} idx={i} />
                              <span style={{ fontWeight: 600, color: C.ink, fontFamily: '"DM Sans",sans-serif', fontSize: 13 }}>{u.name || '—'}</span>
                            </div>
                          </td>
                          <TD small muted maxW={200} nowrap>{u.email}</TD>
                          <td style={{ padding: '10px 12px' }}><Badge label={u.provider} color={PROVIDER_COLOR[u.provider] || '#4A4640'} /></td>
                          <td style={{ padding: '10px 12px' }}><Badge label={u.role || 'both'} color={ROLE_COLOR[u.role] || C.purple} /></td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: C.tc, fontFamily: '"DM Sans",sans-serif' }}>{u.written}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: C.gold, fontFamily: '"DM Sans",sans-serif' }}>{u.sent}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: C.sage, fontFamily: '"DM Sans",sans-serif' }}>{u.opened}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: C.purple, fontFamily: '"DM Sans",sans-serif' }}>{u.scheduled}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: '#4A4640', fontFamily: '"DM Sans",sans-serif' }}>{u.personal}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: '#7A6E5C', fontFamily: '"DM Sans",sans-serif' }}>{u.stranger}</td>
                          <TD small muted nowrap>{fmtDate(u.joinedAt)}</TD>
                          <TD small muted nowrap>{fmtDate(u.lastActive)}</TD>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredUsers.length > PER_PAGE && (
                  <div style={{ padding: '14px 18px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                      style={{ padding: '7px 18px', borderRadius: 8, fontSize: 13, cursor: page === 1 ? 'default' : 'pointer', fontFamily: '"DM Sans",sans-serif', background: C.white, border: `1px solid ${C.border}`, color: C.ink, opacity: page === 1 ? 0.35 : 1 }}>
                      ← Previous
                    </button>
                    <span style={{ fontSize: 12.5, color: C.muted }}>
                      Page <strong style={{ color: C.ink }}>{page}</strong> of <strong style={{ color: C.ink }}>{totalPages}</strong>
                    </span>
                    <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                      style={{ padding: '7px 18px', borderRadius: 8, fontSize: 13, cursor: page >= totalPages ? 'default' : 'pointer', fontFamily: '"DM Sans",sans-serif', background: C.white, border: `1px solid ${C.border}`, color: C.ink, opacity: page >= totalPages ? 0.35 : 1 }}>
                      Next →
                    </button>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB: LETTERS
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'letters' && (
          <>
            <section>
              <SectionHeading sub="Mood distribution across all letters ever written">Mood Distribution</SectionHeading>
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(28,26,23,0.04)' }}>
                {(d.moods || []).length === 0
                  ? <div style={{ fontSize: 12.5, color: C.muted, fontStyle: 'italic' }}>No mood data yet.</div>
                  : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '4px 28px' }}>
                      {(d.moods || []).map((m, i) => {
                        const MOOD_ICON  = { joy: '😊', sad: '😔', caring: '🫂', hope: '🌱', lonely: '🌧️', gratitude: '🙏' }
                        const MOOD_COLOR = { joy: C.gold, sad: '#4A90C4', caring: C.sage, hope: '#6BAA62', lonely: C.purple, gratitude: C.tc }
                        const color = MOOD_COLOR[m._id?.toLowerCase()] || [C.tc, C.sage, C.purple, C.gold][i % 4]
                        const icon  = MOOD_ICON[m._id?.toLowerCase()] || '💬'
                        return <BarRow key={m._id} label={m._id} value={m.count} max={(d.moods || [])[0]?.count || 1} color={color} icon={icon} />
                      })}
                    </div>
                  )
                }
              </div>
            </section>

            <section>
              <SectionHeading sub="Most recent 20 letters sent across all users">Recent Letters</SectionHeading>
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(28,26,23,0.04)' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr>
                        <TH>Sender</TH>
                        <TH>Subject</TH>
                        <TH>Type</TH>
                        <TH>Status</TH>
                        <TH>Recipient</TH>
                        <TH>Date &amp; Time</TH>
                      </tr>
                    </thead>
                    <tbody>
                      {(d.recentLetters || []).length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: C.muted, fontStyle: 'italic', fontFamily: '"Lora",serif', fontSize: 14 }}>
                            No letters found.
                          </td>
                        </tr>
                      ) : (d.recentLetters || []).map((l, i) => (
                        <tr key={i}
                          style={{ borderTop: `1px solid rgba(28,26,23,0.05)`, background: i % 2 === 0 ? C.white : '#FAFAF7', transition: 'background 0.12s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#F5F1EA'}
                          onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? C.white : '#FAFAF7'}
                        >
                          <TD small muted maxW={180} nowrap>{l.senderEmail}</TD>
                          <TD bold maxW={220} nowrap>{l.subject || <span style={{ color: C.muted, fontWeight: 400 }}>No subject</span>}</TD>
                          <td style={{ padding: '10px 12px' }}><Badge label={l.type} color={STATUS_COLOR[l.type] || '#4A4640'} /></td>
                          <td style={{ padding: '10px 12px' }}><Badge label={l.status} color={STATUS_COLOR[l.status] || '#4A4640'} /></td>
                          <TD small muted maxW={180} nowrap>{l.toEmail || '—'}</TD>
                          <TD small muted nowrap>{fmtDateTime(l.createdAt)}</TD>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB: NOTIFICATIONS
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'notifications' && (
          <section>
            <SectionHeading sub="Caring Stranger conversations and platform notification stats">Conversations &amp; Notifications</SectionHeading>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
              {/* Conversation stats */}
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(28,26,23,0.04)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: C.muted, marginBottom: 16 }}>Conversations</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  {[
                    { label: 'Total',        value: d.totalConversations,  color: C.ink },
                    { label: 'Active',        value: d.activeConversations, color: C.gold },
                    { label: 'Ended',         value: d.endedConversations,  color: C.tc },
                    { label: 'Messages Sent', value: d.totalRepliesSent,    color: C.sage },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: 'center', padding: '10px 8px', background: C.paper, borderRadius: 10 }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: '"Lora",serif', lineHeight: 1 }}>{fmt(s.value)}</div>
                      <div style={{ fontSize: 10.5, color: C.muted, marginTop: 4 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: C.muted, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Ended by seeker</span>
                    <strong style={{ color: C.tc }}>{fmt(d.endedBySeeker)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Ended by listener</span>
                    <strong style={{ color: C.sage }}>{fmt(d.endedByListener)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>End rate</span>
                    <strong style={{ color: C.purple }}>{endRate}%</strong>
                  </div>
                </div>
              </div>

              {/* Notification stats */}
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(28,26,23,0.04)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: C.muted, marginBottom: 16 }}>Notifications</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  {[
                    { label: 'Total',  value: d.totalNotifs,  color: C.ink },
                    { label: 'Unread', value: d.unreadNotifs, color: C.tc },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: 'center', padding: '10px 8px', background: C.paper, borderRadius: 10 }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: '"Lora",serif', lineHeight: 1 }}>{fmt(s.value)}</div>
                      <div style={{ fontSize: 10.5, color: C.muted, marginTop: 4 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: C.muted }}>
                  {(d.notifByType || []).map((n, i) => {
                    const NOTIF_ICON  = { reply: '💬', claim: '💌', delivery: '📬', system: '⚙️', general: '🔔' }
                    const NOTIF_COLOR = { reply: C.tc, claim: C.sage, delivery: C.gold, system: C.purple, general: '#4A4640' }
                    const color = NOTIF_COLOR[n._id] || '#4A4640'
                    const icon  = NOTIF_ICON[n._id]  || '🔔'
                    return (
                      <div key={n._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: i < (d.notifByType || []).length - 1 ? `1px solid ${C.border}` : 'none' }}>
                        <span style={{ textTransform: 'capitalize' }}>{icon} {n._id}</span>
                        <strong style={{ color }}>{fmt(n.count)}</strong>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB: TRENDS
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'trends' && (
          <section>
            <SectionHeading sub={`Daily activity over the last ${d.days} day${d.days !== 1 ? 's' : ''}`}>Daily Trends</SectionHeading>
            {((d.letterTrend || []).length < 2 && (d.userTrend || []).length < 2) ? (
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: '48px', textAlign: 'center', color: C.muted, fontStyle: 'italic', fontFamily: '"Lora",serif' }}>
                Not enough data for trend charts — try a wider date range.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
                {[
                  { title: 'Letters Created / Day', data: d.letterTrend || [], key: 'letters', color: C.tc },
                  { title: 'Emails Sent / Day',     data: d.letterTrend || [], key: 'sent',    color: C.gold },
                  { title: 'New Users / Day',        data: d.userTrend  || [], key: 'count',   color: C.sage },
                ].map(({ title, data: tdata, key, color }) => {
                  const mapped = tdata.map(r => ({ count: r[key] ?? 0 }))
                  const total  = mapped.reduce((s, r) => s + r.count, 0)
                  return (
                    <div key={title} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(28,26,23,0.04)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: C.muted }}>{title}</div>
                          <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: '"Lora",serif', marginTop: 4, lineHeight: 1 }}>{fmt(total)}</div>
                          <div style={{ fontSize: 10.5, color: C.muted, marginTop: 2 }}>total this period</div>
                        </div>
                      </div>
                      <Sparkline data={mapped} color={color} height={44} width={220} />
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  )
}
