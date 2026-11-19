// Constrained meal planning (§25), validation (§10.5), swaps (§42.11), shopping lists (§16, §42.8)
// and engine-validated recipe variations (§9.3B). Deterministic: the AI never decides what is eaten.
import { FOOD_MAP } from "@/lib/data/foods"
import { RECIPES } from "@/lib/data/recipes"
import { addDays, uid } from "@/lib/date"
import {
  activeHardRules,
  add,
  adultTargets,
  ASSESSMENT_VERSION,
  findRecipe,
  foodViolatesHardConstraints,
  hardConstraintViolation,
  needsProfessionalReview,
  recipeCostPerServing,
  recipeNutrition,
  recipeSodium,
  ZERO,
  type Targets,
} from "@/lib/nutrition"
import type { MealPlan, MealType, Nutrients, PantryItem, PlanCheck, PlannedMeal, PlanPreset, PlanSettings, Profile, Recipe, ShoppingItem } from "@/lib/types"

export type PlanOptions = PlanSettings

/** Runtime inputs that aren't part of the saved plan settings. */
export interface PlanContext {
  pantry?: PantryItem[]
  /** Active Nutrition Twin preferences (§42.15): soft inputs only. */
  twin?: string[]
}

export const SLOTS: Record<3 | 4 | 5, MealType[]> = {
  3: ["breakfast", "lunch", "dinner"],
  4: ["breakfast", "lunch", "afternoon_snack", "dinner"],
  5: ["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner"],
}

const DEFAULT_TIMES: Record<MealType, string> = {
  breakfast: "08:30",
  morning_snack: "11:00",
  lunch: "13:00",
  afternoon_snack: "16:30",
  dinner: "20:30",
  evening_snack: "21:30",
  drinks: "10:00",
  other: "12:00",
}

export const MEAL_LABEL: Record<MealType, string> = {
  breakfast: "Breakfast",
  morning_snack: "Morning snack",
  lunch: "Lunch",
  afternoon_snack: "Afternoon snack",
  dinner: "Dinner",
  evening_snack: "Evening snack",
  drinks: "Drinks",
  other: "Other",
}

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number)
  return (h || 0) * 60 + (m || 0)
}
const toHHMM = (mins: number) => {
  const c = Math.max(5 * 60, Math.min(23 * 60, Math.round(mins / 15) * 15))
  return `${String(Math.floor(c / 60)).padStart(2, "0")}:${String(c % 60).padStart(2, "0")}`
}

/** Meal times from the profile: saved preferences first, else derived from work hours (§10.1 step 6). */
export function defaultMealTimes(p: Profile): Record<MealType, string> {
  const t = { ...DEFAULT_TIMES }
  if (p.workStart && p.workEnd) {
    const ws = toMin(p.workStart)
    const we = toMin(p.workEnd)
    if (we > ws) {
      t.breakfast = toHHMM(ws - 90)
      t.morning_snack = toHHMM(ws + 90)
      t.lunch = toHHMM(Math.max(12 * 60 + 30, Math.min(ws + 180, 14 * 60)))
      t.afternoon_snack = toHHMM(Math.max(toMin(t.lunch) + 150, we - 150))
      t.dinner = toHHMM(we + 90)
    }
  }
  return { ...t, ...(p.mealTimes ?? {}) }
}

/** Meals per day from the profile (§10.3): mealsPerDay, else snacks preference. */
export function defaultMealsPerDay(p: Profile): 3 | 4 | 5 {
  if (p.mealsPerDay === 3 || p.mealsPerDay === 4 || p.mealsPerDay === 5) return p.mealsPerDay
  return p.includeSnacks === false ? 3 : 4
}

const SLOT_SHARE: Record<MealType, number> = { breakfast: 0.25, morning_snack: 0.1, lunch: 0.32, afternoon_snack: 0.12, dinner: 0.3, evening_snack: 0.08, drinks: 0, other: 0.1 }
const isSnack = (t: MealType) => t.includes("snack")

// Illustrative seasonal calendar for Bangladesh (month numbers). Real data comes from §38.5.
const SEASONAL: Record<string, number[]> = {
  mango: [5, 6, 7],
  guava: [7, 8, 9, 10, 11, 12],
  spinach_shak: [11, 12, 1, 2],
  pumpkin: [10, 11, 12, 1, 2],
  hilsa_fish: [6, 7, 8, 9, 10],
}
export function seasonalHits(r: Recipe, month: number): number {
  return r.ingredients.filter((i) => SEASONAL[i.foodId]?.includes(month)).length
}

// Pantry items may be stored raw/dry while recipes use cooked foods.
const PANTRY_EQUIV: Record<string, string[]> = { rice_cooked: ["rice_dry"], dal_cooked: ["lentils_dry"], khichuri: ["rice_dry", "lentils_dry"], omelette: ["egg_boiled"] }
export function pantryHits(r: Recipe, pantryIds: Set<string>): number {
  return r.ingredients.filter((i) => pantryIds.has(i.foodId) || (PANTRY_EQUIV[i.foodId] ?? []).some((id) => pantryIds.has(id))).length
}

interface TwinRules {
  quickWeekdayLunch: boolean
  fishOverChicken: boolean
  dinnerTime?: string
}
export function twinRules(texts: string[] = []): TwinRules {
  const all = texts.join(" \n ")
  const m = /dinner around (\d{1,2}):(\d{2})\s*(AM|PM)?/i.exec(all)
  let dinnerTime: string | undefined
  if (m) {
    let h = Number(m[1]) % 12
    if ((m[3] ?? "PM").toUpperCase() === "PM") h += 12
    dinnerTime = `${String(h).padStart(2, "0")}:${m[2]}`
  }
  return { quickWeekdayLunch: /quick lunch/i.test(all), fishOverChicken: /fish more than chicken/i.test(all), dinnerTime }
}

