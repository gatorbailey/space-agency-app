import { useState } from 'react'
import { CARD_POOL } from '../../content'
import { useGame } from '../useGame'
import { FlaggedItems } from './FlaggedItems'

interface StatusMenuProps {
  onSelectCard: (cardId: string) => void
}

export function StatusMenu({ onSelectCard }: StatusMenuProps) {
  const { state } = useGame()
  const [open, setOpen] = useState(false)

  const flaggedCount = state.activeCards.filter(
    (active) => CARD_POOL.find((c) => c.id === active.cardId)?.severity === 'flag',
  ).length

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Status menu"
        className="relative rounded-full bg-slate-800 p-2 text-slate-300 transition hover:bg-slate-700"
      >
        <BellIcon />
        {flaggedCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white">
            {flaggedCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close status menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-20 cursor-default"
          />
          <div className="absolute top-full right-0 z-30 mt-2 w-80 rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
            <div className="border-b border-slate-800 px-3 py-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Flagged Items
            </div>
            <FlaggedItems
              onSelectCard={(cardId) => {
                onSelectCard(cardId)
                setOpen(false)
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}
