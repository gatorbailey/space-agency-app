import { MATERIAL_LABELS, PROCUREMENT } from '../../content'
import { canProcure, MATERIAL_TYPES } from '../../simulation'
import { useGame } from '../useGame'

export function MaterialsPanel() {
  const { state, dispatch } = useGame()
  const { resources, pendingParts, pendingFuel, facility } = state

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
      <h3 className="font-semibold text-slate-100">Materials &amp; Logistics</h3>
      <p className="mt-1 text-xs text-slate-500">
        Parts and Fuel accrue on-base; Payload, Safety Gear, and Provisions come from contractor activity —
        procurement, cards, and mission effects.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        {MATERIAL_TYPES.map((type) => (
          <div key={type} className="flex items-baseline gap-1.5">
            <span className="text-xs tracking-wide text-slate-500 uppercase">{MATERIAL_LABELS[type]}</span>
            <span className="font-mono text-base font-semibold text-amber-300">{Math.round(resources[type])}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            Parts pending: {Math.round(pendingParts)}/{facility.partsStorageCap}
          </span>
          <button
            type="button"
            disabled={pendingParts <= 0}
            onClick={() => dispatch({ type: 'COLLECT_PARTS' })}
            className="rounded bg-amber-500 px-3 py-1 text-xs font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            Collect
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            Fuel pending: {Math.round(pendingFuel)}/{facility.fuelStorageCap}
          </span>
          <button
            type="button"
            disabled={pendingFuel <= 0}
            onClick={() => dispatch({ type: 'COLLECT_FUEL' })}
            className="rounded bg-amber-500 px-3 py-1 text-xs font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            Collect
          </button>
        </div>
      </div>

      <h4 className="mt-4 text-xs font-semibold tracking-wide text-slate-500 uppercase">Rush Order (Contractor)</h4>
      <div className="mt-2 flex flex-wrap gap-2">
        {PROCUREMENT.map((def) => {
          const affordable = canProcure(resources, def)
          return (
            <button
              key={def.materialType}
              type="button"
              disabled={!affordable}
              onClick={() => dispatch({ type: 'PROCURE_MATERIAL', materialType: def.materialType })}
              className="rounded border border-slate-700 bg-slate-800/50 px-3 py-2 text-left transition hover:border-sky-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <div className="text-xs font-semibold text-slate-100">
                +{def.amount} {MATERIAL_LABELS[def.materialType]}
              </div>
              <div className="mt-0.5 text-[10px] text-slate-500">${def.budgetCost.toLocaleString()}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
