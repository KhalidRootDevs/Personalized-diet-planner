"use client"

// Reminder generation (§26) and learning reminder timing (§42.17).
// Reminders are derived from the active plan + settings when the app opens (and once a minute
// while it is open), then pushed to the in-app inbox once per event (deduped by key).
// Texts are supportive and never name a health condition (§26, CLAUDE.md).
import { RECIPE_MAP } from "@/lib/data/recipes"
import { MEAL_LABEL } from "@/lib/planning"
import { ageInMonths } from "@/lib/nutrition"
import { addDays, formatDay, formatTime, fromISO, toISODate } from "@/lib/date"
import { toHHMM, toMin } from "@/lib/calendar"
import { useApp, type Settings } from "@/lib/store"
import type { JournalEntry, MealType, PlannedMeal } from "@/lib/types"

export type ReminderKey = "meals" | "prep" | "logging" | "water" | "shopping" | "weekly_review" | "plan_review" | "progress_entry" | "child_review" | "baby_feeding"

/** Defaults for reminder types added after the first prototype release (older saved settings lack them). */
export const REMINDER_DEFAULTS: Record<string, { enabled: boolean; time: string }> = {
  meals: { enabled: true, time: "15 min before" },
  prep: { enabled: true, time: "19:30" },
  logging: { enabled: true, time: "21:00" },
  water: { enabled: false, time: "Every 2 hours" },
  shopping: { enabled: true, time: "Fri 18:00" },
  weekly_review: { enabled: true, time: "Sun 20:00" },
  plan_review: { enabled: true, time: "18:00" },
  progress_entry: { enabled: false, time: "Mon 08:00" },
  child_review: { enabled: true, time: "09:00" },
  baby_feeding: { enabled: false, time: "After each feed" },
}

export const LEAD_OPTIONS = [5, 15, 30, 60] as const
export const DEFAULT_QUIET = { enabled: true, start: "22:00", end: "07:00" }
export const REMINDER_MEAL_TYPES: MealType[] = ["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner", "evening_snack"]

export function reminderSetting(settings: Settings, key: string) {
  return settings.reminders[key] ?? REMINDER_DEFAULTS[key] ?? { enabled: false, time: "" }
}

export function leadMinutes(settings: Settings) {
  return settings.mealLeadMinutes ?? 15
}

export function mealReminderOn(settings: Settings, type: MealType) {
  return settings.mealReminderToggles?.[type] ?? true
}

/** When the reminder for this meal fires: an approved learned time, else planned time − lead. */
export function mealReminderTime(settings: Settings, m: Pick<PlannedMeal, "mealType" | "time">) {
  return settings.mealReminderTimes?.[m.mealType] ?? toHHMM(toMin(m.time) - leadMinutes(settings))
}

