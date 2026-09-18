import { useGame } from '../useGame'
import { Stat } from './Stat'

function formatBudget(value: number): string {
  return `$${Math.round(value).toLocaleString()}`
}

export function ResourceBar() {
  const { state, dispatch } = useGame()
  const { resources, pendingRD, facility } = state

  return (
    <div className="flex flex-col gap-2 border-b border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-200">
      <div className="flex flex-wrap items-center gap-4">
        <Stat label="Sentiment" value={`${Math.round(resources.sentiment)}`} accent="text-sky-300" />
        <Stat label="Budget" value={formatBudget(resources.budget)} accent="text-emerald-300" />
        <Stat label="Crew Readiness" value={`${Math.round(resources.crewReadiness)}`} accent="text-violet-300" />
        <Stat label="R&D" value={`${Math.round(resources.rd)}`} accent="text-fuchsia-300" />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">
          R&amp;D pending: {Math.round(pendingRD)}/{facility.rdStorageCap}
        </span>
        <button
          type="button"
          disabled={pendingRD <= 0}
          onClick={() => dispatch({ type: 'COLLECT_RD' })}
          className="rounded bg-fuchsia-500 px-3 py-1 text-xs font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          Collect
        </button>
      </div>
    </div>
  )
}
