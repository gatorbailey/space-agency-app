import { useState } from 'react'
import { CARD_POOL } from '../../content'
import { CARD_DEPARTMENTS } from '../../simulation'
import type { ActiveCard, DecisionCardDef } from '../../simulation'
import { DEPARTMENT_LABELS } from '../departmentLabels'
import { useGame } from '../useGame'

interface StatusMenuProps {
  onSelectCard: (cardId: string) => void
}

function daysLeft(def: DecisionCardDef, active: ActiveCard, day: number): number {
  if (def.deadlineDays === undefined) return Number.POSITIVE_INFINITY
  return def.deadlineDays - (day - active.drawnOnDay)
}

export function StatusMenu({ onSelectCard }: StatusMenuProps) {
  const { state } = useGame()
  const [open, setOpen] = useState(false)

  const flaggedItems = state.activeCards
    .map((active) => ({ active, def: CARD_POOL.find((c) => c.id === active.cardId) }))
    .filter((entry): entry is { active: ActiveCard; def: DecisionCardDef } => entry.def?.severity === 'flag')

  const grouped = CARD_DEPARTMENTS.map((dept) => ({
    dept,
    items: flaggedItems
      .filter((item) => item.def.department === dept)
      .sort((a, b) => daysLeft(a.def, a.active, state.day) - daysLeft(b.def, b.active, state.day)),
  })).filter((g) => g.items.length > 0)

  const lastExpiredDef = state.lastExpiredCard
    ? CARD_POOL.find((c) => c.id === state.lastExpiredCard?.cardId)
    : undefined
  const lastExpiredOption = lastExpiredDef?.options.find((o) => o.id === state.lastExpiredCard?.optionId)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Status menu"
        className="relative rounded-full bg-slate-800 p-2 text-slate-300 transition hover:bg-slate-700"
      >
        <BellIcon />
        {flaggedItems.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white">
            {flaggedItems.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close status menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-20 cursor-default"
          />
          <div className="absolute top-full right-0 z-30 mt-2 w-80 rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
            <div className="border-b border-slate-800 px-3 py-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Flagged Items
            </div>

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
                        const remaining = daysLeft(def, active, state.day)
                        return (
                          <li key={active.cardId}>
                            <button
                              type="button"
                              onClick={() => {
                                onSelectCard(active.cardId)
                                setOpen(false)
                              }}
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
        </>
      )}
    </div>
  )
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}
