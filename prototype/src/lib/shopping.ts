// Shopping scope, substitutions, meal-prep tasks and pantry deduction (§16, §42.8).
// Wraps the planning engine's buildShoppingList; nutrition always comes from the food DB (§18.5).
import { FOOD_MAP } from "@/lib/data/foods"
import { buildShoppingList, MEAL_LABEL } from "@/lib/planning"
import { foodNutrients, recipeNutrition } from "@/lib/nutrition"
import { addDays, formatDay, fromISO, todayISO } from "@/lib/date"
import type { Allergen, MealPlan, Nutrients, PantryItem, PlannedMeal, Profile, Recipe, ShoppingItem } from "@/lib/types"

export interface ShoppingScope {
  from: string
  to: string
  excluded: string[]
}

export function defaultScope(plan: MealPlan | undefined): ShoppingScope {
  const today = todayISO()
  const end = plan ? addDays(plan.startDate, plan.durationDays - 1) : addDays(today, 6)
  return { from: today, to: end < today ? today : end, excluded: [] }
}

/** Meals that feed the list: inside the date range, not excluded, not already resolved. */
export function scopedMeals(plan: MealPlan | undefined, scope: ShoppingScope): PlannedMeal[] {
  if (!plan) return []
  return plan.meals.filter((m) => m.date >= scope.from && m.date <= scope.to && !scope.excluded.includes(m.id) && !m.outcome)
}

/**
 * Rebuild the list for a scope, keeping what the user already did: ticked items stay visible as
 * bought, edited quantities stay, manual items stay, substitutions stay (§16.2).
 */
export function rebuildScoped(opts: { plan: MealPlan | undefined; scope: ShoppingScope; people: number; pantry: PantryItem[]; current: ShoppingItem[]; lookup: (id: string) => Recipe | undefined }): ShoppingItem[] {
  const meals = scopedMeals(opts.plan, opts.scope)
  const fresh = buildShoppingList(meals, opts.people, opts.pantry)
  const prev = new Map(opts.current.filter((c) => !c.manual).map((c) => [c.foodId, c]))
  const subs = new Map(opts.current.filter((c) => c.substitutedFrom).map((c) => [c.substitutedFrom!, c]))
  const optionalIds = optionalFoodIds(meals, opts.lookup)
  const items: ShoppingItem[] = fresh.map((f) => {
    const sub = subs.get(f.name)
    if (sub) return { ...sub, grams: sub.edited ? sub.grams : f.grams }
    const p = prev.get(f.foodId)
    return {
      ...f,
      purchased: p?.purchased ?? false,
      grams: p?.edited ? p.grams : f.grams,
      costBdt: p?.edited ? p.costBdt : f.costBdt,
      edited: p?.edited,
      optional: p?.optional ?? optionalIds.has(f.foodId),
    }
  })
  const have = new Set(items.map((i) => i.foodId))
  // Bought items that are no longer needed stay visible as bought until moved to the pantry.
  const keptBought = opts.current.filter((c) => !c.manual && c.purchased && !have.has(c.foodId))
  return [...items, ...keptBought, ...opts.current.filter((c) => c.manual)]
}

/** Ingredients that only ever appear as optional in the scoped recipes (§16.2). */
export function optionalFoodIds(meals: PlannedMeal[], lookup: (id: string) => Recipe | undefined): Set<string> {
  const required = new Set<string>()
  const optional = new Set<string>()
  for (const m of meals) for (const i of lookup(m.recipeId)?.ingredients ?? []) (i.optional ? optional : required).add(i.foodId)
  return new Set([...optional].filter((id) => !required.has(id)))
}

export function costFor(foodId: string, grams: number) {
  return Math.round(((FOOD_MAP[foodId]?.costPer100gBdt ?? 0) * grams) / 100)
}

/* ───────────── Substitutions (§16.3 cheaper, §42.8.1 unavailable) ───────────── */

export interface Alternative {
  foodId?: string // undefined = not yet in the verified food DB
  name: string
  costPer100gBdt: number
  allergens: Allergen[]
  /** Change for the list quantity, from food-DB values. Absent when the food isn't in the DB yet. */
  delta?: { costBdt: number; kcal: number; proteinG: number }
  note: string
  lowerProtein: boolean
}

/**
 * Local market options that aren't in the prototype food DB yet. Costs are illustrative Dhaka estimates;
 * nutrition is NOT invented — it is recalculated from verified data once the food is added (§8, §18.5).
 */
