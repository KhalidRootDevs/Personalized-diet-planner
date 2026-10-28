// Text/voice meal parser (§42.3.1). Turns "two eggs, two roti and tea" into candidate items
// that still go through the user confirmation step.
import { FOOD_MAP } from "@/lib/data/foods"
import { uid } from "@/lib/date"
import type { JournalItem, MealType } from "@/lib/types"

const NUMBERS: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, half: 0.5, "১": 1, "২": 2, "৩": 3 }

const KEYWORDS: { words: string[]; foodId: string; perUnitGrams?: number; defaultGrams: number; unit?: string }[] = [
  { words: ["egg", "eggs", "ডিম"], foodId: "egg_boiled", perUnitGrams: 50, defaultGrams: 50, unit: "egg" },
  { words: ["omelette", "omelet"], foodId: "omelette", defaultGrams: 130 },
  { words: ["roti", "rotis", "chapati", "রুটি"], foodId: "roti", perUnitGrams: 40, defaultGrams: 40, unit: "roti" },
  { words: ["paratha", "parathas", "পরোটা"], foodId: "paratha", perUnitGrams: 70, defaultGrams: 70, unit: "paratha" },
  { words: ["bread", "slice", "slices"], foodId: "roti", perUnitGrams: 30, defaultGrams: 30, unit: "slice" },
  { words: ["tea", "cha", "চা"], foodId: "milk_tea", perUnitGrams: 150, defaultGrams: 150, unit: "cup" },
  { words: ["rice", "bhat", "ভাত"], foodId: "rice_cooked", perUnitGrams: 160, defaultGrams: 250, unit: "cup" },
  { words: ["dal", "daal", "lentil", "lentils", "ডাল"], foodId: "dal_cooked", perUnitGrams: 180, defaultGrams: 180, unit: "bowl" },
  { words: ["fish", "rui", "মাছ"], foodId: "rui_fish", perUnitGrams: 70, defaultGrams: 70, unit: "piece" },
  { words: ["hilsa", "ilish", "ইলিশ"], foodId: "hilsa_fish", perUnitGrams: 80, defaultGrams: 80, unit: "piece" },
  { words: ["chicken", "মুরগি"], foodId: "chicken_curry", perUnitGrams: 120, defaultGrams: 120, unit: "piece" },
  { words: ["beef", "গরু"], foodId: "beef_curry", defaultGrams: 120 },
  { words: ["khichuri", "khichdi", "খিচুড়ি"], foodId: "khichuri", perUnitGrams: 300, defaultGrams: 300, unit: "plate" },
  { words: ["biryani", "বিরিয়ানি"], foodId: "biryani_restaurant", perUnitGrams: 450, defaultGrams: 450, unit: "plate" },
  { words: ["banana", "bananas", "কলা"], foodId: "banana", perUnitGrams: 118, defaultGrams: 118, unit: "banana" },
  { words: ["guava", "পেয়ারা"], foodId: "guava", perUnitGrams: 100, defaultGrams: 100 },
  { words: ["mango", "আম"], foodId: "mango", defaultGrams: 165 },
  { words: ["yogurt", "doi", "curd", "দই"], foodId: "doi", perUnitGrams: 150, defaultGrams: 150, unit: "bowl" },
  { words: ["milk", "দুধ"], foodId: "milk", perUnitGrams: 240, defaultGrams: 240, unit: "cup" },
  { words: ["oats"], foodId: "oats_dry", defaultGrams: 40 },
  { words: ["chickpea", "chickpeas", "chola", "ছোলা"], foodId: "chickpeas_cooked", defaultGrams: 120 },
  { words: ["vegetable", "vegetables", "bhaji", "sobji", "সবজি"], foodId: "mixed_veg", defaultGrams: 100 },
  { words: ["spinach", "shak", "শাক"], foodId: "spinach_shak", defaultGrams: 90 },
  { words: ["bhorta", "ভর্তা"], foodId: "aloo_bhorta", perUnitGrams: 80, defaultGrams: 80, unit: "scoop" },
  { words: ["singara", "samosa", "সিঙ্গারা"], foodId: "singara", perUnitGrams: 60, defaultGrams: 60, unit: "piece" },
  { words: ["pitha", "পিঠা"], foodId: "pitha", perUnitGrams: 80, defaultGrams: 80, unit: "pitha" },
  { words: ["roshogolla", "rasgulla", "রসগোল্লা"], foodId: "rasgulla", perUnitGrams: 50, defaultGrams: 50, unit: "piece" },
  { words: ["peanut", "peanuts", "badam"], foodId: "peanuts", defaultGrams: 25 },
  { words: ["soda", "coke", "cola", "soft"], foodId: "sugary_drink", perUnitGrams: 250, defaultGrams: 250, unit: "can" },
]

export function parseMealText(text: string): JournalItem[] {
  const tokens = text
    .toLowerCase()
    .replace(/[,.;]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
  const items: JournalItem[] = []
  const seen = new Set<string>()
  tokens.forEach((tok, i) => {
    const kw = KEYWORDS.find((k) => k.words.includes(tok))
    if (!kw || seen.has(kw.foodId)) return
    seen.add(kw.foodId)
    const prev = [tokens[i - 1], tokens[i - 2]].find((t) => t !== undefined && (NUMBERS[t] !== undefined || /^\d+(\.\d+)?$/.test(t)))
    const count = prev ? (NUMBERS[prev] ?? Number(prev)) : undefined
    const grams = count && kw.perUnitGrams ? Math.round(count * kw.perUnitGrams) : kw.defaultGrams
    items.push({
      id: uid("it"),
      foodId: kw.foodId,
      displayName: FOOD_MAP[kw.foodId]?.name ?? kw.foodId,
      grams,
      unitLabel: count && kw.unit ? `${count} ${kw.unit}${count > 1 ? "s" : ""}` : undefined,
      identificationConfidence: "high",
      quantityConfidence: count ? "high" : "moderate",
      confirmedByUser: false,
      aiOriginal: { foodId: kw.foodId, grams },
    })
  })
  return items
}

export function suggestMealType(d = new Date()): MealType {
  const h = d.getHours() + d.getMinutes() / 60
  if (h < 10.5) return "breakfast"
  if (h < 12) return "morning_snack"
  if (h < 15.5) return "lunch"
  if (h < 19) return "afternoon_snack"
  if (h < 22.5) return "dinner"
  return "evening_snack"
}
