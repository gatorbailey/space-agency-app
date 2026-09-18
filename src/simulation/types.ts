// Simulation Core types. Zero UI dependencies — see CLAUDE.md architecture split.

export type ClockSpeed = 'paused' | 'normal' | 'fast' | 'faster'

/**
 * Every event/card carries a severity. 'flag' cards queue in the status menu
 * without interrupting the flowing clock; 'pause' is reserved for the rare
 * card urgent enough to demand an immediate answer (distinct from the hard
 * pause on a launch's go/no-go window, which isn't card-driven at all).
 */
export type Severity = 'flag' | 'pause'

/**
 * Raw Materials split by type, per CLAUDE.md's "regionally sourced, real
 * supply-chain mechanic" note. Parts and Fuel are on-base production (the
 * passive-accrual pair, mirroring R&D); Payload, Safety Gear, and Provisions
 * are driven by contractor activity — cards, mission effects, and direct
 * procurement rather than a daily tick.
 */
export const MATERIAL_TYPES = ['parts', 'fuel', 'payload', 'safetyGear', 'provisions'] as const
export type MaterialType = (typeof MATERIAL_TYPES)[number]

export type ResourceState = {
  sentiment: number
  budget: number
  crewReadiness: number
  /** Spent on the knowledge tech tree. */
  rd: number
} & Record<MaterialType, number>

export type ResourceDelta = Partial<ResourceState>

export interface FacilityState {
  partsPerDay: number
  /** Storage cap on the *uncollected* buffer — the daily-engagement hook. */
  partsStorageCap: number
  fuelPerDay: number
  fuelStorageCap: number
  rdPerDay: number
  rdStorageCap: number
}

export interface ProcurementDef {
  materialType: MaterialType
  /** Cost to rush-order one batch from a contractor. */
  budgetCost: number
  /** Units gained per order. */
  amount: number
}

/**
 * Per CLAUDE.md: "Budget/Funds — hard currency, granted in appropriation
 * cycles sized by current Sentiment." A cycle fires automatically every
 * cycleDays; the grant scales with Sentiment at that moment so the
 * Sentiment -> Budget ripple in the core loop is a real mechanic, not just
 * a milestone-reward side effect.
 */
export interface BudgetCycleDef {
  /** Sim-days between appropriation cycles. */
  cycleDays: number
  /** Guaranteed floor, regardless of Sentiment. */
  baseAppropriation: number
  /** Additional budget granted per point of Sentiment at cycle time. */
  budgetPerSentiment: number
}

export interface AppropriationEvent {
  day: number
  amount: number
  sentimentAtCycle: number
}

/**
 * Ongoing operations spend, per CLAUDE.md's "sliders that allow the ongoing
 * operations... budget to be managed." Each category is an independent
 * daily dial (0-100%) converting held Budget into steady growth of a
 * resource that has no other direct-purchase mechanic (unlike Materials,
 * which already have Procurement) — R&D, Crew Readiness, and Sentiment.
 */
export const OPS_CATEGORIES = ['research', 'training', 'publicAffairs'] as const
export type OpsCategory = (typeof OPS_CATEGORIES)[number]

export type OpsAllocation = Record<OpsCategory, number>

export interface OpsCategoryDef {
  id: OpsCategory
  label: string
  description: string
  /** Budget spent per day at 100% allocation. */
  maxDailyCost: number
  /** Resource gained per day at 100% allocation. */
  dailyEffect: ResourceDelta
  /** One-time discrete purchase, separate from the ongoing daily dial. */
  surgeCost: number
  surgeEffect: ResourceDelta
}

export interface DecisionOption {
  id: string
  label: string
  description: string
  effects: ResourceDelta
}

/** Which desk a card is tagged to in the status menu — future home for map/building grouping. */
export const CARD_DEPARTMENTS = ['press', 'astronaut-corps', 'infrastructure', 'budget', 'personnel'] as const
export type CardDepartment = (typeof CARD_DEPARTMENTS)[number]

