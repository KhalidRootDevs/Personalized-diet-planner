"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Section, StatTile } from "@/components/app/page"
import { RecipeThumb } from "@/components/app/recipe-thumb"
import { FeatureBadge } from "@/components/app/badges"
import { EstimateNote } from "@/components/app/nutrition"
import { FoodTile } from "@/components/log/food-tile"
import { MEAL_LABEL } from "@/lib/planning"
import { plannedMealNutrition } from "@/lib/nutrition"
import { compareWithRecipe, describeDiff, entryRange, entryTitle, minutesLate } from "@/lib/area-b-log"
import { mealStatus, STATUS_STYLE, useRecipeLookup } from "@/lib/area-c-utils"
import { cn } from "@/lib/utils"
import type { JournalEntry, PlannedMeal } from "@/lib/types"

const r0 = (v: number) => Math.round(v).toLocaleString("en-US")

function timing(mins: number): string {
  const abs = Math.abs(mins)
  const t = abs >= 90 ? `${Math.round(abs / 30) / 2} h` : `${abs} min`
  return `${t} ${mins > 0 ? "later" : "earlier"} than planned`
}

/**
 * Planned vs actual (§41.5.1): energy, protein, foods and portions, timing, skipped meals and
 * unplanned snacks. Neutral wording only: a difference is information, not a failure, and never
 * triggers restriction at the next meal (§41.6).
 */
