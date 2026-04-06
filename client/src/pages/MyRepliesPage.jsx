import { useApp } from '../context/AppContext'
import { RepliesSidebar } from '../components/Sidebar'
import LetterCard from '../components/LetterCard'
import FilterPills from '../components/FilterPills'
import EmptyState from '../components/EmptyState'

const PILLS = [
  { id: 'all', label: 'All' },
  { id: 'new-reply', label: 'They replied', dot: true },
  { id: 'waiting', label: 'Waiting' },
  { id: 'closed', label: 'Closed' },
]

const STATUS_LABELS = {
  waiting: 'Waiting for reply',
  'new-reply': 'They wrote back',
  closed: 'Conversation closed',
}

export default function MyRepliesPage() {
  const { listenerReplies, openDrawer, repliesFilter, setRepliesFilter } = useApp()

  const filtered =
    repliesFilter === 'all'
      ? listenerReplies
      : listenerReplies.filter(r => r.status === repliesFilter)

  // Normalize shape so LetterCard can render listener replies
  const normalised = filtered.map(r => ({
    ...r,
    sal: r.sal,
    exc: r.exc,
    mood: r.mood,
    moodLabel: r.moodLabel,
    timeAgo: r.timeAgo,
    tags: r.tags,
    status: r.status,
    role: 'listener',
  }))

  return (
    <div className="grid min-h-[calc(100vh-56px)]" style={{ gridTemplateColumns: '220px 1fr' }}>
      <RepliesSidebar filter={repliesFilter} setFilter={setRepliesFilter} />

      <div className="px-9 py-7">
        <div className="flex items-center justify-between mb-[14px]">
          <div className="font-lora text-[19px] font-medium text-ink tracking-[-0.4px]">My replies</div>
        </div>
        <p className="text-[13px] text-ink-muted font-light mb-5 leading-[1.5]">
          Letters you've responded to as a listener. Some have written back.
        </p>

        <FilterPills pills={PILLS} active={repliesFilter} onChange={setRepliesFilter} />

        {normalised.length === 0 ? (
          <EmptyState icon="✍️" title="Nothing here" sub="When you reply to letters, conversations appear here." />
        ) : (
          <div className="flex flex-col gap-[10px]">
            {normalised.map(reply => (
              <LetterCard
                key={reply.id}
                letter={reply}
                onClick={() => openDrawer(reply.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
