// Helpers for Home, Food Log and the logging flow (§41, §42.3).
import { FOOD_MAP } from "@/lib/data/foods"
import { addDays, todayISO, uid } from "@/lib/date"
import { ageInMonths, entryNutrition, entryUncertainty, recipeNutrition, ZERO, add, type Targets } from "@/lib/nutrition"
import { MEAL_LABEL } from "@/lib/planning"
import type { Allergen, JournalEntry, JournalItem, MealOutcome, MealPlan, MealType, Nutrients, PlannedMeal, Profile, Recipe } from "@/lib/types"

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
  const mid = entryNutritionFull(e)
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

// ─── Hidden ingredients (§41.3.3) ────────────────────────────────────────────────────────────
// Oil and sugar are added by entryNutrition (nutrition.ts). Butter, coconut milk and sauces are
// added here from fixed, illustrative standard amounts — the user tells us they were used; a photo
// can never show how much.
const BUTTER_5G: Nutrients = { ...ZERO, energyKcal: 36, fatG: 4.1 }
const COCONUT_MILK_60ML: Nutrients = { ...ZERO, energyKcal: 115, proteinG: 1.1, carbsG: 1.7, fatG: 12 }
const SAUCE_1TBSP: Nutrients = { ...ZERO, energyKcal: 30, carbsG: 6.5, fatG: 0.3 }

export function hiddenExtras(h: JournalEntry["hiddenIngredients"]): Nutrients {
  let n = ZERO
  if (h.butter) n = add(n, BUTTER_5G)
  if (h.coconutMilk) n = add(n, COCONUT_MILK_60ML)
  if (h.sauce) n = add(n, SAUCE_1TBSP)
  return n
}

/** Entry nutrition including every hidden-ingredient answer. Use this instead of entryNutrition in UI. */
export function entryNutritionFull(e: JournalEntry): Nutrients {
  return add(entryNutrition(e), hiddenExtras(e.hiddenIngredients))
}

export type HiddenKey = "oil" | "coconutMilk" | "butter" | "sugar" | "sauce"

const CURRY_RE = /curry|bhuna|korma/i
const FRIED_RE = /fried|bhaji/i

function isCurry(i: JournalItem): boolean {
  const f = FOOD_MAP[i.foodId]
  return CURRY_RE.test(i.cookingMethod ?? "") || CURRY_RE.test(f?.name ?? "")
}

/**
 * Which hidden-ingredient questions could materially change this meal's estimate (§41.3.3),
 * most material first. The caller shows only the first two up front to keep logging quick.
 */
export function hiddenQuestions(items: JournalItem[]): HiddenKey[] {
  const out: HiddenKey[] = []
  const foods = items.map((i) => ({ i, f: FOOD_MAP[i.foodId] }))
  if (foods.some(({ i, f }) => !!f && (f.category === "mixed_dish" || f.category === "meat" || f.category === "vegetable" || f.id === "dal_cooked" || FRIED_RE.test(i.cookingMethod ?? "") || isCurry(i)))) out.push("oil")
  if (items.some(isCurry)) out.push("coconutMilk")
  if (items.some((i) => ["roti", "paratha"].includes(i.foodId))) out.push("butter")
  if (items.some((i) => ["milk_tea", "doi", "milk", "oats_dry"].includes(i.foodId))) out.push("sugar")
  if (items.some((i) => i.foodId === "singara" || FOOD_MAP[i.foodId]?.variant === "restaurant" || /fried/i.test(i.cookingMethod ?? ""))) out.push("sauce")
  return out
}

/** Allergens that come from hidden-ingredient answers rather than from items (e.g. butter → milk). */
export function hiddenAllergenHits(h: JournalEntry["hiddenIngredients"], profile: Profile | undefined): Allergen[] {
  if (!profile) return []
  const hits: Allergen[] = []
  if (h.butter && profile.allergies.includes("milk")) hits.push("milk")
  if (h.oil && h.oil !== "none" && profile.allergies.includes("mustard")) hits.push("mustard")
  return hits
}

