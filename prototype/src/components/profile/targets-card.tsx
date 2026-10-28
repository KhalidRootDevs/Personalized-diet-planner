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
    { label: "Protein", value: fmt.range(t.proteinG.low, t.proteinG.high, " g") },
    { label: "Carbohydrates", value: fmt.range(t.carbsG.low, t.carbsG.high, " g") },
    { label: "Fat", value: fmt.range(t.fatG.low, t.fatG.high, " g") },
    { label: "Fiber", value: `at least ${t.fiberMinG} g` },
    { label: "Iron", value: `about ${t.ironMg.toLocaleString("en-US")} mg` },
    { label: "Calcium", value: `about ${t.calciumMg.toLocaleString("en-US")} mg` },
  ]
  return (
    <Surface padding="lg">
      <p className="text-caption text-muted-foreground">Daily energy · estimated range</p>
      <p className="text-metric mt-1 text-[30px] leading-9">
        {fmt.range(t.energy.low, t.energy.high, "")}
        <span className="text-callout ml-1.5 font-normal tracking-normal text-muted-foreground">kcal</span>
      </p>
      <dl className="mt-4 divide-y divide-border/70 border-t border-border/70">
        {rows.map((r) => (
          <div key={r.label} className="text-callout flex items-baseline justify-between gap-3 py-2.5">
            <dt className="text-muted-foreground">{r.label}</dt>
            <dd className="tabular text-right font-semibold">
              {r.value}
              <span className="font-normal text-muted-foreground"> /day</span>
            </dd>
          </div>
        ))}
      </dl>
      {b && <p className="text-caption mt-3 text-muted-foreground">BMI {b.toFixed(1)}: a screening measure only, not a full picture of your health.</p>}
      <div className="mt-3 border-t border-border/70 pt-3">
        <EstimateNote>
          {t.method}. These are starting estimates, not exact requirements. We&apos;ll refine them as you log meals and update your details.
        </EstimateNote>
      </div>
    </Surface>
  )
}
