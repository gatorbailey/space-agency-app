import type { BudgetCycleDef, GameState } from './types'

export function daysUntilBudgetCycle(state: Pick<GameState, 'day' | 'lastBudgetCycleDay'>, cycle: BudgetCycleDef): number {
  return Math.max(0, cycle.cycleDays - (state.day - state.lastBudgetCycleDay))
}

export function estimateAppropriation(sentiment: number, cycle: BudgetCycleDef): number {
  return Math.round(cycle.baseAppropriation + sentiment * cycle.budgetPerSentiment)
}
