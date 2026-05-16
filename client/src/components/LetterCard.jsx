import { useState } from 'react'
import { statusConfig } from '../data/mockData'

// ── Mood emoji map ────────────────────────────────────────────────────────────
const MOOD_EMOJI = {
  vent: '🌧️', joy: '🌟', love: '💌',
  grief: '🕯️', gratitude: '🌿', longing: '🌙', anger: '🔥',
}

// ── Card config per type ──────────────────────────────────────────────────────
const CARD_CFG = {
  personal: {
    accent: 'linear-gradient(180deg, var(--tc) 0%, var(--gold) 100%)',
    label: 'Personal',
    labelBg: 'rgba(196,99,58,0.08)',
    labelColor: 'var(--tc)',
    labelBorder: 'rgba(196,99,58,0.2)',
  },
  stranger: {
    accent: 'linear-gradient(180deg, var(--sage) 0%, var(--gold) 100%)',
    label: 'Caring Stranger',
    labelBg: 'rgba(122,158,142,0.1)',
    labelColor: 'var(--sage)',
    labelBorder: 'rgba(122,158,142,0.25)',
  },
  received: {
    accent: 'linear-gradient(180deg, var(--purple) 0%, var(--tc) 100%)',
    label: 'For You',
    labelBg: 'rgba(139,126,200,0.1)',
    labelColor: 'var(--purple)',
    labelBorder: 'rgba(139,126,200,0.25)',
  },
  sent: {
    accent: 'linear-gradient(180deg, var(--gold) 0%, var(--ink-muted) 100%)',
    label: 'Sent',
    labelBg: 'rgba(201,168,76,0.1)',
    labelColor: 'var(--gold)',
    labelBorder: 'rgba(201,168,76,0.28)',
  },
  read: {
    accent: 'linear-gradient(180deg, var(--purple) 0%, var(--gold) 100%)',
    label: 'Listener Read',
    labelBg: 'rgba(139,126,200,0.1)',
    labelColor: 'var(--purple)',
    labelBorder: 'rgba(139,126,200,0.25)',
  },
}

function relativeTime(dateStr) {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function Btn({ label, onClick, danger }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        height: 36, padding: '0 14px', borderRadius: 10,
        fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
        fontFamily: '"DM Sans", sans-serif', transition: 'all 0.15s',
        ...(danger
          ? {
              background: hov ? 'var(--tc)' : 'transparent',
              color: hov ? '#fff' : 'var(--tc)',
              border: `1.5px solid ${hov ? 'var(--tc)' : '#f5d4ce'}`,
            }
          : {
              background: hov ? '#fef9f2' : 'transparent',
              color: hov ? 'var(--gold)' : 'var(--ink-soft)',
              border: `1.5px solid ${hov ? 'var(--gold)' : '#E0D4BC'}`,
            }
        ),
      }}
    >
      {label}
    </button>
  )
}

