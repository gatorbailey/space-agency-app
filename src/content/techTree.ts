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

/**
 * Security Depot — units, vehicles, and perimeter defenses. Per CLAUDE.md's
 * four threat types (trespassers, environmentalists, spies, saboteurs); the
 * threat system itself is still backlog, so today these nodes carry their
 * tour-safety and morale effects and act as the flags that system will read.
 * Note the deliberate tension: visible defenses cost Sentiment.
 */
const SECURITY_TECH: TechNodeDef[] = [
  {
    id: TECH_IDS.securityFencing,
    name: 'Perimeter Fencing',
    description: 'Chain-link, gates, and signage around the pad apron. The first line against the merely curious.',
    category: 'security',
    cost: { budget: -1200, parts: -10 },
    researchDays: 8,
    bonusEffect: { sentiment: 1 },
  },
  {
    id: TECH_IDS.securityPatrols,
    name: 'Site Patrol Unit',
    description: 'A standing guard detail on rotation. Tour mishaps are half as likely with someone watching the LOX farm.',
    category: 'security',
    cost: { budget: -1800 },
    researchDays: 12,
    requiresTechId: TECH_IDS.securityFencing,
  },
  {
    id: TECH_IDS.securityVehicles,
    name: 'Patrol Vehicles',
    description: 'A motor pool for the guard detail. Faster response means a mishap that does happen costs half as much goodwill.',
    category: 'security',
    cost: { budget: -1500, parts: -6, fuel: -6 },
    researchDays: 10,
    requiresTechId: TECH_IDS.securityPatrols,
  },
  {
    id: TECH_IDS.securityAstronautDetail,
    name: 'Astronaut Security Detail',
    description: 'A dedicated escort for the corps on and off site. The crew notices — readiness gets a one-time lift.',
    category: 'security',
    cost: { budget: -2200 },
    researchDays: 14,
    requiresTechId: TECH_IDS.securityPatrols,
    bonusEffect: { crewReadiness: 5 },
  },
  {
    id: TECH_IDS.securityPerimeterDefense,
    name: 'Perimeter Defense Post',
    description:
      'Hardened checkpoints and an armed post at the gate. Serious protection against serious threats — and it makes the program look like a military base, which the public notices.',
    category: 'security',
    cost: { budget: -4000, parts: -15 },
    researchDays: 20,
    requiresTechId: TECH_IDS.securityVehicles,
    bonusEffect: { sentiment: -4 },
  },
]

/**
 * Fabrication Facility — machinery and methods that raise what the site can
 * make for itself. Effects land on the facility rates the Materials
 * Processing plant and R&D Lab already use; the Assembly Line speeds every
 * construction project after it.
 */
const FABRICATION_TECH: TechNodeDef[] = [
  {
    id: TECH_IDS.fabWelding,
    name: 'Precision Welding Shop',
    description: 'Certified welders and jigs for flight-grade structure. Parts accrue faster on-site.',
    category: 'fabrication',
    cost: { budget: -1500, parts: -10 },
    researchDays: 10,
  },
  {
    id: TECH_IDS.fabPlasmaWelding,
    name: 'Plasma Arc Welding',
    description: 'Cryogenic-tank seams that hold. Fuel accrues faster now that tankage is fabricated here.',
    category: 'fabrication',
    cost: { budget: -2000, parts: -12 },
    researchDays: 12,
    requiresTechId: TECH_IDS.fabWelding,
  },
  {
    id: TECH_IDS.fabMachineShop,
    name: 'Machine Shop Expansion',
    description: 'More lathes, more mills, more floor. Raises the Parts storage cap.',
    category: 'fabrication',
    cost: { budget: -2500, parts: -15 },
    researchDays: 14,
    requiresTechId: TECH_IDS.fabWelding,
  },
  {
    id: TECH_IDS.fabCleanRoom,
    name: 'Clean Room',
    description: 'Instrument and payload work that used to be farmed out happens on-site — and feeds the lab. R&D accrues faster.',
    category: 'fabrication',
    cost: { budget: -3000, parts: -10, safetyGear: -5 },
    researchDays: 16,
    requiresTechId: TECH_IDS.fabMachineShop,
  },
  {
    id: TECH_IDS.fabAssemblyLine,
    name: 'Assembly Line',
    description: 'Staged, repeatable build-out instead of one-off jobs. Every construction project completes 25% faster.',
    category: 'fabrication',
    cost: { budget: -4000, parts: -20 },
    researchDays: 18,
    requiresTechId: TECH_IDS.fabMachineShop,
  },
  {
    id: TECH_IDS.fabRobotics,
    name: 'Robotics & Automation',
    description: 'Automated handling and machining across the floor. Parts and Fuel both accrue faster.',
    category: 'fabrication',
    cost: { budget: -6000, parts: -25 },
    researchDays: 24,
    requiresTechId: TECH_IDS.fabAssemblyLine,
  },
]

export const TECH_TREE: TechNodeDef[] = [...KNOWLEDGE_TECH, ...INFRASTRUCTURE_TECH, ...SECURITY_TECH, ...FABRICATION_TECH]
