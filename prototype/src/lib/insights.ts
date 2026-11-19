// Computed insights, patterns, nutrient gaps and habit suggestions (§17.4, §17.6, §42.12,
// §42.18, §42.19). Everything here is deterministic and derived from the user's own records.
// Every insight states its basis and limitation, and correlation is never presented as cause.
import { FOOD_MAP } from "@/lib/data/foods"
import { RECIPE_MAP } from "@/lib/data/recipes"
import { fromISO } from "@/lib/date"
import { MEAL_LABEL } from "@/lib/planning"
import { dayTotals, recipeCostPerServing, type Targets } from "@/lib/nutrition"
import type { CheckIn, MealFeedback } from "@/lib/area-d-store"
import type { JournalEntry, MealPlan, MealType, PlannedMeal, Profile } from "@/lib/types"

export interface InsightInput {
  journal: JournalEntry[]
  plan: MealPlan | undefined
  profile: Profile
  water: Record<string, number>
  feedback: MealFeedback[]
  checkIns: CheckIn[]
  days: string[]
}

export type InsightIcon = "breakfast" | "snack" | "protein" | "water" | "portion" | "energy" | "dinner" | "enjoy"

export interface Insight {
  id: string
  title: string
  body: string
  basis: string
  limitation: string
  kind: "correlation" | "observation"
  icon: InsightIcon
  action?: { label: string; href: string }
}

const isWeekend = (d: string) => [5, 6].includes(fromISO(d).getDay()) // Fri, Sat (Bangladesh weekend)
const eatenOutcomes = new Set(["eaten_as_planned", "eaten_modified", "replaced"])

