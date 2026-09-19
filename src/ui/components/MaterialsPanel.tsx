import { MATERIAL_LABELS, PROCUREMENT } from '../../content'
import { canProcure, MATERIAL_TYPES } from '../../simulation'
import { useGame } from '../useGame'

/** List view's combined card; the map splits these across Materials Processing and the Storage Depot. */
export function MaterialsPanel() {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
      <h3 className="font-semibold text-slate-100">Materials &amp; Logistics</h3>
      <p className="mt-1 text-xs text-slate-500">
        Parts and Fuel accrue on-base; Payload, Safety Gear, and Provisions come from contractor activity —
        procurement, cards, and mission effects.
      </p>
      <div className="mt-3">
        <StorageDepot />
      </div>
      <div className="mt-4">
        <MaterialsProcessing />
      </div>
    </div>
  )
}

/** On-base production: the Parts/Fuel pending buffers and their collect buttons. */
export function MaterialsProcessing() {
  const { state, dispatch } = useGame()
  const { pendingParts, pendingFuel, facility } = state

  return (
    <div className="flex flex-col gap-3">
      <PendingRow
        label="Parts"
        pending={pendingParts}
        cap={facility.partsStorageCap}
        perDay={facility.partsPerDay}
        onCollect={() => dispatch({ type: 'COLLECT_PARTS' })}
      />
      <PendingRow
        label="Fuel"
        pending={pendingFuel}
        cap={facility.fuelStorageCap}
        perDay={facility.fuelPerDay}
        onCollect={() => dispatch({ type: 'COLLECT_FUEL' })}
      />
    </div>
  )
}

function PendingRow({
  label,
  pending,
  cap,
  perDay,
  onCollect,
}: {
  label: string
  pending: number
  cap: number
  perDay: number
  onCollect: () => void
}) {
  const full = pending >= cap
  return (
    <div className="rounded border border-slate-700 bg-slate-800/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-slate-100">{label}</span>
        <button
          type="button"
          disabled={pending <= 0}
          onClick={onCollect}
          className="shrink-0 rounded bg-amber-500 px-3 py-1 text-xs font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          Collect {Math.round(pending)}
        </button>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
        <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, (pending / cap) * 100)}%` }} />
      </div>
      <p className={`mt-1 text-xs ${full ? 'text-amber-400' : 'text-slate-500'}`}>
        {Math.round(pending)}/{cap} pending · +{perDay}/day{full && ' — storage full, production idle'}
      </p>
    </div>
  )
}

/** Stock on hand plus contractor rush orders. */
export function StorageDepot() {
  const { state, dispatch } = useGame()
  const { resources } = state

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4">
        {MATERIAL_TYPES.map((type) => (
          <div key={type} className="flex items-baseline gap-1.5">
            <span className="text-xs tracking-wide text-slate-500 uppercase">{MATERIAL_LABELS[type]}</span>
            <span className="font-mono text-base font-semibold text-amber-300">{Math.round(resources[type])}</span>
          </div>
        ))}
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
