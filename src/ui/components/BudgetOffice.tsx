import { GAME_CONTENT, OPS_CATEGORY_DEFS } from '../../content'
import { canAfford, dailyOpsCost, dailyOpsEffect, daysUntilBudgetCycle, estimateAppropriation } from '../../simulation'
import type { OpsCategoryDef, ResourceDelta } from '../../simulation'
import { useGame } from '../useGame'
import { Stat } from './Stat'

function formatBudget(value: number): string {
  return `$${Math.round(value).toLocaleString()}`
}

function fmtAmount(n: number): string {
  return Number.isInteger(n) ? `${n}` : n.toFixed(1)
}

/** These 3 ops categories only ever touch one of these keys each. */
function formatGain(effect: ResourceDelta): string {
  if (effect.rd) return `+${fmtAmount(effect.rd)} R&D`
  if (effect.crewReadiness) return `+${fmtAmount(effect.crewReadiness)} Crew Readiness`
  if (effect.sentiment) return `+${fmtAmount(effect.sentiment)} Sentiment`
  return ''
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

      <h4 className="mt-5 text-xs font-semibold tracking-wide text-slate-500 uppercase">Operations Budget</h4>
      <p className="mt-1 text-xs text-slate-500">
        Each dial spends from Budget every day it's funded; a Surge spends once for an immediate result instead.
      </p>
      <ul className="mt-2 flex flex-col gap-2">
        {OPS_CATEGORY_DEFS.map((def) => (
          <OpsCategoryRow key={def.id} def={def} />
        ))}
      </ul>
    </div>
  )
}

function OpsCategoryRow({ def }: { def: OpsCategoryDef }) {
  const { state, dispatch } = useGame()
  const allocation = state.opsAllocation[def.id]
  const cost = dailyOpsCost(def, allocation)
  const gain = dailyOpsEffect(def, allocation)
  const surgeAffordable = canAfford(state.resources, { budget: -def.surgeCost })

  return (
    <li className="rounded border border-slate-700 bg-slate-800/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-slate-100">{def.label}</span>
        <span className="shrink-0 font-mono text-xs text-slate-400">
          {allocation}% — {formatBudget(cost)}/day
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-400">{def.description}</p>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={allocation}
        onChange={(e) =>
          dispatch({ type: 'SET_OPS_ALLOCATION', category: def.id, amount: Number(e.target.value) })
        }
        className="mt-2 w-full accent-emerald-500"
      />
      {allocation > 0 && <p className="mt-1 text-xs text-slate-500">{formatGain(gain)}/day at current allocation</p>}
      <button
        type="button"
        disabled={!surgeAffordable}
        onClick={() => dispatch({ type: 'SURGE_OPS', category: def.id })}
        className="mt-2 rounded border border-sky-700 px-3 py-1 text-xs font-semibold text-sky-300 transition hover:bg-sky-950 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Surge — {formatBudget(def.surgeCost)} for {formatGain(def.surgeEffect)}
      </button>
    </li>
  )
}
