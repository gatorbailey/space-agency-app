import { ASTRONAUT_SKILLS } from '../../simulation'
import type { Astronaut } from '../../simulation'
import { useGame } from '../useGame'

const SKILL_LABELS: Record<(typeof ASTRONAUT_SKILLS)[number], string> = {
  piloting: 'PLT',
  engineering: 'ENG',
  eva: 'EVA',
  science: 'SCI',
  command: 'CMD',
  public: 'PUB',
}

export function AstronautRoster() {
  const { state, dispatch } = useGame()
  const { astronauts, activeCap } = state.roster

  const active = astronauts.filter((a) => a.status === 'active')
  const reserve = astronauts.filter((a) => a.status === 'reserve')
  const lostCount = astronauts.filter((a) => a.status === 'deceased').length

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold text-slate-100">Astronaut Corps</h3>
        <span className="text-xs text-slate-500">
          Active {active.length}/{activeCap}
        </span>
      </div>

      <RosterGroup
        title="Active Roster"
        astronauts={active}
        actionLabel="Stand Down"
        onAction={(id) => dispatch({ type: 'DEMOTE_ASTRONAUT', astronautId: id })}
      />

      <RosterGroup
        title="Reserve Corps"
        astronauts={reserve}
        actionLabel="Promote"
        onAction={(id) => dispatch({ type: 'PROMOTE_ASTRONAUT', astronautId: id })}
        actionDisabled={active.length >= activeCap}
      />

      {lostCount > 0 && (
        <p className="mt-3 text-xs text-slate-500">
          {lostCount} {lostCount === 1 ? 'astronaut' : 'astronauts'} lost in the line of duty.
        </p>
      )}
    </div>
  )
}

function RosterGroup({
  title,
  astronauts,
  actionLabel,
  onAction,
  actionDisabled,
}: {
  title: string
  astronauts: Astronaut[]
  actionLabel: string
  onAction: (astronautId: string) => void
  actionDisabled?: boolean
}) {
  return (
    <div className="mt-3">
      <h4 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{title}</h4>
      {astronauts.length === 0 ? (
        <p className="mt-1 text-sm text-slate-600">None.</p>
      ) : (
        <ul className="mt-1 flex flex-col gap-1.5">
          {astronauts.map((astronaut) => (
            <li
              key={astronaut.id}
              className="flex items-center justify-between gap-2 rounded border border-slate-800 bg-slate-800/50 px-3 py-2"
            >
              <div>
                <div className="text-sm font-semibold text-slate-100">{astronaut.lastName}</div>
                <div className="mt-0.5 flex flex-wrap gap-x-2 text-[10px] text-slate-500">
                  {ASTRONAUT_SKILLS.map((skill) => (
                    <span key={skill}>
                      {SKILL_LABELS[skill]} {astronaut.skills[skill]}
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                disabled={actionDisabled}
                onClick={() => onAction(astronaut.id)}
                className="shrink-0 rounded border border-slate-600 px-2 py-1 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {actionLabel}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
