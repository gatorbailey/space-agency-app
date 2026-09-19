import { BUILDINGS, CARD_POOL, MAP_HEIGHT, MAP_WIDTH, TECH_TREE, findBuilding } from '../../content'
import type { BuildingDef, BuildingId } from '../../content'
import type { CardDepartment, ClockSpeed, GameState } from '../../simulation'
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

/**
 * The road spine — a hand-placed backbone running down the middle of the
 * safe corridor, roughly between each row's buildings. Every building gets
 * a straight spur from its row's anchor point to its own door (computed
 * below from content/buildings.ts, so it stays in sync if positions move);
 * the VAB-to-pad crawlerway is drawn separately since it's mechanically
 * meaningful (Stage 3), not just decorative.
 */
const SPINE: [number, number][] = [
  [207, 75],
  [194, 205],
  [202, 301],
  [194, 421],
  [210, 541],
  [190, 658],
  [211, 778],
  [205, 940],
]
const SPINE_PATH = `M ${SPINE.map(([x, y]) => `${x},${y}`).join(' L ')}`

const SPUR_ANCHOR: Record<BuildingId, [number, number]> = {
  admin: SPINE[0],
  'budget-office': SPINE[0],
  press: SPINE[1],
  security: SPINE[2],
  barracks: SPINE[2],
  'mission-control': SPINE[3],
  'rd-lab': SPINE[4],
  fabrication: SPINE[4],
  materials: SPINE[5],
  depot: SPINE[6],
  vab: SPINE[6],
  'launch-pad': SPINE[7],
}

function doorPoint(building: BuildingDef): [number, number] {
  return [building.x + building.w / 2, building.y + building.h]
}

const CRAWLERWAY_VAB: [number, number] = doorPoint(findBuilding('vab'))
const CRAWLERWAY_PAD: [number, number] = SPINE[7]
const CRAWLERWAY_CONTROL: [number, number] = [
  (CRAWLERWAY_VAB[0] + CRAWLERWAY_PAD[0]) / 2,
  CRAWLERWAY_VAB[1] + 45,
]
const CRAWLERWAY_PATH = `M ${CRAWLERWAY_VAB[0]},${CRAWLERWAY_VAB[1]} Q ${CRAWLERWAY_CONTROL[0]},${CRAWLERWAY_CONTROL[1]} ${CRAWLERWAY_PAD[0]},${CRAWLERWAY_PAD[1]}`

/** Point along the crawlerway at t∈[0,1] (0 = VAB, 1 = pad) — the quadratic Bezier formula, computed directly from game-day progress rather than looped/timed animation, so it always reflects the launch's actual transit state. */
function crawlerPointAt(t: number): [number, number] {
  const mt = 1 - t
  const x = mt * mt * CRAWLERWAY_VAB[0] + 2 * mt * t * CRAWLERWAY_CONTROL[0] + t * t * CRAWLERWAY_PAD[0]
  const y = mt * mt * CRAWLERWAY_VAB[1] + 2 * mt * t * CRAWLERWAY_CONTROL[1] + t * t * CRAWLERWAY_PAD[1]
  return [x, y]
}

/** Heading in degrees at t, from the Bezier's derivative — orients the crawler along its direction of travel. */
function crawlerAngleAt(t: number): number {
  const dx = 2 * (1 - t) * (CRAWLERWAY_CONTROL[0] - CRAWLERWAY_VAB[0]) + 2 * t * (CRAWLERWAY_PAD[0] - CRAWLERWAY_CONTROL[0])
  const dy = 2 * (1 - t) * (CRAWLERWAY_CONTROL[1] - CRAWLERWAY_VAB[1]) + 2 * t * (CRAWLERWAY_PAD[1] - CRAWLERWAY_CONTROL[1])
  return (Math.atan2(dy, dx) * 180) / Math.PI
}

/** Sim-seconds for one lap of the spine, by clock speed — no traffic while paused. */
const TRAFFIC_LAP_SECONDS: Partial<Record<ClockSpeed, number>> = { normal: 16, fast: 7, faster: 3 }

interface SiteMapProps {
  selectedId: BuildingId | null
  onSelect: (id: BuildingId) => void
}

