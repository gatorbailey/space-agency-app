import { describe, expect, it } from 'vitest'
import { createInitialState, gameReducer } from './engine'
import { TECH_IDS } from './tech'
import type { AstronautDef, DecisionCardDef, GameContent, TourDef } from './types'

const neutralSkills = { piloting: 50, engineering: 50, eva: 50, science: 50, command: 50, public: 50 }

const testAstronaut: AstronautDef = { id: 'test-astronaut', lastName: 'Test', skills: neutralSkills }
const reserveAstronaut: AstronautDef = { id: 'reserve-astronaut', lastName: 'Reserve', skills: neutralSkills }

const testCard: DecisionCardDef = {
  id: 'test-card',
  title: 'Test Card',
  description: 'A test card',
  severity: 'flag',
  site: 'Test Site',
  department: 'infrastructure',
  availableFromDay: 0,
  cooldownDays: 5,
  options: [
    { id: 'a', label: 'A', description: '', effects: { sentiment: 5 } },
    { id: 'b', label: 'B', description: '', effects: { budget: -100 } },
  ],
}

const urgentCard: DecisionCardDef = {
  id: 'urgent-card',
  title: 'Urgent Card',
  description: 'An urgent, pause-severity card',
  severity: 'pause',
  site: 'Test Site',
  department: 'infrastructure',
  availableFromDay: 0,
  cooldownDays: 5,
  options: [{ id: 'a', label: 'A', description: '', effects: { sentiment: 5 } }],
}

const deadlineCard: DecisionCardDef = {
  id: 'deadline-card',
  title: 'Deadline Card',
  description: 'A card with a deadline',
  severity: 'flag',
  site: 'Test Site',
  department: 'press',
  availableFromDay: 0,
  cooldownDays: 20,
  deadlineDays: 3,
  onExpireOptionId: 'default',
  options: [
    { id: 'respond', label: 'Respond', description: '', effects: { sentiment: 5 } },
    { id: 'default', label: 'Default', description: '', effects: { sentiment: -4 } },
  ],
}

function makeContent(overrides: Partial<GameContent> = {}): GameContent {
  return {
    cardPool: [testCard],
    stations: [
      { id: 'propulsion', name: 'Propulsion', officer: 'Dir. Test' },
      { id: 'weather', name: 'Weather', officer: 'Lt. Test' },
    ],
    weatherProfile: { meanTempF: 70, stdDevTempF: 10, safeThresholdF: 40 },
    milestones: [
      {
        id: 'test-milestone',
        name: 'Test Milestone',
        description: 'A test milestone',
        plan: { payloadType: 'research', riskThreshold: 20 },
        cost: {},
        successEffects: { sentiment: 10 },
        failureEffects: { sentiment: -10 },
      },
    ],
    techTree: [],
    tours: [],
    procurement: [
      { materialType: 'parts', budgetCost: 150, amount: 10 },
      { materialType: 'fuel', budgetCost: 120, amount: 10 },
      { materialType: 'payload', budgetCost: 300, amount: 5 },
      { materialType: 'safetyGear', budgetCost: 200, amount: 5 },
      { materialType: 'provisions', budgetCost: 100, amount: 10 },
    ],
    budgetCycle: { cycleDays: 5, baseAppropriation: 200, budgetPerSentiment: 2 },
    opsCategories: [
      { id: 'research', label: 'R&D Overtime', description: '', maxDailyCost: 60, dailyEffect: { rd: 3 }, surgeCost: 800, surgeEffect: { rd: 15 } },
      {
        id: 'training',
        label: 'Crew Training',
        description: '',
        maxDailyCost: 40,
        dailyEffect: { crewReadiness: 1.5 },
        surgeCost: 600,
        surgeEffect: { crewReadiness: 8 },
      },
      {
        id: 'publicAffairs',
        label: 'Public Affairs',
        description: '',
        maxDailyCost: 50,
        dailyEffect: { sentiment: 1 },
        surgeCost: 700,
        surgeEffect: { sentiment: 6 },
      },
    ],
    facility: { partsPerDay: 5, partsStorageCap: 20, fuelPerDay: 3, fuelStorageCap: 15, rdPerDay: 2, rdStorageCap: 10 },
    startingResources: {
      sentiment: 50,
      budget: 1000,
      crewReadiness: 70,
      rd: 0,
      parts: 10,
      fuel: 10,
      payload: 10,
      safetyGear: 10,
      provisions: 10,
    },
    astronautPool: [testAstronaut, reserveAstronaut],
    initialActiveIds: ['test-astronaut'],
    activeRosterCap: 1,
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
  it('Parts accrue into a pending buffer capped by facility storage, not into resources directly', () => {
    const content = makeContent()
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'SET_SPEED', speed: 'normal' }, content, alwaysGo)
    for (let i = 0; i < 10; i++) {
      state = gameReducer(state, { type: 'TICK' }, content, alwaysGo)
    }
    expect(state.pendingParts).toBe(20) // capped at partsStorageCap
    expect(state.resources.parts).toBe(10) // unchanged until collected
  })

  it('Fuel accrues into its own pending buffer the same way', () => {
    const content = makeContent()
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'SET_SPEED', speed: 'normal' }, content, alwaysGo)
    for (let i = 0; i < 10; i++) {
      state = gameReducer(state, { type: 'TICK' }, content, alwaysGo)
    }
    expect(state.pendingFuel).toBe(15) // capped at fuelStorageCap
    expect(state.resources.fuel).toBe(10) // unchanged until collected
  })

  it('COLLECT_PARTS moves the pending buffer into resources', () => {
    const content = makeContent()
    let state = createInitialState(content)
    state = { ...state, pendingParts: 15 }
    state = gameReducer(state, { type: 'COLLECT_PARTS' }, content, alwaysGo)
    expect(state.resources.parts).toBe(25)
    expect(state.pendingParts).toBe(0)
  })

  it('COLLECT_FUEL moves the pending buffer into resources', () => {
    const content = makeContent()
    let state = createInitialState(content)
    state = { ...state, pendingFuel: 8 }
    state = gameReducer(state, { type: 'COLLECT_FUEL' }, content, alwaysGo)
    expect(state.resources.fuel).toBe(18)
    expect(state.pendingFuel).toBe(0)
  })

  it('PROCURE_MATERIAL spends budget for an immediate batch of any material type', () => {
    const content = makeContent()
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'PROCURE_MATERIAL', materialType: 'payload' }, content, alwaysGo)
    expect(state.resources.payload).toBe(15) // 10 + 5
    expect(state.resources.budget).toBe(700) // 1000 - 300
  })

  it('PROCURE_MATERIAL is blocked when unaffordable, leaving state untouched', () => {
    const content = makeContent({
      startingResources: {
        sentiment: 50,
        budget: 50,
        crewReadiness: 70,
        rd: 0,
        parts: 10,
        fuel: 10,
        payload: 10,
        safetyGear: 10,
        provisions: 10,
      },
    })
    const state = createInitialState(content)
    const next = gameReducer(state, { type: 'PROCURE_MATERIAL', materialType: 'payload' }, content, alwaysGo)
    expect(next).toBe(state)
  })
})

