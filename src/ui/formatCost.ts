import { MATERIAL_LABELS } from '../content'
import { MATERIAL_TYPES } from '../simulation'
import type { ResourceDelta } from '../simulation'

/** Renders a cost/effects delta as "$4,000 budget, 12 Parts, 10 Fuel" etc. */
export function formatCost(cost: ResourceDelta): string {
  const parts: string[] = []
  if (cost.budget) parts.push(`$${Math.abs(cost.budget).toLocaleString()} budget`)
  if (cost.rd) parts.push(`${Math.abs(cost.rd)} R&D`)
  for (const type of MATERIAL_TYPES) {
    const amount = cost[type]
    if (amount) parts.push(`${Math.abs(amount)} ${MATERIAL_LABELS[type]}`)
  }
  return parts.join(', ')
}