export function inQuietHours(settings: Settings, hhmm: string) {
  const q = settings.quietHours ?? DEFAULT_QUIET
  if (!q.enabled) return false
  const t = toMin(hhmm)
  const s = toMin(q.start)
  const e = toMin(q.end)
  return s <= e ? t >= s && t < e : t >= s || t < e
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

/** Parse "Fri 18:00" → weekday index and time, or "18:00" → daily. */
function parseWhen(s: string): { day?: number; time: string } | null {
  const w = s.match(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+(\d{2}:\d{2})$/)
  if (w) return { day: DAYS.indexOf(w[1]), time: w[2] }
  if (/^\d{2}:\d{2}$/.test(s)) return { time: s }
  return null
}

export interface DerivedReminder {
  key: string
  at: Date
  title: string
  body: string
  href: string
}

const at = (date: string, hhmm: string) => new Date(`${date}T${hhmm}:00`)

/** All reminders whose time has come (within the last 18 h), respecting toggles, pause and quiet hours. */
export function deriveReminders(now = new Date()): DerivedReminder[] {
  const s = useApp.getState()
  const settings = s.settings
  const today = toISODate(now)
  const out: DerivedReminder[] = []
  const recipe = (id: string) => RECIPE_MAP[id] ?? s.userRecipes.find((r) => r.id === id)
  const plan = s.plans.find((p) => p.id === s.activePlanId)
  const planRunning = !!plan && plan.status === "active" // paused plans suppress plan reminders (§14.1)
  const on = (k: string) => reminderSetting(settings, k).enabled

  const push = (r: DerivedReminder, minutesFresh = 18 * 60) => {
    let when = r.at
    // Quiet hours: hold the reminder until they end (§26 — respectful, easy to disable).
    if (inQuietHours(settings, toHHMM(when.getHours() * 60 + when.getMinutes()))) {
      const q = settings.quietHours ?? DEFAULT_QUIET
      const end = at(toISODate(when), q.end)
      when = end < when ? new Date(end.getTime() + 86400000) : end
    }
    if (when > now) return
    if (now.getTime() - when.getTime() > minutesFresh * 60000) return
    out.push({ ...r, at: when })
  }

  if (planRunning && plan) {
    const todays = plan.meals.filter((m) => m.date === today)

    // Meal reminders: only while the meal is still useful to act on.
    if (on("meals")) {
      for (const m of todays) {
        if (m.outcome || !mealReminderOn(settings, m.mealType)) continue
        const r = recipe(m.recipeId)
        const label = MEAL_LABEL[m.mealType]
        push(
          {
            key: `meal:${m.id}:${m.time}`,
            at: at(today, mealReminderTime(settings, m)),
            title: `${label} at ${formatTime(m.time)}`,
            body: `Your ${label.toLowerCase()} is scheduled for ${formatTime(m.time)}${r ? ` (${r.name})` : ""}. Would you like to view the recipe or choose an alternative?`,
            href: `/plan/meal/${m.id}`,
          },
          toMin(m.time) + 60 - toMin(mealReminderTime(settings, m)),
        )
      }
    }

    // Prep the evening before (§16.4).
    if (on("prep")) {
      const tomorrow = plan.meals.filter((m) => m.date === addDays(today, 1) && !m.outcome)
      const soak = tomorrow.find((m) => recipe(m.recipeId)?.ingredients.some((i) => i.foodId === "chickpeas_cooked"))
      const marked = tomorrow.filter((m) => m.prepLater)
      const when = parseWhen(reminderSetting(settings, "prep").time)
      if ((soak || marked.length) && when) {
        push({
          key: `prep:${today}`,
          at: at(today, when.time),
          title: "Prep for tomorrow",
          body: soak ? `Soak chickpeas tonight for tomorrow's ${MEAL_LABEL[soak.mealType].toLowerCase()}.` : `You chose to prepare ${marked.length} meal${marked.length > 1 ? "s" : ""} ahead for tomorrow.`,
          href: "/plan/prep",
        })
      }
    }

    // Shopping day.
    const shop = parseWhen(reminderSetting(settings, "shopping").time)
    if (on("shopping") && shop && (shop.day === undefined || shop.day === now.getDay())) {
      const left = s.shopping.filter((i) => !i.purchased).length
      if (left)
        push({ key: `shop:${today}`, at: at(today, shop.time), title: "Shopping list ready", body: `${left} items for the coming days. Tick them off as you shop.`, href: "/plan/shopping" })
    }

    // Plan review near the end of the plan (§26).
    const end = addDays(plan.startDate, plan.durationDays - 1)
    if (on("plan_review") && (today === end || today === addDays(end, -1))) {
      const when = parseWhen(reminderSetting(settings, "plan_review").time) ?? { time: "18:00" }
      push({
        key: `planreview:${plan.id}`,
        at: at(today, when.time),
        title: "Time to review your plan",
        body: `Your plan ends ${today === end ? "today" : "tomorrow"}. Look back at what worked and choose what comes next.`,
        href: "/plan/plans",
      })
    }
  }

  // Food logging — only if something isn't recorded yet.
  const logWhen = parseWhen(reminderSetting(settings, "logging").time)
  if (on("logging") && logWhen) {
    const open = planRunning && plan ? plan.meals.filter((m) => m.date === today && !m.outcome && m.time <= logWhen.time).length : 0
    const loggedToday = s.journal.some((e) => e.consumedAt.slice(0, 10) === today)
    if (open > 0 || (!planRunning && !loggedToday))
      push({ key: `log:${today}`, at: at(today, logWhen.time), title: "Add today's meals?", body: "Some of today's meals aren't recorded yet. Add them if you like — a partial record is fine.", href: "/log" })
  }

  // Weekly review.
  const weekly = parseWhen(reminderSetting(settings, "weekly_review").time)
  if (on("weekly_review") && weekly && weekly.day === now.getDay())
    push({ key: `weekly:${today}`, at: at(today, weekly.time), title: "Your weekly review is ready", body: "See how the week went and choose one priority for next week.", href: "/progress/weekly-review" })

  // Progress check-in (weight optional, never pressured).
  const prog = parseWhen(reminderSetting(settings, "progress_entry").time)
  if (on("progress_entry") && prog && (prog.day === undefined || prog.day === now.getDay()))
    push({ key: `progress:${today}`, at: at(today, prog.time), title: "Add a progress check-in", body: "Note how the week felt. Weight is optional — skip it any time.", href: "/progress" })

  // Age-related review for child profiles (§26): caregiver language, no calories.
  if (on("child_review")) {
    const when = parseWhen(reminderSetting(settings, "child_review").time) ?? { time: "09:00" }
    for (const c of s.profiles.filter((p) => p.type !== "adult")) {
      const months = ageInMonths(c.dateOfBirth, now)
      if (months < 6 || months > 24) continue
      const dob = fromISO(c.dateOfBirth)
      const turned = toISODate(new Date(dob.getFullYear(), dob.getMonth() + months, dob.getDate()))
      if (turned > today || turned < addDays(today, -6)) continue
      push(
        {
          key: `child:${c.id}:${months}`,
          at: at(turned, when.time),
          title: `${c.name} is now ${months} months`,
          body: "A good moment to review textures and new foods in the feeding guide. Follow your clinician's advice where it differs.",
          href: "/child",
        },
        7 * 24 * 60,
      )
    }
  }

  return out
}

/** Push due reminders to the inbox once each. Returns how many were added. */
export function runReminders(now = new Date()): number {
  const s = useApp.getState()
  if (!s.onboarded) return 0
  s.syncMealStatuses(now)
  let added = 0
  for (const r of deriveReminders(now)) {
    if (useApp.getState().pushNotificationOnce(r.key, { title: r.title, body: r.body, href: r.href }, r.at.toISOString())) added++
  }
  return added
}

/* ───────────── Learning reminders (§42.17) ───────────── */

export interface TimingSuggestion {
  mealType: "lunch" | "dinner"
  samples: number
  typical: string
  planned: string
  current: string
  suggested: string
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/**
 * Compare when lunch/dinner were actually eaten (journal consumedAt, last 21 days) with the planned
 * time. Needs at least 5 records — no conclusions from a few entries (§42.15, §42.17).
 * The result is only ever a suggestion; nothing changes without the user's approval.
 */
export function timingSuggestions(journal: JournalEntry[], meals: PlannedMeal[], settings: Settings, profileId: string, now = new Date()): TimingSuggestion[] {
  const since = addDays(toISODate(now), -21)
  const out: TimingSuggestion[] = []
  for (const mealType of ["lunch", "dinner"] as const) {
    const times = journal.filter((e) => e.profileId === profileId && e.mealType === mealType && e.consumedAt.slice(0, 10) >= since).map((e) => toMin(e.consumedAt.slice(11, 16)))
    if (times.length < 5) continue
    const plannedTimes = meals.filter((m) => m.mealType === mealType).map((m) => m.time)
    if (!plannedTimes.length) continue
    const counts = new Map<string, number>()
    for (const t of plannedTimes) counts.set(t, (counts.get(t) ?? 0) + 1)
    const planned = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]
    const typical = Math.round(median(times) / 5) * 5
    const current = mealReminderTime(settings, { mealType, time: planned })
    const suggested = toHHMM(typical - leadMinutes(settings))
    if (Math.abs(toMin(suggested) - toMin(current)) < 10) continue
    out.push({ mealType, samples: times.length, typical: toHHMM(typical), planned, current, suggested })
  }
  return out
}

export function describeDay(iso: string) {
  return formatDay(iso, { weekday: "short", day: "numeric", month: "short" })
}