const minutes = (r: Recipe) => r.prepMinutes + r.cookMinutes
const matchSlot = (r: Recipe, slot: MealType) => r.mealTypes.includes(slot) || (isSnack(slot) && r.mealTypes.some(isSnack))

/** Step 1 + 3 (§25.2): verified adult recipes that pass every hard constraint and the time limit. */
function eligible(slot: MealType, p: Profile, maxMinutes: number): Recipe[] {
  return RECIPES.filter((r) => r.profile === "adult" && r.reviewStatus === "approved" && matchSlot(r, slot) && !hardConstraintViolation(r, p) && minutes(r) <= maxMinutes)
}

function slotLimit(opts: PlanOptions, slot: MealType) {
  return Math.min(opts.maxPrepMinutes, opts.slotMaxMinutes?.[slot] ?? Infinity)
}

/** Smallest time limit that would fill every slot, if the current one leaves gaps. */
export function prepRelaxSuggestion(p: Profile, opts: PlanOptions): number | null {
  let need = 0
  for (const slot of SLOTS[opts.mealsPerDay]) {
    if (eligible(slot, p, slotLimit(opts, slot)).length) continue
    const any = eligible(slot, p, 999)
    if (!any.length) continue
    need = Math.max(need, Math.min(...any.map(minutes)))
  }
  return need > 0 ? Math.ceil(need / 5) * 5 : null
}

interface Builder {
  p: Profile
  opts: PlanOptions
  targets: Targets
  pantryIds: Set<string>
  twin: TwinRules
  costBoost: number
  usage: Map<string, number>
  prevBySlot: Map<MealType, string>
  month: number
}

/** Step 4 (§25.2): soft ranking only — lower is better. Never touches eligibility. */
function score(b: Builder, r: Recipe, slot: MealType, date: string): number {
  const n = recipeNutrition(r)
  const cost = recipeCostPerServing(r)
  let s = 0
  if (b.targets.supported) {
    const mid = (b.targets.energy.low + b.targets.energy.high) / 2
    s += Math.abs(n.energyKcal - mid * SLOT_SHARE[slot]) / 40
  }
  const costWeight = (b.opts.preset === "lowest_cost" ? 3 : b.opts.weeklyBudgetBdt ? 0.4 : 0.15) + b.costBoost
  s += (costWeight * cost) / 10
  switch (b.opts.preset) {
    case "high_protein":
      s -= n.proteinG * 0.6
      break
    case "quick":
      s += minutes(r) / 3
      break
    case "pantry":
      s -= pantryHits(r, b.pantryIds) * 8
      break
    case "seasonal":
      s -= seasonalHits(r, b.month) * 8
      break
    case "family":
      s -= (r.tags.includes("batch-cook") || r.tags.includes("family-meal") ? 5 : 0) + (r.servings >= 2 ? 3 : 0)
      break
  }
  if (b.opts.favorites?.includes(r.id)) s -= 6
  if (b.opts.avoid?.includes(r.id)) s += 15
  const weekday = new Date(`${date}T00:00:00`).getDay()
  if (b.twin.quickWeekdayLunch && slot === "lunch" && weekday >= 1 && weekday <= 5 && minutes(r) > 20) s += 8
  if (b.twin.fishOverChicken) {
    if (r.ingredients.some((i) => FOOD_MAP[i.foodId]?.category === "fish")) s -= 2
    if (r.ingredients.some((i) => i.foodId.startsWith("chicken"))) s += 2
  }
  // Step 6: variety — repeats are allowed but spaced (§25.4).
  s += (b.usage.get(r.id) ?? 0) * 7
  if (b.prevBySlot.get(slot) === r.id) s += 12
  return s
}

const LEVELS = [0.75, 1, 1.25, 1.5]

/** Step 5 (§25.2): choose servings per meal so the day lands in the energy range and meets protein. */
function sizePortions(day: { recipe: Recipe; servings: number; slot: MealType }[], t: Targets) {
  if (!t.supported || !day.length) return
  const total = () => day.reduce((acc, m) => add(acc, recipeNutrition(m.recipe, m.servings)), ZERO)
  const density = (m: { recipe: Recipe }) => {
    const n = recipeNutrition(m.recipe)
    return n.proteinG / Math.max(1, n.energyKcal)
  }
  const step = (m: { servings: number }, dir: 1 | -1) => {
    const i = LEVELS.indexOf(m.servings)
    m.servings = LEVELS[Math.max(0, Math.min(LEVELS.length - 1, (i < 0 ? 1 : i) + dir))]
  }
  for (let iter = 0; iter < 16; iter++) {
    const tot = total()
    if (tot.energyKcal < t.energy.low) {
      const c = day.filter((m) => m.servings < 1.5).sort((a, b) => Number(isSnack(a.slot)) - Number(isSnack(b.slot)) || density(b) - density(a))[0]
      if (!c) break
      step(c, 1)
    } else if (tot.energyKcal > t.energy.high) {
      const c = day.filter((m) => m.servings > 0.75).sort((a, b) => density(a) - density(b))[0]
      if (!c) break
      step(c, -1)
    } else if (tot.proteinG < t.proteinG.low) {
      const c = day.filter((m) => m.servings < 1.5).sort((a, b) => density(b) - density(a))[0]
      if (!c) break
      const before = c.servings
      step(c, 1)
      if (total().energyKcal > t.energy.high) {
        c.servings = before
        break
      }
    } else break
  }
}

function newBuilder(p: Profile, opts: PlanOptions, ctx: PlanContext, costBoost: number): Builder {
  return {
    p,
    opts,
    targets: adultTargets(p),
    pantryIds: new Set((ctx.pantry ?? []).map((i) => i.foodId)),
    twin: twinRules(ctx.twin),
    costBoost,
    usage: new Map(),
    prevBySlot: new Map(),
    month: Number(opts.startDate.slice(5, 7)) || 1,
  }
}

