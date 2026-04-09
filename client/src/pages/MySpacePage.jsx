import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { apiFetch } from '../utils/api'

const BD = '#E0D4BC'
const FT = '#F2EBE0'

// ── Shared letter card (same design as global system) ─────────────────────────
function LetterCard({ letter, onEdit, onDelete, onOpen, accentGrad, tagLabel, tagBg, tagColor, tagBorder }) {
  const [hov, setHov] = useState(false)
  const [editHov, setEditHov] = useState(false)
  const [delHov, setDelHov]   = useState(false)

  const date   = new Date(letter.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const isPersonal = letter.type === 'personal'

  // status: 'sent' | 'opened' | 'clicked' | 'failed' | 'saved'
  const isOpened = letter.status === 'opened' || letter.status === 'clicked'
  const isSentLetter = letter.type === 'sent'

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
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: accentGrad, borderRadius: '4px 0 0 4px' }} />

      {/* Card body — clickable to open */}
      <div
        style={{ padding: '22px 22px 18px 28px', cursor: 'pointer' }}
        onClick={() => onOpen(letter)}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, marginBottom: 12 }}>
          <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: 19, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.2, letterSpacing: '-0.2px' }}>
            {letter.subject}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, padding: '5px 11px', borderRadius: 20, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', background: tagBg, color: tagColor, border: `1px solid ${tagBorder}` }}>
              ✦ {tagLabel}
            </span>
            {/* "Heard" indicator — stranger letters claimed by a listener */}
            {letter.type === 'stranger' && (letter.isClaimed || letter.isRead) && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '3px 9px', borderRadius: 20, fontWeight: 500, background: 'rgba(139,126,200,0.1)', color: 'var(--purple)', border: '1px solid rgba(139,126,200,0.25)' }}>
                ✓ Heard by a listener
              </span>
            )}
            {letter.type === 'stranger' && !letter.isClaimed && !letter.isRead && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '3px 9px', borderRadius: 20, fontWeight: 500, background: 'rgba(28,26,23,0.04)', color: 'var(--ink-muted)', border: '1px solid rgba(28,26,23,0.1)' }}>
                · Waiting to be heard
              </span>
            )}
          </div>
        </div>

        <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 13.5, color: 'var(--ink-muted)', lineHeight: 1.7, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {letter.message}
        </p>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 22px 12px 28px', borderTop: `1px solid ${FT}`, background: 'rgba(245,240,232,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-muted)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5 }}>
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {date}
          </div>
          {/* Open status badge — only for sent letters */}
          {isSentLetter && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 10.5, padding: '3px 9px', borderRadius: 20, fontWeight: 500,
              letterSpacing: '0.3px', fontFamily: '"DM Sans", sans-serif',
              background: isOpened ? 'rgba(90,158,122,0.1)' : 'rgba(28,26,23,0.05)',
              color: isOpened ? 'var(--sage)' : 'var(--ink-muted)',
              border: `1px solid ${isOpened ? 'rgba(90,158,122,0.25)' : 'rgba(28,26,23,0.1)'}`,
            }}>
              {isOpened ? '✓ Opened' : '· Not opened'}
            </span>
          )}
        </div>
        {/* Only personal letters can be edited/deleted */}
        {isPersonal && onEdit && onDelete && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={e => { e.stopPropagation(); onEdit(letter) }}
              onMouseEnter={() => setEditHov(true)}
              onMouseLeave={() => setEditHov(false)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: '"DM Sans", sans-serif', transition: 'all 0.15s', border: editHov ? '1.5px solid var(--gold)' : '1.5px solid #E0D4BC', color: editHov ? 'var(--gold)' : 'var(--ink-soft)', background: editHov ? '#fef9f2' : 'transparent' }}
            >✏ Edit</button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(letter) }}
              onMouseEnter={() => setDelHov(true)}
              onMouseLeave={() => setDelHov(false)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: '"DM Sans", sans-serif', transition: 'all 0.15s', border: delHov ? '1.5px solid var(--tc)' : '1.5px solid #f5d4ce', color: delHov ? '#fff' : 'var(--tc)', background: delHov ? 'var(--tc)' : 'transparent' }}
            >✕ Delete</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ letter, onSave, onClose }) {
  const [subject, setSubject] = useState(letter.subject)
  const [message, setMessage] = useState(letter.message)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  async function handleSave() {
    setError('')
    if (!message.trim()) { setError('Message cannot be empty.'); return }
    setSaving(true)
    try {
      const res  = await apiFetch(`/api/letters/${letter._id}`, { method: 'PUT', body: JSON.stringify({ subject, message }) })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Failed to save.'); return }
      onSave(json.data)
    } catch { setError('Network error.') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center" style={{ background: 'rgba(26,18,8,0.45)', backdropFilter: 'blur(4px)' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-[560px] mx-4 overflow-hidden animate-fade-up" style={{ background: 'var(--cream)', border: `1px solid ${BD}`, borderRadius: 16, boxShadow: '0 24px 64px rgba(26,18,8,0.18)' }}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: `1px solid ${FT}` }}>
          <span style={{ fontFamily: '"Playfair Display", serif', fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>Edit Letter</span>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center cursor-pointer bg-transparent border-none text-[20px]" style={{ color: 'var(--ink-muted)' }}>×</button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-[1px] font-medium" style={{ color: 'var(--ink-muted)' }}>Subject</span>
            <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-3 py-[10px] rounded-[8px] font-sans text-[13px] outline-none" style={{ background: 'var(--paper)', border: `1px solid ${BD}`, color: 'var(--ink)' }} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-[1px] font-medium" style={{ color: 'var(--ink-muted)' }}>Message</span>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={10} className="w-full px-3 py-[10px] rounded-[8px] font-lora text-[14px] leading-[1.9] outline-none resize-none" style={{ background: 'var(--paper)', border: `1px solid ${BD}`, color: 'var(--ink-soft)' }} />
          </label>
          {error && <div className="text-[12px] px-3 py-2 rounded-[7px]" style={{ color: 'var(--tc)', background: 'rgba(196,99,58,0.07)', border: '1px solid rgba(196,99,58,0.2)' }}>{error}</div>}
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="px-5 py-[9px] rounded-pill font-sans text-[13px] cursor-pointer bg-transparent" style={{ color: 'var(--ink-muted)', border: `1px solid ${BD}` }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-5 py-[9px] rounded-pill font-sans text-[13px] font-medium border-none cursor-pointer disabled:opacity-50" style={{ background: 'var(--ink)', color: 'var(--cream)' }}>{saving ? 'Saving…' : 'Save changes'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Delete Modal ──────────────────────────────────────────────────────────────
function DeleteModal({ letter, onConfirm, onClose, deleting }) {
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center" style={{ background: 'rgba(26,18,8,0.45)', backdropFilter: 'blur(4px)' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-[400px] mx-4 overflow-hidden animate-fade-up" style={{ background: 'var(--cream)', border: `1px solid ${BD}`, borderRadius: 16, boxShadow: '0 24px 64px rgba(26,18,8,0.18)' }}>
        <div className="px-6 py-6 text-center">
          <div className="text-[32px] mb-3">🗑️</div>
          <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 18, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>Delete this letter?</div>
          <div className="text-[13px] font-light mb-1" style={{ color: 'var(--ink-muted)' }}>"{letter.subject}"</div>
          <div className="text-[12px] font-light mb-6" style={{ color: 'var(--ink-muted)' }}>This cannot be undone.</div>
          <div className="flex gap-2 justify-center">
            <button onClick={onClose} className="px-5 py-[9px] rounded-pill font-sans text-[13px] cursor-pointer bg-transparent" style={{ color: 'var(--ink-muted)', border: `1px solid ${BD}` }}>Cancel</button>
            <button onClick={onConfirm} disabled={deleting} className="px-5 py-[9px] rounded-pill font-sans text-[13px] font-medium border-none cursor-pointer disabled:opacity-50" style={{ background: 'var(--tc)', color: '#fff' }}>{deleting ? 'Deleting…' : 'Yes, delete'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ icon, title, subtitle, cta, onCta }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 40px', borderRadius: 16, background: 'rgba(255,255,255,0.5)', border: `1.5px dashed ${BD}` }}>
      <div style={{ fontSize: 44, marginBottom: 16, opacity: 0.4 }}>{icon}</div>
      <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 20, fontWeight: 600, color: 'var(--ink)', marginBottom: 10 }}>{title}</div>
      {subtitle && <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 13.5, color: 'var(--ink-muted)', lineHeight: 1.7, maxWidth: 300, margin: '0 auto 24px' }}>{subtitle}</p>}
      {cta && (
        <button onClick={onCta} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--tc)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 22px', fontFamily: '"DM Sans", sans-serif', fontSize: 13, fontWeight: 500, cursor: 'pointer', boxShadow: '0 4px 14px rgba(139,58,42,0.25)' }}>
          {cta}
        </button>
      )}
    </div>
  )
}

