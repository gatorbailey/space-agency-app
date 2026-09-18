import { TECH_IDS } from '../simulation'
import type { TechNodeDef } from '../simulation'

/**
 * The knowledge tech tree's first tier. Exotic Propulsion and the
 * infrastructure-side tree (Pad/VAB/Fueling/Crawler/Mission Control/
 * Training Center/R&D Lab tiers) are later work — Exotic specifically
 * requires an R&D Lab tier this pass doesn't build yet, per CLAUDE.md.
 */
export const TECH_TREE: TechNodeDef[] = [
  {
    id: TECH_IDS.propulsionChemical,
    name: 'Propulsion: Chemical',
    description:
      'Well-understood liquid-fuel propulsion. A cut-corner risk setting costs less margin than it used to.',
    cost: { rd: -25, budget: -2000 },
  },
  {
    id: TECH_IDS.lifeSupport,
    name: 'Life Support',
    description: 'Better environmental control and redundancy. A failed mission costs the crew less.',
    cost: { rd: -25, budget: -2000 },
  },
  {
    id: TECH_IDS.materialsScience,
    name: 'Materials Science',
    description: 'Lighter, cheaper, more efficient components. Materials accrue faster at the facility.',
    cost: { rd: -20, budget: -1500 },
  },
  {
    id: TECH_IDS.avionicsComputing,
    name: 'Avionics / Computing',
    description: 'Better onboard and ground computing sharpens the weather forecast’s accuracy.',
    cost: { rd: -20, budget: -1500 },
  },
]
