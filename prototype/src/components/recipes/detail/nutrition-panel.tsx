"use client"

import { Baby, Flame, HandHeart, Milk, Soup, TriangleAlert } from "lucide-react"
import { IconTile, StatTile } from "@/components/app/page"
import { InfoNote } from "@/components/app/alerts"
import { EstimateNote } from "@/components/app/nutrition"
import { FOOD_MAP } from "@/lib/data/foods"
import { recipeSodium } from "@/lib/nutrition"
import { cn } from "@/lib/utils"
import type { Nutrients, Recipe } from "@/lib/types"
import { CHILD_FEEDING_NOTES, energyRange } from "./helpers"

function signed(n: number, unit: string, digits = 0) {
  const v = Number(n.toFixed(digits))
  if (v === 0) return `±0 ${unit}`
  return `${v > 0 ? "+" : "−"}${Math.abs(v)} ${unit}`
}

function macroShares(n: Nutrients) {
  const kcal = n.proteinG * 4 + n.carbsG * 4 + n.fatG * 9 || 1
  return [
    { key: "protein", label: "Protein", g: n.proteinG, share: (n.proteinG * 4) / kcal, fill: "bg-protein", dot: "bg-protein" },
    { key: "carbs", label: "Carbs", g: n.carbsG, share: (n.carbsG * 4) / kcal, fill: "bg-carbs", dot: "bg-carbs" },
    { key: "fat", label: "Fat", g: n.fatG, share: (n.fatG * 9) / kcal, fill: "bg-fat", dot: "bg-fat" },
  ]
}

