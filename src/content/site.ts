import type { FacilityState, SiteWeatherProfile } from '../simulation'

/** MVP ships a single site — Cape Canaveral is the presumed default per CLAUDE.md. */
export const SITE_NAME = 'Cape Canaveral'

export const WEATHER_PROFILE: SiteWeatherProfile = {
  meanTempF: 68,
  stdDevTempF: 18,
  safeThresholdF: 40,
}

export const FACILITY: FacilityState = {
  materialsPerDay: 8,
  materialsStorageCap: 40,
}