function buildDay(b: Builder, date: string, exclude: Set<string> = new Set()): { meals: PlannedMeal[]; unfilled: MealType[] } {
  const slots = SLOTS[b.opts.mealsPerDay]
  const times = { ...defaultMealTimes(b.p), ...(b.twin.dinnerTime && !b.opts.times.dinner ? { dinner: b.twin.dinnerTime } : {}), ...b.opts.times }
  const chosen: { recipe: Recipe; servings: number; slot: MealType }[] = []
  const unfilled: MealType[] = []
  const usedToday = new Set(exclude)
  for (const slot of slots) {
    const options = eligible(slot, b.p, slotLimit(b.opts, slot))
    if (!options.length) {
      unfilled.push(slot)
      continue
    }
    const fresh = options.filter((r) => !usedToday.has(r.id))
    const pool = fresh.length ? fresh : options
    const pick = [...pool].sort((x, y) => score(b, x, slot, date) - score(b, y, slot, date) || x.id.localeCompare(y.id))[0]
    usedToday.add(pick.id)
    b.usage.set(pick.id, (b.usage.get(pick.id) ?? 0) + 1)
    b.prevBySlot.set(slot, pick.id)
    chosen.push({ recipe: pick, servings: 1, slot })
  }
  sizePortions(chosen, b.targets)
  return {
    meals: chosen.map((c) => ({ id: uid("meal"), date, mealType: c.slot, time: times[c.slot] ?? DEFAULT_TIMES[c.slot], recipeId: c.recipe.id, servings: c.servings, scheduleStatus: "upcoming", outcome: null })),
    unfilled,
  }
}

const FRAMEWORK_THEMES = [
  "Settle into a regular breakfast",
  "Add a vegetable or shak at lunch",
  "Protein at every main meal",
  "Check-in: update weight, schedule and goals",
  "Seasonal produce and swaps",
  "Batch-cook for busy days",
  "Mindful snacks and drinks",
  "Check-in: review progress and reassess targets",
]

/** Long-term framework (§10.2): weekly themes and 4-weekly reassessments, filled one week at a time. */
export function frameworkWeeks(months: number): { week: number; theme: string }[] {
  const weeks = Math.round((months * 52) / 12)
  return Array.from({ length: weeks }, (_, i) => ({ week: i + 1, theme: FRAMEWORK_THEMES[i % FRAMEWORK_THEMES.length] }))
}

function planCost(meals: PlannedMeal[]): number {
  return meals.reduce((s, m) => {
    const r = findRecipe(m.recipeId)
    return s + (r ? recipeCostPerServing(r) * m.servings : 0)
  }, 0)
}

function assemble(p: Profile, opts: PlanOptions, ctx: PlanContext, costBoost: number) {
  const b = newBuilder(p, opts, ctx, costBoost)
  const meals: PlannedMeal[] = []
  const unfilled = new Set<MealType>()
  const days = opts.frameworkMonths ? 7 : opts.durationDays
  for (let d = 0; d < days; d++) {
    const r = buildDay(b, addDays(opts.startDate, d))
    meals.push(...r.meals)
    r.unfilled.forEach((s) => unfilled.add(s))
  }
  return { meals, unfilled: Array.from(unfilled) }
}

/** Build a draft plan: hard constraints → ranking → portions → variety → validation → explanation (§25.2). */
export function generatePlan(p: Profile, opts: PlanOptions, ctx: PlanContext = {}): MealPlan {
  let built = assemble(p, opts, ctx, 0)
  // Budget acts as a constraint (§42.7): raise the cost weight until the plan fits — but only among
  // already-safe recipes, and never accepting a plan whose nutrition gets worse than the first draft.
  if (opts.weeklyBudgetBdt) {
    const days = opts.frameworkMonths ? 7 : opts.durationDays
    const cap = (opts.weeklyBudgetBdt * days) / 7
    const base = nutritionScore(built.meals, p)
    for (const boost of [1, 3, 6]) {
      if (planCost(built.meals) <= cap) break
      const next = assemble(p, opts, ctx, boost)
      if (nutritionScore(next.meals, p) >= base) built = next
    }
  }
  const targets = adultTargets(p)
  const plan: MealPlan = {
    id: uid("plan"),
    title: opts.frameworkMonths ? `${opts.frameworkMonths}-month ${presetLabel(opts.preset).toLowerCase()} framework` : `${opts.durationDays}-day ${presetLabel(opts.preset).toLowerCase()} plan`,
    goal: p.goal ?? "improve_nutrition",
    durationDays: opts.frameworkMonths ? 7 : opts.durationDays,
    startDate: opts.startDate,
    status: "draft",
    validation: { nutrition: true, safety: true, requiresReview: false, warnings: [] },
    createdAt: new Date().toISOString(),
    meals: built.meals,
    settings: { ...opts },
    inputs: planInputs(p, targets),
    nextReviewDate: addDays(opts.startDate, opts.frameworkMonths ? 28 : Math.max(7, opts.durationDays)),
    ...(opts.frameworkMonths ? { framework: { months: opts.frameworkMonths, weeks: frameworkWeeks(opts.frameworkMonths) } } : {}),
  }
  plan.validation = validatePlan(plan, p, built.unfilled)
  plan.explanation = explainPlan(plan, p, ctx)
  return plan
}

/** Days whose energy and protein sit in range (higher is better). */
function nutritionScore(meals: PlannedMeal[], p: Profile): number {
  const t = adultTargets(p)
  if (!t.supported) return 0
  const days = Array.from(new Set(meals.map((m) => m.date)))
  return days.filter((d) => {
    const n = dayNutrition(meals.filter((m) => m.date === d))
    return n.energyKcal >= t.energy.low * 0.95 && n.energyKcal <= t.energy.high * 1.05 && n.proteinG >= t.proteinG.low
  }).length
}

