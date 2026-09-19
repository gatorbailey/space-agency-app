import { useGame } from '../useGame'

export function HeadlineFeed({ limit = 6 }: { limit?: number }) {
  const { state } = useGame()
  if (state.headlines.length === 0) return null

  return (
    <div className="border-t border-slate-800 bg-slate-900 px-4 py-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Press</h3>
      <ul className="mt-2 flex flex-col gap-1.5">
        {[...state.headlines]
          .reverse()
          .slice(0, limit)
          .map((headline) => (
            <li key={headline.id} className="text-sm text-slate-300">
              <span
                className={
                  headline.outlet === 'Daily Supporter'
                    ? 'font-semibold text-emerald-400'
                    : 'font-semibold text-rose-400'
                }
              >
                {headline.outlet}:
              </span>{' '}
              {headline.text}
            </li>
          ))}
      </ul>
    </div>
  )
}
