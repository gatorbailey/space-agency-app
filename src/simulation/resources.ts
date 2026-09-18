import type { ResourceDelta, ResourceState } from './types'

const BOUNDS: Record<keyof ResourceState, [number, number]> = {
  sentiment: [0, 100],
  budget: [0, Number.POSITIVE_INFINITY],
  crewReadiness: [0, 100],
  rd: [0, Number.POSITIVE_INFINITY],
  parts: [0, Number.POSITIVE_INFINITY],
  fuel: [0, Number.POSITIVE_INFINITY],
  payload: [0, Number.POSITIVE_INFINITY],
  safetyGear: [0, Number.POSITIVE_INFINITY],
  provisions: [0, Number.POSITIVE_INFINITY],
}

export function clampResource(key: keyof ResourceState, value: number): number {
  const [min, max] = BOUNDS[key]
  return Math.min(max, Math.max(min, value))
}

export function applyDelta(resources: ResourceState, delta: ResourceDelta): ResourceState {
  const next: ResourceState = { ...resources }
  for (const key of Object.keys(delta) as (keyof ResourceState)[]) {
    const change = delta[key]
    if (change === undefined) continue
    next[key] = clampResource(key, resources[key] + change)
  }
  return next
}

/** True if applying `cost` (a negative delta, e.g. { budget: -4000 }) wouldn't need to go below 0. */
export function canAfford(resources: ResourceState, cost: ResourceDelta): boolean {
  return (Object.keys(cost) as (keyof ResourceState)[]).every((key) => {
    const change = cost[key]
    return change === undefined || resources[key] + change >= 0
  })
}