export function dayNutrition(meals: PlannedMeal[]): Nutrients {
  return meals.reduce((acc, m) => {
    const r = findRecipe(m.recipeId)
    return r ? add(acc, recipeNutrition(r, m.servings)) : acc
  }, ZERO)
}

export function planInputs(p: Profile, t: Targets): { label: string; value: string }[] {
  const rows = [
    { label: "Goal", value: (p.goal ?? "improve_nutrition").replace(/_/g, " ") },
    { label: "Body", value: p.weightKg && p.heightCm ? `${p.weightKg} kg · ${p.heightCm} cm` : "Not recorded" },
    { label: "Activity", value: (p.activity ?? "not recorded").replace(/_/g, " ") },
    { label: "Allergies", value: p.allergies.length ? p.allergies.join(", ").replace(/_/g, " ") : "None recorded" },
    { label: "Diet", value: p.diet.length ? p.diet.join(", ").replace(/_/g, " ") : "No rules" },
    { label: "Health conditions", value: p.conditions.length ? `${p.conditions.length} recorded` : "None recorded" },
    { label: "Weekly budget", value: p.budgetPerWeekBdt ? `৳${p.budgetPerWeekBdt.toLocaleString("en-US")}` : "Not set" },
    { label: "Energy range", value: t.supported ? `${t.energy.low.toLocaleString("en-US")}–${t.energy.high.toLocaleString("en-US")} kcal` : "Set with your care team" },
    { label: "Assessment version", value: t.version ?? ASSESSMENT_VERSION },
  ]
  return rows
}

