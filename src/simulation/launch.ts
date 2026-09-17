import type {
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
  'flight-surgeon': (state, _plan, _weather, rng) => {
    const readiness = state.resources.crewReadiness
    const noGoChance = (100 - readiness) / 300
    const isGo = rng() > noGoChance
    return {
      isGo,
      reasoning: isGo
        ? 'Crew cleared medically for flight.'
        : 'Crew fatigue from a strained readiness cycle is a medical concern.',
    }
  },
  payload: (state, plan, _weather, rng) => {
    const cost = plan.payloadType === 'military' ? 40 : plan.payloadType === 'research' ? 25 : 15
    const isGo = state.resources.materials >= cost || rng() > 0.3
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
): GoNoGoStatus {
  const evaluate = STATION_EVALUATORS[def.id] ?? (() => ({ isGo: true, reasoning: 'Nominal.' }))
  const { isGo, reasoning } = evaluate(state, plan, weather, rng)
  return { stationId: def.id, isGo, reasoning, overridden: false }
}

export function resolveOutcome(
  weather: WeatherCheck,
  stations: GoNoGoStatus[],
  plan: LaunchPlan,
  rng: Rng,
): 'success' | 'failure' {
  let failureChance = 0.05
  if (!weather.isSafe) failureChance += 0.35
  const overriddenNoGos = stations.filter((s) => !s.isGo && s.overridden)
  failureChance += overriddenNoGos.length * 0.2
  failureChance += (plan.riskThreshold / 100) * 0.15
  failureChance = Math.min(0.9, failureChance)
  return rng() < failureChance ? 'failure' : 'success'
}