function entriesOn(input: InsightInput, date: string) {
  return input.journal.filter((e) => e.profileId === input.profile.id && e.consumedAt.slice(0, 10) === date)
}
function mealsOn(plan: MealPlan | undefined, date: string) {
  return (plan?.meals ?? []).filter((m) => m.date === date)
}
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`

/** Outcome counts per meal type over the given days (resolved meals only, §14.6). */
export function mealTypeOutcomes(plan: MealPlan | undefined, days: string[]) {
  const set = new Set(days)
  const res: Partial<Record<MealType, { skipped: number; changed: number; eaten: number; resolved: number }>> = {}
  for (const m of plan?.meals ?? []) {
    if (!set.has(m.date) || !m.outcome || m.outcome === "unresolved") continue
    const r = (res[m.mealType] ??= { skipped: 0, changed: 0, eaten: 0, resolved: 0 })
    r.resolved++
    if (m.outcome === "skipped") r.skipped++
    else r.eaten++
    if (m.outcome === "replaced" || m.outcome === "eaten_modified") r.changed++
  }
  return res
}

export function computeInsights(input: InsightInput): Insight[] {
  const { days, plan, feedback, checkIns, profile } = input
  const out: Insight[] = []
  const loggedDays = days.filter((d) => entriesOn(input, d).length > 0)

  // 1. Protein on days with a meal from the plan vs other logged days (correlation).
  const fromPlan = loggedDays.filter((d) => entriesOn(input, d).some((e) => e.source === "planned" || e.source === "recipe" || e.linkedPlannedMealId))
  const others = loggedDays.filter((d) => !fromPlan.includes(d))
  if (fromPlan.length >= 2 && others.length >= 2) {
    const a = avg(fromPlan.map((d) => dayTotals(entriesOn(input, d)).proteinG))
    const b = avg(others.map((d) => dayTotals(entriesOn(input, d)).proteinG))
    if (Math.abs(a - b) >= 8)
      out.push({
        id: "protein_plan_days",
        title: a > b ? "More protein recorded on days you ate from your plan" : "Less protein recorded on days you ate from your plan",
        body: `On ${plural(fromPlan.length, "day")} with a meal from your plan, recorded protein averaged ~${Math.round(a)} g, compared with ~${Math.round(b)} g on ${plural(others.length, "other logged day")}.${a > b ? " Planning a couple of simple lunches ahead might help keep that routine." : ""}`,
        basis: `Based on ${plural(loggedDays.length, "logged day")}`,
        limitation: "Days with fewer logged meals look lower. Other things that differed on those days may explain the gap.",
        kind: "correlation",
        icon: "protein",
        action: a > b ? { label: "See this week's plan", href: "/plan" } : undefined,
      })
  }

  const byType = mealTypeOutcomes(plan, days)
  // 2. Breakfast skipped (observation).
  const bf = byType.breakfast
  if (bf && bf.skipped >= 2)
    out.push({
      id: "breakfast_skipped",
      title: "Breakfast was often skipped",
      body: `Your planned breakfast was recorded as skipped ${bf.skipped} of ${bf.resolved} times. A simple breakfast prepared the night before is one option, if mornings are rushed.`,
      basis: `Based on ${plural(bf.resolved, "recorded breakfast")}`,
      limitation: "Only breakfasts you marked are counted; unmarked meals aren't treated as skipped.",
      kind: "observation",
      icon: "breakfast",
      action: { label: "Habit ideas", href: "/progress/habits" },
    })
  // 3. Afternoon snack skipped (observation).
  const sn = byType.afternoon_snack
  if (sn && sn.skipped >= 2)
    out.push({
      id: "snack_skipped",
      title: "Afternoon snacks were often missed",
      body: `You skipped the planned afternoon snack ${sn.skipped} of ${sn.resolved} times. Would quicker snack options that fit your plan help on busy days?`,
      basis: `Based on ${plural(sn.resolved, "recorded snack")}`,
      limitation: "We don't know why a snack was skipped; not being hungry is a fine reason.",
      kind: "observation",
      icon: "snack",
      action: { label: "See quick swaps", href: "/plan" },
    })

  // 4. Energy check-ins on days breakfast was eaten vs not (correlation).
  const ci = checkIns.filter((c) => c.profileId === profile.id && days.includes(c.date) && c.energy)
  const bfEaten = (d: string) => mealsOn(plan, d).some((m) => m.mealType === "breakfast" && m.outcome && eatenOutcomes.has(m.outcome)) || entriesOn(input, d).some((e) => e.mealType === "breakfast")
  const score = (c: CheckIn) => (c.energy === "high" ? 3 : c.energy === "ok" ? 2 : 1)
  const withBf = ci.filter((c) => bfEaten(c.date))
  const withoutBf = ci.filter((c) => !bfEaten(c.date))
  if (withBf.length >= 2 && withoutBf.length >= 2) {
    const a = avg(withBf.map(score))
    const b = avg(withoutBf.map(score))
    if (Math.abs(a - b) >= 0.4)
      out.push({
        id: "energy_breakfast",
        title: a > b ? "You reported more energy on days with breakfast" : "Energy was similar or lower on days with breakfast",
        body: `Your energy check-ins were ${a > b ? "higher" : "lower"} on ${plural(withBf.length, "day")} with a recorded breakfast than on ${plural(withoutBf.length, "day")} without one.`,
        basis: `Based on ${plural(ci.length, "check-in")}`,
        limitation: "Self-reported energy depends on sleep, work and much more. This doesn't show that breakfast caused the difference.",
        kind: "correlation",
        icon: "energy",
      })
  }

  // 5. Portion feedback (observation).
  const tooMuch = feedback.filter((f) => f.portion === "too_much")
  const tooLittle = feedback.filter((f) => f.portion === "too_little")
  if (tooMuch.length || tooLittle.length) {
    const main = tooMuch.length >= tooLittle.length ? tooMuch : tooLittle
    const names = Array.from(new Set(main.map((f) => RECIPE_MAP[f.recipeId]?.name).filter(Boolean))).slice(0, 2)
    out.push({
      id: "portion_feedback",
      title: main === tooMuch ? "Some portions felt too large" : "Some portions felt too small",
      body: `You said the portion was ${main === tooMuch ? "too much" : "too little"} for ${names.join(" and ") || "some meals"}. Your weekly review can suggest a portion change for your next plan — it only applies if it still meets your nutrition range.`,
      basis: `Based on ${plural(feedback.length, "meal rating")}`,
      limitation: main.length < 3 ? "An early pattern — a few more ratings will make it clearer." : "Hunger changes day to day, so one rating isn't a rule.",
      kind: "observation",
      icon: "portion",
      action: { label: "Open weekly review", href: "/progress/weekly-review" },
    })
  }

  // 6. Enjoyed meals (observation).
  const liked = feedback.filter((f) => f.enjoyed === "yes" && f.again)
  if (liked.length >= 2) {
    const names = Array.from(new Set(liked.map((f) => RECIPE_MAP[f.recipeId]?.name).filter(Boolean))).slice(0, 3)
    out.push({
      id: "enjoyed",
      title: "Meals you'd happily eat again",
      body: `You enjoyed ${names.join(", ")} and said you'd eat them again. These can be preferred when you approve your next plan, as long as they pass your safety and nutrition checks.`,
      basis: `Based on ${plural(feedback.length, "meal rating")}`,
      limitation: "Preferences never override allergies, diet or nutrition rules.",
      kind: "observation",
      icon: "enjoy",
    })
  }

  // 7. Water (observation).
  const water = days.map((d) => input.water[`${profile.id}:${d}`]).filter((v): v is number => typeof v === "number" && v > 0)
  if (water.length >= 4) {
    const w = avg(water)
    out.push({
      id: "water",
      title: w >= 8 ? "Water recorded on most days" : "Water records were on the lower side",
      body: `You recorded about ${Math.round(w)} glasses a day on ${plural(water.length, "day")} with water records.${w < 6 ? " A glass with each meal is an easy way to add more." : ""}`,
      basis: `Based on ${plural(water.length, "day")} of water records`,
      limitation: "Water from tea, dal and fruit isn't counted, and needs vary with heat and activity.",
      kind: "observation",
      icon: "water",
    })
  }

  // 8. Weekend dinners later (observation).
  const dinnerMinutes = (d: string) => {
    const e = entriesOn(input, d).find((x) => x.mealType === "dinner")
    if (!e) return null
    const [h, m] = e.consumedAt.slice(11, 16).split(":").map(Number)
    return h * 60 + m
  }
  const wkend = days.filter(isWeekend).map(dinnerMinutes).filter((x): x is number => x !== null)
  const wkday = days.filter((d) => !isWeekend(d)).map(dinnerMinutes).filter((x): x is number => x !== null)
  if (wkend.length >= 1 && wkday.length >= 3 && avg(wkend) - avg(wkday) >= 45)
    out.push({
      id: "weekend_dinner",
      title: "Weekend dinners were later",
      body: `Weekend dinners were logged about ${Math.round((avg(wkend) - avg(wkday)) / 60 * 10) / 10} hours later than on weekdays.`,
      basis: `Based on ${plural(wkend.length + wkday.length, "dinner")}`,
      limitation: wkend.length < 2 ? "Based on very few weekends — an early pattern." : "Log times may differ from when you actually ate.",
      kind: "observation",
      icon: "dinner",
    })

  return out
}