export function PlannedVsActual({ meals, entries }: { meals: PlannedMeal[]; entries: JournalEntry[] }) {
  const lookup = useRecipeLookup()
  const sorted = [...meals].sort((a, b) => a.time.localeCompare(b.time))
  const rows = sorted.map((m) => {
    const pn = plannedMealNutrition(m)
    const recipe = lookup(m.recipeId)
    const entry = entries.find((e) => e.id === m.linkedJournalEntryId || e.linkedPlannedMealId === m.id)
    const an = entry ? entryRange(entry).mid : null
    const actual = an ? an.energyKcal : m.outcome === "eaten_as_planned" ? pn.energyKcal : m.outcome === "skipped" ? 0 : null
    const actualProtein = an ? an.proteinG : m.outcome === "eaten_as_planned" ? pn.proteinG : m.outcome === "skipped" ? 0 : null
    const diff = entry && recipe && m.outcome !== "eaten_as_planned" ? describeDiff(compareWithRecipe(recipe, m.servings, entry.items)) : ""
    const late = entry ? minutesLate(m.time, entry.consumedAt) : 0
    return { m, recipe, planned: pn.energyKcal, plannedProtein: pn.proteinG, actual, actualProtein, entry, diff, late }
  })
  const linkedIds = new Set(rows.map((r) => r.entry?.id).filter(Boolean))
  const unplanned = entries.filter((e) => e.analysisStatus === "confirmed" && !linkedIds.has(e.id) && !e.linkedPlannedMealId)
  const unplannedKcal = unplanned.reduce((s, e) => s + entryRange(e).mid.energyKcal, 0)

  const compared = rows.filter((r) => r.actual !== null)
  const plannedSum = compared.reduce((s, r) => s + r.planned, 0)
  const actualSum = compared.reduce((s, r) => s + (r.actual ?? 0), 0) + unplannedKcal
  const plannedProtein = compared.reduce((s, r) => s + r.plannedProtein, 0)
  const actualProtein = compared.reduce((s, r) => s + (r.actualProtein ?? 0), 0) + unplanned.reduce((s, e) => s + entryRange(e).mid.proteinG, 0)
  const diff = actualSum - plannedSum

  const energyMsg =
    plannedSum === 0 && !unplanned.length
      ? "Record a meal to compare it with your plan."
      : Math.abs(diff) < Math.max(plannedSum, 1) * 0.1
        ? "Recorded meals are close to what you planned."
        : diff > 0
          ? `Recorded meals came to about ${r0(diff)} kcal more than planned — your next meals stay the same, no need to cut back.`
          : `Recorded meals came to about ${r0(-diff)} kcal less than planned — eat your next meal as usual; there's no need for a bigger one.`

  // The one or two main reasons, in plain words (§41.5.2 step 6).
  const reasons: string[] = []
  const biggest = [...compared].filter((r) => r.diff || r.m.outcome === "skipped").sort((a, b) => Math.abs((b.actual ?? 0) - b.planned) - Math.abs((a.actual ?? 0) - a.planned))[0]
  if (biggest) reasons.push(biggest.m.outcome === "skipped" ? `${MEAL_LABEL[biggest.m.mealType]} was skipped` : `${MEAL_LABEL[biggest.m.mealType]} had ${biggest.diff}`)
  if (unplanned.length) reasons.push(`${unplanned.length === 1 ? "an unplanned" : `${unplanned.length} unplanned`} ${unplanned.length === 1 ? "entry" : "entries"} added ~${r0(unplannedKcal)} kcal`)
  const lateRow = rows.find((r) => r.entry && Math.abs(r.late) >= 60)
  if (reasons.length < 2 && lateRow) reasons.push(`${MEAL_LABEL[lateRow.m.mealType].toLowerCase()} was ${timing(lateRow.late)}`)
  const reasonMsg = reasons.length ? `Main differences: ${reasons.slice(0, 2).join("; ")}.` : ""

  return (
    <Section title="Planned vs actual" badge={<FeatureBadge feature="planned_vs_actual" />}>
      <div className="overflow-hidden rounded-2xl bg-card shadow-card">
        <div className="p-4">
          <div className="grid grid-cols-2 gap-2">
            <StatTile label="Planned" value={`~${r0(plannedSum)}`} unit="kcal" hint={`protein ~${r0(plannedProtein)} g`} className="bg-muted" />
            <StatTile label="Eaten · estimate" value={`~${r0(actualSum)}`} unit="kcal" hint={`protein ~${r0(actualProtein)} g`} className="bg-sage" />
          </div>
          <p className="text-callout mt-3">{energyMsg}</p>
          {reasonMsg && <p className="text-caption mt-1.5 text-muted-foreground">{reasonMsg}</p>}
        </div>
        <ul className="divide-y divide-border/70 border-t border-border/70">
          {rows.map(({ m, recipe, planned, plannedProtein: pp, actual, actualProtein: ap, entry, diff: d, late }) => {
            const st = mealStatus(m)
            return (
              <li key={m.id} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {recipe && <RecipeThumb recipe={recipe} size="sm" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-caption text-muted-foreground">{MEAL_LABEL[m.mealType]}</p>
                    <p className="text-callout line-clamp-1 font-medium">{recipe?.name}</p>
                    <span className={cn("mt-1 inline-flex h-[22px] items-center rounded-full px-2 text-[11px] font-medium", STATUS_STYLE[st.tone])}>{st.label}</span>
                  </div>
                  {actual === null ? (
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <p className="tabular text-caption text-muted-foreground">Planned ~{r0(planned)} kcal</p>
                      <Button asChild size="sm" variant="secondary" className="h-8">
                        <Link href={`/log/new?meal=${m.id}`}>
                          <Plus /> Record
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="tabular shrink-0 text-right">
                      <p className="text-caption text-muted-foreground">Planned ~{r0(planned)}</p>
                      {entry ? (
                        <Link href={`/log/entry/${entry.id}`} className="text-callout font-semibold text-forest underline-offset-4 hover:underline">
                          Eaten ~{r0(actual)}
                        </Link>
                      ) : (
                        <p className="text-callout font-semibold">Eaten ~{r0(actual)}</p>
                      )}
                      <p className="text-caption text-muted-foreground">
                        protein ~{r0(ap ?? 0)} / {r0(pp)} g
                      </p>
                    </div>
                  )}
                </div>
                {(d || (entry && Math.abs(late) >= 30)) && (
                  <div className="text-caption mt-2.5 ml-[60px] rounded-xl bg-muted px-3 py-2 text-muted-foreground">
                    {d && <p>Compared with plan: {d}</p>}
                    {entry && Math.abs(late) >= 30 && <p className={d ? "mt-0.5" : ""}>Eaten {timing(late)}</p>}
                  </div>
                )}
              </li>
            )
          })}
          {unplanned.map((e) => {
            const n = entryRange(e).mid
            return (
              <li key={e.id} className="flex items-center gap-3 px-4 py-3">
                {e.items[0] && <FoodTile foodId={e.items[0].foodId} size="sm" />}
                <div className="min-w-0 flex-1">
                  <p className="text-caption text-muted-foreground">{MEAL_LABEL[e.mealType]} · not in plan</p>
                  <p className="text-callout truncate font-medium">{entryTitle(e)}</p>
                  <span className={cn("mt-1 inline-flex h-[22px] items-center rounded-full px-2 text-[11px] font-medium", STATUS_STYLE.changed)}>Unplanned</span>
                </div>
                <div className="tabular shrink-0 text-right">
                  <Link href={`/log/entry/${e.id}`} className="text-callout font-semibold text-forest underline-offset-4 hover:underline">
                    Eaten ~{r0(n.energyKcal)}
                  </Link>
                  <p className="text-caption text-muted-foreground">protein ~{r0(n.proteinG)} g</p>
                </div>
              </li>
            )
          })}
        </ul>
        <div className="border-t border-border/70 px-4 py-3">
          <EstimateNote>kcal and protein are estimates. Meals not yet recorded aren&apos;t compared.</EstimateNote>
        </div>
      </div>
    </Section>
  )
}
