import type { AstronautDef } from '../simulation'

/**
 * Hand-authored test-pilot recruiting pool for the MVP — last names only,
 * per CLAUDE.md's dossier tone. Later eras (scientist-astronauts, an
 * expanding pool) are Phase 2+ recruiting work, not built yet.
 */
export const ASTRONAUT_POOL: AstronautDef[] = [
  {
    id: 'voss',
    lastName: 'Voss',
    skills: { piloting: 90, engineering: 55, eva: 40, science: 30, command: 75, public: 60 },
  },
  {
    id: 'calder',
    lastName: 'Calder',
    skills: { piloting: 70, engineering: 60, eva: 35, science: 40, command: 85, public: 55 },
  },
  {
    id: 'marsh',
    lastName: 'Marsh',
    skills: { piloting: 65, engineering: 50, eva: 30, science: 35, command: 60, public: 85 },
  },
  {
    id: 'okafor',
    lastName: 'Okafor',
    skills: { piloting: 60, engineering: 85, eva: 45, science: 55, command: 50, public: 40 },
  },
  {
    id: 'delgado',
    lastName: 'Delgado',
    skills: { piloting: 80, engineering: 45, eva: 50, science: 25, command: 40, public: 50 },
  },
  {
    id: 'whitlock',
    lastName: 'Whitlock',
    skills: { piloting: 75, engineering: 65, eva: 40, science: 45, command: 70, public: 45 },
  },
  {
    id: 'sorensen',
    lastName: 'Sorensen',
    skills: { piloting: 55, engineering: 60, eva: 35, science: 70, command: 45, public: 35 },
  },
  {
    id: 'ibarra',
    lastName: 'Ibarra',
    skills: { piloting: 60, engineering: 70, eva: 65, science: 50, command: 40, public: 40 },
  },
]

export const INITIAL_ACTIVE_ASTRONAUT_IDS = ['voss', 'calder', 'marsh']

export const ACTIVE_ROSTER_CAP = 3
