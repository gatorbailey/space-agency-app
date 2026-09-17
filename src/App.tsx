import { ClockControl } from './ui/components/ClockControl'
import { DecisionCardModal } from './ui/components/DecisionCardModal'
import { HeadlineFeed } from './ui/components/HeadlineFeed'
import { LaunchSequenceModal } from './ui/components/LaunchSequenceModal'
import { MilestonePanel } from './ui/components/MilestonePanel'
import { ResourceBar } from './ui/components/ResourceBar'
import { GameProvider } from './ui/GameContext'

function App() {
  return (
    <GameProvider>
      <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
        <header>
          <h1 className="px-4 pt-4 text-xl font-bold tracking-tight">Space Agency</h1>
          <ResourceBar />
          <ClockControl />
        </header>

        <main className="flex-1 px-4 py-4">
          <MilestonePanel />
        </main>

        <HeadlineFeed />

        <DecisionCardModal />
        <LaunchSequenceModal />
      </div>
    </GameProvider>
  )
}

export default App
