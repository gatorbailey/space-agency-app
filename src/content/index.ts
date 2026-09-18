import type { GameContent, ResourceState } from '../simulation'
import { ACTIVE_ROSTER_CAP, ASTRONAUT_POOL, INITIAL_ACTIVE_ASTRONAUT_IDS } from './astronauts'
import { CARD_POOL } from './cards'
import { MILESTONES } from './milestones'
import { FACILITY, WEATHER_PROFILE } from './site'
import { GO_NO_GO_STATIONS } from './stations'

export const STARTING_RESOURCES: ResourceState = {
  sentiment: 50,
  budget: 12000,
  materials: 20,
  crewReadiness: 70,
}

export const GAME_CONTENT: GameContent = {
  cardPool: CARD_POOL,
  stations: GO_NO_GO_STATIONS,
  weatherProfile: WEATHER_PROFILE,
  milestones: MILESTONES,
  facility: FACILITY,
  startingResources: STARTING_RESOURCES,
  astronautPool: ASTRONAUT_POOL,
  initialActiveIds: INITIAL_ACTIVE_ASTRONAUT_IDS,
  activeRosterCap: ACTIVE_ROSTER_CAP,
}

export { ASTRONAUT_POOL, CARD_POOL, GO_NO_GO_STATIONS, MILESTONES, WEATHER_PROFILE }
export { SITE_NAME } from './site'
