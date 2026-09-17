import { MILESTONE } from '../../content'
import { useGame } from '../useGame'

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

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
      <h3 className="font-semibold text-slate-100">{MILESTONE.name}</h3>
      <p className="mt-1 text-sm text-slate-400">{MILESTONE.description}</p>
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