/** Recurring patterns for the Weekly Review (§17.6, Phase 1 content). */
export function recurringPatterns(input: InsightInput): { text: string; detail: string }[] {
  const out: { text: string; detail: string }[] = []
  const byType = mealTypeOutcomes(input.plan, input.days)
  for (const [type, r] of Object.entries(byType) as [MealType, NonNullable<(typeof byType)[MealType]>][]) {
    if (r.skipped >= 2) out.push({ text: `${MEAL_LABEL[type]} was skipped ${r.skipped} times`, detail: `Out of ${plural(r.resolved, "recorded " + MEAL_LABEL[type].toLowerCase())}` })
    if (r.changed >= 2) out.push({ text: `${MEAL_LABEL[type]} was changed or replaced ${r.changed} times`, detail: "Swaps are fine — it may mean the planned option didn't fit your day" })
  }
  const logged = input.days.filter((d) => entriesOn(input, d).length > 0)
  const unlogged = input.days.length - logged.length
  if (unlogged >= 2) out.push({ text: `${plural(unlogged, "day")} had no meals logged`, detail: "Totals for those days aren't counted, so averages may look different" })
  // Most frequent food across logged days.
  const counts = new Map<string, Set<string>>()
  for (const d of logged) for (const e of entriesOn(input, d)) for (const i of e.items) (counts.get(i.foodId) ?? counts.set(i.foodId, new Set()).get(i.foodId)!).add(d)
  const top = [...counts.entries()].sort((a, b) => b[1].size - a[1].size)[0]
  if (top && top[1].size >= 4) out.push({ text: `${FOOD_MAP[top[0]]?.name ?? "One food"} appeared on ${top[1].size} of ${logged.length} logged days`, detail: "A familiar staple — variety around it helps" })
  return out
}