const MARKET_ONLY: Record<string, { name: string; costPer100gBdt: number; allergens: Allergen[] }[]> = {
  rui_fish: [
    { name: "Pangas fish", costPer100gBdt: 22, allergens: ["fish"] },
    { name: "Telapia fish", costPer100gBdt: 28, allergens: ["fish"] },
  ],
  hilsa_fish: [{ name: "Pangas fish", costPer100gBdt: 22, allergens: ["fish"] }],
}

/** Same-role alternatives in the food DB, in preference order. */
const SIMILAR: Record<string, string[]> = {
  rui_fish: ["egg_boiled", "chicken_curry", "dal_cooked"],
  hilsa_fish: ["rui_fish", "egg_boiled"],
  fried_fish: ["rui_fish", "egg_boiled"],
  beef_curry: ["chicken_curry", "rui_fish", "chickpeas_cooked"],
  chicken_curry: ["egg_boiled", "rui_fish", "chickpeas_cooked"],
  egg_boiled: ["dal_cooked", "chickpeas_cooked"],
  omelette: ["egg_boiled", "dal_cooked"],
  paratha: ["roti"],
  roti: ["rice_cooked"],
  oats_dry: ["rice_cooked", "roti"],
  doi: ["milk"],
  milk: ["doi"],
  mango: ["banana", "guava"],
  guava: ["banana", "mango"],
  banana: ["guava", "mango"],
  spinach_shak: ["mixed_veg", "pumpkin"],
  mixed_veg: ["spinach_shak", "pumpkin"],
  pumpkin: ["mixed_veg", "spinach_shak"],
  mustard_oil: ["soybean_oil"],
  soybean_oil: ["mustard_oil"],
  peanuts: ["chickpeas_cooked"],
  chickpeas_cooked: ["dal_cooked"],
  dal_cooked: ["chickpeas_cooked"],
}

const safeFor = (allergens: Allergen[], p?: Profile) => !p || !allergens.some((a) => p.allergies.includes(a))

/** Alternatives for one list item. Hard constraints (allergies) filter first; ranking is soft (§25.2). */
export function alternativesFor(item: ShoppingItem, p: Profile | undefined, mode: "cheaper" | "unavailable"): Alternative[] {
  const base = FOOD_MAP[item.foodId]
  if (!base) return []
  const baseCost = base.costPer100gBdt ?? 0
  const baseN = foodNutrients(item.foodId, item.grams)
  const db: Alternative[] = (SIMILAR[item.foodId] ?? [])
    .map((id) => FOOD_MAP[id])
    .filter((f) => !!f && safeFor(f.allergens, p))
    .map((f) => {
      const n = foodNutrients(f.id, item.grams)
      const costBdt = costFor(f.id, item.grams) - item.costBdt
      const lowerProtein = baseN.proteinG > 5 && n.proteinG < baseN.proteinG * 0.8
      return {
        foodId: f.id,
        name: f.name,
        costPer100gBdt: f.costPer100gBdt ?? 0,
        allergens: f.allergens,
        delta: { costBdt, kcal: n.energyKcal - baseN.energyKcal, proteinG: n.proteinG - baseN.proteinG },
        lowerProtein,
        note: lowerProtein ? "Lower in protein — keep dal or egg in the same meals." : f.state !== base.state ? `Values are for ${f.state} ${f.name.toLowerCase()}.` : "Similar role in the meal.",
      }
    })
  const market: Alternative[] = (MARKET_ONLY[item.foodId] ?? [])
    .filter((m) => safeFor(m.allergens, p))
    .map((m) => ({ ...m, lowerProtein: false, note: "Not in the verified food database yet — nutrition will be calculated from reviewed data before it's used in a plan." }))
  const all = [...market, ...db]
  if (mode === "cheaper") return all.filter((a) => a.costPer100gBdt < baseCost).sort((a, b) => Number(a.lowerProtein) - Number(b.lowerProtein) || a.costPer100gBdt - b.costPer100gBdt)
  return all
}