/** One stacked bar of each macro's share of energy, with labels, grams and % (never color alone). */
export function MacroBar({ n, className }: { n: Nutrients; className?: string }) {
  const rows = macroShares(n)
  return (
    <div className={className}>
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={rows.map((r) => `${r.label} about ${Math.round(r.g)} grams, ${Math.round(r.share * 100)}% of energy`).join("; ")}>
        {rows.map((r) => (
          <div key={r.key} className={cn("h-full first:rounded-l-full last:rounded-r-full", r.fill)} style={{ width: `${Math.max(3, r.share * 100)}%` }} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {rows.map((r) => (
          <div key={r.key}>
            <p className="text-caption flex items-center gap-1.5 font-medium">
              <span className={cn("size-2.5 rounded-full", r.dot)} aria-hidden />
              {r.label}
            </p>
            <p className="tabular text-headline mt-0.5 whitespace-nowrap">
              ~{Math.round(r.g)}
              <span className="text-caption font-normal text-muted-foreground"> g</span>
            </p>
            <p className="tabular text-caption text-muted-foreground">{Math.round(r.share * 100)}% of energy</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Compact per-serving strip shown above the tabs (adults only). */
export function NutritionSnapshot({ n, onMore }: { n: Nutrients; onMore: () => void }) {
  const [lo, hi] = energyRange(n.energyKcal)
  return (
    <button type="button" onClick={onMore} className="block w-full rounded-2xl bg-lime-card p-4 text-left transition-colors hover:bg-lime-card/85">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-caption font-medium">Per serving · estimate</p>
          <p className="tabular mt-1 text-[30px] leading-none font-bold tracking-tight">
            ~{Math.round(n.energyKcal)}
            <span className="text-callout ml-1 font-medium tracking-normal">kcal</span>
          </p>
          <p className="tabular text-caption mt-1">
            Likely {lo}–{hi} kcal
          </p>
        </div>
        <IconTile tone="white" size="lg">
          <Flame className="text-terracotta" />
        </IconTile>
      </div>
      <div className="mt-4 rounded-xl bg-card p-3">
        <MacroBar n={n} />
      </div>
      <p className="text-callout mt-3 font-semibold text-forest">Full nutrition</p>
    </button>
  )
}

/** Full nutrition tab for adult recipes. */
export function NutritionPanel({ recipe, perServing, original, changed }: { recipe: Recipe; perServing: Nutrients; original: Nutrients; changed: boolean }) {
  const [lo, hi] = energyRange(perServing.energyKcal)
  const partial = (k: "ironMg" | "calciumMg") => recipe.ingredients.some((i) => FOOD_MAP[i.foodId]?.per100g[k] === undefined)
  const sodium = recipeSodium(recipe)
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-card p-5 shadow-card">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-caption text-muted-foreground">Energy per serving · estimate</p>
          {changed && <span className="text-caption rounded-full bg-amber-tint px-2 py-0.5 font-medium text-amber-text">Recalculated</span>}
        </div>
        <p className="tabular mt-1 text-[30px] leading-none font-bold tracking-tight">
          ~{Math.round(perServing.energyKcal)}
          <span className="text-callout ml-1 font-medium tracking-normal text-muted-foreground">kcal</span>
        </p>
        <p className="tabular text-caption mt-1 text-muted-foreground">
          Likely {lo}–{hi} kcal, depending on oil and portion size
        </p>
        <MacroBar n={perServing} className="mt-5" />
        <div className="mt-5 grid grid-cols-3 gap-2">
          <StatTile label="Fiber" value={`~${Math.round(perServing.fiberG)}`} unit="g" />
          <StatTile label="Iron" value={`~${(perServing.ironMg ?? 0).toFixed(1)}`} unit="mg" hint={partial("ironMg") ? "partial data" : undefined} />
          <StatTile label="Calcium" value={`~${Math.round(perServing.calciumMg ?? 0)}`} unit="mg" hint={partial("calciumMg") ? "partial data" : undefined} />
        </div>
        {sodium.complete && (
          <p className="tabular text-caption mt-3 text-muted-foreground">
            Sodium ~{Math.round(sodium.perServingMg)} mg per serving (from ingredients; added salt varies).
          </p>
        )}
        <p className="text-caption mt-3 text-muted-foreground">Bar shows each macronutrient&apos;s share of the energy. &quot;Partial data&quot; means some ingredients have no value for that nutrient yet, so the real amount may be higher.</p>
      </div>
      {changed && <SubstitutionNote before={original} after={perServing} />}
      <EstimateNote>Calculated by our nutrition engine from each ingredient&apos;s raw, dry or cooked weight in the food database. Changing servings or ingredients recalculates these values.</EstimateNote>
    </div>
  )
}

export function SubstitutionNote({ before, after }: { before: Nutrients; after: Nutrients }) {
  return (
    <InfoNote title="Recalculated after your swap">
      Substitutions change the nutrition. Per serving: energy {signed(after.energyKcal - before.energyKcal, "kcal")}, protein {signed(after.proteinG - before.proteinG, "g")}, fat {signed(after.fatG - before.fatG, "g")}, fiber {signed(after.fiberG - before.fiberG, "g")}, iron {signed((after.ironMg ?? 0) - (before.ironMg ?? 0), "mg", 1)}.
    </InfoNote>
  )
}

/** Infant / child recipes: texture, age and caregiver guidance instead of calories (§12). */
export function FeedingPanel({ recipe }: { recipe: Recipe }) {
  const infant = recipe.profile === "infant"
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-sage p-4">
          <IconTile tone="white" size="sm">
            <Soup />
          </IconTile>
          <p className="text-caption mt-2 text-muted-foreground">Texture</p>
          <p className="text-headline">{recipe.texture ?? "Soft, family food"}</p>
        </div>
        <div className="rounded-2xl bg-sage p-4">
          <IconTile tone="white" size="sm">
            <Baby />
          </IconTile>
          <p className="text-caption mt-2 text-muted-foreground">Suitable from</p>
          <p className="text-headline">{recipe.minAgeMonths ? `${recipe.minAgeMonths} months` : infant ? "6 months" : "12 months"}</p>
        </div>
      </div>
      <ul className="space-y-2">
        <FeedingNote icon={<HandHeart />} title="Responsive feeding">
          {CHILD_FEEDING_NOTES.responsive}
        </FeedingNote>
        <FeedingNote icon={<TriangleAlert />} title="Safe eating">
          {CHILD_FEEDING_NOTES.choking}
        </FeedingNote>
        {infant && (
          <FeedingNote icon={<Milk />} title="Milk feeds come first">
            {CHILD_FEEDING_NOTES.milk}
          </FeedingNote>
        )}
      </ul>
      <EstimateNote>We don&apos;t show calories for babies and young children. Portions follow your child&apos;s appetite, and growth is reviewed with your health worker.</EstimateNote>
    </div>
  )
}

function FeedingNote({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 rounded-2xl bg-card p-4 shadow-card">
      <IconTile tone="sage" size="sm">
        {icon}
      </IconTile>
      <div className="text-callout min-w-0">
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-muted-foreground">{children}</p>
      </div>
    </li>
  )
}
