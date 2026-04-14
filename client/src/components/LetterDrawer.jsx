import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { apiFetch } from '../utils/api'

const MOOD_META = {
  vent:      { emoji: '🌧️', label: 'I need to vent',  bg: 'rgba(28,26,23,0.12)',      color: 'var(--ink-soft)'   },
  joy:       { emoji: '🌟', label: 'Pure joy',         bg: 'rgba(201,168,76,0.15)',    color: 'var(--gold)'       },
  love:      { emoji: '💌', label: 'Love & warmth',    bg: 'rgba(196,99,58,0.12)',     color: 'var(--tc)'         },
  grief:     { emoji: '🕯️', label: 'Grief & loss',    bg: 'rgba(122,158,142,0.14)',   color: 'var(--sage)'       },
  gratitude: { emoji: '🌿', label: 'Gratitude',        bg: 'rgba(122,112,92,0.12)',    color: '#7A6E5C'           },
  longing:   { emoji: '🌙', label: 'Longing',          bg: 'rgba(139,126,200,0.14)',   color: 'var(--purple)'    },
}

const TYPE_META = {
  personal: { label: 'Personal',        color: 'var(--tc)',   bg: 'rgba(196,99,58,0.08)',   border: 'rgba(196,99,58,0.2)'   },
  stranger: { label: 'Caring Stranger', color: 'var(--sage)', bg: 'rgba(122,158,142,0.08)', border: 'rgba(122,158,142,0.2)' },
  sent:     { label: 'Sent Letter',     color: 'var(--gold)', bg: 'rgba(201,168,76,0.08)',  border: 'rgba(201,168,76,0.2)'  },
}

const BD = 'rgba(28,26,23,0.1)'

