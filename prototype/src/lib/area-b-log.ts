// Helpers for Home, Food Log and the logging flow (§41, §42.3).
import { FOOD_MAP } from "@/lib/data/foods"
import { uid } from "@/lib/date"
import { ageInMonths, entryNutrition, entryUncertainty, recipeNutrition, ZERO, add, type Targets } from "@/lib/nutrition"
import { MEAL_LABEL } from "@/lib/planning"
import type { Allergen, JournalEntry, JournalItem, MealType, Nutrients, PlannedMeal, Profile, Recipe } from "@/lib/types"

export const SOURCE_LABEL: Record<JournalEntry["source"], string> = {
  photo: "Photo",
  manual: "Manual",
  text: "Text",
  voice: "Voice",
  barcode: "Barcode",
  saved: "Saved meal",
  recipe: "Recipe",
  restaurant: "Restaurant",
  planned: "From plan",
}

export const MEAL_ORDER: MealType[] = ["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner", "evening_snack", "drinks", "other"]

// Version stamps stored with each entry (§41.7). Fixed values in the prototype.
export const VERSIONS = { model: "vision-mock 0.3", foodDb: "BD food DB 2026.10", calculation: "calc 1.4" }

export function entriesFor(journal: JournalEntry[], profileId: string, date: string): JournalEntry[] {
  return journal
    .filter((e) => e.profileId === profileId && e.consumedAt.slice(0, 10) === date)
    .sort((a, b) => a.consumedAt.localeCompare(b.consumedAt))
}

export function entryTitle(e: JournalEntry): string {
  if (!e.items.length) return MEAL_LABEL[e.mealType]
  const names = e.items.map((i) => i.displayName)
  return names.length > 3 ? `${names.slice(0, 3).join(", ")} +${names.length - 3}` : names.join(", ")
}

export interface Range {
  mid: Nutrients
  low: number
  high: number
}

/** Energy estimate with a ± band from the least certain item (§41.3.4). */
export function entryRange(e: JournalEntry): Range {
  const mid = entryNutrition(e)
  const u = entryUncertainty(e)
  return { mid, low: mid.energyKcal * (1 - u), high: mid.energyKcal * (1 + u) }
}

export function dayRange(entries: JournalEntry[]): Range {
  return entries
    .filter((e) => e.analysisStatus === "confirmed")
    .map(entryRange)
    .reduce((acc, r) => ({ mid: add(acc.mid, r.mid), low: acc.low + r.low, high: acc.high + r.high }), { mid: ZERO, low: 0, high: 0 })
}

export function itemFromFood(foodId: string, grams?: number, unitLabel?: string): JournalItem {
  const f = FOOD_MAP[foodId]
  const g = grams ?? f?.units[0]?.grams ?? 100
  return {
    id: uid("it"),
    foodId,
    displayName: f?.name ?? foodId,
    grams: g,
    unitLabel: unitLabel ?? (grams === undefined ? f?.units[0]?.label : undefined),
    identificationConfidence: "high",
    quantityConfidence: "moderate",
    confirmedByUser: false,
  }
}

/** A planned recipe eaten as planned becomes items from its actual ingredient quantities (§9). */
export function itemsFromRecipe(recipe: Recipe, servings = 1): JournalItem[] {
  const factor = servings / recipe.servings
  return recipe.ingredients
    .filter((i) => !i.optional)
    .map((i) => ({ ...itemFromFood(i.foodId, Math.round(i.grams * factor)), quantityConfidence: "high" as const }))
}

export function allergenHits(items: JournalItem[], profile: Profile | undefined): { item: JournalItem; allergen: Allergen }[] {
  if (!profile) return []
  return items.flatMap((item) => (FOOD_MAP[item.foodId]?.allergens ?? []).filter((a) => profile.allergies.includes(a)).map((allergen) => ({ item, allergen })))
}

/** Infant food-safety flags (§12.4, §13.5). Never softened by preference or price. */
export function infantFlags(foodId: string, profile: Profile | undefined): string | null {
  if (!profile || profile.type === "adult") return null
  const f = FOOD_MAP[foodId]
  if (!f) return null
  const months = ageInMonths(profile.dateOfBirth)
  if (f.infantSafeFromMonths !== undefined && months < f.infantSafeFromMonths) return `Not suitable before ${f.infantSafeFromMonths} months`
  if (f.chokingRisk) return "Choking risk — serve soft, mashed or finely cut"
  if (f.category === "drink" && f.id !== "breast_milk") return "Not recommended for infants"
  return null
}

export function remainingMeals(meals: PlannedMeal[], nowHHMM: string): PlannedMeal[] {
  return meals.filter((m) => !m.outcome && m.time >= nowHHMM).sort((a, b) => a.time.localeCompare(b.time))
}

/**
 * One supportive next step after logging (§41.6). Deterministic and never compensatory:
 * an over-target meal never leads to skipping or restriction, and low intake never to a catch-up meal.
 */
export function supportiveSuggestion(totals: Nutrients, targets: Targets, next: { meal: PlannedMeal; recipe?: Recipe } | undefined): { title: string; body: string } {
  if (!targets.supported) return { title: "Logged", body: "Your entry is saved. Your care team's guidance comes first for your targets." }
  const nextName = next?.recipe ? `${MEAL_LABEL[next.meal.mealType].toLowerCase()} (${next.recipe.name})` : "next meal"
  if (totals.energyKcal > targets.energy.high) {
    return {
      title: "No need to make up for it",
      body: `Today's estimate is above your usual range — that happens. Keep your ${nextName} as planned and eat when you're hungry.`,
    }
  }
  const proteinGap = targets.proteinG.low - totals.proteinG
  if (next?.recipe && proteinGap > 20) {
    const p = Math.round(recipeNutrition(next.recipe, next.meal.servings).proteinG)
    return {
      title: "A gentle idea for later",
      body: `Your recorded meals may be low in protein so far. Your planned ${nextName} adds about ${p} g.`,
    }
  }
  if (totals.fiberG < targets.fiberMinG * 0.4 && next) {
    return { title: "A gentle idea for later", body: "Adding vegetables, dal or fruit at your next meal would bring in more fiber." }
  }
  if (next?.recipe) return { title: "You're on track", body: `Your ${nextName} is at the usual time. Nothing to change.` }
  return { title: "Nicely done", body: "That's your day recorded. Check your weekly review for the bigger picture." }
}
