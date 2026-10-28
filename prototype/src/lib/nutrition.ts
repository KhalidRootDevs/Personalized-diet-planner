// Deterministic nutrition engine (§6, §18.1). The AI never produces these numbers (§18.5).
import { FOOD_MAP } from "@/lib/data/foods"
import { RECIPE_MAP } from "@/lib/data/recipes"
import type { Allergen, JournalEntry, Nutrients, PlannedMeal, Profile, Recipe } from "@/lib/types"

export const ZERO: Nutrients = { energyKcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0, ironMg: 0, calciumMg: 0 }

export function add(a: Nutrients, b: Nutrients): Nutrients {
  return {
    energyKcal: a.energyKcal + b.energyKcal,
    proteinG: a.proteinG + b.proteinG,
    carbsG: a.carbsG + b.carbsG,
    fatG: a.fatG + b.fatG,
    fiberG: a.fiberG + b.fiberG,
    ironMg: (a.ironMg ?? 0) + (b.ironMg ?? 0),
    calciumMg: (a.calciumMg ?? 0) + (b.calciumMg ?? 0),
  }
}

export function scale(n: Nutrients, f: number): Nutrients {
  return {
    energyKcal: n.energyKcal * f,
    proteinG: n.proteinG * f,
    carbsG: n.carbsG * f,
    fatG: n.fatG * f,
    fiberG: n.fiberG * f,
    ironMg: (n.ironMg ?? 0) * f,
    calciumMg: (n.calciumMg ?? 0) * f,
  }
}

export function foodNutrients(foodId: string, grams: number): Nutrients {
  const food = FOOD_MAP[foodId]
  if (!food) return ZERO
  return scale(food.per100g, grams / 100)
}

/** Nutrition per serving, summed from actual ingredient quantities (§8.3, §9). */
export function recipeNutrition(recipe: Recipe, servings = 1): Nutrients {
  const total = recipe.ingredients.reduce((acc, i) => add(acc, foodNutrients(i.foodId, i.grams)), ZERO)
  return scale(total, servings / recipe.servings)
}

export function recipeCostPerServing(recipe: Recipe): number {
  const total = recipe.ingredients.reduce((acc, i) => acc + ((FOOD_MAP[i.foodId]?.costPer100gBdt ?? 0) * i.grams) / 100, 0)
  return Math.round(total / recipe.servings)
}

export function recipeAllergens(recipe: Recipe): Allergen[] {
  return Array.from(new Set(recipe.ingredients.flatMap((i) => FOOD_MAP[i.foodId]?.allergens ?? [])))
}

const OIL_GRAMS = { none: 0, little: 5, moderate: 10, lots: 20 } as const

/** Journal entry nutrition from confirmed items + hidden-ingredient answers (§41.3.3, §41.3.5). */
export function entryNutrition(entry: JournalEntry): Nutrients {
  let n = entry.items.reduce((acc, i) => add(acc, foodNutrients(i.foodId, i.grams)), ZERO)
  const oil = entry.hiddenIngredients.oil
  if (oil && oil !== "none") n = add(n, foodNutrients("mustard_oil", OIL_GRAMS[oil]))
  if (entry.hiddenIngredients.sugar) n = add(n, { ...ZERO, energyKcal: 40, carbsG: 10 })
  return n
}

/** Uncertainty band as ± fraction, driven by the least confident item (§41.3.4). */
export function entryUncertainty(entry: JournalEntry): number {
  if (entry.source === "manual" || entry.source === "saved" || entry.source === "planned") return 0.1
  const worst = entry.items.reduce((w, i) => {
    const q = i.confirmedByUser ? (i.quantityConfidence === "low" ? 0.25 : 0.15) : i.quantityConfidence === "low" ? 0.35 : i.quantityConfidence === "moderate" ? 0.25 : 0.15
    return Math.max(w, q)
  }, 0.1)
  return worst
}

export function dayTotals(entries: JournalEntry[]): Nutrients {
  return entries.filter((e) => e.analysisStatus === "confirmed").reduce((acc, e) => add(acc, entryNutrition(e)), ZERO)
}

export function plannedMealNutrition(meal: PlannedMeal): Nutrients {
  const r = RECIPE_MAP[meal.recipeId]
  return r ? recipeNutrition(r, meal.servings) : ZERO
}

export function ageInMonths(dob: string, today = new Date()): number {
  const d = new Date(dob)
  let m = (today.getFullYear() - d.getFullYear()) * 12 + (today.getMonth() - d.getMonth())
  if (today.getDate() < d.getDate()) m -= 1
  return Math.max(0, m)
}

export function ageInYears(dob: string, today = new Date()): number {
  return Math.floor(ageInMonths(dob, today) / 12)
}

const ACTIVITY_FACTOR: Record<string, number> = {
  sedentary: 1.3,
  light: 1.45,
  moderate: 1.6,
  very: 1.75,
  extreme: 1.9,
}

export interface Targets {
  energy: { low: number; high: number }
  proteinG: { low: number; high: number }
  fiberMinG: number
  carbsG: { low: number; high: number }
  fatG: { low: number; high: number }
  ironMg: number
  calciumMg: number
  supported: boolean
  reason?: string
  method: string
}

