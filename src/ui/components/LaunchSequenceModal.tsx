import { GO_NO_GO_STATIONS, MILESTONES } from '../../content'
import { canAfford } from '../../simulation'
import { useGame } from '../useGame'

export function LaunchSequenceModal() {
  const { state, dispatch } = useGame()
  const launch = state.launch
  // Rollout/rollback are crawler transit, not a decision point — the clock
  // keeps running, so this doesn't block the rest of the app. Progress
  // shows on the site map and in the clock's status banner instead.
  if (!launch || launch.stage === 'rollout' || launch.stage === 'rollback') return null

  const mission = MILESTONES.find((m) => m.id === launch.missionId)
  const blockedByStations = launch.stations.some((s) => !s.isGo && !s.overridden)
  const affordable = mission ? canAfford(state.resources, mission.cost) : false
  const crew = state.roster.astronauts.find((a) => a.id === launch.astronautId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-lg rounded-lg border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-slate-100">Launch Sequence — {mission?.name}</h2>
        <p className="mt-0.5 text-xs text-slate-500">Crew: {crew?.lastName ?? 'Unassigned'}</p>
        <StageIndicator stage={launch.stage} />

        {launch.stage === 'weather' && (
          <div className="mt-4">
            {!launch.weather ? (
              <button
                type="button"
                onClick={() => dispatch({ type: 'RUN_WEATHER_CHECK' })}
                className="rounded bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950"
              >
                Run Weather Check
              </button>
            ) : (
              <div>
                <p className={`text-2xl font-mono ${launch.weather.isSafe ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {launch.weather.temperatureF}°F
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Safety floor: {launch.weather.thresholdF}°F —{' '}
                  {launch.weather.isSafe ? 'within safe range' : 'below the safe threshold'}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'PROCEED_TO_GO_NO_GO' })}
                    className="rounded bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950"
                  >
                    Proceed to Go/No-Go
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'SCRUB_LAUNCH' })}
                    className="rounded border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"
                  >
                    Scrub (no cost — crawler rolls back to the VAB)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {launch.stage === 'go-no-go' && (
          <div className="mt-4">
            <ul className="flex flex-col gap-2">
              {launch.stations.map((status) => {
                const def = GO_NO_GO_STATIONS.find((s) => s.id === status.stationId)
                return (
                  <li key={status.stationId} className="rounded border border-slate-700 bg-slate-800 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-100">
                        {def?.name} <span className="font-normal text-slate-500">— {def?.officer}</span>
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-bold ${
                          status.isGo
                            ? 'bg-emerald-900 text-emerald-300'
                            : status.overridden
                              ? 'bg-amber-900 text-amber-300'
                              : 'bg-rose-900 text-rose-300'
                        }`}
                      >
                        {status.isGo ? 'GO' : status.overridden ? 'OVERRIDDEN' : 'NO-GO'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{status.reasoning}</p>
                    {!status.isGo && !status.overridden && (
                      <button
                        type="button"
                        onClick={() => dispatch({ type: 'OVERRIDE_STATION', stationId: status.stationId })}
                        className="mt-2 rounded border border-amber-700 px-3 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-950"
                      >
                        Override
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>

            {!affordable && (
              <p className="mt-3 text-xs text-amber-400">
                Not enough on hand to cover the launch cost — scrub and collect or procure more first.
              </p>
            )}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={blockedByStations || !affordable}
                onClick={() => dispatch({ type: 'COMMIT_LAUNCH' })}
                className="rounded bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Commit to Launch
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: 'SCRUB_LAUNCH' })}
                className="rounded border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"
              >
                Scrub
              </button>
            </div>
          </div>
        )}

        {launch.stage === 'outcome' && (
          <div className="mt-4">
            <p
              className={`text-2xl font-bold ${launch.outcome === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}
            >
              {launch.outcome === 'success' ? 'LAUNCH SUCCESS' : 'MISSION FAILURE'}
            </p>
            {launch.astronautLost && (
              <p className="mt-2 text-sm font-semibold text-rose-300">
                {crew?.lastName ?? 'The crew member'} was lost in the line of duty.
              </p>
            )}
            <button
              type="button"
              onClick={() => dispatch({ type: 'ACKNOWLEDGE_OUTCOME' })}
              className="mt-4 rounded bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Rollout/rollback never reach this indicator — the modal returns null for
// those stages (see above), so only the three blocking stages show here.
const STAGES = ['weather', 'go-no-go', 'outcome'] as const

function StageIndicator({ stage }: { stage: (typeof STAGES)[number] }) {
  return (
    <div className="mt-2 flex gap-2 text-xs text-slate-500">
      {STAGES.map((s, i) => (
        <span key={s} className={s === stage ? 'font-semibold text-sky-400' : ''}>
          {i > 0 && <span className="mr-2 text-slate-700">&rarr;</span>}
          {s}
        </span>
      ))}
    </div>
  )
}
