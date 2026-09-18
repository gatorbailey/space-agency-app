import { describe, expect, it } from 'vitest'
import { createInitialState, gameReducer } from './engine'
import { TECH_IDS } from './tech'
import type { AstronautDef, DecisionCardDef, GameContent } from './types'

const neutralSkills = { piloting: 50, engineering: 50, eva: 50, science: 50, command: 50, public: 50 }

const testAstronaut: AstronautDef = { id: 'test-astronaut', lastName: 'Test', skills: neutralSkills }
const reserveAstronaut: AstronautDef = { id: 'reserve-astronaut', lastName: 'Reserve', skills: neutralSkills }

const testCard: DecisionCardDef = {
  id: 'test-card',
  title: 'Test Card',
  description: 'A test card',
  severity: 'flag',
  site: 'Test Site',
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
  availableFromDay: 0,
  cooldownDays: 5,
  options: [{ id: 'a', label: 'A', description: '', effects: { sentiment: 5 } }],
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
    facility: { materialsPerDay: 5, materialsStorageCap: 20, rdPerDay: 2, rdStorageCap: 10 },
    startingResources: { sentiment: 50, budget: 1000, materials: 10, crewReadiness: 70, rd: 0 },
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
          cost: { budget: -500, materials: -5 },
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
    expect(state.resources.materials).toBe(5) // 10 - 5
  })

  it('blocks COMMIT_LAUNCH when the mission cost cannot be afforded, leaving resources untouched', () => {
    const content = makeContent({
      startingResources: { sentiment: 50, budget: 100, materials: 10, crewReadiness: 70, rd: 0 },
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
      techTree: [{ id: 'test-tech', name: 'Test Tech', description: '', cost: { rd: -20, budget: -500 } }],
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
      techTree: [{ id: 'test-tech', name: 'Test Tech', description: '', cost: { rd: -20 } }],
    })
    const state = createInitialState(content) // rd starts at 0
    const next = gameReducer(state, { type: 'RESEARCH_TECH', techId: 'test-tech' }, content, alwaysGo)
    expect(next).toBe(state)
    expect(next.unlockedTech).not.toContain('test-tech')
  })

  it('RESEARCH_TECH is a no-op once the node is already unlocked', () => {
    const content = makeContent({
      techTree: [{ id: 'test-tech', name: 'Test Tech', description: '', cost: { rd: -5 } }],
    })
    let state = createInitialState(content)
    state = { ...state, resources: { ...state.resources, rd: 100 }, unlockedTech: ['test-tech'] }
    const next = gameReducer(state, { type: 'RESEARCH_TECH', techId: 'test-tech' }, content, alwaysGo)
    expect(next).toBe(state)
  })

  it('Materials Science raises the daily materials accrual rate', () => {
    const content = makeContent()
    let state = createInitialState(content)
    state = { ...state, unlockedTech: [TECH_IDS.materialsScience] }
    state = gameReducer(state, { type: 'SET_SPEED', speed: 'normal' }, content, alwaysGo)
    state = gameReducer(state, { type: 'TICK' }, content, alwaysGo)
    expect(state.pendingMaterials).toBe(9) // base 5/day + 4 bonus
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
