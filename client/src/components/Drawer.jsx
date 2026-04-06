import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { seekerLetters, listenerReplies, openLetters, statusConfig } from '../data/mockData'

function LetterBody({ letter, compact }) {
  if (!letter) return null
  return (
    <>
      {!compact && (
        <div className="font-lora text-[12px] italic text-ink-muted text-right mb-5">{letter.date}</div>
      )}
      <div className="font-lora text-[20px] font-medium text-ink mb-4 tracking-[-0.3px]">{letter.sal}</div>
      <div className="font-lora text-[15px] leading-[1.9] text-ink-soft">
        {(letter.body || '').split('\n\n').map((p, i) => (
          <p key={i} className="mb-[18px] last:mb-0">{p}</p>
        ))}
      </div>
      {letter.signoff && (
        <div className="mt-6 font-lora text-[13px] italic text-ink-muted">{letter.signoff}</div>
      )}
      <div className="font-lora text-[20px] font-medium text-ink mt-[5px]">{letter.sig}</div>
    </>
  )
}

function Divider({ icon = '✦' }) {
  return (
    <div className="flex items-center gap-[10px] my-6">
      <div className="flex-1 h-px" style={{ background: 'rgba(28,26,23,0.07)' }} />
      <span className="text-[12px] text-ink-muted">{icon}</span>
      <div className="flex-1 h-px" style={{ background: 'rgba(28,26,23,0.07)' }} />
    </div>
  )
}

function NewBanner({ text }) {
  return (
    <div
      className="flex items-center gap-[9px] px-[15px] py-[11px] rounded-[7px] mb-[10px]"
      style={{ background: 'rgba(196,99,58,0.06)', border: '0.5px solid rgba(196,99,58,0.18)' }}
    >
      <span className="w-[7px] h-[7px] rounded-full flex-shrink-0 animate-blink-fast" style={{ background: 'var(--tc)' }} />
      <span className="text-[12px]" style={{ color: 'var(--tc)' }}>{text}</span>
    </div>
  )
}

function ReplyPaper({ children, who }) {
  return (
    <div
      className="px-[26px] py-[22px] rounded-lg mt-[10px]"
      style={{ background: 'rgba(122,158,142,0.04)', border: '0.5px solid rgba(122,158,142,0.18)' }}
    >
      {who && <div className="text-[10px] tracking-[1px] uppercase font-medium mb-[10px]" style={{ color: 'var(--sage)' }}>{who}</div>}
      {children}
    </div>
  )
}

function ReplyComposer({ onSent }) {
  const [text, setText] = useState('')
  const [anon, setAnon] = useState(true)
  const [sent, setSent] = useState(false)

  function handleSend() {
    if (!text.trim()) return
    setSent(true)
    if (onSent) onSent()
  }

  if (sent) {
    return (
      <div className="text-center py-[10px] animate-fade-up">
        <div className="font-lora text-[15px] font-medium text-ink mb-1">Your reply is on its way. 💌</div>
        <div className="text-[12px] text-ink-muted font-light">They'll receive it as a beautiful letter.</div>
      </div>
    )
  }

  return (
    <div className="animate-fade-up">
      <textarea
        className="w-full min-h-[110px] font-lora text-[14px] italic leading-[1.85] text-ink-soft rounded-lg px-4 py-[13px] outline-none resize-none transition-all duration-200"
        placeholder={"Dear friend,\n\nI read your letter…"}
        value={text}
        onChange={e => setText(e.target.value)}
        style={{ background: 'var(--cream)', border: '0.5px solid rgba(28,26,23,0.1)' }}
        onFocus={e => (e.target.style.borderColor = 'rgba(196,99,58,0.35)')}
        onBlur={e => (e.target.style.borderColor = 'rgba(28,26,23,0.1)')}
      />
      <div className="flex items-center justify-between gap-[10px] mt-[9px]">
        <div
          className="flex items-center gap-[7px] text-[12px] text-ink-muted cursor-pointer select-none"
          onClick={() => setAnon(v => !v)}
        >
          <div className={`toggle-track ${anon ? 'on' : ''}`}>
            <div className="toggle-thumb" />
          </div>
          <span>{anon ? 'Replying anonymously' : 'Signing with my name'}</span>
        </div>
        <button
          onClick={handleSend}
          className="px-[22px] py-[10px] bg-ink text-cream font-sans text-[12px] border-none rounded-pill cursor-pointer transition-all duration-200 hover:bg-tc"
        >
          Send →
        </button>
      </div>
    </div>
  )
}