/** Meals whose recipe uses a food, with nutrition per serving before and after a substitution. */
export function substitutionImpact(foodId: string, toFoodId: string | undefined, meals: PlannedMeal[], lookup: (id: string) => Recipe | undefined) {
  const affected = meals.filter((m) => lookup(m.recipeId)?.ingredients.some((i) => i.foodId === foodId))
  return affected.map((m) => {
    const r = lookup(m.recipeId)!
    const before = recipeNutrition(r, m.servings)
    let after: Nutrients | null = null
    if (toFoodId) after = recipeNutrition({ ...r, ingredients: r.ingredients.map((i) => (i.foodId === foodId ? { ...i, foodId: toFoodId } : i)) }, m.servings)
    return { meal: m, recipe: r, before, after }
  })
}

/* ───────────── Meal prep (§16.4) ───────────── */

export interface PrepTask {
  key: string
  day: string // date to do it
  title: string
  detail: string
  foodId?: string
}

const short = (iso: string) => formatDay(iso, { weekday: "short" })
const span = (dates: string[]) => {
  const u = Array.from(new Set(dates)).sort()
  return u.length === 1 ? short(u[0]) : `${short(u[0])}–${short(u[u.length - 1])}`
}

/** The next Sunday (or today if it is Sunday) as the weekly prep day. */
export function prepDay(today = todayISO()) {
  const dow = fromISO(today).getDay()
  return dow === 0 ? today : addDays(today, 7 - dow)
}

/**
 * Weekly prep tasks from the next 7 days of meals. Cooked dishes are only batched for the next
 * 2 days after cooking (safe-storage window); longer needs a freezer note.
 */
export function prepTasks(meals: PlannedMeal[], lookup: (id: string) => Recipe | undefined, today = todayISO()): PrepTask[] {
  const horizon = addDays(today, 6)
  const upcoming = meals.filter((m) => m.date >= today && m.date <= horizon && !m.outcome && m.scheduleStatus !== "paused")
  const day = prepDay(today)
  const uses = (ids: string[]) => upcoming.filter((m) => lookup(m.recipeId)?.ingredients.some((i) => ids.includes(i.foodId)))
  const tasks: PrepTask[] = []
  const after = (ms: PlannedMeal[]) => ms.filter((m) => m.date > day)

  const veg = after(uses(["mixed_veg", "spinach_shak", "pumpkin"])).filter((m) => m.date <= addDays(day, 3))
  if (veg.length) tasks.push({ key: `veg:${day}`, day, title: `Wash and cut vegetables for ${span(veg.map((m) => m.date))}`, detail: "Dry well, store in a covered box in the fridge and use within 3 days. Leafy shak is best cut on the day.", foodId: "mixed_veg" })

  const dal = after(uses(["dal_cooked"])).filter((m) => m.date <= addDays(day, 2))
  if (dal.length) tasks.push({ key: `dal:${day}`, day, title: `Cook dal for ${span(dal.map((m) => m.date))}`, detail: "Cool within 2 hours, refrigerate in portions and eat within 2 days. Freeze portions for later in the week.", foodId: "dal_cooked" })

  const eggs = after(uses(["egg_boiled"])).filter((m) => m.date <= addDays(day, 3))
  if (eggs.length) tasks.push({ key: `egg:${day}`, day, title: `Boil eggs for ${span(eggs.map((m) => m.date))}`, detail: "Keep them in the shell in the fridge and use within 3 days.", foodId: "egg_boiled" })

  // Soaking and marinating happen the evening before each meal.
  for (const m of uses(["chickpeas_cooked"])) {
    const d = addDays(m.date, -1)
    if (d < today || tasks.some((t) => t.key === `soak:${d}`)) continue
    tasks.push({ key: `soak:${d}`, day: d, title: `Soak chickpeas for ${short(m.date)} ${MEAL_LABEL[m.mealType].toLowerCase()}`, detail: "Soak overnight in plenty of water, then drain, rinse and boil until completely soft.", foodId: "chickpeas_cooked" })
  }
  for (const m of uses(["chicken_curry", "beef_curry"])) {
    const d = addDays(m.date, -1)
    if (d < today || tasks.some((t) => t.key === `marinate:${d}`)) continue
    tasks.push({ key: `marinate:${d}`, day: d, title: `Marinate meat for ${short(m.date)} ${MEAL_LABEL[m.mealType].toLowerCase()}`, detail: "Marinate in a covered dish in the fridge, never at room temperature. Defrost frozen meat in the fridge too.", foodId: "chicken_curry" })
  }
  for (const m of upcoming.filter((x) => x.prepLater)) {
    const r = lookup(m.recipeId)
    const d = addDays(m.date, -1)
    if (!r || d < today) continue
    tasks.push({ key: `later:${m.id}`, day: d, title: `Prepare ${r.name}`, detail: `For ${short(m.date)} ${MEAL_LABEL[m.mealType].toLowerCase()} — you chose “Prepare later”.` })
  }
  return tasks.sort((a, b) => a.day.localeCompare(b.day) || a.title.localeCompare(b.title))
}

