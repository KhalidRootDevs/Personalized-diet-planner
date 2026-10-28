"use client"

import Link from "next/link"
import { NotebookPen } from "lucide-react"
import { RecipeThumb } from "@/components/app/recipe-thumb"
import { IconTile, Pill } from "@/components/app/page"
import { MealActionsSheet } from "@/components/plan/meal-actions"
import { MEAL_LABEL } from "@/lib/planning"
import { formatTime, nowHHMM } from "@/lib/date"
import { plannedMealNutrition } from "@/lib/nutrition"
import { entryTitle } from "@/lib/area-b-log"
import { mealStatus, STATUS_STYLE, useRecipeLookup } from "@/lib/area-c-utils"
import { cn } from "@/lib/utils"
import type { JournalEntry, PlannedMeal } from "@/lib/types"

function TimeCol({ time }: { time: string }) {
  const [hm, ap] = formatTime(time).split(" ")
  return (
    <div className="tabular w-12 shrink-0 text-right">
      <p className="text-callout leading-tight font-semibold">{hm}</p>
      <p className="text-[11px] leading-tight font-medium text-muted-foreground">{ap}</p>
    </div>
  )
}

/** Today's meals in time order (§44.6, UI-SPEC §5.1). Each row opens the daily actions sheet (§42.16). */
export function TodayTimeline({ meals, entries }: { meals: PlannedMeal[]; entries: JournalEntry[] }) {
  const lookup = useRecipeLookup()
  const now = nowHHMM()
  const linked = new Set(meals.map((m) => m.linkedJournalEntryId).filter(Boolean))
  const extra = entries.filter((e) => !linked.has(e.id) && !e.linkedPlannedMealId)
  const sorted = [...meals].sort((a, b) => a.time.localeCompare(b.time))
  const nextId = sorted.find((m) => !m.outcome && m.time >= now)?.id

  type Row = { time: string; node: React.ReactNode; key: string }
  const rowCls = "flex w-full items-center gap-3 py-3 pr-4 pl-2 text-left transition-colors hover:bg-muted/50 active:bg-muted"
  const rows: Row[] = [
    ...sorted.map((m) => {
      const recipe = lookup(m.recipeId)
      const status = mealStatus(m)
      const n = plannedMealNutrition(m)
      const isNext = m.id === nextId
      return {
        time: m.time,
        key: m.id,
        node: (
          <MealActionsSheet meal={m}>
            <button className={cn(rowCls, isNext && "bg-sage/35 hover:bg-sage/50")}>
              <TimeCol time={m.time} />
              {recipe && <RecipeThumb recipe={recipe} size="sm" />}
              <div className="min-w-0 flex-1">
                <p className="text-caption flex items-center gap-1.5 text-muted-foreground">
                  {MEAL_LABEL[m.mealType]}
                  {isNext && <span className="font-semibold text-forest">· Up next</span>}
                </p>
                <p className="text-body line-clamp-2 font-medium">{recipe?.name ?? "Meal"}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className={cn("inline-flex h-[22px] shrink-0 items-center rounded-full px-2 text-[11px] font-medium", STATUS_STYLE[status.tone])}>{status.label}</span>
                  <span className="tabular text-caption text-muted-foreground">~{Math.round(n.energyKcal)} kcal</span>
                </div>
              </div>
            </button>
          </MealActionsSheet>
        ),
      }
    }),
    ...extra.map((e) => ({
      time: e.consumedAt.slice(11, 16),
      key: e.id,
      node: (
        <Link href={`/log/entry/${e.id}`} className={rowCls}>
          <TimeCol time={e.consumedAt.slice(11, 16)} />
          <IconTile tone="muted" className="size-11 rounded-lg">
            <NotebookPen />
          </IconTile>
          <div className="min-w-0 flex-1">
            <p className="text-caption text-muted-foreground">{MEAL_LABEL[e.mealType]}</p>
            <p className="text-body truncate font-medium">{entryTitle(e)}</p>
          </div>
          <Pill tone="neutral">Not in plan</Pill>
        </Link>
      ),
    })),
  ].sort((a, b) => a.time.localeCompare(b.time))

  if (!rows.length) return <p className="text-callout rounded-2xl border border-border/80 bg-card p-4 text-muted-foreground">No meals planned for today.</p>

  return (
    <ol className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/80 bg-card">
      {rows.map((r) => (
        <li key={r.key}>{r.node}</li>
      ))}
    </ol>
  )
}