/* ── SEEKER DRAWER CONTENT ── */
function SeekerDrawerContent({ letter }) {
  const [showReply, setShowReply] = useState(false)
  const [replySent, setReplySent] = useState(false)

  if (letter.status === 'burn') {
    return (
      <>
        <div className="text-center p-6 rounded-lg" style={{ background: 'rgba(139,126,200,0.05)', border: '0.5px solid rgba(139,126,200,0.15)' }}>
          <div className="text-[28px] mb-[10px]">🕯️</div>
          <div className="font-lora text-[16px] font-medium text-ink mb-2">This letter was released.</div>
          <div className="text-[13px] text-ink-muted font-light leading-[1.6]">
            You wrote what you needed to say and let it go. The words existed. That was enough. They are not stored here.
          </div>
        </div>
        <div className="py-[18px] text-center">
          <div className="text-[11px] text-ink-muted font-light">"Some words just need to be said. Not kept. Not replied to. Just said."</div>
        </div>
      </>
    )
  }

  if (letter.status === 'capsule') {
    return (
      <>
        <LetterBody letter={letter.letter} />
        <Divider icon="⏳" />
        <div className="rounded-lg p-5 text-center" style={{ background: 'rgba(201,168,76,0.06)', border: '0.5px solid rgba(201,168,76,0.2)' }}>
          <div className="text-[22px] mb-2">🔒</div>
          <div className="font-lora text-[15px] font-medium text-ink mb-[5px]">Sealed until {letter.deliveryDate}</div>
          <div className="text-[12px] text-ink-muted">4,748 days from now. They'll receive it exactly as written.</div>
        </div>
        <div className="py-4 text-center">
          <div className="text-[11px] text-ink-muted font-light">
            Delivery: <strong>{letter.deliveryDate}</strong> · <span className="underline cursor-pointer" style={{ color: 'var(--gold)' }}>Change date</span>
          </div>
        </div>
      </>
    )
  }

  if (letter.status === 'waiting') {
    return (
      <>
        <LetterBody letter={letter.letter} />
        <div
          className="text-center p-6 rounded-lg mt-5"
          style={{ background: 'rgba(28,26,23,0.025)', border: '0.5px dashed rgba(28,26,23,0.1)' }}
        >
          <div className="text-[24px] mb-2">🕐</div>
          <div className="font-lora text-[15px] font-medium text-ink mb-[5px]">Your letter is out there.</div>
          <div className="text-[12px] text-ink-muted font-light leading-[1.6]">A listener will find it when the time is right. You'll be notified when they reply.</div>
        </div>
        <div className="py-4 text-center">
          <div className="text-[11px] text-ink-muted font-light">Your letter is in the feed · Sent {letter.timeAgo}</div>
        </div>
      </>
    )
  }

  // has reply
  return (
    <>
      <LetterBody letter={letter.letter} />
      <Divider icon="✦" />
      <NewBanner text={<><strong>A listener wrote back.</strong> They read your letter carefully.</>} />
      <ReplyPaper who="Listener's reply">
        <LetterBody letter={letter.listenerReply} compact />
      </ReplyPaper>

      {/* Footer: write back */}
      <div className="mt-4">
        {replySent ? (
          <div className="text-center py-[10px] animate-fade-up">
            <div className="font-lora text-[15px] font-medium text-ink mb-1">Your reply is on its way. 💌</div>
            <div className="text-[12px] text-ink-muted font-light">They'll receive it as a beautiful letter.</div>
          </div>
        ) : (
          <>
            {!showReply && (
              <button
                onClick={() => setShowReply(true)}
                className="w-full py-[14px] bg-ink text-cream font-sans text-[14px] border-none rounded-[10px] cursor-pointer transition-all duration-300 hover:bg-tc hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(196,99,58,0.25)]"
              >
                Write back to the listener
              </button>
            )}
            {showReply && <ReplyComposer onSent={() => setReplySent(true)} />}
          </>
        )}
        <div className="text-center mt-[9px] text-[11px] text-ink-muted font-light">Your reply is private between you and this listener.</div>
      </div>
    </>
  )
}

