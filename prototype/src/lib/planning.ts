// Constrained meal planning (§25), swaps (§42.11) and shopping lists (§16, §42.8).
import { FOOD_MAP } from "@/lib/data/foods"
import { RECIPES, RECIPE_MAP } from "@/lib/data/recipes"
import { addDays, uid } from "@/lib/date"
import { recipeCostPerServing, recipeNutrition, violatesHardConstraints } from "@/lib/nutrition"
import type { MealPlan, MealType, PantryItem, PlannedMeal, Profile, Recipe, ShoppingItem } from "@/lib/types"

export interface PlanOptions {
  durationDays: number
  startDate: string
  mealsPerDay: 3 | 4 | 5
  preset: "balanced" | "lowest_cost" | "high_protein" | "quick" | "pantry" | "seasonal"
  maxPrepMinutes: number
  times: Partial<Record<MealType, string>>
}

const SLOTS: Record<3 | 4 | 5, MealType[]> = {
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

function eligible(slot: MealType, p: Profile, opts: Pick<PlanOptions, "maxPrepMinutes">): Recipe[] {
  const matchSlot = (r: Recipe) => r.mealTypes.includes(slot) || (slot.includes("snack") && r.mealTypes.some((t) => t.includes("snack")))
  return RECIPES.filter((r) => r.profile === "adult" && matchSlot(r) && !violatesHardConstraints(r, p) && r.prepMinutes + r.cookMinutes <= Math.max(opts.maxPrepMinutes, 15) + 30)
}

function rank(list: Recipe[], preset: PlanOptions["preset"]): Recipe[] {
  const score = (r: Recipe) => {
    const n = recipeNutrition(r)
    switch (preset) {
      case "lowest_cost":
        return recipeCostPerServing(r)
      case "high_protein":
        return -n.proteinG
      case "quick":
        return r.prepMinutes + r.cookMinutes
      default:
        return 0
    }
  }
  return [...list].sort((a, b) => score(a) - score(b))
}

/** Build a draft plan; hard constraints first, then soft ranking, then variety (§25.2). */
export function generatePlan(p: Profile, opts: PlanOptions): MealPlan {
  const slots = SLOTS[opts.mealsPerDay]
  const meals: PlannedMeal[] = []
  const warnings: string[] = []
  for (let d = 0; d < opts.durationDays; d++) {
    const date = addDays(opts.startDate, d)
    for (const slot of slots) {
      const options = rank(eligible(slot, p, opts), opts.preset)
      if (!options.length) {
        warnings.push(`No eligible ${MEAL_LABEL[slot].toLowerCase()} recipe meets every constraint.`)
        continue
      }
      // Weekly variety (§25.4): rotate, but keep the best options in the pool for preset-driven plans.
      const pool = opts.preset === "balanced" ? options : options.slice(0, Math.max(2, Math.ceil(options.length / 2)))
      const recipe = pool[(d + slots.indexOf(slot)) % pool.length]
      meals.push({
        id: uid("meal"),
        date,
        mealType: slot,
        time: opts.times[slot] ?? DEFAULT_TIMES[slot],
        recipeId: recipe.id,
        servings: 1,
        scheduleStatus: "upcoming",
        outcome: null,
      })
    }
  }
  return {
    id: uid("plan"),
    title: `${opts.durationDays}-day ${presetLabel(opts.preset).toLowerCase()} plan`,
    goal: p.goal ?? "improve_nutrition",
    durationDays: opts.durationDays,
    startDate: opts.startDate,
    status: "draft",
    validation: { nutrition: true, safety: warnings.length === 0, requiresReview: p.conditions.some((c) => ["kidney_disease", "pregnancy"].includes(c)), warnings: Array.from(new Set(warnings)) },
    createdAt: new Date().toISOString(),
    meals,
  }
}

export function presetLabel(preset: PlanOptions["preset"]): string {
  return { balanced: "Balanced", lowest_cost: "Lowest-cost", high_protein: "High-protein", quick: "Quick workday", pantry: "Pantry-first", seasonal: "Seasonal" }[preset]
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
  const current = RECIPE_MAP[meal.recipeId]
  if (!current) return []
  const cn = recipeNutrition(current)
  const cc = recipeCostPerServing(current)
  const pantryIds = new Set(pantry.map((i) => i.foodId))
  const opts = eligible(meal.mealType, p, { maxPrepMinutes: 90 })
    .filter((r) => r.id !== current.id)
    .map((r) => {
      const n = recipeNutrition(r)
      const deltaKcal = n.energyKcal - cn.energyKcal
      return {
        recipe: r,
        deltaKcal,
        deltaProtein: n.proteinG - cn.proteinG,
        deltaCost: recipeCostPerServing(r) - cc,
        deltaMinutes: r.prepMinutes + r.cookMinutes - (current.prepMinutes + current.cookMinutes),
        pantryHits: r.ingredients.filter((i) => pantryIds.has(i.foodId)).length,
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

/** Aggregate ingredients across meals, consolidating duplicates (§16.1). */
export function buildShoppingList(meals: PlannedMeal[], people = 1, pantry: PantryItem[] = []): ShoppingItem[] {
  const totals = new Map<string, number>()
  for (const m of meals) {
    const r = RECIPE_MAP[m.recipeId]
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
