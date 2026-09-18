import { useState } from 'react'
import { CARD_POOL } from './content'
import { AstronautRoster } from './ui/components/AstronautRoster'
import { ClockControl } from './ui/components/ClockControl'
import { DecisionCardModal } from './ui/components/DecisionCardModal'
import { HeadlineFeed } from './ui/components/HeadlineFeed'
import { LaunchSequenceModal } from './ui/components/LaunchSequenceModal'
import { MilestonePanel } from './ui/components/MilestonePanel'
import { ResourceBar } from './ui/components/ResourceBar'
import { StatusMenu } from './ui/components/StatusMenu'
import { GameProvider } from './ui/GameContext'
import { useGame } from './ui/useGame'

function App() {
  return (
    <GameProvider>
      <AppShell />
    </GameProvider>
  )
}

function AppShell() {
  const { state } = useGame()
  const [openCardId, setOpenCardId] = useState<string | null>(null)

  // A 'pause' card is urgent and always wins the modal; 'flag' cards only
  // show when picked from the status menu.
  const urgentCard = state.activeCards
    .map((active) => CARD_POOL.find((c) => c.id === active.cardId))
    .find((def) => def?.severity === 'pause')

  const displayedCardId = urgentCard ? urgentCard.id : openCardId

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] text-slate-100">
      <header>
        <div className="flex items-center justify-between px-4 pt-4">
          <h1 className="text-xl font-bold tracking-tight">Space Agency</h1>
          <StatusMenu onSelectCard={setOpenCardId} />
        </div>
        <ResourceBar />
        <ClockControl />
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 py-4">
        <MilestonePanel />
        <AstronautRoster />
      </main>

      <HeadlineFeed />

      <DecisionCardModal cardId={displayedCardId ?? null} dismissible={!urgentCard} onClose={() => setOpenCardId(null)} />
      <LaunchSequenceModal />
    </div>
  )
}

export default App