export default function LetterDrawer() {
  const { letterPanel, closeLetterPanel, authUser, userRole } = useApp()
  const { open, letter } = letterPanel

  const meta     = letter ? (TYPE_META[letter.type] || TYPE_META.personal) : TYPE_META.personal
  const moodMeta = letter?.mood ? (MOOD_META[letter.mood] || null) : null
  const date     = letter
    ? new Date(letter.createdAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  // ── Who is viewing this letter? ───────────────────────────────────────────
  // isListenerView: listener opened a stranger letter they claimed (hasRead = true, not the owner)
  // isSeekerView:   seeker opens their own stranger letter to see replies
  const letterOwnerId = letter?.userId?._id?.toString() ?? letter?.userId?.toString() ?? ''
  const viewerUserId  = authUser?._id?.toString() ?? ''
  const isOwner        = !!letterOwnerId && !!viewerUserId && letterOwnerId === viewerUserId
  const isListenerView = letter?.type === 'stranger' && letter?.hasRead === true && !isOwner
  const isSeekerView   = letter?.type === 'stranger' && isOwner

  // ── Reply state (listener) ────────────────────────────────────────────────
  const [showReply,    setShowReply]    = useState(false)
  const [replyText,    setReplyText]    = useState('')
  const [replyLoading, setReplyLoading] = useState(false)
  const [replyError,   setReplyError]   = useState('')
  const [replyDone,    setReplyDone]    = useState(false)
  const [listenerReply, setListenerReply] = useState(null) // { message, createdAt } fetched from API
  const [showToast,    setShowToast]    = useState(false)

  // Auto-dismiss toast
  useEffect(() => {
    if (!showToast) return
    const t = setTimeout(() => setShowToast(false), 3000)
    return () => clearTimeout(t)
  }, [showToast])

  // ── Received replies state (seeker) ──────────────────────────────────────
  const [replies,        setReplies]        = useState([])
  const [repliesLoading, setRepliesLoading] = useState(false)

  // Reset + fetch on open/close or letter change
  useEffect(() => {
    setShowReply(false)
    setReplyText('')
    setReplyError('')
    setReplyDone(letter?.hasReplied === true)
    setListenerReply(null)
    setShowToast(false)
    setReplies([])

    if (!open || !letter) return

    // Listener: fetch their own reply so it shows on re-open
    if (isListenerView) {
      apiFetch(`/api/replies/my?parentLetterId=${letter._id}`)
        .then(r => r.json())
        .then(json => { if (json.success && json.data) setListenerReply(json.data) })
        .catch(() => {})
    }

    // Seeker: fetch all replies received on their letter
    if (isSeekerView) {
      setRepliesLoading(true)
      apiFetch(`/api/letters/${letter._id}/replies`)
        .then(r => r.json())
        .then(json => { if (json.success) setReplies(json.data) })
        .catch(() => {})
        .finally(() => setRepliesLoading(false))
    }
  }, [open, letter?._id]) // eslint-disable-line

  async function handleReply() {
    if (!replyText.trim()) return
    setReplyLoading(true)
    setReplyError('')
    try {
      const res  = await apiFetch('/api/replies', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ parentLetterId: letter._id, message: replyText.trim() }),
      })
      const json = await res.json()
      if (json.success) {
        const now = new Date().toISOString()
        setListenerReply({ message: replyText.trim(), createdAt: now })
        setShowToast(true)
        setReplyDone(true)
        setReplyText('')
        setShowReply(false)
      } else {
        setReplyError(json.error || 'Failed to send reply.')
      }
    } catch {
      setReplyError('Network error. Please try again.')
    } finally {
      setReplyLoading(false)
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
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
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
        {/* ── Panel header ──────────────────────────────────────────────── */}
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
          >
            ✕
          </button>
        </div>

        {/* ── Toast banner ──────────────────────────────────────────────── */}
        <div style={{
          position: 'absolute', top: 64, left: 0, right: 0, zIndex: 10,
          padding: '0 20px',
          pointerEvents: 'none',
        }}>
          <div style={{
            background: 'rgba(196,99,58,0.94)',
            color: '#fff',
            borderRadius: 10,
            padding: '11px 18px',
            display: 'flex', alignItems: 'flex-start', gap: 10,
            boxShadow: '0 4px 20px rgba(196,99,58,0.28)',
            opacity: showToast ? 1 : 0,
            transform: showToast ? 'translateY(0)' : 'translateY(-8px)',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
          }}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>💌</span>
            <div>
              <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>
                Reply sent
              </div>
              <div style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 12, opacity: 0.88, marginTop: 2 }}>
                The writer will see it when they open this letter.
              </div>
            </div>
          </div>
        </div>

        {/* ── Letter body ───────────────────────────────────────────────── */}
        {letter && (
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 20px 56px' }}>
            <div style={{ maxWidth: 520, margin: '0 auto' }}>

              {/* Paper card */}
              <div style={{
                background: '#fffaf5',
                borderRadius: '0 0 20px 20px',
                boxShadow: '0 8px 32px rgba(28,26,23,0.08), 0 2px 8px rgba(28,26,23,0.04)',
                border: '1px solid rgba(28,26,23,0.08)',
                borderTop: 'none',
                padding: 'clamp(28px, 5vw, 48px) clamp(24px, 5vw, 44px)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Left accent */}
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                  background: `linear-gradient(180deg, ${meta.color}, var(--gold))`,
                  borderRadius: '0 0 0 16px',
                }} />

                {/* Date */}
                <div style={{
                  fontFamily: 'Lora, serif', fontStyle: 'italic',
                  fontSize: 12, color: 'var(--ink-muted)',
                  textAlign: 'right', marginBottom: 28,
                }}>
                  {date}
                </div>

                {/* Subject */}
                <h2 style={{
                  fontFamily: '"Lora", serif',
                  fontSize: 'clamp(22px, 3vw, 30px)',
                  fontWeight: 700, color: 'var(--ink)',
                  lineHeight: 1.2, letterSpacing: '-0.4px',
                  marginBottom: 6,
                }}>
                  {letter.subject}
                </h2>

                {/* Divider */}
                <div style={{
                  height: 1,
                  background: 'linear-gradient(90deg, rgba(28,26,23,0.12), transparent)',
                  margin: '20px 0 28px',
                }} />

                {/* Message */}
                <div style={{
                  fontFamily: 'Lora, serif',
                  fontSize: 'clamp(14px, 1.8vw, 15.5px)',
                  lineHeight: 2.05,
                  color: 'var(--ink-soft)',
                  whiteSpace: 'pre-line',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                }}>
                  {letter.message}
                </div>

                {/* Seal footer */}
                <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid rgba(28,26,23,0.07)', textAlign: 'center' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 10,
                    padding: '9px 20px', borderRadius: 40,
                    background: 'rgba(28,26,23,0.03)', border: '1px solid rgba(28,26,23,0.08)',
                  }}>
                    <span style={{ fontSize: 14, opacity: 0.5 }}>✉</span>
                    <span style={{ fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif' }}>
                      Letter from Heart
                    </span>
                  </div>
                </div>
              </div>

              {/* ── LISTENER: Conversation thread ─────────────────────── */}
              {isListenerView && (
                <div style={{ marginTop: 0 }}>

                  {/* ── Thread connector line ── */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '20px 0 16px',
                  }}>
                    <div style={{ flex: 1, height: 1, background: 'rgba(28,26,23,0.08)' }} />
                    <span style={{
                      fontSize: 10, letterSpacing: '1.6px', textTransform: 'uppercase',
                      color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif',
                      flexShrink: 0,
                    }}>
                      {replyDone ? 'You responded 💌' : 'Your response'}
                    </span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(28,26,23,0.08)' }} />
                  </div>

                  {/* ── Has replied: show the reply card ── */}
                  {replyDone && listenerReply ? (
                    <div style={{
                      borderRadius: 14,
                      background: 'rgba(196,99,58,0.04)',
                      border: '1px solid rgba(196,99,58,0.15)',
                      boxShadow: '0 2px 12px rgba(28,26,23,0.05)',
                      overflow: 'hidden',
                    }}>
                      {/* Card header */}
                      <div style={{
                        padding: '11px 18px',
                        borderBottom: '1px solid rgba(196,99,58,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'rgba(196,99,58,0.05)',
                      }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 7,
                          fontSize: 11, fontFamily: '"DM Sans", sans-serif',
                          fontWeight: 600, color: 'var(--tc)',
                          letterSpacing: '0.5px',
                        }}>
                          <span style={{ fontSize: 14 }}>💌</span>
                          You responded
                        </div>
                        {listenerReply.createdAt && (
                          <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif' }}>
                            {new Date(listenerReply.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      {/* Reply body */}
                      <div style={{ padding: '16px 18px 18px' }}>
                        <div style={{
                          fontFamily: '"Lora", serif', fontSize: 14.5, lineHeight: 1.9,
                          color: 'var(--ink-soft)', whiteSpace: 'pre-line', wordBreak: 'break-word',
                        }}>
                          {listenerReply.message}
                        </div>
                      </div>
                    </div>

                  /* ── Replied but reply not loaded yet (brief flash) ── */
                  ) : replyDone ? (
                    <div style={{
                      padding: '16px 20px', borderRadius: 12, textAlign: 'center',
                      background: 'rgba(122,158,142,0.06)', border: '1px solid rgba(122,158,142,0.15)',
                    }}>
                      <div style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 13, color: 'var(--sage)' }}>
                        Loading your reply…
                      </div>
                    </div>

                  /* ── Writing: textarea ── */
                  ) : showReply ? (
                    <div style={{
                      borderRadius: 14, background: '#fff',
                      border: `1px solid rgba(28,26,23,0.1)`,
                      boxShadow: '0 2px 12px rgba(28,26,23,0.05)',
                      overflow: 'hidden',
                    }}>
                      <div style={{ padding: '18px 18px 0' }}>
                        <textarea
                          value={replyText}
                          onChange={e => { setReplyText(e.target.value); setReplyError('') }}
                          placeholder="Write something kind, honest, or just present…"
                          rows={5}
                          maxLength={3000}
                          autoFocus
                          style={{
                            width: '100%', padding: '11px 13px', borderRadius: 9,
                            border: '1px solid rgba(122,158,142,0.25)',
                            background: 'var(--cream)',
                            fontSize: 14, fontFamily: '"Lora", serif', color: 'var(--ink)',
                            outline: 'none', resize: 'none', boxSizing: 'border-box',
                            lineHeight: 1.8, transition: 'border-color 0.2s, box-shadow 0.2s',
                          }}
                          onFocus={e => {
                            e.target.style.borderColor = 'rgba(122,158,142,0.55)'
                            e.target.style.boxShadow = '0 0 0 3px rgba(122,158,142,0.1)'
                          }}
                          onBlur={e => {
                            e.target.style.borderColor = 'rgba(122,158,142,0.25)'
                            e.target.style.boxShadow = 'none'
                          }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, padding: '0 2px' }}>
                          <span style={{ fontSize: 11, color: 'var(--sage)', fontFamily: '"Lora", serif', fontStyle: 'italic', opacity: 0.8 }}>
                            Your words matter 💛
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif' }}>
                            {replyText.length}/3000
                          </span>
                        </div>
                        {replyError && (
                          <div style={{
                            marginTop: 10, padding: '8px 12px', borderRadius: 8, fontSize: 12,
                            color: 'var(--tc)', background: 'rgba(196,99,58,0.07)',
                            border: '0.5px solid rgba(196,99,58,0.2)',
                            fontFamily: '"DM Sans", sans-serif',
                          }}>
                            {replyError}
                          </div>
                        )}
                      </div>
                      <div style={{
                        padding: '14px 18px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        borderTop: '1px solid rgba(28,26,23,0.06)', marginTop: 14,
                      }}>
                        <button
                          onClick={() => { setShowReply(false); setReplyText(''); setReplyError('') }}
                          style={{
                            padding: '8px 14px', borderRadius: 8,
                            background: 'transparent', border: '0.5px solid rgba(28,26,23,0.1)',
                            color: 'var(--ink-muted)', cursor: 'pointer',
                            fontSize: 12, fontFamily: '"DM Sans", sans-serif',
                            transition: 'background 0.15s, color 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(28,26,23,0.04)'; e.currentTarget.style.color = 'var(--ink)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-muted)' }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleReply}
                          disabled={replyLoading || !replyText.trim()}
                          style={{
                            padding: '9px 22px', borderRadius: 999,
                            background: replyLoading || !replyText.trim() ? 'rgba(196,99,58,0.3)' : 'var(--tc)',
                            color: '#fff', border: 'none',
                            cursor: replyLoading || !replyText.trim() ? 'default' : 'pointer',
                            fontSize: 13, fontFamily: '"DM Sans", sans-serif', fontWeight: 500,
                            display: 'flex', alignItems: 'center', gap: 6,
                            transition: 'background 0.15s, transform 0.15s',
                            boxShadow: replyLoading || !replyText.trim() ? 'none' : '0 4px 14px rgba(196,99,58,0.3)',
                          }}
                          onMouseEnter={e => { if (!replyLoading && replyText.trim()) e.currentTarget.style.transform = 'translateY(-1px)' }}
                          onMouseLeave={e => { e.currentTarget.style.transform = '' }}
                        >
                          {replyLoading ? (
                            <>
                              <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                              </svg>
                              Sending…
                            </>
                          ) : 'Send reply 💌'}
                        </button>
                      </div>
                    </div>

                  /* ── No reply yet: CTA button ── */
                  ) : (
                    <button
                      onClick={() => setShowReply(true)}
                      style={{
                        width: '100%', padding: '13px 18px', borderRadius: 12,
                        background: 'rgba(196,99,58,0.05)',
                        border: '1px dashed rgba(196,99,58,0.25)',
                        color: 'var(--tc)', cursor: 'pointer',
                        fontSize: 13, fontFamily: '"DM Sans", sans-serif', fontWeight: 500,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                        transition: 'background 0.15s, border-color 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(196,99,58,0.09)'; e.currentTarget.style.borderColor = 'rgba(196,99,58,0.4)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(196,99,58,0.05)'; e.currentTarget.style.borderColor = 'rgba(196,99,58,0.25)' }}
                    >
                      💌 Reply to this letter
                    </button>
                  )}
                </div>
              )}

              {/* ── SEEKER: Replies received section ─────────────────── */}
              {isSeekerView && (
                <div style={{ marginTop: 20 }}>
                  <div style={{
                    fontSize: 11, letterSpacing: '1.4px', textTransform: 'uppercase',
                    color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif',
                    marginBottom: 12,
                  }}>
                    Replies from listeners
                  </div>

                  {repliesLoading ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--ink-muted)', fontSize: 13, fontFamily: '"Lora", serif', fontStyle: 'italic' }}>
                      Loading…
                    </div>
                  ) : replies.length === 0 ? (
                    <div style={{
                      padding: '20px', borderRadius: 12, textAlign: 'center',
                      background: 'rgba(28,26,23,0.025)', border: `1px dashed rgba(28,26,23,0.1)`,
                    }}>
                      <div style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-muted)' }}>
                        No replies yet. Someone may still be writing.
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {replies.map((r, i) => (
                        <div
                          key={r._id || i}
                          style={{
                            padding: '16px 18px', borderRadius: 12,
                            background: '#fff',
                            border: '1px solid rgba(122,158,142,0.2)',
                            boxShadow: '0 2px 8px rgba(28,26,23,0.04)',
                            position: 'relative',
                          }}
                        >
                          {/* Accent bar */}
                          <div style={{
                            position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                            background: 'linear-gradient(180deg, var(--sage), var(--gold))',
                            borderRadius: '12px 0 0 12px',
                          }} />
                          <div style={{
                            fontSize: 10, color: 'var(--sage)', fontFamily: '"DM Sans", sans-serif',
                            letterSpacing: '0.8px', textTransform: 'uppercase', fontWeight: 600,
                            marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5,
                          }}>
                            🌿 A listener replied
                            <span style={{ color: 'var(--ink-muted)', fontWeight: 400, marginLeft: 4 }}>
                              · {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <div style={{
                            fontFamily: '"Lora", serif', fontSize: 14, lineHeight: 1.8,
                            color: 'var(--ink-soft)', whiteSpace: 'pre-line', wordBreak: 'break-word',
                          }}>
                            {r.message}
                          </div>
                        </div>
                      ))}
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
