import { useApp } from '../context/AppContext'

function SidebarItem({ active, onClick, dot, dotColor, label, badge, hot }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between px-[11px] py-[9px] rounded-lg cursor-pointer transition-all duration-150 mb-0.5 select-none ${
        active
          ? 'bg-paper'
          : 'hover:bg-warm'
      }`}
      style={active ? { border: '0.5px solid rgba(28,26,23,0.07)' } : { border: '0.5px solid transparent' }}
    >
      <div className="flex items-center gap-2 text-[13px] text-ink-soft">
        {dot && (
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: dotColor || 'var(--ink-muted)' }}
          />
        )}
        {label}
      </div>
      {badge !== undefined && (
        <span
          className={`text-[11px] px-2 py-0.5 rounded-pill ${hot ? 'font-medium' : ''}`}
          style={{
            background: hot ? 'rgba(196,99,58,0.08)' : 'rgba(28,26,23,0.05)',
            color: hot ? 'var(--tc)' : 'var(--ink-muted)',
          }}
        >
          {badge}
        </span>
      )}
    </div>
  )
}

const PROVIDER_ICON = { gmail: '📧', zoho: '📮', outlook: '📨', smtp: '📬', sendgrid: '📤', ses: '📡', godaddy: '🌐' }

export function HomeSidebar() {
  const { navigate, emailAccounts, personalLetters, strangerLetters, sentLetters } = useApp()

  const stats = [
    { label: 'Personal Letters', value: personalLetters.length, icon: '🪞', page: 'personalletters', color: 'var(--purple)' },
    { label: 'Stranger Letters', value: strangerLetters.length, icon: '🌿', page: 'caringstranger',  color: 'var(--sage)'   },
    { label: 'Sent Letters',     value: sentLetters.length,     icon: '📤', page: 'sentletters',     color: 'var(--tc)'     },
    { label: 'Connected Emails', value: emailAccounts.length,   icon: '📮', page: 'connections',     color: 'var(--gold)'   },
  ]

  return (
    <div
      className="border-r flex flex-col gap-5 px-[18px] py-6 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto"
      style={{ borderColor: 'rgba(28,26,23,0.07)', background: 'rgba(247,242,234,0.4)' }}
    >
      <div>
        <div className="text-[10px] tracking-[1.8px] uppercase font-medium text-ink-muted mb-3">Overview</div>
        <div className="flex flex-col gap-2">
          {stats.map(s => (
            <div
              key={s.label}
              onClick={() => navigate(s.page)}
              className="flex items-center justify-between px-[11px] py-[9px] rounded-[10px] cursor-pointer transition-all duration-150 hover:bg-warm"
              style={{ border: '0.5px solid transparent' }}
            >
              <div className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--ink-soft)' }}>
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </div>
              <span
                className="text-[12px] font-medium px-2 py-0.5 rounded-pill"
                style={{ background: `${s.color}15`, color: s.color }}
              >
                {s.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Connected Accounts */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] tracking-[1.8px] uppercase font-medium text-ink-muted">Email Accounts</div>
          <span
            className="text-[10px] text-ink-muted cursor-pointer hover:text-ink"
            style={{ textDecoration: 'underline', textUnderlineOffset: '2px' }}
            onClick={() => navigate('connections')}
          >
            Manage
          </span>
        </div>
        {emailAccounts.length === 0 ? (
          <div
            className="rounded-[10px] px-[13px] py-[11px] cursor-pointer transition-all duration-200 hover:bg-warm"
            style={{ background: 'var(--paper)', border: '0.5px dashed rgba(28,26,23,0.15)' }}
            onClick={() => navigate('connections')}
          >
            <div className="text-[11px] text-ink-muted font-light leading-[1.5]">No email connected yet.</div>
            <div className="text-[11px] font-medium mt-1" style={{ color: 'var(--tc)' }}>+ Connect one →</div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {emailAccounts.map(acc => (
              <div
                key={acc._id || acc.id}
                className="rounded-[10px] px-[11px] py-[9px] flex items-center gap-2"
                style={{ background: 'var(--paper)', border: '0.5px solid rgba(28,26,23,0.07)' }}
              >
                <span className="text-[14px] flex-shrink-0">{PROVIDER_ICON[acc.provider] || '📬'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium text-ink truncate">{acc.emailAddress}</div>
                  <div className="text-[10px] text-ink-muted capitalize">{acc.provider}</div>
                </div>
                <span
                  className="w-[6px] h-[6px] rounded-full flex-shrink-0"
                  style={{ background: acc.status === 'connected' ? 'var(--sage)' : 'var(--tc)' }}
                  title={acc.status}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function MyLettersSidebar({ filter, setFilter }) {
  const items = [
    { id: 'all', label: 'All letters', dotColor: 'var(--ink-muted)', badge: 7 },
    { id: 'new-reply', label: 'Reply received', dotColor: 'var(--tc)', badge: 2, hot: true },
    { id: 'waiting', label: 'Waiting', dotColor: 'rgba(28,26,23,0.18)', badge: 2 },
    { id: 'capsule', label: 'Time capsule', dotColor: 'var(--gold)', badge: 1 },
    { id: 'direct', label: 'Sent directly', dotColor: 'var(--tc)', badge: 1 },
    { id: 'burn', label: 'Released', dotColor: 'var(--purple)', badge: 1 },
  ]
  return (
    <div className="border-r flex flex-col gap-5 px-[18px] py-6 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto" style={{ borderColor: 'rgba(28,26,23,0.07)', background: 'rgba(247,242,234,0.4)' }}>
      <div>
        <div className="text-[10px] tracking-[1.8px] uppercase font-medium text-ink-muted mb-2">Filter</div>
        {items.map(item => (
          <SidebarItem
            key={item.id}
            active={filter === item.id}
            onClick={() => setFilter(item.id)}
            dot
            dotColor={item.dotColor}
            label={item.label}
            badge={item.badge}
            hot={item.hot}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {[['7','Written'],['3','Replied to'],['1','Capsule'],['1','Released']].map(([n, l]) => (
          <div key={l} className="rounded-[10px] p-3" style={{ background: 'var(--paper)', border: '0.5px solid rgba(28,26,23,0.07)' }}>
            <div className="font-lora text-[22px] font-medium text-ink leading-none">{n}</div>
            <div className="text-[11px] text-ink-muted font-light mt-0.5">{l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ListenSidebar({ filter, setFilter }) {
  const moodItems = [
    { id: 'all', label: 'All letters', dotColor: 'var(--ink-muted)', badge: 12 },
    { id: 'vent', label: 'Need to vent', dotColor: 'var(--ink-soft)', badge: 3 },
    { id: 'joy', label: 'Pure joy', dotColor: 'var(--gold)', badge: 2 },
    { id: 'love', label: 'Love & warmth', dotColor: 'var(--tc)', badge: 2 },
    { id: 'grief', label: 'Grief & loss', dotColor: 'var(--sage)', badge: 3 },
    { id: 'gratitude', label: 'Gratitude', dotColor: '#7A6E5C', badge: 1 },
    { id: 'longing', label: 'Longing', dotColor: 'var(--purple)', badge: 1 },
  ]
  const needItems = ['Any response', 'Just be heard', 'Advice welcome', 'Celebrate with me']
  return (
    <div className="border-r flex flex-col gap-5 px-[18px] py-6 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto" style={{ borderColor: 'rgba(28,26,23,0.07)', background: 'rgba(247,242,234,0.4)' }}>
      <div>
        <div className="text-[10px] tracking-[1.8px] uppercase font-medium text-ink-muted mb-2">Mood</div>
        {moodItems.map(item => (
          <SidebarItem key={item.id} active={filter === item.id} onClick={() => setFilter(item.id)} dot dotColor={item.dotColor} label={item.label} badge={item.badge} />
        ))}
      </div>
      <div>
        <div className="text-[10px] tracking-[1.8px] uppercase font-medium text-ink-muted mb-2">They need</div>
        {needItems.map((item, i) => (
          <SidebarItem key={item} active={i === 0} onClick={() => {}} label={item} />
        ))}
      </div>
      <div className="rounded-[10px] p-[13px] px-[15px]" style={{ background: 'var(--paper)', border: '0.5px solid rgba(28,26,23,0.08)' }}>
        <div className="text-[12px] font-medium text-ink mb-[7px]">🤝 This week</div>
        <div className="h-1 rounded-sm overflow-hidden mb-[5px]" style={{ background: 'rgba(28,26,23,0.07)' }}>
          <div className="h-full rounded-sm bg-sage" style={{ width: '40%' }} />
        </div>
        <div className="text-[11px] text-ink-muted font-light leading-[1.5]">2 of 5 replies this week. Rest when needed.</div>
      </div>
    </div>
  )
}

export function RepliesSidebar({ filter, setFilter }) {
  const items = [
    { id: 'all', label: 'All replies', dotColor: 'var(--ink-muted)', badge: 5 },
    { id: 'new-reply', label: 'They wrote back', dotColor: 'var(--tc)', badge: 2, hot: true },
    { id: 'waiting', label: 'Waiting', dotColor: 'rgba(28,26,23,0.18)', badge: 2 },
    { id: 'closed', label: 'Closed', dotColor: 'rgba(28,26,23,0.15)', badge: 1 },
  ]
  return (
    <div className="border-r flex flex-col gap-5 px-[18px] py-6 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto" style={{ borderColor: 'rgba(28,26,23,0.07)', background: 'rgba(247,242,234,0.4)' }}>
      <div>
        <div className="text-[10px] tracking-[1.8px] uppercase font-medium text-ink-muted mb-2">Filter</div>
        {items.map(item => (
          <SidebarItem key={item.id} active={filter === item.id} onClick={() => setFilter(item.id)} dot dotColor={item.dotColor} label={item.label} badge={item.badge} hot={item.hot} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {[['5','Replied to'],['3','Wrote back']].map(([n, l]) => (
          <div key={l} className="rounded-[10px] p-3" style={{ background: 'var(--paper)', border: '0.5px solid rgba(28,26,23,0.07)' }}>
            <div className="font-lora text-[22px] font-medium text-ink leading-none">{n}</div>
            <div className="text-[11px] text-ink-muted font-light mt-0.5">{l}</div>
          </div>
        ))}
      </div>
      <div className="rounded-[10px] p-[13px] px-[15px]" style={{ background: 'var(--paper)', border: '0.5px solid rgba(28,26,23,0.08)' }}>
        <div className="text-[12px] font-medium text-ink mb-[7px]">🤝 Wellbeing</div>
        <div className="h-1 rounded-sm overflow-hidden mb-[5px]" style={{ background: 'rgba(28,26,23,0.07)' }}>
          <div className="h-full rounded-sm bg-sage" style={{ width: '40%' }} />
        </div>
        <div className="text-[11px] text-ink-muted font-light leading-[1.5]">2 of 5 replies this week. You're doing well.</div>
      </div>
    </div>
  )
}
