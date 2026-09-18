import type { Astronaut, RosterState } from './types'

export function findAstronaut(roster: RosterState, astronautId: string): Astronaut | undefined {
  return roster.astronauts.find((a) => a.id === astronautId)
}

export function activeCount(roster: RosterState): number {
  return roster.astronauts.filter((a) => a.status === 'active').length
}

export function promoteAstronaut(roster: RosterState, astronautId: string): RosterState {
  const astronaut = findAstronaut(roster, astronautId)
  if (!astronaut || astronaut.status !== 'reserve') return roster
  if (activeCount(roster) >= roster.activeCap) return roster
  return {
    ...roster,
    astronauts: roster.astronauts.map((a) => (a.id === astronautId ? { ...a, status: 'active' } : a)),
  }
}

export function demoteAstronaut(roster: RosterState, astronautId: string): RosterState {
  const astronaut = findAstronaut(roster, astronautId)
  if (!astronaut || astronaut.status !== 'active') return roster
  return {
    ...roster,
    astronauts: roster.astronauts.map((a) => (a.id === astronautId ? { ...a, status: 'reserve' } : a)),
  }
}

export function markDeceased(roster: RosterState, astronautId: string): RosterState {
  return {
    ...roster,
    astronauts: roster.astronauts.map((a) => (a.id === astronautId ? { ...a, status: 'deceased' } : a)),
  }
}
