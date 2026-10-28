import { formatDay } from "@/lib/date"

const GRID = "#E8E5DC"
const AXIS = "#616762"

/** Legend item for charts (UI-SPEC §4.10): swatch + caption label. */
export function LegendItem({ swatch, children }: { swatch: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="text-caption inline-flex items-center gap-1.5 text-muted-foreground">
      {swatch}
      {children}
    </span>
  )
}

/**
 * Daily bar chart (§44.10, UI-SPEC §4.10): logged bars (forest) beside planned bars (sage),
 * hairline gridlines, caption axis labels and a text equivalent for screen readers.
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
  const peak = Math.max(1, ...data.map((d) => Math.max(d.value, d.planned ?? 0)))
  const step = peak > 1000 ? 1000 : peak > 200 ? 100 : 50
  const top = Math.ceil(peak / step) * step
  const ticks = [0, top / 2, top]
  const W = 340
  const H = 150
  const left = 34
  const plotW = W - left
  const bw = plotW / data.length
  const bar = 8
  const T = 10 // headroom so the top axis label isn't clipped
  const y = (v: number) => T + H - (v / top) * H
  const summary = data.map((d) => `${formatDay(d.date, { weekday: "short" })}: ${d.value ? `about ${Math.round(d.value)} ${unit}` : "not logged"}${d.planned ? `, planned ${Math.round(d.planned)}` : ""}`).join("; ")
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${T + H + 24}`} className="w-full" role="img" aria-label={`${label}. ${summary}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={left} x2={W} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
            <text x={left - 6} y={y(t) + 4} textAnchor="end" fontSize={10.5} fill={AXIS} className="tabular">
              {t >= 1000 ? `${(t / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })}k` : t}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = left + i * bw + bw / 2
          const hasPlan = (d.planned ?? 0) > 0
          const xLogged = hasPlan ? cx - bar - 1 : cx - bar / 2
          return (
            <g key={d.date}>
              {hasPlan && <rect x={cx + 1} y={y(d.planned!)} width={bar} height={T + H - y(d.planned!)} rx={bar / 2} fill="var(--sage)" />}
              {d.value > 0 ? (
                <rect x={xLogged} y={y(d.value)} width={bar} height={Math.max(bar, T + H - y(d.value))} rx={bar / 2} fill="var(--forest-green)" />
              ) : (
                <rect x={xLogged} y={T + H - 3} width={bar} height={3} rx={1.5} fill={GRID} />
              )}
              <text x={cx} y={T + H + 18} textAnchor="middle" fontSize={11} fill={AXIS}>
                {formatDay(d.date, { weekday: "narrow" })}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        <LegendItem swatch={<span className="inline-block h-2.5 w-2 rounded-full bg-forest" />}>Logged ({unit})</LegendItem>
        <LegendItem swatch={<span className="inline-block h-2.5 w-2 rounded-full bg-sage" />}>Planned</LegendItem>
      </figcaption>
    </figure>
  )
}

/** Small line chart for growth measurements. Filled dots = clinic, hollow = home. */
export function LineTrend({ points, unit, label }: { points: { date: string; value: number; source?: string }[]; unit: string; label: string }) {
  if (points.length === 0) return null
  const W = 340
  const H = 130
  const pad = 28
  const vals = points.map((p) => p.value)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const span = max - min || 1
  const t0 = new Date(points[0].date).getTime()
  const t1 = new Date(points[points.length - 1].date).getTime()
  const tx = (d: string) => (t1 === t0 ? W / 2 : pad + ((new Date(d).getTime() - t0) / (t1 - t0)) * (W - pad * 2))
  const ty = (v: number) => H - 16 - ((v - min) / span) * (H - 40)
  const path = points.map((p, i) => `${i ? "L" : "M"}${tx(p.date)},${ty(p.value)}`).join(" ")
  const summary = points.map((p) => `${formatDay(p.date, { day: "numeric", month: "short" })}: ${p.value} ${unit}${p.source ? ` (${p.source})` : ""}`).join("; ")
  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full" role="img" aria-label={`${label}. ${summary}`}>
      {[H - 16, (H - 16 + 24) / 2, 24].map((gy) => (
        <line key={gy} x1={0} x2={W} y1={gy} y2={gy} stroke={GRID} strokeWidth={1} />
      ))}
      <path d={path} fill="none" stroke="var(--forest-green)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p) => (
        <g key={p.date}>
          <circle cx={tx(p.date)} cy={ty(p.value)} r={4.5} fill={p.source === "home" ? "var(--white)" : "var(--forest-green)"} stroke="var(--forest-green)" strokeWidth={2} />
          <text x={tx(p.date)} y={ty(p.value) - 10} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--charcoal)" className="tabular">
            {p.value}
          </text>
          <text x={tx(p.date)} y={H + 14} textAnchor="middle" fontSize={10.5} fill={AXIS}>
            {formatDay(p.date, { day: "numeric", month: "short" })}
          </text>
        </g>
      ))}
    </svg>
  )
}
