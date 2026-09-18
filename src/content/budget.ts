import type { BudgetCycleDef } from '../simulation'

/**
 * A 45-day fiscal cycle. At Sentiment 50 (the starting value) this grants
 * $1,500 + 50*45 = $3,750 — roughly a Horizon-1-sized mission every cycle
 * at a middling approval rating, with high Sentiment meaningfully
 * accelerating the pace and a Sentiment collapse actually starving the
 * program, per CLAUDE.md's "Sentiment sets the ceiling on the next
 * appropriation" loop.
 */
export const BUDGET_CYCLE: BudgetCycleDef = {
  cycleDays: 45,
  baseAppropriation: 1500,
  budgetPerSentiment: 45,
}
