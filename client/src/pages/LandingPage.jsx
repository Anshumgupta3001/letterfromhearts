import { useState } from 'react'

// Public landing page — shown to signed-out visitors.
// Visitors can start a letter before creating an account; the draft is kept in
// localStorage ('lfh_draft') and restored on the Write page after sign-up.

const SERIF = '"Gambetta", Georgia, serif'
const SANS = '"General Sans", system-ui, sans-serif'

const RELS = [
  { id: 'mom', label: 'Mom', dear: 'Mom', prompt: 'Mom, I don’t think I ever thanked you for…' },
  { id: 'dad', label: 'Dad', dear: 'Dad', prompt: 'Dad, the thing I learned from you that I use every day is…' },
  { id: 'partner', label: 'My partner', dear: '', prompt: 'The moment I knew it was you was…' },
  { id: 'friend', label: 'Best friend', dear: '', prompt: 'I don’t say it enough, but you’re the reason I got through…' },
  { id: 'grand', label: 'Grandma / Grandpa', dear: 'Grandma', prompt: 'I still think about the time we…' },
  { id: 'sibling', label: 'Brother / Sister', dear: '', prompt: 'Growing up with you, I never said…' },
  { id: 'teacher', label: 'A teacher', dear: '', prompt: 'You probably don’t remember this, but in your class…' },
  { id: 'future', label: 'Future me', dear: 'future me', prompt: 'By the time you read this, I hope…', mode: 'self' },
  { id: 'other', label: 'Someone else', dear: '', prompt: 'I’ve wanted to tell you this for a long time…' },
]

function Heart({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="var(--lemon)" aria-hidden="true">
      <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.6.1.2.3.2.4 0 .7-1.4 2.2-2.6 4.3-2.6 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z" />
    </svg>
  )
}

function Brand() {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Heart size={15} /></span>
      <span style={{ fontFamily: SERIF, fontSize: 23, letterSpacing: '-0.03em', color: 'var(--ink)' }}>Letter from Heart</span>
    </span>
  )
}

