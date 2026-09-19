import type { BuildingKind } from '../../content'

/**
 * Hand-drawn SVG buildings, in code so the site art stays authorable
 * without an asset pipeline. Each is drawn in its own (0,0)-(w,h) box; the
 * map positions it. `upgraded` adds the Tier II silhouette change.
 */
const BODY = '#334155'
const EDGE = '#64748b'
const ROOF = '#475569'
const STEEL = '#94a3b8'
const GLASS = '#7dd3fc'
const DARK = '#1e293b'
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

function Box({ x, y, w, h, fill = BODY }: { x: number; y: number; w: number; h: number; fill?: string }) {
  return <rect x={x} y={y} width={w} height={h} rx={2} fill={fill} stroke={EDGE} strokeWidth={1} />
}

function Windows({ x, y, count, gap = 12, size = 6 }: { x: number; y: number; count: number; gap?: number; size?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <rect key={i} x={x + i * gap} y={y} width={size} height={size} fill={GLASS} opacity={0.75} />
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
  const bw = w - 16
  return (
    <>
      <rect x={0} y={10} width={bw} height={6} fill={ROOF} />
      <Box x={0} y={16} w={bw} h={h - 16} />
      <Windows x={8} y={26} count={Math.floor((bw - 8) / 12)} />
      <Windows x={8} y={42} count={Math.floor((bw - 8) / 12)} />
      <Door x={bw / 2 - 4} y={h - 12} />
      <line x1={w - 6} y1={2} x2={w - 6} y2={h} stroke={STEEL} strokeWidth={1.5} />
      <polygon points={`${w - 6},4 ${w + 6},8 ${w - 6},12`} fill={RED} />
    </>
  )
}

function Office({ w, h }: Props) {
  return (
    <>
      <polygon points={`0,20 ${w / 2},4 ${w},20`} fill={ROOF} stroke={EDGE} strokeWidth={1} />
      <Box x={0} y={20} w={w} h={h - 20} />
      {Array.from({ length: 5 }, (_, i) => (
        <rect key={i} x={10 + i * ((w - 20) / 4) - 3} y={26} width={6} height={h - 32} fill={STEEL} />
      ))}
      <rect x={0} y={h - 4} width={w} height={4} fill={STEEL} />
    </>
  )
}

function Press({ w, h }: Props) {
  const bw = w - 34
  return (
    <>
      <Box x={0} y={22} w={bw} h={h - 22} />
      <Windows x={8} y={32} count={Math.floor((bw - 8) / 12)} />
      <Door x={bw / 2 - 4} y={h - 12} />
      <rect x={w - 30} y={4} width={30} height={22} rx={2} fill={AMBER} />
      <rect x={w - 26} y={9} width={22} height={3} fill={DARK} />
      <rect x={w - 26} y={15} width={14} height={3} fill={DARK} />
      <line x1={w - 15} y1={26} x2={w - 15} y2={40} stroke={STEEL} strokeWidth={2} />
      <rect x={w - 32} y={h - 16} width={30} height={12} rx={2} fill="#fbbf24" />
      <circle cx={w - 25} cy={h - 3} r={3} fill={DARK} />
      <circle cx={w - 9} cy={h - 3} r={3} fill={DARK} />
    </>
  )
}

function Security({ w, h, upgraded }: UpgradableProps) {
  return (
    <>
      <line x1={0} y1={8} x2={w} y2={8} stroke={STEEL} strokeWidth={1.5} strokeDasharray="4 3" />
      {[0, w / 4, w / 2, (3 * w) / 4, w].map((x) => (
        <line key={x} x1={x} y1={3} x2={x} y2={13} stroke={STEEL} strokeWidth={2} />
      ))}
      <Box x={w / 2 - 26} y={22} w={52} h={h - 22} />
      <Windows x={w / 2 - 18} y={30} count={3} />
      <Door x={w / 2 - 4} y={h - 12} />
      <circle cx={w / 2 + 20} cy={26} r={2.5} fill={RED} className="sa-beacon" />
      {upgraded && <rect x={2} y={h - 14} width={18} height={14} fill={DARK} stroke={EDGE} />}
    </>
  )
}

function Barracks({ w, h, upgraded }: UpgradableProps) {
  return (
    <>
      {upgraded && (
        <>
          <Box x={0} y={2} w={w} h={16} fill={ROOF} />
          <Windows x={8} y={7} count={Math.floor((w - 8) / 14)} gap={14} />
        </>
      )}
      <Box x={0} y={18} w={w} h={h - 18} />
      <Windows x={8} y={28} count={Math.floor((w - 16) / 14)} gap={14} />
      <Door x={w / 2 - 4} y={h - 12} />
    </>
  )
}

function MissionControl({ w, h, upgraded }: UpgradableProps) {
  return (
    <>
      <Box x={0} y={36} w={w} h={h - 36} />
      <Windows x={8} y={46} count={Math.floor((w - 8) / 12)} />
      <Windows x={8} y={62} count={Math.floor((w - 8) / 12)} />
      <Dish cx={26} cy={20} />
      {upgraded && <Dish cx={w - 26} cy={18} />}
      <line x1={w / 2} y1={4} x2={w / 2} y2={36} stroke={STEEL} strokeWidth={1.5} />
      <circle cx={w / 2} cy={4} r={2} fill={RED} className="sa-beacon" />
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
  return (
    <>
      {upgraded && (
        <>
          <Box x={6} y={10} w={w - 12} h={20} fill={ROOF} />
          <Windows x={14} y={16} count={Math.floor((w - 24) / 12)} />
        </>
      )}
      <Box x={0} y={30} w={w} h={h - 30} />
      <Windows x={8} y={40} count={Math.floor((w - 8) / 12)} />
      <Windows x={8} y={56} count={Math.floor((w - 8) / 12)} />
      <rect x={w - 22} y={20} width={6} height={10} fill={STEEL} />
      <rect x={w - 12} y={22} width={6} height={8} fill={STEEL} />
      <Door x={w / 2 - 4} y={h - 12} />
    </>
  )
}

function Factory({ w, h }: Props) {
  const teeth = 4
  const tw = w / teeth
  const roof = Array.from({ length: teeth }, (_, i) => `${i * tw},30 ${i * tw + tw * 0.55},12 ${(i + 1) * tw},30`).join(' ')
  return (
    <>
      <rect x={w - 20} y={2} width={8} height={30} fill={STEEL} />
      <polygon points={`0,30 ${roof} ${w},30`} fill={ROOF} stroke={EDGE} strokeWidth={1} />
      <Box x={0} y={30} w={w} h={h - 30} />
      <Windows x={8} y={42} count={Math.floor((w - 8) / 12)} />
      <rect x={10} y={h - 20} width={30} height={20} fill={DARK} />
    </>
  )
}

function Processing({ w, h }: Props) {
  return (
    <>
      <Box x={0} y={26} w={58} h={h - 26} />
      <Windows x={6} y={36} count={4} />
      <polygon points={`62,20 ${w - 4},20 ${w - 12},44 70,44`} fill={STEEL} stroke={EDGE} />
      <line x1={58} y1={h - 10} x2={w - 4} y2={h - 26} stroke={STEEL} strokeWidth={3} />
      {[64, 78, 92].map((x, i) => (
        <circle key={x} cx={x} cy={h - 12 - i * 5.5} r={3} fill={DARK} stroke={STEEL} />
      ))}
    </>
  )
}

function Depot({ w, h, upgraded }: UpgradableProps) {
  const count = upgraded ? 4 : 3
  const tw = 20
  const gap = (w - count * tw) / (count + 1)
  return (
    <>
      <rect x={0} y={h - 8} width={w} height={8} fill={DARK} stroke={EDGE} />
      {Array.from({ length: count }, (_, i) => {
        const x = gap + i * (tw + gap)
        return (
          <g key={i}>
            <rect x={x} y={22} width={tw} height={h - 30} rx={3} fill={STEEL} stroke={EDGE} />
            <ellipse cx={x + tw / 2} cy={22} rx={tw / 2} ry={4} fill="#cbd5e1" stroke={EDGE} />
            <line x1={x + tw - 4} y1={30} x2={x + tw - 4} y2={h - 12} stroke={EDGE} strokeWidth={1} />
          </g>
        )
      })}
    </>
  )
}

function Vab({ w, h, upgraded }: UpgradableProps) {
  const top = upgraded ? 6 : 22
  return (
    <>
      <Box x={0} y={top} w={w} h={h - top} />
      <rect x={w / 2 - 7} y={top} width={14} height={h - top} fill="#0ea5e9" opacity={0.55} />
      <rect x={4} y={top + 4} width={w - 8} height={3} fill={STEEL} />
      <rect x={w / 2 - 28} y={h - 44} width={56} height={44} fill={DARK} stroke={EDGE} />
      <line x1={w / 2} y1={h - 44} x2={w / 2} y2={h} stroke={EDGE} strokeWidth={1} strokeDasharray="3 3" />
    </>
  )
}

function Pad({ w, h, upgraded }: UpgradableProps) {
  const cx = w / 2
  const padY = h - 26
  return (
    <>
      <ellipse cx={cx} cy={padY} rx={46} ry={15} fill={DARK} stroke={EDGE} />
      <rect x={cx - 8} y={padY + 4} width={16} height={18} fill="#0b1220" stroke={EDGE} />
      <rect x={cx + 14} y={8} width={10} height={padY - 10} fill={STEEL} stroke={EDGE} />
      {[24, 44, 64].map((y) => (
        <line key={y} x1={cx + 14} y1={y} x2={cx + 24} y2={y + 10} stroke={EDGE} strokeWidth={1} />
      ))}
      <rect x={cx - 4} y={padY - 18} width={18} height={4} fill={STEEL} />
      <circle cx={cx + 19} cy={6} r={3} fill={RED} className="sa-beacon" />
      {upgraded && (
        <>
          <rect x={cx - 34} y={20} width={5} height={padY - 20} fill={STEEL} stroke={EDGE} />
          <circle cx={cx - 31.5} cy={18} r={2} fill={AMBER} className="sa-beacon" />
        </>
      )}
    </>
  )
}
