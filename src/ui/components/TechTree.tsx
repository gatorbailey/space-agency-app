import { TECH_TREE } from '../../content'
import { canAfford } from '../../simulation'
import type { ResourceDelta } from '../../simulation'
import { useGame } from '../useGame'

function formatCost(cost: ResourceDelta): string {
  const parts: string[] = []
  if (cost.rd) parts.push(`${Math.abs(cost.rd)} R&D`)
  if (cost.budget) parts.push(`$${Math.abs(cost.budget).toLocaleString()} budget`)
  return parts.join(', ')
}

export function TechTree() {
  const { state, dispatch } = useGame()

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
      <h3 className="font-semibold text-slate-100">Knowledge Tech Tree</h3>
      <p className="mt-1 text-xs text-slate-500">Research spends R&amp;D (and some budget) on permanent upgrades.</p>

      <ul className="mt-3 flex flex-col gap-2">
        {TECH_TREE.map((node) => {
          const unlocked = state.unlockedTech.includes(node.id)
          const affordable = canAfford(state.resources, node.cost)
          return (
            <li
              key={node.id}
              className={`rounded border p-3 ${
                unlocked ? 'border-emerald-800 bg-emerald-950/30' : 'border-slate-700 bg-slate-800/50'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm font-semibold ${unlocked ? 'text-emerald-300' : 'text-slate-100'}`}>
                  {node.name}
                </span>
                {unlocked ? (
                  <span className="shrink-0 rounded bg-emerald-900 px-2 py-0.5 text-xs font-bold text-emerald-300">
                    RESEARCHED
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={!affordable}
                    onClick={() => dispatch({ type: 'RESEARCH_TECH', techId: node.id })}
                    className="shrink-0 rounded border border-sky-700 px-3 py-1 text-xs font-semibold text-sky-300 transition hover:bg-sky-950 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Research
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-400">{node.description}</p>
              {!unlocked && <p className="mt-1 text-xs text-slate-500">Cost: {formatCost(node.cost)}</p>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
