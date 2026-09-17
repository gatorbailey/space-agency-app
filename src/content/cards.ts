import type { DecisionCardDef } from '../simulation'

/**
 * Small hand-authored set of Mercury-era decision cards for the MVP.
 * Every card is severity 'pause' — MVP has no status-menu UI to flag softly.
 */
export const CARD_POOL: DecisionCardDef[] = [
  {
    id: 'congressional-hearing',
    title: 'Congressional Budget Hearing',
    description:
      'A subcommittee wants testimony on program spending before the next appropriation. How do you play it?',
    severity: 'pause',
    availableFromDay: 3,
    options: [
      {
        id: 'confident',
        label: 'Project confidence, ask for more',
        description: 'Sentiment rises with a bold pitch, but funds are held to the same target if you fall short.',
        effects: { sentiment: 4, budget: -1000 },
      },
      {
        id: 'cautious',
        label: 'Underpromise, protect the budget',
        description: 'A modest ask keeps the books safe but wins no headlines.',
        effects: { sentiment: -1, budget: 2000 },
      },
    ],
  },
  {
    id: 'contractor-delay',
    title: 'Contractor Delivery Delay',
    description: 'The booster fabrication contractor is behind schedule on a critical structural component.',
    severity: 'pause',
    availableFromDay: 6,
    options: [
      {
        id: 'expedite',
        label: 'Pay a rush premium',
        description: 'Spend funds to keep hardware stores on track.',
        effects: { budget: -1500, materials: 15 },
      },
      {
        id: 'wait',
        label: 'Absorb the delay',
        description: 'Save the money and take the hit to crew readiness from idle schedules.',
        effects: { crewReadiness: -5 },
      },
    ],
  },
  {
    id: 'press-exclusive',
    title: 'Life-Style Magazine Exclusive',
    description: 'A glossy national magazine wants exclusive access to the program for a feature spread.',
    severity: 'pause',
    availableFromDay: 10,
    options: [
      {
        id: 'grant-access',
        label: 'Grant full access',
        description: 'A generous Sentiment bump, at the cost of a distracted week for crew and staff.',
        effects: { sentiment: 6, crewReadiness: -3 },
      },
      {
        id: 'decline',
        label: 'Decline politely',
        description: 'Keep focus on the work. No swing either way.',
        effects: {},
      },
    ],
  },
  {
    id: 'public-tour-mishap',
    title: 'Public Tour Mishap',
    description: 'A visiting tour group wandered too close to the gantry. Someone spilled coffee on a console.',
    severity: 'pause',
    availableFromDay: 14,
    options: [
      {
        id: 'laugh-it-off',
        label: 'Laugh it off publicly',
        description: 'The self-deprecating angle plays well with the press.',
        effects: { sentiment: 2 },
      },
      {
        id: 'tighten-security',
        label: 'Tighten tour security',
        description: 'Spend a little to prevent a repeat; no immediate Sentiment change.',
        effects: { budget: -300 },
      },
    ],
  },
  {
    id: 'weather-delay-supplies',
    title: 'Barge Delayed by Weather',
    description: 'Rough seas held up the materials barge for three days.',
    severity: 'pause',
    availableFromDay: 18,
    options: [
      {
        id: 'air-freight',
        label: 'Air-freight the shortfall',
        description: 'Expensive, but keeps materials flowing.',
        effects: { budget: -800, materials: 10 },
      },
      {
        id: 'ride-it-out',
        label: 'Ride it out',
        description: 'No cost, but stores run thinner this week.',
        effects: { materials: -10 },
      },
    ],
  },
]