// ─── Mixed dishes (§42.3.3) ──────────────────────────────────────────────────────────────────
export const MAIN_INGREDIENTS: { id: string; label: string; foodId: string; cooking?: string; category: string }[] = [
  { id: "chicken", label: "Chicken", foodId: "chicken_curry", category: "chicken" },
  { id: "beef", label: "Beef", foodId: "beef_curry", category: "beef" },
  { id: "fish", label: "Fish", foodId: "rui_fish", cooking: "Curry", category: "fish" },
  { id: "egg", label: "Egg", foodId: "egg_boiled", cooking: "Curry", category: "egg" },
  { id: "vegetable", label: "Vegetables", foodId: "mixed_veg", cooking: "Curry", category: "vegetable" },
]

/** The first curry-type item whose main ingredient is worth asking about. */
export function mixedDishItem(items: JournalItem[]): JournalItem | undefined {
  return items.find((i) => isCurry(i) || FOOD_MAP[i.foodId]?.category === "mixed_dish")
}

// ─── Food families: compare planned recipe ingredients with what was eaten (§41.5) ──────────
const FAMILY: Record<string, string> = {
  rice_cooked: "rice",
  rice_dry: "rice",
  dal_cooked: "dal",
  lentils_dry: "dal",
  egg_boiled: "egg",
  omelette: "egg",
  rui_fish: "fish",
  hilsa_fish: "fish",
  fried_fish: "fish",
  chicken_curry: "chicken",
  beef_curry: "beef",
  biryani_home: "biryani",
  biryani_restaurant: "biryani",
  roti: "bread",
  paratha: "bread",
  milk_tea: "tea",
  mustard_oil: "oil",
  soybean_oil: "oil",
}
export const familyOf = (foodId: string) => FAMILY[foodId] ?? foodId

interface FamilyAmount {
  family: string
  name: string
  grams: number
}

function byFamily(list: { foodId: string; grams: number; name?: string }[]): Map<string, FamilyAmount> {
  const m = new Map<string, FamilyAmount>()
  list.forEach(({ foodId, grams, name }) => {
    const fam = familyOf(foodId)
    if (fam === "oil") return // cooking fat is compared through the hidden-ingredient answers
    const prev = m.get(fam)
    m.set(fam, { family: fam, name: prev?.name ?? name ?? FOOD_MAP[foodId]?.name ?? foodId, grams: (prev?.grams ?? 0) + grams })
  })
  return m
}

export interface PlanDiff {
  added: string[]
  removed: string[]
  larger: string[]
  smaller: string[]
  /** Share of the planned foods that were eaten in some form (0–1). */
  overlap: number
}

export function compareWithRecipe(recipe: Recipe, servings: number, items: JournalItem[]): PlanDiff {
  const factor = servings / recipe.servings
  const planned = byFamily(recipe.ingredients.filter((i) => !i.optional).map((i) => ({ foodId: i.foodId, grams: i.grams * factor })))
  const actual = byFamily(items.map((i) => ({ foodId: i.foodId, grams: i.grams, name: i.displayName })))
  const diff: PlanDiff = { added: [], removed: [], larger: [], smaller: [], overlap: 0 }
  let shared = 0
  planned.forEach((p, fam) => {
    const a = actual.get(fam)
    if (!a) return diff.removed.push(p.name)
    shared += 1
    if (a.grams > p.grams * 1.2) diff.larger.push(a.name)
    else if (a.grams < p.grams * 0.8) diff.smaller.push(a.name)
  })
  actual.forEach((a, fam) => {
    if (!planned.has(fam)) diff.added.push(a.name)
  })
  diff.overlap = planned.size ? shared / planned.size : 0
  return diff
}

/**
 * Unified meal outcome (§14.6, §41.5.3): same foods and portions → eaten as planned; mostly the
 * planned foods → eaten, changed; something entirely different → replaced.
 */
export function classifyOutcome(recipe: Recipe | undefined, servings: number, items: JournalItem[]): Exclude<MealOutcome, null> {
  if (!recipe) return "eaten_modified"
  const d = compareWithRecipe(recipe, servings, items)
  if (d.overlap === 1 && !d.added.length && !d.larger.length && !d.smaller.length) return "eaten_as_planned"
  if (d.overlap >= 0.5) return "eaten_modified"
  return "replaced"
}

