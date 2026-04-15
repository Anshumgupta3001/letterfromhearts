import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import { apiFetch } from '../utils/api'

const MAX_MESSAGES = 10

const MOOD_META = {
  vent:      { emoji: '🌧️', label: 'I need to vent',  bg: 'rgba(28,26,23,0.12)',      color: 'var(--ink-soft)'  },
  joy:       { emoji: '🌟', label: 'Pure joy',         bg: 'rgba(201,168,76,0.15)',    color: 'var(--gold)'      },
  love:      { emoji: '💌', label: 'Love & warmth',    bg: 'rgba(196,99,58,0.12)',     color: 'var(--tc)'        },
  grief:     { emoji: '🕯️', label: 'Grief & loss',    bg: 'rgba(122,158,142,0.14)',   color: 'var(--sage)'      },
  gratitude: { emoji: '🌿', label: 'Gratitude',        bg: 'rgba(122,112,92,0.12)',    color: '#7A6E5C'          },
  longing:   { emoji: '🌙', label: 'Longing',          bg: 'rgba(139,126,200,0.14)',   color: 'var(--purple)'   },
}

const TYPE_META = {
  personal: { label: 'Personal',        color: 'var(--tc)',   bg: 'rgba(196,99,58,0.08)',   border: 'rgba(196,99,58,0.2)'   },
  stranger: { label: 'Caring Stranger', color: 'var(--sage)', bg: 'rgba(122,158,142,0.08)', border: 'rgba(122,158,142,0.2)' },
  sent:     { label: 'Sent Letter',     color: 'var(--gold)', bg: 'rgba(201,168,76,0.08)',  border: 'rgba(201,168,76,0.2)'  },
}

function formatTime(d) {
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}
function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Message count dots ────────────────────────────────────────────────────────
function MessageDots({ count, max }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} style={{
          width: i < count ? 7 : 5,
          height: i < count ? 7 : 5,
          borderRadius: '50%',
          background: i < count ? 'var(--tc)' : 'rgba(28,26,23,0.12)',
          transition: 'all 0.3s ease',
          flexShrink: 0,
        }} />
      ))}
    </div>
  )
}

// ── Chat message bubble ───────────────────────────────────────────────────────
function Bubble({ msg, isMine }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isMine ? 'flex-end' : 'flex-start',
      gap: 4,
    }}>
      <div style={{
        maxWidth: '78%',
        padding: '11px 16px',
        borderRadius: isMine ? '18px 18px 5px 18px' : '18px 18px 18px 5px',
        background: isMine
          ? 'linear-gradient(145deg, var(--tc) 0%, #D0652E 100%)'
          : '#fff',
        color: isMine ? '#fff' : 'var(--ink)',
        fontSize: 14, fontFamily: '"Lora", serif',
        lineHeight: 1.8, wordBreak: 'break-word', whiteSpace: 'pre-line',
        boxShadow: isMine
          ? '0 4px 16px rgba(196,99,58,0.22)'
          : '0 2px 10px rgba(28,26,23,0.08)',
        border: isMine ? 'none' : '1px solid rgba(28,26,23,0.07)',
        letterSpacing: '0.01em',
      }}>
        {msg.content}
      </div>
      <div style={{
        fontSize: 10, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif',
        paddingLeft: isMine ? 0 : 4, paddingRight: isMine ? 4 : 0,
        letterSpacing: '0.3px',
      }}>
        {formatTime(msg.createdAt)}
      </div>
    </div>
  )
}

// ── Send icon ─────────────────────────────────────────────────────────────────
const SendIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)

const SpinIcon = () => (
  <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
  </svg>
)