describe('budget cycle', () => {
  it('does not grant an appropriation before cycleDays elapses', () => {
    const content = makeContent() // budgetCycle.cycleDays: 5
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'SET_SPEED', speed: 'normal' }, content, alwaysGo)
    for (let i = 0; i < 4; i++) {
      state = gameReducer(state, { type: 'TICK' }, content, alwaysGo)
    }
    expect(state.resources.budget).toBe(1000)
    expect(state.lastAppropriation).toBeNull()
  })

  it('grants an appropriation sized by Sentiment once cycleDays elapses', () => {
    const content = makeContent() // baseAppropriation: 200, budgetPerSentiment: 2, starting sentiment: 50
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'SET_SPEED', speed: 'normal' }, content, alwaysGo)
    for (let i = 0; i < 5; i++) {
      state = gameReducer(state, { type: 'TICK' }, content, alwaysGo)
    }
    expect(state.resources.budget).toBe(1300) // 1000 + (200 + 50*2)
    expect(state.lastBudgetCycleDay).toBe(5)
    expect(state.lastAppropriation).toEqual({ day: 5, amount: 300, sentimentAtCycle: 50 })
  })

  it('cycles again after another full interval', () => {
    const content = makeContent()
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'SET_SPEED', speed: 'normal' }, content, alwaysGo)
    for (let i = 0; i < 10; i++) {
      state = gameReducer(state, { type: 'TICK' }, content, alwaysGo)
    }
    expect(state.resources.budget).toBe(1600) // two grants of 300
    expect(state.lastBudgetCycleDay).toBe(10)
  })
})

describe('ops budget', () => {
  it('SET_OPS_ALLOCATION clamps to 0-100', () => {
    const content = makeContent()
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'SET_OPS_ALLOCATION', category: 'training', amount: 150 }, content, alwaysGo)
    expect(state.opsAllocation.training).toBe(100)
    state = gameReducer(state, { type: 'SET_OPS_ALLOCATION', category: 'training', amount: -20 }, content, alwaysGo)
    expect(state.opsAllocation.training).toBe(0)
  })

  it('spends the daily ops cost and applies a scaled direct effect each tick', () => {
    const content = makeContent()
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'SET_OPS_ALLOCATION', category: 'training', amount: 50 }, content, alwaysGo)
    state = gameReducer(state, { type: 'SET_SPEED', speed: 'normal' }, content, alwaysGo)
    state = gameReducer(state, { type: 'TICK' }, content, alwaysGo)
    expect(state.resources.budget).toBe(980) // 1000 - round(0.5 * 40)
    expect(state.resources.crewReadiness).toBe(70.75) // 70 + 1.5 * 0.5
  })

  it('routes a scaled R&D effect into the pending buffer, not straight into resources', () => {
    const content = makeContent()
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'SET_OPS_ALLOCATION', category: 'research', amount: 100 }, content, alwaysGo)
    state = gameReducer(state, { type: 'SET_SPEED', speed: 'normal' }, content, alwaysGo)
    state = gameReducer(state, { type: 'TICK' }, content, alwaysGo)
    expect(state.resources.budget).toBe(940) // 1000 - 60
    expect(state.pendingRD).toBe(5) // 2 passive + 3 from ops, both pre-collect
    expect(state.resources.rd).toBe(0)
  })

  it('skips funding for a day it cannot afford, leaving that category untouched', () => {
    const content = makeContent({
      startingResources: {
        sentiment: 50,
        budget: 10,
        crewReadiness: 70,
        rd: 0,
        parts: 10,
        fuel: 10,
        payload: 10,
        safetyGear: 10,
        provisions: 10,
      },
    })
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'SET_OPS_ALLOCATION', category: 'training', amount: 100 }, content, alwaysGo)
    state = gameReducer(state, { type: 'SET_SPEED', speed: 'normal' }, content, alwaysGo)
    state = gameReducer(state, { type: 'TICK' }, content, alwaysGo)
    expect(state.resources.budget).toBe(10)
    expect(state.resources.crewReadiness).toBe(70)
  })

  it('SURGE_OPS spends the lump cost for the immediate lump effect', () => {
    const content = makeContent()
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'SURGE_OPS', category: 'publicAffairs' }, content, alwaysGo)
    expect(state.resources.budget).toBe(300) // 1000 - 700
    expect(state.resources.sentiment).toBe(56) // 50 + 6
  })

  it('SURGE_OPS is blocked when unaffordable, leaving state untouched', () => {
    const content = makeContent()
    const state = createInitialState(content)
    const poor = { ...state, resources: { ...state.resources, budget: 50 } }
    const blocked = gameReducer(poor, { type: 'SURGE_OPS', category: 'research' }, content, alwaysGo) // surgeCost 800 > 50
    expect(blocked).toBe(poor)
  })
})

