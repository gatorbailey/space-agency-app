// Simulation Core types. Zero UI dependencies — see CLAUDE.md architecture split.

export type ClockSpeed = 'paused' | 'normal' | 'fast' | 'faster'

/**
 * Every event/card carries a severity. 'flag' cards queue in the status menu
 * without interrupting the flowing clock; 'pause' is reserved for the rare
 * card urgent enough to demand an immediate answer (distinct from the hard
 * pause on a launch's go/no-go window, which isn't card-driven at all).
 */
export type Severity = 'flag' | 'pause'

export interface ResourceState {
  sentiment: number
  budget: number
  materials: number
  crewReadiness: number
}

export type ResourceDelta = Partial<ResourceState>

export interface FacilityState {
  materialsPerDay: number
  /** Storage cap on the *uncollected* buffer — the daily-engagement hook. */
  materialsStorageCap: number
}

export interface DecisionOption {
  id: string
  label: string
  description: string
  effects: ResourceDelta
}

export interface DecisionCardDef {
  id: string
  title: string
  description: string
  severity: Severity
  /** Which site this item is tagged to in the status menu (MVP has one). */
  site: string
  /** Earliest sim day this card is eligible to be drawn. */
  availableFromDay: number
  /** Minimum sim-days after resolution before this card can be drawn again. */
  cooldownDays: number
  options: DecisionOption[]
}

export interface ActiveCard {
  cardId: string
  drawnOnDay: number
}

export type PayloadType = 'commercial' | 'research' | 'military'

export interface LaunchPlan {
  payloadType: PayloadType
  /** 0 (gold-plate safe) to 100 (cut every corner). */
  riskThreshold: number
}

export type LaunchStage = 'weather' | 'go-no-go' | 'outcome' | 'complete'

export interface WeatherCheck {
  temperatureF: number
  thresholdF: number
  isSafe: boolean
}

export interface GoNoGoStationDef {
  id: string
  name: string
  officer: string
}

export interface GoNoGoStatus {
  stationId: string
  isGo: boolean
  reasoning: string
  overridden: boolean
}

export interface LaunchSequenceState {
  missionId: string
  plan: LaunchPlan
  stage: LaunchStage
  weather: WeatherCheck | null
  stations: GoNoGoStatus[]
  outcome: 'success' | 'failure' | 'scrubbed' | null
}

export interface Headline {
  id: string
  outlet: 'Daily Supporter' | 'Detractor Weekly'
  text: string
  day: number
}

export interface MilestoneMissionDef {
  id: string
  name: string
  description: string
  plan: LaunchPlan
  /** Deducted from resources on commit — a negative delta, same shape as card effects. */
  cost: ResourceDelta
  /** Applied on top of the computed launch outcome. */
  successEffects: ResourceDelta
  failureEffects: ResourceDelta
}

export interface MilestoneState {
  missionId: string
  resolved: boolean
  succeeded: boolean | null
}

export interface GameState {
  day: number
  speed: ClockSpeed
  /** True only during a launch's go/no-go window — the one hard pause. */
  isHardPaused: boolean
  resources: ResourceState
  facility: FacilityState
  /** Materials accrued passively but not yet collected into `resources.materials`. */
  pendingMaterials: number
  activeCards: ActiveCard[]
  /** Maps card id to the sim day it was last resolved, for cooldown-based redraws. */
  resolvedCards: Record<string, number>
  launch: LaunchSequenceState | null
  headlines: Headline[]
  milestone: MilestoneState
}

export type GameAction =
  | { type: 'SET_SPEED'; speed: ClockSpeed }
  | { type: 'TICK' }
  | { type: 'COLLECT_MATERIALS' }
  | { type: 'RESOLVE_CARD'; cardId: string; optionId: string }
  | { type: 'START_LAUNCH'; missionId: string }
  | { type: 'RUN_WEATHER_CHECK' }
  | { type: 'SCRUB_LAUNCH' }
  | { type: 'PROCEED_TO_GO_NO_GO' }
  | { type: 'OVERRIDE_STATION'; stationId: string }
  | { type: 'COMMIT_LAUNCH' }
  | { type: 'ACKNOWLEDGE_OUTCOME' }

/** Injectable for deterministic tests; defaults to Math.random at the call site. */
export type Rng = () => number

export interface SiteWeatherProfile {
  meanTempF: number
  stdDevTempF: number
  safeThresholdF: number
}

/**
 * Everything narrative/tunable the Simulation Core needs but does not own —
 * assembled by src/content and passed in, so engine code never imports
 * content directly and stays testable with mock data.
 */
export interface GameContent {
  cardPool: DecisionCardDef[]
  stations: GoNoGoStationDef[]
  weatherProfile: SiteWeatherProfile
  milestone: MilestoneMissionDef
  facility: FacilityState
  startingResources: ResourceState
}
