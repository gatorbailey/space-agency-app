import type { MilestoneMissionDef } from '../simulation'

/**
 * The MVP's one scripted milestone mission — a suborbital first-flight
 * vertical slice, analogous in spirit and stakes to the real Mercury-Redstone
 * program but with fictionalized hardware names per CLAUDE.md.
 */
export const MILESTONE: MilestoneMissionDef = {
  id: 'horizon-1',
  name: 'Horizon 1',
  description:
    'The Horizon capsule rides a Pathfinder booster on a suborbital hop — the program’s first crewed flight.',
  plan: {
    payloadType: 'research',
    riskThreshold: 35,
  },
  successEffects: { sentiment: 15, budget: 5000 },
  failureEffects: { sentiment: -10, crewReadiness: -10 },
}
