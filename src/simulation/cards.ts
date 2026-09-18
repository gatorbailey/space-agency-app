import type { DecisionCardDef } from './types'

export function pickEligibleCard(
  day: number,
  cardPool: DecisionCardDef[],
  activeCardIds: string[],
  resolvedCards: Record<string, number>,
  rng: () => number,
): DecisionCardDef | null {
  const eligible = cardPool.filter((card) => {
    if (card.availableFromDay > day) return false
    if (activeCardIds.includes(card.id)) return false
    const lastResolvedDay = resolvedCards[card.id]
    if (lastResolvedDay === undefined) return true
    return day - lastResolvedDay >= card.cooldownDays
  })
  if (eligible.length === 0) return null
  return eligible[Math.floor(rng() * eligible.length)]
}

export function findOption(card: DecisionCardDef, optionId: string) {
  const option = card.options.find((o) => o.id === optionId)
  if (!option) throw new Error(`Unknown option "${optionId}" for card "${card.id}"`)
  return option
}
