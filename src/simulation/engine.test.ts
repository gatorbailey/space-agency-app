import { describe, expect, it } from 'vitest'
import { createInitialState, gameReducer } from './engine'
import type { GameContent } from './types'

function makeContent(overrides: Partial<GameContent> = {}): GameContent {
  return {
    cardPool: [
      {
        id: 'test-card',
        title: 'Test Card',
        description: 'A test card',
        severity: 'pause',
        availableFromDay: 0,
        cooldownDays: 5,
        options: [
          { id: 'a', label: 'A', description: '', effects: { sentiment: 5 } },
          { id: 'b', label: 'B', description: '', effects: { budget: -100 } },
        ],
      },
    ],
    stations: [
      { id: 'propulsion', name: 'Propulsion', officer: 'Dir. Test' },
      { id: 'weather', name: 'Weather', officer: 'Lt. Test' },
    ],
    weatherProfile: { meanTempF: 70, stdDevTempF: 10, safeThresholdF: 40 },
    milestone: {
      id: 'test-milestone',
      name: 'Test Milestone',
      description: 'A test milestone',
      plan: { payloadType: 'research', riskThreshold: 20 },
      cost: {},
      successEffects: { sentiment: 10 },
      failureEffects: { sentiment: -10 },
    },
    facility: { materialsPerDay: 5, materialsStorageCap: 20 },
    startingResources: { sentiment: 50, budget: 1000, materials: 10, crewReadiness: 70 },
    ...overrides,
  }
}

const alwaysGo: () => number = () => 0.99 // never below any no-go/failure threshold
const alwaysFail: () => number = () => 0.001 // always below thresholds -> no-go / failure

describe('clock', () => {
  it('does not advance while paused', () => {
    const content = makeContent()
    const state = createInitialState(content)
    const next = gameReducer(state, { type: 'TICK' }, content, alwaysGo)
    expect(next.day).toBe(0)
  })

  it('advances one day per TICK once running', () => {
    const content = makeContent()
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'SET_SPEED', speed: 'normal' }, content, alwaysGo)
    state = gameReducer(state, { type: 'TICK' }, content, alwaysGo)
    expect(state.day).toBe(1)
  })

  it('never advances during a hard pause', () => {
    const content = makeContent()
    let state = createInitialState(content)
    state = { ...state, isHardPaused: true, speed: 'normal' }
    state = gameReducer(state, { type: 'TICK' }, content, alwaysGo)
    expect(state.day).toBe(0)
  })
})

describe('materials accrual', () => {
  it('accrues into a pending buffer capped by facility storage, not into resources directly', () => {
    const content = makeContent()
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'SET_SPEED', speed: 'normal' }, content, alwaysGo)
    for (let i = 0; i < 10; i++) {
      state = gameReducer(state, { type: 'TICK' }, content, alwaysGo)
    }
    expect(state.pendingMaterials).toBe(20) // capped at materialsStorageCap
    expect(state.resources.materials).toBe(10) // unchanged until collected
  })

  it('COLLECT_MATERIALS moves the pending buffer into resources', () => {
    const content = makeContent()
    let state = createInitialState(content)
    state = { ...state, pendingMaterials: 15 }
    state = gameReducer(state, { type: 'COLLECT_MATERIALS' }, content, alwaysGo)
    expect(state.resources.materials).toBe(25)
    expect(state.pendingMaterials).toBe(0)
  })
})

describe('decision cards', () => {
  it('a drawn card pauses the flowing clock (MVP severity is always pause)', () => {
    const content = makeContent()
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'SET_SPEED', speed: 'normal' }, content, alwaysGo)
    // rng below CARD_DRAW_CHANCE_PER_DAY (0.35) so a card is drawn.
    state = gameReducer(state, { type: 'TICK' }, content, () => 0.01)
    expect(state.activeCards).toHaveLength(1)
    expect(state.speed).toBe('paused')
  })

  it('RESOLVE_CARD applies the chosen option effects and retires the card', () => {
    const content = makeContent()
    let state = createInitialState(content)
    state = { ...state, activeCards: [{ cardId: 'test-card', drawnOnDay: 0 }] }
    state = gameReducer(state, { type: 'RESOLVE_CARD', cardId: 'test-card', optionId: 'a' }, content, alwaysGo)
    expect(state.resources.sentiment).toBe(55)
    expect(state.activeCards).toHaveLength(0)
    expect(state.resolvedCards['test-card']).toBe(0)
  })

  it('does not redraw a resolved card until its cooldown elapses', () => {
    const content = makeContent()
    let state = createInitialState(content)
    state = { ...state, resolvedCards: { 'test-card': 0 } }
    state = gameReducer(state, { type: 'SET_SPEED', speed: 'normal' }, content, alwaysGo)

    // Days 1-4: still within the 5-day cooldown, so no draw even with a low rng.
    for (let i = 0; i < 4; i++) {
      state = gameReducer(state, { type: 'TICK' }, content, () => 0.01)
    }
    expect(state.activeCards).toHaveLength(0)

    // Day 5: cooldown has elapsed, so the card is eligible again.
    state = gameReducer(state, { type: 'TICK' }, content, () => 0.01)
    expect(state.activeCards).toHaveLength(1)
    expect(state.activeCards[0].cardId).toBe('test-card')
  })
})

