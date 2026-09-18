import { TOURS } from '../../content'
import { canAfford, isTourOnCooldown } from '../../simulation'
import type { TourDef } from '../../simulation'
import { useGame } from '../useGame'

export function SiteTours() {
  const { state } = useGame()

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
      <h3 className="font-semibold text-slate-100">Site Tours</h3>
      <p className="mt-1 text-xs text-slate-500">
        Public tours are a steady trickle; VIP tours swing bigger, both ways.
      </p>

      <div className="mt-3 flex flex-col gap-2">
        {TOURS.map((tour) => (
          <TourCard key={tour.type} tour={tour} />
        ))}
      </div>

      {state.lastTourOutcome && (
        <div
          className={`mt-3 rounded border p-3 text-sm ${
            state.lastTourOutcome.mishap
              ? 'border-rose-900 bg-rose-950/30 text-rose-200'
              : 'border-emerald-900 bg-emerald-950/30 text-emerald-200'
          }`}
        >
          {state.lastTourOutcome.text}
          {state.lastTourOutcome.bonusBudget && (
            <span className="mt-1 block text-xs font-semibold text-emerald-300">
              An unexpected budget bump came through.
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function TourCard({ tour }: { tour: TourDef }) {
  const { state, dispatch } = useGame()
  const lastDay = state.lastTourDay[tour.type]
  const onCooldown = isTourOnCooldown(tour, state.day, lastDay)
  const daysRemaining = lastDay !== undefined ? tour.cooldownDays - (state.day - lastDay) : 0
  const affordable = canAfford(state.resources, tour.cost)
  const canHost = !onCooldown && affordable

  return (
    <div className="rounded border border-slate-700 bg-slate-800/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-slate-100">{tour.name}</span>
        <button
          type="button"
          disabled={!canHost}
          onClick={() => dispatch({ type: 'HOST_TOUR', tourType: tour.type })}
          className="shrink-0 rounded bg-sky-500 px-3 py-1 text-xs font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          Host
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-400">{tour.description}</p>
      {!!tour.cost.budget && (
        <p className="mt-1 text-xs text-slate-500">Cost: ${Math.abs(tour.cost.budget).toLocaleString()}</p>
      )}
      {onCooldown && (
        <p className="mt-1 text-xs text-amber-400">
          Available again in {daysRemaining} day{daysRemaining === 1 ? '' : 's'}.
        </p>
      )}
      {!onCooldown && !affordable && <p className="mt-1 text-xs text-amber-400">Not enough budget.</p>}
    </div>
  )
}
