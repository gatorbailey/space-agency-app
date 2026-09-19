import { GO_NO_GO_STATIONS, MILESTONES } from '../../content'
import { useGame } from '../useGame'

export function MissionControlPanel() {
  const { state } = useGame()
  const launch = state.launch
  const mission = launch ? MILESTONES.find((m) => m.id === launch.missionId) : undefined

  return (
    <div>
      <div
        className={`rounded border p-3 text-sm ${
          launch ? 'border-rose-900 bg-rose-950/30 text-rose-200' : 'border-slate-700 bg-slate-800/50 text-slate-300'
        }`}
      >
        {launch && mission
          ? `Launch in progress: ${mission.name} — ${launch.stage} stage.`
          : 'No launch in progress. Begin one from the Launch Complex.'}
      </div>

      <h4 className="mt-4 text-xs font-semibold tracking-wide text-slate-500 uppercase">Go/No-Go Stations</h4>
      <ul className="mt-2 flex flex-col gap-1.5">
        {GO_NO_GO_STATIONS.map((station) => {
          const status = launch?.stations.find((s) => s.stationId === station.id)
          return (
            <li
              key={station.id}
              className="flex items-center justify-between gap-2 rounded border border-slate-800 bg-slate-800/50 px-3 py-2"
            >
              <span className="text-sm text-slate-100">
                {station.name} <span className="text-slate-500">— {station.officer}</span>
              </span>
              {status && (
                <span
                  className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold ${
                    status.isGo
                      ? 'bg-emerald-900 text-emerald-300'
                      : status.overridden
                        ? 'bg-amber-900 text-amber-300'
                        : 'bg-rose-900 text-rose-300'
                  }`}
                >
                  {status.isGo ? 'GO' : status.overridden ? 'OVERRIDDEN' : 'NO-GO'}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
