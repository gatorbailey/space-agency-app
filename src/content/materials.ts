import type { MaterialType, ProcurementDef } from '../simulation'

/** Display labels for the five material types, shared across UI components. */
export const MATERIAL_LABELS: Record<MaterialType, string> = {
  parts: 'Parts',
  fuel: 'Fuel',
  payload: 'Payload',
  safetyGear: 'Safety Gear',
  provisions: 'Provisions',
}

/**
 * Rush-order pricing for procuring each material type directly from a
 * contractor, on top of Parts/Fuel's passive on-base accrual. Payload,
 * Safety Gear, and Provisions have no passive accrual at all — procurement
 * and card effects are their only sources.
 */
export const PROCUREMENT: ProcurementDef[] = [
  { materialType: 'parts', budgetCost: 150, amount: 10 },
  { materialType: 'fuel', budgetCost: 120, amount: 10 },
  { materialType: 'payload', budgetCost: 300, amount: 5 },
  { materialType: 'safetyGear', budgetCost: 200, amount: 5 },
  { materialType: 'provisions', budgetCost: 100, amount: 10 },
]
