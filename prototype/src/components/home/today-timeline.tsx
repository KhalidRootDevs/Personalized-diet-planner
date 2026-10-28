"use client"

import Link from "next/link"
import { NotebookPen } from "lucide-react"
import { IconTile, Pill } from "@/components/app/page"
import { MealListRow } from "@/components/plan/meal-row"
import { MEAL_LABEL } from "@/lib/planning"
import { formatTime, nowHHMM } from "@/lib/date"
import { entryTitle } from "@/lib/area-b-log"
import type { JournalEntry, PlannedMeal } from "@/lib/types"

/**
 * Today's meals in time order (§44.6). Planned meals use the shared meal row (UI-SPEC §4.4)
 * and open the daily actions sheet (§42.16); meals logged outside the plan follow the same anatomy.
 */
export function TodayTimeline({ meals, entries }: { meals: PlannedMeal[]; entries: JournalEntry[] }) {
  const now = nowHHMM()
  const linked = new Set(meals.map((m) => m.linkedJournalEntryId).filter(Boolean))
  const extra = entries.filter((e) => !linked.has(e.id) && !e.linkedPlannedMealId)
  const sorted = [...meals].sort((a, b) => a.time.localeCompare(b.time))
  const nextId = sorted.find((m) => !m.outcome && m.time >= now)?.id

  const rows = [
    ...sorted.map((m) => ({ time: m.time, key: m.id, node: <MealListRow meal={m} highlight={m.id === nextId} highlightLabel="Up next" /> })),
    ...extra.map((e) => ({
      time: e.consumedAt.slice(11, 16),
      key: e.id,
      node: (
        <Link href={`/log/entry/${e.id}`} className="flex w-full items-center gap-3.5 rounded-2xl bg-card p-3 pr-4 text-left shadow-card transition-colors hover:bg-muted/40 active:bg-muted">
          <IconTile tone="amber" className="size-[68px] [&_svg]:size-7">
            <NotebookPen />
          </IconTile>
          <div className="min-w-0 flex-1">
            <p className="text-caption text-muted-foreground">
              <span className="font-semibold text-charcoal">{MEAL_LABEL[e.mealType]}</span> · {formatTime(e.consumedAt.slice(11, 16))}
            </p>
            <p className="text-body mt-0.5 line-clamp-2 font-semibold">{entryTitle(e)}</p>
            <div className="mt-1">
              <Pill tone="neutral" className="h-[22px] px-2 text-[11px]">
                Not in plan
              </Pill>
            </div>
          </div>
        </Link>
      ),
    })),
  ].sort((a, b) => a.time.localeCompare(b.time))

  if (!rows.length) return <p className="text-callout rounded-2xl bg-card p-4 text-muted-foreground shadow-card">No meals planned for today.</p>

  return (
    <ol className="space-y-3">
      {rows.map((r) => (
        <li key={r.key}>{r.node}</li>
      ))}
    </ol>
  )
}