export interface AdjustmentSuggestion {
  key: string
  title: string
  detail: string
  reason: string
}

/** Next-plan adjustments derived from outcomes and feedback (§17.4, §17.5, §42.13). Never stricter diets. */
export function adjustmentSuggestions(input: InsightInput): AdjustmentSuggestion[] {
  const out: AdjustmentSuggestion[] = []
  const byType = mealTypeOutcomes(input.plan, input.days)
  if ((byType.lunch?.changed ?? 0) >= 2)
    out.push({ key: "quick_lunch", title: "Quicker weekday lunches", detail: "Prefer lunches that take 20 minutes or less on workdays.", reason: `Lunch was changed or replaced ${byType.lunch!.changed} times this week.` })
  if ((byType.breakfast?.skipped ?? 0) >= 2)
    out.push({ key: "simple_breakfast", title: "Simpler grab-and-go breakfasts", detail: "Prefer breakfasts you can prepare the night before.", reason: `Breakfast was skipped ${byType.breakfast!.skipped} times this week.` })
  const tooMuch = input.feedback.filter((f) => f.portion === "too_much")
  for (const t of Array.from(new Set(tooMuch.map((f) => f.mealType))))
    out.push({ key: `portion_${t}`, title: `Check the ${MEAL_LABEL[t as MealType]?.toLowerCase() ?? t} portion size`, detail: "Try a slightly smaller serving only if it still meets your nutrition range; otherwise keep the current portion.", reason: "You rated a portion as too much." })
  const notAgain = input.feedback.filter((f) => !f.again)
  for (const f of notAgain.slice(0, 2)) {
    const name = RECIPE_MAP[f.recipeId]?.name
    if (name) out.push({ key: `fewer_${f.recipeId}`, title: `Fewer repeats of ${name}`, detail: "Swap it for a similar option that passes the same checks.", reason: "You said you wouldn't eat it again." })
  }
  const missing = input.feedback.filter((f) => f.ingredientsAvailable === false)
  if (missing.length) out.push({ key: "available_ingredients", title: "Use ingredients you can get easily", detail: "Prefer recipes with ingredients from your pantry and local market.", reason: "Some ingredients weren't available." })
  return out
}

/* ───────── Habits (§42.18) ───────── */

export interface HabitSuggestion {
  title: string
  description: string
  icon: string
  reason: string
}

