import { useApp } from '../context/AppContext'
import { MyLettersSidebar } from '../components/Sidebar'
import LetterCard from '../components/LetterCard'
import FilterPills from '../components/FilterPills'
import EmptyState from '../components/EmptyState'

const PILLS = [
  { id: 'all', label: 'All' },
  { id: 'new-reply', label: 'Reply received', dot: true },
  { id: 'waiting', label: 'Waiting' },
  { id: 'capsule', label: '⏳ Capsules' },
  { id: 'direct', label: '💌 Direct' },
  { id: 'burn', label: '🕯️ Released' },
]

export default function MyLettersPage() {
  const { seekerLetters, openDrawer, myLettersFilter, setMyLettersFilter, navigate } = useApp()

  const filtered =
    myLettersFilter === 'all'
      ? seekerLetters
      : seekerLetters.filter(l => l.status === myLettersFilter)

  return (
    <div className="grid min-h-[calc(100vh-56px)]" style={{ gridTemplateColumns: '220px 1fr' }}>
      <MyLettersSidebar filter={myLettersFilter} setFilter={setMyLettersFilter} />

      <div className="px-9 py-7">
        <div className="flex items-center justify-between mb-[14px]">
          <div className="font-lora text-[19px] font-medium text-ink tracking-[-0.4px]">My letters</div>
          <button
            onClick={() => navigate('write')}
            className="px-[18px] py-2 rounded-pill bg-ink text-cream text-[12px] font-medium cursor-pointer border-none font-sans transition-all duration-200 hover:bg-tc hover:-translate-y-px"
          >
            + Write new
          </button>
        </div>
        <p className="text-[13px] text-ink-muted font-light mb-5 leading-[1.5]">
          Everything you've written. Some have found listeners. Some are still travelling.
        </p>

        <FilterPills pills={PILLS} active={myLettersFilter} onChange={setMyLettersFilter} />

        {filtered.length === 0 ? (
          <EmptyState icon="📭" title="No letters here" sub="Write your first letter in this category." />
        ) : (
          <div className="flex flex-col gap-[10px]">
            {filtered.map(letter => (
              <LetterCard
                key={letter.id}
                letter={letter}
                onClick={() => openDrawer(letter.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
