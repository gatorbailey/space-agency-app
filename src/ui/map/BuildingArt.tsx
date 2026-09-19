import type { BuildingKind } from '../../content'

/**
 * Hand-drawn SVG buildings, in code so the site art stays authorable
 * without an asset pipeline. Each is drawn in its own (0,0)-(w,h) box, y
 * increasing downward, ground line at y=h; the map positions it. Most use
 * the oblique `Shell` — a front face, a roof and a right-side face sharing
 * exact edges (front-top edge == roof's front edge, front-right edge ==
 * side's front edge), lit as if from the upper-left: roof brightest, front
 * medium, side darkest, plus a soft ground-contact shadow. `upgraded` adds
 * the Tier II silhouette change.
 */
const FRONT = '#33415a'
const ROOF_LIT = '#7c8aa0'
const SIDE_DARK = '#1b2434'
const HIGHLIGHT = '#aab6c8'
const EDGE = '#4a5b78'
const STEEL = '#94a3b8'
const GLASS = '#7dd3fc'
const DARK = '#101722'
const AMBER = '#f59e0b'
const RED = '#f43f5e'

interface ArtProps {
  kind: BuildingKind
  w: number
  h: number
  upgraded: boolean
}

export function BuildingArt({ kind, w, h, upgraded }: ArtProps) {
  switch (kind) {
    case 'admin':
      return <Admin w={w} h={h} />
    case 'office':
      return <Office w={w} h={h} />
    case 'press':
      return <Press w={w} h={h} />
    case 'security':
      return <Security w={w} h={h} upgraded={upgraded} />
    case 'barracks':
      return <Barracks w={w} h={h} upgraded={upgraded} />
    case 'mission-control':
      return <MissionControl w={w} h={h} upgraded={upgraded} />
    case 'lab':
      return <Lab w={w} h={h} upgraded={upgraded} />
    case 'factory':
      return <Factory w={w} h={h} />
    case 'processing':
      return <Processing w={w} h={h} />
    case 'depot':
      return <Depot w={w} h={h} upgraded={upgraded} />
    case 'vab':
      return <Vab w={w} h={h} upgraded={upgraded} />
    case 'pad':
      return <Pad w={w} h={h} upgraded={upgraded} />
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

interface Geo {
  skx: number
  sky: number
  frontW: number
  frontTop: number
}

/** front face spans x:[0,frontW], y:[frontTop,h]; roof/side recede by (skx,-sky). */
function geo(w: number, h: number, depthFrac = 0.16, riseFrac = 0.13): Geo {
  const skx = clamp(w * depthFrac, 6, 22)
  const sky = clamp(h * riseFrac, 5, 16)
  return { skx, sky, frontW: w - skx, frontTop: sky }
}

function Shell({
  h,
  g,
  frontFill = FRONT,
  roofFill = ROOF_LIT,
  sideFill = SIDE_DARK,
}: {
  h: number
  g: Geo
  frontFill?: string
  roofFill?: string
  sideFill?: string
}) {
  const { skx, sky, frontW, frontTop } = g
  return (
    <>
      <ellipse cx={frontW * 0.5 + skx * 0.3} cy={h} rx={frontW * 0.55} ry={Math.max(3, h * 0.05)} fill="#000" opacity={0.25} />
      <polygon
        points={`${frontW},${frontTop} ${frontW + skx},0 ${frontW + skx},${h - sky} ${frontW},${h}`}
        fill={sideFill}
        stroke="#0d1421"
      />
      <rect x={0} y={frontTop} width={frontW} height={h - frontTop} fill={frontFill} stroke={EDGE} />
      <polygon points={`0,${frontTop} ${frontW},${frontTop} ${frontW + skx},0 ${skx},0`} fill={roofFill} stroke="#8899ad" />
      <line x1={1} y1={frontTop - 1} x2={skx - 1} y2={1} stroke={HIGHLIGHT} strokeWidth={1.2} opacity={0.7} />
    </>
  )
}

function Windows({ x, y, count, gap = 12, size = 6 }: { x: number; y: number; count: number; gap?: number; size?: number }) {
  return (
    <>
      {Array.from({ length: Math.max(0, count) }, (_, i) => (
        <rect key={i} x={x + i * gap} y={y} width={size} height={size} fill={GLASS} opacity={0.8} />
      ))}
    </>
  )
}

function Door({ x, y, w = 8, h = 12 }: { x: number; y: number; w?: number; h?: number }) {
  return <rect x={x} y={y} width={w} height={h} fill={DARK} />
}

type Props = { w: number; h: number }
type UpgradableProps = Props & { upgraded: boolean }

function Admin({ w, h }: Props) {
  const g = geo(w, h)
  const { frontW, frontTop } = g
  return (
    <>
      <Shell h={h} g={g} />
      <Windows x={8} y={frontTop + 10} count={Math.floor((frontW - 8) / 12)} />
      <Windows x={8} y={frontTop + 26} count={Math.floor((frontW - 8) / 12)} />
      <Door x={frontW / 2 - 4} y={h - 14} />
      <line x1={frontW - 10} y1={frontTop - 20} x2={frontW - 10} y2={frontTop} stroke={STEEL} strokeWidth={1.5} />
      <polygon points={`${frontW - 10},${frontTop - 20} ${frontW + 4},${frontTop - 15} ${frontW - 10},${frontTop - 10}`} fill={RED} />
    </>
  )
}

function Office({ w, h }: Props) {
  const g = geo(w, h, 0.14, 0.16)
  const { frontW, frontTop } = g
  return (
    <>
      <Shell h={h} g={g} frontFill="#3c4c68" />
      {Array.from({ length: 5 }, (_, i) => (
        <rect key={i} x={10 + i * ((frontW - 20) / 4) - 3} y={frontTop + 6} width={5} height={h - frontTop - 12} fill={STEEL} opacity={0.85} />
      ))}
      <rect x={0} y={h - 5} width={frontW} height={5} fill={STEEL} />
      <rect x={frontW / 2 - 4} y={h - 16} width={8} height={11} fill={DARK} />
    </>
  )
}

function Press({ w, h }: Props) {
  const mainW = w * 0.68
  const g = geo(mainW, h)
  const { frontW, frontTop } = g
  return (
    <>
      <Shell h={h} g={g} />
      <Windows x={8} y={frontTop + 10} count={Math.floor((frontW - 8) / 12)} />
      <Door x={frontW / 2 - 4} y={h - 14} />
      <rect x={w - 34} y={4} width={32} height={22} rx={2} fill={AMBER} />
      <rect x={w - 30} y={9} width={24} height={3} fill={DARK} />
      <rect x={w - 30} y={15} width={15} height={3} fill={DARK} />
      <line x1={w - 18} y1={26} x2={w - 18} y2={42} stroke={STEEL} strokeWidth={2} />
      <rect x={w - 36} y={h - 18} width={34} height={14} rx={2} fill="#fbbf24" />
      <circle cx={w - 28} cy={h - 4} r={3} fill={DARK} />
      <circle cx={w - 10} cy={h - 4} r={3} fill={DARK} />
    </>
  )
}

function Security({ w, h, upgraded }: UpgradableProps) {
  const g = geo(w * 0.62, h * 0.85, 0.18, 0.16)
  const { frontW, frontTop } = g
  const gx = w / 2 - (frontW + g.skx) / 2
  return (
    <>
      <line x1={0} y1={h * 0.16} x2={w} y2={h * 0.16} stroke={STEEL} strokeWidth={1.5} strokeDasharray="4 3" />
      {[0, w / 4, w / 2, (3 * w) / 4, w].map((x) => (
        <line key={x} x1={x} y1={h * 0.08} x2={x} y2={h * 0.24} stroke={STEEL} strokeWidth={2} />
      ))}
      <g transform={`translate(${gx},${h * 0.15})`}>
        <Shell h={h * 0.85} g={g} />
        <Windows x={frontW / 2 - 10} y={frontTop + 8} count={2} gap={12} />
        <Door x={frontW / 2 - 4} y={h * 0.85 - 14} />
        <circle cx={frontW + g.skx - 4} cy={-8} r={2.5} fill={RED} className="sa-beacon" />
      </g>
      {upgraded && <rect x={2} y={h - 12} width={16} height={12} fill={DARK} stroke={EDGE} />}
    </>
  )
}

function Barracks({ w, h, upgraded }: UpgradableProps) {
  const rows = upgraded ? 3 : 2
  const g = geo(w, h)
  const { frontW, frontTop } = g
  const rowGap = (h - frontTop - 16) / rows
  return (
    <>
      <Shell h={h} g={g} />
      {Array.from({ length: rows }, (_, r) => (
        <Windows key={r} x={8} y={frontTop + 8 + r * rowGap} count={Math.floor((frontW - 16) / 14)} gap={14} />
      ))}
      <Door x={frontW / 2 - 4} y={h - 14} />
    </>
  )
}

function MissionControl({ w, h, upgraded }: UpgradableProps) {
  const g = geo(w, h * 0.72, 0.16, 0.18)
  const boxH = h * 0.72
  const boxY = h - boxH
  const { frontW, frontTop } = g
  return (
    <>
      <g transform={`translate(0,${boxY})`}>
        <Shell h={boxH} g={g} />
        <Windows x={8} y={frontTop + 8} count={Math.floor((frontW - 8) / 12)} />
        <Windows x={8} y={frontTop + 22} count={Math.floor((frontW - 8) / 12)} />
      </g>
      <Dish cx={w * 0.28} cy={boxY - 14} />
      {upgraded && <Dish cx={w * 0.7} cy={boxY - 10} />}
      <line x1={w / 2} y1={2} x2={w / 2} y2={boxY} stroke={STEEL} strokeWidth={1.5} />
      <circle cx={w / 2} cy={2} r={2} fill={RED} className="sa-beacon" />
    </>
  )
}

function Dish({ cx, cy }: { cx: number; cy: number }) {
  return (
    <>
      <line x1={cx} y1={cy} x2={cx} y2={cy + 16} stroke={STEEL} strokeWidth={2} />
      <path d={`M ${cx - 12} ${cy - 4} A 12 12 0 0 0 ${cx + 12} ${cy - 4} Z`} fill={STEEL} stroke={EDGE} />
      <line x1={cx} y1={cy - 4} x2={cx} y2={cy - 14} stroke={EDGE} strokeWidth={1.5} />
    </>
  )
}

function Lab({ w, h, upgraded }: UpgradableProps) {
  const g = geo(w, h)
  const { frontW, frontTop } = g
  return (
    <>
      <Shell h={h} g={g} />
      <Windows x={8} y={frontTop + 10} count={Math.floor((frontW - 8) / 12)} />
      <Windows x={8} y={frontTop + 26} count={Math.floor((frontW - 8) / 12)} />
      <Door x={frontW / 2 - 4} y={h - 14} />
      <Dish cx={frontW - 16} cy={frontTop - 8} />
      {upgraded && <rect x={6} y={frontTop + 2} width={frontW - 12} height={4} fill={AMBER} opacity={0.8} />}
    </>
  )
}

function Factory({ w, h }: Props) {
  const g = geo(w, h * 0.78, 0.15, 0.1)
  const boxH = h * 0.78
  const boxY = h - boxH
  const { frontW, frontTop } = g
  const teeth = 3
  const tw = frontW / teeth
  const roofPts = Array.from({ length: teeth }, (_, i) => `${i * tw},${frontTop} ${i * tw + tw * 0.55},${frontTop - 16} ${(i + 1) * tw},${frontTop}`).join(' ')
  return (
    <g transform={`translate(0,${boxY})`}>
      <ellipse cx={frontW * 0.5} cy={boxH} rx={frontW * 0.55} ry={Math.max(3, boxH * 0.05)} fill="#000" opacity={0.25} />
      <polygon points={`${frontW},${frontTop} ${frontW + g.skx},0 ${frontW + g.skx},${boxH - g.sky} ${frontW},${boxH}`} fill={SIDE_DARK} stroke="#0d1421" />
      <rect x={0} y={frontTop} width={frontW} height={boxH - frontTop} fill={FRONT} stroke={EDGE} />
      <polygon points={`0,${frontTop} ${roofPts} ${frontW},${frontTop}`} fill={ROOF_LIT} stroke="#8899ad" />
      <rect x={frontW - 16} y={frontTop - 32} width={7} height={32} fill={STEEL} stroke={EDGE} />
      <Windows x={8} y={frontTop + 14} count={Math.floor((frontW - 16) / 12)} />
      <rect x={8} y={boxH - 20} width={26} height={20} fill={DARK} />
    </g>
  )
}

function Processing({ w, h }: Props) {
  const tankX = w * 0.6
  const tankW = w - tankX
  return (
    <>
      <ellipse cx={w * 0.28} cy={h} rx={w * 0.28} ry={4} fill="#000" opacity={0.22} />
      <rect x={0} y={h * 0.34} width={w * 0.56} height={h * 0.66} fill={FRONT} stroke={EDGE} />
      <Windows x={6} y={h * 0.46} count={4} />
      <polygon points={`${w * 0.6},${h * 0.24} ${w - 4},${h * 0.24} ${w - 10},${h * 0.56} ${w * 0.66},${h * 0.56}`} fill={STEEL} stroke={EDGE} />
      <rect x={tankX + 3} y={h * 0.24} width={(tankW - 6) * 0.4} height={h * 0.32} fill={HIGHLIGHT} opacity={0.35} />
      <line x1={w * 0.56} y1={h - 12} x2={w - 4} y2={h * 0.62} stroke={STEEL} strokeWidth={3} />
      {[w * 0.62, w * 0.72, w * 0.82].map((x, i) => (
        <circle key={x} cx={x} cy={h - 14 - i * 5.5} r={3} fill={DARK} stroke={STEEL} />
      ))}
    </>
  )
}

function Depot({ w, h, upgraded }: UpgradableProps) {
  const count = upgraded ? 4 : 3
  const tw = w * 0.17
  const gap = (w - count * tw) / (count + 1)
  const tankH = h * 0.78
  const tankY = h - tankH
  return (
    <>
      <ellipse cx={w / 2} cy={h - 2} rx={w * 0.46} ry={5} fill="#000" opacity={0.22} />
      <rect x={0} y={h - 6} width={w} height={6} fill={DARK} stroke={EDGE} />
      {Array.from({ length: count }, (_, i) => {
        const x = gap + i * (tw + gap)
        return (
          <g key={i}>
            <rect x={x} y={tankY} width={tw} height={tankH - 4} rx={3} fill={STEEL} stroke={EDGE} />
            <rect x={x + tw * 0.55} y={tankY} width={tw * 0.3} height={tankH - 4} fill={HIGHLIGHT} opacity={0.4} />
            <ellipse cx={x + tw / 2} cy={tankY} rx={tw / 2} ry={4} fill="#cbd5e1" stroke={EDGE} />
          </g>
        )
      })}
    </>
  )
}

function Vab({ w, h, upgraded }: UpgradableProps) {
  const g = geo(w, h, 0.2, 0.09)
  const { frontW, frontTop } = g
  const top = upgraded ? Math.max(2, frontTop - 14) : frontTop
  return (
    <>
      <Shell h={h} g={{ ...g, frontTop: top }} />
      <rect x={frontW * 0.42} y={top} width={frontW * 0.16} height={h - top} fill="#0ea5e9" opacity={0.55} />
      <rect x={4} y={top + 4} width={frontW - 8} height={3} fill={STEEL} />
      <Door x={10} y={h - 18} w={16} h={18} />
      <line x1={frontW / 2} y1={h - 2} x2={frontW / 2} y2={h + 14} stroke={STEEL} strokeWidth={2} strokeDasharray="2 5" />
    </>
  )
}

function Pad({ w, h, upgraded }: UpgradableProps) {
  const cx = w * 0.52
  const padY = h - h * 0.14
  const towerH = h * 0.86
  const towerTop = padY - towerH
  return (
    <>
      <ellipse cx={cx + 4} cy={padY + 4} rx={w * 0.42} ry={h * 0.1} fill="#000" opacity={0.25} />
      <ellipse cx={cx} cy={padY} rx={w * 0.42} ry={h * 0.09} fill={DARK} stroke={EDGE} strokeWidth={2} />
      <ellipse cx={cx} cy={padY} rx={w * 0.42} ry={h * 0.09} fill="none" stroke="#334155" strokeWidth={1} strokeDasharray="3 5" />
      <rect x={cx - 5} y={towerTop} width={7} height={towerH} fill={STEEL} stroke={EDGE} />
      <rect x={cx + 2} y={towerTop} width={3} height={towerH} fill="#54627a" />
      <line x1={cx - 5} y1={towerTop + towerH * 0.22} x2={cx - w * 0.22} y2={towerTop + towerH * 0.32} stroke={STEEL} strokeWidth={3} />
      <line x1={cx - 5} y1={towerTop + towerH * 0.42} x2={cx - w * 0.2} y2={towerTop + towerH * 0.52} stroke={STEEL} strokeWidth={3} />
      <rect x={cx - 11} y={padY - towerH * 0.24} width={22} height={towerH * 0.22} rx={3} fill="#0b1220" stroke={STEEL} strokeWidth={1.5} />
      <circle cx={cx + 2} cy={towerTop} r={3.2} fill={RED} className="sa-beacon" />
      {upgraded && (
        <>
          <rect x={cx - w * 0.34} y={towerTop + towerH * 0.14} width={5} height={towerH * 0.72} fill={STEEL} stroke={EDGE} />
          <circle cx={cx - w * 0.34 + 2.5} cy={towerTop + towerH * 0.1} r={2} fill={AMBER} className="sa-beacon" />
        </>
      )}
    </>
  )
}