describe('decision cards', () => {
  it('a flagged card queues without pausing the flowing clock', () => {
    const content = makeContent() // cardPool is [testCard], severity 'flag'
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'SET_SPEED', speed: 'normal' }, content, alwaysGo)
    // rng below CARD_DRAW_CHANCE_PER_DAY (0.35) so a card is drawn.
    state = gameReducer(state, { type: 'TICK' }, content, () => 0.01)
    expect(state.activeCards).toHaveLength(1)
    expect(state.speed).toBe('normal')
  })

  it('an urgent (pause-severity) card stops the flowing clock', () => {
    const content = makeContent({ cardPool: [urgentCard] })
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'SET_SPEED', speed: 'normal' }, content, alwaysGo)
    state = gameReducer(state, { type: 'TICK' }, content, () => 0.01)
    expect(state.activeCards).toHaveLength(1)
    expect(state.speed).toBe('paused')
  })

  it('multiple flagged cards can stack simultaneously since the clock keeps running', () => {
    const content = makeContent({ cardPool: [testCard, { ...urgentCard, id: 'test-card-2', severity: 'flag' }] })
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'SET_SPEED', speed: 'normal' }, content, alwaysGo)
    state = gameReducer(state, { type: 'TICK' }, content, () => 0.01)
    state = gameReducer(state, { type: 'TICK' }, content, () => 0.01)
    expect(state.activeCards).toHaveLength(2)
    expect(state.speed).toBe('normal')
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

  it('RESOLVE_CARD is a no-op for a card that is not currently active', () => {
    const content = makeContent()
    const state = createInitialState(content) // activeCards is empty
    const next = gameReducer(state, { type: 'RESOLVE_CARD', cardId: 'test-card', optionId: 'a' }, content, alwaysGo)
    expect(next).toBe(state)
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
    state = gameReducer(state, { type: 'START_LAUNCH', missionId: 'test-milestone', astronautId: 'test-astronaut' }, content, alwaysGo)
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
    expect(state.milestones['test-milestone'].resolved).toBe(true)
    expect(state.headlines).toHaveLength(2)

    state = gameReducer(state, { type: 'ACKNOWLEDGE_OUTCOME' }, content, alwaysGo)
    expect(state.isHardPaused).toBe(false)
    expect(state.launch).toBeNull()
  })

  it('blocks COMMIT_LAUNCH when a station is no-go and not overridden', () => {
    const content = makeContent()
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'START_LAUNCH', missionId: 'test-milestone', astronautId: 'test-astronaut' }, content, alwaysFail)
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
    state = gameReducer(state, { type: 'START_LAUNCH', missionId: 'test-milestone', astronautId: 'test-astronaut' }, content, alwaysFail)
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
    state = gameReducer(state, { type: 'START_LAUNCH', missionId: 'test-milestone', astronautId: 'test-astronaut' }, content, alwaysGo)
    state = gameReducer(state, { type: 'SCRUB_LAUNCH' }, content, alwaysGo)
    expect(state.launch).toBeNull()
    expect(state.isHardPaused).toBe(false)
    expect(state.resources).toEqual(startingResources)
  })
})

describe('launch cost', () => {
  it('deducts the mission cost from resources on a successful commit', () => {
    const content = makeContent({
      milestones: [
        {
          id: 'test-milestone',
          name: 'Test Milestone',
          description: 'A test milestone',
          plan: { payloadType: 'research', riskThreshold: 20 },
          cost: { budget: -500, parts: -5 },
          successEffects: { sentiment: 10 },
          failureEffects: { sentiment: -10 },
        },
      ],
    })
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'START_LAUNCH', missionId: 'test-milestone', astronautId: 'test-astronaut' }, content, alwaysGo)
    state = gameReducer(state, { type: 'RUN_WEATHER_CHECK' }, content, alwaysGo)
    state = gameReducer(state, { type: 'PROCEED_TO_GO_NO_GO' }, content, alwaysGo)
    state = gameReducer(state, { type: 'COMMIT_LAUNCH' }, content, alwaysGo)
    expect(state.resources.budget).toBe(500) // 1000 - 500
    expect(state.resources.parts).toBe(5) // 10 - 5
  })

  it('blocks COMMIT_LAUNCH when the mission cost cannot be afforded, leaving resources untouched', () => {
    const content = makeContent({
      startingResources: {
        sentiment: 50,
        budget: 100,
        crewReadiness: 70,
        rd: 0,
        parts: 10,
        fuel: 10,
        payload: 10,
        safetyGear: 10,
        provisions: 10,
      },
      milestones: [
        {
          id: 'test-milestone',
          name: 'Test Milestone',
          description: 'A test milestone',
          plan: { payloadType: 'research', riskThreshold: 20 },
          cost: { budget: -500 },
          successEffects: { sentiment: 10 },
          failureEffects: { sentiment: -10 },
        },
      ],
    })
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'START_LAUNCH', missionId: 'test-milestone', astronautId: 'test-astronaut' }, content, alwaysGo)
    state = gameReducer(state, { type: 'RUN_WEATHER_CHECK' }, content, alwaysGo)
    state = gameReducer(state, { type: 'PROCEED_TO_GO_NO_GO' }, content, alwaysGo)

    const beforeCommit = state
    state = gameReducer(state, { type: 'COMMIT_LAUNCH' }, content, alwaysGo)
    expect(state).toBe(beforeCommit) // unchanged, commit was blocked on affordability
    expect(state.launch?.stage).toBe('go-no-go')
  })
})