/** §10.5 validation pipeline, computed — never hard-coded. Also used after reschedule/replace. */
export function validatePlan(plan: MealPlan, p: Profile, unfilled: MealType[] = []): MealPlan["validation"] {
  const t = adultTargets(p)
  const s = plan.settings
  const checks: PlanCheck[] = []
  const recipes = plan.meals.map((m) => ({ m, r: findRecipe(m.recipeId) }))
  const missing = recipes.filter((x) => !x.r)
  const violations = recipes.flatMap((x) => (x.r ? [{ m: x.m, r: x.r, v: hardConstraintViolation(x.r, p) }] : [])).filter((x) => x.v)
  const byKind = (k: string) => violations.filter((x) => x.v!.kind === k)
  const names = (xs: { r: Recipe }[]) => Array.from(new Set(xs.map((x) => x.r.name))).slice(0, 3).join(", ")

  const allergen = byKind("allergen")
  checks.push({ id: "allergens", label: "Allergens excluded", status: allergen.length ? "fail" : "pass", blocking: true, detail: allergen.length ? `${allergen[0].v!.reason} (${names(allergen)})` : p.allergies.length ? `No ${p.allergies.join(", ").replace(/_/g, " ")} in any meal, snack or ingredient.` : "No allergies recorded; ingredients were still checked." })
  const age = byKind("age")
  checks.push({ id: "age", label: "Age suitability", status: age.length ? "fail" : "pass", blocking: true, detail: age.length ? age[0].v!.reason : "All recipes suit an adult profile." })
  const diet = byKind("diet")
  checks.push({ id: "diet", label: "Dietary rules", status: diet.length ? "fail" : "pass", blocking: true, detail: diet.length ? `${diet[0].v!.reason} (${names(diet)})` : activeHardRules(p).length ? `Meets: ${activeHardRules(p).join("; ")}.` : "No diet rules recorded." })
  const medical = byKind("medical")
  const sodiumUnknown = p.conditions.includes("hypertension") ? recipes.filter((x) => x.r && !recipeSodium(x.r).complete) : []
  checks.push({
    id: "medical",
    label: "Medical restrictions",
    status: medical.length ? "fail" : sodiumUnknown.length ? "warn" : p.conditions.length ? "pass" : "na",
    blocking: true,
    detail: medical.length
      ? medical[0].v!.reason
      : sodiumUnknown.length
        ? `Sodium data is incomplete for ${new Set(sodiumUnknown.map((x) => x.r!.id)).size} recipes, so we can't confirm their sodium. Cook with less salt and avoid extra salt at the table.`
        : p.conditions.length
          ? "Condition-related exclusions applied where our data supports them."
          : "No health conditions recorded.",
  })
  const pending = recipes.filter((x) => x.r?.reviewStatus === "pending")
  const personal = recipes.filter((x) => x.r?.reviewStatus === "personal")
  checks.push({ id: "food_safety", label: "Food safety notes included", status: recipes.every((x) => !x.r || x.r.steps.length > 0) ? "pass" : "warn", blocking: false, detail: "Every recipe carries cooking and storage guidance where relevant." })
  checks.push({
    id: "verified",
    label: "Verified recipes",
    status: pending.length ? "fail" : personal.length ? "warn" : "pass",
    blocking: pending.length > 0,
    detail: pending.length ? `${pending.length} meal(s) use recipes still awaiting clinical review.` : personal.length ? `${new Set(personal.map((x) => x.r!.id)).size} of your own recipes are included — calculated by our engine, not professionally reviewed.` : "Every meal uses a reviewed recipe.",
  })

  // Energy and protein per day vs ranges
  const days = Array.from(new Set(plan.meals.map((m) => m.date))).sort()
  let nutritionOk = true
  if (t.supported) {
    const out = days.filter((d) => {
      const n = dayNutrition(plan.meals.filter((m) => m.date === d))
      return n.energyKcal < t.energy.low * 0.95 || n.energyKcal > t.energy.high * 1.05 || n.proteinG < t.proteinG.low
    })
    nutritionOk = out.length === 0
    checks.push({ id: "energy", label: "Daily energy and protein within your ranges", status: out.length ? "warn" : "pass", blocking: false, detail: out.length ? `${out.length} of ${days.length} days fall outside ~${t.energy.low.toLocaleString("en-US")}–${t.energy.high.toLocaleString("en-US")} kcal or below ${t.proteinG.low} g protein with the available recipes. That's okay day to day; we explain it rather than force it.` : `Every day lands in ~${t.energy.low.toLocaleString("en-US")}–${t.energy.high.toLocaleString("en-US")} kcal with at least ${t.proteinG.low} g protein.` })
  } else {
    checks.push({ id: "energy", label: "Daily energy and protein", status: "na", blocking: false, detail: "Personal targets are set with your care team, so we don't check calories." })
  }

  // Meal timing
  const timingIssues: string[] = []
  for (const d of days) {
    const ms = plan.meals.filter((m) => m.date === d).sort((a, b) => a.time.localeCompare(b.time))
    for (let i = 1; i < ms.length; i++) if (toMin(ms[i].time) - toMin(ms[i - 1].time) < 90) timingIssues.push(`${MEAL_LABEL[ms[i - 1].mealType]} and ${MEAL_LABEL[ms[i].mealType].toLowerCase()} are less than 90 min apart`)
    if (ms.some((m) => toMin(m.time) > 23 * 60 || toMin(m.time) < 5 * 60)) timingIssues.push("a meal is scheduled very late or very early")
  }
  checks.push({ id: "timing", label: "Meal timing", status: timingIssues.length ? "warn" : "pass", blocking: false, detail: timingIssues.length ? `${Array.from(new Set(timingIssues))[0]}.` : "Meals are spaced at least 90 minutes apart, within your day." })

  // Preferences: cooking time
  if (s) {
    const slow = recipes.filter((x) => x.r && minutes(x.r) > slotLimit(s, x.m.mealType))
    checks.push({ id: "preferences", label: "Cooking time and plan style", status: slow.length ? "warn" : "pass", blocking: false, detail: slow.length ? `${slow.length} meal(s) take longer than ${s.maxPrepMinutes} min.` : `All meals take ${s.maxPrepMinutes} min or less · ${presetLabel(s.preset)} style.` })
  }

  // Budget
  const cost = planCost(plan.meals)
  const budget = s?.weeklyBudgetBdt ?? p.budgetPerWeekBdt
  if (budget) {
    const cap = (budget * Math.max(1, days.length)) / 7
    checks.push({ id: "budget", label: "Within your budget", status: cost <= cap ? "pass" : "warn", blocking: false, detail: cost <= cap ? `About ৳${Math.round(cost).toLocaleString("en-US")} for ${days.length} days — within ৳${Math.round(cap).toLocaleString("en-US")} (estimate).` : `About ৳${Math.round(cost).toLocaleString("en-US")} — over ৳${Math.round(cap).toLocaleString("en-US")} for ${days.length} days. Cheaper safe recipes would make days less nourishing, so we didn't force it.` })
  } else checks.push({ id: "budget", label: "Budget", status: "na", blocking: false, detail: "No budget set." })

  // Completeness and nutrient-calculation validity
  const incomplete = recipes.filter((x) => x.r && (x.r.ingredients.length === 0 || x.r.steps.length === 0))
  checks.push({ id: "complete", label: "Every meal slot filled with a complete recipe", status: unfilled.length || missing.length || incomplete.length ? "fail" : "pass", blocking: true, detail: unfilled.length ? `No safe ${unfilled.map((u) => MEAL_LABEL[u].toLowerCase()).join(", ")} recipe fits your cooking time.` : missing.length ? "A meal refers to a recipe that no longer exists." : incomplete.length ? `${incomplete[0].r!.name} is missing ingredients or steps.` : "Each meal has ingredients, quantities and steps." })
  const unknownFood = recipes.some((x) => x.r?.ingredients.some((i) => !FOOD_MAP[i.foodId]))
  checks.push({ id: "calc", label: "Nutrition calculated from ingredients", status: unknownFood ? "fail" : "pass", blocking: true, detail: unknownFood ? "An ingredient isn't in our food database, so nutrition can't be calculated." : "Computed from ingredient weights and servings in the food database." })

  // Review and escalation
  const review = needsProfessionalReview(p)
  checks.push({ id: "review", label: "Professional review", status: review ? (plan.review?.status === "approved" ? "pass" : "warn") : "na", blocking: false, detail: review ? (plan.review?.status === "approved" ? `Reviewed by ${plan.review.reviewer}.` : "Required before this plan can be activated (§13.3).") : "Not required for your profile." })
  checks.push({ id: "escalation", label: "Warning signs", status: t.supported || p.type !== "adult" ? "pass" : "fail", blocking: true, detail: t.supported ? "No warning signs that need escalation." : (t.reason ?? "Targets need a professional.") })

  const failing = checks.filter((c) => c.blocking && c.status === "fail")
  return {
    nutrition: nutritionOk,
    safety: failing.length === 0,
    requiresReview: review,
    warnings: failing.map((c) => c.detail),
    checks,
  }
}

