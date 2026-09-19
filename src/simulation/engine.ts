import { estimateAppropriation } from './budget'
import { findOption, pickEligibleCard } from './cards'
import { evaluateStation, resolveOutcome, rollWeather, wasAvoidableRisk } from './launch'
import { generateHeadlines } from './press'
import { applyDelta, canAfford } from './resources'
import { demoteAstronaut, findAstronaut, markDeceased, promoteAstronaut } from './roster'
import { hasTech, laneForCategory, TECH_IDS } from './tech'
import { isTourOnCooldown, resolveTour } from './tours'
import { canProcure, procure } from './materials'
import { applyOpsEffect, dailyOpsCost, dailyOpsEffect } from './ops'
import { OPS_CATEGORIES } from './types'
import type { FacilityState, GameAction, GameContent, GameState, ResourceDelta, Rng, Severity } from './types'

const DEFAULT_RNG: Rng = Math.random

/** Chance per sim-day that an eligible decision card is drawn. */
const CARD_DRAW_CHANCE_PER_DAY = 0.35

/** Chance a failed launch costs the assigned astronaut their life. */
const RISKY_DEATH_CHANCE = 0.35
const SAFE_DEATH_CHANCE = 0.08

/** Materials Science adds this many Parts/day to the base facility rate. */
const MATERIALS_SCIENCE_BONUS = 4

/** R&D Lab Tier adds this many R&D/day to the base facility rate. */
const RD_LAB_TIER_BONUS = 5

/** Fueling Depot Tier adds this much to the Fuel storage cap. */
const FUELING_DEPOT_STORAGE_BONUS = 20

/** Life Support halves the crew-readiness penalty from a failed mission. */
const LIFE_SUPPORT_FAILURE_MULTIPLIER = 0.5

/** Fabrication Facility machinery, applied to the same facility rates Materials Processing and the lab use. */
const FAB_WELDING_PARTS_BONUS = 2
const FAB_PLASMA_FUEL_BONUS = 2
const FAB_MACHINE_SHOP_STORAGE_BONUS = 20
const FAB_CLEAN_ROOM_RD_BONUS = 2
const FAB_ROBOTICS_PARTS_BONUS = 3
const FAB_ROBOTICS_FUEL_BONUS = 1

/** The Assembly Line makes every later construction project finish faster. */
const ASSEMBLY_LINE_CONSTRUCTION_MULTIPLIER = 0.75

/** Sim-days the crawler spends on the crawlerway each way; Crawler Tier II halves it. */
const CRAWLER_BASE_TRANSIT_DAYS = 4
const CRAWLER_TIER_TRANSIT_MULTIPLIER = 0.5

function crawlerTransitDays(unlockedTech: string[]): number {
  const days = hasTech(unlockedTech, TECH_IDS.crawlerTier)
    ? CRAWLER_BASE_TRANSIT_DAYS * CRAWLER_TIER_TRANSIT_MULTIPLIER
    : CRAWLER_BASE_TRANSIT_DAYS
  return Math.max(1, Math.round(days))
}

/** Life Support halves the crew-readiness cost of a failed mission. */
function softenFailureEffects(effects: ResourceDelta, unlockedTech: string[]): ResourceDelta {
  if (!hasTech(unlockedTech, TECH_IDS.lifeSupport) || effects.crewReadiness === undefined) return effects
  return { ...effects, crewReadiness: Math.round(effects.crewReadiness * LIFE_SUPPORT_FAILURE_MULTIPLIER) }
}

/** Facility upgrades some tech nodes grant, applied once when the node completes. */
const FACILITY_BONUSES: Partial<Record<string, Partial<FacilityState>>> = {
  [TECH_IDS.materialsScience]: { partsPerDay: MATERIALS_SCIENCE_BONUS },
  [TECH_IDS.fuelingDepotTier]: { fuelStorageCap: FUELING_DEPOT_STORAGE_BONUS },
  [TECH_IDS.rdLabTier]: { rdPerDay: RD_LAB_TIER_BONUS },
  [TECH_IDS.fabWelding]: { partsPerDay: FAB_WELDING_PARTS_BONUS },
  [TECH_IDS.fabPlasmaWelding]: { fuelPerDay: FAB_PLASMA_FUEL_BONUS },
  [TECH_IDS.fabMachineShop]: { partsStorageCap: FAB_MACHINE_SHOP_STORAGE_BONUS },
  [TECH_IDS.fabCleanRoom]: { rdPerDay: FAB_CLEAN_ROOM_RD_BONUS },
  [TECH_IDS.fabRobotics]: { partsPerDay: FAB_ROBOTICS_PARTS_BONUS, fuelPerDay: FAB_ROBOTICS_FUEL_BONUS },
}

