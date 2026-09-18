import { findOption, pickEligibleCard } from './cards'
import { evaluateStation, resolveOutcome, rollWeather, wasAvoidableRisk } from './launch'
import { generateHeadlines } from './press'
import { applyDelta, canAfford } from './resources'
import { demoteAstronaut, findAstronaut, markDeceased, promoteAstronaut } from './roster'
import type { GameAction, GameContent, GameState, Rng, Severity } from './types'

const DEFAULT_RNG: Rng = Math.random

/** Chance per sim-day that an eligible decision card is drawn. */
const CARD_DRAW_CHANCE_PER_DAY = 0.35

/** Chance a failed launch costs the assigned astronaut their life. */
const RISKY_DEATH_CHANCE = 0.35
const SAFE_DEATH_CHANCE = 0.08

export function createInitialState(content: GameContent): GameState {
  return {
    day: 0,
    speed: 'paused',
    isHardPaused: false,
    resources: { ...content.startingResources },
    facility: { ...content.facility },
    pendingMaterials: 0,
    activeCards: [],
    resolvedCards: {},
    launch: null,
    headlines: [],
    milestone: { missionId: content.milestone.id, resolved: false, succeeded: null },
    roster: {
      activeCap: content.activeRosterCap,
      astronauts: content.astronautPool.map((def) => ({
        ...def,
        status: content.initialActiveIds.includes(def.id) ? 'active' : 'reserve',
      })),
    },
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
      const pendingMaterials = Math.min(
        state.facility.materialsStorageCap,
        state.pendingMaterials + state.facility.materialsPerDay,
      )

      let activeCards = state.activeCards
      let drawnCardSeverity: Severity | null = null
      if (rng() < CARD_DRAW_CHANCE_PER_DAY) {
        const card = pickEligibleCard(
          day,
          content.cardPool,
          activeCards.map((c) => c.cardId),
          state.resolvedCards,
          rng,
        )
        if (card) {
          activeCards = [...activeCards, { cardId: card.id, drawnOnDay: day }]
          drawnCardSeverity = card.severity
        }
      }

      return {
        ...state,
        day,
        pendingMaterials,
        activeCards,
        // 'flag' cards queue in the status menu without interrupting the
        // clock; only a 'pause' card (rare/urgent) stops time outright.
        speed: drawnCardSeverity === 'pause' ? 'paused' : state.speed,
      }
    }

    case 'COLLECT_MATERIALS': {
      if (state.pendingMaterials <= 0) return state
      return {
        ...state,
        resources: applyDelta(state.resources, { materials: state.pendingMaterials }),
        pendingMaterials: 0,
      }
    }

    case 'RESOLVE_CARD': {
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
      if (content.milestone.id !== action.missionId) return state
      if (state.milestone.resolved) return state
      const astronaut = findAstronaut(state.roster, action.astronautId)
      if (!astronaut || astronaut.status !== 'active') return state
      return {
        ...state,
        isHardPaused: true,
        speed: 'paused',
        launch: {
          missionId: content.milestone.id,
          plan: content.milestone.plan,
          astronautId: astronaut.id,
          stage: 'weather',
          weather: null,
          stations: [],
          outcome: null,
          astronautLost: false,
        },
      }
    }

    case 'RUN_WEATHER_CHECK': {
      if (!state.launch || state.launch.stage !== 'weather') return state
      const weather = rollWeather(content.weatherProfile, rng)
      return { ...state, launch: { ...state.launch, weather } }
    }

    case 'SCRUB_LAUNCH': {
      if (!state.launch) return state
      return { ...state, isHardPaused: false, launch: null }
    }

    case 'PROCEED_TO_GO_NO_GO': {
      const launch = state.launch
      if (!launch || launch.stage !== 'weather' || !launch.weather) return state
      const astronaut = findAstronaut(state.roster, launch.astronautId)
      if (!astronaut) return state
      const weather = launch.weather
      const stations = content.stations.map((def) =>
        evaluateStation(def, state, launch.plan, weather, rng, astronaut),
      )
      return { ...state, launch: { ...launch, stage: 'go-no-go', stations } }
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
      const mission = content.milestone
      if (!canAfford(state.resources, mission.cost)) return state
      const astronaut = findAstronaut(state.roster, launch.astronautId)
      if (!astronaut) return state

      const outcome = resolveOutcome(launch.weather, launch.stations, launch.plan, astronaut, rng)
      const effects = outcome === 'success' ? mission.successEffects : mission.failureEffects
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

      return {
        ...state,
        resources,
        roster,
        headlines: [...state.headlines, ...headlines],
        milestone:
          state.milestone.missionId === mission.id
            ? {
                ...state.milestone,
                resolved: outcome === 'success' ? true : state.milestone.resolved,
                succeeded: outcome === 'success',
              }
            : state.milestone,
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

    default:
      return state
  }
}
