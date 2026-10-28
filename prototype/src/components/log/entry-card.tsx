"use client"

import Link from "next/link"
import { Camera, ChevronRight, NotebookPen } from "lucide-react"
import { Pill } from "@/components/app/page"
import { FoodTile } from "@/components/log/food-tile"
import { MEAL_LABEL } from "@/lib/planning"
import { entryRange, entryTitle, SOURCE_LABEL } from "@/lib/area-b-log"
import { cn } from "@/lib/utils"
import type { JournalEntry } from "@/lib/types"

/** Stand-in for a private meal photo. Real photos are never exposed by public URL (§41.10). */
export function PhotoPlaceholder({ className, src }: { className?: string; src?: string }) {
  if (src)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="Your meal photo" className={cn("rounded-xl object-cover", className)} />
  return (
    <div className={cn("grid shrink-0 place-items-center rounded-xl bg-[repeating-linear-gradient(135deg,#dce7d8_0_10px,#e6eee2_10px_20px)] text-forest", className)} aria-label="Meal photo (private)" role="img">
      <Camera className="size-5 opacity-70" aria-hidden />
    </div>
  )
}

/** One journal entry as a row inside a grouped list (UI-SPEC §4.4). */
export function EntryCard({ entry, hideNutrition }: { entry: JournalEntry; hideNutrition?: boolean }) {
  const r = entryRange(entry)
  const time = new Date(entry.consumedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  const pending = entry.analysisStatus === "pending_confirmation"
  return (
    <Link href={`/log/entry/${entry.id}`} className="flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 active:bg-muted">
      {entry.hasPhoto ? (
        <PhotoPlaceholder className="size-12 shrink-0" />
      ) : entry.items[0] ? (
        <FoodTile foodId={entry.items[0].foodId} className="size-12" />
      ) : (
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-muted text-charcoal">
          <NotebookPen className="size-5" aria-hidden />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-caption text-muted-foreground">
          {MEAL_LABEL[entry.mealType]} · {time}
        </p>
        <p className="text-body line-clamp-2 font-medium">{entryTitle(entry)}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <Pill tone={entry.hasPhoto ? "sage" : "neutral"} className="h-[22px] px-2 text-[11px]">
            {SOURCE_LABEL[entry.source]}
          </Pill>
          {pending ? (
            <span className="text-caption font-medium text-caution">Waiting for your confirmation</span>
          ) : (
            !hideNutrition && (
              <span className="tabular text-caption text-muted-foreground">
                ~{Math.round(r.mid.energyKcal)} kcal · {Math.round(r.mid.proteinG)} g protein
              </span>
            )
          )}
        </div>
      </div>
      <ChevronRight className="size-[18px] shrink-0 text-muted-grey" aria-hidden />
    </Link>
  )
}
