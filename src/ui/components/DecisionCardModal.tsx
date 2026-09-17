import { CARD_POOL } from '../../content'
import { useGame } from '../useGame'

export function DecisionCardModal() {
  const { state, dispatch } = useGame()
  const active = state.activeCards[0]
  if (!active) return null

  const card = CARD_POOL.find((c) => c.id === active.cardId)
  if (!card) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 p-6 shadow-xl">
        <h2 className="text-lg font-bold text-slate-100">{card.title}</h2>
        <p className="mt-2 text-sm text-slate-400">{card.description}</p>

        <div className="mt-5 flex flex-col gap-2">
          {card.options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => dispatch({ type: 'RESOLVE_CARD', cardId: card.id, optionId: option.id })}
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
