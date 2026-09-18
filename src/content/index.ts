import type { GameContent, ResourceState } from '../simulation'
import { ACTIVE_ROSTER_CAP, ASTRONAUT_POOL, INITIAL_ACTIVE_ASTRONAUT_IDS } from './astronauts'
import { BUDGET_CYCLE } from './budget'
import { CARD_POOL } from './cards'
import { MATERIAL_LABELS, PROCUREMENT } from './materials'
import { MILESTONES } from './milestones'
import { FACILITY, WEATHER_PROFILE } from './site'
import { GO_NO_GO_STATIONS } from './stations'
import { TECH_TREE } from './techTree'
import { TOURS } from './tours'

export const STARTING_RESOURCES: ResourceState = {
  sentiment: 50,
  budget: 12000,
  crewReadiness: 70,
  rd: 0,
  parts: 20,
  fuel: 15,
  payload: 10,
  safetyGear: 10,
  provisions: 10,
}

export const GAME_CONTENT: GameContent = {
  cardPool: CARD_POOL,
  stations: GO_NO_GO_STATIONS,
  weatherProfile: WEATHER_PROFILE,
  milestones: MILESTONES,
  techTree: TECH_TREE,
  tours: TOURS,
  procurement: PROCUREMENT,
  budgetCycle: BUDGET_CYCLE,
  facility: FACILITY,
  startingResources: STARTING_RESOURCES,
  astronautPool: ASTRONAUT_POOL,
  initialActiveIds: INITIAL_ACTIVE_ASTRONAUT_IDS,
  activeRosterCap: ACTIVE_ROSTER_CAP,
}

export {
  ASTRONAUT_POOL,
  BUDGET_CYCLE,
  CARD_POOL,
  GO_NO_GO_STATIONS,
  MATERIAL_LABELS,
  MILESTONES,
  PROCUREMENT,
  TECH_TREE,
  TOURS,
  WEATHER_PROFILE,
}
export { SITE_NAME } from './site'
