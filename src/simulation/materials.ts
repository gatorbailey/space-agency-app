import { canAfford, applyDelta } from './resources'
import type { ProcurementDef, ResourceState } from './types'

export function canProcure(resources: ResourceState, def: ProcurementDef): boolean {
  return canAfford(resources, { budget: -def.budgetCost })
}

export function procure(resources: ResourceState, def: ProcurementDef): ResourceState {
  return applyDelta(resources, { budget: -def.budgetCost, [def.materialType]: def.amount })
}
