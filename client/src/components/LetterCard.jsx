import { useApp } from '../context/AppContext'
import { moodConfig, statusConfig } from '../data/mockData'

const ArrowIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

function MoodDot({ mood, size = 6 }) {
  const colors = {
    vent: 'var(--ink-soft)',
    joy: 'var(--gold)',
    love: 'var(--tc)',
    grief: 'var(--sage)',
    gratitude: '#7A6E5C',
    longing: 'var(--purple)',
    anger: '#B85450',
  }
  return (
    <span
      className="rounded-full flex-shrink-0"
      style={{ width: size, height: size, background: colors[mood] || 'var(--ink-muted)', display: 'inline-block' }}
    />
  )
}

function StatusDot({ status }) {
  const colors = {
    waiting: 'rgba(28,26,23,0.2)',
    'new-reply': 'var(--tc)',
    replied: 'var(--sage)',
    capsule: 'var(--gold)',
    burn: 'var(--purple)',
    direct: 'var(--tc)',
    closed: 'rgba(28,26,23,0.15)',
  }
  return (
    <span
      className={`rounded-full flex-shrink-0 ${status === 'new-reply' ? 'animate-blink-fast' : ''}`}
      style={{ width: 5, height: 5, background: colors[status] || 'var(--ink-muted)', display: 'inline-block' }}
    />
  )
}

export default function LetterCard({ letter, onClick }) {
  const statusLabel = statusConfig[letter.status]?.label || letter.status
  const statusColor = statusConfig[letter.status]?.color || 'var(--ink-muted)'
  const isNewReply = letter.status === 'new-reply'

  return (
    <div
      className={`card-accent mood-${letter.mood} bg-paper rounded-[10px] p-[22px] cursor-pointer transition-all duration-[250ms] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(28,26,23,0.09)] ${isNewReply ? 'card-new-reply' : ''}`}
      style={{
        border: isNewReply ? '0.5px solid rgba(196,99,58,0.2)' : '0.5px solid rgba(28,26,23,0.08)',
      }}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-[10px] flex-wrap">
        <span
          className="text-[10px] px-[9px] py-[3px] rounded-pill font-medium"
          style={
            letter.role === 'seeker'
              ? { background: 'rgba(196,99,58,0.08)', color: 'var(--tc)' }
              : { background: 'rgba(122,158,142,0.09)', color: 'var(--sage)' }
          }
        >
          {letter.role === 'seeker' ? 'Your letter' : 'You replied'}
        </span>
        <div className="flex items-center gap-[5px] text-[11px] text-ink-muted tracking-[0.5px] uppercase">
          <MoodDot mood={letter.mood} />
          {letter.moodLabel}
        </div>
        <span className="text-[11px] text-ink-muted ml-auto">{letter.timeAgo}</span>
      </div>

      <div className="font-lora text-[16px] font-medium text-ink mb-[6px] tracking-[-0.2px]">{letter.sal}</div>
      <div
        className="font-lora text-[13px] italic text-ink-soft leading-[1.65] mb-3 overflow-hidden"
        style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
      >
        {letter.exc}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[5px] text-[11px] font-medium" style={{ color: statusColor }}>
          <StatusDot status={letter.status} />
          {statusLabel}
        </div>
        <div
          className="w-[26px] h-[26px] rounded-full flex items-center justify-center transition-all duration-200 group-hover:bg-ink group-hover:text-cream"
          style={{ background: 'rgba(28,26,23,0.05)', color: 'var(--ink-soft)' }}
        >
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
      <div
        className="font-lora text-[13px] italic text-ink-soft leading-[1.65] mb-3 overflow-hidden"
        style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
      >
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
