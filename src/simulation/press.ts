import type { Headline } from './types'

export function generateHeadlines(
  missionId: string,
  missionName: string,
  outcome: 'success' | 'failure',
  day: number,
  /** Count of headlines already recorded — keeps ids unique across repeat attempts on the same day. */
  sequence: number,
  /** Last name of the assigned astronaut, if the mission failure claimed them. */
  astronautLostLastName: string | null = null,
): Headline[] {
  const supporterText =
    outcome === 'success'
      ? `${missionName} SOARS: Daily Supporter hails "a new era of American triumph."`
      : astronautLostLastName
        ? `Daily Supporter: "The nation mourns ${astronautLostLastName}, lost in service to ${missionName}."`
        : `Daily Supporter: "${missionName} setback is a lesson learned, not a defeat."`
  const detractorText =
    outcome === 'success'
      ? `Detractor Weekly: "${missionName} success masks reckless spending."`
      : astronautLostLastName
        ? `Detractor Weekly: "${astronautLostLastName}'s death aboard ${missionName} was a preventable tragedy."`
        : `Detractor Weekly: "${missionName} failure was entirely predictable."`

  return [
    { id: `${missionId}-${day}-${sequence}-supporter`, outlet: 'Daily Supporter', text: supporterText, day },
    { id: `${missionId}-${day}-${sequence}-detractor`, outlet: 'Detractor Weekly', text: detractorText, day },
  ]
}