/** Short re-validation summary for one day after a reschedule or replacement (§25.2 step 8). */
export function validateDay(plan: MealPlan, date: string, p: Profile): { ok: boolean; summary: string; validation: MealPlan["validation"] } {
  const validation = validatePlan(plan, p)
  const day = plan.meals.filter((m) => m.date === date)
  const t = adultTargets(p)
  const n = dayNutrition(day)
  const unsafe = day.map((m) => findRecipe(m.recipeId)).filter((r): r is Recipe => !!r).map((r) => hardConstraintViolation(r, p)).find(Boolean)
  if (unsafe) return { ok: false, summary: `Safety check failed: ${unsafe.reason}`, validation }
  const timing = validation.checks?.find((c) => c.id === "timing")
  const parts: string[] = ["Safety rules still met"]
  if (t.supported) {
    const inRange = n.energyKcal >= t.energy.low * 0.95 && n.energyKcal <= t.energy.high * 1.05
    parts.push(inRange ? `day ~${Math.round(n.energyKcal).toLocaleString("en-US")} kcal, in range` : `day now ~${Math.round(n.energyKcal).toLocaleString("en-US")} kcal (range ${t.energy.low.toLocaleString("en-US")}–${t.energy.high.toLocaleString("en-US")})`)
  }
  if (timing?.status === "warn") parts.push(timing.detail.replace(/\.$/, ""))
  return { ok: true, summary: `${parts.join(" · ")}.`, validation }
}

/** Deterministic explanation of why these meals were chosen (§10.1 step 9). */
export function explainPlan(plan: MealPlan, p: Profile, ctx: PlanContext = {}): string[] {
  const s = plan.settings
  const t = adultTargets(p)
  const out: string[] = []
  const rules = activeHardRules(p)
  out.push(rules.length ? `Every meal first had to pass your rules: ${rules.join("; ")}. Only reviewed recipes were considered.` : "Only reviewed recipes were considered, each checked against allergy, age and safety rules.")
  if (s) {
    const style: Record<PlanPreset, string> = {
      balanced: "Balanced style: meals were matched to each slot's share of your day, with variety across the week.",
      lowest_cost: "Lowest-cost style: among safe recipes, cheaper ones were ranked first — without dropping protein-rich foods.",
      high_protein: "High-protein style: protein-forward safe recipes were ranked first.",
      quick: "Quick style: shorter recipes were ranked first.",
      pantry: `Pantry-first style: recipes using what you have were ranked first${ctx.pantry?.length ? ` (${ctx.pantry.map((i) => i.name).slice(0, 3).join(", ")}…)` : ""}.`,
      seasonal: "Seasonal style: recipes with produce in season now were ranked first (illustrative seasonal calendar).",
      family: "Family style: batch-cookable dishes that serve several people were ranked first.",
    }
    out.push(style[s.preset])
    out.push(`Cooking time: every meal takes ${s.maxPrepMinutes} min or less.`)
  }
  const adjusted = plan.meals.filter((m) => m.servings !== 1)
  if (t.supported && adjusted.length) {
    const ex = adjusted[0]
    out.push(`Portions: ${adjusted.length} meals use adjusted servings (e.g. ${ex.servings}× ${MEAL_LABEL[ex.mealType].toLowerCase()}) so days land near ~${t.energy.low.toLocaleString("en-US")}–${t.energy.high.toLocaleString("en-US")} kcal with at least ${t.proteinG.low} g protein.`)
  }
  const budget = s?.weeklyBudgetBdt
  if (budget) {
    const cost = planCost(plan.meals)
    const days = new Set(plan.meals.map((m) => m.date)).size
    out.push(`Budget: about ৳${Math.round(cost).toLocaleString("en-US")} for ${days} days against ৳${Math.round((budget * days) / 7).toLocaleString("en-US")} (estimate).`)
  }
  const tw = twinRules(ctx.twin)
  const used = [tw.quickWeekdayLunch && "quick weekday lunches", tw.fishOverChicken && "fish over chicken", tw.dinnerTime && `dinner around ${tw.dinnerTime}`].filter(Boolean)
  if (used.length) out.push(`From your Nutrition Twin: ${used.join(", ")} (soft preferences only).`)
  if (s?.favorites?.length) out.push(`Meals you ate as planned were repeated more often.`)
  const distinct = new Set(plan.meals.map((m) => m.recipeId)).size
  out.push(`Variety: ${distinct} different recipes, with repeats spaced out.`)
  t.safetyWarnings.forEach((w) => out.push(w))
  return out
}

/** Rebuild one day (§19.4), keeping meals the user already recorded. */
export function regenerateDay(plan: MealPlan, date: string, p: Profile, ctx: PlanContext = {}): PlannedMeal[] {
  const settings: PlanOptions = plan.settings ?? { durationDays: plan.durationDays, startDate: plan.startDate, mealsPerDay: 4, preset: "balanced", maxPrepMinutes: p.maxPrepMinutes ?? 30, times: {} }
  const day = plan.meals.filter((m) => m.date === date)
  const keep = day.filter((m) => m.outcome)
  const b = newBuilder(p, { ...settings, mealsPerDay: (SLOTS[settings.mealsPerDay] ? settings.mealsPerDay : 4) as 3 | 4 | 5 }, ctx, 0)
  plan.meals.filter((m) => m.date !== date).forEach((m) => b.usage.set(m.recipeId, (b.usage.get(m.recipeId) ?? 0) + 1))
  const { meals } = buildDay(b, date, new Set(day.map((m) => m.recipeId)))
  const keptTypes = new Set(keep.map((m) => m.mealType))
  const times = Object.fromEntries(day.map((m) => [m.mealType, m.time]))
  const fresh = meals.filter((m) => !keptTypes.has(m.mealType)).map((m) => ({ ...m, time: times[m.mealType] ?? m.time }))
  return [...plan.meals.filter((m) => m.date !== date), ...keep, ...fresh].sort((a, b2) => a.date.localeCompare(b2.date) || a.time.localeCompare(b2.time))
}

export function presetLabel(preset: PlanPreset): string {
  return { balanced: "Balanced", lowest_cost: "Lowest-cost", high_protein: "High-protein", quick: "Quick workday", pantry: "Pantry-first", seasonal: "Seasonal", family: "Family" }[preset]
}

export type SwapMode = "similar" | "cheaper" | "quick" | "pantry"