// ── Unified Letter Card (real API data) ───────────────────────────────────────
export default function LetterCard({ letter, onOpen, onEdit, onDelete }) {
  const [hov, setHov] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const type = letter._cardType || letter.type || 'personal'
  const cfg  = CARD_CFG[type] || CARD_CFG.personal

  const moodEmoji  = MOOD_EMOJI[letter.mood]
  const ago        = relativeTime(letter.createdAt)
  const isPersonal = type === 'personal'
  const isStranger = type === 'stranger'
  const isSent     = type === 'sent'
  const isReceived = type === 'received'

  const withLabel = isReceived
    ? (() => {
        const n = letter.senderInfo?.name
        const e = letter.senderInfo?.email || letter.fromEmail
        return (n && n !== '—') ? n : (e || null)
      })()
    : isSent ? (letter.toEmail || null)
    : null

  const isOpened      = letter.status === 'opened' || letter.status === 'clicked'
  const uniqueOpens   = letter.openCount ?? (isOpened ? 1 : 0)
  const emailOpens    = letter.emailOpenCount ?? 0
  const platformOpens = letter.platformOpenCount ?? 0
  const hasOpens      = uniqueOpens > 0 || isOpened
  const showBreakdown = uniqueOpens > 0 && (emailOpens > 0 || platformOpens > 0)

  const canEdit   = isPersonal || (isStranger && !letter.isClaimed && !letter.isRead)
  const canDelete = isPersonal

  const msgText = letter.message || '(No content)'
  const isLong  = msgText.length > 300

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: '#fff',
        borderRadius: 24,
        border: '1px solid #f1f1f1',
        overflow: 'hidden',
        position: 'relative',
        transform: hov ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hov ? '0 10px 28px rgba(0,0,0,0.06)' : '0 4px 20px rgba(0,0,0,0.04)',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Left accent bar */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
        background: cfg.accent,
      }} />

      {/* Clickable body */}
      <div
        style={{ padding: '20px 20px 0 26px', cursor: 'pointer' }}
        onClick={() => onOpen?.(letter)}
      >
        {/* TOP META ROW */}
        <div style={{
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', gap: 12, marginBottom: 12,
        }}>
          {/* Left: identity / info */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 7, minWidth: 0 }}>
            {moodEmoji && <span style={{ fontSize: 15, lineHeight: 1 }}>{moodEmoji}</span>}
            {withLabel && (
              <span style={{
                fontFamily: '"DM Sans", sans-serif', fontSize: 13, fontWeight: 500,
                color: 'var(--ink-soft)', overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap', maxWidth: 160,
              }}>
                With {withLabel}
              </span>
            )}
            <span style={{
              display: 'inline-flex', alignItems: 'center', fontSize: 11,
              padding: '4px 10px', borderRadius: 999, fontWeight: 500,
              fontFamily: '"DM Sans", sans-serif', flexShrink: 0,
              background: cfg.labelBg, color: cfg.labelColor, border: `1px solid ${cfg.labelBorder}`,
            }}>
              {cfg.label}
            </span>
          </div>

          {/* Right: status / date */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
            <span style={{ fontSize: 11.5, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif' }}>
              {ago}
            </span>
            {isSent && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11,
                padding: '4px 10px', borderRadius: 999, fontWeight: 500,
                fontFamily: '"DM Sans", sans-serif',
                background: hasOpens ? 'rgba(122,158,142,0.1)' : 'rgba(28,26,23,0.05)',
                color: hasOpens ? 'var(--sage)' : 'var(--ink-muted)',
                border: `1px solid ${hasOpens ? 'rgba(122,158,142,0.25)' : 'rgba(28,26,23,0.1)'}`,
              }}>
                {hasOpens ? `👁 Opened${uniqueOpens > 1 ? ` by ${uniqueOpens}` : ''}` : '· Unread'}
              </span>
            )}
            {isStranger && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11,
                padding: '4px 10px', borderRadius: 999, fontWeight: 500,
                fontFamily: '"DM Sans", sans-serif',
                background: (letter.isClaimed || letter.isRead) ? 'rgba(139,126,200,0.1)' : 'rgba(28,26,23,0.04)',
                color: (letter.isClaimed || letter.isRead) ? 'var(--purple)' : 'var(--ink-muted)',
                border: `1px solid ${(letter.isClaimed || letter.isRead) ? 'rgba(139,126,200,0.25)' : 'rgba(28,26,23,0.1)'}`,
              }}>
                {(letter.isClaimed || letter.isRead) ? '✓ Heard' : '· Waiting'}
              </span>
            )}
            {isReceived && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11,
                padding: '4px 10px', borderRadius: 999, fontWeight: 500,
                fontFamily: '"DM Sans", sans-serif',
                background: 'rgba(139,126,200,0.08)', color: 'var(--purple)',
                border: '1px solid rgba(139,126,200,0.2)',
              }}>
                Open &amp; reply →
              </span>
            )}
          </div>
        </div>

        {/* SUBJECT */}
        <h3 style={{
          fontFamily: '"Lora", serif', fontSize: 17, fontWeight: 600,
          color: 'var(--ink)', lineHeight: 1.3, letterSpacing: '-0.2px',
          margin: '0 0 10px', wordBreak: 'break-word',
        }}>
          {letter.subject || 'A letter from my heart'}
        </h3>

        {/* MESSAGE PREVIEW */}
        <p style={{
          fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 14,
          color: 'var(--ink-muted)', lineHeight: 1.8, margin: 0,
          display: '-webkit-box',
          WebkitLineClamp: expanded ? 'unset' : 4,
          WebkitBoxOrient: 'vertical',
          overflow: expanded ? 'visible' : 'hidden',
          wordBreak: 'break-word', overflowWrap: 'break-word',
        }}>
          {msgText}
        </p>

        {isLong && (
          <button
            onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}
            style={{
              background: 'none', border: 'none', padding: '4px 0', marginTop: 4,
              fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
              fontFamily: '"DM Sans", sans-serif', color: cfg.labelColor, opacity: 0.85,
            }}
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}

        {/* SECONDARY BADGES */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '12px 0 20px' }}>
          {letter.isEdited && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11,
              padding: '4px 10px', borderRadius: 999, fontWeight: 500,
              fontFamily: '"DM Sans", sans-serif',
              background: 'rgba(201,168,76,0.1)', color: 'var(--gold)',
              border: '1px solid rgba(201,168,76,0.28)',
            }}>✏ Edited</span>
          )}
          {isStranger && letter.replyCount > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11,
              padding: '4px 10px', borderRadius: 999, fontWeight: 500,
              fontFamily: '"DM Sans", sans-serif',
              background: 'rgba(122,158,142,0.1)', color: 'var(--sage)',
              border: '1px solid rgba(122,158,142,0.28)',
            }}>🌿 {letter.replyCount} {letter.replyCount === 1 ? 'reply' : 'replies'}</span>
          )}
          {isSent && showBreakdown && (
            <>
              {emailOpens > 0 && <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif' }}>📧 {emailOpens} email</span>}
              {platformOpens > 0 && <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif' }}>📱 {platformOpens} app</span>}
            </>
          )}
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      {canEdit && onEdit && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8,
          padding: '12px 20px 14px',
          borderTop: '1px solid rgba(240,235,228,0.8)',
          background: 'rgba(253,249,243,0.5)',
        }}>
          <Btn label="✏ Edit" onClick={e => { e.stopPropagation(); onEdit?.(letter) }} />
          {canDelete && onDelete && (
            <Btn label="✕ Delete" onClick={e => { e.stopPropagation(); onDelete?.(letter) }} danger />
          )}
        </div>
      )}
    </div>
  )
}

