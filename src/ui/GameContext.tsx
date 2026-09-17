import { useEffect, useReducer, type ReactNode } from 'react'
import { GAME_CONTENT } from '../content'
import { createInitialState, gameReducer } from '../simulation'
import type { GameAction, GameState } from '../simulation'
import { loadGame, saveGame } from '../save/localStorage'
import { GameContext } from './context'

const TICK_INTERVAL_MS: Record<string, number> = {
  normal: 2000,
  fast: 800,
  faster: 300,
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    (s: GameState, action: GameAction) => gameReducer(s, action, GAME_CONTENT),
    undefined,
    () => loadGame() ?? createInitialState(GAME_CONTENT),
  )

  useEffect(() => {
    const interval = TICK_INTERVAL_MS[state.speed]
    if (!interval) return
    const id = window.setInterval(() => dispatch({ type: 'TICK' }), interval)
    return () => window.clearInterval(id)
  }, [state.speed])

  useEffect(() => {
    saveGame(state)
  }, [state])

  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>
}
