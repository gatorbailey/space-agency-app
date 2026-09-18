import { useState } from 'react'
import { MILESTONE } from '../../content'
import { canAfford } from '../../simulation'
import { useGame } from '../useGame'

function formatCost(cost: typeof MILESTONE.cost): string {
  const parts: string[] = []
  if (cost.budget) parts.push(`$${Math.abs(cost.budget).toLocaleString()} budget`)
  if (cost.materials) parts.push(`${Math.abs(cost.materials)} materials`)
  return parts.join(', ')
}

export function MilestonePanel() {
  const { state, dispatch } = useGame()
  const { milestone } = state
  const activeRoster = state.roster.astronauts.filter((a) => a.status === 'active')
  const [crewId, setCrewId] = useState<string>(activeRoster[0]?.id ?? '')

  if (milestone.resolved) {
    return (
      <div className="rounded-lg border border-emerald-800 bg-emerald-950/40 p-4">
        <h3 className="font-semibold text-emerald-300">{MILESTONE.name} — Complete</h3>
        <p className="mt-1 text-sm text-emerald-200/70">{MILESTONE.description}</p>
      </div>
    )
  }

  const affordable = canAfford(state.resources, MILESTONE.cost)
  const selectedCrew = activeRoster.find((a) => a.id === crewId) ?? activeRoster[0]
  const canLaunch = affordable && !!selectedCrew && state.launch === null

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
      <h3 className="font-semibold text-slate-100">{MILESTONE.name}</h3>
      <p className="mt-1 text-sm text-slate-400">{MILESTONE.description}</p>
      <p className="mt-2 text-xs text-slate-500">Launch cost: {formatCost(MILESTONE.cost)}</p>
      {!affordable && (
        <p className="mt-1 text-xs text-amber-400">Not enough budget/materials yet — collect and hold more.</p>
      )}
      {milestone.succeeded === false && (
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
        onClick={() => selectedCrew && dispatch({ type: 'START_LAUNCH', missionId: MILESTONE.id, astronautId: selectedCrew.id })}
        className="mt-3 rounded bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        Begin Launch Sequence
      </button>
    </div>
  )
}