/* ── LISTENER DRAWER CONTENT ── */
function ListenerDrawerContent({ reply }) {
  const [showReply, setShowReply] = useState(false)
  const [replySent, setReplySent] = useState(false)

  return (
    <>
      <div className="text-[10px] tracking-[1.5px] uppercase font-medium text-ink-muted mb-2">Their letter</div>
      <LetterBody letter={reply.seekerLetter} />

      {reply.seekerLetter?.tone && (
        <div className="mt-5 px-[15px] py-3 rounded-[7px]" style={{ background: 'rgba(28,26,23,0.03)', border: '0.5px solid rgba(28,26,23,0.07)' }}>
          <div className="text-[10px] tracking-[1.5px] uppercase font-medium text-ink-muted mb-1">What they needed</div>
          <div className="text-[13px] text-ink-soft italic font-light leading-[1.5]">"{reply.seekerLetter.tone}"</div>
        </div>
      )}

      <Divider icon="✦" />
      <div className="text-[10px] tracking-[1.5px] uppercase font-medium mb-2" style={{ color: 'var(--sage)' }}>Your reply</div>
      <ReplyPaper>
        <LetterBody letter={reply.myReply} compact />
      </ReplyPaper>

      {reply.theirReply ? (
        <>
          <Divider icon="✦" />
          <NewBanner text={reply.closed ? <><strong>They closed this conversation.</strong></> : <><strong>They wrote back to you.</strong></>} />
          <ReplyPaper>
            <LetterBody letter={reply.theirReply} compact />
          </ReplyPaper>
          {reply.theirReply && !reply.closed && (
            <div className="mt-4">
              {replySent ? (
                <div className="text-center py-[10px] animate-fade-up">
                  <div className="font-lora text-[15px] font-medium text-ink mb-1">Your reply is on its way. 💌</div>
                  <div className="text-[12px] text-ink-muted font-light">They'll receive it as a beautiful letter.</div>
                </div>
              ) : (
                <>
                  {!showReply && (
                    <button
                      onClick={() => setShowReply(true)}
                      className="w-full py-[14px] bg-ink text-cream font-sans text-[14px] border-none rounded-[10px] cursor-pointer transition-all duration-300 hover:bg-tc hover:-translate-y-0.5"
                    >
                      Write back
                    </button>
                  )}
                  {showReply && <ReplyComposer onSent={() => setReplySent(true)} />}
                </>
              )}
            </div>
          )}
          {reply.closed && (
            <div className="py-4 text-center">
              <div className="text-[11px] text-ink-muted font-light">This conversation has found its ending. Thank you for listening.</div>
            </div>
          )}
        </>
      ) : (
        <div
          className="text-center p-6 rounded-lg mt-5"
          style={{ background: 'rgba(28,26,23,0.025)', border: '0.5px dashed rgba(28,26,23,0.1)' }}
        >
          <div className="text-[24px] mb-2">🕐</div>
          <div className="font-lora text-[15px] font-medium text-ink mb-[5px]">Your reply is with them.</div>
          <div className="text-[12px] text-ink-muted font-light leading-[1.6]">They may write back, or simply hold your words. Both are okay.</div>
        </div>
      )}
    </>
  )
}

/* ── OPEN LETTER DRAWER CONTENT ── */
function OpenLetterDrawerContent({ letter, onClaim }) {
  const [claimed, setClaimed] = useState(false)
  const [replySent, setReplySent] = useState(false)

  function handleClaim() {
    setClaimed(true)
    onClaim(letter.id)
  }

  return (
    <>
      <LetterBody letter={{ date: 'Letter from Heart', sal: letter.sal, body: letter.full, signoff: letter.signoff, sig: letter.sig }} />
      <div className="mt-5 px-[15px] py-3 rounded-[7px]" style={{ background: 'rgba(28,26,23,0.03)', border: '0.5px solid rgba(28,26,23,0.07)' }}>
        <div className="text-[10px] tracking-[1.5px] uppercase font-medium text-ink-muted mb-1">What they need from you</div>
        <div className="text-[13px] text-ink-soft italic font-light leading-[1.5]">"{letter.tone}"</div>
      </div>

      {!claimed ? (
        <div className="mt-4">
          <button
            onClick={handleClaim}
            className="w-full py-[14px] bg-ink text-cream font-sans text-[14px] border-none rounded-[10px] cursor-pointer transition-all duration-300 hover:bg-tc hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(196,99,58,0.25)]"
          >
            I want to reply to this letter
          </button>
          <div className="text-center mt-[9px] text-[11px] text-ink-muted font-light">Once you claim this, it leaves the feed. Only you will reply.</div>
        </div>
      ) : (
        <div className="mt-4">
          <div
            className="flex items-center gap-[9px] px-4 py-[11px] rounded-lg mb-4"
            style={{ background: 'rgba(122,158,142,0.08)', border: '0.5px solid rgba(122,158,142,0.2)' }}
          >
            <span>🌱</span>
            <span className="text-[12px]" style={{ color: 'var(--sage)' }}><strong>Claimed.</strong> This letter is no longer in the feed.</span>
          </div>
          <div
            className="font-lora text-[13px] italic text-ink-muted mb-3 px-[14px] py-[10px] rounded-md"
            style={{ background: 'rgba(28,26,23,0.025)' }}
          >
            Write your reply below. Take your time.
          </div>
          {replySent ? (
            <div className="text-center py-[10px] animate-fade-up">
              <div className="font-lora text-[15px] font-medium text-ink mb-1">Your reply is on its way. 💌</div>
              <div className="text-[12px] text-ink-muted font-light">They'll receive it as a beautiful letter.</div>
            </div>
          ) : (
            <ReplyComposer onSent={() => setReplySent(true)} />
          )}
        </div>
      )}
    </>
  )
}