const btnPrimary = { fontFamily: SANS, fontSize: 16, fontWeight: 500, background: 'var(--ink)', color: 'var(--paper)', border: 'none', borderRadius: 8, padding: '0 20px', height: 48, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }
const btnLemon = { ...btnPrimary, background: 'var(--lemon)', color: 'var(--ink)' }
const h2Style = { margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(38px, 5vw, 56px)', lineHeight: 1.02, letterSpacing: '-0.045em', color: 'var(--ink)' }
const wrap = { maxWidth: 1180, margin: '0 auto' }

export default function LandingPage({ onStart }) {
  const [step, setStep] = useState(1)
  const [rel, setRel] = useState(null)
  const [dear, setDear] = useState('')
  const [body, setBody] = useState('')

  function pick(r) { setRel(r); setDear(r.dear); setStep(2) }

  function continueToSignup() {
    try {
      localStorage.setItem('lfh_draft', JSON.stringify({
        mode: rel?.mode || 'known', dear: dear.trim(), body: body.trim(), relation: rel?.id || '',
      }))
    } catch { /* storage unavailable — continue anyway */ }
    onStart('signup')
  }

  function startListenerLetter() {
    try { localStorage.setItem('lfh_draft', JSON.stringify({ mode: 'stranger', dear: 'Stranger', body: '' })) } catch { /* ignore */ }
    onStart('signup')
  }

  function scrollToWrite() { document.getElementById('write')?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }

  return (
    <div style={{ fontFamily: SANS, color: 'var(--ink)', background: 'var(--cream)' }}>

      {/* Seasonal bar */}
      <div style={{ background: 'var(--lemon)', textAlign: 'center', fontSize: 14, padding: '10px 16px' }}>
        This Thanksgiving, send the thank-you you never said — free, in two minutes.{' '}
        <button onClick={scrollToWrite} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 14, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3, color: 'var(--ink)' }}>Write it now</button>
      </div>

      {/* Nav */}
      <header style={{ background: 'var(--paper)', borderBottom: '1px solid var(--sand)', padding: '0 24px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ ...wrap, height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <Brand />
          <nav aria-label="Main" className="hidden md:flex" style={{ gap: 28, fontSize: 16, fontWeight: 500 }}>
            <a href="#how" style={{ color: 'var(--ink)', textDecoration: 'none' }}>How it works</a>
            <a href="#receive" style={{ color: 'var(--ink)', textDecoration: 'none' }}>What they get</a>
            <a href="#community" style={{ color: 'var(--ink)', textDecoration: 'none' }}>No one to write to?</a>
            <a href="#promise" style={{ color: 'var(--ink)', textDecoration: 'none' }}>Our promise</a>
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={() => onStart('login')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontSize: 16, fontWeight: 500, color: 'var(--ink)', padding: 12 }}>Log in</button>
            <button onClick={scrollToWrite} style={{ ...btnPrimary, height: 44, fontSize: 15, padding: '0 16px' }}>Write a letter</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ background: 'var(--paper)', padding: '72px 24px 24px' }}>
        <div style={{ maxWidth: 880, margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
          <h1 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(44px, 6.4vw, 80px)', lineHeight: 0.98, letterSpacing: '-0.045em' }}>
            Some things deserve <em>more than a text.</em>
          </h1>
          <p style={{ margin: 0, fontSize: 20, lineHeight: 1.5, color: 'var(--ink-muted)', maxWidth: 620 }}>
            Write a real letter online — free, in your own words. They open it like a sealed envelope, keep it forever, and can write back.
          </p>
        </div>
      </section>

      <section id="write" style={{ background: 'var(--paper)', padding: '24px 24px 64px' }}>
        <div style={{ ...wrap, background: 'var(--lemon)', borderRadius: 24, padding: 'clamp(24px, 5vw, 64px) 16px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 680, background: '#FFFFFF', borderRadius: 16, boxShadow: '0 12px 32px rgba(40,3,15,0.10)', padding: 28, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {step === 1 && (
              <>
                <h2 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: 34, letterSpacing: '-0.04em' }}>Who’s it for?</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
                  {RELS.map(r => (
                    <button key={r.id} onClick={() => pick(r)} style={{ fontFamily: SANS, fontSize: 16, fontWeight: 500, textAlign: 'left', background: 'var(--cream)', color: 'var(--ink)', border: '1px solid var(--sand)', borderRadius: 8, height: 52, padding: '0 16px', cursor: 'pointer' }}>{r.label}</button>
                  ))}
                </div>
                <button onClick={startListenerLetter} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', padding: '6px 0', cursor: 'pointer', fontFamily: SANS, fontSize: 14, color: 'var(--ink-muted)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                  No one to send it to? Write to a listener who’ll write back
                </button>
              </>
            )}
            {step === 2 && (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, borderBottom: '1px solid var(--sand)', paddingBottom: 8 }}>
                  <label htmlFor="lp-dear" style={{ fontFamily: SERIF, fontSize: 34, letterSpacing: '-0.03em' }}>Dear</label>
                  <input id="lp-dear" value={dear} onChange={e => setDear(e.target.value)} placeholder="their name" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: SERIF, fontSize: 34, letterSpacing: '-0.03em', color: 'var(--ink)' }} />
                </div>
                <label htmlFor="lp-body" style={{ fontSize: 14, color: 'var(--ink-muted)' }}>Finish this sentence, or start your own:</label>
                <textarea id="lp-body" rows={5} value={body} onChange={e => setBody(e.target.value)} placeholder={rel?.prompt} style={{ fontFamily: SERIF, fontSize: 21, lineHeight: 1.5, color: 'var(--ink)', background: 'var(--cream)', border: '1px solid var(--sand)', borderRadius: 8, padding: '14px 16px', resize: 'vertical', outline: 'none' }} />
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontSize: 14, color: 'var(--ink-muted)', padding: '10px 0' }}>← Back</button>
                  <button onClick={continueToSignup} style={btnPrimary}>Seal &amp; send — free →</button>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-muted)' }}>Your letter is saved while you create a free account. You’ll pick text, email or a date next.</p>
              </>
            )}
            <div style={{ borderTop: '1px solid var(--sand)', paddingTop: 14, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, fontSize: 13, color: 'var(--ink-muted)' }}>
              <span>Written by you · Never sold · No ads</span>
              <span>Step {step} of 3</span>
            </div>
          </div>
        </div>
        <p style={{ ...wrap, marginTop: 16, textAlign: 'center', fontSize: 14, color: 'var(--ink-muted)' }}>Always free to write and send · Not for profit</p>
      </section>

      {/* What they receive */}
      <section id="receive" style={{ background: 'var(--paper)', padding: '96px 24px 112px' }}>
        <div style={{ ...wrap, display: 'flex', flexWrap: 'wrap', gap: 56, alignItems: 'center' }}>
          <div style={{ flex: '1 1 420px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={h2Style}>Not a message. <em>A letter they open.</em></h2>
            <p style={{ margin: 0, fontSize: 18, lineHeight: 1.55, color: 'var(--ink-muted)', maxWidth: 460 }}>It arrives by email as a sealed letter — or on the day you choose. They open it, read it slowly, keep it, and write back if they want to.</p>
            <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 16 }}>
              {['No app needed to read it', 'Kept forever in their letterbox', 'You’ll know when it’s been opened'].map(t => (
                <li key={t} style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--sage)', flex: 'none' }} />{t}</li>
              ))}
            </ul>
          </div>
          <div style={{ flex: '1 1 380px', display: 'flex', justifyContent: 'center' }}>
            <article style={{ position: 'relative', width: 340, maxWidth: '100%', background: '#FFFFFF', borderRadius: 20, padding: 28, boxShadow: '0 16px 40px rgba(40,3,15,0.12)', transform: 'rotate(2deg)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ alignSelf: 'flex-start', fontSize: 12, fontWeight: 500, background: 'var(--sand)', padding: '5px 8px', borderRadius: 6 }}>Written by a person</span>
              <p style={{ margin: 0, fontFamily: SERIF, fontSize: 28, letterSpacing: '-0.03em' }}>Dear Mom,</p>
              <p style={{ margin: 0, fontFamily: SERIF, fontSize: 19, lineHeight: 1.5 }}>I never thanked you for driving me to every practice in that old car. I notice it now, every time I drive my own kids.</p>
              <p style={{ margin: 0, fontFamily: SERIF, fontStyle: 'italic', fontSize: 16, color: 'var(--ink-muted)' }}>— Sarah</p>
              <span style={{ marginTop: 4, fontSize: 15, fontWeight: 500, background: 'var(--ink)', color: 'var(--paper)', padding: '12px 14px', borderRadius: 8, textAlign: 'center' }}>Write back</span>
              <span style={{ fontSize: 12, color: 'var(--ink-muted)', textAlign: 'center' }}>Example letter</span>
            </article>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{ padding: '112px 24px' }}>
        <div style={{ ...wrap, display: 'flex', flexDirection: 'column', gap: 40 }}>
          <h2 style={h2Style}>Write. Seal. <em>Send.</em></h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {[
              ['1', 'Write it yourself.', 'Pick who it’s for and finish a sentence written for that relationship. Two minutes or twenty.'],
              ['2', 'Seal it.', 'Send it now, or schedule it for a birthday, an anniversary, or just a Tuesday.'],
              ['3', 'They open it — and reply.', 'Letters become a conversation. Or keep it private, just for you.'],
            ].map(([n, t, d]) => (
              <div key={n} style={{ background: 'var(--paper)', borderRadius: 24, padding: 32, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ fontFamily: SERIF, fontSize: 48, lineHeight: 1, color: 'var(--sage)' }}>{n}</span>
                <h3 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: 30, letterSpacing: '-0.04em' }}>{t}</h3>
                <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: 'var(--ink-muted)' }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Humanity / promise */}
      <section id="promise" style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '112px 24px' }}>
        <div style={{ ...wrap, display: 'flex', flexDirection: 'column', gap: 56 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 48 }}>
            <p style={{ flex: '0 1 320px', margin: 0, fontSize: 18, lineHeight: 1.55, color: 'var(--rose)' }}>Our phones are full of auto-replies, AI drafts and “HBD!!”. A letter is the one thing still made only by you.</p>
            <ul style={{ flex: '1 1 520px', listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8, fontFamily: SERIF, fontSize: 'clamp(30px, 3.8vw, 48px)', letterSpacing: '-0.04em', lineHeight: 1.15 }}>
              <li style={{ opacity: 0.3 }}>A text gets read.</li>
              <li style={{ opacity: 0.55 }}>An emoji gets a like.</li>
              <li>A letter gets kept.</li>
            </ul>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {[
              ['Written by you.', 'No “rewrite this” button. Your words, exactly as you meant them.'],
              ['Answered by people.', 'Every reply comes from a real person — never a bot.'],
              ['Never sold.', 'Not for profit. No ads, no data deals, ever.'],
              ['1 in 2 Americans', 'report feeling lonely (U.S. Surgeon General, 2023). A letter is a small fix.'],
            ].map(([t, d]) => (
              <div key={t} style={{ borderTop: '1px solid var(--ink-muted)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <strong style={{ fontWeight: 600, color: 'var(--lemon)', fontSize: 17 }}>{t}</strong>
                <span style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--rose)' }}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community */}
      <section id="community" style={{ padding: '112px 24px' }}>
        <div style={{ ...wrap, display: 'flex', flexDirection: 'column', gap: 36 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
            <h2 style={{ ...h2Style, maxWidth: 640 }}>No one to write to? <em>We’ve got people.</em></h2>
            <p style={{ margin: 0, fontSize: 17, color: 'var(--ink-muted)', maxWidth: 420, lineHeight: 1.5 }}>Not everyone has someone to send a letter to — or someone sending one to them. That’s what the community is for.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            <div style={{ background: 'var(--lemon)', borderRadius: 24, padding: 32, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 260, boxSizing: 'border-box' }}>
              <h3 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: 32, letterSpacing: '-0.04em' }}>Write to a listener</h3>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55 }}>Anonymous. A real, caring person reads your letter and writes back. Good news, hard days, anything.</p>
              <button onClick={startListenerLetter} style={{ ...btnPrimary, marginTop: 'auto', alignSelf: 'flex-start', height: 44, fontSize: 15 }}>Write to a listener</button>
            </div>
            <div style={{ background: 'var(--paper)', borderRadius: 24, padding: 32, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 260, boxSizing: 'border-box' }}>
              <h3 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: 32, letterSpacing: '-0.04em' }}>Become a listener</h3>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: 'var(--ink-muted)' }}>Read one letter at a time and write back as yourself. At your own pace, with support from our team.</p>
              <button onClick={() => onStart('signup')} style={{ marginTop: 'auto', alignSelf: 'flex-start', background: 'none', border: 'none', padding: '10px 0', cursor: 'pointer', fontFamily: SANS, fontSize: 15, fontWeight: 500, color: 'var(--ink)', textDecoration: 'underline', textUnderlineOffset: 3 }}>Become a listener</button>
            </div>
            <div style={{ background: 'var(--paper)', borderRadius: 24, padding: 32, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 260, boxSizing: 'border-box' }}>
              <h3 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: 32, letterSpacing: '-0.04em' }}>A letter for later</h3>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: 'var(--ink-muted)' }}>Write to future you, or to someone you love, and schedule it for the day it will matter most.</p>
              <button onClick={() => pick(RELS.find(r => r.id === 'future')) || scrollToWrite()} style={{ marginTop: 'auto', alignSelf: 'flex-start', background: 'none', border: 'none', padding: '10px 0', cursor: 'pointer', fontFamily: SANS, fontSize: 15, fontWeight: 500, color: 'var(--ink)', textDecoration: 'underline', textUnderlineOffset: 3 }}>Write to future me</button>
            </div>
          </div>
        </div>
      </section>

      {/* Story */}
      <section style={{ padding: '0 24px 112px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
          <p style={{ margin: 0, fontFamily: SERIF, fontSize: 'clamp(28px, 3.4vw, 40px)', lineHeight: 1.15, letterSpacing: '-0.035em' }}>“In his last months he wrote letters to our children. He said it was the most important work of his life.”</p>
          <p style={{ margin: 0, fontSize: 15, color: 'var(--ink-muted)' }}>Maria, on her husband Jonathan Wills — the story that started Letter from Heart</p>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '0 16px 16px' }}>
        <div style={{ background: 'var(--lemon)', borderRadius: 24, padding: 'clamp(56px, 8vw, 112px) 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, textAlign: 'center' }}>
          <h2 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(44px, 6vw, 72px)', lineHeight: 1, letterSpacing: '-0.045em' }}>Who deserves <em>more than a text?</em></h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, maxWidth: 720 }}>
            {RELS.slice(0, 5).map((r, i) => (
              <button key={r.id} onClick={() => { pick(r); scrollToWrite() }} style={i < 2 ? { ...btnPrimary, height: 46 } : { ...btnLemon, background: 'var(--paper)', height: 46 }}>{r.label}</button>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--slate)', color: 'var(--paper)', padding: '64px 24px 48px' }}>
        <div style={{ ...wrap, display: 'flex', flexDirection: 'column', gap: 40 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 48, fontSize: 15 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ opacity: 0.7 }}>Write</span>
              <button onClick={scrollToWrite} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--paper)', fontFamily: SANS, fontSize: 15, cursor: 'pointer', textAlign: 'left' }}>Write a letter</button>
              <button onClick={() => onStart('login')} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--paper)', fontFamily: SANS, fontSize: 15, cursor: 'pointer', textAlign: 'left' }}>Log in</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ opacity: 0.7 }}>Need urgent help?</span>
              <span>Call or text 988 (US)</span>
            </div>
          </div>
          <div style={{ fontFamily: SERIF, fontSize: 'clamp(56px, 11vw, 150px)', lineHeight: 0.9, letterSpacing: '-0.05em', color: 'var(--lemon)' }}>Letter from Heart</div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>Written by people, for people. A not-for-profit project.</div>
        </div>
      </footer>
    </div>
  )
}