export interface DecisionCardDef {
  id: string
  title: string
  description: string
  severity: Severity
  /** Which site this item is tagged to in the status menu (MVP has one). */
  site: string
  /** Which desk handles this — groups the status menu and will map to buildings later. */
  department: CardDepartment
  /** Earliest sim day this card is eligible to be drawn. */
  availableFromDay: number
  /** Minimum sim-days after resolution before this card can be drawn again. */
  cooldownDays: number
  /**
   * If set, an unanswered card auto-resolves via onExpireOptionId after this
   * many days — some administrative business doesn't wait. Omit for a card
   * that can sit in the queue indefinitely.
   */
  deadlineDays?: number
  /** Required alongside deadlineDays: which option id applies automatically on expiry. */
  onExpireOptionId?: string
  options: DecisionOption[]
}

export interface ActiveCard {
  cardId: string
  drawnOnDay: number
}

export const ASTRONAUT_SKILLS = ['piloting', 'engineering', 'eva', 'science', 'command', 'public'] as const
export type AstronautSkill = (typeof ASTRONAUT_SKILLS)[number]

export type AstronautSkills = Record<AstronautSkill, number>

export type AstronautStatus = 'active' | 'reserve' | 'deceased'

export interface AstronautDef {
  id: string
  /** Last-names-only roster, per CLAUDE.md's dossier/personnel-file tone. */
  lastName: string
  skills: AstronautSkills
}

export interface Astronaut extends AstronautDef {
  status: AstronautStatus
}

export interface RosterState {
  astronauts: Astronaut[]
  /** Cap on how many can hold 'active' status at once; the rest sit in Reserve. */
  activeCap: number
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
  /** The active-roster astronaut crewing this mission. */
  astronautId: string
  stage: LaunchStage
  weather: WeatherCheck | null
  stations: GoNoGoStatus[]
  outcome: 'success' | 'failure' | 'scrubbed' | null
  /** Set once an outcome is resolved, if the assigned astronaut was lost. */
  astronautLost: boolean
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
  /** Must be resolved (succeeded) before this mission can be attempted. */
  prerequisiteMissionId?: string
  /** An infrastructure-tech node that must be researched before this mission can be attempted. */
  requiredTechId?: string
}

export interface MilestoneState {
  missionId: string
  resolved: boolean
  succeeded: boolean | null
}

export type TourType = 'public' | 'vip'

export interface TourDef {
  type: TourType
  name: string
  description: string
  /** Deducted from resources on hosting — a negative delta. */
  cost: ResourceDelta
  /** Minimum sim-days between hostings of this tour type. */
  cooldownDays: number
  sentimentGain: number
  mishapChance: number
  mishapSentimentPenalty: number
  /** VIP only: chance of an extra budget windfall on a clean success. */
  bonusBudgetChance?: number
  bonusBudgetAmount?: number
  successFlavor: string[]
  mishapFlavor: string[]
}

export interface TourOutcome {
  type: TourType
  day: number
  mishap: boolean
  text: string
  bonusBudget: boolean
}

export interface TechNodeDef {
  id: string
  name: string
  description: string
  category: 'knowledge' | 'infrastructure'
  /** Deducted from resources up front, when research begins — a negative delta. */
  cost: ResourceDelta
  /** Sim-days the R&D Lab spends on this node after cost is paid, before it unlocks. */
  researchDays: number
  /** Another tech node that must already be researched, e.g. Exotic Propulsion requiring the R&D Lab tier. */
  requiresTechId?: string
  /** Applied alongside the unlock when research completes — e.g. Exotic Propulsion's inherent Sentiment tax. */
  bonusEffect?: ResourceDelta
}

/**
 * The R&D Lab works one project at a time — cost is paid up front, then the
 * node unlocks researchDays later. Per CLAUDE.md's "tech tree to have a time
 * element needed to unlock after purchasing with R&D."
 */
