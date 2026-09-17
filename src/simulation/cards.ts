import type { DecisionCardDef } from './types'

export function pickEligibleCard(
  day: number,
  cardPool: DecisionCardDef[],
  activeCardIds: string[],
  resolvedCardIds: string[],
  rng: () => number,
): DecisionCardDef | null {
  const eligible = cardPool.filter(
    (card) =>
      card.availableFromDay <= day &&
      !activeCardIds.includes(card.id) &&
      !resolvedCardIds.includes(card.id),
  )
  if (eligible.length === 0) return null
  return eligible[Math.floor(rng() * eligible.length)]
}

export function findOption(card: DecisionCardDef, optionId: string) {
  const option = card.options.find((o) => o.id === optionId)
  if (!option) throw new Error(`Unknown option "${optionId}" for card "${card.id}"`)
  return option
}
