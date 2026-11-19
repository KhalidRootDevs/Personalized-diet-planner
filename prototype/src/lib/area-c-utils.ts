"use client"

// Helpers for the Plan and Recipes areas.
import { RECIPE_MAP } from "@/lib/data/recipes"
import { useApp } from "@/lib/store"
import { validateDay } from "@/lib/planning"
import type { MealOutcome, PlannedMeal, Recipe } from "@/lib/types"

/** Mock reviewer used by the prototype's admin queue (§28). */
export const MOCK_REVIEWER = "Dr. Farhana Rahman, RD (mock dietitian)"

/**
 * Re-run validation for the plan that holds `mealId` after a reschedule or replacement (§25.2 step 8),
 * store the fresh result on the plan, and return a one-line summary for the day.
 */
export function revalidateAfterChange(mealId: string): { ok: boolean; summary: string } | null {
  const st = useApp.getState()
  const plan = st.plans.find((p) => p.meals.some((m) => m.id === mealId))
  const meal = plan?.meals.find((m) => m.id === mealId)
  const self = st.profiles.find((p) => p.relation === "self")
  if (!plan || !meal || !self) return null
  const res = validateDay(plan, meal.date, self)
  st.updatePlan(plan.id, { validation: res.validation })
  return { ok: res.ok, summary: res.summary }
}

const EQUIPMENT_WORDS: [RegExp, string][] = [
  [/pan|fry|tawa|sauté|stir-fry/i, "Frying pan or tawa"],
  [/pot|boil|simmer|cook rice|lentils/i, "Saucepan or pot"],
  [/blend|purée|puree/i, "Blender or masher"],
  [/mash|fork/i, "Fork or masher"],
  [/steam/i, "Steamer"],
  [/whisk/i, "Bowl and whisk"],
]

/** Equipment (§9.1): recipe field, else derived from the steps. */
export function recipeEquipment(r: Recipe): string[] {
  if (r.equipment?.length) return r.equipment
  const text = r.steps.join(" ")
  const found = EQUIPMENT_WORDS.filter(([re]) => re.test(text)).map(([, label]) => label)
  return found.length ? Array.from(new Set(found)) : ["No special equipment"]
}

/** Reheating guidance (§9.1) where relevant. */
export function recipeReheating(r: Recipe): string | null {
  if (r.reheating) return r.reheating
  if (r.cookMinutes === 0) return null
  if (r.profile !== "adult") return "Reheat only once, until steaming hot, then cool to a safe eating temperature. Don't reheat leftovers from a bowl your baby ate from."
  return "Reheat until steaming hot all the way through. Reheat only the portion you'll eat, once."
}

export function recipeSource(r: Recipe): string {
  if (r.source) return r.source
  if (r.reviewStatus === "personal") return "You · personal recipe"
  if (r.reviewStatus === "pending") return "NutriPlan recipe team · awaiting pediatric review"
  return "NutriPlan recipe team · reviewed (prototype content)"
}

/** Looks up a library recipe, falling back to the user's personal recipes (§42.5). */
export function useRecipeLookup() {
  const userRecipes = useApp((s) => s.userRecipes)
  return (id: string): Recipe | undefined => RECIPE_MAP[id] ?? userRecipes.find((r) => r.id === id)
}

export function friendlyGrams(g: number): string {
  if (g >= 1000) return `${(Math.round(g / 100) / 10).toLocaleString("en-US")} kg`
  return `${Math.round(g)} g`
}

/** Status label for a planned meal (§14.6) — planned vs eaten must read clearly. */
export function mealStatus(meal: PlannedMeal): { label: string; tone: "planned" | "eaten" | "changed" | "skipped" | "unknown" } {
  const map: Record<Exclude<MealOutcome, null>, { label: string; tone: "planned" | "eaten" | "changed" | "skipped" | "unknown" }> = {
    eaten_as_planned: { label: "Eaten", tone: "eaten" },
    eaten_modified: { label: "Eaten, changed", tone: "changed" },
    replaced: { label: "Replaced", tone: "changed" },
    skipped: { label: "Skipped", tone: "skipped" },
    unresolved: { label: "Not recorded", tone: "unknown" },
  }
  if (meal.outcome) return map[meal.outcome]
  if (meal.scheduleStatus === "paused") return { label: "Paused", tone: "skipped" }
  if (meal.scheduleStatus === "due") return { label: "Due now", tone: "planned" }
  if (meal.scheduleStatus === "rescheduled") return { label: "Planned · moved", tone: "planned" }
  return { label: "Planned", tone: "planned" }
}

export const STATUS_STYLE: Record<string, string> = {
  planned: "border border-dashed border-input text-muted-foreground",
  eaten: "bg-sage text-forest",
  changed: "bg-amber-tint text-amber-text",
  skipped: "bg-muted text-muted-foreground",
  unknown: "bg-muted text-muted-foreground",
}
