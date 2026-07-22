import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { apiFetch } from '../utils/api'

// ── Mood + card-type config ───────────────────────────────────────────────────
const MOOD_META = {
  vent:      { emoji: '🌧️', label: 'Need to vent' },
  joy:       { emoji: '🌟', label: 'Joy' },
  love:      { emoji: '💌', label: 'Love' },
  grief:     { emoji: '🕯️', label: 'Grief' },
  gratitude: { emoji: '🌿', label: 'Gratitude' },
  longing:   { emoji: '🌙', label: 'Longing' },
  anger:     { emoji: '🔥', label: 'Anger' },
}

const TYPE_META = {
  personal: { cls: 'c-personal', label: 'Personal',     color: '#B05A1F' },
  stranger: { cls: 'c-anon',     label: 'To a stranger', color: '#5C4FA8' },
  sent:     { cls: 'c-sent',     label: 'Sent',          color: '#9A7A12' },
  received: { cls: 'c-recv',     label: 'For you',       color: '#3E6FA8' },
  read:     { cls: 'c-read',     label: 'Held by me',    color: '#2E7D5B' },
}

const MOOD_OPTIONS = [
  { value: '',          label: 'No mood',      emoji: '—'  },
  { value: 'vent',      label: 'Need to vent', emoji: '🌧️' },
  { value: 'joy',       label: 'Pure joy',     emoji: '🌟' },
  { value: 'love',      label: 'Love & warmth',emoji: '💌' },
  { value: 'grief',     label: 'Grief & loss', emoji: '🕯️' },
  { value: 'gratitude', label: 'Gratitude',    emoji: '🌿' },
  { value: 'longing',   label: 'Longing',      emoji: '🌙' },
]

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Space card ────────────────────────────────────────────────────────────────
function SpaceCard({ letter, onOpen, onEdit, onDelete }) {
  const type = letter._cardType || letter.type || 'personal'
  const meta = TYPE_META[type] || TYPE_META.personal
  const mood = MOOD_META[letter.mood]

  return (
    <div className={`card ${meta.cls}`} onClick={() => onOpen?.(letter)}>
      <div className="row">
        <span className="pill" style={{ color: meta.color }}>{meta.label}</span>
        {mood && <span className="mood">{mood.emoji} {mood.label}</span>}
      </div>
      <h3 className="card-title">{letter.subject || 'A letter from my heart'}</h3>
      <p className="excerpt">{letter.message || '(No content)'}</p>
      <div className="foot">
        <span className="date">{fmtDate(letter.createdAt)}</span>
        {(onEdit || onDelete) && (
          <div className="actions">
            {onEdit && (
              <button onClick={e => { e.stopPropagation(); onEdit(letter) }}>Edit</button>
            )}
            {onDelete && (
              <button className="del" onClick={e => { e.stopPropagation(); onDelete(letter) }}>Delete</button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
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
    <div className="sp-modal-bg" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="sp-modal">
        <div className="sp-modal-head">
          <div className="sp-modal-title">
            Edit letter
            {isStranger && <span className="sp-badge">Caring stranger</span>}
          </div>
          <button className="sp-x" onClick={onClose}>×</button>
        </div>

        <div className="sp-modal-body">
          <label className="sp-field">
            <span>Subject</span>
            <input value={subject} onChange={e => setSubject(e.target.value)} />
          </label>

          <label className="sp-field">
            <span>Message</span>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={10} />
          </label>

          <div className="sp-field">
            <span>Mood</span>
            <div className="sp-moods">
              {MOOD_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`sp-mood ${mood === opt.value ? 'on' : ''}`}
                  onClick={() => setMood(opt.value)}
                >
                  {opt.emoji !== '—' && <span>{opt.emoji}</span>}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="sp-error">{error}</div>}

          <div className="sp-actions">
            <button className="sp-cancel" onClick={onClose}>Cancel</button>
            <button className="sp-save" onClick={handleSave} disabled={saving}>
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
    <div className="sp-modal-bg" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="sp-modal sp-modal-sm">
        <div className="sp-del">
          <div className="sp-del-ico">🗑️</div>
          <h3>Delete this letter?</h3>
          <p className="sp-del-sub">"{letter.subject}"</p>
          <p className="sp-del-note">This cannot be undone.</p>
          <div className="sp-actions center">
            <button className="sp-cancel" onClick={onClose}>Cancel</button>
            <button className="sp-danger" onClick={onConfirm} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Yes, delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ icon, title, subtitle, cta, onCta }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <h3 className="empty-title">{title}</h3>
      {subtitle && <p className="empty-text">{subtitle}</p>}
      {cta && <button className="empty-cta" onClick={onCta}>{cta}</button>}
    </div>
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

  const TABS = [
    { id: 'all',      label: 'All',            count: personal.length + stranger.length + sentLetters.length + receivedLetters.length },
    { id: 'personal', label: 'Personal',        count: personal.length },
    { id: 'sent',     label: 'Sent to Someone', count: sentLetters.length },
    { id: 'received', label: 'For You',         count: receivedLetters.length },
    ...(canWriteStranger ? [{ id: 'stranger', label: 'Send to a Stranger', count: stranger.length }] : []),
    ...(canReadFeed    ? [{ id: 'read',     label: 'Held by Me',        count: readLetters.length }] : []),
  ]

  const visibleLetters = (() => {
    if (activeTab === 'personal') return personal.map(l => ({ ...l, _cardType: 'personal' }))
    if (activeTab === 'sent')     return sentLetters.map(l => ({ ...l, _cardType: 'sent' }))
    if (activeTab === 'received') return receivedLetters.map(l => ({ ...l, _cardType: 'received' }))
    if (activeTab === 'stranger') return stranger.map(l => ({ ...l, _cardType: 'stranger' }))
    if (activeTab === 'read')     return readLetters.map(l => ({ ...l, _cardType: 'read' }))
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

  return (
    <main className="sunrise-space">
      <div className="wrap">

        {/* ── Header ── */}
        <div className="head fade">
          <div>
            <h1 className="sp-h1">
              My Space
              <svg viewBox="0 0 120 10" fill="none" preserveAspectRatio="none" className="underline">
                <path d="M2 6 C 35 2, 70 9, 118 4" stroke="var(--yellow)" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </h1>
            <p className="sp-sub">Everything you've written, read, and held.</p>
          </div>
          <div className="head-right">
            <span className="role">● {ROLE_LABEL[userRole] || 'Member'}</span>
            <button className="write" onClick={() => navigate('write')}>+ Write</button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="tabs fade" style={{ animationDelay: '.08s' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              className={`tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label} <span className="n">{t.count}</span>
            </button>
          ))}
        </div>

        {/* ── Count line ── */}
        {visibleLetters.length > 0 && (
          <div className="countline fade" style={{ animationDelay: '.14s' }}>
            <span className="count-chip">
              {visibleLetters.length} {visibleLetters.length === 1 ? 'letter' : 'letters'}
            </span>
            <span>sorted by newest</span>
          </div>
        )}

        {/* ── Content ── */}
        {visibleLetters.length === 0 ? (
          <div className="fade" style={{ animationDelay: '.2s' }}>
            {activeTab === 'personal' ? (
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
            )}
          </div>
        ) : (
          <div className="grid fade" style={{ animationDelay: '.2s' }}>
            {visibleLetters.map(letter => (
              <SpaceCard
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

        {/* ── Compose teaser ── */}
        {visibleLetters.length > 0 && (
          <div className="teaser fade" style={{ animationDelay: '.28s' }} onClick={() => navigate('write')}>
            <div className="plus">+</div>
            <div>
              <h3>Begin a new letter</h3>
              <p>No pressure. Start with "Dear…" and see where it goes.</p>
            </div>
          </div>
        )}

        {/* ── Modals ── */}
        {editingLetter  && <EditModal   letter={editingLetter}  onSave={handleSaved}          onClose={() => setEditingLetter(null)} />}
        {deletingLetter && <DeleteModal letter={deletingLetter} onConfirm={handleDeleteConfirm} onClose={() => setDeletingLetter(null)} deleting={deleting} />}
      </div>

      <style>{`
        .sunrise-space{ background:var(--cream); min-height:100%; }
        .sunrise-space .wrap{ max-width:1040px; margin:0 auto; padding:52px 28px 120px; }

        .sunrise-space .head{ display:flex; align-items:center; justify-content:space-between; gap:24px; flex-wrap:wrap; }
        .sunrise-space .sp-h1{ font-size:clamp(32px,4.4vw,46px); font-weight:800; letter-spacing:-.02em; position:relative; display:inline-block; color:var(--ink); margin:0; }
        .sunrise-space .underline{ position:absolute; left:0; bottom:-8px; width:65%; height:9px; pointer-events:none; }
        .sunrise-space .sp-sub{ margin-top:16px; font-size:15.5px; color:var(--ink-muted); font-weight:500; }
        .sunrise-space .head-right{ display:flex; align-items:center; gap:12px; }
        .sunrise-space .role{ font-size:12px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; color:#5C4FA8; background:var(--lav); padding:9px 16px; border-radius:100px; white-space:nowrap; }
        .sunrise-space .write{ background:var(--tc); color:#fff; border:none; border-radius:100px; padding:14px 26px; font-family:inherit; font-size:14px; font-weight:800; cursor:pointer; transition:transform .2s, box-shadow .2s; white-space:nowrap; }
        .sunrise-space .write:hover{ transform:scale(1.05); box-shadow:0 10px 26px rgba(244,129,63,.4); }

        .sunrise-space .tabs{ margin-top:40px; display:flex; gap:8px; flex-wrap:wrap; }
        .sunrise-space .tab{ border:2px solid var(--line); background:var(--card); color:var(--ink-soft); border-radius:100px; padding:10px 18px; font-family:inherit; font-size:13px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:8px; transition:all .2s; }
        .sunrise-space .tab .n{ background:#fff; border-radius:100px; padding:2px 9px; font-size:11px; font-weight:800; color:var(--ink-muted); }
        .sunrise-space .tab:hover{ border-color:var(--yellow); background:#FFF7E3; }
        .sunrise-space .tab.active{ background:var(--ink); border-color:var(--ink); color:#fff; }
        .sunrise-space .tab.active .n{ background:rgba(255,255,255,.18); color:#fff; }

        .sunrise-space .countline{ margin:26px 0 22px; display:flex; align-items:center; gap:10px; }
        .sunrise-space .count-chip{ background:var(--yellow); color:var(--ink); font-size:12px; font-weight:800; padding:6px 14px; border-radius:100px; }
        .sunrise-space .countline span:last-child{ font-size:13px; font-weight:600; color:var(--ink-muted); }

        .sunrise-space .grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:18px; }
        .sunrise-space .card{ border-radius:24px; padding:26px; cursor:pointer; transition:transform .25s cubic-bezier(.2,.8,.3,1.2), box-shadow .25s; display:flex; flex-direction:column; gap:11px; border:2px solid transparent; }
        .sunrise-space .card:hover{ transform:translateY(-6px) rotate(-.4deg); box-shadow:0 18px 44px rgba(59,54,99,.13); }
        .sunrise-space .c-personal{ background:#FDEFE4 } .sunrise-space .c-anon{ background:#EFEBFA }
        .sunrise-space .c-sent{ background:#FFF4D6 } .sunrise-space .c-recv{ background:#E8F3FB }
        .sunrise-space .c-read{ background:#E6F4EC }
        .sunrise-space .row{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
        .sunrise-space .pill{ font-size:10.5px; font-weight:800; letter-spacing:.07em; text-transform:uppercase; padding:6px 12px; border-radius:100px; background:#fff; white-space:nowrap; }
        .sunrise-space .mood{ font-size:12.5px; font-weight:700; color:var(--ink-soft); white-space:nowrap; }
        .sunrise-space .card-title{ font-size:17.5px; font-weight:700; line-height:1.35; color:var(--ink); margin:0; }
        .sunrise-space .excerpt{ font-size:13.5px; font-weight:500; color:var(--ink-soft); line-height:1.65; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; margin:0; }
        .sunrise-space .foot{ margin-top:auto; padding-top:12px; display:flex; align-items:center; justify-content:space-between; gap:10px; }
        .sunrise-space .date{ font-size:12px; font-weight:700; color:var(--ink-muted); }
        .sunrise-space .actions{ display:flex; gap:6px; opacity:0; transition:opacity .2s; }
        .sunrise-space .card:hover .actions{ opacity:1 }
        .sunrise-space .actions button{ background:#fff; border:none; border-radius:100px; font-family:inherit; font-size:11px; font-weight:800; color:var(--ink-soft); cursor:pointer; padding:6px 12px; transition:transform .15s; }
        .sunrise-space .actions button:hover{ transform:scale(1.08); }
        .sunrise-space .actions .del{ color:#C74E3B; }
        @media (hover:none){ .sunrise-space .actions{ opacity:1 } }

        .sunrise-space .teaser{ margin-top:44px; background:var(--card); border:3px dashed var(--blush); border-radius:28px; padding:30px 34px; display:flex; align-items:center; gap:20px; cursor:pointer; transition:border-color .25s, transform .25s; }
        .sunrise-space .teaser:hover{ border-color:var(--tc); transform:translateY(-3px); }
        .sunrise-space .plus{ width:52px; height:52px; border-radius:50%; background:var(--tc); color:#fff; display:flex; align-items:center; justify-content:center; font-size:26px; font-weight:700; flex-shrink:0; }
        .sunrise-space .teaser h3{ font-size:18px; font-weight:800; margin:0 0 4px; color:var(--ink); }
        .sunrise-space .teaser p{ font-size:13.5px; font-weight:500; color:var(--ink-muted); margin:0; }

        .sunrise-space .empty{ background:var(--card); border:2px dashed var(--line-strong); border-radius:24px; padding:56px 32px; text-align:center; }
        .sunrise-space .empty-icon{ font-size:40px; margin-bottom:14px; opacity:.5; }
        .sunrise-space .empty-title{ font-size:19px; font-weight:800; color:var(--ink); margin:0 0 8px; }
        .sunrise-space .empty-text{ font-size:14px; color:var(--ink-muted); font-weight:500; line-height:1.7; max-width:330px; margin:0 auto; }
        .sunrise-space .empty-cta{ margin-top:22px; background:var(--tc); color:#fff; border:none; border-radius:100px; padding:13px 24px; font-family:inherit; font-size:13.5px; font-weight:800; cursor:pointer; transition:transform .2s, box-shadow .2s; }
        .sunrise-space .empty-cta:hover{ transform:translateY(-2px); box-shadow:0 10px 26px rgba(244,129,63,.35); }

        /* Modals */
        .sunrise-space .sp-modal-bg{ position:fixed; inset:0; z-index:500; display:flex; align-items:center; justify-content:center; padding:16px; background:rgba(59,54,99,.45); backdrop-filter:blur(4px); }
        .sunrise-space .sp-modal{ width:100%; max-width:560px; background:#fff; border-radius:28px; box-shadow:0 30px 70px rgba(59,54,99,.25); max-height:calc(100dvh - 32px); display:flex; flex-direction:column; overflow:hidden; }
        .sunrise-space .sp-modal-sm{ max-width:420px; }
        .sunrise-space .sp-modal-head{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:24px 28px; border-bottom:2px solid var(--line); flex-shrink:0; }
        .sunrise-space .sp-modal-title{ font-size:19px; font-weight:800; color:var(--ink); display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .sunrise-space .sp-badge{ font-size:10.5px; font-weight:800; text-transform:uppercase; letter-spacing:.06em; background:var(--mint); color:#2E7D5B; padding:5px 11px; border-radius:100px; }
        .sunrise-space .sp-x{ background:var(--card); border:none; width:34px; height:34px; border-radius:50%; font-size:20px; color:var(--ink-soft); cursor:pointer; flex-shrink:0; }
        .sunrise-space .sp-x:hover{ background:var(--blush); }
        .sunrise-space .sp-modal-body{ padding:24px 28px 28px; overflow-y:auto; display:flex; flex-direction:column; gap:18px; }
        .sunrise-space .sp-field{ display:flex; flex-direction:column; gap:8px; }
        .sunrise-space .sp-field > span{ font-size:11.5px; font-weight:800; text-transform:uppercase; letter-spacing:.08em; color:var(--ink-muted); }
        .sunrise-space .sp-field input, .sunrise-space .sp-field textarea{ width:100%; font-family:inherit; font-size:14px; font-weight:500; color:var(--ink); background:var(--card); border:2px solid var(--line); border-radius:14px; padding:12px 14px; outline:none; transition:border-color .2s, box-shadow .2s; }
        .sunrise-space .sp-field textarea{ resize:vertical; line-height:1.7; }
        .sunrise-space .sp-field input:focus, .sunrise-space .sp-field textarea:focus{ border-color:var(--tc); box-shadow:0 0 0 4px rgba(244,129,63,.12); }
        .sunrise-space .sp-moods{ display:flex; flex-wrap:wrap; gap:7px; }
        .sunrise-space .sp-mood{ display:inline-flex; align-items:center; gap:6px; padding:8px 14px; border-radius:100px; cursor:pointer; font-size:12.5px; font-family:inherit; font-weight:700; background:var(--card); color:var(--ink-soft); border:2px solid var(--line); transition:all .15s; }
        .sunrise-space .sp-mood:hover{ border-color:var(--yellow); background:#FFF7E3; }
        .sunrise-space .sp-mood.on{ background:var(--ink); color:#fff; border-color:var(--ink); }
        .sunrise-space .sp-error{ font-size:12.5px; font-weight:600; color:#C74E3B; background:#FDEAE5; border-radius:12px; padding:10px 14px; }
        .sunrise-space .sp-actions{ display:flex; gap:8px; justify-content:flex-end; }
        .sunrise-space .sp-actions.center{ justify-content:center; }
        .sunrise-space .sp-cancel{ background:var(--card); border:2px solid var(--line); color:var(--ink-soft); border-radius:100px; padding:11px 22px; font-family:inherit; font-size:13px; font-weight:700; cursor:pointer; }
        .sunrise-space .sp-cancel:hover{ border-color:var(--ink-muted); }
        .sunrise-space .sp-save{ background:var(--ink); color:#fff; border:none; border-radius:100px; padding:11px 22px; font-family:inherit; font-size:13px; font-weight:800; cursor:pointer; }
        .sunrise-space .sp-save:hover{ background:var(--tc); }
        .sunrise-space .sp-save:disabled{ opacity:.5; cursor:default; }
        .sunrise-space .sp-danger{ background:#C74E3B; color:#fff; border:none; border-radius:100px; padding:11px 22px; font-family:inherit; font-size:13px; font-weight:800; cursor:pointer; }
        .sunrise-space .sp-danger:disabled{ opacity:.5; cursor:default; }
        .sunrise-space .sp-del{ padding:36px 28px 28px; text-align:center; }
        .sunrise-space .sp-del-ico{ font-size:36px; margin-bottom:14px; }
        .sunrise-space .sp-del h3{ font-size:20px; font-weight:800; color:var(--ink); margin:0 0 10px; }
        .sunrise-space .sp-del-sub{ font-size:13.5px; font-weight:600; color:var(--ink-soft); margin:0 0 4px; }
        .sunrise-space .sp-del-note{ font-size:12.5px; font-weight:500; color:var(--ink-muted); margin:0 0 24px; }

        .sunrise-space .fade{ opacity:0; transform:translateY(16px); animation:sunFade .6s cubic-bezier(.2,.7,.2,1) forwards; }
        @keyframes sunFade{ to{ opacity:1; transform:none } }
        @media (prefers-reduced-motion:reduce){ .sunrise-space .fade{ animation:none; opacity:1; transform:none } }
        @media (max-width:560px){ .sunrise-space .wrap{ padding:36px 20px 90px; } }
      `}</style>
    </main>
  )
}
