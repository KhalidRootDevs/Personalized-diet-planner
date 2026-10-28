"use client"

import Link from "next/link"
import { Section } from "@/components/app/page"
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

  return (
    <Section title="Planned vs actual" badge={<FeatureBadge feature="planned_vs_actual" />}>
      <div className="rounded-2xl border bg-card">
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 border-b px-4 py-2 text-xs text-muted-foreground">
          <span>Meal</span>
          <span className="w-16 text-right">Planned</span>
          <span className="w-16 text-right">Eaten</span>
        </div>
        <ul className="divide-y">
          {rows.map(({ m, recipe, planned, actual, entry }) => {
            const s = mealStatus(m)
            return (
              <li key={m.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{MEAL_LABEL[m.mealType]}</p>
                  <p className="truncate text-xs text-muted-foreground">{recipe?.name}</p>
                  <span className={cn("mt-1 inline-flex rounded-full px-1.5 py-px text-[10px] font-medium", STATUS_STYLE[s.tone])}>{s.label}</span>
                </div>
                <span className="tabular w-16 text-right text-sm">~{Math.round(planned)}</span>
                <span className="tabular w-16 text-right text-sm font-medium">
                  {actual === null ? (
                    <Link href={`/log/new?meal=${m.id}`} className="text-xs font-medium text-forest underline underline-offset-2">
                      Record
                    </Link>
                  ) : entry ? (
                    <Link href={`/log/entry/${entry.id}`} className="underline-offset-2 hover:underline">
                      ~{Math.round(actual)}
                    </Link>
                  ) : (
                    `~${Math.round(actual)}`
                  )}
                </span>
              </li>
            )
          })}
        </ul>
        <div className="border-t px-4 py-3 text-sm">
          {plannedSum === 0 ? (
            <p className="text-muted-foreground">Record a meal to compare it with your plan.</p>
          ) : Math.abs(diff) < plannedSum * 0.1 ? (
            <p>Recorded meals are close to what you planned.</p>
          ) : diff > 0 ? (
            <p>
              Recorded meals came to about <span className="tabular font-medium">{Math.round(diff)} kcal</span> more than planned. Your next meals stay the same — no need to cut back.
            </p>
          ) : (
            <p>
              Recorded meals came to about <span className="tabular font-medium">{Math.round(-diff)} kcal</span> less than planned. Eat your next meal as usual; there&apos;s no need for a bigger one.
            </p>
          )}
          <EstimateNote className="mt-2">kcal values are estimates. Meals not yet recorded aren&apos;t compared.</EstimateNote>
        </div>
      </div>
    </Section>
  )
}
