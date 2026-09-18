import type { OpsCategoryDef } from '../simulation'

/**
 * Ongoing operations spend — converts held Budget into steady growth of
 * R&D, Crew Readiness, or Sentiment, the three resources with no existing
 * spend-for-a-batch mechanic (Materials already have Procurement). Each
 * category also has a discrete one-time "surge" purchase alongside its
 * daily dial, per CLAUDE.md's "one-time costs set in discrete ways."
 */
export const OPS_CATEGORY_DEFS: OpsCategoryDef[] = [
  {
    id: 'research',
    label: 'R&D Overtime',
    description: 'Extra lab shifts beyond the baseline research rate.',
    maxDailyCost: 60,
    dailyEffect: { rd: 3 },
    surgeCost: 800,
    surgeEffect: { rd: 15 },
  },
  {
    id: 'training',
    label: 'Crew Training',
    description: 'Additional simulator time and conditioning for the active roster.',
    maxDailyCost: 40,
    dailyEffect: { crewReadiness: 1.5 },
    surgeCost: 600,
    surgeEffect: { crewReadiness: 8 },
  },
  {
    id: 'publicAffairs',
    label: 'Public Affairs',
    description: 'Proactive media outreach beyond the regular press cycle.',
    maxDailyCost: 50,
    dailyEffect: { sentiment: 1 },
    surgeCost: 700,
    surgeEffect: { sentiment: 6 },
  },
]
