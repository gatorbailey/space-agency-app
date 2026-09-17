import type { ResourceDelta, ResourceState } from './types'

const BOUNDS: Record<keyof ResourceState, [number, number]> = {
  sentiment: [0, 100],
  budget: [0, Number.POSITIVE_INFINITY],
  materials: [0, Number.POSITIVE_INFINITY],
  crewReadiness: [0, 100],
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