function applyFacilityBonus(facility: FacilityState, techId: string): FacilityState {
  const bonus = FACILITY_BONUSES[techId]
  if (!bonus) return facility
  const next = { ...facility }
  for (const key of Object.keys(bonus) as (keyof FacilityState)[]) {
    next[key] = facility[key] + (bonus[key] ?? 0)
  }
  return next
}

/** Applied when a research project completes, not when it starts — cost is already spent. */
function completeResearch(
  state: Pick<GameState, 'resources' | 'facility' | 'unlockedTech'>,
  node: { id: string; bonusEffect?: ResourceDelta },
): Pick<GameState, 'resources' | 'facility' | 'unlockedTech'> {
  return {
    resources: applyDelta(state.resources, node.bonusEffect ?? {}),
    facility: applyFacilityBonus(state.facility, node.id),
    unlockedTech: [...state.unlockedTech, node.id],
  }
}

export function createInitialState(content: GameContent): GameState {
  return {
    day: 0,
    speed: 'paused',
    isHardPaused: false,
    resources: { ...content.startingResources },
    facility: { ...content.facility },
    pendingParts: 0,
    pendingFuel: 0,
    pendingRD: 0,
    unlockedTech: [],
    activeResearch: null,
    activeConstruction: null,
    activeCards: [],
    resolvedCards: {},
    launch: null,
    headlines: [],
    milestones: Object.fromEntries(
      content.milestones.map((m) => [m.id, { missionId: m.id, resolved: false, succeeded: null }]),
    ),
    roster: {
      activeCap: content.activeRosterCap,
      astronauts: content.astronautPool.map((def) => ({
        ...def,
        status: content.initialActiveIds.includes(def.id) ? 'active' : 'reserve',
      })),
    },
    lastTourDay: {},
    lastTourOutcome: null,
    lastExpiredCard: null,
    lastBudgetCycleDay: 0,
    lastAppropriation: null,
    opsAllocation: Object.fromEntries(OPS_CATEGORIES.map((id) => [id, 0])) as GameState['opsAllocation'],
  }
}

