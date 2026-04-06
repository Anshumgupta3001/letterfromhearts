export default function FilterPills({ pills, active, onChange }) {
  return (
    <div className="flex gap-[7px] mb-5 flex-wrap">
      {pills.map(pill => (
        <button
          key={pill.id}
          onClick={() => onChange(pill.id)}
          className={`px-4 py-[7px] rounded-pill text-[12px] cursor-pointer transition-all duration-200 select-none flex items-center gap-[5px] border-none font-sans ${
            active === pill.id
              ? 'bg-ink text-cream'
              : 'bg-paper text-ink-muted hover:text-ink'
          }`}
          style={
            active === pill.id
              ? { border: '0.5px solid var(--ink)' }
              : { border: '0.5px solid rgba(28,26,23,0.1)' }
          }
        >
          {pill.dot && active !== pill.id && (
            <span className="w-[5px] h-[5px] rounded-full bg-tc animate-blink-fast" />
          )}
          {pill.label}
        </button>
      ))}
    </div>
  )
}