export default function LetterDrawer() {
  const { letterPanel, closeLetterPanel, authUser } = useApp()
  const { open, letter } = letterPanel

  const meta     = letter ? (TYPE_META[letter.type] || TYPE_META.personal) : TYPE_META.personal
  const moodMeta = letter?.mood ? (MOOD_META[letter.mood] || null) : null
  const date     = letter
    ? new Date(letter.createdAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  // ── Who is viewing ────────────────────────────────────────────────────────
  const letterOwnerId  = letter?.userId?._id?.toString() ?? letter?.userId?.toString() ?? ''
  const viewerUserId   = authUser?._id?.toString() ?? ''
  const isOwner        = !!letterOwnerId && !!viewerUserId && letterOwnerId === viewerUserId
  const isListenerView = letter?.type === 'stranger' && letter?.hasRead === true && !isOwner
  const isSeekerView   = letter?.type === 'stranger' && isOwner

  // ── Conversation state ────────────────────────────────────────────────────
  // conv = { messages: [], isEnded: bool } or null
  const [conv,        setConv]        = useState(null)
  const [convLoading, setConvLoading] = useState(false)

  // Seeker: list of convs (one per listener who replied)
  const [seekerConvs,        setSeekerConvs]        = useState([])
  const [seekerConvsLoading, setSeekerConvsLoading] = useState(false)

  // Input
  const [text,        setText]        = useState('')
  const [sending,     setSending]     = useState(false)
  const [sendError,   setSendError]   = useState('')
  const [showToast,   setShowToast]   = useState(false)

  // End-conversation confirm
  const [confirmEnd,  setConfirmEnd]  = useState(false)
  const [ending,      setEnding]      = useState(false)

  const messagesEndRef = useRef(null)

  // ── Derived ───────────────────────────────────────────────────────────────
  const messages     = conv?.messages      || []
  const isEnded      = conv?.isEnded       === true
  const limitReached = messages.length >= MAX_MESSAGES
  const canSend      = !isEnded && !limitReached

  // ── Scroll to bottom when messages change ─────────────────────────────────
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length])

  // ── Auto-dismiss toast ────────────────────────────────────────────────────
  useEffect(() => {
    if (!showToast) return
    const t = setTimeout(() => setShowToast(false), 3000)
    return () => clearTimeout(t)
  }, [showToast])

  // ── Fetch functions ───────────────────────────────────────────────────────
  const fetchListenerConv = useCallback(async (letterId) => {
    try {
      const res  = await apiFetch(`/api/replies/my?parentLetterId=${letterId}`)
      const json = await res.json()
      if (json.success) setConv(json.data || null)
    } catch {}
  }, [])

  const fetchSeekerConvs = useCallback(async (letterId) => {
    try {
      const res  = await apiFetch(`/api/letters/${letterId}/replies`)
      const json = await res.json()
      if (json.success) setSeekerConvs(json.data || [])
    } catch {}
  }, [])

  // ── Reset + initial load on open / letter change ──────────────────────────
  useEffect(() => {
    setText('')
    setSendError('')
    setShowToast(false)
    setConfirmEnd(false)
    setConv(null)
    setSeekerConvs([])

    if (!open || !letter) return

    if (isListenerView) {
      setConvLoading(true)
      fetchListenerConv(letter._id).finally(() => setConvLoading(false))
    }
    if (isSeekerView) {
      setSeekerConvsLoading(true)
      fetchSeekerConvs(letter._id).finally(() => setSeekerConvsLoading(false))
    }
  }, [open, letter?._id]) // eslint-disable-line

  // ── Auto-poll every 30s while panel is open ───────────────────────────────
  useEffect(() => {
    if (!open || !letter) return
    const id = setInterval(() => {
      if (isListenerView) fetchListenerConv(letter._id)
      if (isSeekerView)   fetchSeekerConvs(letter._id)
    }, 30_000)
    return () => clearInterval(id)
  }, [open, letter?._id, isListenerView, isSeekerView, fetchListenerConv, fetchSeekerConvs]) // eslint-disable-line

  // ── Send message ──────────────────────────────────────────────────────────
  async function handleSend() {
    if (!text.trim() || !canSend || sending) return
    setSending(true)
    setSendError('')
    try {
      const res  = await apiFetch('/api/replies/message', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ parentLetterId: letter._id, content: text.trim() }),
      })
      const json = await res.json()
      if (json.success) {
        setConv(json.data)
        setText('')
        setShowToast(true)
      } else {
        setSendError(json.error || 'Failed to send.')
      }
    } catch {
      setSendError('Network error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── End conversation ──────────────────────────────────────────────────────
  async function handleEnd() {
    setEnding(true)
    try {
      const res  = await apiFetch('/api/replies/end', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ parentLetterId: letter._id }),
      })
      const json = await res.json()
      if (json.success) setConv(json.data)
    } catch {}
    setEnding(false)
    setConfirmEnd(false)
  }

  // ── Seeker reply (send back) — uses the same sendMessage API ─────────────
  const [seekerText,    setSeekerText]    = useState('')
  const [seekerSending, setSeekerSending] = useState(false)
  const [seekerError,   setSeekerError]   = useState('')

  async function handleSeekerSend(convDoc) {
    if (!seekerText.trim() || seekerSending) return
    const conv = convDoc
    if (conv.isEnded || conv.messages.length >= MAX_MESSAGES) return
    setSeekerSending(true)
    setSeekerError('')
    try {
      const res  = await apiFetch('/api/replies/message', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ parentLetterId: letter._id, content: seekerText.trim() }),
      })
      const json = await res.json()
      if (json.success) {
        setSeekerConvs(prev => prev.map(c => c._id === json.data._id ? json.data : c))
        setSeekerText('')
      } else {
        setSeekerError(json.error || 'Failed to send.')
      }
    } catch {
      setSeekerError('Network error.')
    } finally {
      setSeekerSending(false)
    }
  }

  return (
    <>
      {/* ── Overlay ─────────────────────────────────────────────────────── */}
      <div
        onClick={closeLetterPanel}
        style={{
          position: 'fixed', inset: 0, zIndex: 400,
          background: 'rgba(0,0,0,0.2)',
          backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* ── Panel ───────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 401,
          width: 'min(600px, 100vw)',
          background: '#FDFAF5',
          boxShadow: '-24px 0 80px rgba(22,16,8,0.12)',
          display: 'flex', flexDirection: 'column',
          overflowX: 'hidden',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.38s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid rgba(28,26,23,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          flexShrink: 0, background: '#fffaf5',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
            {letter && (
              <>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 10, padding: '4px 10px', borderRadius: 20,
                  fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase',
                  background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
                  fontFamily: '"DM Sans", sans-serif', flexShrink: 0,
                }}>
                  ✦ {meta.label}
                </span>
                {moodMeta && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: 10, padding: '4px 10px', borderRadius: 20,
                    fontWeight: 500, background: moodMeta.bg, color: moodMeta.color,
                    fontFamily: '"DM Sans", sans-serif', flexShrink: 0,
                  }}>
                    {moodMeta.emoji} {moodMeta.label}
                  </span>
                )}
              </>
            )}
          </div>
          <button
            onClick={closeLetterPanel}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(28,26,23,0.06)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: 'var(--ink-muted)', flexShrink: 0,
              transition: 'background 0.2s, color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(28,26,23,0.12)'; e.currentTarget.style.color = 'var(--ink)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(28,26,23,0.06)'; e.currentTarget.style.color = 'var(--ink-muted)' }}
          >✕</button>
        </div>

        {/* ── Toast ─────────────────────────────────────────────────────── */}
        <div style={{
          position: 'absolute', top: 64, left: 0, right: 0, zIndex: 10,
          padding: '0 20px', pointerEvents: 'none',
        }}>
          <div style={{
            background: 'rgba(196,99,58,0.94)', color: '#fff', borderRadius: 10,
            padding: '11px 18px', display: 'flex', alignItems: 'flex-start', gap: 10,
            boxShadow: '0 4px 20px rgba(196,99,58,0.28)',
            opacity: showToast ? 1 : 0,
            transform: showToast ? 'translateY(0)' : 'translateY(-8px)',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
          }}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>💌</span>
            <div>
              <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>Sent</div>
              <div style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 12, opacity: 0.88, marginTop: 2 }}>
                The writer will see it when they open this letter.
              </div>
            </div>
          </div>
        </div>

        {/* ── Scrollable body ───────────────────────────────────────────── */}
        {letter && (
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 20px 32px' }}>
            <div style={{ maxWidth: 520, margin: '0 auto' }}>

              {/* ── Original letter paper card ── */}
              <div style={{
                background: '#fffaf5',
                borderRadius: '0 0 20px 20px',
                boxShadow: '0 8px 32px rgba(28,26,23,0.08), 0 2px 8px rgba(28,26,23,0.04)',
                border: '1px solid rgba(28,26,23,0.08)', borderTop: 'none',
                padding: 'clamp(28px, 5vw, 48px) clamp(24px, 5vw, 44px)',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: `linear-gradient(180deg, ${meta.color}, var(--gold))`, borderRadius: '0 0 0 16px' }} />
                <div style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 12, color: 'var(--ink-muted)', textAlign: 'right', marginBottom: 28 }}>{date}</div>
                <h2 style={{ fontFamily: '"Lora", serif', fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2, letterSpacing: '-0.4px', marginBottom: 6 }}>
                  {letter.subject}
                </h2>
                <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(28,26,23,0.12), transparent)', margin: '20px 0 28px' }} />
                <div style={{ fontFamily: 'Lora, serif', fontSize: 'clamp(14px, 1.8vw, 15.5px)', lineHeight: 2.05, color: 'var(--ink-soft)', whiteSpace: 'pre-line', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                  {letter.message}
                </div>
                <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid rgba(28,26,23,0.07)', textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '9px 20px', borderRadius: 40, background: 'rgba(28,26,23,0.03)', border: '1px solid rgba(28,26,23,0.08)' }}>
                    <span style={{ fontSize: 14, opacity: 0.5 }}>✉</span>
                    <span style={{ fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif' }}>Letter from Heart</span>
                  </div>
                </div>
              </div>

              {/* ════════════════════════════════════════════════════════
                  LISTENER: Chat conversation
              ════════════════════════════════════════════════════════ */}
              {isListenerView && (
                <div style={{ marginTop: 24 }}>
                  {convLoading ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-muted)' }}>
                      Loading…
                    </div>
                  ) : (
                    <div style={{
                      borderRadius: 18,
                      background: '#faf7f3',
                      border: isEnded
                        ? '1px solid rgba(28,26,23,0.1)'
                        : '1px solid rgba(196,99,58,0.14)',
                      boxShadow: '0 4px 24px rgba(28,26,23,0.06)',
                      overflow: 'hidden',
                    }}>

                      {/* ── Emotional header ── */}
                      <div style={{
                        padding: '16px 18px 14px',
                        background: isEnded
                          ? 'rgba(28,26,23,0.03)'
                          : 'linear-gradient(135deg, rgba(196,99,58,0.06) 0%, rgba(201,168,76,0.04) 100%)',
                        borderBottom: '1px solid rgba(28,26,23,0.07)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                              <span style={{ fontSize: 15 }}>{isEnded ? '🔒' : '💌'}</span>
                              <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, fontWeight: 600, color: isEnded ? 'var(--ink-muted)' : 'var(--tc)', letterSpacing: '-0.1px' }}>
                                {isEnded ? 'Conversation closed' : 'A quiet conversation'}
                              </span>
                            </div>
                            <div style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 12, color: 'var(--ink-muted)', paddingLeft: 22, lineHeight: 1.5 }}>
                              {isEnded
                                ? 'This space has been sealed with care.'
                                : 'Take your time. Read slowly.'}
                            </div>
                          </div>
                          {/* Message progress dots */}
                          {!isEnded && (
                            <div style={{ flexShrink: 0, paddingTop: 2 }}>
                              <MessageDots count={messages.length} max={MAX_MESSAGES} />
                              <div style={{ fontSize: 9, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif', textAlign: 'right', marginTop: 4 }}>
                                {messages.length}/{MAX_MESSAGES}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ── Message bubbles area ── */}
                      <div style={{
                        padding: '18px 16px 12px',
                        display: 'flex', flexDirection: 'column', gap: 12,
                        background: 'rgba(248,244,238,0.6)',
                        minHeight: messages.length === 0 ? 80 : 0,
                      }}>
                        {messages.length === 0 && !isEnded && (
                          <div style={{ textAlign: 'center', padding: '20px 0', fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.7 }}>
                            You've read their letter.<br />
                            <span style={{ opacity: 0.7, fontSize: 12 }}>When you're ready, say something kind.</span>
                          </div>
                        )}
                        {messages.map((msg, i) => {
                          const isMine    = msg.sender?.toString() === viewerUserId || msg.sender === viewerUserId
                          const showDate  = i === 0 || formatDate(msg.createdAt) !== formatDate(messages[i-1].createdAt)
                          return (
                            <div key={msg._id || i}>
                              {showDate && (
                                <div style={{ textAlign: 'center', margin: '4px 0 12px', fontSize: 10, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                                  {formatDate(msg.createdAt)}
                                </div>
                              )}
                              <Bubble msg={msg} isMine={isMine} />
                            </div>
                          )
                        })}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* ── Ended / limit reached state ── */}
                      {(isEnded || limitReached) && (
                        <div style={{
                          padding: '16px 18px',
                          background: 'rgba(28,26,23,0.025)',
                          borderTop: '1px solid rgba(28,26,23,0.07)',
                          textAlign: 'center',
                        }}>
                          <div style={{ fontSize: 18, marginBottom: 6 }}>
                            {isEnded ? '🕯️' : '💌'}
                          </div>
                          <div style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.65 }}>
                            {isEnded
                              ? 'This conversation has been closed with care.'
                              : 'This conversation has reached its natural end.'}
                          </div>
                          <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11, color: 'var(--ink-muted)', marginTop: 5 }}>
                            {isEnded
                              ? 'No further messages can be sent.'
                              : `${MAX_MESSAGES} messages exchanged — a meaningful exchange.`}
                          </div>
                        </div>
                      )}

                      {/* ── End conversation confirm (inline card) ── */}
                      {confirmEnd && !isEnded && (
                        <div style={{
                          margin: '0 14px 14px',
                          padding: '16px 18px',
                          borderRadius: 12,
                          background: '#fff',
                          border: '1px solid rgba(180,60,60,0.2)',
                          boxShadow: '0 4px 16px rgba(180,60,60,0.08)',
                        }}>
                          <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, fontWeight: 600, color: '#B83232', marginBottom: 6 }}>
                            Close this conversation?
                          </div>
                          <div style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 12.5, color: 'var(--ink-muted)', lineHeight: 1.65, marginBottom: 14 }}>
                            Once closed, neither of you can send more messages. This cannot be undone.
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={() => setConfirmEnd(false)}
                              style={{
                                flex: 1, padding: '9px 0', borderRadius: 9,
                                background: 'transparent', border: '1px solid rgba(28,26,23,0.15)',
                                color: 'var(--ink-muted)', cursor: 'pointer',
                                fontSize: 12.5, fontFamily: '"DM Sans", sans-serif', fontWeight: 500,
                                transition: 'background 0.15s',
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(28,26,23,0.04)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              Keep writing
                            </button>
                            <button
                              onClick={handleEnd}
                              disabled={ending}
                              style={{
                                flex: 1, padding: '9px 0', borderRadius: 9,
                                background: ending ? 'rgba(180,60,60,0.4)' : '#B83232',
                                color: '#fff', border: 'none', cursor: ending ? 'default' : 'pointer',
                                fontSize: 12.5, fontFamily: '"DM Sans", sans-serif', fontWeight: 600,
                                boxShadow: ending ? 'none' : '0 4px 12px rgba(180,60,60,0.25)',
                                transition: 'background 0.15s, box-shadow 0.15s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                              }}
                            >
                              {ending ? <><SpinIcon /> Closing…</> : 'Yes, close it'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* ── Input area ── */}
                      {canSend && !confirmEnd && (
                        <div style={{
                          padding: '12px 14px 14px',
                          borderTop: '1px solid rgba(28,26,23,0.07)',
                          background: '#fff',
                          display: 'flex', flexDirection: 'column', gap: 10,
                        }}>
                          {/* "End" affordance — subtle, above textarea */}
                          {messages.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 2 }}>
                              <span style={{ fontSize: 11, fontFamily: '"Lora", serif', fontStyle: 'italic', color: 'var(--ink-muted)', opacity: 0.8 }}>
                                You can close this conversation anytime.
                              </span>
                              <button
                                onClick={() => setConfirmEnd(true)}
                                style={{
                                  fontSize: 11, fontFamily: '"DM Sans", sans-serif', fontWeight: 500,
                                  color: 'rgba(180,60,60,0.7)', background: 'none', border: 'none',
                                  cursor: 'pointer', padding: '2px 4px', borderRadius: 4,
                                  textDecoration: 'underline', textUnderlineOffset: '2px',
                                  transition: 'color 0.15s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = '#B83232'}
                                onMouseLeave={e => e.currentTarget.style.color = 'rgba(180,60,60,0.7)'}
                              >
                                End
                              </button>
                            </div>
                          )}

                          {sendError && (
                            <div style={{ fontSize: 12, color: 'var(--tc)', fontFamily: '"DM Sans", sans-serif', padding: '7px 11px', background: 'rgba(196,99,58,0.06)', borderRadius: 8, border: '0.5px solid rgba(196,99,58,0.2)' }}>
                              {sendError}
                            </div>
                          )}

                          <textarea
                            value={text}
                            onChange={e => { setText(e.target.value); setSendError('') }}
                            onKeyDown={handleKeyDown}
                            placeholder="Write something kind… (Enter to send)"
                            rows={3}
                            maxLength={1000}
                            style={{
                              width: '100%', padding: '11px 14px', borderRadius: 12,
                              border: '1px solid rgba(196,99,58,0.2)',
                              background: 'var(--cream)',
                              fontSize: 14, fontFamily: '"Lora", serif', color: 'var(--ink)',
                              outline: 'none', resize: 'none', boxSizing: 'border-box',
                              lineHeight: 1.75, transition: 'border-color 0.2s, box-shadow 0.2s',
                            }}
                            onFocus={e => { e.target.style.borderColor = 'rgba(196,99,58,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(196,99,58,0.07)' }}
                            onBlur={e => { e.target.style.borderColor = 'rgba(196,99,58,0.2)'; e.target.style.boxShadow = 'none' }}
                          />

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 11, fontFamily: '"Lora", serif', fontStyle: 'italic', color: 'var(--sage)', opacity: 0.85 }}>
                              Speak gently 💛
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 10, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif' }}>
                                {text.length}/1000
                              </span>
                              <button
                                onClick={handleSend}
                                disabled={sending || !text.trim()}
                                style={{
                                  padding: '9px 20px', borderRadius: 999,
                                  background: sending || !text.trim() ? 'rgba(196,99,58,0.3)' : 'var(--tc)',
                                  color: '#fff', border: 'none',
                                  cursor: sending || !text.trim() ? 'default' : 'pointer',
                                  fontSize: 13, fontFamily: '"DM Sans", sans-serif', fontWeight: 500,
                                  display: 'flex', alignItems: 'center', gap: 7,
                                  boxShadow: sending || !text.trim() ? 'none' : '0 4px 14px rgba(196,99,58,0.3)',
                                  transition: 'background 0.15s, transform 0.15s, box-shadow 0.15s',
                                }}
                                onMouseEnter={e => { if (!sending && text.trim()) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(196,99,58,0.38)' } }}
                                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = sending || !text.trim() ? 'none' : '0 4px 14px rgba(196,99,58,0.3)' }}
                              >
                                {sending ? <><SpinIcon /> Sending…</> : <><SendIcon /> Send</>}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ════════════════════════════════════════════════════════
                  SEEKER: View all conversations on their letter
              ════════════════════════════════════════════════════════ */}
              {isSeekerView && (
                <div style={{ marginTop: 24 }}>
                  {/* Section label */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ flex: 1, height: 1, background: 'rgba(28,26,23,0.08)' }} />
                    <span style={{ fontSize: 10, letterSpacing: '1.8px', textTransform: 'uppercase', color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif', flexShrink: 0 }}>
                      {seekerConvs.length > 0
                        ? `${seekerConvs.length} listener${seekerConvs.length > 1 ? 's' : ''} reached out`
                        : 'Replies from listeners'}
                    </span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(28,26,23,0.08)' }} />
                  </div>

                  {seekerConvsLoading ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-muted)' }}>
                      Loading…
                    </div>
                  ) : seekerConvs.length === 0 ? (
                    <div style={{ padding: '28px 20px', borderRadius: 14, textAlign: 'center', background: 'rgba(28,26,23,0.025)', border: '1px dashed rgba(28,26,23,0.1)' }}>
                      <div style={{ fontSize: 24, marginBottom: 10, opacity: 0.4 }}>🌿</div>
                      <div style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 13.5, color: 'var(--ink-muted)', lineHeight: 1.7 }}>
                        No one has replied yet.<br />
                        <span style={{ fontSize: 12, opacity: 0.8 }}>Someone out there may still be reading.</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {seekerConvs.map((c, ci) => {
                        const cMessages     = c.messages || []
                        const cEnded        = c.isEnded === true
                        const cLimitReached = cMessages.length >= MAX_MESSAGES
                        const cCanSend      = !cEnded && !cLimitReached
                        return (
                          <div
                            key={c._id || ci}
                            style={{
                              borderRadius: 18,
                              background: '#faf7f3',
                              border: cEnded
                                ? '1px solid rgba(28,26,23,0.1)'
                                : '1px solid rgba(122,158,142,0.2)',
                              boxShadow: '0 4px 20px rgba(28,26,23,0.05)',
                              overflow: 'hidden',
                            }}
                          >
                            {/* Card header */}
                            <div style={{
                              padding: '14px 18px 12px',
                              background: cEnded
                                ? 'rgba(28,26,23,0.03)'
                                : 'linear-gradient(135deg, rgba(122,158,142,0.07) 0%, rgba(201,168,76,0.04) 100%)',
                              borderBottom: '1px solid rgba(28,26,23,0.07)',
                              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8,
                            }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                                  <span style={{ fontSize: 14 }}>{cEnded ? '🔒' : '🌿'}</span>
                                  <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 12.5, fontWeight: 600, color: cEnded ? 'var(--ink-muted)' : 'var(--sage)' }}>
                                    Listener {ci + 1}
                                  </span>
                                </div>
                                <div style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 11.5, color: 'var(--ink-muted)', paddingLeft: 21 }}>
                                  {cEnded ? 'This conversation has been closed.' : 'A stranger took the time to reach out.'}
                                </div>
                              </div>
                              {!cEnded && (
                                <div style={{ flexShrink: 0, paddingTop: 2, textAlign: 'right' }}>
                                  <MessageDots count={cMessages.length} max={MAX_MESSAGES} />
                                  <div style={{ fontSize: 9, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif', marginTop: 4 }}>
                                    {cMessages.length}/{MAX_MESSAGES}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Bubbles */}
                            <div style={{ padding: '16px 14px 10px', display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(248,244,238,0.5)' }}>
                              {cMessages.map((msg, i) => {
                                const isMine   = msg.sender?.toString() === viewerUserId
                                const showDate = i === 0 || formatDate(msg.createdAt) !== formatDate(cMessages[i-1].createdAt)
                                return (
                                  <div key={msg._id || i}>
                                    {showDate && (
                                      <div style={{ textAlign: 'center', margin: '4px 0 10px', fontSize: 10, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                                        {formatDate(msg.createdAt)}
                                      </div>
                                    )}
                                    <Bubble msg={msg} isMine={isMine} />
                                  </div>
                                )
                              })}
                            </div>

                            {/* Closed / limit state */}
                            {(cEnded || cLimitReached) && (
                              <div style={{ padding: '14px 18px', background: 'rgba(28,26,23,0.025)', borderTop: '1px solid rgba(28,26,23,0.07)', textAlign: 'center' }}>
                                <div style={{ fontSize: 16, marginBottom: 5 }}>{cEnded ? '🕯️' : '💌'}</div>
                                <div style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 12.5, color: 'var(--ink-muted)', lineHeight: 1.6 }}>
                                  {cEnded
                                    ? 'This conversation was closed with care.'
                                    : 'This conversation has reached its natural end.'}
                                </div>
                              </div>
                            )}

                            {/* Seeker reply input */}
                            {cCanSend && (
                              <div style={{ padding: '12px 14px 14px', borderTop: '1px solid rgba(28,26,23,0.07)', background: '#fff', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {seekerError && (
                                  <div style={{ fontSize: 12, color: 'var(--tc)', fontFamily: '"DM Sans", sans-serif', padding: '6px 10px', background: 'rgba(196,99,58,0.06)', borderRadius: 8 }}>
                                    {seekerError}
                                  </div>
                                )}
                                <textarea
                                  value={seekerText}
                                  onChange={e => { setSeekerText(e.target.value); setSeekerError('') }}
                                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSeekerSend(c) } }}
                                  placeholder="Write back… (Enter to send)"
                                  rows={2}
                                  maxLength={1000}
                                  style={{
                                    width: '100%', padding: '10px 13px', borderRadius: 11,
                                    border: '1px solid rgba(122,158,142,0.22)',
                                    background: 'var(--cream)',
                                    fontSize: 13.5, fontFamily: '"Lora", serif', color: 'var(--ink)',
                                    outline: 'none', resize: 'none', boxSizing: 'border-box',
                                    lineHeight: 1.75, transition: 'border-color 0.2s, box-shadow 0.2s',
                                  }}
                                  onFocus={e => { e.target.style.borderColor = 'rgba(122,158,142,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(122,158,142,0.07)' }}
                                  onBlur={e => { e.target.style.borderColor = 'rgba(122,158,142,0.22)'; e.target.style.boxShadow = 'none' }}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span style={{ fontSize: 11, fontFamily: '"Lora", serif', fontStyle: 'italic', color: 'var(--sage)', opacity: 0.85 }}>
                                    Speak gently 💛
                                  </span>
                                  <button
                                    onClick={() => handleSeekerSend(c)}
                                    disabled={seekerSending || !seekerText.trim()}
                                    style={{
                                      padding: '8px 18px', borderRadius: 999,
                                      background: seekerSending || !seekerText.trim() ? 'rgba(122,158,142,0.3)' : 'var(--sage)',
                                      color: '#fff', border: 'none',
                                      cursor: seekerSending || !seekerText.trim() ? 'default' : 'pointer',
                                      fontSize: 12.5, fontFamily: '"DM Sans", sans-serif', fontWeight: 500,
                                      display: 'flex', alignItems: 'center', gap: 6,
                                      boxShadow: seekerSending || !seekerText.trim() ? 'none' : '0 4px 12px rgba(122,158,142,0.28)',
                                      transition: 'background 0.15s, transform 0.15s, box-shadow 0.15s',
                                    }}
                                    onMouseEnter={e => { if (!seekerSending && seekerText.trim()) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(122,158,142,0.35)' } }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = seekerSending || !seekerText.trim() ? 'none' : '0 4px 12px rgba(122,158,142,0.28)' }}
                                  >
                                    {seekerSending ? <><SpinIcon /> Sending…</> : <><SendIcon /> Send</>}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

        {!letter && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-muted)', fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 14 }}>
            Select a letter to read
          </div>
        )}
      </div>
    </>
  )
}
