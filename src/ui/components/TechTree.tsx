import { TECH_TREE } from '../../content'
import { canAfford } from '../../simulation'
import type { TechNodeDef } from '../../simulation'
import { formatCost } from '../formatCost'
import { useGame } from '../useGame'

export function TechTree() {
  const knowledgeNodes = TECH_TREE.filter((n) => n.category === 'knowledge')
  const infrastructureNodes = TECH_TREE.filter((n) => n.category === 'infrastructure')

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
      <h3 className="font-semibold text-slate-100">Tech Tree</h3>
      <p className="mt-1 text-xs text-slate-500">Research spends R&amp;D, budget, and materials on permanent upgrades.</p>

      <h4 className="mt-4 text-xs font-semibold tracking-wide text-slate-500 uppercase">Knowledge</h4>
      <ul className="mt-2 flex flex-col gap-2">
        {knowledgeNodes.map((node) => (
          <TechNodeCard key={node.id} node={node} />
        ))}
      </ul>

      <h4 className="mt-4 text-xs font-semibold tracking-wide text-slate-500 uppercase">Infrastructure</h4>
      <ul className="mt-2 flex flex-col gap-2">
        {infrastructureNodes.map((node) => (
          <TechNodeCard key={node.id} node={node} />
        ))}
      </ul>
    </div>
  )
}

function TechNodeCard({ node }: { node: TechNodeDef }) {
  const { state, dispatch } = useGame()
  const unlocked = state.unlockedTech.includes(node.id)
  const requiredNode = node.requiresTechId ? TECH_TREE.find((t) => t.id === node.requiresTechId) : undefined
  const locked = !!requiredNode && !state.unlockedTech.includes(requiredNode.id)
  const affordable = canAfford(state.resources, node.cost)

  return (
    <li
      className={`rounded border p-3 ${
        unlocked
          ? 'border-emerald-800 bg-emerald-950/30'
          : locked
            ? 'border-slate-800 bg-slate-900/50 opacity-60'
            : 'border-slate-700 bg-slate-800/50'
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
        ) : locked ? null : (
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
      {locked && <p className="mt-1 text-xs text-slate-500">Requires {requiredNode?.name} first.</p>}
      {!unlocked && !locked && <p className="mt-1 text-xs text-slate-500">Cost: {formatCost(node.cost)}</p>}
    </li>
  )
}