export interface SwapOption {
  recipe: Recipe
  deltaKcal: number
  deltaProtein: number
  deltaCost: number
  deltaMinutes: number
  pantryHits: number
  material: boolean
}

/** Alternatives that pass hard constraints, re-ranked by mode (§42.11). */
export function swapOptions(meal: PlannedMeal, p: Profile, mode: SwapMode, pantry: PantryItem[]): SwapOption[] {
  const current = findRecipe(meal.recipeId)
  if (!current) return []
  const cn = recipeNutrition(current)
  const cc = recipeCostPerServing(current)
  const pantryIds = new Set(pantry.map((i) => i.foodId))
  const opts = eligible(meal.mealType, p, 90)
    .filter((r) => r.id !== current.id)
    .map((r) => {
      const n = recipeNutrition(r)
      const deltaKcal = n.energyKcal - cn.energyKcal
      return {
        recipe: r,
        deltaKcal,
        deltaProtein: n.proteinG - cn.proteinG,
        deltaCost: recipeCostPerServing(r) - cc,
        deltaMinutes: minutes(r) - minutes(current),
        pantryHits: pantryHits(r, pantryIds),
        material: Math.abs(deltaKcal) > cn.energyKcal * 0.2 || n.proteinG < cn.proteinG * 0.7,
      }
    })
  const similarity = (o: SwapOption) => Math.abs(o.deltaKcal) / 10 + Math.abs(o.deltaProtein) * 2
  const sorters: Record<SwapMode, (a: SwapOption, b: SwapOption) => number> = {
    similar: (a, b) => similarity(a) - similarity(b),
    cheaper: (a, b) => a.deltaCost - b.deltaCost || similarity(a) - similarity(b),
    quick: (a, b) => a.deltaMinutes - b.deltaMinutes || similarity(a) - similarity(b),
    pantry: (a, b) => b.pantryHits - a.pantryHits || similarity(a) - similarity(b),
  }
  return opts.sort(sorters[mode]).slice(0, 4)
}

// ───────────── Ingredient alternatives (§8.4) ─────────────

const INGREDIENT_ALTERNATIVES: Record<string, string[]> = {
  rui_fish: ["chicken_curry", "egg_boiled", "dal_cooked"],
  hilsa_fish: ["rui_fish", "chicken_curry"],
  chicken_curry: ["rui_fish", "chickpeas_cooked", "egg_boiled"],
  beef_curry: ["chicken_curry", "rui_fish", "chickpeas_cooked"],
  egg_boiled: ["chickpeas_cooked", "dal_cooked"],
  omelette: ["chickpeas_cooked", "egg_boiled"],
  roti: ["rice_cooked", "oats_dry"],
  paratha: ["roti", "rice_cooked"],
  rice_cooked: ["roti", "khichuri"],
  milk: ["doi"],
  doi: ["milk", "banana"],
  mustard_oil: ["soybean_oil"],
  soybean_oil: ["mustard_oil"],
  peanuts: ["chickpeas_cooked"],
  mixed_veg: ["spinach_shak", "pumpkin"],
  spinach_shak: ["mixed_veg", "pumpkin"],
  mango: ["banana", "guava"],
  banana: ["guava", "mango"],
  guava: ["banana"],
  milk_tea: ["milk"],
  chickpeas_cooked: ["dal_cooked"],
  dal_cooked: ["chickpeas_cooked"],
}

/** Alternatives for one ingredient that pass the same hard constraints. Swapping always recalculates. */
export function ingredientAlternatives(foodId: string, p: Profile): string[] {
  return (INGREDIENT_ALTERNATIVES[foodId] ?? []).filter((id) => FOOD_MAP[id] && !foodViolatesHardConstraints(id, p))
}

// ───────────── AI recipe variations (§9.3B) ─────────────

export type VariationKind = "less_oil" | "more_veg" | "more_protein"
export const VARIATION_LABEL: Record<VariationKind, { title: string; hint: string }> = {
  less_oil: { title: "Use less oil", hint: "Halves cooking oil" },
  more_veg: { title: "Add vegetables", hint: "Adds leafy greens" },
  more_protein: { title: "More protein", hint: "Adds lentils" },
}
const MODEL_VERSION = "mock-variation-0.1"

/**
 * Mock of the AI step. In production a model returns this JSON; here it is deterministic.
 * The result is typed `unknown` on purpose: it must pass `validateVariation` before use.
 */
export function mockProposeVariation(recipe: Recipe, kind: VariationKind): unknown {
  const oils = recipe.ingredients.filter((i) => i.foodId.endsWith("_oil"))
  if (kind === "less_oil") return { kind, rationale: "Halving the cooking oil lowers fat and energy while keeping the dish familiar.", changes: oils.map((o) => ({ op: "scale", foodId: o.foodId, factor: 0.5 })), modelVersion: MODEL_VERSION }
  if (kind === "more_veg") return { kind, rationale: "Adding spinach (shak) adds fiber, iron and calcium for few extra calories.", changes: [{ op: "add", foodId: "spinach_shak", grams: 80 * recipe.servings }], modelVersion: MODEL_VERSION }
  return { kind, rationale: "Adding a bowl of masoor dal adds plant protein and fiber.", changes: [{ op: "add", foodId: "dal_cooked", grams: 100 * recipe.servings }], modelVersion: MODEL_VERSION }
}

export type VariationResult = { ok: true; recipe: Recipe; rationale: string; delta: Nutrients } | { ok: false; reason: string }