export function describeDiff(d: PlanDiff): string {
  const parts: string[] = []
  if (d.added.length) parts.push(`added ${listNames(d.added)}`)
  if (d.removed.length) parts.push(`no ${listNames(d.removed)}`)
  if (d.larger.length) parts.push(`more ${listNames(d.larger)}`)
  if (d.smaller.length) parts.push(`less ${listNames(d.smaller)}`)
  return parts.join(" · ")
}

export function listNames(names: string[]): string {
  const lower = names.map((n) => n.replace(/ \((cooked|home|restaurant)\)/i, "").toLowerCase())
  if (lower.length <= 1) return lower.join("")
  return `${lower.slice(0, -1).join(", ")} and ${lower[lower.length - 1]}`
}

/** Minutes between the planned time and when it was eaten (positive = later). */
export function minutesLate(plannedHHMM: string, consumedAt: string): number {
  const [ph, pm] = plannedHHMM.split(":").map(Number)
  const [ah, am] = consumedAt.slice(11, 16).split(":").map(Number)
  return ah * 60 + am - (ph * 60 + pm)
}

// ─── Photos (§41.2, §41.7.3) ─────────────────────────────────────────────────────────────────
/**
 * Downscales a photo to a small private JPEG thumbnail (~320 px, quality 0.7) so it fits in
 * browser storage. Re-encoding through a canvas also drops EXIF metadata such as location.
 */
export function makeThumb(file: File, max = 320, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height))
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(img.width * s)
      canvas.height = Math.round(img.height * s)
      const ctx = canvas.getContext("2d")
      if (!ctx) return reject(new Error("no canvas"))
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL("image/jpeg", quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("unreadable image"))
    }
    img.src = url
  })
}

/** The user's own photo for an entry, if one is still stored. */
export function entryPhoto(e: JournalEntry): string | undefined {
  if (!e.hasPhoto) return undefined
  return e.photoThumb ?? e.photos?.[0]
}

// ─── Handoff into the logging flow (§42.4, §42.22) ──────────────────────────────────────────
// Restaurant and What-If items are never saved directly: they are handed to /log/new so they go
// through the same review and confirmation step as every other input.
export interface LogHandoff {
  items: JournalItem[]
  source: JournalEntry["source"]
  mealType?: MealType
  context?: string
}
const HANDOFF_KEY = "nutriplan-log-handoff"

export function setLogHandoff(h: LogHandoff) {
  try {
    sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(h))
  } catch {
    /* storage unavailable: the flow falls back to an empty log */
  }
}
export function readLogHandoff(): LogHandoff | null {
  try {
    const raw = typeof window === "undefined" ? null : sessionStorage.getItem(HANDOFF_KEY)
    return raw ? (JSON.parse(raw) as LogHandoff) : null
  } catch {
    return null
  }
}
export function clearLogHandoff() {
  try {
    sessionStorage.removeItem(HANDOFF_KEY)
  } catch {
    /* ignore */
  }
}

// ─── Edit history (§41.7, §41.10 Req. 9) ─────────────────────────────────────────────────────
export function describeEdits(before: JournalEntry, after: JournalEntry): string[] {
  const out: string[] = []
  if (before.mealType !== after.mealType) out.push(`Meal changed from ${MEAL_LABEL[before.mealType]} to ${MEAL_LABEL[after.mealType]}`)
  if (before.consumedAt !== after.consumedAt) out.push(`Time changed from ${before.consumedAt.slice(11, 16)} to ${after.consumedAt.slice(11, 16)}`)
  const prev = new Map(before.items.map((i) => [i.id, i]))
  const next = new Map(after.items.map((i) => [i.id, i]))
  after.items.forEach((i) => {
    const p = prev.get(i.id)
    if (!p) return out.push(`Added ${i.displayName} (${i.grams} g)`)
    if (p.foodId !== i.foodId) out.push(`Changed ${p.displayName} to ${i.displayName}`)
    else if (p.grams !== i.grams) out.push(`${i.displayName}: ${p.grams} g → ${i.grams} g`)
    if ((p.cookingMethod ?? "") !== (i.cookingMethod ?? "")) out.push(`${i.displayName}: cooking method set to ${i.cookingMethod || "not specified"}`)
  })
  before.items.forEach((i) => {
    if (!next.has(i.id)) out.push(`Removed ${i.displayName}`)
  })
  return out
}