/**
 * Adult targets via Mifflin–St Jeor (§6.2) with ranges, not single numbers (§6.2, §25.2 Step 2).
 * Never applied to infants or children (§18.5).
 */
export function adultTargets(p: Profile): Targets {
  const age = ageInYears(p.dateOfBirth)
  if (p.type !== "adult" || age < 18 || !p.weightKg || !p.heightCm || !p.sex) {
    return { energy: { low: 0, high: 0 }, proteinG: { low: 0, high: 0 }, fiberMinG: 0, carbsG: { low: 0, high: 0 }, fatG: { low: 0, high: 0 }, ironMg: 0, calciumMg: 0, supported: false, reason: "Adult equations are not used for this profile.", method: "—" }
  }
  const ree = 10 * p.weightKg + 6.25 * p.heightCm - 5 * age + (p.sex === "male" ? 5 : -161)
  const tdee = ree * (ACTIVITY_FACTOR[p.activity ?? "light"] ?? 1.45)
  let mid = tdee
  if (p.goal === "lose_weight" && !p.conditions.includes("pregnancy")) mid = tdee - 300
  if (p.goal === "gain_weight" || p.goal === "build_muscle") mid = tdee + 250
  const r = (x: number) => Math.round(x / 10) * 10
  const energy = { low: r(mid * 0.95), high: r(mid * 1.05) }
  return {
    energy,
    proteinG: { low: Math.round(p.weightKg * 0.9), high: Math.round(p.weightKg * (p.goal === "build_muscle" ? 1.6 : 1.2)) },
    fiberMinG: 25,
    carbsG: { low: Math.round((mid * 0.45) / 4), high: Math.round((mid * 0.6) / 4) },
    fatG: { low: Math.round((mid * 0.2) / 9), high: Math.round((mid * 0.35) / 9) },
    ironMg: p.sex === "female" ? 18 : 8,
    calciumMg: 1000,
    supported: !p.conditions.some((c) => ["kidney_disease", "eating_disorder"].includes(c)),
    reason: p.conditions.includes("kidney_disease") ? "Kidney disease needs clinician-defined targets (§13.3)." : undefined,
    method: "Mifflin–St Jeor estimate × activity factor",
  }
}

export function bmi(p: Profile): number | null {
  if (!p.weightKg || !p.heightCm || ageInYears(p.dateOfBirth) < 18) return null
  return p.weightKg / (p.heightCm / 100) ** 2
}

/** Adherence over resolved meals; unresolved meals are excluded, never assumed skipped (§14.6). */
export function adherence(meals: PlannedMeal[]) {
  const resolved = meals.filter((m) => m.outcome && m.outcome !== "unresolved")
  const completed = resolved.filter((m) => m.outcome !== "skipped")
  return {
    rate: resolved.length ? Math.round((completed.length / resolved.length) * 1000) / 10 : 0,
    completed: completed.length,
    resolved: resolved.length,
    asPlanned: resolved.filter((m) => m.outcome === "eaten_as_planned").length,
    modified: resolved.filter((m) => m.outcome === "eaten_modified").length,
    replaced: resolved.filter((m) => m.outcome === "replaced").length,
    skipped: resolved.filter((m) => m.outcome === "skipped").length,
  }
}

/** Hard-constraint check used by planning, swaps and recommendations (§25.2 Step 1). */
export function violatesHardConstraints(recipe: Recipe, p: Profile): string | null {
  const allergens = recipeAllergens(recipe)
  const hit = allergens.find((a) => p.allergies.includes(a))
  if (hit) return `Contains ${hit}, which is recorded as an allergy.`
  if (p.type === "infant" || p.type === "child") {
    if (recipe.profile === "adult") return "Adult recipe — not suitable for this profile."
    const months = ageInMonths(p.dateOfBirth)
    if (recipe.minAgeMonths && months < recipe.minAgeMonths) return `Suitable from ${recipe.minAgeMonths} months.`
    const unsafe = recipe.ingredients.find((i) => {
      const f = FOOD_MAP[i.foodId]
      return f?.chokingRisk || (f?.infantSafeFromMonths !== undefined && months < f.infantSafeFromMonths)
    })
    if (unsafe) return `${FOOD_MAP[unsafe.foodId]?.name} is not suitable at this age.`
  } else if (recipe.profile !== "adult") {
    return null
  }
  if (p.diet.includes("vegetarian") && recipe.ingredients.some((i) => ["fish", "meat"].includes(FOOD_MAP[i.foodId]?.category ?? ""))) return "Not vegetarian."
  if (p.diet.includes("vegan") && recipe.ingredients.some((i) => ["fish", "meat", "egg", "dairy"].includes(FOOD_MAP[i.foodId]?.category ?? ""))) return "Not vegan."
  return null
}

export const fmt = {
  kcal: (n: number) => `${Math.round(n).toLocaleString("en-US")} kcal`,
  g: (n: number) => `${Math.round(n)} g`,
  range: (low: number, high: number, unit = "") => `${Math.round(low).toLocaleString("en-US")}–${Math.round(high).toLocaleString("en-US")}${unit}`,
  bdt: (n: number) => `৳${Math.round(n).toLocaleString("en-US")}`,
}
