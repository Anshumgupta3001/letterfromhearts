import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { apiFetch } from '../utils/api'

const BD = '#E0D4BC'
const FT = '#F2EBE0'

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
          <span className="font-playfair text-[18px] font-semibold" style={{ color: 'var(--ink)' }}>Edit Letter</span>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer bg-transparent border-none text-[20px]" style={{ color: 'var(--ink-muted)' }}>×</button>
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
          <div className="font-playfair text-[18px] font-semibold mb-2" style={{ color: 'var(--ink)' }}>Delete this letter?</div>
          <div className="text-[13px] font-light mb-1" style={{ color: 'var(--ink-muted)' }}>"{letter.subject}"</div>
          <div className="text-[12px] font-light mb-6" style={{ color: 'var(--ink-muted)' }}>It will be removed from the feed. This cannot be undone.</div>
          <div className="flex gap-2 justify-center">
            <button onClick={onClose} className="px-5 py-[9px] rounded-pill font-sans text-[13px] cursor-pointer bg-transparent" style={{ color: 'var(--ink-muted)', border: `1px solid ${BD}` }}>Cancel</button>
            <button onClick={onConfirm} disabled={deleting} className="px-5 py-[9px] rounded-pill font-sans text-[13px] font-medium border-none cursor-pointer disabled:opacity-50" style={{ background: 'var(--tc)', color: '#fff' }}>{deleting ? 'Deleting…' : 'Yes, delete'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Stranger Card ─────────────────────────────────────────────────────────────
function StrangerCard({ letter, onEdit, onDelete }) {
  const [hov, setHov] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [editHov, setEditHov]   = useState(false)
  const [delHov, setDelHov]     = useState(false)

  const date   = new Date(letter.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const isLong = letter.message.length > 220

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
      {/* Left accent — sage */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'linear-gradient(180deg, var(--sage), var(--gold))', borderRadius: '4px 0 0 4px' }} />

      {/* Card body */}
      <div style={{ padding: '26px 28px 22px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
          <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: 20, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.2, letterSpacing: '-0.2px' }}>
            {letter.subject}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, padding: '5px 11px', borderRadius: 20, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', background: 'rgba(122,158,142,0.1)', color: 'var(--sage)', border: '1px solid rgba(122,158,142,0.25)' }}>
              🔒 Anonymous
            </span>
            {letter.hasRead && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, padding: '4px 10px', borderRadius: 20, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', background: 'rgba(139,126,200,0.1)', color: 'var(--purple)', border: '1px solid rgba(139,126,200,0.25)' }}>
                ✓ Read
              </span>
            )}
          </div>
        </div>

        <div style={{ fontFamily: 'Lora, serif', fontSize: 14.5, color: 'var(--ink-soft)', marginBottom: 10, fontWeight: 500 }}>
          A stranger writes,
        </div>

        <p style={{
          fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 14,
          color: 'var(--ink-muted)', lineHeight: 1.7, marginBottom: 16,
          whiteSpace: 'pre-line',
          ...(expanded ? {} : { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }),
        }}>
          {letter.message}
        </p>

        {isLong && (
          <button onClick={() => setExpanded(e => !e)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--sage)', fontWeight: 500, cursor: 'pointer', background: 'none', border: 'none', marginBottom: 8, fontFamily: '"DM Sans", sans-serif' }}>
            {expanded ? 'Show less ↑' : 'Read more →'}
          </button>
        )}
      </div>

      {/* Card footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 28px 14px 32px', borderTop: `1px solid ${FT}`, background: 'rgba(245,240,232,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--ink-muted)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5 }}>
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {date}
        </div>
        {letter.isOwner && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => onEdit(letter)}
              onMouseEnter={() => setEditHov(true)}
              onMouseLeave={() => setEditHov(false)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: '"DM Sans", sans-serif', transition: 'all 0.15s', border: editHov ? '1.5px solid var(--gold)' : '1.5px solid #E0D4BC', color: editHov ? 'var(--gold)' : 'var(--ink-soft)', background: editHov ? '#fef9f2' : 'transparent' }}
            >✏ Edit</button>
            <button
              onClick={() => onDelete(letter)}
              onMouseEnter={() => setDelHov(true)}
              onMouseLeave={() => setDelHov(false)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: '"DM Sans", sans-serif', transition: 'all 0.15s', border: delHov ? '1.5px solid var(--tc)' : '1.5px solid #f5d4ce', color: delHov ? '#fff' : 'var(--tc)', background: delHov ? 'var(--tc)' : 'transparent' }}
            >✕ Delete</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Compose teaser ────────────────────────────────────────────────────────────
function ComposeTeaser({ onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ marginTop: 28, border: `1.5px dashed ${hov ? 'var(--sage)' : BD}`, borderRadius: 14, padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', background: hov ? 'rgba(122,158,142,0.03)' : 'transparent', transition: 'border-color 0.2s, background 0.2s' }}
    >
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: hov ? 'rgba(122,158,142,0.15)' : '#EDE5D4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: 'var(--sage)', flexShrink: 0, transition: 'background 0.2s' }}>+</div>
      <div>
        <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>Share something with a stranger</div>
        <div style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-muted)' }}>Your words might be exactly what someone needs to hear today.</div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CaringStrangerPage() {
  const { strangerLetters, refreshStrangerLetters, navigate, canReadFeed, canWrite } = useApp()

  // ── All hooks before any conditional return ──
  const [letters, setLetters]               = useState(strangerLetters)
  const [editingLetter, setEditingLetter]   = useState(null)
  const [deletingLetter, setDeletingLetter] = useState(null)
  const [deleting, setDeleting]             = useState(false)
  const [writeBtnHov, setWriteBtnHov]       = useState(false)

  useEffect(() => { refreshStrangerLetters() }, [refreshStrangerLetters])
  useEffect(() => { setLetters(strangerLetters) }, [strangerLetters])

  function handleSaved(updated) {
    setLetters(prev => prev.map(l => l._id === updated._id ? { ...updated, isOwner: true } : l))
    setEditingLetter(null)
  }

  async function handleDeleteConfirm() {
    setDeleting(true)
    try {
      const res = await apiFetch(`/api/letters/${deletingLetter._id}`, { method: 'DELETE' })
      if (res.ok) {
        setLetters(prev => prev.filter(l => l._id !== deletingLetter._id))
        setDeletingLetter(null)
      }
    } catch { }
    finally { setDeleting(false) }
  }

  // ── Seeker gate ──────────────────────────────────────────────────
  if (!canReadFeed) {
    return (
      <main className="page-enter w-full flex justify-center px-4 sm:px-6" style={{ paddingTop: 56, paddingBottom: 80 }}>
      <div className="w-full max-w-3xl lg:max-w-4xl">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 48, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 18, height: 1, background: BD, display: 'inline-block' }} />
              For a caring stranger
            </div>
            <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.1, letterSpacing: '-0.5px', marginBottom: 12 }}>
              <span style={{ display: 'inline-block', width: 38, height: 38, background: 'linear-gradient(135deg, #ecf3ef, #f0f7f4)', borderRadius: 10, textAlign: 'center', lineHeight: '38px', fontSize: 20, marginRight: 10, verticalAlign: 'middle', position: 'relative', top: -3, border: `1px solid ${BD}` }}>🌍</span>
              Caring Stranger
            </h1>
            <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.65, maxWidth: 420 }}>
              Your letter is already out there — held gently by a stranger who needed to read it.
            </p>
          </div>
          {canWrite && (
            <button onClick={() => navigate('write')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--sage)', color: '#fff', border: 'none', borderRadius: 10, padding: '14px 24px', fontFamily: '"DM Sans", sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer', flexShrink: 0, marginTop: 12, boxShadow: '0 4px 14px rgba(90,112,96,0.25)' }}>
              <span>✦</span> Write another
            </button>
          )}
        </div>
        <div style={{ textAlign: 'center', padding: '72px 40px', borderRadius: 16, background: 'rgba(255,255,255,0.5)', border: `1.5px dashed ${BD}` }}>
          <div style={{ fontSize: 48, marginBottom: 20, opacity: 0.4 }}>🌿</div>
          <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }}>Your words are being heard</div>
          <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.7, maxWidth: 340, margin: '0 auto' }}>
            The Caring Stranger feed is read by listeners. Your anonymous letters travel to strangers who need them most.
          </p>
        </div>
      </div>
      </main>
    )
  }

  return (
    <main className="page-enter w-full flex justify-center px-4 sm:px-6" style={{ paddingTop: 56, paddingBottom: 80 }}>
      <div className="w-full max-w-3xl lg:max-w-4xl">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 40, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 18, height: 1, background: BD, display: 'inline-block' }} />
            Anonymous feed
          </div>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.1, letterSpacing: '-0.5px', marginBottom: 12 }}>
            <span style={{ display: 'inline-block', width: 38, height: 38, background: 'linear-gradient(135deg, #ecf3ef, #f0f7f4)', borderRadius: 10, textAlign: 'center', lineHeight: '38px', fontSize: 20, marginRight: 10, verticalAlign: 'middle', position: 'relative', top: -3, border: `1px solid ${BD}` }}>🌍</span>
            Caring Stranger
          </h1>
          <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.65, maxWidth: 420 }}>
            Anonymous letters from people around the world. Real feelings, no names. A safe space.
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => navigate('write')}
            onMouseEnter={() => setWriteBtnHov(true)}
            onMouseLeave={() => setWriteBtnHov(false)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: writeBtnHov ? '#5A8070' : 'var(--sage)', color: '#fff', border: 'none', borderRadius: 10, padding: '14px 24px', fontFamily: '"DM Sans", sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer', flexShrink: 0, marginTop: 12, boxShadow: writeBtnHov ? '0 8px 22px rgba(90,112,96,0.3)' : '0 4px 14px rgba(90,112,96,0.25)', transform: writeBtnHov ? 'translateY(-2px)' : 'translateY(0)', transition: 'all 0.2s' }}
          >
            <span>✦</span> Write a letter
          </button>
        )}
      </div>

      {/* ── Count row ───────────────────────────────────────────────── */}
      {letters.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ background: '#EDE5D4', color: 'var(--ink-soft)', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
              {letters.length} letter{letters.length !== 1 ? 's' : ''}
            </span>
            shared anonymously
          </div>
          <button onClick={() => refreshStrangerLetters()} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-muted)', cursor: 'pointer', padding: '6px 12px', borderRadius: 7, border: `1px solid ${BD}`, background: 'transparent', fontFamily: '"DM Sans", sans-serif' }}>↻ Refresh</button>
        </div>
      )}

      {/* ── Anonymous note ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 32, padding: '16px 20px', borderRadius: 12, background: 'rgba(122,158,142,0.06)', border: '1px solid rgba(122,158,142,0.2)' }}>
        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 2 }}>🔒</span>
        <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.65, margin: 0 }}>
          Every letter here is completely anonymous. No names, no profiles — just honest words from real people.
        </p>
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      {letters.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '72px 40px', borderRadius: 16, background: 'rgba(255,255,255,0.5)', border: `1.5px dashed ${BD}` }}>
          <div style={{ fontSize: 48, marginBottom: 20, opacity: 0.35 }}>🌿</div>
          <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }}>Nothing here yet</div>
          <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 14.5, color: 'var(--ink-muted)', lineHeight: 1.75, maxWidth: 300, margin: '0 auto 28px' }}>
            Be the first to share. Someone out there needs to read exactly what you've been carrying.
          </p>
          {canWrite && (
            <button onClick={() => navigate('write')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--sage)', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 24px', fontFamily: '"DM Sans", sans-serif', fontSize: 13, fontWeight: 500, cursor: 'pointer', boxShadow: '0 4px 14px rgba(90,112,96,0.25)', transition: 'all 0.2s' }}>
              Write the first letter
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {letters.map(letter => (
            <StrangerCard key={letter._id} letter={letter} onEdit={setEditingLetter} onDelete={setDeletingLetter} />
          ))}
        </div>
      )}

      {/* ── Compose teaser ──────────────────────────────────────────── */}
      {letters.length > 0 && canWrite && <ComposeTeaser onClick={() => navigate('write')} />}

      {/* ── Modals ──────────────────────────────────────────────────── */}
      {editingLetter  && <EditModal   letter={editingLetter}  onSave={handleSaved}        onClose={() => setEditingLetter(null)} />}
      {deletingLetter && <DeleteModal letter={deletingLetter} onConfirm={handleDeleteConfirm} onClose={() => setDeletingLetter(null)} deleting={deleting} />}
      </div>
    </main>
  )
}
