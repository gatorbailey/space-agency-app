/**
 * Ids the Simulation Core keys mechanical effects off of — content must
 * define TechNodeDef entries with these exact ids for the effects below to
 * apply. Mirrors the existing pattern for go/no-go station ids in launch.ts.
 */
export const TECH_IDS = {
  propulsionChemical: 'propulsion-chemical',
  lifeSupport: 'life-support',
  materialsScience: 'materials-science',
  avionicsComputing: 'avionics-computing',
} as const

export function hasTech(unlockedTech: string[], id: string): boolean {
  return unlockedTech.includes(id)
}
