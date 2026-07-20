// src/components/GlobalFocusPlayer.jsx
// ─────────────────────────────────────────────────────────────────
// Persistent mini-player — a floating, rounded, warm-translucent
// bar (Apple Music editorial feel, not Spotify). Rendered in Layout
// outside the page switcher so it stays visible and playing on
// every page. Only appears when a track is loaded.
// ─────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { useFocusPlayer } from '../context/FocusPlayerContext'

function IconButton({ onClick, label, children, size = 30 }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: 'transparent', color: 'var(--ink-soft)',
        border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s, color 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(28,26,23,0.06)'; e.currentTarget.style.color = 'var(--ink)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-soft)' }}
    >
      {children}
    </button>
  )
}

export default function GlobalFocusPlayer() {
  const { currentTrack, isPlaying, volume, progress, togglePlay, stop, setVolume, next, prev, seek } = useFocusPlayer()
  const [artBroken, setArtBroken] = useState(false)

  if (!currentTrack) return null

  const onSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    seek(Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)))
  }

  return (
    <div style={{
      position: 'fixed', bottom: 14, left: 0, right: 0, zIndex: 300,
      display: 'flex', justifyContent: 'center',
      padding: '0 14px', pointerEvents: 'none',
    }}>
      <div style={{
        pointerEvents: 'auto',
        width: '100%', maxWidth: 640,
        background: 'rgba(253,249,243,0.88)',
        backdropFilter: 'blur(18px) saturate(1.3)', WebkitBackdropFilter: 'blur(18px) saturate(1.3)',
        border: '1px solid rgba(28,26,23,0.1)',
        borderRadius: 20,
        boxShadow: '0 14px 44px rgba(28,26,23,0.16)',
        padding: '10px 14px 12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

          {/* Artwork */}
          <div style={{
            width: 40, height: 40, borderRadius: 11, flexShrink: 0,
            background: currentTrack.gradient, overflow: 'hidden', position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
          }}>
            {!artBroken && currentTrack.image ? (
              <img
                src={currentTrack.image} alt=""
                onError={() => setArtBroken(true)}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : currentTrack.emoji}
          </div>

          {/* Title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: '"DM Sans", sans-serif', fontSize: 13, fontWeight: 500,
              color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {currentTrack.title}
            </div>
            <div style={{
              fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 11,
              color: 'var(--ink-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {isPlaying ? 'Playing — stays with you everywhere' : 'Paused'}
            </div>
          </div>

          {/* Volume — desktop */}
          <div className="hidden sm:flex" style={{ alignItems: 'center', gap: 7, flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="var(--ink-muted)" stroke="none"/>
              {volume > 0.05 && <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>}
              {volume > 0.5  && <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>}
            </svg>
            <input
              type="range" min="0" max="1" step="0.05"
              value={volume}
              onChange={e => setVolume(Number(e.target.value))}
              style={{ width: 72, accentColor: 'var(--tc)', cursor: 'pointer' }}
            />
          </div>

          {/* Previous */}
          <IconButton onClick={prev} label="Previous track">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="19 20 9 12 19 4 19 20"/><rect x="5" y="4" width="2.4" height="16" rx="1"/></svg>
          </IconButton>

          {/* Play / pause */}
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: 'var(--tc)', color: '#fff',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(196,99,58,0.3)',
              transition: 'transform 0.15s, background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.07)'; e.currentTarget.style.background = '#D97040' }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.background = 'var(--tc)' }}
          >
            {isPlaying ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}><polygon points="6 3 20 12 6 21 6 3"/></svg>
            )}
          </button>

          {/* Next */}
          <IconButton onClick={next} label="Next track">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4"/><rect x="16.6" y="4" width="2.4" height="16" rx="1"/></svg>
          </IconButton>

          {/* Close */}
          <IconButton onClick={stop} label="Stop and close player" size={26}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </IconButton>
        </div>

        {/* Progress — clickable to seek */}
        <div
          onClick={onSeek}
          style={{ marginTop: 9, padding: '3px 0', cursor: 'pointer' }}
          aria-label="Seek"
        >
          <div style={{ height: 3, borderRadius: 3, background: 'rgba(28,26,23,0.08)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progress * 100}%`, borderRadius: 3,
              background: 'linear-gradient(90deg, var(--tc), var(--gold))',
              transition: 'width 0.4s linear',
            }} />
          </div>
        </div>
      </div>
    </div>
  )
}
