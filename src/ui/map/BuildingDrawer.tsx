import { useEffect } from 'react'
import { findBuilding, MILESTONES } from '../../content'
import type { BuildingId } from '../../content'
import type { GameState } from '../../simulation'
import { AstronautRoster } from '../components/AstronautRoster'
import { BudgetOffice } from '../components/BudgetOffice'
import { FlaggedItems } from '../components/FlaggedItems'
import { HeadlineFeed } from '../components/HeadlineFeed'
import { MaterialsProcessing, StorageDepot } from '../components/MaterialsPanel'
import { MilestoneList } from '../components/MilestoneList'
import { MissionControlPanel } from '../components/MissionControlPanel'
import { SiteTours } from '../components/SiteTours'
import { BuildingUpgrades, TechBranch } from '../components/TechTree'
import { useGame } from '../useGame'

interface BuildingDrawerProps {
  buildingId: BuildingId | null
  onClose: () => void
  onSelectCard: (cardId: string) => void
}

/** Bottom sheet showing the system a tapped building houses. */
export function BuildingDrawer({ buildingId, onClose, onSelectCard }: BuildingDrawerProps) {
  useEffect(() => {
    if (!buildingId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [buildingId, onClose])

  if (!buildingId) return null
  const building = findBuilding(buildingId)

  return (
    <>
      <button type="button" aria-label="Close building" onClick={onClose} className="fixed inset-0 z-20 bg-black/50" />
      <div className="fixed inset-x-0 bottom-0 z-30 max-h-[78vh] overflow-y-auto rounded-t-2xl border-t border-slate-700 bg-slate-950 pb-[env(safe-area-inset-bottom)] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur">
          <div>
            <h2 className="text-base font-bold text-slate-100">{building.name}</h2>
            <p className="text-xs text-slate-500">{building.blurb}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 text-lg leading-none text-slate-500 hover:text-slate-300"
          >
            ✕
          </button>
        </div>
        <div className="flex flex-col gap-4 px-4 py-4">
          <BuildingContent buildingId={buildingId} onSelectCard={onSelectCard} />
        </div>
      </div>
    </>
  )
}

function daysLeft(state: GameState): number {
  return Math.max(0, (state.launch?.transitCompletesOnDay ?? state.day) - state.day)
}

function vabStatus(state: GameState, missionName: string): string {
  const stage = state.launch?.stage
  if (stage === 'rollout') return `${missionName} is rolling out to the pad — ${daysLeft(state)}d left.`
  if (stage === 'rollback') return `${missionName}'s vehicle is returning from the pad — back in ${daysLeft(state)}d.`
  return `${missionName} is stacked and at the pad, in its launch sequence.`
}

function padStatus(state: GameState, missionName: string): string {
  const stage = state.launch?.stage
  if (stage === 'rollout') return `${missionName} is en route from the VAB — arriving in ${daysLeft(state)}d.`
  if (stage === 'rollback') return `${missionName} scrubbed and is rolling back to the VAB — ${daysLeft(state)}d left.`
  return `${missionName} is on the pad, in its launch sequence.`
}

function BuildingContent({ buildingId, onSelectCard }: { buildingId: BuildingId; onSelectCard: (id: string) => void }) {
  const { state } = useGame()
  const upgrades = findBuilding(buildingId).upgradeTechIds ?? []

  switch (buildingId) {
    case 'launch-pad': {
      const mission = state.launch ? MILESTONES.find((m) => m.id === state.launch?.missionId) : undefined
      return (
        <>
          {mission && <p className="rounded border border-slate-700 bg-slate-800/50 p-3 text-sm text-slate-300">{padStatus(state, mission.name)}</p>}
          <MilestoneList />
          <BuildingUpgrades techIds={upgrades} />
        </>
      )
    }
    case 'vab': {
      const mission = state.launch ? MILESTONES.find((m) => m.id === state.launch?.missionId) : undefined
      return (
        <>
          <p className="rounded border border-slate-700 bg-slate-800/50 p-3 text-sm text-slate-300">
            {mission ? vabStatus(state, mission.name) : 'No vehicle in the launch sequence.'}
          </p>
          <BuildingUpgrades techIds={upgrades} />
        </>
      )
    }
    case 'mission-control':
      return (
        <>
          <MissionControlPanel />
          <BuildingUpgrades techIds={upgrades} />
        </>
      )
    case 'admin':
      return (
        <div className="rounded-lg border border-slate-700 bg-slate-900">
          <div className="border-b border-slate-800 px-3 py-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Flagged Items — all desks
          </div>
          <FlaggedItems onSelectCard={onSelectCard} />
        </div>
      )
    case 'budget-office':
      return <BudgetOffice />
    case 'rd-lab':
      return (
        <>
          <p className="text-xs text-slate-500">
            R&amp;D on hand: <span className="font-mono text-fuchsia-300">{Math.round(state.resources.rd)}</span> · pending{' '}
            {Math.round(state.pendingRD)}/{state.facility.rdStorageCap} · +{state.facility.rdPerDay}/day
          </p>
          <TechBranch category="knowledge" />
          <BuildingUpgrades techIds={upgrades} />
        </>
      )
    case 'fabrication':
      return <TechBranch category="fabrication" />
    case 'security':
      return <TechBranch category="security" />
    case 'materials':
      return <MaterialsProcessing />
    case 'depot':
      return (
        <>
          <StorageDepot />
          <BuildingUpgrades techIds={upgrades} />
        </>
      )
    case 'barracks':
      return (
        <>
          <AstronautRoster />
          <BuildingUpgrades techIds={upgrades} />
        </>
      )
    case 'press':
      return (
        <>
          <SiteTours />
          <div className="-mx-4">
            <HeadlineFeed />
          </div>
        </>
      )
  }
}