describe('astronaut roster', () => {
  it('splits the pool into active and reserve per content, respecting the active cap', () => {
    const content = makeContent()
    const state = createInitialState(content)
    expect(state.roster.astronauts.find((a) => a.id === 'test-astronaut')?.status).toBe('active')
    expect(state.roster.astronauts.find((a) => a.id === 'reserve-astronaut')?.status).toBe('reserve')
    expect(state.roster.activeCap).toBe(1)
  })

  it('PROMOTE_ASTRONAUT moves a reserve astronaut to active when under cap', () => {
    const content = makeContent({ activeRosterCap: 2 })
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'PROMOTE_ASTRONAUT', astronautId: 'reserve-astronaut' }, content, alwaysGo)
    expect(state.roster.astronauts.find((a) => a.id === 'reserve-astronaut')?.status).toBe('active')
  })

  it('PROMOTE_ASTRONAUT is a no-op once the active cap is full', () => {
    const content = makeContent() // activeRosterCap: 1, already filled by test-astronaut
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'PROMOTE_ASTRONAUT', astronautId: 'reserve-astronaut' }, content, alwaysGo)
    expect(state.roster.astronauts.find((a) => a.id === 'reserve-astronaut')?.status).toBe('reserve')
  })

  it('DEMOTE_ASTRONAUT moves an active astronaut back to reserve', () => {
    const content = makeContent()
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'DEMOTE_ASTRONAUT', astronautId: 'test-astronaut' }, content, alwaysGo)
    expect(state.roster.astronauts.find((a) => a.id === 'test-astronaut')?.status).toBe('reserve')
  })

  it('START_LAUNCH refuses an astronaut who is not on active duty', () => {
    const content = makeContent()
    let state = createInitialState(content)
    state = gameReducer(
      state,
      { type: 'START_LAUNCH', missionId: 'test-milestone', astronautId: 'reserve-astronaut' },
      content,
      alwaysGo,
    )
    expect(state.launch).toBeNull()
  })

  it('a risky failure (overridden no-go) can cost the assigned astronaut their life', () => {
    const content = makeContent()
    let state = createInitialState(content)
    state = gameReducer(
      state,
      { type: 'START_LAUNCH', missionId: 'test-milestone', astronautId: 'test-astronaut' },
      content,
      alwaysFail,
    )
    state = gameReducer(state, { type: 'RUN_WEATHER_CHECK' }, content, alwaysFail)
    state = gameReducer(state, { type: 'PROCEED_TO_GO_NO_GO' }, content, alwaysFail)
    for (const station of state.launch!.stations) {
      if (!station.isGo) {
        state = gameReducer(state, { type: 'OVERRIDE_STATION', stationId: station.stationId }, content, alwaysFail)
      }
    }
    state = gameReducer(state, { type: 'COMMIT_LAUNCH' }, content, alwaysFail)
    expect(state.launch?.outcome).toBe('failure')
    expect(state.launch?.astronautLost).toBe(true)
    expect(state.roster.astronauts.find((a) => a.id === 'test-astronaut')?.status).toBe('deceased')
    expect(state.headlines.some((h) => h.text.includes('Test'))).toBe(true)
  })

  it('a clean success never touches the astronaut roster', () => {
    const content = makeContent()
    let state = createInitialState(content)
    state = gameReducer(
      state,
      { type: 'START_LAUNCH', missionId: 'test-milestone', astronautId: 'test-astronaut' },
      content,
      alwaysGo,
    )
    state = gameReducer(state, { type: 'RUN_WEATHER_CHECK' }, content, alwaysGo)
    state = gameReducer(state, { type: 'PROCEED_TO_GO_NO_GO' }, content, alwaysGo)
    state = gameReducer(state, { type: 'COMMIT_LAUNCH' }, content, alwaysGo)
    expect(state.launch?.outcome).toBe('success')
    expect(state.launch?.astronautLost).toBe(false)
    expect(state.roster.astronauts.find((a) => a.id === 'test-astronaut')?.status).toBe('active')
  })
})

describe('milestone chain', () => {
  const chainedContent = () =>
    makeContent({
      milestones: [
        {
          id: 'mission-a',
          name: 'Mission A',
          description: 'First in the chain',
          plan: { payloadType: 'research', riskThreshold: 20 },
          cost: {},
          successEffects: { sentiment: 5 },
          failureEffects: { sentiment: -5 },
        },
        {
          id: 'mission-b',
          name: 'Mission B',
          description: 'Second in the chain',
          plan: { payloadType: 'research', riskThreshold: 20 },
          cost: {},
          successEffects: { sentiment: 5 },
          failureEffects: { sentiment: -5 },
          prerequisiteMissionId: 'mission-a',
        },
      ],
    })

  it('refuses to start a mission whose prerequisite has not succeeded', () => {
    const content = chainedContent()
    let state = createInitialState(content)
    state = gameReducer(
      state,
      { type: 'START_LAUNCH', missionId: 'mission-b', astronautId: 'test-astronaut' },
      content,
      alwaysGo,
    )
    expect(state.launch).toBeNull()
  })

  it('unlocks the next mission once the prerequisite succeeds', () => {
    const content = chainedContent()
    let state = createInitialState(content)
    state = gameReducer(
      state,
      { type: 'START_LAUNCH', missionId: 'mission-a', astronautId: 'test-astronaut' },
      content,
      alwaysGo,
    )
    state = gameReducer(state, { type: 'RUN_WEATHER_CHECK' }, content, alwaysGo)
    state = gameReducer(state, { type: 'PROCEED_TO_GO_NO_GO' }, content, alwaysGo)
    state = gameReducer(state, { type: 'COMMIT_LAUNCH' }, content, alwaysGo)
    expect(state.milestones['mission-a'].resolved).toBe(true)
    state = gameReducer(state, { type: 'ACKNOWLEDGE_OUTCOME' }, content, alwaysGo)

    state = gameReducer(
      state,
      { type: 'START_LAUNCH', missionId: 'mission-b', astronautId: 'test-astronaut' },
      content,
      alwaysGo,
    )
    expect(state.launch?.missionId).toBe('mission-b')
  })

  it('refuses to restart a mission that has already succeeded', () => {
    const content = chainedContent()
    let state = createInitialState(content)
    state = gameReducer(
      state,
      { type: 'START_LAUNCH', missionId: 'mission-a', astronautId: 'test-astronaut' },
      content,
      alwaysGo,
    )
    state = gameReducer(state, { type: 'RUN_WEATHER_CHECK' }, content, alwaysGo)
    state = gameReducer(state, { type: 'PROCEED_TO_GO_NO_GO' }, content, alwaysGo)
    state = gameReducer(state, { type: 'COMMIT_LAUNCH' }, content, alwaysGo)
    state = gameReducer(state, { type: 'ACKNOWLEDGE_OUTCOME' }, content, alwaysGo)

    state = gameReducer(
      state,
      { type: 'START_LAUNCH', missionId: 'mission-a', astronautId: 'test-astronaut' },
      content,
      alwaysGo,
    )
    expect(state.launch).toBeNull()
  })
})