// ─── Meal memory (§42.3.2) ───────────────────────────────────────────────────────────────────
export const itemsKey = (items: { foodId: string }[]) => Array.from(new Set(items.map((i) => i.foodId))).sort().join("|")

/** How many confirmed entries in the last 30 days had exactly these foods. */
export function sameMealCount(journal: JournalEntry[], profileId: string, items: { foodId: string }[]): number {
  const key = itemsKey(items)
  const since = addDays(todayISO(), -30)
  return journal.filter((e) => e.profileId === profileId && e.analysisStatus === "confirmed" && e.consumedAt.slice(0, 10) >= since && itemsKey(e.items) === key).length
}

// ─── Record confidence (§42.20) ──────────────────────────────────────────────────────────────
/** One plain sentence explaining why the day's total may be incomplete. Not a health score. */
export function recordConfidenceSentence(entries: JournalEntry[], plannedMeals: PlannedMeal[], date: string, nowHHMMStr: string): string {
  const confirmed = entries.filter((e) => e.analysisStatus === "confirmed")
  if (!confirmed.length) return "Nothing recorded yet, so there's no total to rely on."
  const fromPhoto = confirmed.filter((e) => e.hasPhoto || e.source === "photo" || e.source === "restaurant")
  const firm = confirmed.length - fromPhoto.length
  const isToday = date === todayISO()
  const missing = plannedMeals.filter((m) => (!m.outcome || m.outcome === "unresolved") && (!isToday || m.time < nowHHMMStr))
  const parts: string[] = []
  if (firm) parts.push(`${firm} ${firm === 1 ? "meal" : "meals"} logged with confirmed portions`)
  if (fromPhoto.length) parts.push(`${listNames(fromPhoto.map((e) => MEAL_LABEL[e.mealType]))} estimated from ${fromPhoto.some((e) => e.source === "restaurant") ? "a photo or restaurant estimate" : "a photo"}`.replace(/^./, (c) => c.toUpperCase()))
  if (missing.length) parts.push(`${listNames(missing.map((m) => MEAL_LABEL[m.mealType]))} not recorded`.replace(/^./, (c) => c.toUpperCase()))
  return `${parts.join("; ")}.`.replace(/^./, (c) => c.toUpperCase())
}

// ─── Dashboard recommendations (§41.6, §42.12) ───────────────────────────────────────────────
export interface Recommendation {
  id: string
  title: string
  body: string
  /** "professional" suggestions get a link to support. */
  kind?: "professional"
}

const PROTEIN_SOURCES = [
  { name: "an egg", foodId: "egg_boiled" },
  { name: "dal", foodId: "dal_cooked" },
  { name: "fish", foodId: "rui_fish" },
  { name: "chicken", foodId: "chicken_curry" },
  { name: "doi", foodId: "doi" },
  { name: "chickpeas", foodId: "chickpeas_cooked" },
]
const FIBER_SOURCES = [
  { name: "vegetables", foodId: "mixed_veg" },
  { name: "shak", foodId: "spinach_shak" },
  { name: "dal", foodId: "dal_cooked" },
  { name: "fruit like guava or banana", foodId: "banana" },
  { name: "chickpeas", foodId: "chickpeas_cooked" },
  { name: "whole-wheat roti", foodId: "roti" },
]

/** Options that pass the profile's hard constraints (allergies, vegetarian/vegan) — §25.2 Step 1. */
export function suitableSources(list: { name: string; foodId: string }[], profile: Profile): string[] {
  return list
    .filter(({ foodId }) => {
      const f = FOOD_MAP[foodId]
      if (!f) return false
      if (f.allergens.some((a) => profile.allergies.includes(a))) return false
      if (profile.diet.includes("vegetarian") && ["fish", "meat"].includes(f.category)) return false
      if (profile.diet.includes("vegan") && ["fish", "meat", "egg", "dairy"].includes(f.category)) return false
      return true
    })
    .slice(0, 3)
    .map((s) => s.name)
}

