import type { GameState } from '../simulation'

const SAVE_KEY = 'space-agency:save'
const SAVE_VERSION = 3

interface SaveEnvelope {
  version: number
  state: GameState
}

export function saveGame(state: GameState): void {
  const envelope: SaveEnvelope = { version: SAVE_VERSION, state }
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(envelope))
  } catch {
    // Local-only MVP save; a quota/availability failure just means no save this tick.
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const envelope = JSON.parse(raw) as SaveEnvelope
    if (envelope.version !== SAVE_VERSION) return null
    return envelope.state
  } catch {
    return null
  }
}

export function clearSave(): void {
  try {
    window.localStorage.removeItem(SAVE_KEY)
  } catch {
    // Nothing to do if storage is unavailable.
  }
}
