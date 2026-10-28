"use client"

import Link from "next/link"
import { Camera, ChevronRight, NotebookPen } from "lucide-react"
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
    <div className={cn("grid place-items-center rounded-xl bg-[repeating-linear-gradient(135deg,#dce7d8_0_10px,#e6eee2_10px_20px)] text-forest", className)} aria-label="Meal photo (private)" role="img">
      <Camera className="size-5 opacity-70" aria-hidden />
    </div>
  )
}

export function EntryCard({ entry, hideNutrition }: { entry: JournalEntry; hideNutrition?: boolean }) {
  const r = entryRange(entry)
  const time = new Date(entry.consumedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  return (
    <Link href={`/log/entry/${entry.id}`} className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-muted/50">
      {entry.hasPhoto ? (
        <PhotoPlaceholder className="size-12 shrink-0" />
      ) : (
        <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
          <NotebookPen className="size-5" aria-hidden />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">
          {MEAL_LABEL[entry.mealType]} · {time} · {SOURCE_LABEL[entry.source]}
        </p>
        <p className="truncate font-medium">{entryTitle(entry)}</p>
        {entry.analysisStatus === "pending_confirmation" ? (
          <p className="text-xs font-medium text-caution">Waiting for your confirmation</p>
        ) : (
          !hideNutrition && (
            <p className="tabular text-xs text-muted-foreground">
              ~{Math.round(r.mid.energyKcal)} kcal <span className="text-muted-grey">({Math.round(r.low)}–{Math.round(r.high)})</span> · {Math.round(r.mid.proteinG)} g protein
            </p>
          )
        )}
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-grey" aria-hidden />
    </Link>
  )
}