/* ── MAIN DRAWER ── */
export default function Drawer() {
  const { drawer, closeDrawer, seekerLetters, listenerReplies, openLetters, claimLetter } = useApp()

  const seeker = seekerLetters.find(l => l.id === drawer.id)
  const listener = listenerReplies.find(r => r.id === drawer.id)
  const openLetter = openLetters.find(l => l.id === drawer.id)

  let headerChips = null
  let bodyContent = null

  if (drawer.type === 'seeker' && seeker) {
    const statusLabel = statusConfig[seeker.status]?.label || seeker.status
    headerChips = (
      <>
        <span className="text-[11px] px-[11px] py-[3px] rounded-pill font-medium" style={{ background: 'rgba(196,99,58,0.08)', color: 'var(--tc)' }}>Your letter</span>
        <span className="text-[11px] px-[11px] py-[3px] rounded-pill font-medium" style={{ background: seeker.status === 'new-reply' ? 'rgba(196,99,58,0.08)' : 'rgba(28,26,23,0.06)', color: seeker.status === 'new-reply' ? 'var(--tc)' : 'var(--ink-muted)' }}>{statusLabel}</span>
      </>
    )
    bodyContent = <SeekerDrawerContent letter={seeker} />
  } else if (drawer.type === 'listener' && listener) {
    const statusLabel = { waiting: 'Waiting for reply', 'new-reply': 'They wrote back', closed: 'Conversation closed' }[listener.status] || listener.status
    headerChips = (
      <>
        <span className="text-[11px] px-[11px] py-[3px] rounded-pill font-medium" style={{ background: 'rgba(122,158,142,0.09)', color: 'var(--sage)' }}>You replied</span>
        <span className="text-[11px] px-[11px] py-[3px] rounded-pill font-medium" style={{ background: listener.status === 'new-reply' ? 'rgba(196,99,58,0.08)' : 'rgba(28,26,23,0.06)', color: listener.status === 'new-reply' ? 'var(--tc)' : 'var(--ink-muted)' }}>{statusLabel}</span>
      </>
    )
    bodyContent = <ListenerDrawerContent reply={listener} />
  } else if (drawer.type === 'open' && openLetter) {
    headerChips = (
      <div className="flex items-center gap-1.5 text-[11px] tracking-[0.7px] uppercase font-medium text-ink-muted">
        {openLetter.emoji} {openLetter.moodLabel}
      </div>
    )
    bodyContent = <OpenLetterDrawerContent letter={openLetter} onClaim={claimLetter} />
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[300] transition-opacity duration-[400ms] ${drawer.open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'rgba(28,26,23,0.28)', backdropFilter: 'blur(3px)' }}
        onClick={closeDrawer}
      />
      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-[301] flex flex-col bg-paper shadow-[-20px_0_80px_rgba(28,26,23,0.13)] drawer-panel ${drawer.open ? 'open' : ''}`}
        style={{ width: 640, maxWidth: '100vw' }}
      >
        {/* Header */}
        <div
          className="px-7 py-4 flex items-center justify-between flex-shrink-0 gap-3"
          style={{ borderBottom: '0.5px solid rgba(28,26,23,0.07)' }}
        >
          <div className="flex items-center gap-[9px] flex-wrap">{headerChips}</div>
          <button
            onClick={closeDrawer}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[17px] text-ink-soft cursor-pointer border-none font-sans transition-all duration-200 hover:bg-[rgba(28,26,23,0.12)]"
            style={{ background: 'rgba(28,26,23,0.06)' }}
          >
            ×
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-10 py-8">{bodyContent}</div>
      </div>
    </>
  )
}