describe('tech tree', () => {
  it('accrues R&D into a pending buffer capped by facility storage', () => {
    const content = makeContent()
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'SET_SPEED', speed: 'normal' }, content, alwaysGo)
    for (let i = 0; i < 10; i++) {
      state = gameReducer(state, { type: 'TICK' }, content, alwaysGo)
    }
    expect(state.pendingRD).toBe(10) // rdPerDay 2 * 10 days, capped at rdStorageCap 10
    expect(state.resources.rd).toBe(0)
  })

  it('COLLECT_RD moves the pending buffer into resources', () => {
    const content = makeContent()
    let state = createInitialState(content)
    state = { ...state, pendingRD: 7 }
    state = gameReducer(state, { type: 'COLLECT_RD' }, content, alwaysGo)
    expect(state.resources.rd).toBe(7)
    expect(state.pendingRD).toBe(0)
  })

  it('RESEARCH_TECH unlocks a node and deducts its cost', () => {
    const content = makeContent({
      techTree: [{ id: 'test-tech', name: 'Test Tech', description: '', category: 'knowledge', cost: { rd: -20, budget: -500 } }],
    })
    let state = createInitialState(content)
    state = { ...state, resources: { ...state.resources, rd: 25 } }
    state = gameReducer(state, { type: 'RESEARCH_TECH', techId: 'test-tech' }, content, alwaysGo)
    expect(state.unlockedTech).toContain('test-tech')
    expect(state.resources.rd).toBe(5)
    expect(state.resources.budget).toBe(500) // 1000 - 500
  })

  it('RESEARCH_TECH is blocked when unaffordable, leaving state untouched', () => {
    const content = makeContent({
      techTree: [{ id: 'test-tech', name: 'Test Tech', description: '', category: 'knowledge', cost: { rd: -20 } }],
    })
    const state = createInitialState(content) // rd starts at 0
    const next = gameReducer(state, { type: 'RESEARCH_TECH', techId: 'test-tech' }, content, alwaysGo)
    expect(next).toBe(state)
    expect(next.unlockedTech).not.toContain('test-tech')
  })

  it('RESEARCH_TECH is a no-op once the node is already unlocked', () => {
    const content = makeContent({
      techTree: [{ id: 'test-tech', name: 'Test Tech', description: '', category: 'knowledge', cost: { rd: -5 } }],
    })
    let state = createInitialState(content)
    state = { ...state, resources: { ...state.resources, rd: 100 }, unlockedTech: ['test-tech'] }
    const next = gameReducer(state, { type: 'RESEARCH_TECH', techId: 'test-tech' }, content, alwaysGo)
    expect(next).toBe(state)
  })

  it('Materials Science raises the daily Parts accrual rate once researched', () => {
    const content = makeContent({
      techTree: [
        { id: TECH_IDS.materialsScience, name: 'Materials Science', description: '', category: 'knowledge', cost: {} },
      ],
    })
    let state = createInitialState(content)
    state = { ...state, resources: { ...state.resources, rd: 100, budget: 100000 } }
    state = gameReducer(state, { type: 'RESEARCH_TECH', techId: TECH_IDS.materialsScience }, content, alwaysGo)
    expect(state.facility.partsPerDay).toBe(9) // base 5/day + 4 bonus, applied once at research

    state = gameReducer(state, { type: 'SET_SPEED', speed: 'normal' }, content, alwaysGo)
    state = gameReducer(state, { type: 'TICK' }, content, alwaysGo)
    expect(state.pendingParts).toBe(9)
  })

  it('Life Support halves the crew-readiness penalty on a failed mission', () => {
    const content = makeContent({
      milestones: [
        {
          id: 'test-milestone',
          name: 'Test Milestone',
          description: 'A test milestone',
          plan: { payloadType: 'research', riskThreshold: 20 },
          cost: {},
          successEffects: { sentiment: 10 },
          failureEffects: { crewReadiness: -10 },
        },
      ],
    })
    let state = createInitialState(content)
    state = { ...state, unlockedTech: [TECH_IDS.lifeSupport] }
    state = gameReducer(
      state,
      { type: 'START_LAUNCH', missionId: 'test-milestone', astronautId: 'test-astronaut' },
      content,
      alwaysFail,
    )
    state = gameReducer(state, { type: 'RUN_WEATHER_CHECK' }, content, alwaysFail)
    state = gameReducer(state, { type: 'PROCEED_TO_GO_NO_GO' }, content, alwaysFail)
    for (const station of state.launch!.stations) {
      if (!station.isGo) {
        state = gameReducer(state, { type: 'OVERRIDE_STATION', stationId: station.stationId }, content, alwaysFail)
      }
    }
    state = gameReducer(state, { type: 'COMMIT_LAUNCH' }, content, alwaysFail)
    expect(state.launch?.outcome).toBe('failure')
    expect(state.resources.crewReadiness).toBe(65) // 70 - 5 (halved from -10)
  })

  it('Propulsion (Chemical) softens the risk-threshold contribution enough to flip a close outcome', () => {
    const content = makeContent({
      milestones: [
        {
          id: 'test-milestone',
          name: 'Test Milestone',
          description: 'A test milestone',
          plan: { payloadType: 'research', riskThreshold: 100 },
          cost: {},
          successEffects: { sentiment: 10 },
          failureEffects: { sentiment: -10 },
        },
      ],
    })
    const rng = () => 0.37

    function runToOutcome(unlockedTech: string[]) {
      let state = createInitialState(content)
      state = { ...state, unlockedTech }
      state = gameReducer(
        state,
        { type: 'START_LAUNCH', missionId: 'test-milestone', astronautId: 'test-astronaut' },
        content,
        rng,
      )
      state = gameReducer(state, { type: 'RUN_WEATHER_CHECK' }, content, rng)
      state = gameReducer(state, { type: 'PROCEED_TO_GO_NO_GO' }, content, rng)
      for (const station of state.launch!.stations) {
        if (!station.isGo) {
          state = gameReducer(state, { type: 'OVERRIDE_STATION', stationId: station.stationId }, content, rng)
        }
      }
      return gameReducer(state, { type: 'COMMIT_LAUNCH' }, content, rng)
    }

    expect(runToOutcome([]).launch?.outcome).toBe('failure')
    expect(runToOutcome([TECH_IDS.propulsionChemical]).launch?.outcome).toBe('success')
  })

  it('Avionics/Computing narrows the weather forecast’s swing from the mean', () => {
    const content = makeContent()
    const rngHigh = () => 0.99

    function rollWeatherWith(unlockedTech: string[]) {
      let state = createInitialState(content)
      state = { ...state, unlockedTech }
      state = gameReducer(
        state,
        { type: 'START_LAUNCH', missionId: 'test-milestone', astronautId: 'test-astronaut' },
        content,
        rngHigh,
      )
      state = gameReducer(state, { type: 'RUN_WEATHER_CHECK' }, content, rngHigh)
      return state.launch?.weather?.temperatureF ?? 0
    }

    const meanTemp = content.weatherProfile.meanTempF
    const deviationWithout = Math.abs(rollWeatherWith([]) - meanTemp)
    const deviationWith = Math.abs(rollWeatherWith([TECH_IDS.avionicsComputing]) - meanTemp)
    expect(deviationWith).toBeLessThan(deviationWithout)
  })
})

