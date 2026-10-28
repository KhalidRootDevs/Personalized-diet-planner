// Mock photo analysis (§41.3). Deterministic samples stand in for a vision model.
// The model only proposes foods and portions; nutrition is computed later by the engine.
import { FOOD_MAP } from "@/lib/data/foods"
import { uid } from "@/lib/date"
import type { JournalItem, MealType } from "@/lib/types"

type Sample = { foodId: string; grams: number; unitLabel?: string; id: "high" | "moderate" | "low"; q: "high" | "moderate" | "low"; cooking?: string }

const SAMPLES: Record<string, Sample[]> = {
  breakfast: [
    { foodId: "paratha", grams: 140, unitLabel: "2 paratha", id: "high", q: "moderate", cooking: "Pan-fried" },
    { foodId: "omelette", grams: 130, unitLabel: "2-egg omelette", id: "moderate", q: "moderate", cooking: "Pan-fried" },
    { foodId: "milk_tea", grams: 150, unitLabel: "1 cup", id: "moderate", q: "high" },
  ],
  lunch: [
    { foodId: "rice_cooked", grams: 250, unitLabel: "Medium plate", id: "high", q: "moderate" },
    { foodId: "fried_fish", grams: 80, unitLabel: "1 piece", id: "moderate", q: "moderate", cooking: "Fried" },
    { foodId: "dal_cooked", grams: 180, unitLabel: "Medium bowl", id: "high", q: "low" },
    { foodId: "mixed_veg", grams: 100, unitLabel: "Small bowl", id: "moderate", q: "moderate" },
  ],
  dinner: [
    { foodId: "roti", grams: 80, unitLabel: "2 roti", id: "high", q: "high" },
    { foodId: "chicken_curry", grams: 150, unitLabel: "Small bowl", id: "moderate", q: "low", cooking: "Curry" },
    { foodId: "spinach_shak", grams: 90, unitLabel: "Small bowl", id: "moderate", q: "moderate" },
  ],
  snack: [
    { foodId: "singara", grams: 120, unitLabel: "2 pieces", id: "moderate", q: "high", cooking: "Deep-fried" },
    { foodId: "milk_tea", grams: 150, unitLabel: "1 cup", id: "moderate", q: "high" },
  ],
}

export function analyzePhoto(mealType: MealType): JournalItem[] {
  const key = mealType === "breakfast" ? "breakfast" : mealType === "lunch" ? "lunch" : mealType === "dinner" ? "dinner" : "snack"
  return SAMPLES[key].map((s) => ({
    id: uid("it"),
    foodId: s.foodId,
    displayName: FOOD_MAP[s.foodId]?.name ?? s.foodId,
    grams: s.grams,
    unitLabel: s.unitLabel,
    identificationConfidence: s.id,
    quantityConfidence: s.q,
    confirmedByUser: false,
    cookingMethod: s.cooking,
    aiOriginal: { foodId: s.foodId, grams: s.grams },
  }))
}

/** Hidden ingredients matter for curries, fried and mixed dishes (§41.3.3). */
export function needsHiddenIngredientQuestion(items: JournalItem[]): boolean {
  return items.some((i) => {
    const f = FOOD_MAP[i.foodId]
    return !!f && (f.category === "mixed_dish" || f.category === "meat" || f.category === "vegetable" || /fried|curry/i.test(i.cookingMethod ?? "") || f.id === "dal_cooked")
  })
}

export function hasSweetDrink(items: JournalItem[]): boolean {
  return items.some((i) => i.foodId === "milk_tea")
}

// Simulated packaged product for barcode logging (§42.3, §42.21).
export const BARCODE_PRODUCT = {
  name: "Chocolate cream biscuits (packaged)",
  brand: "Sample brand",
  servingGrams: 30,
  per100g: { energyKcal: 480, proteinG: 6, carbsG: 68, fatG: 20, fiberG: 2 },
  listedAllergens: ["wheat", "milk"],
  incomplete: true,
}
