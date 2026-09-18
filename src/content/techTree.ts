import { TECH_IDS } from '../simulation'
import type { TechNodeDef } from '../simulation'

/**
 * Knowledge tech (spent via R&D + some budget) — Propulsion, Life Support,
 * Materials Science, Avionics/Computing, per CLAUDE.md. Exotic Propulsion is
 * here too, but gated behind the R&D Lab infrastructure tier.
 */
const KNOWLEDGE_TECH: TechNodeDef[] = [
  {
    id: TECH_IDS.propulsionChemical,
    name: 'Propulsion: Chemical',
    description:
      'Well-understood liquid-fuel propulsion. A cut-corner risk setting costs less margin than it used to.',
    category: 'knowledge',
    cost: { rd: -25, budget: -2000 },
    researchDays: 14,
  },
  {
    id: TECH_IDS.lifeSupport,
    name: 'Life Support',
    description: 'Better environmental control and redundancy. A failed mission costs the crew less.',
    category: 'knowledge',
    cost: { rd: -25, budget: -2000 },
    researchDays: 14,
  },
  {
    id: TECH_IDS.materialsScience,
    name: 'Materials Science',
    description: 'Lighter, cheaper, more efficient components. Parts accrue faster at the facility.',
    category: 'knowledge',
    cost: { rd: -20, budget: -1500 },
    researchDays: 10,
  },
  {
    id: TECH_IDS.avionicsComputing,
    name: 'Avionics / Computing',
    description: 'Better onboard and ground computing sharpens the weather forecast’s accuracy.',
    category: 'knowledge',
    cost: { rd: -20, budget: -1500 },
    researchDays: 10,
  },
  {
    id: TECH_IDS.propulsionExotic,
    name: 'Propulsion: Exotic',
    description:
      'Nuclear-thermal propulsion, well beyond Chemical’s risk margins — but a program using it pays a real Sentiment tax regardless of how safe it actually is. Requires the R&D Lab tier.',
    category: 'knowledge',
    cost: { rd: -60, budget: -6000 },
    researchDays: 30,
    requiresTechId: TECH_IDS.rdLabTier,
    bonusEffect: { sentiment: -8 },
  },
]

/**
 * Infrastructure tech (spent via Funds + Materials, physical, site-specific)
 * — Base-side (Pad, VAB/Assembly, Fueling Depot, Crawler) and Center-side
 * (Mission Control, Training Center, R&D Lab), per CLAUDE.md.
 */
const INFRASTRUCTURE_TECH: TechNodeDef[] = [
  {
    id: TECH_IDS.padTier,
    name: 'Pad Tier II',
    description: 'A hardened launch pad and booster interface. Lowers Propulsion’s no-go odds.',
    category: 'infrastructure',
    cost: { budget: -3000, parts: -20 },
    researchDays: 18,
  },
  {
    id: TECH_IDS.vabTier,
    name: 'VAB / Assembly Tier II',
    description: 'A taller vehicle assembly building, required for the program’s larger, riskier missions.',
    category: 'infrastructure',
    cost: { budget: -5000, parts: -30 },
    researchDays: 25,
  },
  {
    id: TECH_IDS.fuelingDepotTier,
    name: 'Fueling Depot Tier II',
    description: 'Expanded propellant storage at the depot.',
    category: 'infrastructure',
    cost: { budget: -2500, fuel: -15 },
    researchDays: 15,
  },
  {
    id: TECH_IDS.crawlerTier,
    name: 'Crawler / Transporter Tier II',
    description: 'Hardened ground equipment tolerates colder conditions, widening the safe weather floor.',
    category: 'infrastructure',
    cost: { budget: -2500, parts: -15 },
    researchDays: 15,
  },
  {
    id: TECH_IDS.missionControlTier,
    name: 'Mission Control Tier II',
    description: 'Deeper bench of controllers and better telemetry trims no-go odds across the board.',
    category: 'infrastructure',
    cost: { budget: -3500, parts: -10 },
    researchDays: 20,
  },
  {
    id: TECH_IDS.trainingCenterTier,
    name: 'Training Center Tier II',
    description: 'A better simulator and training regimen raises every active astronaut’s effective skills.',
    category: 'infrastructure',
    cost: { budget: -3500, safetyGear: -10 },
    researchDays: 20,
  },
  {
    id: TECH_IDS.rdLabTier,
    name: 'R&D Lab Tier II',
    description: 'A larger research staff raises the R&D generation rate, and unlocks Exotic Propulsion research.',
    category: 'infrastructure',
    cost: { budget: -4000, parts: -20 },
    researchDays: 22,
  },
]

export const TECH_TREE: TechNodeDef[] = [...KNOWLEDGE_TECH, ...INFRASTRUCTURE_TECH]