describe('infrastructure tech tree', () => {
  it('Fueling Depot Tier raises the fuel storage cap once researched', () => {
    const content = makeContent({
      techTree: [
        { id: TECH_IDS.fuelingDepotTier, name: 'Fueling Depot', description: '', category: 'infrastructure', cost: {} },
      ],
    })
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'RESEARCH_TECH', techId: TECH_IDS.fuelingDepotTier }, content, alwaysGo)
    expect(state.facility.fuelStorageCap).toBe(35) // base 15 + 20 bonus
  })

  it('R&D Lab Tier raises the R&D generation rate once researched', () => {
    const content = makeContent({
      techTree: [{ id: TECH_IDS.rdLabTier, name: 'R&D Lab', description: '', category: 'infrastructure', cost: {} }],
    })
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'RESEARCH_TECH', techId: TECH_IDS.rdLabTier }, content, alwaysGo)
    expect(state.facility.rdPerDay).toBe(7) // base 2 + 5 bonus
  })

  it('Exotic Propulsion is blocked until the R&D Lab tier is researched', () => {
    const content = makeContent({
      techTree: [
        { id: TECH_IDS.rdLabTier, name: 'R&D Lab', description: '', category: 'infrastructure', cost: {} },
        {
          id: TECH_IDS.propulsionExotic,
          name: 'Exotic',
          description: '',
          category: 'knowledge',
          cost: {},
          requiresTechId: TECH_IDS.rdLabTier,
          bonusEffect: { sentiment: -8 },
        },
      ],
    })
    const state = createInitialState(content)
    const next = gameReducer(state, { type: 'RESEARCH_TECH', techId: TECH_IDS.propulsionExotic }, content, alwaysGo)
    expect(next).toBe(state)
  })

  it('Exotic Propulsion unlocks once the R&D Lab tier is researched, applying its Sentiment tax', () => {
    const content = makeContent({
      techTree: [
        { id: TECH_IDS.rdLabTier, name: 'R&D Lab', description: '', category: 'infrastructure', cost: {} },
        {
          id: TECH_IDS.propulsionExotic,
          name: 'Exotic',
          description: '',
          category: 'knowledge',
          cost: {},
          requiresTechId: TECH_IDS.rdLabTier,
          bonusEffect: { sentiment: -8 },
        },
      ],
    })
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'RESEARCH_TECH', techId: TECH_IDS.rdLabTier }, content, alwaysGo)
    state = gameReducer(state, { type: 'RESEARCH_TECH', techId: TECH_IDS.propulsionExotic }, content, alwaysGo)
    expect(state.unlockedTech).toContain(TECH_IDS.propulsionExotic)
    expect(state.resources.sentiment).toBe(42) // 50 - 8
  })

  it('a mission with requiredTechId is blocked until that tech is researched', () => {
    const content = makeContent({
      milestones: [
        {
          id: 'test-milestone',
          name: 'Test',
          description: '',
          plan: { payloadType: 'research', riskThreshold: 20 },
          cost: {},
          successEffects: {},
          failureEffects: {},
          requiredTechId: TECH_IDS.vabTier,
        },
      ],
      techTree: [{ id: TECH_IDS.vabTier, name: 'VAB', description: '', category: 'infrastructure', cost: {} }],
    })
    let state = createInitialState(content)
    state = gameReducer(
      state,
      { type: 'START_LAUNCH', missionId: 'test-milestone', astronautId: 'test-astronaut' },
      content,
      alwaysGo,
    )
    expect(state.launch).toBeNull()

    state = gameReducer(state, { type: 'RESEARCH_TECH', techId: TECH_IDS.vabTier }, content, alwaysGo)
    state = gameReducer(
      state,
      { type: 'START_LAUNCH', missionId: 'test-milestone', astronautId: 'test-astronaut' },
      content,
      alwaysGo,
    )
    expect(state.launch?.missionId).toBe('test-milestone')
  })

  it('Pad Tier lowers the Propulsion station’s no-go odds', () => {
    const content = makeContent({
      milestones: [
        {
          id: 'test-milestone',
          name: 'Test',
          description: '',
          plan: { payloadType: 'research', riskThreshold: 100 },
          cost: {},
          successEffects: {},
          failureEffects: {},
        },
      ],
    })
    const rng = () => 0.3

    function propulsionIsGo(unlockedTech: string[]) {
      let state = createInitialState(content)
      state = { ...state, unlockedTech }
      state = gameReducer(
        state,
        { type: 'START_LAUNCH', missionId: 'test-milestone', astronautId: 'test-astronaut' },
        content,
        rng,
      )
      state = gameReducer(state, { type: 'RUN_WEATHER_CHECK' }, content, rng)
      state = gameReducer(state, { type: 'PROCEED_TO_GO_NO_GO' }, content, rng)
      return state.launch?.stations.find((s) => s.stationId === 'propulsion')?.isGo
    }

    expect(propulsionIsGo([])).toBe(false)
    expect(propulsionIsGo([TECH_IDS.padTier])).toBe(true)
  })

  it('Mission Control Tier lowers no-go odds for Range Safety (and Flight Surgeon / Payload)', () => {
    const content = makeContent({
      stations: [{ id: 'range-safety', name: 'Range Safety', officer: 'Col. Test' }],
    })
    const rng = () => 0.13

    function rangeSafetyIsGo(unlockedTech: string[]) {
      let state = createInitialState(content)
      state = { ...state, unlockedTech }
      state = gameReducer(
        state,
        { type: 'START_LAUNCH', missionId: 'test-milestone', astronautId: 'test-astronaut' },
        content,
        rng,
      )
      state = gameReducer(state, { type: 'RUN_WEATHER_CHECK' }, content, rng)
      state = gameReducer(state, { type: 'PROCEED_TO_GO_NO_GO' }, content, rng)
      return state.launch?.stations.find((s) => s.stationId === 'range-safety')?.isGo
    }

    expect(rangeSafetyIsGo([])).toBe(false)
    expect(rangeSafetyIsGo([TECH_IDS.missionControlTier])).toBe(true)
  })

  it('Crawler/Transporter Tier lowers the safe weather threshold', () => {
    const content = makeContent({
      weatherProfile: { meanTempF: 36, stdDevTempF: 10, safeThresholdF: 40 },
    })
    const rng = () => 0.45

    function checkWeather(unlockedTech: string[]) {
      let state = createInitialState(content)
      state = { ...state, unlockedTech }
      state = gameReducer(
        state,
        { type: 'START_LAUNCH', missionId: 'test-milestone', astronautId: 'test-astronaut' },
        content,
        rng,
      )
      state = gameReducer(state, { type: 'RUN_WEATHER_CHECK' }, content, rng)
      return state.launch?.weather
    }

    const without = checkWeather([])
    expect(without?.temperatureF).toBe(35)
    expect(without?.isSafe).toBe(false)

    const withCrawler = checkWeather([TECH_IDS.crawlerTier])
    expect(withCrawler?.thresholdF).toBe(32)
    expect(withCrawler?.isSafe).toBe(true)
  })

  it('Training Center Tier raises astronaut effective skills for evaluation', () => {
    const content = makeContent({
      stations: [{ id: 'flight-surgeon', name: 'Flight Surgeon', officer: 'Dr. Test' }],
    })
    const rng = () => 0.13

    function flightSurgeonIsGo(unlockedTech: string[]) {
      let state = createInitialState(content)
      state = { ...state, unlockedTech }
      state = gameReducer(
        state,
        { type: 'START_LAUNCH', missionId: 'test-milestone', astronautId: 'test-astronaut' },
        content,
        rng,
      )
      state = gameReducer(state, { type: 'RUN_WEATHER_CHECK' }, content, rng)
      state = gameReducer(state, { type: 'PROCEED_TO_GO_NO_GO' }, content, rng)
      return state.launch?.stations.find((s) => s.stationId === 'flight-surgeon')?.isGo
    }

    expect(flightSurgeonIsGo([])).toBe(false)
    expect(flightSurgeonIsGo([TECH_IDS.trainingCenterTier])).toBe(true)
  })
})

