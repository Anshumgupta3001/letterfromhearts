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

// ── Stat Card — THREE layers: label + number + description ───────────────────
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

// ── Sort / Filter Button ──────────────────────────────────────────────────────
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

// Avatar initials circle
const AVATAR_COLORS = [C.tc, C.sage, C.purple, C.gold, '#4A90C4', '#7A6E5C']
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

// ── Table header cell ─────────────────────────────────────────────────────────
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

// ── Table data cell ───────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [key,      setKey]      = useState('')
  const [days,     setDays]     = useState(7)
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [tab,      setTab]      = useState('recent')
  const [userSort, setUserSort] = useState('written')
  const [search,   setSearch]   = useState('')
  const [page,     setPage]     = useState(1)

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

  // ── Dashboard ─────────────────────────────────────────────────────────────────
  const d = data
  const openRate  = pct(d.openedLetters,  d.sentLetters)
  const sendRate  = pct(d.sentLetters,    d.totalLetters)
  const claimRate = pct(d.claimedLetters, d.strangerLetters)
  const avgLetters = d.totalUsers > 0 ? (d.totalLetters / d.totalUsers).toFixed(1) : '0'

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

      {/* ── Sub-header ── */}
      <div style={{ background: C.white, padding: '16px clamp(16px,4vw,52px)', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: '"Lora",serif', fontSize: 21, fontWeight: 700, color: C.ink }}>Analytics Overview</div>
          <div style={{ fontSize: 12.5, color: C.muted, marginTop: 3 }}>
            Last <strong style={{ color: C.ink }}>{d.days} day{d.days !== 1 ? 's' : ''}</strong> · {fmt(d.totalUsers)} total registered users · data refreshes on demand
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Email Open Rate', value: `${d.openRate}%`, color: C.tc, tip: 'Of sent emails' },
            { label: 'New Signups',     value: fmt(d.newUsers),  color: C.sage, tip: 'This period' },
            { label: 'Scheduled Queue', value: fmt(d.scheduledLetters), color: C.purple, tip: 'Awaiting delivery' },
          ].map((kpi, i, arr) => (
            <div key={kpi.label} style={{ display: 'flex', gap: 20 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: kpi.color, fontFamily: '"Lora",serif', lineHeight: 1 }}>{kpi.value}</div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', color: C.muted, marginTop: 3 }}>{kpi.label}</div>
                <div style={{ fontSize: 10.5, color: C.muted, marginTop: 1 }}>{kpi.tip}</div>
              </div>
              {i < arr.length - 1 && <div style={{ width: 1, background: C.border, alignSelf: 'stretch' }} />}
            </div>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ padding: '28px clamp(16px,4vw,52px)', display: 'flex', flexDirection: 'column', gap: 36 }}>

        {/* ── SECTION 1: Overview ── */}
        <section>
          <SectionHeading sub="Platform-wide totals, not limited by date filter">Overview</SectionHeading>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px,1fr))', gap: 12 }}>
            <StatCard icon="👥" label="Total Users"        accent={C.ink}    iconBg="rgba(28,26,23,0.08)"
              value={d.totalUsers}
              desc="All registered accounts — email + Google" />
            <StatCard icon="📧" label="Email / Password"   accent="#4A4640"  iconBg="rgba(74,70,64,0.09)"
              value={d.totalEmailUsers}
              desc="Users who signed up with an email address and password" />
            <StatCard icon="🔑" label="Google Sign-In"     accent={C.google} iconBg="rgba(234,67,53,0.09)"
              value={d.totalGoogleUsers}
              desc="Users who authenticated via Google OAuth" />
            <StatCard icon="🔗" label="Custom SMTP"        accent={C.sage}   iconBg={`${C.sage}15`}
              value={d.emailConnections}
              desc="Users who connected their own email account to send from" />
          </div>
        </section>

        {/* ── SECTION 2: Engagement ── */}
        <section>
          <SectionHeading sub={`Activity over the last ${d.days} day${d.days !== 1 ? 's' : ''}`}>Engagement</SectionHeading>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 12 }}>
            <StatCard icon="✍️" label="Letters Created"   accent={C.tc}
              value={d.totalLetters}
              desc={`Total letters drafted by all users · avg ${avgLetters} per user`} />
            <StatCard icon="⏳" label="Scheduled Emails"  accent={C.purple} iconBg={`${C.purple}15`}
              value={d.scheduledLetters}
              desc="Letters queued for future delivery — not yet sent" />
            <StatCard icon="🫂" label="Personal Letters"  accent="#4A4640"  iconBg="rgba(74,70,64,0.09)"
              value={d.personalLetters}
              desc="Private letters saved to user's own journal — not emailed" />
            <StatCard icon="💬" label="Stranger Letters"  accent="#7A6E5C"  iconBg="rgba(122,110,92,0.1)"
              value={d.strangerLetters}
              desc={`Letters sent to anonymous readers · ${fmt(d.claimedLetters)} claimed`} />
          </div>
        </section>

        {/* ── SECTION 3: Email Activity ── */}
        <section>
          <SectionHeading sub={`Delivery and open metrics over the last ${d.days} day${d.days !== 1 ? 's' : ''}`}>Email Activity</SectionHeading>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 12 }}>
            <StatCard icon="📨" label="Emails Sent"       accent={C.gold}   iconBg={`${C.gold}15`}
              value={d.sentLetters}
              desc={`Emails delivered to recipients · ${sendRate}% of all letters written`} />
            <StatCard icon="💌" label="Emails Opened"     accent={C.sage}
              value={d.openedLetters}
              desc={`Emails the recipient actually opened · ${openRate}% open rate`} />
            <StatCard icon="👤" label="New Signups"       accent={C.tc}
              value={d.newUsers}
              desc={`New users who joined in the last ${d.days} day${d.days !== 1 ? 's' : ''}`} />
          </div>
        </section>

        {/* ── Engagement Rates ── */}
        <section>
          <SectionHeading sub="How well are letters being sent, read, and claimed?">Engagement Rates</SectionHeading>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 28px', boxShadow: '0 1px 4px rgba(28,26,23,0.04)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 28 }}>
            <ProgressMetric
              label="Email Open Rate"
              desc="Of all sent emails, how many were opened by the recipient"
              value={d.openedLetters} max={d.sentLetters} color={C.tc} />
            <ProgressMetric
              label="Send Rate"
              desc="Of all letters written, how many were actually emailed out"
              value={d.sentLetters} max={d.totalLetters} color={C.gold} />
            <ProgressMetric
              label="Stranger Letter Claim Rate"
              desc="Of letters sent to strangers, how many were claimed or read"
              value={d.claimedLetters} max={d.strangerLetters} color={C.purple} />
          </div>
        </section>

        {/* ── Tabs ── */}
        <section>
          {/* Tab strip */}
          <div style={{ display: 'flex', background: C.white, borderRadius: '16px 16px 0 0', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
            {[
              { id: 'recent', label: '📬 Recent Letters', desc: 'Last 20 letters sent across all users' },
              { id: 'users',  label: '👤 User Directory', desc: 'All users with activity breakdown' },
            ].map((t, i, arr) => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, padding: '13px 20px', fontSize: 13, border: 'none',
                background: tab === t.id ? C.white : '#F2EEE8',
                fontFamily: '"DM Sans",sans-serif', cursor: 'pointer',
                color: tab === t.id ? C.ink : C.muted,
                fontWeight: tab === t.id ? 600 : 400,
                borderBottom: tab === t.id ? `2.5px solid ${C.tc}` : '2.5px solid transparent',
                borderRight: i < arr.length - 1 ? `1px solid ${C.border}` : 'none',
                transition: 'all 0.15s', textAlign: 'left',
              }}>
                <div>{t.label}</div>
                <div style={{ fontSize: 10.5, color: C.muted, fontWeight: 400, marginTop: 1 }}>{t.desc}</div>
              </button>
            ))}
          </div>

          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderTop: 'none', borderRadius: '0 0 16px 16px', overflow: 'hidden' }}>

            {/* ── Recent Letters tab ── */}
            {tab === 'recent' && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      <TH>Sender</TH>
                      <TH>Subject Line</TH>
                      <TH>Letter Type</TH>
                      <TH>Delivery Status</TH>
                      <TH>Recipient Email</TH>
                      <TH>Date &amp; Time</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {(d.recentLetters || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: C.muted, fontStyle: 'italic', fontFamily: '"Lora",serif', fontSize: 14 }}>
                          No letters found for this time period.
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
            )}

            {/* ── User Directory tab ── */}
            {tab === 'users' && (
              <div>
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
                    <span style={{ fontSize: 11, color: C.muted, fontFamily: '"DM Sans",sans-serif' }}>Sort by:</span>
                    {[
                      { id: 'written', label: 'Letters Created' },
                      { id: 'sent',    label: 'Emails Sent' },
                      { id: 'opened',  label: 'Emails Opened' },
                      { id: 'joined',  label: 'Newest First' },
                    ].map(s => (
                      <Chip key={s.id} label={s.label} active={userSort === s.id} onClick={() => setUserSort(s.id)} />
                    ))}
                  </div>
                </div>

                {/* Legend + count */}
                <div style={{ padding: '10px 18px', borderBottom: `1px solid ${C.border}`, background: '#FDFCFA', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ fontSize: 11, color: C.muted, fontFamily: '"DM Sans",sans-serif' }}>
                    <strong style={{ color: C.tc }}>Letters Created</strong> = total drafted &nbsp;·&nbsp;
                    <strong style={{ color: C.gold }}>Emails Sent</strong> = delivered to inbox &nbsp;·&nbsp;
                    <strong style={{ color: C.sage }}>Emails Opened</strong> = recipient viewed &nbsp;·&nbsp;
                    <strong style={{ color: C.purple }}>Scheduled</strong> = queued for later
                  </div>
                  <div style={{ fontSize: 11.5, color: C.muted, fontFamily: '"DM Sans",sans-serif', whiteSpace: 'nowrap' }}>
                    Showing <strong style={{ color: C.ink }}>{paginatedUsers.length}</strong> of <strong style={{ color: C.ink }}>{filteredUsers.length}</strong> user{filteredUsers.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr>
                        <TH>User</TH>
                        <TH>Email Address</TH>
                        <TH>Sign-in Method</TH>
                        <TH>Account Role</TH>
                        <TH center>Letters Created</TH>
                        <TH center>Emails Sent</TH>
                        <TH center>Emails Opened</TH>
                        <TH center>Scheduled</TH>
                        <TH center>Personal</TH>
                        <TH center>Strangers</TH>
                        <TH>Date Joined</TH>
                        <TH>Last Active</TH>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={12} style={{ padding: '48px', textAlign: 'center', color: C.muted, fontFamily: '"DM Sans",sans-serif', fontSize: 13 }}>
                            {search
                              ? `No users match "${search}". Try a different name or email.`
                              : 'No users registered yet.'}
                          </td>
                        </tr>
                      ) : paginatedUsers.map((u, i) => (
                        <tr key={i}
                          style={{ borderTop: `1px solid rgba(28,26,23,0.05)`, background: i % 2 === 0 ? C.white : '#FAFAF7', transition: 'background 0.12s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#F5F1EA'}
                          onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? C.white : '#FAFAF7'}
                        >
                          {/* User + avatar */}
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

                {/* Pagination */}
                {filteredUsers.length > PER_PAGE && (
                  <div style={{ padding: '14px 18px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                      style={{
                        padding: '7px 18px', borderRadius: 8, fontSize: 13, cursor: page === 1 ? 'default' : 'pointer',
                        fontFamily: '"DM Sans",sans-serif', background: C.white,
                        border: `1px solid ${C.border}`, color: C.ink,
                        opacity: page === 1 ? 0.35 : 1, transition: 'opacity 0.15s',
                      }}
                    >← Previous</button>
                    <span style={{ fontSize: 12.5, color: C.muted, fontFamily: '"DM Sans",sans-serif' }}>
                      Page <strong style={{ color: C.ink }}>{page}</strong> of <strong style={{ color: C.ink }}>{totalPages}</strong>
                    </span>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => p + 1)}
                      style={{
                        padding: '7px 18px', borderRadius: 8, fontSize: 13, cursor: page >= totalPages ? 'default' : 'pointer',
                        fontFamily: '"DM Sans",sans-serif', background: C.white,
                        border: `1px solid ${C.border}`, color: C.ink,
                        opacity: page >= totalPages ? 0.35 : 1, transition: 'opacity 0.15s',
                      }}
                    >Next →</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  )
}