// ── Helpers shared by legacy exports ─────────────────────────────────────────

function MoodDot({ mood, size = 6 }) {
  const colors = {
    vent: 'var(--ink-soft)', joy: 'var(--gold)', love: 'var(--tc)',
    grief: 'var(--sage)', gratitude: '#7A6E5C', longing: 'var(--purple)', anger: '#B85450',
  }
  return (
    <span className="rounded-full flex-shrink-0"
      style={{ width: size, height: size, background: colors[mood] || 'var(--ink-muted)', display: 'inline-block' }} />
  )
}

function StatusDot({ status }) {
  const colors = {
    waiting: 'rgba(28,26,23,0.2)', 'new-reply': 'var(--tc)', replied: 'var(--sage)',
    capsule: 'var(--gold)', burn: 'var(--purple)', direct: 'var(--tc)', closed: 'rgba(28,26,23,0.15)',
  }
  return (
    <span
      className={`rounded-full flex-shrink-0 ${status === 'new-reply' ? 'animate-blink-fast' : ''}`}
      style={{ width: 5, height: 5, background: colors[status] || 'var(--ink-muted)', display: 'inline-block' }}
    />
  )
}

const ArrowIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// Used by MyRepliesPage (mock data shape: sal, exc, mood, moodLabel, timeAgo, status, role)
export function LegacyLetterCard({ letter, onClick }) {
  const statusLabel = statusConfig[letter.status]?.label || letter.status
  const statusColor = statusConfig[letter.status]?.color || 'var(--ink-muted)'
  const isNewReply = letter.status === 'new-reply'

  return (
    <div
      className={`card-accent mood-${letter.mood} bg-paper rounded-[10px] p-[22px] cursor-pointer transition-all duration-[250ms] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(28,26,23,0.09)] ${isNewReply ? 'card-new-reply' : ''}`}
      style={{ border: isNewReply ? '0.5px solid rgba(196,99,58,0.2)' : '0.5px solid rgba(28,26,23,0.08)' }}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-[10px] flex-wrap">
        <span className="text-[10px] px-[9px] py-[3px] rounded-pill font-medium"
          style={letter.role === 'seeker'
            ? { background: 'rgba(196,99,58,0.08)', color: 'var(--tc)' }
            : { background: 'rgba(122,158,142,0.09)', color: 'var(--sage)' }}>
          {letter.role === 'seeker' ? 'Your letter' : 'You replied'}
        </span>
        <div className="flex items-center gap-[5px] text-[11px] text-ink-muted tracking-[0.5px] uppercase">
          <MoodDot mood={letter.mood} />
          {letter.moodLabel}
        </div>
        <span className="text-[11px] text-ink-muted ml-auto">{letter.timeAgo}</span>
      </div>
      <div className="font-lora text-[16px] font-medium text-ink mb-[6px] tracking-[-0.2px]">{letter.sal}</div>
      <div className="font-lora text-[13px] italic text-ink-soft leading-[1.65] mb-3 overflow-hidden"
        style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        {letter.exc}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[5px] text-[11px] font-medium" style={{ color: statusColor }}>
          <StatusDot status={letter.status} />
          {statusLabel}
        </div>
        <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center"
          style={{ background: 'rgba(28,26,23,0.05)', color: 'var(--ink-soft)' }}>
          <ArrowIcon />
        </div>
      </div>
    </div>
  )
}