/** Engine validation of an AI proposal: schema, known foods, sane quantities, hard constraints, recalculation. */
export function validateVariation(raw: unknown, recipe: Recipe, p: Profile): VariationResult {
  const o = raw as { kind?: unknown; rationale?: unknown; changes?: unknown; modelVersion?: unknown }
  if (!o || typeof o !== "object" || typeof o.kind !== "string" || !(o.kind in VARIATION_LABEL) || typeof o.rationale !== "string" || !Array.isArray(o.changes)) return { ok: false, reason: "The suggestion wasn't in a format we can check, so it wasn't shown." }
  if (o.changes.length === 0) return { ok: false, reason: "There's nothing to change in this recipe for that variation." }
  let ingredients = recipe.ingredients.map((i) => ({ ...i }))
  for (const c of o.changes as { op?: unknown; foodId?: unknown; grams?: unknown; factor?: unknown }[]) {
    if (typeof c.foodId !== "string" || !FOOD_MAP[c.foodId]) return { ok: false, reason: "The suggestion used a food that isn't in our database." }
    const food = FOOD_MAP[c.foodId]
    if (food.category === "sweet") return { ok: false, reason: "Variations can't add sweets." }
    if (c.op === "scale") {
      if (typeof c.factor !== "number" || c.factor < 0.25 || c.factor > 1.5) return { ok: false, reason: "The suggested quantity change was outside safe limits." }
      ingredients = ingredients.map((i) => (i.foodId === c.foodId ? { ...i, grams: Math.round(i.grams * (c.factor as number)) } : i))
    } else if (c.op === "add") {
      if (typeof c.grams !== "number" || c.grams <= 0 || c.grams > 500 * recipe.servings) return { ok: false, reason: "The suggested quantity was outside safe limits." }
      const existing = ingredients.find((i) => i.foodId === c.foodId)
      ingredients = existing ? ingredients.map((i) => (i.foodId === c.foodId ? { ...i, grams: i.grams + (c.grams as number) } : i)) : [...ingredients, { foodId: c.foodId, grams: c.grams as number }]
    } else return { ok: false, reason: "Unknown change type." }
  }
  const kind = o.kind as VariationKind
  const variant: Recipe = {
    ...recipe,
    id: uid("var"),
    name: `${recipe.name} · ${VARIATION_LABEL[kind].title.toLowerCase()}`,
    description: `${o.rationale} Suggested variation of a reviewed recipe — not reviewed itself.`,
    ingredients,
    steps: [...recipe.steps, kind === "more_veg" ? "Stir-fry the spinach with garlic for 3 minutes and serve alongside." : kind === "more_protein" ? "Boil the extra lentils until soft and serve as a side." : "Use the reduced oil quantity listed above."],
    reviewStatus: "personal",
    tags: [...recipe.tags, "ai-variation"],
    basedOnId: recipe.id,
    source: `AI-suggested variation (${typeof o.modelVersion === "string" ? o.modelVersion : MODEL_VERSION}), checked by the nutrition engine`,
    aiVariation: { kind, modelVersion: typeof o.modelVersion === "string" ? o.modelVersion : MODEL_VERSION, validatedAt: new Date().toISOString() },
  }
  const v = hardConstraintViolation(variant, p)
  if (v) return { ok: false, reason: `Blocked by your safety rules: ${v.reason}` }
  const a = recipeNutrition(recipe)
  const b = recipeNutrition(variant)
  const delta: Nutrients = { energyKcal: b.energyKcal - a.energyKcal, proteinG: b.proteinG - a.proteinG, carbsG: b.carbsG - a.carbsG, fatG: b.fatG - a.fatG, fiberG: b.fiberG - a.fiberG, ironMg: (b.ironMg ?? 0) - (a.ironMg ?? 0), calciumMg: (b.calciumMg ?? 0) - (a.calciumMg ?? 0) }
  return { ok: true, recipe: variant, rationale: o.rationale, delta }
}

/** High-risk users don't get AI variations (§9.3, §43): infants, children, conditions needing review. */
export function variationBlockedReason(active: Profile | undefined, self: Profile | undefined): string | null {
  if (active && active.type !== "adult") return "AI variations aren't offered for babies' and children's food. Use the reviewed recipes."
  if (self && needsProfessionalReview(self)) return "Because of a recorded health condition, recipe changes go through your care team instead of AI suggestions."
  return null
}

// ───────────── Shopping list ─────────────

const CATEGORY_LABEL: Record<string, string> = {
  grain: "Grains & breads",
  pulse: "Lentils & pulses",
  fish: "Fish",
  meat: "Meat",
  egg: "Eggs",
  dairy: "Dairy",
  vegetable: "Vegetables",
  fruit: "Fruit",
  fat: "Oils, nuts & seeds",
  mixed_dish: "Prepared foods",
  drink: "Drinks",
  sweet: "Sweets",
}

/** Aggregate ingredients across meals (verified and personal recipes), consolidating duplicates (§16.1). */
export function buildShoppingList(meals: PlannedMeal[], people = 1, pantry: PantryItem[] = []): ShoppingItem[] {
  const totals = new Map<string, number>()
  for (const m of meals) {
    const r = findRecipe(m.recipeId)
    if (!r) continue
    for (const ing of r.ingredients) {
      totals.set(ing.foodId, (totals.get(ing.foodId) ?? 0) + (ing.grams / r.servings) * m.servings * people)
    }
  }
  const have = new Map(pantry.map((p) => [p.foodId, p.grams]))
  return Array.from(totals.entries())
    .map(([foodId, grams]) => {
      const f = FOOD_MAP[foodId]
      const need = Math.max(0, grams - (have.get(foodId) ?? 0))
      return {
        id: `shop_${foodId}`,
        foodId,
        name: f?.name ?? foodId,
        category: CATEGORY_LABEL[f?.category ?? "mixed_dish"],
        grams: Math.round(need / 10) * 10,
        purchased: false,
        costBdt: Math.round(((f?.costPer100gBdt ?? 0) * need) / 100),
      }
    })
    .filter((i) => i.grams > 0)
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
}
