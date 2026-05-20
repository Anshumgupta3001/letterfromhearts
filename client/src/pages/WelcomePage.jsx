import { useApp } from '../context/AppContext'

const ACTIONS = [
  {
    icon: '✍️',
    title: 'Write a letter',
    desc: 'To yourself, a stranger, or someone you know.',
    page: 'write',
    accent: 'var(--tc)',
    bg: 'rgba(196,99,58,0.06)',
    border: 'rgba(196,99,58,0.18)',
  },
  {
    icon: '👂',
    title: 'Listen to strangers',
    desc: 'Read letters from people who needed to be heard.',
    page: 'listen',
    accent: 'var(--sage)',
    bg: 'rgba(107,158,138,0.06)',
    border: 'rgba(107,158,138,0.2)',
  },
  {
    icon: '🗂️',
    title: 'My space',
    desc: 'Your letters, received replies, and connections.',
    page: 'myspace',
    accent: 'var(--purple, #8B7EC8)',
    bg: 'rgba(139,126,200,0.06)',
    border: 'rgba(139,126,200,0.2)',
  },
]

export default function WelcomePage() {
  const { authUser, navigate } = useApp()
  const firstName = authUser?.name?.split(' ')[0] || 'there'

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-14"
      style={{ background: 'var(--cream)' }}
    >
      {/* Soft blobs */}
      <div
        className="fixed rounded-full pointer-events-none"
        style={{ width: 400, height: 400, top: -120, right: -100, background: 'rgba(196,99,58,0.05)', filter: 'blur(80px)', zIndex: 0 }}
      />
      <div
        className="fixed rounded-full pointer-events-none"
        style={{ width: 300, height: 300, bottom: -80, left: -80, background: 'rgba(107,158,138,0.06)', filter: 'blur(70px)', zIndex: 0 }}
      />

      <div className="relative z-10 w-full max-w-[480px] text-center">

        {/* Logo mark */}
        <img
          src="/favicon.png"
          alt="Letter from Heart"
          style={{ width: 52, height: 52, objectFit: 'contain', margin: '0 auto 20px', borderRadius: 14, filter: 'drop-shadow(0 4px 12px rgba(28,26,23,0.12))' }}
        />

        {/* Greeting */}
        <h1
          className="font-lora text-[32px] font-medium leading-[1.25] mb-3"
          style={{ color: 'var(--ink)' }}
        >
          Welcome, <em className="italic" style={{ color: 'var(--tc)' }}>{firstName}</em> 🌿
        </h1>
        <p
          className="text-[14px] font-light leading-[1.75] mb-10 max-w-[340px] mx-auto"
          style={{ color: 'var(--ink-muted)' }}
        >
          This is your quiet space. Write freely, listen openly, or simply begin.
        </p>

        {/* Action cards */}
        <div className="flex flex-col gap-3 mb-10">
          {ACTIONS.map(a => (
            <button
              key={a.page}
              onClick={() => navigate(a.page)}
              className="flex items-center gap-4 px-5 py-4 rounded-[16px] text-left cursor-pointer transition-all duration-200 border-none w-full"
              style={{
                background: a.bg,
                border: `1px solid ${a.border}`,
                boxShadow: '0 2px 8px rgba(28,26,23,0.04)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(28,26,23,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(28,26,23,0.04)' }}
            >
              <span
                className="flex-shrink-0 flex items-center justify-center rounded-[12px] text-[20px]"
                style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.7)', boxShadow: '0 1px 4px rgba(28,26,23,0.08)' }}
              >
                {a.icon}
              </span>
              <div className="flex-1">
                <div className="text-[14px] font-medium font-sans mb-0.5" style={{ color: 'var(--ink)' }}>
                  {a.title}
                </div>
                <div className="text-[12px] font-light" style={{ color: 'var(--ink-muted)' }}>
                  {a.desc}
                </div>
              </div>
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke={a.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ flexShrink: 0, opacity: 0.7 }}
              >
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          ))}
        </div>

        <p className="text-[11px] font-light" style={{ color: 'var(--ink-muted)' }}>
          Private · Anonymous · No judgment.
        </p>
      </div>
    </div>
  )
}