/** Returns queued values in order, repeating the last one once exhausted. */
function rngSequence(values: number[]): () => number {
  let i = 0
  return () => values[Math.min(i++, values.length - 1)]
}

describe('site tours', () => {
  const testTour: TourDef = {
    type: 'public',
    name: 'Test Public Tour',
    description: '',
    cost: {},
    cooldownDays: 10,
    sentimentGain: 3,
    mishapChance: 0.15,
    mishapSentimentPenalty: 2,
    successFlavor: ['Success flavor.'],
    mishapFlavor: ['Mishap flavor.'],
  }

  const testVipTour: TourDef = {
    type: 'vip',
    name: 'Test VIP Tour',
    description: '',
    cost: { budget: -1500 },
    cooldownDays: 25,
    sentimentGain: 9,
    mishapChance: 0.3,
    mishapSentimentPenalty: 6,
    bonusBudgetChance: 0.3,
    bonusBudgetAmount: 3000,
    successFlavor: ['VIP success.'],
    mishapFlavor: ['VIP mishap.'],
  }

  it('a clean success applies the sentiment gain and records the outcome', () => {
    const content = makeContent({ tours: [testTour] })
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'HOST_TOUR', tourType: 'public' }, content, alwaysGo)
    expect(state.resources.sentiment).toBe(53) // 50 + 3
    expect(state.lastTourOutcome?.mishap).toBe(false)
    expect(state.lastTourOutcome?.type).toBe('public')
    expect(state.lastTourDay.public).toBe(0)
  })

  it('a mishap applies the sentiment penalty instead', () => {
    const content = makeContent({ tours: [testTour] })
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'HOST_TOUR', tourType: 'public' }, content, alwaysFail)
    expect(state.resources.sentiment).toBe(48) // 50 - 2
    expect(state.lastTourOutcome?.mishap).toBe(true)
  })

  it('is blocked while on cooldown', () => {
    const content = makeContent({ tours: [testTour] })
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'HOST_TOUR', tourType: 'public' }, content, alwaysGo)
    const afterFirst = state
    state = gameReducer(state, { type: 'HOST_TOUR', tourType: 'public' }, content, alwaysGo)
    expect(state).toBe(afterFirst) // unchanged, still on cooldown at the same day
  })

  it('is available again once the cooldown elapses', () => {
    const content = makeContent({ tours: [testTour] })
    let state = createInitialState(content)
    state = gameReducer(state, { type: 'HOST_TOUR', tourType: 'public' }, content, alwaysGo)
    state = { ...state, day: state.day + testTour.cooldownDays }
    const before = state
    state = gameReducer(state, { type: 'HOST_TOUR', tourType: 'public' }, content, alwaysGo)
    expect(state).not.toBe(before)
    expect(state.lastTourDay.public).toBe(testTour.cooldownDays)
  })

  it('is blocked when the cost cannot be afforded', () => {
    const content = makeContent({
      tours: [testVipTour],
      startingResources: {
        sentiment: 50,
        budget: 100,
        crewReadiness: 70,
        rd: 0,
        parts: 10,
        fuel: 10,
        payload: 10,
        safetyGear: 10,
        provisions: 10,
      },
    })
    const state = createInitialState(content)
    const next = gameReducer(state, { type: 'HOST_TOUR', tourType: 'vip' }, content, alwaysGo)
    expect(next).toBe(state)
  })

  it('VIP tours can grant a bonus budget windfall on a clean success', () => {
    const content = makeContent({
      tours: [testVipTour],
      startingResources: {
        sentiment: 50,
        budget: 10000,
        crewReadiness: 70,
        rd: 0,
        parts: 10,
        fuel: 10,
        payload: 10,
        safetyGear: 10,
        provisions: 10,
      },
    })
    let state = createInitialState(content)
    // mishap check (0.5 < 0.3 false -> success), bonus check (0.1 < 0.3 true -> bonus), flavor pick
    state = gameReducer(state, { type: 'HOST_TOUR', tourType: 'vip' }, content, rngSequence([0.5, 0.1, 0]))
    expect(state.resources.budget).toBe(10000 - 1500 + 3000)
    expect(state.lastTourOutcome?.bonusBudget).toBe(true)
  })

  it('VIP tours do not grant the bonus when the roll misses it', () => {
    const content = makeContent({
      tours: [testVipTour],
      startingResources: {
        sentiment: 50,
        budget: 10000,
        crewReadiness: 70,
        rd: 0,
        parts: 10,
        fuel: 10,
        payload: 10,
        safetyGear: 10,
        provisions: 10,
      },
    })
    let state = createInitialState(content)
    // mishap check (0.5 < 0.3 false -> success), bonus check (0.5 < 0.3 false -> no bonus), flavor pick
    state = gameReducer(state, { type: 'HOST_TOUR', tourType: 'vip' }, content, rngSequence([0.5, 0.5, 0]))
    expect(state.resources.budget).toBe(10000 - 1500)
    expect(state.lastTourOutcome?.bonusBudget).toBe(false)
  })
})

