import { Info } from "lucide-react"
import { cn } from "@/lib/utils"

type Kind = "range" | "min" | "limit"

/**
 * One labelled progress bar (§44.10, §41.4.2). The bar shows what kind of
 * recommendation the value is — a range, a minimum, or an upper limit — and never
 * implies 100% must be reached.
 */
export function NutrientBar({
  label,
  value,
  low,
  high,
  unit,
  kind = "range",
  estimate,
  planned,
}: {
  label: string
  value: number
  low: number
  high?: number
  unit: string
  kind?: Kind
  estimate?: boolean
  planned?: number
}) {
  const top = (high ?? low) * 1.25 || 1
  const pct = Math.min(100, (value / top) * 100)
  const lowPct = Math.min(100, (low / top) * 100)
  const highPct = Math.min(100, ((high ?? low) / top) * 100)
  const plannedPct = planned ? Math.min(100, (planned / top) * 100) : null
  const n = (v: number) => Math.round(v).toLocaleString("en-US")
  const kindLabel = kind === "range" ? `Target range ${n(low)}–${n(high ?? low)} ${unit}` : kind === "min" ? `Aim for at least ${n(low)} ${unit}` : `Keep under ${n(low)} ${unit}`
  const targetShort = kind === "range" ? `${n(low)}–${n(high ?? low)} ${unit}` : kind === "min" ? `at least ${n(low)} ${unit}` : `under ${n(low)} ${unit}`
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-callout font-medium">{label}</span>
        <span className="tabular text-callout">
          <span className="font-semibold">
            {estimate && "~"}
            {n(value)}
          </span>
          <span className="text-muted-foreground"> / {targetShort}</span>
        </span>
      </div>
      <div className="relative mt-2 h-2 rounded-full bg-muted" role="img" aria-label={`${label}: about ${n(value)} ${unit} so far. ${kindLabel}.`}>
        {kind === "range" && <div className="absolute inset-y-0 rounded-full bg-sage" style={{ left: `${lowPct}%`, width: `${Math.max(1, highPct - lowPct)}%` }} />}
        <div className="absolute inset-y-0 left-0 rounded-full bg-forest" style={{ width: `${pct}%` }} />
        {plannedPct !== null && <div className="absolute -top-1 -bottom-1 w-0.5 rounded bg-charcoal/60" style={{ left: `${plannedPct}%` }} title="Planned" />}
        {kind !== "range" && <div className="absolute -top-1 -bottom-1 w-0.5 rounded bg-charcoal/70" style={{ left: `${lowPct}%` }} />}
      </div>
    </div>
  )
}

export function EstimateNote({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-start gap-1.5 text-xs text-muted-foreground", className)}>
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span>{children ?? "Estimates from logged foods and our food database. Real values vary with recipes and portions."}</span>
    </p>
  )
}

export function Macro({ label, value, unit = "g", estimate }: { label: string; value: number; unit?: string; estimate?: boolean }) {
  return (
    <div className="rounded-xl bg-muted/60 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="tabular font-semibold">
        {estimate && "~"}
        {Math.round(value).toLocaleString("en-US")}
        <span className="text-xs font-normal text-muted-foreground"> {unit}</span>
      </p>
    </div>
  )
}

export function ConfidenceChip({ level }: { level: "high" | "moderate" | "low" }) {
  const style = { high: "bg-sage text-forest", moderate: "bg-[#efe9da] text-charcoal", low: "bg-caution-surface text-caution" }[level]
  const label = { high: "High confidence", moderate: "Moderate confidence", low: "Low confidence" }[level]
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", style)}>{label}</span>
}
