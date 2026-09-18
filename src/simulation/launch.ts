import { hasTech, TECH_IDS } from './tech'
import type {
  Astronaut,
  AstronautSkills,
  GameState,
  GoNoGoStationDef,
  GoNoGoStatus,
  LaunchPlan,
  Rng,
  SiteWeatherProfile,
  WeatherCheck,
} from './types'

/** Avionics/Computing narrows the weather forecast's error band. */
const AVIONICS_NOISE_MULTIPLIER = 0.5

/** Crawler/Transporter hardens ground equipment against cold, lowering the safe floor. */
const CRAWLER_THRESHOLD_REDUCTION_F = 8

/** Propulsion tiers soften how much a cut-corner risk setting hurts the odds; Exotic beats Chemical. */
const PROPULSION_CHEMICAL_RISK_MULTIPLIER = 0.6
const PROPULSION_EXOTIC_RISK_MULTIPLIER = 0.4

/** Pad Tier hardens the booster/pad interface specifically. */
const PAD_TIER_NO_GO_MULTIPLIER = 0.6

/** Mission Control's better ground monitoring trims no-go odds across the other stations. */
const MISSION_CONTROL_NO_GO_MULTIPLIER = 0.8

/** Training Center raises every active astronaut's effective skills for evaluation purposes. */
const TRAINING_CENTER_SKILL_BONUS = 5

export function rollWeather(profile: SiteWeatherProfile, rng: Rng, unlockedTech: string[]): WeatherCheck {
  // Sum of three uniforms approximates a bell curve without extra deps.
  const noise = (rng() + rng() + rng() - 1.5) / 1.5
  const stdDev = hasTech(unlockedTech, TECH_IDS.avionicsComputing)
    ? profile.stdDevTempF * AVIONICS_NOISE_MULTIPLIER
    : profile.stdDevTempF
  const thresholdF = hasTech(unlockedTech, TECH_IDS.crawlerTier)
    ? profile.safeThresholdF - CRAWLER_THRESHOLD_REDUCTION_F
    : profile.safeThresholdF
  const temperatureF = Math.round(profile.meanTempF + noise * stdDev)
  return {
    temperatureF,
    thresholdF,
    isSafe: temperatureF >= thresholdF,
  }
}

/** Training Center's flat skill bonus, applied at point-of-use rather than stored. */
function effectiveSkills(astronaut: Astronaut, unlockedTech: string[]): AstronautSkills {
  if (!hasTech(unlockedTech, TECH_IDS.trainingCenterTier)) return astronaut.skills
  const boosted = { ...astronaut.skills }
  for (const skill of Object.keys(boosted) as (keyof AstronautSkills)[]) {
    boosted[skill] = Math.min(100, boosted[skill] + TRAINING_CENTER_SKILL_BONUS)
  }
  return boosted
}

type StationEvaluator = (
  state: GameState,
  plan: LaunchPlan,
  weather: WeatherCheck,
  rng: Rng,
  astronaut: Astronaut,
  unlockedTech: string[],
) => { isGo: boolean; reasoning: string }

