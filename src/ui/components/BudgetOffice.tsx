import { GAME_CONTENT } from '../../content'
import { daysUntilBudgetCycle, estimateAppropriation } from '../../simulation'
import { useGame } from '../useGame'
import { Stat } from './Stat'

function formatBudget(value: number): string {
  return `$${Math.round(value).toLocaleString()}`
}

export function BudgetOffice() {
  const { state } = useGame()
  const { resources, lastAppropriation } = state
  const cycle = GAME_CONTENT.budgetCycle
  const daysLeft = daysUntilBudgetCycle(state, cycle)
  const estimate = estimateAppropriation(resources.sentiment, cycle)
  const progress = ((cycle.cycleDays - daysLeft) / cycle.cycleDays) * 100

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
      <h3 className="font-semibold text-slate-100">Budget Office</h3>
      <p className="mt-1 text-xs text-slate-500">
        Sentiment sets the ceiling on every appropriation — the better the program looks, the more Congress funds it.
      </p>

      <div className="mt-3 flex flex-wrap gap-4">
        <Stat label="Budget on Hand" value={formatBudget(resources.budget)} accent="text-emerald-300" />
        <Stat label="Sentiment" value={`${Math.round(resources.sentiment)}`} accent="text-sky-300" />
      </div>

      <div className="mt-4 rounded border border-slate-700 bg-slate-800/50 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-100">Next Appropriation</span>
          <span className="font-mono text-sm text-emerald-300">{daysLeft}d</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
          <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Estimated grant: <span className="font-semibold text-emerald-300">{formatBudget(estimate)}</span> at
          current Sentiment
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Formula: {formatBudget(cycle.baseAppropriation)} base + {formatBudget(cycle.budgetPerSentiment)} per
          Sentiment point, every {cycle.cycleDays} days.
        </p>
      </div>

      {lastAppropriation && (
        <p className="mt-3 text-xs text-slate-500">
          Last cycle (Day {lastAppropriation.day}): granted {formatBudget(lastAppropriation.amount)} at Sentiment{' '}
          {Math.round(lastAppropriation.sentimentAtCycle)}.
        </p>
      )}
    </div>
  )
}
