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
    ...(a.sodiumMg !== undefined || b.sodiumMg !== undefined ? { sodiumMg: (a.sodiumMg ?? 0) + (b.sodiumMg ?? 0) } : {}),
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
    ...(n.sodiumMg !== undefined ? { sodiumMg: n.sodiumMg * f } : {}),
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
  if (recipe.costPerServingBdt !== undefined && recipe.costPerServingBdt > 0) return Math.round(recipe.costPerServingBdt)
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

// Personal recipes (§42.5) live in the store; the engine sees them through this registry so
// planned-meal nutrition and shopping lists include them (synced from src/lib/store.ts).
let USER_RECIPES: Record<string, Recipe> = {}
export function registerUserRecipes(list: Recipe[]) {
  USER_RECIPES = Object.fromEntries(list.map((r) => [r.id, r]))
}
/** Verified library first, then the user's personal recipes. */
export function findRecipe(id: string): Recipe | undefined {
  return RECIPE_MAP[id] ?? USER_RECIPES[id]
}

export function plannedMealNutrition(meal: PlannedMeal): Nutrients {
  const r = findRecipe(meal.recipeId)
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

/**
 * Conditions that need a qualified professional before a generated plan can be activated
 * (§13.1 level 3, §13.3). Single source of truth — import it, don't copy the list.
 */
export const REVIEW_REQUIRED_CONDITIONS = ["kidney_disease", "eating_disorder", "pregnancy", "swallowing"] as const
/** Conditions where personalized calorie targets are not produced at all (§13.1, §6.3). */
export const UNSUPPORTED_TARGET_CONDITIONS = ["kidney_disease", "eating_disorder"] as const

export function needsProfessionalReview(p: Pick<Profile, "conditions">): boolean {
  return p.conditions.some((c) => (REVIEW_REQUIRED_CONDITIONS as readonly string[]).includes(c))
}

export const ASSESSMENT_VERSION = "proto-1.1"

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
  /** §6.8 structured output: safety warnings, review flag and version. */
  safetyWarnings: string[]
  requiresReview: boolean
  version: string
  /** Estimated maintenance energy, kept separate from any goal adjustment (§6.3). */
  maintenanceKcal?: number
}

/**
 * Adult targets via Mifflin–St Jeor (§6.2) with ranges, not single numbers (§6.2, §25.2 Step 2).
 * Never applied to infants or children (§18.5).
 */