const STATION_EVALUATORS: Record<string, StationEvaluator> = {
  propulsion: (_state, plan, _weather, rng, _astronaut, unlockedTech) => {
    const multiplier = hasTech(unlockedTech, TECH_IDS.padTier) ? PAD_TIER_NO_GO_MULTIPLIER : 1
    const noGoChance = (plan.riskThreshold / 250) * multiplier
    const isGo = rng() > noGoChance
    return {
      isGo,
      reasoning: isGo
        ? `Booster margins nominal at a risk setting of ${plan.riskThreshold}.`
        : `Cutting corners at a risk setting of ${plan.riskThreshold} leaves thin propulsion margins.`,
    }
  },
  'range-safety': (state, _plan, _weather, rng, _astronaut, unlockedTech) => {
    const multiplier = hasTech(unlockedTech, TECH_IDS.missionControlTier) ? MISSION_CONTROL_NO_GO_MULTIPLIER : 1
    const readiness = state.resources.crewReadiness
    const noGoChance = ((100 - readiness) / 200) * multiplier
    const isGo = rng() > noGoChance
    return {
      isGo,
      reasoning: isGo
        ? 'Range and ground crew report standard readiness.'
        : `Ground crew readiness at ${Math.round(readiness)} is below comfortable range-safety margins.`,
    }
  },
  weather: (_state, _plan, weather) => ({
    isGo: weather.isSafe,
    reasoning: weather.isSafe
      ? `${weather.temperatureF}°F is comfortably above the ${weather.thresholdF}°F safety floor.`
      : `${weather.temperatureF}°F is below the ${weather.thresholdF}°F safety floor — cold-soak risk on seals.`,
  }),
  'flight-surgeon': (state, _plan, _weather, rng, astronaut, unlockedTech) => {
    const multiplier = hasTech(unlockedTech, TECH_IDS.missionControlTier) ? MISSION_CONTROL_NO_GO_MULTIPLIER : 1
    // The flight surgeon clears the assigned crew member, not ground crew —
    // piloting skill stands in for flight experience/fitness here.
    const piloting = effectiveSkills(astronaut, unlockedTech).piloting
    const combined = (state.resources.crewReadiness + piloting) / 2
    const noGoChance = ((100 - combined) / 300) * multiplier
    const isGo = rng() > noGoChance
    return {
      isGo,
      reasoning: isGo
        ? `${astronaut.lastName} cleared medically for flight.`
        : `${astronaut.lastName} shows fatigue from a strained readiness cycle — a medical concern.`,
    }
  },
  payload: (state, plan, _weather, rng, astronaut, unlockedTech) => {
    const multiplier = hasTech(unlockedTech, TECH_IDS.missionControlTier) ? MISSION_CONTROL_NO_GO_MULTIPLIER : 1
    const cost = plan.payloadType === 'military' ? 40 : plan.payloadType === 'research' ? 25 : 15
    // A strong engineering astronaut helps catch integration issues early.
    const engineering = effectiveSkills(astronaut, unlockedTech).engineering
    const engineeringBonus = engineering > 70 ? 0.1 : 0
    const isGo = state.resources.payload >= cost || rng() > (0.3 - engineeringBonus) * multiplier
    return {
      isGo,
      reasoning: isGo
        ? 'Payload integration complete and verified.'
        : 'Payload integration is behind schedule — not enough payload stock on hand.',
    }
  },
}

export function evaluateStation(
  def: GoNoGoStationDef,
  state: GameState,
  plan: LaunchPlan,
  weather: WeatherCheck,
  rng: Rng,
  astronaut: Astronaut,
  unlockedTech: string[],
): GoNoGoStatus {
  const evaluate = STATION_EVALUATORS[def.id] ?? (() => ({ isGo: true, reasoning: 'Nominal.' }))
  const { isGo, reasoning } = evaluate(state, plan, weather, rng, astronaut, unlockedTech)
  return { stationId: def.id, isGo, reasoning, overridden: false }
}

export function resolveOutcome(
  weather: WeatherCheck,
  stations: GoNoGoStatus[],
  plan: LaunchPlan,
  astronaut: Astronaut,
  unlockedTech: string[],
  rng: Rng,
): 'success' | 'failure' {
  let failureChance = 0.05
  if (!weather.isSafe) failureChance += 0.35
  const overriddenNoGos = stations.filter((s) => !s.isGo && s.overridden)
  failureChance += overriddenNoGos.length * 0.2
  const riskContribution = (plan.riskThreshold / 100) * 0.15
  const propulsionMultiplier = hasTech(unlockedTech, TECH_IDS.propulsionExotic)
    ? PROPULSION_EXOTIC_RISK_MULTIPLIER
    : hasTech(unlockedTech, TECH_IDS.propulsionChemical)
      ? PROPULSION_CHEMICAL_RISK_MULTIPLIER
      : 1
  failureChance += riskContribution * propulsionMultiplier
  // A skilled, experienced commander shaves a little off the odds.
  const command = effectiveSkills(astronaut, unlockedTech).command
  failureChance -= ((command - 50) / 1000) * 2
  failureChance = Math.min(0.9, Math.max(0.02, failureChance))
  return rng() < failureChance ? 'failure' : 'success'
}

/**
 * Whether a failed launch happened under conditions the player could have
 * avoided (an unsafe-weather launch, or an overridden no-go) — used to scale
 * the chance the assigned astronaut is lost, per CLAUDE.md: death is a real
 * outcome but disaster analogs should be avoidable via player choice.
 */
export function wasAvoidableRisk(weather: WeatherCheck, stations: GoNoGoStatus[]): boolean {
  return !weather.isSafe || stations.some((s) => s.overridden)
}
