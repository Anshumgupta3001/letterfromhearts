export default function ProgressDots({ total, current }) {
  return (
    <div className="flex gap-[7px] items-center justify-center mb-7">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1
        const isDone = step < current
        const isOn = step === current
        return (
          <div
            key={step}
            className="h-[6px] rounded-[3px] transition-all duration-300"
            style={{
              width: isOn ? 18 : 6,
              borderRadius: isOn ? 3 : '50%',
              background: isDone ? 'var(--sage)' : isOn ? 'var(--tc)' : 'rgba(28,26,23,0.15)',
            }}
          />
        )
      })}
    </div>
  )
}
