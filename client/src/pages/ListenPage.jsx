import { useApp } from '../context/AppContext'
import { ListenSidebar } from '../components/Sidebar'
import { OpenLetterGridCard } from '../components/LetterCard'
import EmptyState from '../components/EmptyState'

export default function ListenPage() {
  const { filteredOpenLetters, openLetterDrawer, listenFilter, setListenFilter } = useApp()

  const filtered =
    listenFilter === 'all'
      ? filteredOpenLetters
      : filteredOpenLetters.filter(l => l.mood === listenFilter)

  return (
    <div className="grid min-h-[calc(100vh-56px)]" style={{ gridTemplateColumns: '220px 1fr' }}>
      <ListenSidebar filter={listenFilter} setFilter={setListenFilter} />

      <div className="px-9 py-7">
        <div className="flex items-center justify-between mb-[14px]">
          <div className="font-lora text-[19px] font-medium text-ink tracking-[-0.4px]">Letters waiting</div>
        </div>
        <p className="text-[13px] text-ink-muted font-light mb-5 leading-[1.5]">
          Each one is a real person. Take your time before you choose.
        </p>

        {filtered.length === 0 ? (
          <EmptyState icon="📭" title="No letters here right now" sub="Check back soon — someone will write." />
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {filtered.map(letter => (
              <OpenLetterGridCard
                key={letter.id}
                letter={letter}
                onClick={() => openLetterDrawer(letter.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
