"use client"

import Link from "next/link"
import { Camera, ChevronRight, Flame, NotebookPen } from "lucide-react"
import { Pill } from "@/components/app/page"
import { FoodTile } from "@/components/log/food-tile"
import { MEAL_LABEL } from "@/lib/planning"
import { entryRange, entryTitle, SOURCE_LABEL } from "@/lib/area-b-log"
import { cn } from "@/lib/utils"
import { useActivePlan } from "@/lib/store"
import { recipePhoto } from "@/lib/data/photos"
import type { JournalEntry } from "@/lib/types"

/** Stand-in for a private meal photo. Real photos are never exposed by public URL (§41.10). */
export function PhotoPlaceholder({ className, src }: { className?: string; src?: string }) {
  if (src)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="Your meal photo" className={cn("rounded-xl object-cover", className)} />
  return (
    <div className={cn("grid shrink-0 place-items-center rounded-xl bg-[repeating-linear-gradient(135deg,#eef8df_0_10px,#e2f1cc_10px_20px)] text-lime-text", className)} aria-label="Meal photo (private)" role="img">
      <Camera className="size-5 opacity-70" aria-hidden />
    </div>
  )
}

/** Small macro chip with a colored dot (data color only; the label carries meaning). */
function MacroDot({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <span className="tabular text-caption inline-flex items-center gap-1 text-muted-foreground">
      <span className={cn("size-2 rounded-full", color)} aria-hidden />
      <span className="sr-only">{label} </span>~{Math.round(value)} g
    </span>
  )
}

/** One journal entry as its own card (UI-SPEC §4.4): round photo, meal and time, name, estimates. */
export function EntryCard({ entry, hideNutrition }: { entry: JournalEntry; hideNutrition?: boolean }) {
  const r = entryRange(entry)
  const plan = useActivePlan()
  const time = new Date(entry.consumedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  const pending = entry.analysisStatus === "pending_confirmation"
  const meal = plan?.meals.find((m) => m.id === entry.linkedPlannedMealId || m.linkedJournalEntryId === entry.id)
  const photo = recipePhoto(meal?.recipeId)
  return (
    <Link href={`/log/entry/${entry.id}`} className="flex w-full items-center gap-3.5 rounded-2xl bg-card p-3 pr-4 shadow-card transition-colors hover:bg-muted/40 active:bg-muted">
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- static prototype asset
        <img src={photo} alt="" className="size-[68px] shrink-0 rounded-full object-cover ring-2 ring-card" />
      ) : entry.hasPhoto ? (
        <PhotoPlaceholder className="size-[68px] shrink-0 rounded-full" />
      ) : entry.items[0] ? (
        <FoodTile foodId={entry.items[0].foodId} size="lg" className="size-[68px]" />
      ) : (
        <span className="grid size-[68px] shrink-0 place-items-center rounded-full bg-amber-tint text-amber-text">
          <NotebookPen className="size-6" aria-hidden />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-caption text-muted-foreground">
          <span className="font-semibold text-charcoal">{MEAL_LABEL[entry.mealType]}</span> · {time}
        </p>
        <p className="text-body mt-0.5 line-clamp-2 leading-snug font-semibold">{entryTitle(entry)}</p>
        {pending ? (
          <p className="text-caption mt-1 font-medium text-caution">Waiting for your confirmation</p>
        ) : (
          !hideNutrition && (
            <>
              <p className="tabular text-caption mt-1 inline-flex items-center gap-1 font-medium text-charcoal">
                <Flame className="size-3.5 text-terracotta" aria-hidden />~{Math.round(r.mid.energyKcal)} kcal
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <MacroDot color="bg-protein" label="Protein" value={r.mid.proteinG} />
                <MacroDot color="bg-carbs" label="Carbs" value={r.mid.carbsG} />
                <MacroDot color="bg-fat" label="Fat" value={r.mid.fatG} />
              </div>
            </>
          )
        )}
        <Pill tone={entry.hasPhoto ? "sage" : "neutral"} className="mt-1.5 h-[22px] px-2 text-[11px]">
          {SOURCE_LABEL[entry.source]}
        </Pill>
      </div>
      <ChevronRight className="size-[18px] shrink-0 text-muted-grey" aria-hidden />
    </Link>
  )
}