// ── Tab button ────────────────────────────────────────────────────────────────
function Tab({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '10px 20px', borderRadius: 10,
        border: `1px solid ${active ? 'rgba(196,99,58,0.35)' : 'rgba(28,26,23,0.1)'}`,
        background: active ? 'rgba(196,99,58,0.06)' : 'var(--paper)',
        color: active ? 'var(--tc)' : 'var(--ink-soft)',
        fontFamily: '"DM Sans", sans-serif', fontSize: 13, fontWeight: active ? 600 : 400,
        cursor: 'pointer', transition: 'all 0.18s',
        boxShadow: active ? '0 2px 10px rgba(196,99,58,0.1)' : 'none',
      }}
    >
      {label}
      {count != null && (
        <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 20, fontWeight: 600, background: active ? 'rgba(196,99,58,0.12)' : 'rgba(26,18,8,0.05)', color: active ? 'var(--tc)' : 'var(--ink-muted)' }}>
          {count}
        </span>
      )}
    </button>
  )
}

// ── Card config per type ──────────────────────────────────────────────────────
const CARD_CONFIG = {
  personal: {
    accentGrad: 'linear-gradient(180deg, var(--tc), var(--gold))',
    tagLabel: 'Personal', tagBg: '#fdf0ee', tagColor: 'var(--tc)', tagBorder: '#f5d4ce',
  },
  stranger: {
    accentGrad: 'linear-gradient(180deg, var(--sage), var(--gold))',
    tagLabel: 'Caring Stranger', tagBg: 'rgba(122,158,142,0.1)', tagColor: 'var(--sage)', tagBorder: 'rgba(122,158,142,0.25)',
  },
  read: {
    accentGrad: 'linear-gradient(180deg, var(--purple), var(--gold))',
    tagLabel: 'Listener Read', tagBg: 'rgba(139,126,200,0.1)', tagColor: 'var(--purple)', tagBorder: 'rgba(139,126,200,0.25)',
  },
  sent: {
    accentGrad: 'linear-gradient(180deg, var(--gold), var(--ink-muted))',
    tagLabel: 'Sent', tagBg: '#EDE5D4', tagColor: 'var(--ink-muted)', tagBorder: '#E0D4BC',
  },
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function MySpacePage() {
  const {
    navigate, userRole, canReadFeed, canWriteStranger,
    personalLetters, refreshPersonalLetters,
    ownStrangerLetters, refreshOwnStrangerLetters,
    strangerLetters, refreshStrangerLetters,
    sentLetters, refreshLetters,
    openLetterPanel,
  } = useApp()

  const [activeTab, setActiveTab]         = useState('all')
  const [personal, setPersonal]           = useState(personalLetters)
  const [stranger, setStranger]           = useState(ownStrangerLetters)
  const [editingLetter, setEditingLetter] = useState(null)
  const [deletingLetter, setDeletingLetter] = useState(null)
  const [deleting, setDeleting]           = useState(false)

  useEffect(() => { refreshPersonalLetters(); refreshOwnStrangerLetters(); refreshLetters(); if (canReadFeed) refreshStrangerLetters() }, []) // eslint-disable-line
  useEffect(() => { setPersonal(personalLetters) }, [personalLetters])
  useEffect(() => { setStranger(ownStrangerLetters) }, [ownStrangerLetters])

  const readLetters = strangerLetters.filter(l => l.hasRead)

  // Tabs config
  const TABS = [
    { id: 'all',      label: 'All',             count: personal.length + stranger.length + sentLetters.length },
    { id: 'personal', label: 'Personal',         count: personal.length },
    { id: 'sent',     label: 'Sent',             count: sentLetters.length },
    ...(canWriteStranger ? [{ id: 'stranger', label: 'Caring Stranger', count: stranger.length }] : []),
    ...(canReadFeed    ? [{ id: 'read',     label: 'Listener Read',   count: readLetters.length }] : []),
  ]

  // Letters visible per tab
  const visibleLetters = (() => {
    if (activeTab === 'personal') return personal.map(l => ({ ...l, _cardType: 'personal' }))
    if (activeTab === 'sent')     return sentLetters.map(l => ({ ...l, _cardType: 'sent' }))
    if (activeTab === 'stranger') return stranger.map(l => ({ ...l, _cardType: 'stranger' }))
    if (activeTab === 'read')     return readLetters.map(l => ({ ...l, _cardType: 'read' }))
    // all tab
    return [
      ...personal.map(l => ({ ...l, _cardType: 'personal' })),
      ...stranger.map(l => ({ ...l, _cardType: 'stranger' })),
      ...sentLetters.map(l => ({ ...l, _cardType: 'sent' })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  })()

  function handleSaved(updated) {
    setPersonal(prev => prev.map(l => l._id === updated._id ? updated : l))
    setEditingLetter(null)
  }

  async function handleDeleteConfirm() {
    setDeleting(true)
    try {
      const res = await apiFetch(`/api/letters/${deletingLetter._id}`, { method: 'DELETE' })
      if (res.ok) {
        setPersonal(prev => prev.filter(l => l._id !== deletingLetter._id))
        setDeletingLetter(null)
      }
    } catch { }
    finally { setDeleting(false) }
  }

  const ROLE_LABEL = { seeker: 'Seeker', listener: 'Listener', both: 'Both' }
  const ROLE_COLOR = { seeker: 'var(--tc)', listener: 'var(--sage)', both: 'var(--purple)' }

  return (
    <main className="page-enter w-full flex justify-center px-4 sm:px-6" style={{ paddingTop: 56, paddingBottom: 80 }}>
      <div className="w-full max-w-3xl lg:max-w-4xl">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 44, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 18, height: 1, background: BD, display: 'inline-block' }} />
            Your space
          </div>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.1, letterSpacing: '-0.5px', marginBottom: 12 }}>
            My Space
          </h1>
          <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.65, maxWidth: 400 }}>
            Everything you've written, read, and held — all in one quiet place.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, marginTop: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10.5, padding: '6px 14px', borderRadius: 20, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', background: `${ROLE_COLOR[userRole]}15`, color: ROLE_COLOR[userRole], border: `1px solid ${ROLE_COLOR[userRole]}40` }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: ROLE_COLOR[userRole] }} />
            {ROLE_LABEL[userRole]}
          </span>
          <button
            onClick={() => navigate('write')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--tc)', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 22px', fontFamily: '"DM Sans", sans-serif', fontSize: 13, fontWeight: 500, cursor: 'pointer', boxShadow: '0 4px 14px rgba(196,99,58,0.22)', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(196,99,58,0.28)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(196,99,58,0.22)' }}
          >
            Write a letter
          </button>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
        {TABS.map(t => (
          <Tab key={t.id} label={t.label} count={t.count} active={activeTab === t.id} onClick={() => setActiveTab(t.id)} />
        ))}
      </div>

      {/* ── Count row ───────────────────────────────────────────────── */}
      {visibleLetters.length > 0 && (
        <div style={{ marginBottom: 22, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ background: 'rgba(28,26,23,0.06)', color: 'var(--ink-soft)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, fontFamily: '"DM Sans", sans-serif' }}>
            {visibleLetters.length} {visibleLetters.length === 1 ? 'letter' : 'letters'}
          </span>
          <span style={{ fontSize: 12.5, color: 'var(--ink-muted)', fontFamily: 'Lora, serif', fontStyle: 'italic' }}>sorted by newest</span>
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────────── */}
      {visibleLetters.length === 0 ? (
        activeTab === 'personal' ? (
          <EmptyState icon="🪞" title="Nothing written yet" subtitle="Write to yourself — your past self, your future self. Even one sentence matters." cta="Write your first letter" onCta={() => navigate('write')} />
        ) : activeTab === 'sent' ? (
          <EmptyState icon="📬" title="No letters sent yet" subtitle="Write a letter to someone you know and send it directly to their inbox." cta="Write a letter" onCta={() => navigate('write')} />
        ) : activeTab === 'stranger' ? (
          <EmptyState icon="🌍" title="No stranger letters yet" subtitle="Share something with the world. Your words might be exactly what someone needs today." cta="Write to a stranger" onCta={() => navigate('write')} />
        ) : activeTab === 'read' ? (
          <EmptyState icon="🎧" title="No letters read yet" subtitle="Someone out there is waiting to be heard. Go to the listener feed and be present." cta="Go to Listener Read" onCta={() => navigate('listenerread')} />
        ) : (
          <EmptyState icon="✦" title="Your space is empty" subtitle="Start by writing a letter — to yourself, to a stranger, or to someone you love." cta="Write your first letter" onCta={() => navigate('write')} />
        )
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {visibleLetters.map(letter => {
            const cfg = CARD_CONFIG[letter._cardType] || CARD_CONFIG.personal
            return (
              <LetterCard
                key={letter._id}
                letter={letter}
                accentGrad={cfg.accentGrad}
                tagLabel={cfg.tagLabel}
                tagBg={cfg.tagBg}
                tagColor={cfg.tagColor}
                tagBorder={cfg.tagBorder}
                onOpen={openLetterPanel}
                onEdit={letter.type === 'personal' ? setEditingLetter : undefined}
                onDelete={letter.type === 'personal' ? setDeletingLetter : undefined}
              />
            )
          })}
        </div>
      )}

      {/* ── Compose teaser ──────────────────────────────────────────── */}
      {visibleLetters.length > 0 && (
        <ComposeTeaserBar onClick={() => navigate('write')} />
      )}

      {/* ── Modals ──────────────────────────────────────────────────── */}
      {editingLetter  && <EditModal   letter={editingLetter}  onSave={handleSaved}        onClose={() => setEditingLetter(null)} />}
      {deletingLetter && <DeleteModal letter={deletingLetter} onConfirm={handleDeleteConfirm} onClose={() => setDeletingLetter(null)} deleting={deleting} />}
      </div>
    </main>
  )
}

function ComposeTeaserBar({ onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ marginTop: 28, border: `1.5px dashed ${hov ? 'var(--tc)' : BD}`, borderRadius: 14, padding: '22px 28px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', background: hov ? 'rgba(139,58,42,0.03)' : 'transparent', transition: 'border-color 0.2s, background 0.2s' }}
    >
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: hov ? '#fde8e4' : '#EDE5D4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: 'var(--tc)', flexShrink: 0, transition: 'background 0.2s' }}>+</div>
      <div>
        <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>Begin a new letter</div>
        <div style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-muted)' }}>No pressure. Start with "Dear…" and see where it goes.</div>
      </div>
    </div>
  )
}
