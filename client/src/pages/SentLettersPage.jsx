import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'

const BD = '#E0D4BC'
const FT = '#F2EBE0'

const STATUS_META = {
  sent:    { label: 'Sent',   color: 'var(--ink-muted)', bg: '#EDE5D4',                      border: BD,                           accent: 'linear-gradient(180deg, var(--gold), var(--ink-muted))' },
  opened:  { label: 'Opened', color: 'var(--sage)',      bg: 'rgba(122,158,142,0.1)',         border: 'rgba(122,158,142,0.3)',       accent: 'linear-gradient(180deg, var(--sage), var(--gold))' },
  // clicked = also opened; show identical "Opened" UI
  clicked: { label: 'Opened', color: 'var(--sage)',      bg: 'rgba(122,158,142,0.1)',         border: 'rgba(122,158,142,0.3)',       accent: 'linear-gradient(180deg, var(--sage), var(--gold))' },
  failed:  { label: 'Failed', color: 'var(--tc)',        bg: 'rgba(196,99,58,0.1)',           border: 'rgba(196,99,58,0.3)',         accent: 'linear-gradient(180deg, var(--tc), var(--gold))' },
}

function SentCard({ letter }) {
  const [hov, setHov] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const meta    = STATUS_META[letter.status] || STATUS_META.sent
  const date    = new Date(letter.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const isLong  = letter.message?.length > 220

  const fmtDate = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: '#fff', borderRadius: 14, border: `1px solid ${BD}`,
        overflow: 'hidden', position: 'relative',
        transform: hov ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hov ? '0 14px 40px rgba(26,18,8,0.09)' : 'none',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Left accent */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: meta.accent, borderRadius: '4px 0 0 4px' }} />

      {/* Card body */}
      <div style={{ padding: '26px 28px 22px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
          <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: 20, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.2, letterSpacing: '-0.2px' }}>
            {letter.subject}
          </h3>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, padding: '5px 11px', borderRadius: 20, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', background: meta.bg, color: meta.color, flexShrink: 0, border: `1px solid ${meta.border}` }}>
            {letter.status === 'sent' ? '📤' : (letter.status === 'opened' || letter.status === 'clicked') ? '👁' : '⚠️'} {meta.label}
          </span>
        </div>

        <div style={{ fontFamily: 'Lora, serif', fontSize: 14.5, color: 'var(--ink-soft)', marginBottom: 10, fontWeight: 500 }}>
          To: {letter.toEmail}
        </div>

        {letter.message && (
          <p style={{
            fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 14,
            color: 'var(--ink-muted)', lineHeight: 1.7, marginBottom: 16,
            whiteSpace: 'pre-line',
            ...(expanded ? {} : { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }),
          }}>
            {letter.message}
          </p>
        )}

        {isLong && (
          <button onClick={() => setExpanded(e => !e)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--tc)', fontWeight: 500, cursor: 'pointer', background: 'none', border: 'none', marginBottom: 8, fontFamily: '"DM Sans", sans-serif' }}>
            {expanded ? 'Show less ↑' : 'Read more →'}
          </button>
        )}

        {/* Tracking info — single "Opened" tag; click also counts as open */}
        {letter.openedAt && (
          <div style={{ marginTop: 4 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(122,158,142,0.08)', color: 'var(--sage)', border: '1px solid rgba(122,158,142,0.2)' }}>
              👁 Opened · {fmtDate(letter.openedAt)}
            </span>
          </div>
        )}
      </div>

      {/* Card footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, padding: '14px 28px 14px 32px', borderTop: `1px solid ${FT}`, background: 'rgba(245,240,232,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--ink-muted)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5 }}>
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {date}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-muted)', fontFamily: 'Lora, serif', fontStyle: 'italic', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
          From: {letter.fromEmail}
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SentLettersPage() {
  const { sentLetters, refreshLetters, navigate } = useApp()
  const [writeBtnHov, setWriteBtnHov] = useState(false)

  useEffect(() => { refreshLetters() }, [refreshLetters])

  return (
    <main className="page-enter w-full flex justify-center px-4 sm:px-6" style={{ paddingTop: 56, paddingBottom: 80 }}>
      <div className="w-full max-w-3xl lg:max-w-4xl">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 40, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 18, height: 1, background: BD, display: 'inline-block' }} />
            Your outbox
          </div>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.1, letterSpacing: '-0.5px', marginBottom: 12 }}>
            <span style={{ display: 'inline-block', width: 38, height: 38, background: 'linear-gradient(135deg, #fdf6e8, #fdfae8)', borderRadius: 10, textAlign: 'center', lineHeight: '38px', fontSize: 20, marginRight: 10, verticalAlign: 'middle', position: 'relative', top: -3, border: `1px solid ${BD}` }}>📬</span>
            Sent Letters
          </h1>
          <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.65, maxWidth: 420 }}>
            Letters you've sent via email — with open tracking so you know they arrived.
          </p>
        </div>
        <button
          onClick={() => navigate('write')}
          onMouseEnter={() => setWriteBtnHov(true)}
          onMouseLeave={() => setWriteBtnHov(false)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: writeBtnHov ? '#8a7050' : 'var(--gold)', color: '#fff', border: 'none', borderRadius: 10, padding: '14px 24px', fontFamily: '"DM Sans", sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer', flexShrink: 0, marginTop: 12, boxShadow: writeBtnHov ? '0 8px 22px rgba(200,148,58,0.3)' : '0 4px 14px rgba(200,148,58,0.25)', transform: writeBtnHov ? 'translateY(-2px)' : 'translateY(0)', transition: 'all 0.2s' }}
        >
          <span>✦</span> Write a letter
        </button>
      </div>

      {/* ── Count row ───────────────────────────────────────────────── */}
      {sentLetters.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ background: '#EDE5D4', color: 'var(--ink-soft)', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, marginRight: 8 }}>
            {sentLetters.length} letter{sentLetters.length !== 1 ? 's' : ''}
          </span>
          <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>sorted by newest</span>
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────────── */}
      {sentLetters.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '72px 40px', borderRadius: 16, background: 'rgba(255,255,255,0.5)', border: `1.5px dashed ${BD}` }}>
          <div style={{ fontSize: 48, marginBottom: 20, opacity: 0.35 }}>📭</div>
          <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }}>No letters sent yet</div>
          <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 14.5, color: 'var(--ink-muted)', lineHeight: 1.75, maxWidth: 300, margin: '0 auto 28px' }}>
            Write a letter and send it to someone you care about. You'll know when they open it.
          </p>
          <button onClick={() => navigate('write')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 24px', fontFamily: '"DM Sans", sans-serif', fontSize: 13, fontWeight: 500, cursor: 'pointer', boxShadow: '0 4px 14px rgba(200,148,58,0.25)', transition: 'all 0.2s' }}>
            Write your first letter
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sentLetters.map(letter => <SentCard key={letter._id} letter={letter} />)}
        </div>
      )}
      </div>
    </main>
  )
}