/**
 * Supportive, context-aware suggestions for the Food Log dashboard. Deterministic and never
 * compensatory: above target never leads to skipping, fasting or exercise; low intake never to a
 * big catch-up meal; persistent low intake points to a professional (§41.6, §41.10 Req. 5).
 */
export function dashboardRecommendations({ profile, targets, journal, plan, date, now = new Date() }: { profile: Profile; targets: Targets; journal: JournalEntry[]; plan?: MealPlan; date: string; now?: Date }): Recommendation[] {
  if (profile.type !== "adult" || !targets.supported) return []
  const entries = entriesFor(journal, profile.id, date).filter((e) => e.analysisStatus === "confirmed")
  const out: Recommendation[] = []
  const isToday = date === todayISO()
  const hour = isToday ? now.getHours() + now.getMinutes() / 60 : 24
  const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
  const rest = isToday ? remainingMeals((plan?.meals ?? []).filter((m) => m.date === date), hhmm) : []
  const restText = rest.length ? `You still have ${listNames(rest.map((m) => MEAL_LABEL[m.mealType]))} planned, so the total will change.` : ""

  // Persistent low intake across several reasonably complete days → professional guidance.
  const prev = [1, 2, 3, 4].map((d) => addDays(date, -d))
  const lowDays = prev.filter((d) => {
    const es = entriesFor(journal, profile.id, d).filter((e) => e.analysisStatus === "confirmed")
    return es.length >= 2 && dayRange(es).mid.energyKcal < targets.energy.low * 0.65
  })
  if (lowDays.length >= 3) {
    out.push({
      id: "persistent_low",
      kind: "professional",
      title: "Worth talking to someone",
      body: "Your recorded intake has been well below your usual range for several days. If that's not just meals you didn't log — or if you've lost weight without trying or have a low appetite — consider talking to a doctor or dietitian.",
    })
  }

  if (!entries.length) return out
  const t = dayRange(entries).mid
  const expected = isToday ? Math.min(1, Math.max(0.3, (hour - 7) / 14)) : 1

  if (t.energyKcal > targets.energy.high) {
    out.push({
      id: "over",
      title: "No need to make up for it",
      body: `${isToday ? "Today's" : "This day's"} estimate is above your usual range — that happens, and estimates can be off, especially for photos and eating out. Eat your next meal as normal when you're hungry. There's no need to skip a meal, fast or exercise extra.`,
    })
  } else if (isToday && hour >= 19 && t.energyKcal < targets.energy.low * 0.6) {
    out.push({
      id: "low_late",
      title: "A lighter day so far",
      body: `Your recorded intake is below your usual range for this time of day. ${restText || "If you're hungry, a normal-sized meal or snack is fine — there's no need for one big catch-up meal."} If you ate something you haven't logged, adding it makes this more accurate.`,
    })
  }

  if (t.proteinG < targets.proteinG.low * expected * 0.7 && (!isToday || hour >= 13)) {
    const opts = suitableSources(PROTEIN_SOURCES, profile)
    out.push({
      id: "protein",
      title: "Protein",
      body: `Your recorded meals may be low in protein${isToday ? " so far today" : ""}.${opts.length ? ` Adding ${listNames(opts)} to a meal you're already having can help.` : ""}${rest.length ? " " + restText : ""}`,
    })
  }
  if (t.fiberG < targets.fiberMinG * expected * 0.6 && (!isToday || hour >= 13)) {
    const opts = suitableSources(FIBER_SOURCES, profile)
    out.push({
      id: "fiber",
      title: "Fiber",
      body: `Your recorded meals may be low in fiber.${opts.length ? ` ${listNames(opts).replace(/^./, (c) => c.toUpperCase())} at your next meal would add some.` : ""}`,
    })
  }
  return out.slice(0, 3)
}
