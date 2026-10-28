"use client"

import { adultTargets, bmi, fmt } from "@/lib/nutrition"
import type { Profile } from "@/lib/types"
import { CautionNote } from "@/components/app/alerts"
import { EstimateNote } from "@/components/app/nutrition"
import { Surface } from "@/components/app/page"

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
    { label: "Protein", value: fmt.range(t.proteinG.low, t.proteinG.high, " g"), dot: "bg-protein" },
    { label: "Carbohydrates", value: fmt.range(t.carbsG.low, t.carbsG.high, " g"), dot: "bg-carbs" },
    { label: "Fat", value: fmt.range(t.fatG.low, t.fatG.high, " g"), dot: "bg-fat" },
    { label: "Fiber", value: `at least ${t.fiberMinG} g`, dot: "bg-fiber" },
    { label: "Iron", value: `about ${t.ironMg.toLocaleString("en-US")} mg`, dot: "bg-terracotta" },
    { label: "Calcium", value: `about ${t.calciumMg.toLocaleString("en-US")} mg`, dot: "bg-water" },
  ]
  return (
    <Surface padding="sm">
      <div className="rounded-xl bg-lime-card px-3.5 py-3">
        <p className="text-caption text-charcoal/75">Daily energy · estimated range</p>
        <p className="mt-0.5 text-[28px] leading-8 font-bold tracking-tight tabular">
          {fmt.range(t.energy.low, t.energy.high, "")}
          <span className="text-callout ml-1.5 font-medium tracking-normal text-charcoal/70">kcal/day</span>
        </p>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 px-1">
        {rows.map((r) => (
          <div key={r.label} className="min-w-0">
            <dt className="text-caption flex items-center gap-1.5 text-muted-foreground">
              <span className={`size-2 rounded-full ${r.dot}`} aria-hidden />
              {r.label}
            </dt>
            <dd className="tabular text-callout font-semibold">{r.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mx-1 mt-3 border-t border-border/70 pt-3 pb-1">
        <EstimateNote>
          {t.method}. Per day; starting estimates, not exact requirements. We&apos;ll refine them as you log meals.{b && ` BMI ${b.toFixed(1)} is a screening measure only, not a full picture of your health.`}
        </EstimateNote>
      </div>
    </Surface>
  )
}
