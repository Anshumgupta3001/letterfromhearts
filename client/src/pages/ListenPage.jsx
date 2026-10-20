import { useApp } from '../context/AppContext'
import { ListenSidebar } from '../components/Sidebar'
import { OpenLetterGridCard } from '../components/LetterCard'
import EmptyState from '../components/EmptyState'

const BD = '#F0DFD1'

export default function ListenPage() {
  const { filteredOpenLetters, openLetterDrawer, listenFilter, setListenFilter, navigate } = useApp()

  const filtered =
    listenFilter === 'all'
      ? filteredOpenLetters
      : filteredOpenLetters.filter(l => l.mood === listenFilter)

  return (
    <div className="md:grid min-h-[calc(100vh-56px)]" style={{ gridTemplateColumns: '220px 1fr' }}>
      <div className="hidden md:block">
        <ListenSidebar filter={listenFilter} setFilter={setListenFilter} />
      </div>

      {/* Mobile filter pills — only shown on small screens */}
      <div className="md:hidden px-4 pt-4 pb-2 flex gap-2 overflow-x-auto" style={{ borderBottom: '0.5px solid rgba(40,3,15,0.07)' }}>
        {['all', 'grief', 'anxiety', 'loneliness', 'gratitude', 'love', 'hope'].map(m => (
          <button
            key={m}
            onClick={() => setListenFilter(m)}
            style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 12, whiteSpace: 'nowrap',
              border: `1px solid ${listenFilter === m ? 'var(--sage)' : 'rgba(40,3,15,0.12)'}`,
              background: listenFilter === m ? 'rgba(88,143,96,0.1)' : 'transparent',
              color: listenFilter === m ? 'var(--sage)' : 'var(--ink-muted)',
              cursor: 'pointer', fontFamily: '"General Sans", sans-serif',
            }}
          >
            {m === 'all' ? 'All' : m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      <div className="page-enter px-4 sm:px-6 md:px-8 py-6 md:py-8" style={{ minWidth: 0 }}>

        {/* ── Page header ────────────────────────────────────────────── */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 18, height: 1, background: BD, display: 'inline-block' }} />
            Open letters
          </div>
          <h1 style={{ fontFamily: '"Gambetta", serif', fontSize: 'clamp(36px, 4vw, 52px)', fontWeight: 400, color: 'var(--ink)', lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 10 }}>
            Letters waiting to be heard
          </h1>
          <p style={{ fontFamily: '"General Sans", sans-serif', fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.7, maxWidth: 420 }}>
            Each one is a real person. Take your time before you choose. Your presence matters.
          </p>
        </div>

        {/* ── Intention note ──────────────────────────────────────────── */}
        <div className="intention-banner">
          <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>✦</span>
          <p style={{ fontFamily: '"General Sans", sans-serif', fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.65, margin: 0 }}>
            You don't have to reply to everything. Read with care, respond when it feels right.
          </p>
        </div>

        {/* ── Letters grid ────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <EmptyState
            icon="📭"
            title="No letters here right now"
            sub="The feed is quiet — someone out there is writing. Check back soon."
            cta="Write a letter instead"
            onCta={() => navigate('write')}
          />
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {filtered.map(letter => (
              <OpenLetterGridCard
                key={letter.id}
                letter={letter}
                onClick={() => openLetterDrawer(letter.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
