"use client"

import { adultTargets, bmi, fmt } from "@/lib/nutrition"
import type { Profile } from "@/lib/types"
import { CautionNote } from "@/components/app/alerts"
import { EstimateNote } from "@/components/app/nutrition"

/** Assessment result as ranges with method and uncertainty (§6.2, §6.8). Never exact numbers. */
export function TargetsCard({ profile }: { profile: Profile }) {
  const t = adultTargets(profile)
  const b = bmi(profile)
  if (!t.supported || t.energy.low === 0) {
    return (
      <CautionNote title="Targets need a professional">
        {t.reason ?? "We can't safely calculate personal targets for this profile yet. Your plan will use general, clinically reviewed guidance, and we'll suggest speaking with a qualified professional."}
      </CautionNote>
    )
  }
  const rows = [
    { label: "Energy", value: fmt.range(t.energy.low, t.energy.high, " kcal/day") },
    { label: "Protein", value: fmt.range(t.proteinG.low, t.proteinG.high, " g/day") },
    { label: "Carbohydrates", value: fmt.range(t.carbsG.low, t.carbsG.high, " g/day") },
    { label: "Fat", value: fmt.range(t.fatG.low, t.fatG.high, " g/day") },
    { label: "Fiber", value: `at least ${t.fiberMinG} g/day` },
    { label: "Iron", value: `about ${t.ironMg} mg/day` },
    { label: "Calcium", value: `about ${t.calciumMg} mg/day` },
  ]
  return (
    <div className="space-y-3 rounded-2xl border bg-card p-4">
      <dl className="divide-y">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-3 py-2 first:pt-0 last:pb-0">
            <dt className="text-sm text-muted-foreground">{r.label}</dt>
            <dd className="tabular text-right text-sm font-semibold">{r.value}</dd>
          </div>
        ))}
      </dl>
      {b && (
        <p className="text-xs text-muted-foreground">
          BMI {b.toFixed(1)} — a screening measure only, not a full picture of your health.
        </p>
      )}
      <EstimateNote>
        {t.method}. These are starting estimates, not exact physiological requirements — we&apos;ll refine them as you log meals and update your details.
      </EstimateNote>
    </div>
  )
}
