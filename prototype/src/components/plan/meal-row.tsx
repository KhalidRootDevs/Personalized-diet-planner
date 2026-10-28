"use client"

/** Meal row — same anatomy as Home's timeline (UI-SPEC §4.4). */
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

/** Meal row — same anatomy as Home's timeline (spec §4.4). Opens the meal actions sheet. */
export function MealListRow({ meal, highlight, highlightLabel }: { meal: PlannedMeal; highlight?: boolean; highlightLabel?: string }) {
  const lookup = useRecipeLookup()
  const r = lookup(meal.recipeId)
  if (!r) return null
  const kcal = Math.round(recipeNutrition(r, meal.servings).energyKcal)
  const extras = [`${r.prepMinutes + r.cookMinutes} min`, meal.servings !== 1 && `${meal.servings} servings`, meal.prepLater && "Prep ahead"].filter(Boolean).join(" · ")
  return (
    <MealActionsSheet meal={meal}>
      <button className={cn("flex w-full items-center gap-3 py-3 pr-4 pl-2 text-left transition-colors hover:bg-muted/50 active:bg-muted", highlight && "bg-sage/35 hover:bg-sage/50")}>
        <TimeCol time={meal.time} />
        <RecipeThumb recipe={r} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-caption text-muted-foreground">
            {MEAL_LABEL[meal.mealType]}
            {highlight && highlightLabel ? <span className="font-semibold text-forest"> · {highlightLabel}</span> : extras && ` · ${extras}`}
          </p>
          <p className="text-body line-clamp-2 font-medium">{r.name}</p>
          <div className="mt-1 flex items-center gap-2">
            <StatusPill meal={meal} />
            <span className="tabular text-caption text-muted-foreground">
              ~{kcal} kcal
            </span>
          </div>
        </div>
      </button>
    </MealActionsSheet>
  )
}

/** Grouped list of meal rows (one card, hairline dividers). */
export function MealList({ meals, highlightId, highlightLabel }: { meals: PlannedMeal[]; highlightId?: string; highlightLabel?: string }) {
  return (
    <ol className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/80 bg-card">
      {meals.map((m) => (
        <li key={m.id}>
          <MealListRow meal={m} highlight={m.id === highlightId} highlightLabel={highlightLabel} />
        </li>
      ))}
    </ol>
  )
}

