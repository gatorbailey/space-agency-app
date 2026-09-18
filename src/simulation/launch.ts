import type {
  Astronaut,
  GameState,
  GoNoGoStationDef,
  GoNoGoStatus,
  LaunchPlan,
  Rng,
  SiteWeatherProfile,
  WeatherCheck,
} from './types'

export function rollWeather(profile: SiteWeatherProfile, rng: Rng): WeatherCheck {
  // Sum of three uniforms approximates a bell curve without extra deps.
  const noise = (rng() + rng() + rng() - 1.5) / 1.5
  const temperatureF = Math.round(profile.meanTempF + noise * profile.stdDevTempF)
  return {
    temperatureF,
    thresholdF: profile.safeThresholdF,
    isSafe: temperatureF >= profile.safeThresholdF,
  }
}

type StationEvaluator = (
  state: GameState,
  plan: LaunchPlan,
  weather: WeatherCheck,
  rng: Rng,
  astronaut: Astronaut,
) => { isGo: boolean; reasoning: string }

const STATION_EVALUATORS: Record<string, StationEvaluator> = {
  propulsion: (_state, plan, _weather, rng) => {
    const noGoChance = plan.riskThreshold / 250
    const isGo = rng() > noGoChance
    return {
      isGo,
      reasoning: isGo
        ? `Booster margins nominal at a risk setting of ${plan.riskThreshold}.`
        : `Cutting corners at a risk setting of ${plan.riskThreshold} leaves thin propulsion margins.`,
    }
  },
  'range-safety': (state, _plan, _weather, rng) => {
    const readiness = state.resources.crewReadiness
    const noGoChance = (100 - readiness) / 200
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
  'flight-surgeon': (state, _plan, _weather, rng, astronaut) => {
    // The flight surgeon clears the assigned crew member, not ground crew —
    // piloting skill stands in for flight experience/fitness here.
    const combined = (state.resources.crewReadiness + astronaut.skills.piloting) / 2
    const noGoChance = (100 - combined) / 300
    const isGo = rng() > noGoChance
    return {
      isGo,
      reasoning: isGo
        ? `${astronaut.lastName} cleared medically for flight.`
        : `${astronaut.lastName} shows fatigue from a strained readiness cycle — a medical concern.`,
    }
  },
  payload: (state, plan, _weather, rng, astronaut) => {
    const cost = plan.payloadType === 'military' ? 40 : plan.payloadType === 'research' ? 25 : 15
    // A strong engineering astronaut helps catch integration issues early.
    const engineeringBonus = astronaut.skills.engineering > 70 ? 0.1 : 0
    const isGo = state.resources.materials >= cost || rng() > 0.3 - engineeringBonus
    return {
      isGo,
      reasoning: isGo
        ? 'Payload integration complete and verified.'
        : 'Payload integration is behind schedule on hardware stores.',
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
): GoNoGoStatus {
  const evaluate = STATION_EVALUATORS[def.id] ?? (() => ({ isGo: true, reasoning: 'Nominal.' }))
  const { isGo, reasoning } = evaluate(state, plan, weather, rng, astronaut)
  return { stationId: def.id, isGo, reasoning, overridden: false }
}

export function resolveOutcome(
  weather: WeatherCheck,
  stations: GoNoGoStatus[],
  plan: LaunchPlan,
  astronaut: Astronaut,
  rng: Rng,
): 'success' | 'failure' {
  let failureChance = 0.05
  if (!weather.isSafe) failureChance += 0.35
  const overriddenNoGos = stations.filter((s) => !s.isGo && s.overridden)
  failureChance += overriddenNoGos.length * 0.2
  failureChance += (plan.riskThreshold / 100) * 0.15
  // A skilled, experienced commander shaves a little off the odds.
  failureChance -= ((astronaut.skills.command - 50) / 1000) * 2
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
