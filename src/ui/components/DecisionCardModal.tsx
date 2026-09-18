import { useEffect } from 'react'
import { CARD_POOL } from '../../content'
import { DEPARTMENT_LABELS } from '../departmentLabels'
import { useGame } from '../useGame'

interface DecisionCardModalProps {
  /** Which card to display — the urgent 'pause' card if any, else a menu selection. */
  cardId: string | null
  /** False for an urgent 'pause' card: it must be resolved, not set aside. */
  dismissible: boolean
  onClose: () => void
}

export function DecisionCardModal({ cardId, dismissible, onClose }: DecisionCardModalProps) {
  const { state, dispatch } = useGame()
  const active = cardId ? state.activeCards.find((c) => c.cardId === cardId) : undefined

  // The clock keeps running for 'flag' cards, so one can expire and
  // auto-resolve while its detail view is still open — close it rather than
  // leave a stale, now-inert card on screen.
  useEffect(() => {
    if (cardId && !active) onClose()
  }, [cardId, active, onClose])

  if (!cardId || !active) return null

  const card = CARD_POOL.find((c) => c.id === cardId)
  if (!card) return null

  const daysLeft = card.deadlineDays !== undefined ? card.deadlineDays - (state.day - active.drawnOnDay) : null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100">{card.title}</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {DEPARTMENT_LABELS[card.department]} · {card.site}
              {daysLeft !== null && (
                <span className={daysLeft <= 2 ? 'text-rose-400' : 'text-amber-400'}>
                  {' '}
                  · {daysLeft <= 0 ? 'due today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}
                </span>
              )}
            </p>
          </div>
          {dismissible && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Set aside for later"
              className="shrink-0 text-lg leading-none text-slate-500 hover:text-slate-300"
            >
              ✕
            </button>
          )}
        </div>
        <p className="mt-2 text-sm text-slate-400">{card.description}</p>

        <div className="mt-5 flex flex-col gap-2">
          {card.options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                dispatch({ type: 'RESOLVE_CARD', cardId: card.id, optionId: option.id })
                onClose()
              }}
              className="rounded border border-slate-700 bg-slate-800 px-4 py-3 text-left transition hover:border-sky-500 hover:bg-slate-700"
            >
              <div className="text-sm font-semibold text-slate-100">{option.label}</div>
              <div className="mt-1 text-xs text-slate-400">{option.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