export function OpenLetterListCard({ letter, onClick }) {
  return (
    <div
      className="bg-paper rounded-[10px] px-[18px] py-[20px] cursor-pointer transition-all duration-[220ms] flex items-center gap-[14px] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(28,26,23,0.08)]"
      style={{ border: '0.5px solid rgba(28,26,23,0.08)' }}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-[7px]">
          <div className="flex items-center gap-[5px] text-[11px] text-ink-muted tracking-[0.5px] uppercase">
            <MoodDot mood={letter.mood} size={7} />
            {letter.moodLabel}
          </div>
          <span className="text-[11px] text-ink-muted ml-auto">{letter.timeAgo}</span>
        </div>
        <div className="font-lora text-[15px] font-medium text-ink mb-1">{letter.sal}</div>
        <div className="font-lora text-[12.5px] italic text-ink-soft leading-[1.6] whitespace-nowrap overflow-hidden text-ellipsis">{letter.exc}</div>
      </div>
      <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
        <div className="text-[10px] text-ink-muted font-light text-right max-w-[130px] leading-[1.4]">"{letter.tone}"</div>
        <button className="px-[15px] py-[7px] rounded-pill bg-ink text-cream text-[11px] font-medium border-none cursor-pointer font-sans transition-all duration-200 whitespace-nowrap hover:bg-sage">
          Reply →
        </button>
      </div>
    </div>
  )
}

export function OpenLetterGridCard({ letter, onClick }) {
  return (
    <div
      className={`card-accent mood-${letter.mood} bg-paper rounded-[10px] p-[22px] cursor-pointer transition-all duration-[250ms] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(28,26,23,0.09)]`}
      style={{ border: '0.5px solid rgba(28,26,23,0.08)' }}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-[10px] flex-wrap">
        <div className="flex items-center gap-[5px] text-[11px] text-ink-muted tracking-[0.5px] uppercase">
          <MoodDot mood={letter.mood} />
          {letter.moodLabel}
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-pill" style={{ background: 'rgba(122,158,142,0.09)', color: 'var(--sage)' }}>
          Anonymous
        </span>
        <span className="text-[11px] text-ink-muted ml-auto">{letter.timeAgo}</span>
      </div>
      <div className="font-lora text-[16px] font-medium text-ink mb-[6px]">{letter.sal}</div>
      <div className="font-lora text-[13px] italic text-ink-soft leading-[1.65] mb-3 overflow-hidden"
        style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        {letter.exc}
      </div>
      <div className="flex items-center justify-between">
        <div className="text-[11px] text-ink-muted italic font-light">"{letter.tone}"</div>
        <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center" style={{ background: 'rgba(28,26,23,0.05)', color: 'var(--ink-soft)' }}>
          <ArrowIcon />
        </div>
      </div>
    </div>
  )
}

export { MoodDot }