export function habitSuggestions(input: InsightInput, targets: Targets | null, existing: string[]): HabitSuggestion[] {
  const out: HabitSuggestion[] = []
  const byType = mealTypeOutcomes(input.plan, input.days)
  if ((byType.breakfast?.skipped ?? 0) >= 2) out.push({ title: "Prepare breakfast the night before", description: "A simple breakfast ready to go.", icon: "Sunrise", reason: `Breakfast was skipped ${byType.breakfast!.skipped} times recently.` })
  if ((byType.afternoon_snack?.skipped ?? 0) >= 2) out.push({ title: "Pack a snack for work", description: "Helps on long workdays.", icon: "Apple", reason: `The afternoon snack was skipped ${byType.afternoon_snack!.skipped} times.` })
  const v = foodVariety(input)
  if (v.loggedDays >= 3 && v.groups.vegetable.days < v.loggedDays / 2) out.push({ title: "Add a vegetable to dinner", description: "An easy way to add fiber and variety.", icon: "Carrot", reason: `Vegetables appeared on ${v.groups.vegetable.days} of ${v.loggedDays} logged days.` })
  if (v.loggedDays >= 3 && v.groups.fruit.days < v.loggedDays / 2) out.push({ title: "Have a piece of seasonal fruit each day", description: "Guava, banana or mango as a snack.", icon: "Banana", reason: `Fruit appeared on ${v.groups.fruit.days} of ${v.loggedDays} logged days.` })
  const water = input.days.map((d) => input.water[`${input.profile.id}:${d}`]).filter((x): x is number => typeof x === "number")
  if (water.length >= 3 && avg(water) < 7) out.push({ title: "Drink water with each meal", description: "A simple hydration habit.", icon: "GlassWater", reason: `About ${Math.round(avg(water))} glasses a day recorded.` })
  const ci = input.checkIns.filter((c) => c.profileId === input.profile.id && input.days.includes(c.date))
  const ex = ci.filter((c) => c.exerciseMinutes !== undefined)
  if (ex.length >= 3 && avg(ex.map((c) => c.exerciseMinutes!)) < 20) out.push({ title: "A short walk after lunch", description: "10 minutes of movement on workdays.", icon: "Sunrise", reason: `About ${Math.round(avg(ex.map((c) => c.exerciseMinutes!)))} minutes of activity a day recorded.` })
  const sl = ci.filter((c) => c.sleepHours !== undefined)
  if (sl.length >= 3 && avg(sl.map((c) => c.sleepHours!)) < 7) out.push({ title: "A regular wind-down time", description: "Aim for a consistent bedtime on workdays.", icon: "Coffee", reason: `About ${Math.round(avg(sl.map((c) => c.sleepHours!)) * 10) / 10} hours of sleep recorded.` })
  if (targets?.supported) {
    const logged = input.days.filter((d) => entriesOn(input, d).length > 0)
    const p = avg(logged.map((d) => dayTotals(entriesOn(input, d)).proteinG))
    if (logged.length >= 3 && p < targets.proteinG.low * 0.85) out.push({ title: "Include a protein source at lunch", description: "Dal, egg, fish or chicken.", icon: "Egg", reason: `Your recorded meals may be low in protein (~${Math.round(p)} g a day).` })
  }
  return out.filter((s) => !existing.includes(s.title)).slice(0, 4)
}

/* ───────── Nutrient gaps & variety (§42.12) ───────── */

const WHOLE_GRAINS = new Set(["roti", "oats_dry"])
export type VarietyGroup = "fruit" | "vegetable" | "whole_grain" | "legume"
export const VARIETY_LABEL: Record<VarietyGroup, string> = { fruit: "fruit", vegetable: "vegetables", whole_grain: "whole grains", legume: "legumes (dal, chickpeas)" }
export const VARIETY_FOODS: Record<VarietyGroup, string> = {
  fruit: "guava, banana, mango or other seasonal fruit",
  vegetable: "shak, mixed vegetable bhaji or pumpkin",
  whole_grain: "whole-wheat roti or oats",
  legume: "masoor dal or chickpeas",
}

export function foodVariety(input: InsightInput) {
  const logged = input.days.filter((d) => entriesOn(input, d).length > 0)
  const groups: Record<VarietyGroup, { days: number; foods: Set<string> }> = {
    fruit: { days: 0, foods: new Set() },
    vegetable: { days: 0, foods: new Set() },
    whole_grain: { days: 0, foods: new Set() },
    legume: { days: 0, foods: new Set() },
  }
  for (const d of logged) {
    const hit: Record<VarietyGroup, boolean> = { fruit: false, vegetable: false, whole_grain: false, legume: false }
    for (const e of entriesOn(input, d))
      for (const i of e.items) {
        const f = FOOD_MAP[i.foodId]
        if (!f) continue
        const g: VarietyGroup | null = f.category === "fruit" ? "fruit" : f.category === "vegetable" ? "vegetable" : f.category === "pulse" ? "legume" : WHOLE_GRAINS.has(f.id) ? "whole_grain" : null
        if (g) {
          hit[g] = true
          groups[g].foods.add(f.name)
        }
      }
    for (const g of Object.keys(hit) as VarietyGroup[]) if (hit[g]) groups[g].days++
  }
  const distinctFoods = new Set(logged.flatMap((d) => entriesOn(input, d).flatMap((e) => e.items.map((i) => i.foodId)))).size
  return { loggedDays: logged.length, groups, distinctFoods }
}

