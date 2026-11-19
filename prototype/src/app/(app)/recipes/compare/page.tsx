"use client"

import { useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { PageBody, PageHeader, Pill, Section, Surface } from "@/components/app/page"
import { FeatureBadge, PremiumGate } from "@/components/app/badges"
import { InfoNote } from "@/components/app/alerts"
import { EstimateNote } from "@/components/app/nutrition"
import { RecipeThumb } from "@/components/app/recipe-thumb"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { useApp, useSelfProfile } from "@/lib/store"
import { RECIPES } from "@/lib/data/recipes"
import { findRecipe, recipeCostPerServing, recipeNutrition, violatesHardConstraints } from "@/lib/nutrition"
import type { Recipe } from "@/lib/types"

/** Compare two meals on estimated cost and nutrition (§42.7). Only meals that pass your rules are listed. */
export default function ComparePage() {
  return (
    <>
      <PageHeader title="Compare two meals" subtitle="Part of the budget optimizer" back action={<FeatureBadge feature="budget_optimizer" />} />
      <PageBody>
        <PremiumGate feature="budget_optimizer">
          <Suspense fallback={null}>
            <Compare />
          </Suspense>
        </PremiumGate>
      </PageBody>
    </>
  )
}

function Compare() {
  const params = useSearchParams()
  const profile = useSelfProfile()
  const userRecipes = useApp((s) => s.userRecipes)
  const options = [...RECIPES.filter((r) => r.profile === "adult" && r.reviewStatus === "approved"), ...userRecipes].filter((r) => !profile || !violatesHardConstraints(r, profile))
  const [a, setA] = useState(params.get("a") ?? options[0]?.id ?? "")
  const [b, setB] = useState(params.get("b") ?? options.find((r) => r.id !== a)?.id ?? "")
  const ra = findRecipe(a)
  const rb = findRecipe(b)

  const picker = (value: string, onChange: (v: string) => void, label: string) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-10 w-full text-[13px]" aria-label={label}>
        <span className="font-semibold text-forest">Change</span>
      </SelectTrigger>
      <SelectContent>
        {options.map((r) => (
          <SelectItem key={r.id} value={r.id}>
            {r.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  return (
    <div className="space-y-7">
      <div className="grid grid-cols-2 gap-3">
        {[
          { r: ra, value: a, set: setA, label: "Meal A" },
          { r: rb, value: b, set: setB, label: "Meal B" },
        ].map(({ r, value, set, label }) => (
          <Surface key={label} padding="sm" className="flex flex-col items-center text-center">
            <p className="text-overline self-start px-1 text-muted-foreground">{label}</p>
            {r && <RecipeThumb recipe={r} size="lg" className="mt-1" />}
            <p className="text-callout mt-2 line-clamp-2 min-h-10 font-semibold">{r?.name}</p>
            {r && (
              <Pill className="mt-1.5" tone={r.reviewStatus === "approved" ? "sage" : "neutral"}>
                {r.reviewStatus === "approved" ? "Verified" : "Not reviewed"}
              </Pill>
            )}
            <div className="mt-3 w-full">{picker(value, set, `Choose ${label.toLowerCase()}`)}</div>
          </Surface>
        ))}
      </div>
      {ra && rb && <Table a={ra} b={rb} />}
    </div>
  )
}

function Table({ a, b }: { a: Recipe; b: Recipe }) {
  const na = recipeNutrition(a)
  const nb = recipeNutrition(b)
  const ca = recipeCostPerServing(a)
  const cb = recipeCostPerServing(b)
  const rows: { label: string; va: number; vb: number; unit: string; digits?: number; prefix?: string }[] = [
    { label: "Cost per serving", va: ca, vb: cb, unit: "", prefix: "৳" },
    { label: "Energy", va: na.energyKcal, vb: nb.energyKcal, unit: "kcal" },
    { label: "Protein", va: na.proteinG, vb: nb.proteinG, unit: "g" },
    { label: "Carbohydrate", va: na.carbsG, vb: nb.carbsG, unit: "g" },
    { label: "Fat", va: na.fatG, vb: nb.fatG, unit: "g" },
    { label: "Fiber", va: na.fiberG, vb: nb.fiberG, unit: "g" },
    { label: "Iron", va: na.ironMg ?? 0, vb: nb.ironMg ?? 0, unit: "mg", digits: 1 },
    { label: "Calcium", va: na.calciumMg ?? 0, vb: nb.calciumMg ?? 0, unit: "mg" },
    { label: "Time", va: a.prepMinutes + a.cookMinutes, vb: b.prepMinutes + b.cookMinutes, unit: "min" },
  ]
  const v = (n: number, r: (typeof rows)[number]) => `${r.prefix ?? "~"}${r.digits ? n.toFixed(r.digits) : Math.round(n).toLocaleString("en-US")}${r.unit ? ` ${r.unit}` : ""}`
  const costDiff = cb - ca
  const proteinDiff = nb.proteinG - na.proteinG
  const summary =
    costDiff === 0
      ? "Both cost about the same per serving."
      : `${costDiff < 0 ? b.name : a.name} is about ৳${Math.abs(costDiff)} cheaper per serving${Math.abs(proteinDiff) >= 3 ? `, with ~${Math.abs(Math.round(proteinDiff))} g ${(costDiff < 0) === (proteinDiff < 0) ? "less" : "more"} protein` : ", with similar protein"}.`

  return (
    <>
      <Section title="Per serving">
        <div className="overflow-hidden rounded-2xl bg-card shadow-card">
          <table className="text-callout w-full">
            <caption className="sr-only">Cost and nutrition per serving for both meals</caption>
            <thead className="bg-muted text-caption text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2 text-left font-medium">
                  <span className="sr-only">Measure</span>
                </th>
                <th scope="col" className="px-2 py-2 text-right font-semibold text-charcoal">
                  A<span className="sr-only">: {a.name}</span>
                </th>
                <th scope="col" className="px-4 py-2 text-right font-semibold text-charcoal">
                  B<span className="sr-only">: {b.name}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {rows.map((r) => (
                <tr key={r.label}>
                  <th scope="row" className="px-4 py-2.5 text-left font-normal text-muted-foreground">
                    {r.label}
                  </th>
                  <td className="tabular px-2 py-2.5 text-right font-semibold whitespace-nowrap">{v(r.va, r)}</td>
                  <td className="tabular px-4 py-2.5 text-right font-semibold whitespace-nowrap">{v(r.vb, r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <InfoNote>{summary} The cheaper meal isn&apos;t automatically the better choice — protein, iron and fiber matter too.</InfoNote>
        <EstimateNote>Costs are estimates from typical local prices; nutrition is calculated from ingredients.</EstimateNote>
      </Section>
    </>
  )
}
