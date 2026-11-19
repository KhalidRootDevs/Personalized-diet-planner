// Calendar helpers: unified meal status (§14.6), .ics export (§14.4) and smart rescheduling (§14.5).
// Pure functions only — no store access — so they can be unit-tested and reused by the store.
import { MEAL_LABEL } from "@/lib/planning"
import { addDays, fromISO, todayISO, toISODate } from "@/lib/date"
import type { MealPlan, MealType, PlannedMeal, Profile } from "@/lib/types"

export const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number)
  return (h || 0) * 60 + (m || 0)
}
export const toHHMM = (min: number) => {
  const m = Math.max(0, Math.min(23 * 60 + 59, Math.round(min)))
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`
}

/** A meal is "due" from 30 min before until 90 min after its planned time (§14.3, §14.6). */
export const DUE_BEFORE_MIN = 30
export const DUE_AFTER_MIN = 90

/**
 * Derive schedule status and end-of-day outcome for one plan (§14.6):
 * - paused plan → unresolved future meals get `paused`; resuming restores `upcoming`;
 * - today's meal inside the due window → `due` (reverts to `upcoming` outside it);
 * - past-day meal with no outcome → outcome `unresolved` (never assumed skipped or eaten).
 * Returns the same array instance when nothing changed, so callers can skip a store write.
 */
export function syncedMeals(plan: MealPlan, now = new Date()): PlannedMeal[] {
  const today = toISODate(now)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const paused = plan.status === "paused"
  let changed = false
  const meals = plan.meals.map((m) => {
    let next = m
    if (paused) {
      if (!m.outcome && m.date >= today && m.scheduleStatus !== "paused") next = { ...m, scheduleStatus: "paused" }
    } else {
      if (m.scheduleStatus === "paused") next = { ...m, scheduleStatus: "upcoming" }
      if (!next.outcome && next.date < today) next = { ...next, outcome: "unresolved", scheduleStatus: next.scheduleStatus === "due" ? "upcoming" : next.scheduleStatus }
      if (!next.outcome && next.date === today) {
        const t = toMin(next.time)
        const inWindow = nowMin >= t - DUE_BEFORE_MIN && nowMin <= t + DUE_AFTER_MIN
        if (inWindow && next.scheduleStatus !== "due") next = { ...next, scheduleStatus: "due" }
        if (!inWindow && next.scheduleStatus === "due") next = { ...next, scheduleStatus: "upcoming" }
      }
      if (next.outcome && next.scheduleStatus === "due") next = { ...next, scheduleStatus: "upcoming" }
    }
    if (next !== m) changed = true
    return next
  })
  return changed ? meals : plan.meals
}

/* ───────────── .ics export (§14.4) ───────────── */

export type IcsRange = "day" | "week" | "plan"

const pad = (n: number) => String(n).padStart(2, "0")
const icsLocal = (date: string, hhmm: string) => `${date.replaceAll("-", "")}T${hhmm.replace(":", "")}00`
const icsStamp = (d = new Date()) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
const icsEscape = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n")

export interface CalendarEvent {
  uid: string
  date: string
  start: string // HH:mm
  minutes: number
  /** Always neutral ("Lunch", "Meal prep") — never a condition, goal or diet (§14.4, CLAUDE.md). */
  title: string
}

/** Neutral calendar events for meals in a range, plus "Meal prep" the evening before prep-ahead meals. */
export function calendarEvents(meals: PlannedMeal[], opts: { prepTime?: string } = {}): CalendarEvent[] {
  const events: CalendarEvent[] = []
  const prepTime = opts.prepTime && /^\d{2}:\d{2}$/.test(opts.prepTime) ? opts.prepTime : "19:30"
  const prepDays = new Set<string>()
  for (const m of [...meals].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))) {
    if (m.outcome === "skipped" || m.scheduleStatus === "paused") continue
    // Stable UID per planned meal: re-importing an updated plan updates events instead of duplicating them.
    events.push({ uid: `${m.id}@nutriplan.app`, date: m.date, start: m.time, minutes: m.mealType.includes("snack") ? 15 : 30, title: MEAL_LABEL[m.mealType as MealType] })
    if (m.prepLater && !m.outcome) {
      const day = addDays(m.date, -1)
      if (!prepDays.has(day)) {
        prepDays.add(day)
        events.push({ uid: `prep-${day}@nutriplan.app`, date: day, start: prepTime, minutes: 30, title: "Meal prep" })
      }
    }
  }
  return events
}

export function buildIcs(events: CalendarEvent[], calName = "NutriPlan meals"): string {
  const stamp = icsStamp()
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//NutriPlan//Prototype//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${icsEscape(calName)}`]
  for (const e of events) {
    const end = toHHMM(toMin(e.start) + e.minutes)
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}`,
      `DTSTAMP:${stamp}`,
      // Floating local time: the meal happens at the same clock time wherever the user is.
      `DTSTART:${icsLocal(e.date, e.start)}`,
      `DTEND:${icsLocal(e.date, end)}`,
      `SUMMARY:${icsEscape(e.title)}`,
      `DESCRIPTION:${icsEscape("Open NutriPlan for details.")}`,
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    )
  }
  lines.push("END:VCALENDAR")
  return lines.join("\r\n") + "\r\n"
}

/** Trigger a browser download of an .ics file (Blob URL; nothing leaves the device). */
export function downloadIcs(filename: string, ics: string) {
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function rangeMeals(meals: PlannedMeal[], range: IcsRange, date: string, startOfWeek: (d: string) => string): PlannedMeal[] {
  if (range === "day") return meals.filter((m) => m.date === date)
  if (range === "week") {
    const s = startOfWeek(date)
    const e = addDays(s, 6)
    return meals.filter((m) => m.date >= s && m.date <= e)
  }
  return meals
}

/* ───────────── Smart rescheduling (§14.5) ───────────── */

export interface ScheduleConflict {
  mealType: MealType
  meals: PlannedMeal[]
  currentTime: string
  suggestedTime: string
  reason: string
}

/**
 * Compare future planned meals with the profile's work hours. Only meal *times* change, so
 * nutrition and safety validation still hold; food changes go through the swap flow (§14.5).
 * Lunch at work is normal, and snacks during work become a "portable snack" note instead.
 */
export function workHourConflicts(meals: PlannedMeal[], p: Pick<Profile, "workStart" | "workEnd">, today = todayISO()): ScheduleConflict[] {
  if (!p.workStart || !p.workEnd) return []
  const ws = toMin(p.workStart)
  const we = toMin(p.workEnd)
  if (we <= ws) return [] // overnight shifts need a manual schedule in the prototype
  const future = meals.filter((m) => m.date >= today && !m.outcome && m.scheduleStatus !== "paused")
  const out: ScheduleConflict[] = []
  const group = (type: MealType, test: (t: number) => boolean, suggest: number, reason: string) => {
    const hit = future.filter((m) => m.mealType === type && test(toMin(m.time)))
    if (!hit.length) return
    const suggested = toHHMM(Math.round(suggest / 5) * 5)
    if (hit.every((m) => m.time === suggested)) return
    out.push({ mealType: type, meals: hit, currentTime: hit[0].time, suggestedTime: suggested, reason })
  }
  // Breakfast should leave ~45 min before work starts.
  group("breakfast", (t) => t > ws - 45 && t < we, Math.max(toMin("06:30"), ws - 60), `less than 45 min before work starts at ${p.workStart}`)
  // Dinner shouldn't fall inside work hours or right as work ends.
  group("dinner", (t) => t >= ws && t < we + 45, Math.min(toMin("22:00"), we + 90), `too close to the end of work at ${p.workEnd}`)
  // Lunch outside a working day that now covers midday → move into a midday break.
  const mid = Math.round((ws + we) / 2)
  group("lunch", (t) => t < ws && ws > toMin("11:00"), Math.min(mid, we - 30), `before your work day starts at ${p.workStart}`)
  return out
}

/** Snack slots that now fall inside work hours (suggest a portable snack, no reschedule). */
export function portableSnackDays(meals: PlannedMeal[], p: Pick<Profile, "workStart" | "workEnd">, today = todayISO()): number {
  if (!p.workStart || !p.workEnd) return 0
  const ws = toMin(p.workStart)
  const we = toMin(p.workEnd)
  return new Set(meals.filter((m) => m.date >= today && !m.outcome && m.mealType.includes("snack") && toMin(m.time) > ws && toMin(m.time) < we).map((m) => m.date)).size
}

export function dayLabel(iso: string) {
  return fromISO(iso).toLocaleDateString("en-GB", { weekday: "short" })
}
