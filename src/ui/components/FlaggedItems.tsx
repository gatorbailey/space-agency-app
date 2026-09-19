import { CARD_POOL } from '../../content'
import { CARD_DEPARTMENTS } from '../../simulation'
import type { ActiveCard, DecisionCardDef } from '../../simulation'
import { DEPARTMENT_LABELS } from '../departmentLabels'
import { useGame } from '../useGame'

function daysLeftOnCard(def: DecisionCardDef, active: ActiveCard, day: number): number {
  if (def.deadlineDays === undefined) return Number.POSITIVE_INFINITY
  return def.deadlineDays - (day - active.drawnOnDay)
}

/** The flagged-card queue, grouped by desk — shared by the status menu and the Administration building. */
export function FlaggedItems({ onSelectCard }: { onSelectCard: (cardId: string) => void }) {
  const { state } = useGame()

  const flaggedItems = state.activeCards
    .map((active) => ({ active, def: CARD_POOL.find((c) => c.id === active.cardId) }))
    .filter((entry): entry is { active: ActiveCard; def: DecisionCardDef } => entry.def?.severity === 'flag')

  const grouped = CARD_DEPARTMENTS.map((dept) => ({
    dept,
    items: flaggedItems
      .filter((item) => item.def.department === dept)
      .sort((a, b) => daysLeftOnCard(a.def, a.active, state.day) - daysLeftOnCard(b.def, b.active, state.day)),
  })).filter((g) => g.items.length > 0)

  const lastExpiredDef = state.lastExpiredCard
    ? CARD_POOL.find((c) => c.id === state.lastExpiredCard?.cardId)
    : undefined
  const lastExpiredOption = lastExpiredDef?.options.find((o) => o.id === state.lastExpiredCard?.optionId)

  return (
    <div>
      {lastExpiredDef && (
        <p className="border-b border-slate-800 bg-amber-950/30 px-3 py-2 text-xs text-amber-300">
          Went unanswered: <span className="font-semibold">{lastExpiredDef.title}</span> defaulted to{' '}
          {lastExpiredOption?.label ?? 'no action'}.
        </p>
      )}

      {grouped.length === 0 ? (
        <p className="px-3 py-4 text-sm text-slate-500">Nothing needs your attention.</p>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          {grouped.map(({ dept, items }) => (
            <div key={dept}>
              <div className="bg-slate-950/60 px-3 py-1 text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
                {DEPARTMENT_LABELS[dept]}
              </div>
              <ul>
                {items.map(({ active, def }) => {
                  const remaining = daysLeftOnCard(def, active, state.day)
                  return (
                    <li key={active.cardId}>
                      <button
                        type="button"
                        onClick={() => onSelectCard(active.cardId)}
                        className="flex w-full items-center justify-between gap-2 border-b border-slate-800 px-3 py-2 text-left last:border-b-0 hover:bg-slate-800"
                      >
                        <span className="text-sm font-semibold text-slate-100">{def.title}</span>
                        {Number.isFinite(remaining) ? (
                          <span
                            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              remaining <= 2
                                ? 'bg-rose-900 text-rose-300'
                                : remaining <= 5
                                  ? 'bg-amber-900 text-amber-300'
                                  : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {remaining <= 0 ? 'today' : `${remaining}d left`}
                          </span>
                        ) : (
                          <span className="shrink-0 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                            no deadline
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