/** Sodium from logged items where the food DB has a value; coverage says how much we can rely on it. */
export function sodiumSummary(input: InsightInput) {
  const logged = input.days.filter((d) => entriesOn(input, d).length > 0)
  let grams = 0
  let covered = 0
  let mg = 0
  for (const d of logged)
    for (const e of entriesOn(input, d))
      for (const i of e.items) {
        grams += i.grams
        const s = FOOD_MAP[i.foodId]?.per100g.sodiumMg
        if (typeof s === "number") {
          covered += i.grams
          mg += (s * i.grams) / 100
        }
      }
  return { coverage: grams ? covered / grams : 0, avgMg: logged.length ? mg / logged.length : 0, loggedDays: logged.length }
}

export interface NutrientGap {
  key: string
  name: string
  avg: number
  target: number
  unit: string
  kind: "min" | "limit"
  foods: string
}

export function nutrientGaps(input: InsightInput, targets: Targets): NutrientGap[] {
  const logged = input.days.filter((d) => entriesOn(input, d).length > 0)
  if (!targets.supported || logged.length < 4) return []
  const totals = logged.map((d) => dayTotals(entriesOn(input, d)))
  const a = (k: "proteinG" | "fiberG" | "ironMg" | "calciumMg") => avg(totals.map((t) => t[k] ?? 0))
  const gaps: NutrientGap[] = [
    { key: "protein", name: "protein", avg: a("proteinG"), target: targets.proteinG.low, unit: "g", kind: "min" as const, foods: "dal, eggs, fish, chicken or chickpeas" },
    { key: "fiber", name: "fiber", avg: a("fiberG"), target: targets.fiberMinG, unit: "g", kind: "min" as const, foods: "dal, vegetables, fruit and whole-wheat roti" },
    { key: "iron", name: "iron", avg: a("ironMg"), target: targets.ironMg, unit: "mg", kind: "min" as const, foods: "lentils, spinach (lal shak), eggs and small fish" },
    { key: "calcium", name: "calcium", avg: a("calciumMg"), target: targets.calciumMg, unit: "mg", kind: "min" as const, foods: "small fish with bones (mola), milk, doi and leafy greens" },
  ].filter((g) => g.target > 0 && g.avg < g.target * 0.8)
  const s = sodiumSummary(input)
  if (s.coverage >= 0.7 && s.avgMg > 2000) gaps.push({ key: "sodium", name: "sodium", avg: s.avgMg, target: 2000, unit: "mg", kind: "limit", foods: "home-cooked versions of restaurant dishes, less added salt and fewer salty snacks" })
  return gaps
}

/* ───────── Spending and prep (§42.19 views) ───────── */

export function plannedSpending(plan: MealPlan | undefined, days: string[]) {
  const set = new Set(days)
  const meals = (plan?.meals ?? []).filter((m) => set.has(m.date) && m.outcome !== "skipped")
  const perDay = days.map((d) => ({ date: d, value: meals.filter((m) => m.date === d).reduce((t, m) => t + mealCost(m), 0) }))
  return { perDay, total: perDay.reduce((t, d) => t + d.value, 0), daysWithPlan: perDay.filter((d) => d.value > 0).length }
}

function mealCost(m: PlannedMeal): number {
  const r = RECIPE_MAP[m.recipeId]
  return r ? recipeCostPerServing(r) * m.servings : 0
}

export function prepPatterns(input: InsightInput) {
  const set = new Set(input.days)
  const meals = (input.plan?.meals ?? []).filter((m) => set.has(m.date))
  const prepped = meals.filter((m) => m.prepLater)
  const resolvedPrepped = prepped.filter((m) => m.outcome && m.outcome !== "unresolved")
  const entries = input.journal.filter((e) => e.profileId === input.profile.id && set.has(e.consumedAt.slice(0, 10)))
  return {
    preppedMeals: prepped.length,
    preppedEaten: resolvedPrepped.filter((m) => m.outcome !== "skipped").length,
    preppedResolved: resolvedPrepped.length,
    fromPlan: entries.filter((e) => e.source === "planned" || e.source === "recipe" || e.linkedPlannedMealId).length,
    restaurant: entries.filter((e) => e.source === "restaurant" || e.items.some((i) => FOOD_MAP[i.foodId]?.variant === "restaurant")).length,
    other: 0,
    total: entries.length,
  }
}
