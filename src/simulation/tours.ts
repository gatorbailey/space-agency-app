import type { Rng, TourDef, TourOutcome } from './types'

export function isTourOnCooldown(tourDef: TourDef, day: number, lastDay: number | undefined): boolean {
  return lastDay !== undefined && day - lastDay < tourDef.cooldownDays
}

function pickFlavor(pool: string[], rng: Rng): string {
  return pool[Math.floor(rng() * pool.length)]
}

export interface TourResult {
  resourceDelta: { sentiment: number; budget?: number }
  outcome: TourOutcome
}

export function resolveTour(tourDef: TourDef, day: number, rng: Rng): TourResult {
  const mishap = rng() < tourDef.mishapChance

  if (mishap) {
    return {
      resourceDelta: { sentiment: -tourDef.mishapSentimentPenalty },
      outcome: { type: tourDef.type, day, mishap: true, text: pickFlavor(tourDef.mishapFlavor, rng), bonusBudget: false },
    }
  }

  const bonusBudget = !!tourDef.bonusBudgetChance && rng() < tourDef.bonusBudgetChance
  return {
    resourceDelta: {
      sentiment: tourDef.sentimentGain,
      ...(bonusBudget ? { budget: tourDef.bonusBudgetAmount ?? 0 } : {}),
    },
    outcome: { type: tourDef.type, day, mishap: false, text: pickFlavor(tourDef.successFlavor, rng), bonusBudget },
  }
}