export function adultTargets(p: Profile): Targets {
  const age = ageInYears(p.dateOfBirth)
  const requiresReview = needsProfessionalReview(p)
  if (p.type !== "adult" || age < 18 || !p.weightKg || !p.heightCm || !p.sex) {
    return { energy: { low: 0, high: 0 }, proteinG: { low: 0, high: 0 }, fiberMinG: 0, carbsG: { low: 0, high: 0 }, fatG: { low: 0, high: 0 }, ironMg: 0, calciumMg: 0, supported: false, reason: "Adult equations are not used for this profile.", method: "—", safetyWarnings: [], requiresReview, version: ASSESSMENT_VERSION }
  }
  const ree = 10 * p.weightKg + 6.25 * p.heightCm - 5 * age + (p.sex === "male" ? 5 : -161)
  const tdee = ree * (ACTIVITY_FACTOR[p.activity ?? "light"] ?? 1.45)
  const safetyWarnings: string[] = []
  const bmiValue = p.weightKg / (p.heightCm / 100) ** 2
  let mid = tdee
  if (p.goal === "lose_weight") {
    // §6.3: never auto-prescribe restriction for underweight, pregnant, breastfeeding or ED-risk users.
    const noDeficit = bmiValue < 18.5 || p.conditions.some((c) => ["pregnancy", "breastfeeding", "eating_disorder"].includes(c))
    if (noDeficit) {
      safetyWarnings.push(
        bmiValue < 18.5
          ? "Your weight is already in a lower range for your height, so we won't plan for weight loss. Your plan focuses on steady, nourishing meals. If you're worried about your weight, a doctor or dietitian can help."
          : "We don't reduce energy during pregnancy, breastfeeding or with a history of an eating disorder. Your plan focuses on nourishing, regular meals.",
      )
    } else mid = tdee - 300
  }
  if (p.goal === "gain_weight" || p.goal === "build_muscle") mid = tdee + 250
  if (requiresReview) safetyWarnings.push("A recorded health condition means a qualified professional reviews your plan before it is activated.")
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
    supported: !p.conditions.some((c) => (UNSUPPORTED_TARGET_CONDITIONS as readonly string[]).includes(c)),
    reason: p.conditions.includes("kidney_disease")
      ? "Kidney disease needs clinician-defined targets (§13.3)."
      : p.conditions.includes("eating_disorder")
        ? "With a history of an eating disorder, targets are best set together with your care team (§13.3)."
        : undefined,
    method: "Mifflin–St Jeor estimate × activity factor",
    safetyWarnings,
    requiresReview,
    version: ASSESSMENT_VERSION,
    maintenanceKcal: r(tdee),
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

export type ConstraintKind = "allergen" | "age" | "diet" | "medical"

/** Foods treated as sugar-sweetened for the diabetes constraint (illustrative rule set). */
const SUGAR_SWEETENED = new Set(["sugary_drink", "milk_tea", "rasgulla", "pitha", "honey"])
/** Per-serving sodium above which a recipe is excluded for hypertension, when sodium data exists. */
export const SODIUM_LIMIT_PER_MEAL_MG = 800

function hasGlutenRule(p: Profile) {
  return p.conditions.includes("celiac") || p.diet.includes("gluten_free")
}

/**
 * Hard-constraint check (§25.2 Step 1, §13.6). Hard constraints are never traded for cost,
 * popularity or convenience — ranking only ever sees recipes that pass this.
 */
export function hardConstraintViolation(recipe: Recipe, p: Profile): { kind: ConstraintKind; reason: string } | null {
  const foods = recipe.ingredients.map((i) => FOOD_MAP[i.foodId]).filter((f): f is NonNullable<typeof f> => !!f)
  const allergens = recipeAllergens(recipe)
  const hit = allergens.find((a) => p.allergies.includes(a))
  if (hit) return { kind: "allergen", reason: `Contains ${hit}, which is recorded as an allergy.` }
  if (hasGlutenRule(p) && allergens.includes("wheat")) {
    return p.conditions.includes("celiac")
      ? { kind: "medical", reason: "Contains wheat (gluten), which is excluded for celiac disease." }
      : { kind: "diet", reason: "Contains wheat (gluten) — not gluten-free." }
  }
  if (p.type === "infant" || p.type === "child") {
    if (recipe.profile === "adult") return { kind: "age", reason: "Adult recipe — not suitable for this profile." }
    const months = ageInMonths(p.dateOfBirth)
    if (recipe.minAgeMonths && months < recipe.minAgeMonths) return { kind: "age", reason: `Suitable from ${recipe.minAgeMonths} months.` }
    const unsafe = recipe.ingredients.find((i) => {
      const f = FOOD_MAP[i.foodId]
      return f?.chokingRisk || (f?.infantSafeFromMonths !== undefined && months < f.infantSafeFromMonths)
    })
    if (unsafe) return { kind: "age", reason: `${FOOD_MAP[unsafe.foodId]?.name} is not suitable at this age.` }
  } else if (recipe.profile !== "adult") {
    return null
  }
  const cats = new Set<string>(foods.map((f) => f.category))
  const vegan = p.diet.includes("vegan")
  if (vegan && (["fish", "meat", "egg", "dairy"].some((c) => cats.has(c)) || allergens.includes("milk") || allergens.includes("egg") || foods.some((f) => f.id === "honey")))
    return { kind: "diet", reason: "Not vegan." }
  if (p.diet.includes("vegetarian") && (cats.has("fish") || cats.has("meat"))) return { kind: "diet", reason: "Not vegetarian." }
  if (p.diet.includes("pescatarian") && cats.has("meat")) return { kind: "diet", reason: "Contains meat — not pescatarian." }
  if (p.diet.includes("egg_free") && (cats.has("egg") || allergens.includes("egg"))) return { kind: "diet", reason: "Contains egg — you prefer egg-free meals." }
  if (p.diet.includes("dairy_free") && (cats.has("dairy") || allergens.includes("milk"))) return { kind: "diet", reason: "Contains dairy — you prefer dairy-free meals." }
  if (p.conditions.includes("diabetes")) {
    const sweet = foods.find((f) => SUGAR_SWEETENED.has(f.id) || f.category === "sweet")
    if (sweet) return { kind: "medical", reason: `Contains ${sweet.name.toLowerCase()} (sugar-sweetened), which plans avoid with diabetes.` }
  }
  if (p.conditions.includes("hypertension")) {
    const sodium = recipeSodium(recipe)
    if (sodium.complete && sodium.perServingMg > SODIUM_LIMIT_PER_MEAL_MG) return { kind: "medical", reason: `About ${Math.round(sodium.perServingMg)} mg sodium per serving — above the limit used for high blood pressure.` }
  }
  return null
}

/** Hard-constraint check used by planning, swaps and recommendations (§25.2 Step 1). */
export function violatesHardConstraints(recipe: Recipe, p: Profile): string | null {
  return hardConstraintViolation(recipe, p)?.reason ?? null
}

/** Same rules for a single food (ingredient alternatives, §8.4). */
export function foodViolatesHardConstraints(foodId: string, p: Profile): string | null {
  const probe: Recipe = { id: `probe_${foodId}`, name: foodId, nameBn: "", description: "", mealTypes: [], profile: p.type === "adult" ? "adult" : p.type, prepMinutes: 0, cookMinutes: 0, servings: 1, difficulty: "easy", ingredients: [{ foodId, grams: 100 }], steps: [], safetyNotes: [], tags: [], reviewStatus: "approved", swatch: "sage", icon: "Utensils" }
  return violatesHardConstraints(probe, p)
}

/** Sodium per serving and whether every ingredient has sodium data ("where data allows"). */
export function recipeSodium(recipe: Recipe): { perServingMg: number; complete: boolean } {
  let total = 0
  let complete = recipe.ingredients.length > 0
  for (const i of recipe.ingredients) {
    const v = FOOD_MAP[i.foodId]?.per100g.sodiumMg
    if (v === undefined) complete = false
    else total += (v * i.grams) / 100
  }
  return { perServingMg: total / recipe.servings, complete }
}

/** Plain-language list of the hard rules applied for this profile (explanations, §25.2 Step 9). */
export function activeHardRules(p: Profile): string[] {
  const rules: string[] = []
  if (p.allergies.length) rules.push(`no ${p.allergies.join(", ").replace(/_/g, " ")} (allergy)`)
  if (hasGlutenRule(p)) rules.push(p.conditions.includes("celiac") ? "no wheat/gluten (celiac)" : "gluten-free")
  for (const d of ["vegan", "vegetarian", "pescatarian"]) if (p.diet.includes(d)) rules.push(d)
  if (p.diet.includes("egg_free")) rules.push("egg-free")
  if (p.diet.includes("dairy_free")) rules.push("dairy-free")
  if (p.conditions.includes("diabetes")) rules.push("no sugar-sweetened items (diabetes)")
  if (p.conditions.includes("hypertension")) rules.push(`sodium under ~${SODIUM_LIMIT_PER_MEAL_MG} mg per meal where data exists (blood pressure)`)
  return rules
}

export type HydrationGuide =
  | { kind: "range"; lowGlasses: number; highGlasses: number; glassMl: number; note: string }
  | { kind: "individualized"; note: string }
  | { kind: "infant"; note: string }

/**
 * Hydration guidance (§6.7). No universal prescription for conditions that need
 * individualized fluid advice; infants never get water instead of breast milk or formula.
 */
export function hydrationGuide(p: Profile): HydrationGuide {
  if (p.conditions.some((c) => ["kidney_disease", "heart_disease"].includes(c)))
    return { kind: "individualized", note: "Fluid needs with your condition are individual. Follow the amount your care team recommends." }
  if (p.type === "infant") {
    const months = ageInMonths(p.dateOfBirth)
    return {
      kind: "infant",
      note:
        months < 6
          ? "Breast milk or formula gives your baby all the fluid they need. Don't give water unless your health worker advises it."
          : "Keep breast milk or formula as the main drink. You can offer small sips of clean, boiled and cooled water with meals — never instead of milk feeds.",
    }
  }
  if (p.type === "child") return { kind: "range", lowGlasses: 4, highGlasses: 6, glassMl: 200, note: "Offer water with meals and when thirsty; more in hot weather or after active play." }
  const kg = p.weightKg ?? 60
  const extra = ["moderate", "very", "extreme"].includes(p.activity ?? "") ? 2 : 0
  const preg = p.conditions.includes("pregnancy") || p.conditions.includes("breastfeeding") ? 2 : 0
  const low = Math.round((kg * 30) / 250) + extra + preg
  const high = Math.round((kg * 35) / 250) + extra + preg
  return { kind: "range", lowGlasses: Math.max(6, low), highGlasses: Math.max(8, high), glassMl: 250, note: "A general range from all drinks. Drink more in hot weather, with heat at work or after exercise." }
}

export const fmt = {
  kcal: (n: number) => `${Math.round(n).toLocaleString("en-US")} kcal`,
  g: (n: number) => `${Math.round(n)} g`,
  range: (low: number, high: number, unit = "") => `${Math.round(low).toLocaleString("en-US")}–${Math.round(high).toLocaleString("en-US")}${unit}`,
  bdt: (n: number) => `৳${Math.round(n).toLocaleString("en-US")}`,
}
