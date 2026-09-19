import { TECH_IDS } from '../simulation'
import type { CardDepartment } from '../simulation'

/**
 * The site map — presentation data, not engine state. Each building is a
 * tap target that opens the panel for the system it houses; a department
 * badge routes that desk's flagged cards to its building. Coordinates are
 * in SiteMap's viewBox units (see MAP_WIDTH / MAP_HEIGHT).
 */
export const MAP_WIDTH = 420
export const MAP_HEIGHT = 1060

export type BuildingId =
  | 'admin'
  | 'budget-office'
  | 'press'
  | 'security'
  | 'barracks'
  | 'mission-control'
  | 'rd-lab'
  | 'fabrication'
  | 'materials'
  | 'depot'
  | 'vab'
  | 'launch-pad'

export type BuildingKind =
  | 'admin'
  | 'office'
  | 'press'
  | 'security'
  | 'barracks'
  | 'mission-control'
  | 'lab'
  | 'factory'
  | 'processing'
  | 'depot'
  | 'vab'
  | 'pad'

export interface BuildingDef {
  id: BuildingId
  name: string
  /** Short caption drawn under the building on the map. */
  label: string
  blurb: string
  kind: BuildingKind
  /** Flagged cards from this desk badge this building. */
  department?: CardDepartment
  /** Infrastructure tiers that upgrade this specific building; shown in its panel. */
  upgradeTechIds?: string[]
  x: number
  y: number
  w: number
  h: number
}

/**
 * Positions are staggered left/right down the peninsula rather than laid out
 * on a grid — each one was checked against SiteMap's coastline (a narrow
 * guaranteed-safe x-corridor, see the comment there) and against every
 * other building's bounding box before being placed, then confirmed live in
 * the browser.
 */
export const BUILDINGS: BuildingDef[] = [
  { id: 'admin', name: 'Administration', label: 'Admin', blurb: 'Every desk reports here.', kind: 'admin', department: 'personnel', x: 95, y: 40, w: 100, h: 70 },
  { id: 'budget-office', name: 'Budget & Government Affairs', label: 'Budget Office', blurb: 'Appropriations and ongoing operations spend.', kind: 'office', department: 'budget', x: 210, y: 50, w: 112, h: 70 },
  { id: 'press', name: 'Press & Visitor Center', label: 'Press Center', blurb: 'Tours, headlines, and the public face of the program.', kind: 'press', department: 'press', x: 140, y: 170, w: 108, h: 70 },

  { id: 'security', name: 'Security Depot', label: 'Security', blurb: 'Units, vehicles, and the perimeter.', kind: 'security', x: 95, y: 270, w: 92, h: 62 },
  { id: 'barracks', name: 'Astronaut Quarters', label: 'Astronaut Qtrs', blurb: 'The corps — active roster and reserves.', kind: 'barracks', department: 'astronaut-corps', upgradeTechIds: [TECH_IDS.trainingCenterTier], x: 200, y: 280, w: 122, h: 62 },
  { id: 'mission-control', name: 'Mission Control', label: 'Mission Control', blurb: 'Go/no-go stations and flight operations.', kind: 'mission-control', upgradeTechIds: [TECH_IDS.missionControlTier], x: 140, y: 380, w: 108, h: 82 },

  { id: 'rd-lab', name: 'R&D Lab', label: 'R&D Lab', blurb: 'Knowledge research — one project at a time.', kind: 'lab', upgradeTechIds: [TECH_IDS.rdLabTier], x: 95, y: 500, w: 112, h: 82 },
  { id: 'fabrication', name: 'Fabrication Facility', label: 'Fabrication', blurb: 'Machinery and methods for making it here.', kind: 'factory', x: 215, y: 510, w: 112, h: 82 },
  { id: 'materials', name: 'Materials Processing', label: 'Materials', blurb: 'Parts and Fuel accrue here; collect them.', kind: 'processing', department: 'infrastructure', x: 140, y: 622, w: 100, h: 72 },

  { id: 'depot', name: 'Storage Depot', label: 'Depot', blurb: 'Stock on hand and contractor rush orders.', kind: 'depot', upgradeTechIds: [TECH_IDS.fuelingDepotTier], x: 95, y: 720, w: 104, h: 96 },
  { id: 'vab', name: 'Vehicle Assembly Building', label: 'VAB', blurb: 'Where the vehicle is stacked before rollout.', kind: 'vab', upgradeTechIds: [TECH_IDS.vabTier, TECH_IDS.crawlerTier], x: 215, y: 730, w: 100, h: 120 },
  { id: 'launch-pad', name: 'Launch Complex', label: 'Launch Pad', blurb: 'Milestone missions launch from here.', kind: 'pad', upgradeTechIds: [TECH_IDS.padTier], x: 150, y: 880, w: 110, h: 120 },
]

export function findBuilding(id: BuildingId): BuildingDef {
  const building = BUILDINGS.find((b) => b.id === id)
  if (!building) throw new Error(`Unknown building: ${id}`)
  return building
}
