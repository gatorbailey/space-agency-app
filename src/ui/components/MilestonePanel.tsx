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

  if (milestone.resolved) {
    return (
      <div className="rounded-lg border border-emerald-800 bg-emerald-950/40 p-4">
        <h3 className="font-semibold text-emerald-300">{MILESTONE.name} — Complete</h3>
        <p className="mt-1 text-sm text-emerald-200/70">{MILESTONE.description}</p>
      </div>
    )
  }

  const affordable = canAfford(state.resources, MILESTONE.cost)

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
      <button
        type="button"
        disabled={state.launch !== null}
        onClick={() => dispatch({ type: 'START_LAUNCH', missionId: MILESTONE.id })}
        className="mt-3 rounded bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        Begin Launch Sequence
      </button>
    </div>
  )
}
