import { TECH_TREE } from '../../content'
import { canAfford, laneForCategory, TECH_CATEGORIES } from '../../simulation'
import type { ActiveProject, TechCategory, TechLane, TechNodeDef } from '../../simulation'
import { formatCost } from '../formatCost'
import { useGame } from '../useGame'

const LANE_COPY: Record<TechLane, { verb: string; busy: string }> = {
  research: { verb: 'Researching', busy: 'R&D Lab is busy with another project' },
  construction: { verb: 'Building', busy: 'Construction crew is busy with another project' },
}

// Static class strings so Tailwind can see them; interpolated names would never be generated.
const LANE_STYLES: Record<TechLane, { box: string; text: string; bar: string }> = {
  research: { box: 'border-sky-800 bg-sky-950/30', text: 'text-sky-300', bar: 'bg-sky-500' },
  construction: { box: 'border-amber-800 bg-amber-950/30', text: 'text-amber-300', bar: 'bg-amber-500' },
}

const BRANCH_COPY: Record<TechCategory, { title: string; intro: string }> = {
  knowledge: {
    title: 'Knowledge',
    intro: 'Lab research spends R&D and budget up front, then takes time. The R&D Lab works one project at a time.',
  },
  infrastructure: {
    title: 'Infrastructure',
    intro: 'Physical tiers built by the site construction crew — one project at a time across the whole site.',
  },
  security: {
    title: 'Security',
    intro: 'Units, vehicles, and the perimeter. Built by the site construction crew, one project at a time.',
  },
  fabrication: {
    title: 'Fabrication',
    intro: 'Machinery and methods that raise what the site makes for itself. Shares the construction crew.',
  },
}

/** Full tree — the list view's version, every branch in one card. */
export function TechTree() {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
      <h3 className="font-semibold text-slate-100">Tech Tree</h3>
      <p className="mt-1 text-xs text-slate-500">
        Cost is paid up front, then each project takes time. The R&amp;D Lab and the construction crew each work one
        project at a time.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <LaneBanner lane="research" />
        <LaneBanner lane="construction" />
      </div>
      {TECH_CATEGORIES.map((category) => (
        <div key={category} className="mt-4">
          <h4 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{BRANCH_COPY[category].title}</h4>
          <NodeList nodes={TECH_TREE.filter((n) => n.category === category)} />
        </div>
      ))}
    </div>
  )
}

/** One branch, for the building that houses it. */
export function TechBranch({ category }: { category: TechCategory }) {
  const copy = BRANCH_COPY[category]
  return (
    <div>
      <h4 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{copy.title}</h4>
      <p className="mt-1 text-xs text-slate-500">{copy.intro}</p>
      <div className="mt-2">
        <LaneBanner lane={laneForCategory(category)} />
      </div>
      <NodeList nodes={TECH_TREE.filter((n) => n.category === category)} />
    </div>
  )
}

/** The infrastructure tiers that upgrade one specific building, shown inside that building's panel. */
export function BuildingUpgrades({ techIds }: { techIds: string[] }) {
  const { state } = useGame()
  const nodes = techIds.map((id) => TECH_TREE.find((t) => t.id === id)).filter((n): n is TechNodeDef => !!n)
  if (nodes.length === 0) return null
  const activeHere = !!state.activeConstruction && techIds.includes(state.activeConstruction.techId)
  return (
    <div>
      <h4 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Upgrades</h4>
      {activeHere && (
        <div className="mt-2">
          <LaneBanner lane="construction" />
        </div>
      )}
      <NodeList nodes={nodes} />
    </div>
  )
}

function NodeList({ nodes }: { nodes: TechNodeDef[] }) {
  return (
    <ul className="mt-2 flex flex-col gap-2">
      {nodes.map((node) => (
        <TechNodeCard key={node.id} node={node} />
      ))}
    </ul>
  )
}

function projectForLane(lane: TechLane, active: { research: ActiveProject | null; construction: ActiveProject | null }) {
  return lane === 'research' ? active.research : active.construction
}

function LaneBanner({ lane }: { lane: TechLane }) {
  const { state } = useGame()
  const project = projectForLane(lane, { research: state.activeResearch, construction: state.activeConstruction })
  if (!project) return null
  const node = TECH_TREE.find((n) => n.id === project.techId)
  if (!node) return null
  const total = project.completesOnDay - project.startedOnDay || 1
  const elapsed = state.day - project.startedOnDay
  const daysLeft = Math.max(0, project.completesOnDay - state.day)
  const styles = LANE_STYLES[lane]

  return (
    <div className={`rounded border p-3 ${styles.box}`}>
      <div className="flex items-center justify-between">
        <span className={`text-sm font-semibold ${styles.text}`}>
          {LANE_COPY[lane].verb}: {node.name}
        </span>
        <span className={`font-mono text-sm ${styles.text}`}>{daysLeft}d left</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
        <div className={`h-full ${styles.bar}`} style={{ width: `${Math.min(100, (elapsed / total) * 100)}%` }} />
      </div>
    </div>
  )
}

function TechNodeCard({ node }: { node: TechNodeDef }) {
  const { state, dispatch } = useGame()
  const unlocked = state.unlockedTech.includes(node.id)
  const requiredNode = node.requiresTechId ? TECH_TREE.find((t) => t.id === node.requiresTechId) : undefined
  const locked = !!requiredNode && !state.unlockedTech.includes(requiredNode.id)
  const lane = laneForCategory(node.category)
  const project = projectForLane(lane, { research: state.activeResearch, construction: state.activeConstruction })
  const inProgress = project?.techId === node.id
  const laneBusy = !!project && !inProgress
  const affordable = canAfford(state.resources, node.cost)
  const daysLeft = inProgress && project ? Math.max(0, project.completesOnDay - state.day) : 0

  return (
    <li
      className={`rounded border p-3 ${
        unlocked
          ? 'border-emerald-800 bg-emerald-950/30'
          : inProgress
            ? 'border-sky-800 bg-sky-950/20'
            : locked
              ? 'border-slate-800 bg-slate-900/50 opacity-60'
              : 'border-slate-700 bg-slate-800/50'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`text-sm font-semibold ${unlocked ? 'text-emerald-300' : 'text-slate-100'}`}>
          {node.name}
        </span>
        {unlocked ? (
          <span className="shrink-0 rounded bg-emerald-900 px-2 py-0.5 text-xs font-bold text-emerald-300">
            {lane === 'research' ? 'RESEARCHED' : 'BUILT'}
          </span>
        ) : inProgress ? (
          <span className="shrink-0 rounded bg-sky-900 px-2 py-0.5 text-xs font-bold text-sky-300">
            {daysLeft}d left
          </span>
        ) : locked ? null : (
          <button
            type="button"
            disabled={!affordable || laneBusy}
            onClick={() => dispatch({ type: 'RESEARCH_TECH', techId: node.id })}
            className="shrink-0 rounded border border-sky-700 px-3 py-1 text-xs font-semibold text-sky-300 transition hover:bg-sky-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {lane === 'research' ? 'Research' : 'Build'}
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-400">{node.description}</p>
      {locked && <p className="mt-1 text-xs text-slate-500">Requires {requiredNode?.name} first.</p>}
      {!unlocked && !locked && !inProgress && (
        <p className="mt-1 text-xs text-slate-500">
          Cost: {node.researchDays} day{node.researchDays === 1 ? '' : 's'}, {formatCost(node.cost)}
          {laneBusy && ` — ${LANE_COPY[lane].busy}`}
        </p>
      )}
    </li>
  )
}
