import type { Headline } from './types'

export function generateHeadlines(
  missionId: string,
  missionName: string,
  outcome: 'success' | 'failure',
  day: number,
): Headline[] {
  const supporterText =
    outcome === 'success'
      ? `${missionName} SOARS: Daily Supporter hails "a new era of American triumph."`
      : `Daily Supporter: "${missionName} setback is a lesson learned, not a defeat."`
  const detractorText =
    outcome === 'success'
      ? `Detractor Weekly: "${missionName} success masks reckless spending."`
      : `Detractor Weekly: "${missionName} failure was entirely predictable."`

  return [
    { id: `${missionId}-${day}-supporter`, outlet: 'Daily Supporter', text: supporterText, day },
    { id: `${missionId}-${day}-detractor`, outlet: 'Detractor Weekly', text: detractorText, day },
  ]
}