describe('card deadlines', () => {
  it('an unanswered card past its deadline auto-resolves via onExpireOptionId', () => {
    const content = makeContent({ cardPool: [deadlineCard] })
    let state = createInitialState(content)
    state = { ...state, activeCards: [{ cardId: 'deadline-card', drawnOnDay: 0 }] }
    state = gameReducer(state, { type: 'SET_SPEED', speed: 'normal' }, content, alwaysGo)

    // Days 1-2: still within the 3-day deadline.
    for (let i = 0; i < 2; i++) {
      state = gameReducer(state, { type: 'TICK' }, content, alwaysGo)
    }
    expect(state.activeCards).toHaveLength(1)
    expect(state.lastExpiredCard).toBeNull()

    // Day 3: deadline reached, auto-resolves with the default option's effects.
    state = gameReducer(state, { type: 'TICK' }, content, alwaysGo)
    expect(state.activeCards).toHaveLength(0)
    expect(state.resources.sentiment).toBe(46) // 50 - 4
    expect(state.lastExpiredCard).toEqual({ cardId: 'deadline-card', day: 3, optionId: 'default' })
    expect(state.resolvedCards['deadline-card']).toBe(3)
  })

  it('a card with no deadlineDays never auto-expires', () => {
    const content = makeContent({ cardPool: [testCard] }) // testCard has no deadlineDays
    let state = createInitialState(content)
    state = { ...state, activeCards: [{ cardId: 'test-card', drawnOnDay: 0 }] }
    state = gameReducer(state, { type: 'SET_SPEED', speed: 'normal' }, content, alwaysGo)

    for (let i = 0; i < 30; i++) {
      state = gameReducer(state, { type: 'TICK' }, content, alwaysGo)
    }
    expect(state.activeCards.some((c) => c.cardId === 'test-card')).toBe(true)
    expect(state.lastExpiredCard).toBeNull()
  })
})
