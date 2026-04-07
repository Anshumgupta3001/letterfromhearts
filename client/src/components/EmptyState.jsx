export default function EmptyState({ icon, title, sub, cta, onCta }) {
  return (
    <div className="flex flex-col items-center justify-center py-[72px] px-10 text-center">
      <div className="text-[42px] mb-4" style={{ opacity: 0.35 }}>{icon}</div>
      <div className="font-lora text-[21px] font-medium text-ink mb-3" style={{ lineHeight: 1.25 }}>{title}</div>
      <div className="text-[14px] text-ink-muted font-light leading-[1.7] max-w-[320px]" style={{ fontFamily: 'Lora, serif', fontStyle: 'italic' }}>{sub}</div>
      {cta && onCta && (
        <button
          onClick={onCta}
          style={{
            marginTop: 24,
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'var(--tc)', color: '#fff', border: 'none',
            borderRadius: 10, padding: '11px 22px',
            fontFamily: '"DM Sans", sans-serif', fontSize: 13, fontWeight: 500,
            cursor: 'pointer', boxShadow: '0 4px 14px rgba(196,99,58,0.22)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(196,99,58,0.28)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(196,99,58,0.22)' }}
        >
          {cta}
        </button>
      )}
    </div>
  )
}