/** Food-specific storage and safe reheating (general food-safety guidance, §16.4). */
export const STORAGE_ADVICE: { foodIds: string[]; title: string; storage: string; reheat: string }[] = [
  { foodIds: ["rice_cooked", "khichuri"], title: "Rice and khichuri", storage: "Cool quickly (spread it out) and refrigerate within 1 hour. Eat within 24 hours.", reheat: "Reheat once only, until steaming hot all the way through." },
  { foodIds: ["dal_cooked", "chickpeas_cooked"], title: "Dal and chickpeas", storage: "Refrigerate within 2 hours in a covered box. Eat within 2 days, or freeze in portions.", reheat: "Bring back to a full boil and stir; add a little water if thick." },
  { foodIds: ["rui_fish", "hilsa_fish", "fried_fish"], title: "Fish curry", storage: "Refrigerate within 2 hours. Eat within 1–2 days.", reheat: "Reheat gently until steaming hot in the centre; don't reheat more than once." },
  { foodIds: ["chicken_curry", "beef_curry"], title: "Meat curry", storage: "Refrigerate within 2 hours. Eat within 2 days, or freeze in portions.", reheat: "Defrost in the fridge, then reheat until steaming hot throughout." },
  { foodIds: ["egg_boiled", "omelette"], title: "Eggs", storage: "Boiled eggs: keep in the shell in the fridge, up to 3 days. Omelettes are best eaten fresh.", reheat: "Eat boiled eggs cold or warm them through; don't keep cooked egg dishes at room temperature." },
  { foodIds: ["mixed_veg", "spinach_shak", "pumpkin"], title: "Cooked vegetables", storage: "Refrigerate within 2 hours; eat within 2 days.", reheat: "Reheat until hot; leafy shak tastes best cooked fresh." },
]

export const INFANT_STORAGE = [
  "Set aside baby's portion before adding salt, sugar or strong spices.",
  "Cool purées quickly, refrigerate within 1 hour and use within 24 hours. Freeze small portions (ice-cube trays) for up to a month.",
  "Reheat only the amount needed, once, until steaming hot. Stir well and let it cool to lukewarm; check the temperature before feeding.",
  "Throw away food left in the feeding bowl — saliva can spoil it. Never refreeze thawed baby food.",
  "Follow your clinician's advice where it differs. This is general food-safety guidance.",
]

/* ───────────── Pantry deduction (§42.8.2) ───────────── */

/** Cooked recipe ingredient → raw pantry staple, with an approximate cooking yield (raw g per cooked g). */
const RAW_EQUIV: Record<string, { foodId: string; factor: number }> = {
  rice_cooked: { foodId: "rice_dry", factor: 0.4 },
  dal_cooked: { foodId: "lentils_dry", factor: 0.3 },
}

/** How much of each pantry item a meal uses (planned recipe × servings, mapped to raw staples). */
export function mealPantryUse(meal: PlannedMeal, recipe: Recipe, pantry: PantryItem[]): { foodId: string; grams: number }[] {
  const have = new Set(pantry.map((p) => p.foodId))
  const out = new Map<string, number>()
  for (const i of recipe.ingredients) {
    const grams = (i.grams / recipe.servings) * meal.servings
    if (have.has(i.foodId)) out.set(i.foodId, (out.get(i.foodId) ?? 0) + grams)
    else if (RAW_EQUIV[i.foodId] && have.has(RAW_EQUIV[i.foodId].foodId)) {
      const e = RAW_EQUIV[i.foodId]
      out.set(e.foodId, (out.get(e.foodId) ?? 0) + grams * e.factor)
    }
  }
  return [...out.entries()].map(([foodId, grams]) => ({ foodId, grams: Math.round(grams) })).filter((x) => x.grams > 0)
}

export function applyPantryDelta(pantry: PantryItem[], use: { foodId: string; grams: number }[], sign: -1 | 1): PantryItem[] {
  return pantry.map((p) => {
    const u = use.find((x) => x.foodId === p.foodId)
    return u ? { ...p, grams: Math.max(0, p.grams + sign * u.grams) } : p
  })
}