/** null while there's no vehicle to show on the crawlerway at all. */
function crawlerProgress(state: GameState): number | null {
  const launch = state.launch
  if (!launch) return null
  if (launch.stage === 'rollout' && launch.transitStartedOnDay !== null && launch.transitCompletesOnDay !== null) {
    const total = launch.transitCompletesOnDay - launch.transitStartedOnDay
    const elapsed = state.day - launch.transitStartedOnDay
    return total > 0 ? Math.min(1, Math.max(0, elapsed / total)) : 1
  }
  if (launch.stage === 'rollback' && launch.transitStartedOnDay !== null && launch.transitCompletesOnDay !== null) {
    const total = launch.transitCompletesOnDay - launch.transitStartedOnDay
    const elapsed = state.day - launch.transitStartedOnDay
    const frac = total > 0 ? Math.min(1, Math.max(0, elapsed / total)) : 1
    return 1 - frac
  }
  // Parked at the pad while it's actually there to be launched or scrubbed.
  if (launch.stage === 'weather' || launch.stage === 'go-no-go' || launch.stage === 'outcome') return 1
  return null
}

export function SiteMap({ selectedId, onSelect }: SiteMapProps) {
  const { state } = useGame()
  const badges = flaggedCountsByDepartment(state)
  const trafficLapSeconds = TRAFFIC_LAP_SECONDS[state.speed]
  const crawlerT = crawlerProgress(state)

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

      {/* Roads: the spine, a spur to every building's door, and the dedicated crawlerway. */}
      <path id="sa-spine-path" d={SPINE_PATH} fill="none" stroke="#1e293b" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      <path d={SPINE_PATH} fill="none" stroke="#475569" strokeWidth={1.5} strokeDasharray="6 6" strokeLinejoin="round" />
      {BUILDINGS.map((building) => {
        const [ax, ay] = SPUR_ANCHOR[building.id]
        const [dx, dy] = doorPoint(building)
        const d = `M ${ax},${ay} L ${dx},${dy}`
        return (
          <g key={building.id}>
            <path d={d} fill="none" stroke="#1e293b" strokeWidth={6} strokeLinecap="round" />
            <path d={d} fill="none" stroke="#475569" strokeWidth={1} strokeDasharray="4 5" />
          </g>
        )
      })}
      <path d={CRAWLERWAY_PATH} fill="none" stroke="#1e293b" strokeWidth={12} strokeLinecap="round" />
      <path d={CRAWLERWAY_PATH} fill="none" stroke="#64748b" strokeWidth={1.5} strokeDasharray="7 7" />

      {crawlerT !== null && <Crawler t={crawlerT} />}

      {trafficLapSeconds && (
        <g fill="#fbbf24">
          <rect x={-3} y={-2} width={6} height={4} rx={1}>
            <animateMotion dur={`${trafficLapSeconds}s`} repeatCount="indefinite" rotate="auto">
              <mpath href="#sa-spine-path" />
            </animateMotion>
          </rect>
          <rect x={-3} y={-2} width={6} height={4} rx={1} fill="#94a3b8">
            <animateMotion dur={`${trafficLapSeconds}s`} begin={`${trafficLapSeconds / 2}s`} repeatCount="indefinite" rotate="auto">
              <mpath href="#sa-spine-path" />
            </animateMotion>
          </rect>
        </g>
      )}

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
      <g transform="translate(260,615)" opacity={0.7}>
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

/** The mission vehicle on its crawler-transporter — position/heading derived straight from launch.transitStartedOnDay/transitCompletesOnDay, so it's always exactly where the sim says it is, not a separate animation loop. */
function Crawler({ t }: { t: number }) {
  const [cx, cy] = crawlerPointAt(t)
  const angle = crawlerAngleAt(t)
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${angle})`} className="sa-crawler">
      <rect x={-11} y={-7} width={22} height={14} rx={2} fill="#94a3b8" stroke="#334155" strokeWidth={1.5} />
      <rect x={-13} y={5} width={7} height={5} fill="#1e293b" />
      <rect x={6} y={5} width={7} height={5} fill="#1e293b" />
      <rect x={-5} y={-11} width={9} height={5} fill="#64748b" stroke="#334155" />
    </g>
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
