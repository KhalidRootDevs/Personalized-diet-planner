// Presentation helpers for the recipe detail and cook mode screens (§9.1, §15).
// No nutrition logic lives here: numbers come from src/lib/nutrition.ts (the engine).
import { FOOD_MAP } from "@/lib/data/foods"
import type { Food, Recipe } from "@/lib/types"

export const SPICE_LABEL = ["Not spicy", "Mild", "Medium", "Hot"] as const

/** "1 h 5 min" style durations. */
export function minutesLabel(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

/**
 * Energy shown as a rounded range (CLAUDE.md: ranges instead of false precision). ±10 % covers typical
 * variation in oil, portion and ingredient size for a home recipe; rounded to 10 kcal.
 */
export function energyRange(kcal: number): [number, number] {
  const r10 = (n: number) => Math.max(0, Math.round(n / 10) * 10)
  return [r10(kcal * 0.9), r10(kcal * 1.1)]
}

/** Closest whole household unit for a gram amount (e.g. "≈ 2 × cup"), or null. */
export function householdUnit(f: Food | undefined, grams: number): string | null {
  const unit = f?.units.find((u) => u.grams > 0 && grams / u.grams >= 1 && Math.abs(grams / u.grams - Math.round(grams / u.grams)) < 0.15)
  if (!unit) return null
  return `≈ ${Math.round(grams / unit.grams)} × ${unit.label.replace(/^1 /, "")}`
}

export const STATE_LABEL: Record<Food["state"], string> = { raw: "Raw", cooked: "Cooked", dry: "Dry", prepared: "Prepared" }

const STOP = new Set(["with", "that", "this", "your", "until", "from", "into", "only", "then", "them", "they", "have", "before", "after", "about", "each", "when", "while", "keep", "make", "sure", "over", "under", "more", "less", "than", "very", "well", "also", "serve", "served"])
/** Heat and doneness words weigh more: a doneness note belongs with the cooking step, not the prep step. */
const HEAT = new Set(["cook", "cooked", "boil", "boiled", "simmer", "steam", "fry", "fried", "roast", "bake", "grill", "reheat", "heat", "hard-boil", "set", "done", "through", "steaming"])
const words = (s: string) => new Set((s.toLowerCase().match(/[a-z]{4,}/g) ?? []).filter((w) => !STOP.has(w)))

/**
 * Attach each safety note to the step it is about (by shared keywords), so doneness and handling notes
 * appear next to the step in the list and in cook mode. Notes that match no step stay "general".
 */
export function stepSafety(recipe: Recipe): { byStep: string[][]; general: string[] } {
  const byStep: string[][] = recipe.steps.map(() => [])
  const general: string[] = []
  const stepWords = recipe.steps.map(words)
  for (const note of recipe.safetyNotes) {
    const nw = words(note)
    let best = -1
    let bestScore = 0
    stepWords.forEach((sw, i) => {
      let score = 0
      for (const w of nw) if (sw.has(w)) score += HEAT.has(w) ? 2 : 1
      if (score > bestScore) {
        best = i
        bestScore = score
      }
    })
    if (best >= 0 && bestScore >= 1) byStep[best].push(note)
    else general.push(note)
  }
  return { byStep, general }
}

export interface ResolvedSwap {
  from: string
  to: string
  note: string
  /** Ingredient index the swap applies to, when it can be matched. */
  index: number | null
  toFoodId: string | null
}

/**
 * Resolve the recipe's written swaps to ingredient rows. `from` may be a food id or a food name.
 * A swap can only be applied (and recalculated) when both sides map to food-database entries.
 */
export function resolveSwaps(recipe: Recipe): ResolvedSwap[] {
  return (recipe.swaps ?? []).map((s) => {
    const key = s.from.trim().toLowerCase()
    const index = recipe.ingredients.findIndex((i) => i.foodId === s.from || FOOD_MAP[i.foodId]?.name.toLowerCase() === key)
    const toFoodId = s.toFoodId && FOOD_MAP[s.toFoodId] ? s.toFoodId : null
    return { ...s, index: index >= 0 ? index : null, toFoodId }
  })
}

export function swapLabel(s: Pick<ResolvedSwap, "from">): string {
  return FOOD_MAP[s.from]?.name ?? s.from
}

/** Caregiver reminders shown on infant/child recipes (§12, responsive feeding, choking safety). */
export const CHILD_FEEDING_NOTES = {
  responsive: "Offer, don't force. Let your child decide how much to eat, and stop when they turn away, close their mouth or push the spoon away.",
  choking: "Sit your child upright and stay with them while they eat. Mash or cut food so it squashes easily between your fingers; no whole nuts, whole grapes or hard pieces.",
  milk: "For babies, breast milk or formula stays the main drink. Don't replace feeds with water or other drinks.",
}
