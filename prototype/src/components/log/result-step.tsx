"use client"

import Link from "next/link"
import { CircleCheck, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EstimateNote, NutrientBar } from "@/components/app/nutrition"
import { CautionNote } from "@/components/app/alerts"
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
      <div className="flex flex-1 flex-col gap-5 px-4 pt-6 pb-8">
        <Done title="Saved to the diary" body={`${profile.name}'s entry is recorded.`} />
        {firstTime && <p className="text-center text-sm">Added to the food introduction tracker.</p>}
        <CautionNote title="Watch for reactions after new foods">
          Hives, vomiting or swelling can mean an allergy. Trouble breathing or swelling of the face or tongue needs{" "}
          <Link href="/safety/emergency" className="font-medium underline underline-offset-2">
            emergency help
          </Link>
          .
        </CautionNote>
        <div className="mt-auto grid gap-2">
          <Button asChild size="lg">
            <Link href="/log">Done</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/child/foods">Open introduction tracker</Link>
          </Button>
        </div>
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
    <div className="flex flex-1 flex-col gap-5 px-4 pt-6 pb-8">
      <Done title="Meal saved" body="Thanks for logging — every entry makes your plan more useful." />
      <div className="rounded-2xl border bg-card p-4 text-center">
        <p className="text-xs text-muted-foreground">This meal, estimated</p>
        <p className="tabular text-3xl font-semibold">~{Math.round(r.mid.energyKcal)} kcal</p>
        <p className="tabular text-sm text-muted-foreground">
          Likely {Math.round(r.low)}–{Math.round(r.high)} kcal · protein ~{Math.round(r.mid.proteinG)} g
        </p>
      </div>
      {targets.supported && (
        <div className="space-y-3 rounded-2xl border bg-card p-4">
          <p className="font-medium">Today so far</p>
          <NutrientBar label="Energy" value={day.mid.energyKcal} low={targets.energy.low} high={targets.energy.high} unit="kcal" estimate />
          <NutrientBar label="Protein" value={day.mid.proteinG} low={targets.proteinG.low} high={targets.proteinG.high} unit="g" estimate />
          <EstimateNote>
            Based on {dayEntries.length} logged meal{dayEntries.length === 1 ? "" : "s"}
            {rest.length > 0 ? `; ${rest.length} planned meal${rest.length === 1 ? " is" : "s are"} still to come.` : "."}
          </EstimateNote>
        </div>
      )}
      <div className="flex gap-3 rounded-2xl bg-sage p-4">
        <Lightbulb className="mt-0.5 size-5 shrink-0 text-forest" aria-hidden />
        <div>
          <p className="font-semibold">{tip.title}</p>
          <p className="text-sm text-charcoal/80">{tip.body}</p>
        </div>
      </div>
      <div className="mt-auto grid gap-2">
        <Button asChild size="lg">
          <Link href="/home">Done</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href={`/log/entry/${entry.id}`}>View entry</Link>
        </Button>
      </div>
    </div>
  )
}

function Done({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="grid size-14 place-items-center rounded-full bg-sage text-forest">
        <CircleCheck className="size-7" />
      </div>
      <p className="text-xl font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  )
}
