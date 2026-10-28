"use client"

import Link from "next/link"
import { Section, StatTile } from "@/components/app/page"
import { FeatureBadge } from "@/components/app/badges"
import { EstimateNote } from "@/components/app/nutrition"
import { MEAL_LABEL } from "@/lib/planning"
import { entryNutrition, plannedMealNutrition } from "@/lib/nutrition"
import { mealStatus, STATUS_STYLE, useRecipeLookup } from "@/lib/area-c-utils"
import { cn } from "@/lib/utils"
import type { JournalEntry, PlannedMeal } from "@/lib/types"

/**
 * Planned vs actual (§41.5). Neutral wording only: a difference is information,
 * not a failure, and never triggers restriction at the next meal (§41.6).
 */
export function PlannedVsActual({ meals, entries }: { meals: PlannedMeal[]; entries: JournalEntry[] }) {
  const lookup = useRecipeLookup()
  const sorted = [...meals].sort((a, b) => a.time.localeCompare(b.time))
  const rows = sorted.map((m) => {
    const planned = plannedMealNutrition(m).energyKcal
    const entry = entries.find((e) => e.id === m.linkedJournalEntryId || e.linkedPlannedMealId === m.id)
    const actual = entry ? entryNutrition(entry).energyKcal : m.outcome === "eaten_as_planned" ? planned : m.outcome === "skipped" ? 0 : null
    return { m, recipe: lookup(m.recipeId), planned, actual, entry }
  })
  const compared = rows.filter((r) => r.actual !== null)
  const plannedSum = compared.reduce((s, r) => s + r.planned, 0)
  const actualSum = compared.reduce((s, r) => s + (r.actual ?? 0), 0)
  const diff = actualSum - plannedSum

  const message =
    plannedSum === 0
      ? "Record a meal to compare it with your plan."
      : Math.abs(diff) < plannedSum * 0.1
        ? "Recorded meals are close to what you planned."
        : diff > 0
          ? `Recorded meals came to about ${Math.round(diff)} kcal more than planned. Your next meals stay the same — no need to cut back.`
          : `Recorded meals came to about ${Math.round(-diff)} kcal less than planned. Eat your next meal as usual; there's no need for a bigger one.`

  return (
    <Section title="Planned vs actual" badge={<FeatureBadge feature="planned_vs_actual" />}>
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card">
        <div className="p-4">
          <div className="grid grid-cols-2 gap-2">
            <StatTile label="Planned" value={`~${Math.round(plannedSum).toLocaleString("en-US")}`} unit="kcal" />
            <StatTile label="Eaten · estimate" value={`~${Math.round(actualSum).toLocaleString("en-US")}`} unit="kcal" />
          </div>
          <p className="text-callout mt-3">{message}</p>
        </div>
        <ul className="divide-y divide-border/70 border-t border-border/70">
          {rows.map(({ m, recipe, planned, actual, entry }) => {
            const st = mealStatus(m)
            return (
              <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-caption text-muted-foreground">{MEAL_LABEL[m.mealType]}</p>
                  <p className="text-callout truncate font-medium">{recipe?.name}</p>
                  <span className={cn("mt-1 inline-flex h-[22px] items-center rounded-full px-2 text-[11px] font-medium", STATUS_STYLE[st.tone])}>{st.label}</span>
                </div>
                {actual === null ? (
                  <div className="shrink-0 text-right">
                    <p className="tabular text-caption text-muted-foreground">Planned ~{Math.round(planned)}</p>
                    <Link href={`/log/new?meal=${m.id}`} className="text-callout mt-1 inline-flex h-8 items-center rounded-lg border border-input bg-card px-3 font-semibold text-forest transition-colors hover:bg-muted">
                      Record
                    </Link>
                  </div>
                ) : (
                  <div className="tabular shrink-0 text-right">
                    <p className="text-caption text-muted-foreground">Planned ~{Math.round(planned)}</p>
                    {entry ? (
                      <Link href={`/log/entry/${entry.id}`} className="text-callout font-semibold underline-offset-4 hover:underline">
                        Eaten ~{Math.round(actual)}
                      </Link>
                    ) : (
                      <p className="text-callout font-semibold">Eaten ~{Math.round(actual)}</p>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
        <div className="border-t border-border/70 px-4 py-3">
          <EstimateNote>kcal values are estimates. Meals not yet recorded aren&apos;t compared.</EstimateNote>
        </div>
      </div>
    </Section>
  )
}
