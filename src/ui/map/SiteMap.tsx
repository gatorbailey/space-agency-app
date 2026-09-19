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

/**
 * The coastline: two independent curves, each built only from points whose
 * x stays within a fixed band — [20,70] on the west edge, [350,400] on the
 * east (viewBox is 420 wide). A quadratic Bezier never leaves the convex
 * hull of its control points, so every point on either curve is guaranteed
 * to land inside its band; that guarantee is what makes it safe to treat
 * x∈[85,335] as land for every y from 0 to MAP_HEIGHT when placing
 * buildings in content/buildings.ts, without computing a real point-in-
 * polygon test per building. The beach path is the same shape offset 12px
 * further out.
 */
const GRASS_LEFT = 'M 45,0 Q 25,120 50,220 Q 70,320 30,420 Q 20,520 55,620 Q 65,720 25,820 Q 20,900 50,1000 Q 60,1040 40,1060'
const GRASS_RIGHT_REV =
  'Q 365,1040 375,1000 Q 400,900 398,820 Q 355,720 365,620 Q 400,520 395,420 Q 355,320 370,220 Q 400,120 380,0'
const GRASS_PATH = `${GRASS_LEFT} L 385,1060 ${GRASS_RIGHT_REV} Z`

const BEACH_LEFT = 'M 33,0 Q 13,120 38,220 Q 58,320 18,420 Q 8,520 43,620 Q 53,720 13,820 Q 8,900 38,1000 Q 48,1040 28,1060'
const BEACH_RIGHT_REV =
  'Q 377,1040 387,1000 Q 412,900 410,820 Q 367,720 377,620 Q 412,520 407,420 Q 367,320 382,220 Q 412,120 392,0'
const BEACH_PATH = `${BEACH_LEFT} L 397,1060 ${BEACH_RIGHT_REV} Z`

const TREES: [number, number][] = [
  [320, 150],
  [90, 230],
  [300, 360],
  [90, 460],
  [320, 470],
  [90, 650],
  [320, 650],
  [325, 790],
  [90, 950],
  [320, 950],
]

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
        <pattern id="sa-grass-tex" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(10)">
          <line x1="3" y1="15" x2="3" y2="8" stroke="#4f7a58" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="9" y1="16" x2="9" y2="9" stroke="#456d4f" strokeWidth="1.3" strokeLinecap="round" />
        </pattern>
        <radialGradient id="sa-water" cx="50%" cy="50%" r="75%">
          <stop offset="0%" stopColor="#0e4a6b" />
          <stop offset="100%" stopColor="#082f47" />
        </radialGradient>
      </defs>

      <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#sa-water)" />
      <g opacity={0.3} stroke="#2f7fa6" strokeWidth={1.5} fill="none">
        <path d="M 0,90 Q 100,80 200,95 Q 320,110 420,85" />
        <path d="M 0,470 Q 110,460 220,472" />
        <path d="M 0,1010 Q 100,1000 200,1012" />
      </g>

      <path d={BEACH_PATH} fill="#c9b57c" stroke="#a3915f" strokeWidth={2} />
      <path d={GRASS_PATH} fill="#3a5f43" />
      <path d={GRASS_PATH} fill="url(#sa-grass-tex)" opacity={0.55} />

      {/* Roads: the crawlerway (VAB to the pad) plus a couple of connecting paths. */}
      <path d="M 265,850 Q 230,870 205,890" fill="none" stroke="#1e293b" strokeWidth={12} strokeLinecap="round" />
      <path d="M 265,850 Q 230,870 205,890" fill="none" stroke="#475569" strokeWidth={1.5} strokeDasharray="7 7" />
      <path d="M 194,240 Q 194,255 194,270" fill="none" stroke="#1e293b" strokeWidth={9} strokeLinecap="round" />
      <path d="M 194,240 Q 194,255 194,270" fill="none" stroke="#475569" strokeWidth={1.5} strokeDasharray="5 5" />
      <path d="M 194,462 Q 194,480 194,500" fill="none" stroke="#1e293b" strokeWidth={9} strokeLinecap="round" />
      <path d="M 194,462 Q 194,480 194,500" fill="none" stroke="#475569" strokeWidth={1.5} strokeDasharray="5 5" />

      <g fill="#2f5136">
        {TREES.map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <circle cx={x} cy={y} r={9} />
            <circle cx={x + 12} cy={y + 8} r={7} />
          </g>
        ))}
      </g>
      <g fill="#3f6b48">
        {TREES.map(([x, y]) => (
          <circle key={`${x}-${y}-hl`} cx={x + 4} cy={y - 3} r={5} />
        ))}
      </g>

      {/* A reserved, empty lot — a future second site, not tied to any system yet. */}
      <g transform="translate(250,615)" opacity={0.7}>
        <rect x={0} y={0} width={70} height={50} rx={3} fill="none" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" />
        <line x1={0} y1={0} x2={70} y2={50} stroke="#475569" strokeWidth={1} strokeDasharray="3 4" />
        <line x1={70} y1={0} x2={0} y2={50} stroke="#475569" strokeWidth={1} strokeDasharray="3 4" />
        <text x={35} y={68} textAnchor="middle" fontSize={11} fill="#94a3b8">
          Future Site
        </text>
      </g>

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
        <g className="sa-bubble" transform={`translate(${w * 0.82} -16)`}>
          <path
            d="M -9,6 L -3,6 L 1,12 L 5,6 L 9,6 Q 13,6 13,2 L 13,-7 Q 13,-11 9,-11 L -9,-11 Q -13,-11 -13,-7 L -13,2 Q -13,6 -9,6 Z"
            fill="#f43f5e"
            stroke="#0b1220"
            strokeWidth={1.5}
          />
          <text textAnchor="middle" dy={-1} fontSize={9} fontWeight={700} fill="#fff">
            {badge}
          </text>
        </g>
      )}
    </g>
  )
}
