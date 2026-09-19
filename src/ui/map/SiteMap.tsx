import { BUILDINGS, CARD_POOL, MAP_HEIGHT, MAP_WIDTH, TECH_TREE } from '../../content'
import type { BuildingDef, BuildingId } from '../../content'
import type { CardDepartment, GameState } from '../../simulation'
import { useGame } from '../useGame'
import { BuildingArt } from './BuildingArt'

type Activity = 'researching' | 'building' | null

/** Which buildings are visibly at work, derived from the two project lanes. */
function activityFor(building: BuildingDef, state: GameState): Activity {
  if (building.id === 'rd-lab' && state.activeResearch) return 'researching'
  const project = state.activeConstruction
  if (!project) return null
  const node = TECH_TREE.find((t) => t.id === project.techId)
  if (!node) return null
  if (building.upgradeTechIds?.includes(node.id)) return 'building'
  if (building.id === 'security' && node.category === 'security') return 'building'
  if (building.id === 'fabrication' && node.category === 'fabrication') return 'building'
  return null
}

function flaggedCountsByDepartment(state: GameState): Partial<Record<CardDepartment, number>> {
  const counts: Partial<Record<CardDepartment, number>> = {}
  for (const active of state.activeCards) {
    const def = CARD_POOL.find((c) => c.id === active.cardId)
    if (def?.severity !== 'flag') continue
    counts[def.department] = (counts[def.department] ?? 0) + 1
  }
  return counts
}

interface SiteMapProps {
  selectedId: BuildingId | null
  onSelect: (id: BuildingId) => void
}

export function SiteMap({ selectedId, onSelect }: SiteMapProps) {
  const { state } = useGame()
  const badges = flaggedCountsByDepartment(state)

  return (
    <svg
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      className="block h-auto w-full select-none"
      role="group"
      aria-label="Site map"
    >
      <defs>
        <pattern id="sa-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#111a2e" strokeWidth="1" />
        </pattern>
      </defs>

      <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="#0b1220" />
      <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#sa-grid)" />

      {/* Roads: two east-west site roads and the crawlerway from the VAB to the pad. */}
      <rect x={0} y={112} width={MAP_WIDTH} height={14} fill="#1e293b" />
      <rect x={0} y={240} width={MAP_WIDTH} height={14} fill="#1e293b" />
      <rect x={0} y={372} width={MAP_WIDTH} height={14} fill="#1e293b" />
      <line x1={0} y1={119} x2={MAP_WIDTH} y2={119} stroke="#334155" strokeWidth={1} strokeDasharray="8 8" />
      <line x1={0} y1={247} x2={MAP_WIDTH} y2={247} stroke="#334155" strokeWidth={1} strokeDasharray="8 8" />
      <line x1={0} y1={379} x2={MAP_WIDTH} y2={379} stroke="#334155" strokeWidth={1} strokeDasharray="8 8" />
      <rect x={242} y={462} width={30} height={22} fill="#27303f" />
      <line x1={242} y1={473} x2={272} y2={473} stroke="#475569" strokeWidth={1} strokeDasharray="3 3" />

      {/* Shoreline — the pads sit on the coast. */}
      <rect x={MAP_WIDTH - 8} y={380} width={8} height={MAP_HEIGHT - 380} fill="#0c4a6e" opacity={0.7} />

      {BUILDINGS.map((building) => (
        <BuildingNode
          key={building.id}
          building={building}
          selected={selectedId === building.id}
          activity={activityFor(building, state)}
          upgraded={!!building.upgradeTechIds?.some((id) => state.unlockedTech.includes(id))}
          badge={building.department ? (badges[building.department] ?? 0) : 0}
          onSelect={() => onSelect(building.id)}
        />
      ))}
    </svg>
  )
}

interface BuildingNodeProps {
  building: BuildingDef
  selected: boolean
  activity: Activity
  upgraded: boolean
  badge: number
  onSelect: () => void
}

function BuildingNode({ building, selected, activity, upgraded, badge, onSelect }: BuildingNodeProps) {
  const { x, y, w, h } = building
  const accent = activity === 'researching' ? '#38bdf8' : '#f59e0b'

  return (
    <g
      transform={`translate(${x} ${y})`}
      role="button"
      tabIndex={0}
      aria-label={`${building.name}${badge > 0 ? `, ${badge} flagged` : ''}`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      className="cursor-pointer outline-none"
    >
      {activity && (
        <rect x={-5} y={-5} width={w + 10} height={h + 10} rx={6} fill={accent} opacity={0.2} className="sa-glow" />
      )}

      {/* Sparse sprites (the pad apron, the depot's gaps) need a full-box hit target, label included. */}
      <rect x={-4} y={-4} width={w + 8} height={h + 20} fill="transparent" />

      <BuildingArt kind={building.kind} w={w} h={h} upgraded={upgraded} />

      {activity && (
        <rect
          x={-3}
          y={-3}
          width={w + 6}
          height={h + 6}
          rx={5}
          fill="none"
          stroke={accent}
          strokeWidth={1.5}
          className="sa-work-ring"
        />
      )}
      {selected && (
        <rect x={-4} y={-4} width={w + 8} height={h + 8} rx={6} fill="none" stroke="#e2e8f0" strokeWidth={1.5} />
      )}

      <text x={w / 2} y={h + 12} textAnchor="middle" fontSize={9} fill="#94a3b8" fontFamily="ui-sans-serif, system-ui">
        {building.label}
      </text>

      {badge > 0 && (
        <g transform={`translate(${w - 2} 2)`}>
          <circle r={8} fill="#f43f5e" stroke="#0b1220" strokeWidth={1.5} />
          <text textAnchor="middle" dy={3} fontSize={9} fontWeight={700} fill="#fff" fontFamily="ui-sans-serif, system-ui">
            {badge}
          </text>
        </g>
      )}
    </g>
  )
}
