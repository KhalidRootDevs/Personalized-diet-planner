"use client"

import Link from "next/link"
import { Check, Flame, NotebookPen, Plus } from "lucide-react"
import { RecipeThumb } from "@/components/app/recipe-thumb"
import { IconTile } from "@/components/app/page"
import { MealActionsSheet } from "@/components/plan/meal-actions"
import { StatusPill } from "@/components/plan/meal-row"
import { SCENE_PHOTO } from "@/lib/data/photos"
import { MEAL_LABEL } from "@/lib/planning"
import { formatTime } from "@/lib/date"
import { recipeNutrition } from "@/lib/nutrition"
import { entryRange, entryTitle } from "@/lib/area-b-log"
import { useRecipeLookup } from "@/lib/area-c-utils"
import { cn } from "@/lib/utils"
import type { JournalEntry, MealType, PlannedMeal } from "@/lib/types"

/** A side photo for the stack, chosen by meal type. Decorative only. */
const SIDE_PHOTO: Partial<Record<MealType, string>> = {
  breakfast: SCENE_PHOTO.fruits,
  lunch: SCENE_PHOTO.salad,
  dinner: SCENE_PHOTO.bhorta,
  afternoon_snack: SCENE_PHOTO.fruits,
  morning_snack: SCENE_PHOTO.fruits,
}

/** Planned recipes vary by portion and cooking oil, so energy is shown as a range (UI-SPEC §1.4). */
function kcalRange(kcal: number) {
  return `${Math.round((kcal * 0.9) / 5) * 5}–${Math.round((kcal * 1.1) / 5) * 5}`
}

/**
 * Home meal card (neo-ui-2 layout, UI-SPEC §4.4): meal type, estimated energy range,
 * overlapping dish photos and a round "+" to record it. Tapping the card opens the
 * daily task actions (§42.16).
 */
export function HomeMealCard({ meal, highlight, isToday }: { meal: PlannedMeal; highlight?: boolean; isToday: boolean }) {
  const lookup = useRecipeLookup()
  const r = lookup(meal.recipeId)
  if (!r) return null
  const kcal = recipeNutrition(r, meal.servings).energyKcal
  const recorded = meal.outcome && meal.outcome !== "unresolved"
  const side = SIDE_PHOTO[meal.mealType]
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card", highlight && "ring-2 ring-lime")}>
      <MealActionsSheet meal={meal}>
        <button className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={`${MEAL_LABEL[meal.mealType]}: ${r.name}. Open meal actions`}>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2">
              <span className="text-headline">{MEAL_LABEL[meal.mealType]}</span>
              {highlight && <span className="shrink-0 whitespace-nowrap rounded-full bg-lime px-2 py-px text-[11px] font-semibold text-charcoal">Up next</span>}
            </p>
            <p className="text-caption truncate text-muted-foreground">
              {formatTime(meal.time)} · {r.name}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="tabular text-callout inline-flex items-center gap-1.5 font-semibold">
                <span className="grid size-6 place-items-center rounded-md bg-coral-tint">
                  <Flame className="size-3.5 text-terracotta" aria-hidden />
                </span>
                {kcalRange(kcal)}
                <span className="text-caption font-normal text-muted-foreground">kcal</span>
              </span>
              <StatusPill meal={meal} />
            </div>
          </div>
          <div className="flex shrink-0 -space-x-4" aria-hidden>
            <RecipeThumb recipe={r} className="size-12 ring-2 ring-card" />
            {side && (
              // eslint-disable-next-line @next/next/no-img-element -- static prototype assets
              <img src={side} alt="" className="size-12 rounded-full object-cover ring-2 ring-card" />
            )}
          </div>
        </button>
      </MealActionsSheet>
      {recorded ? (
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-sage text-forest" role="img" aria-label="Recorded">
          <Check className="size-5" />
        </span>
      ) : isToday ? (
        <Link href={`/log/new?meal=${meal.id}`} aria-label={`Record ${MEAL_LABEL[meal.mealType].toLowerCase()}`} className="grid size-11 shrink-0 place-items-center rounded-full bg-muted text-charcoal transition-colors hover:bg-lime">
          <Plus className="size-5" />
        </Link>
      ) : null}
    </div>
  )
}

/** A meal logged outside the plan, in the same card anatomy. */
export function HomeEntryCard({ entry }: { entry: JournalEntry }) {
  const range = entryRange(entry)
  return (
    <Link href={`/log/entry/${entry.id}`} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card transition-colors hover:bg-muted/40">
      <div className="min-w-0 flex-1">
        <p className="text-headline">{MEAL_LABEL[entry.mealType]}</p>
        <p className="text-caption truncate text-muted-foreground">
          {formatTime(entry.consumedAt.slice(11, 16))} · {entryTitle(entry)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="tabular text-callout inline-flex items-center gap-1.5 font-semibold">
            <span className="grid size-6 place-items-center rounded-md bg-coral-tint">
              <Flame className="size-3.5 text-terracotta" aria-hidden />
            </span>
            {Math.round(range.low)}–{Math.round(range.high)}
            <span className="text-caption font-normal text-muted-foreground">kcal</span>
          </span>
          <span className="inline-flex h-[22px] items-center rounded-full bg-muted px-2 text-[11px] font-medium">Not in plan</span>
        </div>
      </div>
      <IconTile tone="amber" size="lg">
        <NotebookPen />
      </IconTile>
    </Link>
  )
}
