import { hasTech, TECH_IDS } from './tech'
import type { Rng, TourDef, TourOutcome } from './types'

/** A patrol unit keeps visitors out of the places mishaps happen. */
const SECURITY_PATROLS_MISHAP_MULTIPLIER = 0.5

/** Patrol vehicles mean a faster response — a mishap that does happen does less damage. */
const SECURITY_VEHICLES_PENALTY_MULTIPLIER = 0.5

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

export function resolveTour(tourDef: TourDef, day: number, rng: Rng, unlockedTech: string[] = []): TourResult {
  const mishapChance = hasTech(unlockedTech, TECH_IDS.securityPatrols)
    ? tourDef.mishapChance * SECURITY_PATROLS_MISHAP_MULTIPLIER
    : tourDef.mishapChance
  const mishap = rng() < mishapChance

  if (mishap) {
    const penalty = hasTech(unlockedTech, TECH_IDS.securityVehicles)
      ? Math.round(tourDef.mishapSentimentPenalty * SECURITY_VEHICLES_PENALTY_MULTIPLIER)
      : tourDef.mishapSentimentPenalty
    return {
      resourceDelta: { sentiment: -penalty },
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
