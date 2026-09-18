import type { DecisionCardDef } from '../simulation'

/**
 * Hand-authored set of Mercury-era decision cards for the MVP. Every card is
 * severity 'pause' — MVP has no status-menu UI to flag softly. Cards recur
 * after `cooldownDays` so the pool doesn't run dry over a long campaign.
 */
export const CARD_POOL: DecisionCardDef[] = [
  {
    id: 'congressional-hearing',
    title: 'Congressional Budget Hearing',
    description:
      'A subcommittee wants testimony on program spending before the next appropriation. How do you play it?',
    severity: 'pause',
    availableFromDay: 3,
    cooldownDays: 30,
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
    cooldownDays: 25,
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
    cooldownDays: 25,
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
    cooldownDays: 20,
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
    cooldownDays: 22,
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
  {
    id: 'safety-inspection',
    title: 'Independent Safety Inspection',
    description: 'A review board has requested full access to inspect hardware and paperwork.',
    severity: 'pause',
    availableFromDay: 22,
    cooldownDays: 30,
    options: [
      {
        id: 'welcome-scrutiny',
        label: 'Welcome the scrutiny',
        description: 'Pay for the disruption, but a clean bill of health plays well publicly.',
        effects: { budget: -1200, sentiment: 3 },
      },
      {
        id: 'limit-access',
        label: 'Limit their access',
        description: 'Keeps costs down, but looks defensive if word gets out.',
        effects: { sentiment: -2 },
      },
    ],
  },
  {
    id: 'labor-dispute',
    title: 'Ground Crew Labor Dispute',
    description: 'Technicians and pad crew are pushing for better shift conditions ahead of a busy stretch.',
    severity: 'pause',
    availableFromDay: 26,
    cooldownDays: 35,
    options: [
      {
        id: 'meet-demands',
        label: 'Meet their demands',
        description: 'Costs money now, but crew morale and readiness improve.',
        effects: { budget: -1000, crewReadiness: 8 },
      },
      {
        id: 'hold-firm',
        label: 'Hold firm on the budget',
        description: 'Saves money, but morale and public sympathy both take a hit.',
        effects: { crewReadiness: -6, sentiment: -2 },
      },
    ],
  },
  {
    id: 'recruiting-drive',
    title: 'Recruiting Drive Funding',
    description: 'Personnel wants a bigger budget for the next round of ground-crew recruiting.',
    severity: 'pause',
    availableFromDay: 30,
    cooldownDays: 30,
    options: [
      {
        id: 'fund-it',
        label: 'Fund the expanded drive',
        description: 'Spend now to build a deeper bench of crew readiness.',
        effects: { budget: -900, crewReadiness: 6 },
      },
      {
        id: 'trim-it',
        label: 'Keep the drive modest',
        description: 'No cost, no gain — the bench stays thin.',
        effects: {},
      },
    ],
  },
  {
    id: 'surplus-parts',
    title: 'War-Surplus Parts Lot',
    description: 'A depot is auctioning off a lot of aerospace-grade surplus hardware.',
    severity: 'pause',
    availableFromDay: 34,
    cooldownDays: 28,
    options: [
      {
        id: 'buy-the-lot',
        label: 'Buy the whole lot',
        description: 'A good price on a bulk restock of materials.',
        effects: { budget: -600, materials: 20 },
      },
      {
        id: 'pass',
        label: 'Pass on it',
        description: 'No change either way.',
        effects: {},
      },
    ],
  },
  {
    id: 'dignitary-visit',
    title: 'Foreign Dignitary Visit',
    description: 'A visiting head of state has requested an unscheduled tour of the facility.',
    severity: 'pause',
    availableFromDay: 38,
    cooldownDays: 30,
    options: [
      {
        id: 'red-carpet',
        label: 'Roll out the red carpet',
        description: 'A real Sentiment win, at real expense.',
        effects: { budget: -1800, sentiment: 7 },
      },
      {
        id: 'standard-tour',
        label: 'Give the standard tour',
        description: 'Cheap and polite, with a smaller Sentiment bump.',
        effects: { sentiment: 2 },
      },
    ],
  },
  {
    id: 'editorial-cartoon',
    title: 'Unflattering Editorial Cartoon',
    description: 'A widely syndicated cartoon pokes fun at a recent delay.',
    severity: 'pause',
    availableFromDay: 42,
    cooldownDays: 24,
    options: [
      {
        id: 'respond-publicly',
        label: 'Respond with good humor',
        description: 'A gracious public response limits the damage.',
        effects: { sentiment: -1 },
      },
      {
        id: 'ignore-it',
        label: 'Ignore it',
        description: "Don't dignify it with a response, but the jab lands harder.",
        effects: { sentiment: -3 },
      },
    ],
  },
  {
    id: 'heatwave',
    title: 'Summer Heatwave',
    description: 'A prolonged heatwave is straining cooling systems and outdoor material stores.',
    severity: 'pause',
    availableFromDay: 46,
    cooldownDays: 26,
    options: [
      {
        id: 'extra-cooling',
        label: 'Run emergency cooling',
        description: 'Protects hardware stores at a real cost.',
        effects: { budget: -500 },
      },
      {
        id: 'risk-it',
        label: 'Risk it',
        description: 'Save the money; some stored materials spoil in the heat.',
        effects: { materials: -12 },
      },
    ],
  },
]
