"use client"

/** Meal row — same anatomy as Home's timeline (UI-SPEC §4.4). */
import { Flame } from "lucide-react"
import { RecipeThumb } from "@/components/app/recipe-thumb"
import { MealActionsSheet } from "@/components/plan/meal-actions"
import { MEAL_LABEL } from "@/lib/planning"
import { formatTime } from "@/lib/date"
import { recipeNutrition } from "@/lib/nutrition"
import { STATUS_STYLE, mealStatus, useRecipeLookup } from "@/lib/area-c-utils"
import { cn } from "@/lib/utils"
import type { PlannedMeal } from "@/lib/types"

export function StatusPill({ meal, className }: { meal: PlannedMeal; className?: string }) {
  const s = mealStatus(meal)
  return <span className={cn("inline-flex h-[22px] shrink-0 items-center rounded-full px-2 text-[11px] font-medium", STATUS_STYLE[s.tone], className)}>{s.label}</span>
}

export function TimeCol({ time }: { time: string }) {
  const [hm, ap] = formatTime(time).split(" ")
  return (
    <div className="tabular w-12 shrink-0 text-right">
      <p className="text-callout leading-tight font-semibold">{hm}</p>
      <p className="text-[11px] leading-tight font-medium text-muted-foreground">{ap}</p>
    </div>
  )
}

/**
 * Meal card (UI-SPEC §4.4): round dish photo, meal and time, name, estimated energy and
 * status. One card per meal; opens the meal actions sheet.
 */
export function MealListRow({ meal, highlight, highlightLabel }: { meal: PlannedMeal; highlight?: boolean; highlightLabel?: string }) {
  const lookup = useRecipeLookup()
  const r = lookup(meal.recipeId)
  if (!r) return null
  const kcal = Math.round(recipeNutrition(r, meal.servings).energyKcal)
  const extras = [`${r.prepMinutes + r.cookMinutes} min`, meal.servings !== 1 && `${meal.servings} servings`, meal.prepLater && "Prep ahead"].filter(Boolean).join(" · ")
  return (
    <MealActionsSheet meal={meal}>
      <button
        className={cn(
          "flex w-full items-center gap-3.5 rounded-2xl bg-card p-3 pr-4 text-left shadow-card transition-colors hover:bg-muted/40 active:bg-muted",
          highlight && "ring-2 ring-lime",
        )}
      >
        <RecipeThumb recipe={r} size="lg" className="size-[68px]" />
        <div className="min-w-0 flex-1">
          <p className="text-caption flex items-center gap-1.5 text-muted-foreground">
            <span className="font-semibold text-charcoal">{MEAL_LABEL[meal.mealType]}</span> · {formatTime(meal.time)}
            {highlight && highlightLabel && <span className="rounded-full bg-lime px-2 py-px text-[11px] font-semibold text-charcoal">{highlightLabel}</span>}
          </p>
          <p className="text-body mt-0.5 line-clamp-2 leading-snug font-semibold">{r.name}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="tabular text-caption inline-flex items-center gap-1 font-medium text-charcoal">
              <Flame className="size-3.5 text-terracotta" aria-hidden />~{kcal} kcal
            </span>
            {!highlight && extras && <span className="text-caption text-muted-foreground">· {extras}</span>}
            <StatusPill meal={meal} />
          </div>
        </div>
      </button>
    </MealActionsSheet>
  )
}

/** List of meal cards. */
export function MealList({ meals, highlightId, highlightLabel }: { meals: PlannedMeal[]; highlightId?: string; highlightLabel?: string }) {
  return (
    <ol className="space-y-3">
      {meals.map((m) => (
        <li key={m.id}>
          <MealListRow meal={m} highlight={m.id === highlightId} highlightLabel={highlightLabel} />
        </li>
      ))}
    </ol>
  )
}
