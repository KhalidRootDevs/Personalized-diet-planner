"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { addDays, formatDay, startOfWeek, todayISO } from "@/lib/date"
import { cn } from "@/lib/utils"

/**
 * Week date strip (UI-SPEC §4.6): month title, prev/next week, seven day pills. The selected
 * day is a tall lime pill; today is marked with a dot. `marked` days show a small dot below.
 * `paused` (plan paused, §14.1) draws hollow dots and says so in the label and title.
 */
export function WeekStrip({
  value,
  onChange,
  marked,
  card = true,
  paused,
  className,
}: {
  value: string
  onChange: (iso: string) => void
  marked?: (iso: string) => boolean
  card?: boolean
  paused?: boolean
  className?: string
}) {
  const start = startOfWeek(value)
  const today = todayISO()
  const nav = "grid size-9 place-items-center rounded-full bg-muted text-charcoal transition-colors hover:bg-border"
  return (
    <div className={cn(card && "rounded-2xl bg-card p-4 shadow-card", className)}>
      <div className="flex items-center justify-between">
        <p className="text-headline flex items-center gap-2">
          {formatDay(value, { month: "long", year: "numeric" })}
          {paused && <span className="inline-flex h-[22px] items-center rounded-full bg-muted px-2 text-[11px] font-medium text-muted-foreground">Paused</span>}
        </p>
        <div className="flex gap-2">
          <button type="button" className={nav} aria-label="Previous week" onClick={() => onChange(addDays(value, -7))}>
            <ChevronLeft className="size-4" />
          </button>
          <button type="button" className={nav} aria-label="Next week" onClick={() => onChange(addDays(value, 7))}>
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }, (_, i) => addDays(start, i)).map((d) => {
          const selected = d === value
          const isToday = d === today
          const has = marked?.(d)
          return (
            <button
              key={d}
              type="button"
              onClick={() => onChange(d)}
              aria-pressed={selected}
              aria-label={`${formatDay(d, { weekday: "long", day: "numeric", month: "long" })}${isToday ? ", today" : ""}${has ? (paused ? ", meals paused" : ", meals planned") : ""}`}
              className={cn("tabular flex h-[68px] flex-col items-center justify-center gap-1 rounded-full transition-colors", selected ? "bg-lime text-charcoal" : "text-charcoal hover:bg-muted")}
            >
              <span className={cn("text-[12px] font-medium", selected ? "text-charcoal" : "text-muted-foreground")}>{formatDay(d, { weekday: "narrow" })}</span>
              <span className={cn("text-[16px] leading-none", selected || isToday ? "font-bold" : "font-medium")}>{formatDay(d, { day: "2-digit" })}</span>
              <span className={cn("size-1 rounded-full", has ? (paused ? (selected ? "border border-charcoal" : "border border-muted-grey") : selected ? "bg-charcoal" : "bg-forest") : isToday ? "bg-terracotta" : "bg-transparent")} aria-hidden />
            </button>
          )
        })}
      </div>
    </div>
  )
}
