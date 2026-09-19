import type { TechCategory, TechLane } from './types'

/**
 * Ids the Simulation Core keys mechanical effects off of — content must
 * define TechNodeDef entries with these exact ids for the effects below to
 * apply. Mirrors the existing pattern for go/no-go station ids in launch.ts.
 */
export const TECH_IDS = {
  // Knowledge tree
  propulsionChemical: 'propulsion-chemical',
  propulsionExotic: 'propulsion-exotic',
  lifeSupport: 'life-support',
  materialsScience: 'materials-science',
  avionicsComputing: 'avionics-computing',
  // Infrastructure tree
  padTier: 'pad-tier',
  vabTier: 'vab-tier',
  fuelingDepotTier: 'fueling-depot-tier',
  crawlerTier: 'crawler-tier',
  missionControlTier: 'mission-control-tier',
  trainingCenterTier: 'training-center-tier',
  rdLabTier: 'rd-lab-tier',
  // Security Depot tree
  securityFencing: 'security-fencing',
  securityPatrols: 'security-patrols',
  securityVehicles: 'security-vehicles',
  securityAstronautDetail: 'security-astronaut-detail',
  securityPerimeterDefense: 'security-perimeter-defense',
  // Fabrication Facility tree
  fabWelding: 'fab-welding',
  fabPlasmaWelding: 'fab-plasma-welding',
  fabMachineShop: 'fab-machine-shop',
  fabCleanRoom: 'fab-clean-room',
  fabAssemblyLine: 'fab-assembly-line',
  fabRobotics: 'fab-robotics',
} as const

export function hasTech(unlockedTech: string[], id: string): boolean {
  return unlockedTech.includes(id)
}

/** Knowledge is lab research; everything else is physical work sharing the site construction crew. */
export function laneForCategory(category: TechCategory): TechLane {
  return category === 'knowledge' ? 'research' : 'construction'
}
