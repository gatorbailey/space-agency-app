import { GAME_CONTENT } from '../../content'
import { daysUntilBudgetCycle, estimateAppropriation } from '../../simulation'
import { useGame } from '../useGame'

function formatBudget(value: number): string {
  return `$${Math.round(value).toLocaleString()}`
}

export function ResourceBar() {
  const { state, dispatch } = useGame()
  const { resources, pendingRD, facility } = state
  const daysLeft = daysUntilBudgetCycle(state, GAME_CONTENT.budgetCycle)
  const estimatedAppropriation = estimateAppropriation(resources.sentiment, GAME_CONTENT.budgetCycle)

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

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
        <span>
          Next appropriation: <span className="font-mono text-emerald-300">{daysLeft}d</span> — est.{' '}
          {formatBudget(estimatedAppropriation)} at current Sentiment
        </span>
        {state.lastAppropriation && (
          <span className="text-slate-500">
            (last cycle, Day {state.lastAppropriation.day}: +{formatBudget(state.lastAppropriation.amount)})
          </span>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
      <span className={`font-mono text-base font-semibold ${accent}`}>{value}</span>
    </div>
  )
}
