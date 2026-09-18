import { TECH_IDS } from '../simulation'
import type { MilestoneMissionDef } from '../simulation'

/**
 * The scripted milestone chain — each mission unlocks the next on success,
 * per CLAUDE.md: "Pre-curated milestone missions pace tech unlocks and
 * double as tutorial beats." Fictionalized hardware, real historical
 * pacing/stakes.
 */
export const MILESTONES: MilestoneMissionDef[] = [
  {
    id: 'horizon-1',
    name: 'Horizon 1',
    description:
      'The Horizon capsule rides a Pathfinder booster on a suborbital hop — the program’s first crewed flight.',
    plan: { payloadType: 'research', riskThreshold: 35 },
    cost: { budget: -4000, materials: -30 },
    successEffects: { sentiment: 15, budget: 5000 },
    failureEffects: { sentiment: -10, crewReadiness: -10 },
  },
  {
    id: 'horizon-2',
    name: 'Horizon 2',
    description:
      'A second suborbital hop on proven hardware, holding the capsule up longer to prove out the reentry sequence.',
    plan: { payloadType: 'research', riskThreshold: 30 },
    cost: { budget: -5000, materials: -35 },
    successEffects: { sentiment: 12, budget: 4000 },
    failureEffects: { sentiment: -12, crewReadiness: -12 },
    prerequisiteMissionId: 'horizon-1',
  },
  {
    id: 'horizon-3',
    name: 'Horizon 3',
    description: 'The first orbital flight — three trips around the globe on a Pathfinder-Orbital stack.',
    plan: { payloadType: 'research', riskThreshold: 45 },
    cost: { budget: -8000, materials: -45 },
    successEffects: { sentiment: 25, budget: 9000 },
    failureEffects: { sentiment: -18, crewReadiness: -15 },
    prerequisiteMissionId: 'horizon-2',
  },
  {
    id: 'horizon-4',
    name: 'Horizon 4',
    description: 'An extended orbital endurance run, days aloft, proving the life-support margins for what comes next.',
    plan: { payloadType: 'research', riskThreshold: 40 },
    cost: { budget: -10000, materials: -55 },
    successEffects: { sentiment: 20, budget: 8000 },
    failureEffects: { sentiment: -15, crewReadiness: -12 },
    prerequisiteMissionId: 'horizon-3',
    requiredTechId: TECH_IDS.vabTier,
  },
  {
    id: 'horizon-5',
    name: 'Horizon 5',
    description:
      'A rendezvous demonstration with a target capsule in orbit — the capstone flight of the program’s first generation.',
    plan: { payloadType: 'research', riskThreshold: 50 },
    cost: { budget: -14000, materials: -70 },
    successEffects: { sentiment: 35, budget: 15000 },
    failureEffects: { sentiment: -20, crewReadiness: -18 },
    prerequisiteMissionId: 'horizon-4',
    requiredTechId: TECH_IDS.vabTier,
  },
]