describe('launch sequence', () => {
  it('runs weather -> go-no-go -> outcome and hard-pauses the clock throughout', () => {
    const content = makeContent()
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'START_LAUNCH', missionId: 'test-milestone' }, content, alwaysGo)
    expect(state.isHardPaused).toBe(true)
    expect(state.launch?.stage).toBe('weather')

    state = gameReducer(state, { type: 'RUN_WEATHER_CHECK' }, content, alwaysGo)
    expect(state.launch?.weather).not.toBeNull()

    state = gameReducer(state, { type: 'PROCEED_TO_GO_NO_GO' }, content, alwaysGo)
    expect(state.launch?.stage).toBe('go-no-go')
    expect(state.launch?.stations.every((s) => s.isGo)).toBe(true)

    state = gameReducer(state, { type: 'COMMIT_LAUNCH' }, content, alwaysGo)
    expect(state.launch?.stage).toBe('outcome')
    expect(state.launch?.outcome).toBe('success')
    expect(state.resources.sentiment).toBe(60)
    expect(state.milestone.resolved).toBe(true)
    expect(state.headlines).toHaveLength(2)

    state = gameReducer(state, { type: 'ACKNOWLEDGE_OUTCOME' }, content, alwaysGo)
    expect(state.isHardPaused).toBe(false)
    expect(state.launch).toBeNull()
  })

  it('blocks COMMIT_LAUNCH when a station is no-go and not overridden', () => {
    const content = makeContent()
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'START_LAUNCH', missionId: 'test-milestone' }, content, alwaysFail)
    state = gameReducer(state, { type: 'RUN_WEATHER_CHECK' }, content, alwaysFail)
    state = gameReducer(state, { type: 'PROCEED_TO_GO_NO_GO' }, content, alwaysFail)
    expect(state.launch?.stations.some((s) => !s.isGo)).toBe(true)

    const beforeCommit = state
    state = gameReducer(state, { type: 'COMMIT_LAUNCH' }, content, alwaysFail)
    expect(state.launch?.stage).toBe('go-no-go') // unchanged, commit was blocked
    expect(state).toBe(beforeCommit)
  })

  it('allows COMMIT_LAUNCH once every no-go station is overridden', () => {
    const content = makeContent()
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'START_LAUNCH', missionId: 'test-milestone' }, content, alwaysFail)
    state = gameReducer(state, { type: 'RUN_WEATHER_CHECK' }, content, alwaysFail)
    state = gameReducer(state, { type: 'PROCEED_TO_GO_NO_GO' }, content, alwaysFail)

    for (const station of state.launch!.stations) {
      if (!station.isGo) {
        state = gameReducer(state, { type: 'OVERRIDE_STATION', stationId: station.stationId }, content, alwaysFail)
      }
    }

    state = gameReducer(state, { type: 'COMMIT_LAUNCH' }, content, alwaysFail)
    expect(state.launch?.stage).toBe('outcome')
  })

  it('SCRUB_LAUNCH clears the launch and releases the hard pause at zero resource cost', () => {
    const content = makeContent()
    let state = createInitialState(content)
    const startingResources = state.resources
    state = gameReducer(state, { type: 'START_LAUNCH', missionId: 'test-milestone' }, content, alwaysGo)
    state = gameReducer(state, { type: 'SCRUB_LAUNCH' }, content, alwaysGo)
    expect(state.launch).toBeNull()
    expect(state.isHardPaused).toBe(false)
    expect(state.resources).toEqual(startingResources)
  })
})

describe('launch cost', () => {
  it('deducts the mission cost from resources on a successful commit', () => {
    const content = makeContent({
      milestone: {
        id: 'test-milestone',
        name: 'Test Milestone',
        description: 'A test milestone',
        plan: { payloadType: 'research', riskThreshold: 20 },
        cost: { budget: -500, materials: -5 },
        successEffects: { sentiment: 10 },
        failureEffects: { sentiment: -10 },
      },
    })
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'START_LAUNCH', missionId: 'test-milestone' }, content, alwaysGo)
    state = gameReducer(state, { type: 'RUN_WEATHER_CHECK' }, content, alwaysGo)
    state = gameReducer(state, { type: 'PROCEED_TO_GO_NO_GO' }, content, alwaysGo)
    state = gameReducer(state, { type: 'COMMIT_LAUNCH' }, content, alwaysGo)
    expect(state.resources.budget).toBe(500) // 1000 - 500
    expect(state.resources.materials).toBe(5) // 10 - 5
  })

  it('blocks COMMIT_LAUNCH when the mission cost cannot be afforded, leaving resources untouched', () => {
    const content = makeContent({
      startingResources: { sentiment: 50, budget: 100, materials: 10, crewReadiness: 70 },
      milestone: {
        id: 'test-milestone',
        name: 'Test Milestone',
        description: 'A test milestone',
        plan: { payloadType: 'research', riskThreshold: 20 },
        cost: { budget: -500 },
        successEffects: { sentiment: 10 },
        failureEffects: { sentiment: -10 },
      },
    })
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'START_LAUNCH', missionId: 'test-milestone' }, content, alwaysGo)
    state = gameReducer(state, { type: 'RUN_WEATHER_CHECK' }, content, alwaysGo)
    state = gameReducer(state, { type: 'PROCEED_TO_GO_NO_GO' }, content, alwaysGo)

    const beforeCommit = state
    state = gameReducer(state, { type: 'COMMIT_LAUNCH' }, content, alwaysGo)
    expect(state).toBe(beforeCommit) // unchanged, commit was blocked on affordability
    expect(state.launch?.stage).toBe('go-no-go')
  })
})
