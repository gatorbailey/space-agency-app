import { useState } from 'react'
import { CARD_POOL } from './content'
import type { BuildingId } from './content'
import { AstronautRoster } from './ui/components/AstronautRoster'
import { BudgetOffice } from './ui/components/BudgetOffice'
import { ClockControl } from './ui/components/ClockControl'
import { DecisionCardModal } from './ui/components/DecisionCardModal'
import { HeadlineFeed } from './ui/components/HeadlineFeed'
import { LaunchSequenceModal } from './ui/components/LaunchSequenceModal'
import { MaterialsPanel } from './ui/components/MaterialsPanel'
import { MilestoneList } from './ui/components/MilestoneList'
import { ResourceBar } from './ui/components/ResourceBar'
import { SiteTours } from './ui/components/SiteTours'
import { StatusMenu } from './ui/components/StatusMenu'
import { TechTree } from './ui/components/TechTree'
import { GameProvider } from './ui/GameContext'
import { BuildingDrawer } from './ui/map/BuildingDrawer'
import { SiteMap } from './ui/map/SiteMap'
import { useGame } from './ui/useGame'

type View = 'map' | 'list'

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
  const [view, setView] = useState<View>('map')
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingId | null>(null)

  // A 'pause' card is urgent and always wins the modal; 'flag' cards only
  // show when picked from the status menu or a building.
  const urgentCard = state.activeCards
    .map((active) => CARD_POOL.find((c) => c.id === active.cardId))
    .find((def) => def?.severity === 'pause')

  const displayedCardId = urgentCard ? urgentCard.id : openCardId

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] text-slate-100">
      <header>
        <div className="flex items-center justify-between px-4 pt-4">
          <h1 className="text-xl font-bold tracking-tight">Space Agency</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setView((v) => (v === 'map' ? 'list' : 'map'))}
              className="rounded-full bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
            >
              {view === 'map' ? 'List' : 'Map'}
            </button>
            <StatusMenu onSelectCard={setOpenCardId} />
          </div>
        </div>
        <ResourceBar />
        <ClockControl />
      </header>

      {view === 'map' ? (
        <main className="flex flex-1 flex-col">
          <SiteMap selectedId={selectedBuilding} onSelect={setSelectedBuilding} />
          <HeadlineFeed limit={1} />
        </main>
      ) : (
        <>
          <main className="flex flex-1 flex-col gap-4 px-4 py-4">
            <BudgetOffice />
            <MilestoneList />
            <MaterialsPanel />
            <SiteTours />
            <TechTree />
            <AstronautRoster />
          </main>
          <HeadlineFeed />
        </>
      )}

      <BuildingDrawer
        buildingId={view === 'map' ? selectedBuilding : null}
        onClose={() => setSelectedBuilding(null)}
        onSelectCard={(cardId) => {
          setOpenCardId(cardId)
          setSelectedBuilding(null)
        }}
      />
      <DecisionCardModal cardId={displayedCardId ?? null} dismissible={!urgentCard} onClose={() => setOpenCardId(null)} />
      <LaunchSequenceModal />
    </div>
  )
}

export default App