export function gameReducer(
  state: GameState,
  action: GameAction,
  content: GameContent,
  rng: Rng = DEFAULT_RNG,
): GameState {
  switch (action.type) {
    case 'SET_SPEED': {
      if (state.isHardPaused) return state
      return { ...state, speed: action.speed }
    }

    case 'TICK': {
      if (state.isHardPaused || state.speed === 'paused') return state
      const day = state.day + 1
      const pendingParts = Math.min(state.facility.partsStorageCap, state.pendingParts + state.facility.partsPerDay)
      const pendingFuel = Math.min(state.facility.fuelStorageCap, state.pendingFuel + state.facility.fuelPerDay)
      let pendingRD = Math.min(state.facility.rdStorageCap, state.pendingRD + state.facility.rdPerDay)

      // Unanswered cards past their deadline auto-resolve via onExpireOptionId
      // — some administrative business doesn't wait for the player.
      let activeCards = state.activeCards
      let resolvedCards = state.resolvedCards
      let resources = state.resources
      let lastExpiredCard = state.lastExpiredCard
      for (const active of state.activeCards) {
        const card = content.cardPool.find((c) => c.id === active.cardId)
        if (!card || card.deadlineDays === undefined || card.onExpireOptionId === undefined) continue
        if (day - active.drawnOnDay < card.deadlineDays) continue
        const option = findOption(card, card.onExpireOptionId)
        resources = applyDelta(resources, option.effects)
        activeCards = activeCards.filter((c) => c.cardId !== active.cardId)
        resolvedCards = { ...resolvedCards, [active.cardId]: day }
        lastExpiredCard = { cardId: active.cardId, day, optionId: card.onExpireOptionId }
      }

      let drawnCardSeverity: Severity | null = null
      if (rng() < CARD_DRAW_CHANCE_PER_DAY) {
        const card = pickEligibleCard(
          day,
          content.cardPool,
          activeCards.map((c) => c.cardId),
          resolvedCards,
          rng,
        )
        if (card) {
          activeCards = [...activeCards, { cardId: card.id, drawnOnDay: day }]
          drawnCardSeverity = card.severity
        }
      }

      // Appropriation cycle: budget is granted automatically, sized by
      // Sentiment at that moment — the Sentiment -> Budget ripple from
      // CLAUDE.md's core resource web, not just a milestone reward.
      let lastBudgetCycleDay = state.lastBudgetCycleDay
      let lastAppropriation = state.lastAppropriation
      if (day - lastBudgetCycleDay >= content.budgetCycle.cycleDays) {
        const amount = estimateAppropriation(resources.sentiment, content.budgetCycle)
        resources = applyDelta(resources, { budget: amount })
        lastBudgetCycleDay = day
        lastAppropriation = { day, amount, sentimentAtCycle: resources.sentiment }
      }

      // Ongoing ops spend: each category is an independent daily dial the
      // player sets via SET_OPS_ALLOCATION. All-or-nothing per category per
      // day, same affordability gate as procurement/research — no partial
      // funding.
      let facility = state.facility
      for (const def of content.opsCategories) {
        const allocation = state.opsAllocation[def.id] ?? 0
        if (allocation <= 0) continue
        const cost = dailyOpsCost(def, allocation)
        if (cost > 0 && !canAfford(resources, { budget: -cost })) continue
        resources = applyDelta(resources, { budget: -cost })
        const applied = applyOpsEffect(resources, pendingRD, facility, dailyOpsEffect(def, allocation))
        resources = applied.resources
        pendingRD = applied.pendingRD
      }

      // Each lane (R&D Lab research, site construction crew) works one
      // project at a time; cost was paid when it began, so completion just
      // unlocks the node and applies its facility/bonus effects.
      let activeResearch = state.activeResearch
      let activeConstruction = state.activeConstruction
      let unlockedTech = state.unlockedTech
      for (const lane of ['research', 'construction'] as const) {
        const project = lane === 'research' ? activeResearch : activeConstruction
        if (!project || day < project.completesOnDay) continue
        const node = content.techTree.find((t) => t.id === project.techId)
        if (node) {
          const completed = completeResearch({ resources, facility, unlockedTech }, node)
          resources = completed.resources
          facility = completed.facility
          unlockedTech = completed.unlockedTech
        }
        if (lane === 'research') activeResearch = null
        else activeConstruction = null
      }

      // Crawler transit: rollout carries the vehicle to the pad before the
      // weather check; rollback (after a scrub) carries it back to the VAB
      // and closes the launch out, free to try again. Neither is hard-paused
      // — only PROCEED_TO_GO_NO_GO stops the clock.
      let launch = state.launch
      if (launch?.stage === 'rollout' && launch.transitCompletesOnDay !== null && day >= launch.transitCompletesOnDay) {
        launch = { ...launch, stage: 'weather', transitStartedOnDay: null, transitCompletesOnDay: null }
      } else if (
        launch?.stage === 'rollback' &&
        launch.transitCompletesOnDay !== null &&
        day >= launch.transitCompletesOnDay
      ) {
        launch = null
      }

      return {
        ...state,
        day,
        pendingParts,
        pendingFuel,
        pendingRD,
        activeCards,
        resolvedCards,
        resources,
        facility,
        activeResearch,
        activeConstruction,
        unlockedTech,
        launch,
        lastExpiredCard,
        lastBudgetCycleDay,
        lastAppropriation,
        // 'flag' cards queue in the status menu without interrupting the
        // clock; only a 'pause' card (rare/urgent) stops time outright.
        speed: drawnCardSeverity === 'pause' ? 'paused' : state.speed,
      }
    }

    case 'COLLECT_PARTS': {
      if (state.pendingParts <= 0) return state
      return {
        ...state,
        resources: applyDelta(state.resources, { parts: state.pendingParts }),
        pendingParts: 0,
      }
    }

    case 'COLLECT_FUEL': {
      if (state.pendingFuel <= 0) return state
      return {
        ...state,
        resources: applyDelta(state.resources, { fuel: state.pendingFuel }),
        pendingFuel: 0,
      }
    }

    case 'PROCURE_MATERIAL': {
      const def = content.procurement.find((p) => p.materialType === action.materialType)
      if (!def) return state
      if (!canProcure(state.resources, def)) return state
      return { ...state, resources: procure(state.resources, def) }
    }

    case 'SET_OPS_ALLOCATION': {
      const amount = Math.max(0, Math.min(100, action.amount))
      return { ...state, opsAllocation: { ...state.opsAllocation, [action.category]: amount } }
    }

    case 'SURGE_OPS': {
      const def = content.opsCategories.find((o) => o.id === action.category)
      if (!def) return state
      if (!canAfford(state.resources, { budget: -def.surgeCost })) return state
      const resources = applyDelta(state.resources, { budget: -def.surgeCost })
      const applied = applyOpsEffect(resources, state.pendingRD, state.facility, def.surgeEffect)
      return { ...state, resources: applied.resources, pendingRD: applied.pendingRD }
    }

    case 'COLLECT_RD': {
      if (state.pendingRD <= 0) return state
      return {
        ...state,
        resources: applyDelta(state.resources, { rd: state.pendingRD }),
        pendingRD: 0,
      }
    }

    case 'RESEARCH_TECH': {
      const node = content.techTree.find((t) => t.id === action.techId)
      if (!node) return state
      if (state.unlockedTech.includes(node.id)) return state
      const lane = laneForCategory(node.category)
      const slot = lane === 'research' ? state.activeResearch : state.activeConstruction
      if (slot) return state // each lane works one project at a time
      if (node.requiresTechId && !state.unlockedTech.includes(node.requiresTechId)) return state
      if (!canAfford(state.resources, node.cost)) return state
      const days =
        lane === 'construction' && hasTech(state.unlockedTech, TECH_IDS.fabAssemblyLine)
          ? Math.max(1, Math.round(node.researchDays * ASSEMBLY_LINE_CONSTRUCTION_MULTIPLIER))
          : node.researchDays
      const project = { techId: node.id, startedOnDay: state.day, completesOnDay: state.day + days }
      return {
        ...state,
        resources: applyDelta(state.resources, node.cost),
        ...(lane === 'research' ? { activeResearch: project } : { activeConstruction: project }),
      }
    }

    case 'RESOLVE_CARD': {
      // Guards against a stale modal: the clock keeps running for 'flag'
      // cards, so one can expire and auto-resolve while its detail view is
      // still open. Without this check, clicking an option there would
      // double-apply effects on top of the expiry outcome.
      if (!state.activeCards.some((c) => c.cardId === action.cardId)) return state
      const card = content.cardPool.find((c) => c.id === action.cardId)
      if (!card) return state
      const option = findOption(card, action.optionId)
      return {
        ...state,
        resources: applyDelta(state.resources, option.effects),
        activeCards: state.activeCards.filter((c) => c.cardId !== action.cardId),
        resolvedCards: { ...state.resolvedCards, [action.cardId]: state.day },
      }
    }

    case 'START_LAUNCH': {
      if (state.launch) return state
      const mission = content.milestones.find((m) => m.id === action.missionId)
      if (!mission) return state
      const progress = state.milestones[mission.id]
      if (!progress || progress.resolved) return state
      if (mission.prerequisiteMissionId) {
        const prereq = state.milestones[mission.prerequisiteMissionId]
        if (!prereq || !prereq.resolved) return state
      }
      if (mission.requiredTechId && !state.unlockedTech.includes(mission.requiredTechId)) return state
      const astronaut = findAstronaut(state.roster, action.astronautId)
      if (!astronaut || astronaut.status !== 'active') return state
      const transitDays = crawlerTransitDays(state.unlockedTech)
      return {
        ...state,
        // Rollout isn't the hard pause — the crawler moves while the clock
        // keeps running; per CLAUDE.md only go/no-go stops time outright.
        launch: {
          missionId: mission.id,
          plan: mission.plan,
          astronautId: astronaut.id,
          stage: 'rollout',
          weather: null,
          stations: [],
          outcome: null,
          astronautLost: false,
          transitStartedOnDay: state.day,
          transitCompletesOnDay: state.day + transitDays,
        },
      }
    }

    case 'RUN_WEATHER_CHECK': {
      if (!state.launch || state.launch.stage !== 'weather') return state
      const weather = rollWeather(content.weatherProfile, rng, state.unlockedTech)
      return { ...state, launch: { ...state.launch, weather } }
    }

    case 'SCRUB_LAUNCH': {
      // Only a vehicle already at the pad can scrub; rollout/rollback are
      // transit, not a decision point.
      if (!state.launch || (state.launch.stage !== 'weather' && state.launch.stage !== 'go-no-go')) return state
      const transitDays = crawlerTransitDays(state.unlockedTech)
      return {
        ...state,
        isHardPaused: false,
        launch: {
          ...state.launch,
          stage: 'rollback',
          transitStartedOnDay: state.day,
          transitCompletesOnDay: state.day + transitDays,
        },
      }
    }

    case 'PROCEED_TO_GO_NO_GO': {
      const launch = state.launch
      if (!launch || launch.stage !== 'weather' || !launch.weather) return state
      const astronaut = findAstronaut(state.roster, launch.astronautId)
      if (!astronaut) return state
      const weather = launch.weather
      const stations = content.stations.map((def) =>
        evaluateStation(def, state, launch.plan, weather, rng, astronaut, state.unlockedTech),
      )
      // The one hard pause, per CLAUDE.md: "a scheduled launch reaching its
      // go/no-go window ... time pressure must be real."
      return { ...state, isHardPaused: true, speed: 'paused', launch: { ...launch, stage: 'go-no-go', stations } }
    }

    case 'OVERRIDE_STATION': {
      if (!state.launch || state.launch.stage !== 'go-no-go') return state
      return {
        ...state,
        launch: {
          ...state.launch,
          stations: state.launch.stations.map((s) =>
            s.stationId === action.stationId ? { ...s, overridden: true } : s,
          ),
        },
      }
    }

    case 'COMMIT_LAUNCH': {
      const launch = state.launch
      if (!launch || launch.stage !== 'go-no-go' || !launch.weather) return state
      const blocked = launch.stations.some((s) => !s.isGo && !s.overridden)
      if (blocked) return state
      const mission = content.milestones.find((m) => m.id === launch.missionId)
      if (!mission) return state
      if (!canAfford(state.resources, mission.cost)) return state
      const astronaut = findAstronaut(state.roster, launch.astronautId)
      if (!astronaut) return state

      const outcome = resolveOutcome(launch.weather, launch.stations, launch.plan, astronaut, state.unlockedTech, rng)
      const effects =
        outcome === 'success'
          ? mission.successEffects
          : softenFailureEffects(mission.failureEffects, state.unlockedTech)
      const resources = applyDelta(applyDelta(state.resources, mission.cost), effects)

      let roster = state.roster
      let astronautLost = false
      if (outcome === 'failure') {
        const riskyLaunch = wasAvoidableRisk(launch.weather, launch.stations)
        const deathChance = riskyLaunch ? RISKY_DEATH_CHANCE : SAFE_DEATH_CHANCE
        if (rng() < deathChance) {
          astronautLost = true
          roster = markDeceased(state.roster, astronaut.id)
        }
      }

      const headlines = generateHeadlines(
        mission.id,
        mission.name,
        outcome,
        state.day,
        state.headlines.length,
        astronautLost ? astronaut.lastName : null,
      )

      const priorProgress = state.milestones[mission.id]
      return {
        ...state,
        resources,
        roster,
        headlines: [...state.headlines, ...headlines],
        milestones: {
          ...state.milestones,
          [mission.id]: {
            ...priorProgress,
            resolved: outcome === 'success' ? true : priorProgress.resolved,
            succeeded: outcome === 'success',
          },
        },
        launch: { ...launch, stage: 'outcome', outcome, astronautLost },
      }
    }

    case 'ACKNOWLEDGE_OUTCOME': {
      if (!state.launch || state.launch.stage !== 'outcome') return state
      return { ...state, isHardPaused: false, launch: null }
    }

    case 'PROMOTE_ASTRONAUT': {
      return { ...state, roster: promoteAstronaut(state.roster, action.astronautId) }
    }

    case 'DEMOTE_ASTRONAUT': {
      return { ...state, roster: demoteAstronaut(state.roster, action.astronautId) }
    }

    case 'HOST_TOUR': {
      const tourDef = content.tours.find((t) => t.type === action.tourType)
      if (!tourDef) return state
      if (isTourOnCooldown(tourDef, state.day, state.lastTourDay[tourDef.type])) return state
      if (!canAfford(state.resources, tourDef.cost)) return state

      const { resourceDelta, outcome } = resolveTour(tourDef, state.day, rng, state.unlockedTech)
      const resources = applyDelta(applyDelta(state.resources, tourDef.cost), resourceDelta)

      return {
        ...state,
        resources,
        lastTourDay: { ...state.lastTourDay, [tourDef.type]: state.day },
        lastTourOutcome: outcome,
      }
    }

    default:
      return state
  }
}
