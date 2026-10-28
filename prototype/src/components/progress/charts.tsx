import { formatDay } from "@/lib/date"

/**
 * Simple labelled bar chart (§44.10): consumed bars, planned markers, units and a
 * text equivalent for screen readers.
 */
export function DailyBars({
  data,
  unit,
  label,
}: {
  data: { date: string; value: number; planned?: number }[]
  unit: string
  label: string
}) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.value, d.planned ?? 0))) * 1.1
  const W = 320
  const H = 140
  const bw = W / data.length
  const summary = data.map((d) => `${formatDay(d.date, { weekday: "short" })}: ${d.value ? `about ${Math.round(d.value)} ${unit}` : "not logged"}${d.planned ? `, planned ${Math.round(d.planned)}` : ""}`).join("; ")
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H + 22}`} className="w-full" role="img" aria-label={`${label}. ${summary}`}>
        {[0.5, 1].map((f) => (
          <line key={f} x1={0} x2={W} y1={H - (H * f) / 1.1} y2={H - (H * f) / 1.1} stroke="var(--border)" strokeDasharray="3 3" />
        ))}
        {data.map((d, i) => {
          const h = (d.value / max) * H
          const x = i * bw + bw * 0.22
          const w = bw * 0.56
          const py = d.planned ? H - (d.planned / max) * H : null
          return (
            <g key={d.date}>
              {d.value > 0 ? <rect x={x} y={H - h} width={w} height={h} rx={5} fill="var(--forest-green)" /> : <rect x={x} y={H - 4} width={w} height={4} rx={2} fill="var(--border)" />}
              {py !== null && <line x1={x - 4} x2={x + w + 4} y1={py} y2={py} stroke="var(--terracotta)" strokeWidth={2.5} strokeLinecap="round" />}
              <text x={x + w / 2} y={H + 16} textAnchor="middle" fontSize={11} fill="var(--muted-grey-text)">
                {formatDay(d.date, { weekday: "narrow" })}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="inline-block size-2.5 rounded-sm bg-forest" /> Logged ({unit})</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-3 rounded bg-terracotta" /> Planned</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-1 w-3 rounded bg-border" /> Not logged</span>
      </figcaption>
    </figure>
  )
}

/** Small line chart for growth measurements. */
export function LineTrend({ points, unit, label }: { points: { date: string; value: number; source?: string }[]; unit: string; label: string }) {
  if (points.length === 0) return null
  const W = 320
  const H = 120
  const pad = 26
  const vals = points.map((p) => p.value)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const span = max - min || 1
  const t0 = new Date(points[0].date).getTime()
  const t1 = new Date(points[points.length - 1].date).getTime()
  const tx = (d: string) => (t1 === t0 ? W / 2 : pad + ((new Date(d).getTime() - t0) / (t1 - t0)) * (W - pad * 2))
  const ty = (v: number) => H - 14 - ((v - min) / span) * (H - 34)
  const path = points.map((p, i) => `${i ? "L" : "M"}${tx(p.date)},${ty(p.value)}`).join(" ")
  const summary = points.map((p) => `${formatDay(p.date, { day: "numeric", month: "short" })}: ${p.value} ${unit}`).join("; ")
  return (
    <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full" role="img" aria-label={`${label}. ${summary}`}>
      <path d={path} fill="none" stroke="var(--forest-green)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p) => (
        <g key={p.date}>
          <circle cx={tx(p.date)} cy={ty(p.value)} r={4.5} fill={p.source === "home" ? "var(--white)" : "var(--forest-green)"} stroke="var(--forest-green)" strokeWidth={2} />
          <text x={tx(p.date)} y={ty(p.value) - 9} textAnchor="middle" fontSize={11} fill="var(--charcoal)" className="tabular">
            {p.value}
          </text>
          <text x={tx(p.date)} y={H + 14} textAnchor="middle" fontSize={10} fill="var(--muted-grey-text)">
            {formatDay(p.date, { day: "numeric", month: "short" })}
          </text>
        </g>
      ))}
    </svg>
  )
}
