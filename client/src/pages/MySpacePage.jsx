import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { apiFetch } from '../utils/api'
import LetterCard from '../components/LetterCard'

const BD = '#E0D4BC'
const FT = '#F2EBE0'

// ── Edit Modal ────────────────────────────────────────────────────────────────
const MOOD_OPTIONS = [
  { value: '',          label: 'No mood',    emoji: '—'  },
  { value: 'vent',      label: 'Need to vent', emoji: '🌧️' },
  { value: 'joy',       label: 'Pure joy',     emoji: '🌟' },
  { value: 'love',      label: 'Love & warmth',emoji: '💌' },
  { value: 'grief',     label: 'Grief & loss', emoji: '🕯️' },
  { value: 'gratitude', label: 'Gratitude',    emoji: '🌿' },
  { value: 'longing',   label: 'Longing',      emoji: '🌙' },
]

function EditModal({ letter, onSave, onClose }) {
  const [subject, setSubject] = useState(letter.subject || '')
  const [message, setMessage] = useState(letter.message || '')
  const [mood,    setMood]    = useState(letter.mood    || '')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  const isStranger = letter.type === 'stranger'

  async function handleSave() {
    setError('')
    if (!message.trim()) { setError('Message cannot be empty.'); return }
    setSaving(true)
    try {
      const res  = await apiFetch(`/api/letters/${letter._id}`, {
        method: 'PUT',
        body: JSON.stringify({ subject, message, mood }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Failed to save.'); return }
      onSave(json.data)
    } catch { setError('Network error.') }
    finally { setSaving(false) }
  }

  return (
    <div
      className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(26,18,8,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full sm:max-w-[560px] sm:mx-4 animate-fade-up flex flex-col"
        style={{
          background: 'var(--cream)', border: `1px solid ${BD}`,
          borderRadius: 16, boxShadow: '0 24px 64px rgba(26,18,8,0.18)',
          maxHeight: 'calc(100dvh - 32px)', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0" style={{ borderBottom: `1px solid ${FT}` }}>
          <div>
            <span style={{ fontFamily: '"Lora", serif', fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>Edit Letter</span>
            {isStranger && (
              <span style={{ marginLeft: 10, fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', background: 'rgba(122,158,142,0.1)', color: 'var(--sage)', border: '1px solid rgba(122,158,142,0.25)', fontFamily: '"DM Sans", sans-serif' }}>
                Caring Stranger
              </span>
            )}
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center cursor-pointer bg-transparent border-none text-[20px]" style={{ color: 'var(--ink-muted)' }}>×</button>
        </div>

        {/* Scrollable body */}
        <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-[1px] font-medium" style={{ color: 'var(--ink-muted)' }}>Subject</span>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full px-3 py-[10px] rounded-[8px] font-sans text-[13px] outline-none"
              style={{ background: 'var(--paper)', border: `1px solid ${BD}`, color: 'var(--ink)' }}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-[1px] font-medium" style={{ color: 'var(--ink-muted)' }}>Message</span>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={10}
              className="w-full px-3 py-[10px] rounded-[8px] font-lora text-[14px] leading-[1.9] outline-none resize-none"
              style={{ background: 'var(--paper)', border: `1px solid ${BD}`, color: 'var(--ink-soft)' }}
            />
          </label>

          {/* Mood picker */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-[1px] font-medium" style={{ color: 'var(--ink-muted)' }}>Mood</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {MOOD_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMood(opt.value)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '5px 11px', borderRadius: 20, cursor: 'pointer',
                    fontSize: 12, fontFamily: '"DM Sans", sans-serif', fontWeight: 500,
                    transition: 'all 0.12s',
                    background: mood === opt.value ? 'var(--ink)' : 'var(--paper)',
                    color:      mood === opt.value ? 'var(--cream)' : 'var(--ink-soft)',
                    border:     mood === opt.value ? '1px solid var(--ink)' : `1px solid ${BD}`,
                  }}
                >
                  {opt.emoji !== '—' && <span>{opt.emoji}</span>}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-[12px] px-3 py-2 rounded-[7px]" style={{ color: 'var(--tc)', background: 'rgba(196,99,58,0.07)', border: '1px solid rgba(196,99,58,0.2)' }}>
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end pb-1">
            <button onClick={onClose} className="px-5 py-[9px] rounded-pill font-sans text-[13px] cursor-pointer bg-transparent" style={{ color: 'var(--ink-muted)', border: `1px solid ${BD}` }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-5 py-[9px] rounded-pill font-sans text-[13px] font-medium border-none cursor-pointer disabled:opacity-50" style={{ background: 'var(--ink)', color: 'var(--cream)' }}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
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
          <div style={{ fontFamily: '"Lora", serif', fontSize: 18, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>Delete this letter?</div>
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
      <div style={{ fontFamily: '"Lora", serif', fontSize: 20, fontWeight: 600, color: 'var(--ink)', marginBottom: 10 }}>{title}</div>
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
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '6px 13px', borderRadius: 8,
        border: `1px solid ${active ? 'rgba(196,99,58,0.35)' : 'rgba(28,26,23,0.1)'}`,
        background: active ? 'rgba(196,99,58,0.06)' : 'var(--paper)',
        color: active ? 'var(--tc)' : 'var(--ink-soft)',
        fontFamily: '"DM Sans", sans-serif', fontSize: 12.5, fontWeight: active ? 500 : 400,
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

// ── Page ──────────────────────────────────────────────────────────────────────
export default function MySpacePage() {
  const {
    navigate, mySpaceTab, userRole, canReadFeed, canWriteStranger,
    personalLetters, refreshPersonalLetters,
    ownStrangerLetters, refreshOwnStrangerLetters,
    strangerLetters, refreshStrangerLetters,
    sentLetters, refreshLetters,
    receivedLetters, refreshReceivedLetters,
    openLetterPanel,
    refreshAnalytics,
  } = useApp()

  const [activeTab, setActiveTab]           = useState(mySpaceTab || 'all')
  const [personal, setPersonal]             = useState(personalLetters)
  const [stranger, setStranger]             = useState(ownStrangerLetters)
  const [editingLetter, setEditingLetter]   = useState(null)
  const [deletingLetter, setDeletingLetter] = useState(null)
  const [deleting, setDeleting]             = useState(false)

  useEffect(() => {
    refreshPersonalLetters(); refreshOwnStrangerLetters(); refreshLetters(); refreshReceivedLetters()
    if (canReadFeed) refreshStrangerLetters()
    refreshAnalytics()
  }, []) // eslint-disable-line
  useEffect(() => { setPersonal(personalLetters) }, [personalLetters])
  useEffect(() => { setStranger(ownStrangerLetters) }, [ownStrangerLetters])

  const readLetters = strangerLetters.filter(l => l.hasRead)

  // Tabs config
  const TABS = [
    { id: 'all',      label: 'All',                 count: personal.length + stranger.length + sentLetters.length + receivedLetters.length },
    { id: 'personal', label: 'Personal',             count: personal.length },
    { id: 'sent',     label: 'Sent to Someone',      count: sentLetters.length },
    { id: 'received', label: 'For You',               count: receivedLetters.length },
    ...(canWriteStranger ? [{ id: 'stranger', label: 'Send to a Stranger', count: stranger.length }] : []),
    ...(canReadFeed    ? [{ id: 'read',     label: 'Held by Me',     count: readLetters.length }] : []),
  ]

  // Letters visible per tab
  const visibleLetters = (() => {
    if (activeTab === 'personal') return personal.map(l => ({ ...l, _cardType: 'personal' }))
    if (activeTab === 'sent')     return sentLetters.map(l => ({ ...l, _cardType: 'sent' }))
    if (activeTab === 'received') return receivedLetters.map(l => ({ ...l, _cardType: 'received' }))
    if (activeTab === 'stranger') return stranger.map(l => ({ ...l, _cardType: 'stranger' }))
    if (activeTab === 'read')     return readLetters.map(l => ({ ...l, _cardType: 'read' }))
    // all tab
    return [
      ...personal.map(l => ({ ...l, _cardType: 'personal' })),
      ...stranger.map(l => ({ ...l, _cardType: 'stranger' })),
      ...sentLetters.map(l => ({ ...l, _cardType: 'sent' })),
      ...receivedLetters.map(l => ({ ...l, _cardType: 'received' })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  })()

  function handleSaved(updated) {
    setPersonal(prev => prev.map(l => l._id === updated._id ? updated : l))
    setStranger(prev => prev.map(l => l._id === updated._id ? updated : l))
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: '"Lora", serif', fontSize: 26, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2, letterSpacing: '-0.4px', marginBottom: 5 }}>
            My Space
          </h1>
          <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, color: 'var(--ink-muted)', margin: 0 }}>
            Everything you've written, read, and held.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, padding: '4px 11px', borderRadius: 20, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', background: `${ROLE_COLOR[userRole]}12`, color: ROLE_COLOR[userRole], border: `1px solid ${ROLE_COLOR[userRole]}35` }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: ROLE_COLOR[userRole] }} />
            {ROLE_LABEL[userRole]}
          </span>
          <button
            onClick={() => navigate('write')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--tc)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontFamily: '"DM Sans", sans-serif', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >
            + Write
          </button>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
        {TABS.map(t => (
          <Tab key={t.id} label={t.label} count={t.count} active={activeTab === t.id} onClick={() => setActiveTab(t.id)} />
        ))}
      </div>

      {/* ── Count row ───────────────────────────────────────────────── */}
      {visibleLetters.length > 0 && (
        <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
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
        ) : activeTab === 'received' ? (
          <EmptyState icon="📥" title="Nothing for you yet" subtitle="When someone sends you a letter through Letter from Heart, it will appear here." />
        ) : activeTab === 'stranger' ? (
          <EmptyState icon="🌍" title="No stranger letters yet" subtitle="Share something with the world. Your words might be exactly what someone needs today." cta="Write to a stranger" onCta={() => navigate('write')} />
        ) : activeTab === 'read' ? (
          <EmptyState icon="🎧" title="No letters read yet" subtitle="Someone out there is waiting to be heard. Go to the listener feed and be present." cta="Go to Listener Read" onCta={() => navigate('listenerread')} />
        ) : (
          <EmptyState icon="✦" title="Your space is empty" subtitle="Start by writing a letter — to yourself, to a stranger, or to someone you love." cta="Write your first letter" onCta={() => navigate('write')} />
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {visibleLetters.map(letter => (
            <LetterCard
              key={letter._id}
              letter={letter}
              onOpen={openLetterPanel}
              onEdit={
                letter.type === 'personal' ||
                (letter.type === 'stranger' && !letter.isClaimed && !letter.isRead)
                  ? setEditingLetter : undefined
              }
              onDelete={letter.type === 'personal' ? setDeletingLetter : undefined}
            />
          ))}
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
        <div style={{ fontFamily: '"Lora", serif', fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>Begin a new letter</div>
        <div style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-muted)' }}>No pressure. Start with "Dear…" and see where it goes.</div>
      </div>
    </div>
  )
}
