// Weekly progress statistics for Progress, Weekly Review and Insights (§17, §17.6, §42.19).
import { addDays, todayISO } from "@/lib/date"
import { dayTotals, entryUncertainty, plannedMealNutrition, ZERO, add } from "@/lib/nutrition"
import type { JournalEntry, MealPlan, Nutrients, PlannedMeal } from "@/lib/types"

export interface DayStat {
  date: string
  consumed: Nutrients
  planned: Nutrients
  entries: number
  photoEntries: number
  logged: boolean
}

export function lastNDays(n: number, end = todayISO()): string[] {
  return Array.from({ length: n }, (_, i) => addDays(end, -(n - 1 - i)))
}

export function dayStats(journal: JournalEntry[], plan: MealPlan | undefined, profileId: string, days: string[]): DayStat[] {
  return days.map((date) => {
    const entries = journal.filter((e) => e.profileId === profileId && e.consumedAt.slice(0, 10) === date)
    const planned = (plan?.meals ?? []).filter((m) => m.date === date).reduce((acc, m) => add(acc, plannedMealNutrition(m)), ZERO)
    return {
      date,
      consumed: dayTotals(entries),
      planned,
      entries: entries.length,
      photoEntries: entries.filter((e) => e.hasPhoto).length,
      logged: entries.length > 0,
    }
  })
}

export function average(stats: DayStat[], key: keyof Nutrients, onlyLogged = true): number {
  const list = onlyLogged ? stats.filter((s) => s.logged) : stats
  if (!list.length) return 0
  return list.reduce((acc, s) => acc + (s.consumed[key] ?? 0), 0) / list.length
}

export function mealsInRange(plan: MealPlan | undefined, days: string[]): PlannedMeal[] {
  const set = new Set(days)
  return (plan?.meals ?? []).filter((m) => set.has(m.date))
}

/** Record completeness & data confidence for a day (§42.20). Not a health score. */
export function recordConfidence(journal: JournalEntry[], plan: MealPlan | undefined, profileId: string, date: string) {
  const entries = journal.filter((e) => e.profileId === profileId && e.consumedAt.slice(0, 10) === date)
  const plannedMeals = (plan?.meals ?? []).filter((m) => m.date === date)
  const resolved = plannedMeals.filter((m) => m.outcome && m.outcome !== "unresolved").length
  const confirmed = entries.filter((e) => e.analysisStatus === "confirmed")
  const fromPhoto = confirmed.filter((e) => e.hasPhoto).length
  const uncertain = confirmed.filter((e) => entryUncertainty(e) >= 0.25).length
  const missing = Math.max(0, plannedMeals.length - Math.max(resolved, entries.length))
  let level: "Complete" | "Mostly complete" | "Partially complete" | "Not enough data"
  if (!entries.length) level = "Not enough data"
  else if (missing === 0 && uncertain === 0) level = "Complete"
  else if (missing <= 1) level = "Mostly complete"
  else level = "Partially complete"
  return { level, logged: confirmed.length, fromPhoto, uncertain, missing, planned: plannedMeals.length }
}
