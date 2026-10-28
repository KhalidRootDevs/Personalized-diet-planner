import { formatDay } from "@/lib/date"

const GRID = "#E8EAE4"
const AXIS = "#5b6559"

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
 * Daily bar chart (§44.10, UI-SPEC §4.10), "statistic" style: tall rounded lime bars for logged
 * values with the value above, a hatched bar behind for the planned value, day labels below,
 * the selected day emphasized, and a text equivalent for screen readers.
 */
export function DailyBars({
  data,
  unit,
  label,
  highlight,
}: {
  data: { date: string; value: number; planned?: number }[]
  unit: string
  label: string
  /** ISO date drawn in the stronger lime (defaults to the last day). */
  highlight?: string
}) {
  const peak = Math.max(1, ...data.map((d) => Math.max(d.value, d.planned ?? 0)))
  const W = 340
  const H = 170
  const T = 26 // room for value labels
  const bw = W / data.length
  const bar = Math.min(18, bw * 0.42)
  const hi = highlight ?? data[data.length - 1]?.date
  const y = (v: number) => T + H - (v / peak) * H
  const short = (v: number) => (v >= 1000 ? `${(v / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })}k` : `${Math.round(v)}`)
  const summary = data.map((d) => `${formatDay(d.date, { weekday: "short" })}: ${d.value ? `about ${Math.round(d.value)} ${unit}` : "not logged"}${d.planned ? `, planned ${Math.round(d.planned)}` : ""}`).join("; ")
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${T + H + 26}`} className="w-full" role="img" aria-label={`${label}. ${summary}`}>
        <defs>
          <pattern id="planned-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="#eff1eb" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="#d9ddd4" strokeWidth="2.5" />
          </pattern>
        </defs>
        <line x1={0} x2={W} y1={T + H} y2={T + H} stroke={GRID} strokeWidth={1} />
        {data.map((d) => {
          const i = data.indexOf(d)
          const cx = i * bw + bw / 2
          const strong = d.date === hi
          const hasPlan = (d.planned ?? 0) > 0
          return (
            <g key={d.date}>
              {hasPlan && <rect x={cx - bar / 2 - 5} y={y(d.planned!)} width={bar} height={T + H - y(d.planned!)} rx={bar / 2} fill="url(#planned-hatch)" />}
              {d.value > 0 ? (
                <>
                  <rect x={cx - bar / 2 + (hasPlan ? 3 : 0)} y={y(d.value)} width={bar} height={Math.max(bar, T + H - y(d.value))} rx={bar / 2} fill={strong ? "var(--lime)" : "var(--lime-card)"} />
                  <text x={cx} y={y(d.value) - 7} textAnchor="middle" fontSize={11} fontWeight={strong ? 700 : 500} fill={strong ? "var(--charcoal)" : AXIS} className="tabular">
                    ~{short(d.value)}
                  </text>
                </>
              ) : (
                <rect x={cx - bar / 2} y={T + H - 4} width={bar} height={4} rx={2} fill={GRID} />
              )}
              <text x={cx} y={T + H + 19} textAnchor="middle" fontSize={12} fontWeight={strong ? 700 : 400} fill={strong ? "var(--charcoal)" : AXIS}>
                {formatDay(d.date, { weekday: "short" })}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        <LegendItem swatch={<span className="inline-block h-3 w-2 rounded-full bg-lime" />}>Logged ({unit}, estimate)</LegendItem>
        <LegendItem swatch={<span className="inline-block h-3 w-2 rounded-full bg-[repeating-linear-gradient(45deg,#eff1eb_0_2px,#d9ddd4_2px_4px)]" />}>Planned</LegendItem>
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
