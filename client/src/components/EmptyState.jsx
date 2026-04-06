export default function EmptyState({ icon, title, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-[70px] px-10 text-center">
      <div className="text-4xl mb-[14px]">{icon}</div>
      <div className="font-lora text-[20px] font-medium text-ink mb-2">{title}</div>
      <div className="text-[13px] text-ink-muted font-light leading-[1.6] max-w-[320px]">{sub}</div>
    </div>
  )
}
