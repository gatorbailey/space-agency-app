import type { TourDef } from '../simulation'

/**
 * Public tours are a steady, low-stakes Sentiment trickle. VIP tours swing
 * bigger both ways — occasionally the only way to land a mid-cycle budget
 * bump, per CLAUDE.md, at real mishap risk. Mishap flavor leans into the
 * game's sense of humor about bureaucratic reality.
 */
export const TOURS: TourDef[] = [
  {
    type: 'public',
    name: 'Public Tour',
    description: 'A guided walk-through for the general public. Low stakes, steady goodwill.',
    cost: {},
    cooldownDays: 10,
    sentimentGain: 3,
    mishapChance: 0.15,
    mishapSentimentPenalty: 2,
    successFlavor: [
      'A busload of schoolkids left convinced they’ll fly to Mars themselves.',
      'A local news crew got some good footage of the gantry.',
      'The tour group applauded politely at the mockup capsule.',
      'A retired engineer in the group asked sharper questions than most reporters do.',
    ],
    mishapFlavor: [
      'A visitor’s toddler pressed every button on a display console. It was unplugged.',
      'Someone in the group set off a motion sensor near the pad perimeter.',
      'A guest asked loudly why the rocket "isn’t more pointy." Morale: bruised.',
      'The tour bus got lost and arrived forty minutes late to its own tour.',
    ],
  },
  {
    type: 'vip',
    name: 'VIP Tour',
    description:
      'A hosted visit for donors, press, or Congress. Bigger Sentiment upside — and occasionally the only way to land a mid-cycle budget bump — but a real mishap risk.',
    cost: { budget: -1500 },
    cooldownDays: 25,
    sentimentGain: 9,
    mishapChance: 0.3,
    mishapSentimentPenalty: 6,
    bonusBudgetChance: 0.3,
    bonusBudgetAmount: 3000,
    successFlavor: [
      'The delegation left impressed — and one aide hinted at a supplemental appropriation.',
      'A Senator posed for photos by the capsule mockup. Great press.',
      'The VIP asked sharp, well-informed questions. A good sign.',
      'The visiting donor left, quietly, a very large check.',
    ],
    mishapFlavor: [
      'An aide spilled coffee across the console mid-briefing.',
      'A photographer’s flash tripped a false alarm in the clean room.',
      'The VIP asked to "push the big red button" and had to be gently redirected.',
      'The motorcade got the site address wrong and toured a fertilizer plant first.',
    ],
  },
]
