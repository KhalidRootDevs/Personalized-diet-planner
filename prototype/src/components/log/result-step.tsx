"use client"

import Link from "next/link"
import { useState } from "react"
import { Bookmark, CircleCheck, Lightbulb } from "lucide-react"
import { FeatureBadge } from "@/components/app/badges"
import { Button } from "@/components/ui/button"
import { EstimateNote, NutrientBar } from "@/components/app/nutrition"
import { CautionNote } from "@/components/app/alerts"
import { IconTile, Pill, StickyFooter, Surface } from "@/components/app/page"
import { useApp, useActivePlan, useSelfProfile } from "@/lib/store"
import { adultTargets } from "@/lib/nutrition"
import { nowHHMM, todayISO, uid } from "@/lib/date"
import { MEAL_LABEL } from "@/lib/planning"
import { compareWithRecipe, dayRange, describeDiff, entriesFor, entryRange, entryTitle, itemsKey, remainingMeals, sameMealCount, supportiveSuggestion } from "@/lib/area-b-log"
import { mealStatus, STATUS_STYLE, useRecipeLookup } from "@/lib/area-c-utils"
import { RecipeThumb } from "@/components/app/recipe-thumb"
import { cn } from "@/lib/utils"

/** After confirming (§41.4): the meal estimate as a range, today so far, and one supportive suggestion. */
export function ResultStep({ entryId, firstTime }: { entryId: string; firstTime?: boolean }) {
  const entry = useApp((s) => s.journal.find((e) => e.id === entryId))
  const journal = useApp((s) => s.journal)
  const profile = useApp((s) => s.profiles.find((p) => p.id === entry?.profileId))
  const self = useSelfProfile()
  const plan = useActivePlan()
  const lookup = useRecipeLookup()
  const savedMeals = useApp((s) => s.savedMeals)
  const [memorySaved, setMemorySaved] = useState(false)
  if (!entry || !profile) return null

  if (profile.type !== "adult") {
    return (
      <div className="flex flex-1 flex-col">
        <div className="px-gutter space-y-6 pt-8 pb-8">
        <Done title="Saved to the diary" body={`${profile.name}'s entry is recorded.`} />
        {firstTime && <p className="text-callout text-center">Added to the food introduction tracker.</p>}
        <CautionNote title="Watch for reactions after new foods">
          Hives, vomiting or swelling can mean an allergy. Trouble breathing or swelling of the face or tongue needs{" "}
          <Link href="/safety/emergency" className="font-medium underline underline-offset-2">
            emergency help
          </Link>
          .
        </CautionNote>
        </div>
        <StickyFooter>
          <Button asChild size="lg" className="w-full">
            <Link href="/log">Done</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/child/foods">Open introduction tracker</Link>
          </Button>
        </StickyFooter>
      </div>
    )
  }

  const r = entryRange(entry)
  const today = todayISO()
  const dayEntries = entriesFor(journal, profile.id, entry.consumedAt.slice(0, 10))
  const day = dayRange(dayEntries)
  const targets = adultTargets(self ?? profile)
  const rest = entry.consumedAt.slice(0, 10) === today ? remainingMeals((plan?.meals ?? []).filter((m) => m.date === today && m.id !== entry.linkedPlannedMealId), nowHHMM()) : []
  const next = rest[0] ? { meal: rest[0], recipe: lookup(rest[0].recipeId) } : undefined
  const tip = supportiveSuggestion(day.mid, targets, next)
  // Planned vs actual for this meal (§41.5) and its unified status (§14.6).
  const planned = plan?.meals.find((m) => m.id === entry.linkedPlannedMealId)
  const plannedRecipe = planned ? lookup(planned.recipeId) : undefined
  const diff = planned && plannedRecipe && planned.outcome !== "eaten_as_planned" ? describeDiff(compareWithRecipe(plannedRecipe, planned.servings, entry.items)) : ""
  // Meal memory (§42.3.2): after the same foods are confirmed 3+ times, offer to save them.
  const repeats = sameMealCount(journal, profile.id, entry.items)
  const offerMemory = entry.source !== "saved" && repeats >= 3 && !savedMeals.some((m) => itemsKey(m.items) === itemsKey(entry.items))

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-gutter space-y-6 pt-8 pb-8">
        <Done title="Meal saved" body="Thanks for logging — every entry makes your plan more useful." />
        <Surface padding="lg" className="text-center">
          <p className="text-caption text-muted-foreground">This meal · estimate</p>
          <p className="text-metric mt-1">
            ~{Math.round(r.mid.energyKcal)}
            <span className="text-callout ml-1 font-normal tracking-normal text-muted-foreground">kcal</span>
          </p>
          <p className="tabular text-caption mt-0.5 text-muted-foreground">
            Likely {Math.round(r.low)}–{Math.round(r.high)} kcal · protein ~{Math.round(r.mid.proteinG)} g
          </p>
        </Surface>
        {planned && (
          <Surface className="flex items-start gap-3">
            {plannedRecipe && <RecipeThumb recipe={plannedRecipe} size="sm" />}
            <div className="min-w-0 flex-1">
              <p className="text-caption text-muted-foreground">Recorded against your planned {MEAL_LABEL[planned.mealType].toLowerCase()}</p>
              <p className="text-body mt-0.5 font-medium">{plannedRecipe?.name}</p>
              <Pill className={cn("mt-1 h-[22px] px-2 text-[11px]", STATUS_STYLE[mealStatus(planned).tone])}>
                {mealStatus(planned).label}
              </Pill>
              {diff && <p className="text-caption mt-1.5 text-muted-foreground">Compared with the plan: {diff}.</p>}
            </div>
          </Surface>
        )}
        {(offerMemory || memorySaved) && (
          <Surface tone="sage">
            <p className="text-overline flex items-center gap-1.5 text-forest">
              <Bookmark className="size-3.5" aria-hidden /> Meal memory <FeatureBadge feature="saved_meals" />
            </p>
            {memorySaved ? (
              <p className="text-callout mt-2">Saved. Next time you log {MEAL_LABEL[entry.mealType].toLowerCase()}, we&apos;ll ask if it&apos;s your usual.</p>
            ) : (
              <>
                <p className="text-headline mt-2">You&apos;ve had this {repeats} times recently</p>
                <p className="text-callout mt-0.5 text-charcoal/80">Save it as your usual {MEAL_LABEL[entry.mealType].toLowerCase()} for one-tap logging?</p>
                <Button
                  variant="outline"
                  className="mt-3 w-full"
                  onClick={() => {
                    useApp.getState().saveMeal({ id: uid("sm"), name: entryTitle(entry), mealType: entry.mealType, items: entry.items.map((i) => ({ foodId: i.foodId, grams: i.grams })), timesConfirmed: repeats })
                    setMemorySaved(true)
                  }}
                >
                  Save as my usual
                </Button>
              </>
            )}
          </Surface>
        )}
        {targets.supported && (
          <Surface padding="lg" className="space-y-4">
            <p className="text-headline">{entry.consumedAt.slice(0, 10) === today ? "Today so far" : "That day so far"}</p>
            <NutrientBar label="Energy" value={day.mid.energyKcal} low={targets.energy.low} high={targets.energy.high} unit="kcal" estimate />
            <NutrientBar label="Protein" value={day.mid.proteinG} low={targets.proteinG.low} high={targets.proteinG.high} unit="g" estimate />
            <div className="border-t border-border/70 pt-3">
              <EstimateNote>
                Based on {dayEntries.length} logged meal{dayEntries.length === 1 ? "" : "s"}
                {rest.length > 0 ? `; ${rest.length} planned meal${rest.length === 1 ? " is" : "s are"} still to come.` : "."}
              </EstimateNote>
            </div>
          </Surface>
        )}
        <div className="flex gap-3 rounded-2xl bg-sage/70 p-4">
          <IconTile tone="white" size="sm">
            <Lightbulb />
          </IconTile>
          <div className="min-w-0">
            <p className="text-callout font-semibold">{tip.title}</p>
            <p className="text-callout mt-0.5 text-charcoal/80">{tip.body}</p>
          </div>
        </div>
      </div>
      <StickyFooter>
        <Button asChild size="lg" className="w-full">
          <Link href="/home">Done</Link>
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <Link href={`/log/entry/${entry.id}`}>View entry</Link>
        </Button>
      </StickyFooter>
    </div>
  )
}

function Done({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="grid size-16 place-items-center rounded-full bg-sage text-forest">
        <CircleCheck className="size-8" />
      </span>
      <p className="text-title mt-4">{title}</p>
      <p className="text-callout mt-1 max-w-[18rem] text-muted-foreground">{body}</p>
    </div>
  )
}
