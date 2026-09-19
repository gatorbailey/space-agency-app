import { SITE_NAME } from '../../content'
import type { ClockSpeed } from '../../simulation'
import { useGame } from '../useGame'

const SPEEDS: { speed: ClockSpeed; label: string }[] = [
  { speed: 'paused', label: 'II' },
  { speed: 'normal', label: '1x' },
  { speed: 'fast', label: '2x' },
  { speed: 'faster', label: '3x' },
]

function dayToDate(day: number): string {
  const start = new Date(Date.UTC(1960, 0, 1))
  const date = new Date(start.getTime() + day * 24 * 60 * 60 * 1000)
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export function ClockControl() {
  const { state, dispatch } = useGame()

  return (
    <div className="flex flex-col gap-2 bg-slate-950 px-4 py-2 text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm whitespace-nowrap">
          <span className="text-slate-500">{SITE_NAME}</span>
          <span className="mx-2 text-slate-700">|</span>
          <span className="font-mono">{dayToDate(state.day)}</span>
        </div>

        <div className="flex items-center gap-1">
          {SPEEDS.map(({ speed, label }) => (
            <button
              key={speed}
              type="button"
              disabled={state.isHardPaused}
              onClick={() => dispatch({ type: 'SET_SPEED', speed })}
              className={`rounded px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-30 ${
                state.speed === speed ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {state.isHardPaused && (
        <span className="self-start rounded bg-red-900/60 px-2 py-1 text-xs font-semibold text-red-300">
          HOLD — go/no-go in progress
        </span>
      )}

      {state.launch && (state.launch.stage === 'rollout' || state.launch.stage === 'rollback') && (
        <span className="self-start rounded bg-amber-900/60 px-2 py-1 text-xs font-semibold text-amber-300">
          {state.launch.stage === 'rollout' ? 'Rolling out to the pad' : 'Returning to the VAB'} —{' '}
          {Math.max(0, (state.launch.transitCompletesOnDay ?? state.day) - state.day)}d
        </span>
      )}
    </div>
  )
}
