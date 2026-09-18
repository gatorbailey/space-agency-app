import type { FacilityState, SiteWeatherProfile } from '../simulation'

/** MVP ships a single site — Cape Canaveral is the presumed default per CLAUDE.md. */
export const SITE_NAME = 'Cape Canaveral'

export const WEATHER_PROFILE: SiteWeatherProfile = {
  meanTempF: 68,
  stdDevTempF: 18,
  safeThresholdF: 40,
}

export const FACILITY: FacilityState = {
  partsPerDay: 8,
  partsStorageCap: 40,
  fuelPerDay: 6,
  fuelStorageCap: 30,
  rdPerDay: 3,
  rdStorageCap: 20,
}
