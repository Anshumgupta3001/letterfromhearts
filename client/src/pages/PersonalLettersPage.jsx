import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { apiFetch } from '../utils/api'

// ── Design constants ──────────────────────────────────────────────────────────
const BD = '#E0D4BC'   // parchment-deeper border
const FT = '#F2EBE0'   // parchment-dark footer bg border

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
      const res  = await apiFetch(`/api/letters/${letter._id}`, {
        method: 'PUT',
        body: JSON.stringify({ subject, message }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Failed to save.'); return }
      onSave(json.data)
    } catch { setError('Network error — check your connection.') }
    finally { setSaving(false) }
  }

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center"
      style={{ background: 'rgba(26,18,8,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full max-w-[560px] mx-4 overflow-hidden animate-fade-up"
        style={{ background: 'var(--cream)', border: `1px solid ${BD}`, borderRadius: 16, boxShadow: '0 24px 64px rgba(26,18,8,0.18)' }}
      >
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
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center"
      style={{ background: 'rgba(26,18,8,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-[400px] mx-4 overflow-hidden animate-fade-up" style={{ background: 'var(--cream)', border: `1px solid ${BD}`, borderRadius: 16, boxShadow: '0 24px 64px rgba(26,18,8,0.18)' }}>
        <div className="px-6 py-6 text-center">
          <div className="text-[32px] mb-3">🗑️</div>
          <div className="font-playfair text-[18px] font-semibold mb-2" style={{ color: 'var(--ink)' }}>Delete this letter?</div>
          <div className="text-[13px] font-light mb-1" style={{ color: 'var(--ink-muted)' }}>"{letter.subject}"</div>
          <div className="text-[12px] font-light mb-6" style={{ color: 'var(--ink-muted)' }}>This cannot be undone.</div>
          <div className="flex gap-2 justify-center">
            <button onClick={onClose} className="px-5 py-[9px] rounded-pill font-sans text-[13px] cursor-pointer bg-transparent" style={{ color: 'var(--ink-muted)', border: `1px solid ${BD}` }}>Cancel</button>
            <button onClick={onConfirm} disabled={deleting} className="px-5 py-[9px] rounded-pill font-sans text-[13px] font-medium border-none cursor-pointer disabled:opacity-50" style={{ background: 'var(--tc)', color: '#fff' }}>
              {deleting ? 'Deleting…' : 'Yes, delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Letter Card ───────────────────────────────────────────────────────────────
function LetterCard({ letter, onEdit, onDelete }) {
  const [hov, setHov] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [editHov, setEditHov] = useState(false)
  const [delHov, setDelHov]   = useState(false)

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
      {/* Left accent */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'linear-gradient(180deg, var(--tc), var(--gold))', borderRadius: '4px 0 0 4px' }} />

      {/* Card body */}
      <div style={{ padding: '26px 28px 22px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
          <h3 style={{ fontFamily: '"Lora", serif', fontSize: 20, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.2, letterSpacing: '-0.2px' }}>
            {letter.subject}
          </h3>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, padding: '5px 11px', borderRadius: 20, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', background: '#fdf0ee', color: 'var(--tc)', flexShrink: 0, border: '1px solid #f5d4ce' }}>
            ✦ Personal
          </span>
        </div>

        <div style={{ fontFamily: 'Lora, serif', fontSize: 14.5, color: 'var(--ink-soft)', marginBottom: 10, fontWeight: 500 }}>
          Dear {letter.subject},
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
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--tc)', fontWeight: 500, cursor: 'pointer', background: 'none', border: 'none', marginBottom: 8, fontFamily: '"DM Sans", sans-serif', transition: 'gap 0.2s' }}
          >
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
      style={{ marginTop: 28, border: `1.5px dashed ${hov ? 'var(--tc)' : BD}`, borderRadius: 14, padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', background: hov ? 'rgba(139,58,42,0.03)' : 'transparent', transition: 'border-color 0.2s, background 0.2s' }}
    >
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: hov ? '#fde8e4' : '#EDE5D4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: 'var(--tc)', flexShrink: 0, transition: 'background 0.2s' }}>+</div>
      <div>
        <div style={{ fontFamily: '"Lora", serif', fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>Begin a new letter</div>
        <div style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-muted)' }}>No pressure. Start with "Dear…" and see where it goes.</div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PersonalLettersPage() {
  const { personalLetters, refreshPersonalLetters, navigate, canWrite } = useApp()
  const [letters, setLetters]         = useState(personalLetters)
  const [search, setSearch]           = useState('')
  const [editingLetter, setEditingLetter] = useState(null)
  const [deletingLetter, setDeletingLetter] = useState(null)
  const [deleting, setDeleting]       = useState(false)
  const [writeBtnHov, setWriteBtnHov] = useState(false)

  useEffect(() => { refreshPersonalLetters() }, [refreshPersonalLetters])
  useEffect(() => { setLetters(personalLetters) }, [personalLetters])

  const filtered = letters.filter(l =>
    !search || l.subject.toLowerCase().includes(search.toLowerCase()) || l.message.toLowerCase().includes(search.toLowerCase())
  )

  function handleSaved(updated) {
    setLetters(prev => prev.map(l => l._id === updated._id ? updated : l))
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

  return (
    <main className="page-enter w-full flex justify-center px-4 sm:px-6" style={{ paddingTop: 52, paddingBottom: 72 }}>
      <div className="w-full max-w-3xl lg:max-w-4xl">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 40, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 18, height: 1, background: BD, display: 'inline-block' }} />
            Your space
          </div>
          <h1 style={{ fontFamily: '"Lora", serif', fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.1, letterSpacing: '-0.5px', marginBottom: 12 }}>
            <span style={{ display: 'inline-block', width: 38, height: 38, background: 'linear-gradient(135deg, #fde8e4, #fdf0e8)', borderRadius: 10, textAlign: 'center', lineHeight: '38px', fontSize: 20, marginRight: 10, verticalAlign: 'middle', position: 'relative', top: -3, border: `1px solid ${BD}` }}>📝</span>
            Personal Letters
          </h1>
          <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.65, maxWidth: 420 }}>
            Letters written for your eyes only. To your past self, your future self, or simply to release what you carry.
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => navigate('write')}
            onMouseEnter={() => setWriteBtnHov(true)}
            onMouseLeave={() => setWriteBtnHov(false)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: writeBtnHov ? '#B85433' : 'var(--tc)', color: '#fff', border: 'none', borderRadius: 10, padding: '14px 24px', fontFamily: '"DM Sans", sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, marginTop: 12, boxShadow: writeBtnHov ? '0 8px 22px rgba(139,58,42,0.3)' : '0 4px 14px rgba(139,58,42,0.25)', transform: writeBtnHov ? 'translateY(-2px)' : 'translateY(0)', transition: 'all 0.2s' }}
          >
            <span>✦</span> Write a letter
          </button>
        )}
      </div>

      {/* ── Search ──────────────────────────────────────────────────── */}
      {letters.length > 0 && (
        <div style={{ position: 'relative', marginBottom: 32 }}>
          <span style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)', pointerEvents: 'none' }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search your letters…"
            style={{ width: '100%', padding: '14px 18px 14px 46px', border: `1.5px solid ${BD}`, borderRadius: 10, background: 'rgba(255,255,255,0.6)', fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 14.5, color: 'var(--ink)', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--tc)'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,58,42,0.08)' }}
            onBlur={e => { e.currentTarget.style.borderColor = BD; e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; e.currentTarget.style.boxShadow = 'none' }}
          />
        </div>
      )}

      {/* ── Count row ───────────────────────────────────────────────── */}
      {letters.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ background: '#EDE5D4', color: 'var(--ink-soft)', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
              {filtered.length} letter{filtered.length !== 1 ? 's' : ''}
            </span>
            {search ? `matching "${search}"` : 'sorted by newest'}
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-muted)', cursor: 'pointer', padding: '6px 12px', borderRadius: 7, border: `1px solid ${BD}`, background: 'transparent', fontFamily: '"DM Sans", sans-serif' }}>
            ↕ Sort
          </button>
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────────── */}
      {letters.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '72px 40px', borderRadius: 16, background: 'rgba(255,255,255,0.5)', border: `1.5px dashed ${BD}` }}>
          <div style={{ fontSize: 48, marginBottom: 20, opacity: 0.4 }}>🪞</div>
          <div style={{ fontFamily: '"Lora", serif', fontSize: 22, fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }}>Your private space</div>
          <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.7, maxWidth: 320, margin: '0 auto 28px' }}>
            Write to yourself — your past self, your future self, or simply release what you carry. No one else will ever read these.
          </p>
          {canWrite && (
            <button
              onClick={() => navigate('write')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--tc)', color: '#fff', border: 'none', borderRadius: 10, padding: '14px 24px', fontFamily: '"DM Sans", sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer', boxShadow: '0 4px 14px rgba(139,58,42,0.25)' }}
            >
              ✦ Write your first letter
            </button>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink-muted)', fontSize: 13, fontFamily: 'Lora, serif', fontStyle: 'italic' }}>
          No letters match "<span style={{ color: 'var(--ink-soft)' }}>{search}</span>"
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(letter => (
            <LetterCard key={letter._id} letter={letter} onEdit={setEditingLetter} onDelete={setDeletingLetter} />
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