export interface ActiveResearch {
  techId: string
  startedOnDay: number
  completesOnDay: number
}

export interface GameState {
  day: number
  speed: ClockSpeed
  /** True only during a launch's go/no-go window — the one hard pause. */
  isHardPaused: boolean
  resources: ResourceState
  facility: FacilityState
  /** Parts accrued passively but not yet collected into `resources.parts`. */
  pendingParts: number
  /** Fuel accrued passively but not yet collected into `resources.fuel`. */
  pendingFuel: number
  /** R&D accrued passively but not yet collected into `resources.rd`. */
  pendingRD: number
  /** Ids of researched knowledge-tech nodes. */
  unlockedTech: string[]
  /** The one tech node currently being researched, if any — the R&D Lab has a single project slot. */
  activeResearch: ActiveResearch | null
  activeCards: ActiveCard[]
  /** Maps card id to the sim day it was last resolved, for cooldown-based redraws. */
  resolvedCards: Record<string, number>
  launch: LaunchSequenceState | null
  headlines: Headline[]
  /** Keyed by mission id — one entry per mission in content.milestones. */
  milestones: Record<string, MilestoneState>
  roster: RosterState
  /** Sim day each tour type was last hosted, for cooldown gating. */
  lastTourDay: Partial<Record<TourType, number>>
  lastTourOutcome: TourOutcome | null
  /** Most recent card that expired unanswered and auto-resolved. */
  lastExpiredCard: ExpiredCard | null
  /** Sim day the last appropriation cycle fired, for the countdown display. */
  lastBudgetCycleDay: number
  /** Most recent appropriation cycle's grant, for UI feedback. */
  lastAppropriation: AppropriationEvent | null
  /** Player-set daily spend (0-100%) per ops category. */
  opsAllocation: OpsAllocation
}

export interface ExpiredCard {
  cardId: string
  day: number
  optionId: string
}

export type GameAction =
  | { type: 'SET_SPEED'; speed: ClockSpeed }
  | { type: 'TICK' }
  | { type: 'COLLECT_PARTS' }
  | { type: 'COLLECT_FUEL' }
  | { type: 'COLLECT_RD' }
  | { type: 'PROCURE_MATERIAL'; materialType: MaterialType }
  | { type: 'SET_OPS_ALLOCATION'; category: OpsCategory; amount: number }
  | { type: 'SURGE_OPS'; category: OpsCategory }
  | { type: 'RESEARCH_TECH'; techId: string }
  | { type: 'RESOLVE_CARD'; cardId: string; optionId: string }
  | { type: 'START_LAUNCH'; missionId: string; astronautId: string }
  | { type: 'RUN_WEATHER_CHECK' }
  | { type: 'SCRUB_LAUNCH' }
  | { type: 'PROCEED_TO_GO_NO_GO' }
  | { type: 'OVERRIDE_STATION'; stationId: string }
  | { type: 'COMMIT_LAUNCH' }
  | { type: 'ACKNOWLEDGE_OUTCOME' }
  | { type: 'PROMOTE_ASTRONAUT'; astronautId: string }
  | { type: 'DEMOTE_ASTRONAUT'; astronautId: string }
  | { type: 'HOST_TOUR'; tourType: TourType }

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
  /** Ordered chain of missions; a mission with a prerequisiteMissionId unlocks after it. */
  milestones: MilestoneMissionDef[]
  techTree: TechNodeDef[]
  tours: TourDef[]
  procurement: ProcurementDef[]
  budgetCycle: BudgetCycleDef
  opsCategories: OpsCategoryDef[]
  facility: FacilityState
  startingResources: ResourceState
  astronautPool: AstronautDef[]
  /** Ids from astronautPool that start on active duty (rest start in Reserve). */
  initialActiveIds: string[]
  activeRosterCap: number
}
