"use client"

import Link from "next/link"
import { CircleCheck, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EstimateNote, NutrientBar } from "@/components/app/nutrition"
import { CautionNote } from "@/components/app/alerts"
import { IconTile, StickyFooter, Surface } from "@/components/app/page"
import { useApp, useActivePlan, useSelfProfile } from "@/lib/store"
import { adultTargets } from "@/lib/nutrition"
import { nowHHMM, todayISO } from "@/lib/date"
import { dayRange, entriesFor, entryRange, remainingMeals, supportiveSuggestion } from "@/lib/area-b-log"
import { useRecipeLookup } from "@/lib/area-c-utils"

/** After confirming (§41.4): the meal estimate as a range, today so far, and one supportive suggestion. */
export function ResultStep({ entryId, firstTime }: { entryId: string; firstTime?: boolean }) {
  const entry = useApp((s) => s.journal.find((e) => e.id === entryId))
  const journal = useApp((s) => s.journal)
  const profile = useApp((s) => s.profiles.find((p) => p.id === entry?.profileId))
  const self = useSelfProfile()
  const plan = useActivePlan()
  const lookup = useRecipeLookup()
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
  const rest = remainingMeals((plan?.meals ?? []).filter((m) => m.date === today && m.id !== entry.linkedPlannedMealId), nowHHMM())
  const next = rest[0] ? { meal: rest[0], recipe: lookup(rest[0].recipeId) } : undefined
  const tip = supportiveSuggestion(day.mid, targets, next)

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
        {targets.supported && (
          <Surface padding="lg" className="space-y-4">
            <p className="text-headline">Today so far</p>
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
