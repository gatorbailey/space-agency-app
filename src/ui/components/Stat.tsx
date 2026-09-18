export function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
      <span className={`font-mono text-base font-semibold ${accent}`}>{value}</span>
    </div>
  )
}
