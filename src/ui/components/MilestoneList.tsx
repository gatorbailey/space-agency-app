import { useState } from 'react'
import { MILESTONES, TECH_TREE } from '../../content'
import { canAfford } from '../../simulation'
import type { Astronaut, MilestoneMissionDef } from '../../simulation'
import { formatCost } from '../formatCost'
import { useGame } from '../useGame'

export function MilestoneList() {
  return (
    <div className="flex flex-col gap-3">
      {MILESTONES.map((mission) => (
        <MilestoneCard key={mission.id} mission={mission} />
      ))}
    </div>
  )
}

function MilestoneCard({ mission }: { mission: MilestoneMissionDef }) {
  const { state, dispatch } = useGame()
  const progress = state.milestones[mission.id]
  const activeRoster = state.roster.astronauts.filter((a) => a.status === 'active')
  const [crewId, setCrewId] = useState<string>('')

  const prerequisite = mission.prerequisiteMissionId
    ? MILESTONES.find((m) => m.id === mission.prerequisiteMissionId)
    : undefined
  const requiredTech = mission.requiredTechId ? TECH_TREE.find((t) => t.id === mission.requiredTechId) : undefined

  const unmetRequirements: string[] = []
  if (prerequisite && !state.milestones[prerequisite.id]?.resolved) {
    unmetRequirements.push(`${prerequisite.name} to succeed first`)
  }
  if (requiredTech && !state.unlockedTech.includes(requiredTech.id)) {
    unmetRequirements.push(`${requiredTech.name} to be researched`)
  }
  const locked = unmetRequirements.length > 0

  if (progress?.resolved) {
    return (
      <div className="rounded-lg border border-emerald-800 bg-emerald-950/40 p-4">
        <h3 className="font-semibold text-emerald-300">{mission.name} — Complete</h3>
        <p className="mt-1 text-sm text-emerald-200/70">{mission.description}</p>
      </div>
    )
  }

  if (locked) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 opacity-60">
        <h3 className="font-semibold text-slate-400">{mission.name} — Locked</h3>
        <p className="mt-1 text-sm text-slate-600">Requires {unmetRequirements.join(' and ')}.</p>
      </div>
    )
  }

  const affordable = canAfford(state.resources, mission.cost)
  const selectedCrew: Astronaut | undefined =
    activeRoster.find((a) => a.id === crewId) ?? activeRoster[0]
  const canLaunch = affordable && !!selectedCrew && state.launch === null

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
      <h3 className="font-semibold text-slate-100">{mission.name}</h3>
      <p className="mt-1 text-sm text-slate-400">{mission.description}</p>
      <p className="mt-2 text-xs text-slate-500">Launch cost: {formatCost(mission.cost)}</p>
      {!affordable && (
        <p className="mt-1 text-xs text-amber-400">Not enough on hand yet — collect, procure, or hold more.</p>
      )}
      {progress?.succeeded === false && (
        <p className="mt-2 text-xs text-rose-400">Last attempt failed — the program can try again.</p>
      )}

      <label className="mt-3 block text-xs text-slate-500">
        Crew assignment
        {activeRoster.length === 0 ? (
          <p className="mt-1 text-xs text-amber-400">No active-roster astronaut available — promote one first.</p>
        ) : (
          <select
            value={selectedCrew?.id ?? ''}
            onChange={(e) => setCrewId(e.target.value)}
            className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100"
          >
            {activeRoster.map((astronaut) => (
              <option key={astronaut.id} value={astronaut.id}>
                {astronaut.lastName}
              </option>
            ))}
          </select>
        )}
      </label>

      <button
        type="button"
        disabled={!canLaunch}
        onClick={() =>
          selectedCrew && dispatch({ type: 'START_LAUNCH', missionId: mission.id, astronautId: selectedCrew.id })
        }
        className="mt-3 rounded bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        Begin Launch Sequence
      </button>
    </div>
  )
}
