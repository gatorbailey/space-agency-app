import type { GoNoGoStationDef } from '../simulation'

/** Go/No-Go polling order for the MVP's simplified launch sequence. */
export const GO_NO_GO_STATIONS: GoNoGoStationDef[] = [
  { id: 'propulsion', name: 'Propulsion', officer: 'Dir. Kowalski' },
  { id: 'range-safety', name: 'Range Safety', officer: 'Col. Ashworth' },
  { id: 'weather', name: 'Weather', officer: 'Lt. Ferreira' },
  { id: 'flight-surgeon', name: 'Flight Surgeon', officer: 'Dr. Okonkwo' },
  { id: 'payload', name: 'Payload', officer: 'Eng. Whitfield' },
]
