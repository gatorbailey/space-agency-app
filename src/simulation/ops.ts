import { applyDelta } from './resources'
import type { FacilityState, OpsCategoryDef, ResourceDelta, ResourceState } from './types'

export function dailyOpsCost(def: OpsCategoryDef, allocation: number): number {
  return Math.round((allocation / 100) * def.maxDailyCost)
}

export function dailyOpsEffect(def: OpsCategoryDef, allocation: number): ResourceDelta {
  const fraction = allocation / 100
  const effect: ResourceDelta = {}
  for (const key of Object.keys(def.dailyEffect) as (keyof ResourceDelta)[]) {
    const amount = def.dailyEffect[key]
    if (amount !== undefined) effect[key] = amount * fraction
  }
  return effect
}

/**
 * Routes an R&D gain into the pending buffer (capped by storage, collected
 * like passive accrual) so ops spend feeds the same collect loop rather than
 * bypassing it; every other resource in an ops effect applies directly.
 */
export function applyOpsEffect(
  resources: ResourceState,
  pendingRD: number,
  facility: FacilityState,
  effect: ResourceDelta,
): { resources: ResourceState; pendingRD: number } {
  const { rd, ...direct } = effect
  const nextPendingRD = rd ? Math.min(facility.rdStorageCap, pendingRD + rd) : pendingRD
  return { resources: applyDelta(resources, direct), pendingRD: nextPendingRD }
}
