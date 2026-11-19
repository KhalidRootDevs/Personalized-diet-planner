// Recipe bank (§9, §42.11, §27): browse verified recipes by meal, cuisine, life stage and health fit.
//
// Safety model (CLAUDE.md, §13, §18):
// - The active profile's hard constraints (allergies, diet, age, medical rules) are ALWAYS applied. Browsing
//   filters only narrow the safe set; no filter can re-include an excluded recipe.
// - Nutrient fits ("high protein", "iron-rich"…) are computed from the food database, never declared.
// - Condition fits ("diabetes-aware"…) must be declared by a reviewer AND pass a deterministic rule here.
//   They are general healthy-eating guidance, not treatment, and are worded that way in the UI.
// - Infant and child recipes never show calories or adult nutrient fits.
import type { AgeGroupId, CuisineId, HealthFitId, MealType, Nutrients, Profile, Recipe } from "@/lib/types"
import { FOOD_MAP } from "@/lib/data/foods"
import { ageInMonths, hardConstraintViolation, recipeAllergens, recipeCostPerServing, recipeNutrition, recipeSodium } from "@/lib/nutrition"

// ── Cuisines ────────────────────────────────────────────────────────────────

export interface CuisineInfo {
  id: CuisineId
  label: string
  labelBn: string
  /** Short, appetising line for the cuisine tile. */
  blurb: string
  /** South Asian cuisines are the Phase 1 market; others are international expansion (§43 Phase 3). */
  local: boolean
}

export const CUISINES: CuisineInfo[] = [
  { id: "bangladeshi", label: "Bangladeshi", labelBn: "বাংলাদেশি", blurb: "Bhaat, dal, maach and bhorta", local: true },
  { id: "indian", label: "Indian", labelBn: "ভারতীয়", blurb: "Dals, sabzis, idli and rajma", local: true },
  { id: "pakistani", label: "Pakistani", labelBn: "পাকিস্তানি", blurb: "Karahi, chana and daal chawal", local: true },
  { id: "chinese", label: "Chinese", labelBn: "চাইনিজ", blurb: "Stir-fries, soups and fried rice", local: false },
  { id: "thai", label: "Thai", labelBn: "থাই", blurb: "Fragrant curries and fresh herbs", local: false },
  { id: "japanese", label: "Japanese", labelBn: "জাপানি", blurb: "Rice bowls, miso and teriyaki", local: false },
  { id: "italian", label: "Italian", labelBn: "ইতালীয়", blurb: "Pasta, minestrone and frittata", local: false },
  { id: "mediterranean", label: "Mediterranean", labelBn: "ভূমধ্যসাগরীয়", blurb: "Olive oil, beans and grilled fish", local: false },
  { id: "middle_eastern", label: "Middle Eastern", labelBn: "মধ্যপ্রাচ্য", blurb: "Hummus, shakshuka and kebabs", local: false },
  { id: "mexican", label: "Mexican", labelBn: "মেক্সিকান", blurb: "Beans, corn and fresh salsa", local: false },
  { id: "continental", label: "Continental", labelBn: "কন্টিনেন্টাল", blurb: "Soups, roasts and porridge", local: false },
]
export const CUISINE_MAP: Record<CuisineId, CuisineInfo> = Object.fromEntries(CUISINES.map((c) => [c.id, c])) as Record<CuisineId, CuisineInfo>

export function recipeCuisine(r: Recipe): CuisineId {
  return r.cuisine ?? "bangladeshi"
}

// ── Meals ───────────────────────────────────────────────────────────────────

export type MealGroupId = "breakfast" | "lunch" | "dinner" | "snack" | "drinks"
export const MEAL_GROUPS: { id: MealGroupId; label: string; labelBn: string; types: MealType[] }[] = [
  { id: "breakfast", label: "Breakfast", labelBn: "নাস্তা", types: ["breakfast"] },
  { id: "lunch", label: "Lunch", labelBn: "দুপুরের খাবার", types: ["lunch"] },
  { id: "dinner", label: "Dinner", labelBn: "রাতের খাবার", types: ["dinner"] },
  { id: "snack", label: "Snacks", labelBn: "নাশতা", types: ["morning_snack", "afternoon_snack", "evening_snack"] },
  { id: "drinks", label: "Drinks", labelBn: "পানীয়", types: ["drinks"] },
]

// ── Life stages ─────────────────────────────────────────────────────────────

export interface AgeGroupInfo {
  id: AgeGroupId
  label: string
  labelBn: string
  range: string
  minMonths: number
  maxMonths: number
}

export const AGE_GROUPS: AgeGroupInfo[] = [
  { id: "infant", label: "Babies", labelBn: "শিশু", range: "6–12 months", minMonths: 6, maxMonths: 11 },
  { id: "toddler", label: "Toddlers", labelBn: "ছোট শিশু", range: "1–3 years", minMonths: 12, maxMonths: 47 },
  { id: "child", label: "Kids", labelBn: "শিশু-কিশোর", range: "4–12 years", minMonths: 48, maxMonths: 155 },
  { id: "teen", label: "Teens", labelBn: "কিশোর", range: "13–17 years", minMonths: 156, maxMonths: 215 },
  { id: "adult", label: "Adults", labelBn: "প্রাপ্তবয়স্ক", range: "18–64 years", minMonths: 216, maxMonths: 779 },
  { id: "older_adult", label: "Older adults", labelBn: "বয়স্ক", range: "65+ years", minMonths: 780, maxMonths: 9999 },
]
export const AGE_GROUP_MAP: Record<AgeGroupId, AgeGroupInfo> = Object.fromEntries(AGE_GROUPS.map((a) => [a.id, a])) as Record<AgeGroupId, AgeGroupInfo>

/** Declared groups, or derived: adult recipes suit teens to older adults; child recipes follow minAgeMonths. */
export function recipeAgeGroups(r: Recipe): AgeGroupId[] {
  if (r.ageGroups?.length) return r.ageGroups
  if (r.profile === "adult") return ["teen", "adult", "older_adult"]
  if (r.profile === "infant") return ["infant"]
  const min = r.minAgeMonths ?? 12
  return AGE_GROUPS.filter((a) => (a.id === "toddler" || a.id === "child") && a.maxMonths >= min).map((a) => a.id)
}

export function ageGroupForProfile(p: Profile): AgeGroupId {
  const m = ageInMonths(p.dateOfBirth)
  if (p.type === "infant" || m < 12) return "infant"
  return (AGE_GROUPS.find((a) => m >= a.minMonths && m <= a.maxMonths) ?? AGE_GROUPS[4]).id
}

/** Infant and child recipes never show calories or adult nutrient fits (§12, CLAUDE.md). */
export function isChildRecipe(r: Recipe): boolean {
  return r.profile !== "adult"
}

// ── Health fits ─────────────────────────────────────────────────────────────

export interface HealthFitInfo {
  id: HealthFitId
  label: string
  labelBn: string
  /** One-line meaning shown on chips and filter rows. */
  short: string
  /** The rule as shown on the recipe page ("Why this label?"). */
  rule: string
  /** computed = from the food database only; condition = reviewer-declared + rule-checked, general guidance only. */
  kind: "computed" | "condition"
  /** Profile condition this fit is most relevant to (used to suggest filters). */
  condition?: string
}

export const HEALTH_FITS: HealthFitInfo[] = [
  { id: "high_protein", label: "High protein", labelBn: "উচ্চ প্রোটিন", short: "20 g+ protein per serving", rule: "At least 20 g protein per serving, calculated from the ingredients.", kind: "computed" },
  { id: "high_fiber", label: "High fiber", labelBn: "উচ্চ আঁশ", short: "7 g+ fiber per serving", rule: "At least 7 g fiber per serving, calculated from the ingredients.", kind: "computed" },
  { id: "iron_rich", label: "Iron-rich", labelBn: "আয়রন সমৃদ্ধ", short: "4 mg+ iron per serving", rule: "At least 4 mg iron per serving where the food data includes iron.", kind: "computed" },
  { id: "calcium_rich", label: "Calcium-rich", labelBn: "ক্যালসিয়াম সমৃদ্ধ", short: "250 mg+ calcium per serving", rule: "At least 250 mg calcium per serving where the food data includes calcium.", kind: "computed" },
  { id: "lighter", label: "Lighter meal", labelBn: "হালকা খাবার", short: "About 450 kcal or less", rule: "A main meal of about 450 kcal or less per serving. Lighter is not 'better'; it's one option among many.", kind: "computed" },
  { id: "gluten_free", label: "Gluten-free", labelBn: "গ্লুটেন-মুক্ত", short: "No wheat ingredients", rule: "No ingredient in the food database is recorded as containing wheat. Check packaged items (e.g. oats, sauces) for gluten labelling.", kind: "computed", condition: "celiac" },
  { id: "diabetes_aware", label: "Diabetes-aware", labelBn: "ডায়াবেটিস-সচেতন", short: "No added sugar, steady carbs, good fiber", rule: "Reviewed recipe with no sugar-sweetened ingredients, 5 g+ fiber and no more than about 70 g carbohydrate per serving. General guidance, not a treatment plan.", kind: "condition", condition: "diabetes" },
  { id: "heart_aware", label: "Heart-aware", labelBn: "হৃদয়-সচেতন", short: "Not fried, moderate fat", rule: "Reviewed recipe that isn't deep-fried, has about 20 g fat or less per serving, and stays within the sodium limit where data exists. General guidance only.", kind: "condition", condition: "heart_disease" },
  { id: "bp_aware", label: "Lower salt", labelBn: "কম লবণ", short: "Within the per-meal sodium limit", rule: "Reviewed recipe written with little added salt, with no high-salt ingredients (e.g. shutki, pickles). Sodium is checked against the per-meal limit where the food data allows; otherwise it's an estimate.", kind: "condition", condition: "hypertension" },
  { id: "pregnancy_friendly", label: "Pregnancy-friendly", labelBn: "গর্ভাবস্থা-উপযোগী", short: "Fully cooked, protein-rich", rule: "Reviewed recipe with every animal food fully cooked, no high-mercury fish and 15 g+ protein per serving. Follow your care team's advice.", kind: "condition", condition: "pregnancy" },
  { id: "gentle_digestion", label: "Gentle on digestion", labelBn: "সহজপাচ্য", short: "Mild, not oily", rule: "Reviewed recipe that is mild (spice level 0–1), about 15 g fat or less and not deep-fried.", kind: "condition", condition: "gi_condition" },
  { id: "easy_to_chew", label: "Easy to chew", labelBn: "সহজে চিবানো যায়", short: "Soft textures", rule: "Reviewed recipe with soft textures and no hard or round choking-risk foods. Not a texture-modified diet for swallowing difficulties; ask a speech or swallowing specialist.", kind: "condition" },
]
export const HEALTH_FIT_MAP: Record<HealthFitId, HealthFitInfo> = Object.fromEntries(HEALTH_FITS.map((h) => [h.id, h])) as Record<HealthFitId, HealthFitInfo>

const SUGAR_SWEETENED = new Set(["sugary_drink", "milk_tea", "rasgulla", "pitha", "honey", "sugar", "mishti_doi"])
const FRIED = new Set(["fried_fish", "begun_bhaja", "ilish_fried", "tilapia_fried", "singara", "paratha"])
const HIGH_SALT = new Set(["shutki_bhorta", "soy_sauce", "pickle", "cheese_feta"])
const HIGH_MERCURY = new Set(["king_mackerel", "shark", "swordfish"])
const RAW_ANIMAL = new Set(["raw_fish"])

/** Per-serving nutrition for the bank (one serving = recipe total ÷ servings). */
export function perServing(r: Recipe): Nutrients {
  return recipeNutrition(r, 1)
}

function passesRule(id: HealthFitId, r: Recipe, n: Nutrients): boolean {
  const ids = r.ingredients.map((i) => i.foodId)
  const foods = ids.map((i) => FOOD_MAP[i]).filter(Boolean)
  const sodium = recipeSodium(r)
  const sodiumOk = !sodium.complete || sodium.perServingMg <= 800
  switch (id) {
    case "high_protein":
      return n.proteinG >= 20
    case "high_fiber":
      return n.fiberG >= 7
    case "iron_rich":
      return (n.ironMg ?? 0) >= 4
    case "calcium_rich":
      return (n.calciumMg ?? 0) >= 250
    case "lighter":
      return n.energyKcal <= 450 && r.mealTypes.some((t) => t === "lunch" || t === "dinner")
    case "gluten_free":
      return !recipeAllergens(r).includes("wheat")
    case "diabetes_aware":
      return !foods.some((f) => SUGAR_SWEETENED.has(f.id) || f.category === "sweet") && n.fiberG >= 5 && n.carbsG <= 70
    case "heart_aware":
      return !ids.some((i) => FRIED.has(i)) && n.fatG <= 20 && sodiumOk
    case "bp_aware":
      return !ids.some((i) => HIGH_SALT.has(i)) && (!sodium.complete || sodium.perServingMg <= 600)
    case "pregnancy_friendly":
      return !ids.some((i) => HIGH_MERCURY.has(i) || RAW_ANIMAL.has(i) || i === "honey") && n.proteinG >= 15
    case "gentle_digestion":
      return (r.spiceLevel ?? 1) <= 1 && n.fatG <= 15 && !ids.some((i) => FRIED.has(i))
    case "easy_to_chew":
      return !foods.some((f) => f.chokingRisk)
  }
}

/** Fits shown for a recipe: computed nutrient fits + declared condition fits that also pass their rule. */
export function recipeHealthFits(r: Recipe): HealthFitId[] {
  const n = perServing(r)
  const child = isChildRecipe(r)
  const out: HealthFitId[] = []
  for (const h of HEALTH_FITS) {
    if (h.kind === "computed") {
      // No adult nutrient labels on baby/child food; gluten-free is a safety fact, so it stays.
      if (child && h.id !== "gluten_free") continue
      if (passesRule(h.id, r, n)) out.push(h.id)
    } else if (r.healthFits?.includes(h.id)) {
      if (child && h.id !== "easy_to_chew") continue
      if (passesRule(h.id, r, n)) out.push(h.id)
    }
  }
  return out
}

/** Declared fits that failed their rule, for the admin/review view and "Why not?" explanations. */
export function rejectedDeclaredFits(r: Recipe): HealthFitId[] {
  const shown = new Set(recipeHealthFits(r))
  return (r.healthFits ?? []).filter((f) => !shown.has(f))
}

/** Fits worth suggesting to this person, from their recorded conditions (never inferred from food data). */
export function suggestedFitsForProfile(p: Profile | undefined): HealthFitId[] {
  if (!p || p.type !== "adult") return []
  return HEALTH_FITS.filter((h) => h.condition && p.conditions.includes(h.condition)).map((h) => h.id)
}

// ── Diet & time ─────────────────────────────────────────────────────────────

export type DietFilterId = "vegetarian" | "vegan" | "halal" | "egg_free" | "dairy_free"
export const DIET_FILTERS: { id: DietFilterId; label: string }[] = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "halal", label: "Halal" },
  { id: "egg_free", label: "Egg-free" },
  { id: "dairy_free", label: "Dairy-free" },
]

export function matchesDiet(r: Recipe, d: DietFilterId): boolean {
  const foods = r.ingredients.map((i) => FOOD_MAP[i.foodId]).filter(Boolean)
  const cats = new Set(foods.map((f) => f.category))
  const allergens = recipeAllergens(r)
  switch (d) {
    case "vegetarian":
      return !cats.has("meat") && !cats.has("fish")
    case "vegan":
      return !cats.has("meat") && !cats.has("fish") && !cats.has("egg") && !cats.has("dairy") && !allergens.includes("milk") && !allergens.includes("egg") && !foods.some((f) => f.id === "honey")
    case "halal":
      // Bank recipes contain no pork or alcohol; meat recipes must also be tagged halal by the reviewer.
      return !cats.has("meat") || r.tags.includes("halal")
    case "egg_free":
      return !cats.has("egg") && !allergens.includes("egg")
    case "dairy_free":
      return !cats.has("dairy") && !allergens.includes("milk")
  }
}

export function totalMinutes(r: Recipe): number {
  return r.prepMinutes + r.cookMinutes
}

// ── Browse ──────────────────────────────────────────────────────────────────

export type SortId = "recommended" | "quickest" | "budget" | "protein" | "name"
export const SORTS: { id: SortId; label: string }[] = [
  { id: "recommended", label: "Best for you" },
  { id: "quickest", label: "Quickest" },
  { id: "budget", label: "Lowest cost" },
  { id: "protein", label: "Most protein" },
  { id: "name", label: "A–Z" },
]

export interface BankFilters {
  q?: string
  meals?: MealGroupId[]
  cuisines?: CuisineId[]
  ages?: AgeGroupId[]
  fits?: HealthFitId[]
  diets?: DietFilterId[]
  maxMinutes?: number
  difficulty?: Recipe["difficulty"]
  sort?: SortId
}

export function activeFilterCount(f: BankFilters): number {
  return (f.meals?.length ?? 0) + (f.cuisines?.length ?? 0) + (f.ages?.length ?? 0) + (f.fits?.length ?? 0) + (f.diets?.length ?? 0) + (f.maxMinutes ? 1 : 0) + (f.difficulty ? 1 : 0)
}

export function matchesFilters(r: Recipe, f: BankFilters): boolean {
  const q = f.q?.trim().toLowerCase()
  if (q) {
    const cuisine = CUISINE_MAP[recipeCuisine(r)]
    const hay = [r.name, r.description, cuisine.label, ...r.tags, ...r.ingredients.map((i) => FOOD_MAP[i.foodId]?.name ?? "")].join(" ").toLowerCase()
    if (!hay.includes(q) && !r.nameBn.includes(f.q!.trim())) return false
  }
  if (f.meals?.length && !f.meals.some((m) => MEAL_GROUPS.find((g) => g.id === m)!.types.some((t) => r.mealTypes.includes(t)))) return false
  if (f.cuisines?.length && !f.cuisines.includes(recipeCuisine(r))) return false
  if (f.ages?.length && !f.ages.some((a) => recipeAgeGroups(r).includes(a))) return false
  if (f.fits?.length) {
    const fits = recipeHealthFits(r)
    if (!f.fits.every((x) => fits.includes(x))) return false
  }
  if (f.diets?.length && !f.diets.every((d) => matchesDiet(r, d))) return false
  if (f.maxMinutes && totalMinutes(r) > f.maxMinutes) return false
  if (f.difficulty && r.difficulty !== f.difficulty) return false
  return true
}

/**
 * Why a recipe can't be shown for this profile, or null. Hard constraints always win (§13, §18).
 * Unreviewed (pending) child/infant recipes stay visible but are labelled "Pending review" by the UI.
 */
export function bankExclusion(r: Recipe, p: Profile | undefined): string | null {
  if (!p) return null
  const v = hardConstraintViolation(r, p)
  return v?.reason ?? null
}

/**
 * Browse the bank for `profile`. Browsing *for another life stage* (e.g. an adult browsing toddler food)
 * still applies the active profile's allergies and diet, but uses the target stage's age rules.
 */
export function browseRecipes(all: Recipe[], f: BankFilters, profile: Profile | undefined): { results: Recipe[]; hidden: { recipe: Recipe; reason: string }[] } {
  const hidden: { recipe: Recipe; reason: string }[] = []
  const results: Recipe[] = []
  // Only an ADULT profile may browse another life stage (e.g. a parent looking at toddler food). A baby or child
  // profile always gets its own full age, choking and allergen rules, whatever the age filter says.
  const browsingOtherStage = !!f.ages?.length && profile?.type === "adult" && !f.ages.includes(ageGroupForProfile(profile))
  for (const r of all) {
    if (r.reviewStatus === "personal") continue
    if (!matchesFilters(r, f)) continue
    // When an adult browses baby/kid recipes, apply allergies/diet only (age rules belong to the child's own profile).
    const probe = browsingOtherStage && profile ? { ...profile, type: "adult" as const } : profile
    const reason = probe ? (browsingOtherStage && isChildRecipe(r) ? allergyOnly(r, probe) : bankExclusion(r, probe)) : null
    if (reason) hidden.push({ recipe: r, reason })
    else results.push(r)
  }
  return { results: sortRecipes(results, f.sort ?? "recommended", profile), hidden }
}

function allergyOnly(r: Recipe, p: Profile): string | null {
  const hit = recipeAllergens(r).find((a) => p.allergies.includes(a))
  return hit ? `Contains ${hit}, which is recorded as an allergy.` : null
}

export function sortRecipes(list: Recipe[], sort: SortId, p?: Profile): Recipe[] {
  const arr = [...list]
  switch (sort) {
    case "quickest":
      return arr.sort((a, b) => totalMinutes(a) - totalMinutes(b))
    case "budget":
      return arr.sort((a, b) => recipeCostPerServing(a) - recipeCostPerServing(b))
    case "protein":
      return arr.sort((a, b) => perServing(b).proteinG - perServing(a).proteinG)
    case "name":
      return arr.sort((a, b) => a.name.localeCompare(b.name))
    case "recommended": {
      // Soft optimisation only, on an already-safe list: suggested health fits, local cuisine, reviewed first, then time.
      const want = suggestedFitsForProfile(p)
      const score = (r: Recipe) => {
        const fits = recipeHealthFits(r)
        let s = want.filter((w) => fits.includes(w)).length * 10
        if (CUISINE_MAP[recipeCuisine(r)].local) s += 3
        if (r.reviewStatus === "approved") s += 2
        if (p?.maxPrepMinutes && totalMinutes(r) <= p.maxPrepMinutes) s += 1
        return s
      }
      return arr.sort((a, b) => score(b) - score(a) || totalMinutes(a) - totalMinutes(b))
    }
  }
}

// ── Counts for browse tiles ─────────────────────────────────────────────────

export function countBy<K extends string>(list: Recipe[], key: (r: Recipe) => K[]): Partial<Record<K, number>> {
  const out: Partial<Record<K, number>> = {}
  for (const r of list) for (const k of key(r)) out[k] = (out[k] ?? 0) + 1
  return out
}

/** URL <-> filters, so result pages are linkable from Home, Plan and the coach (e.g. /recipes/browse?cuisine=italian&meal=dinner). */
export function filtersFromParams(sp: URLSearchParams): BankFilters {
  const list = <T extends string>(k: string) => (sp.get(k)?.split(",").filter(Boolean) as T[] | undefined) ?? undefined
  const max = Number(sp.get("max"))
  return {
    q: sp.get("q") ?? undefined,
    meals: list<MealGroupId>("meal"),
    cuisines: list<CuisineId>("cuisine"),
    ages: list<AgeGroupId>("age"),
    fits: list<HealthFitId>("fit"),
    diets: list<DietFilterId>("diet"),
    maxMinutes: max > 0 ? max : undefined,
    difficulty: (sp.get("difficulty") as Recipe["difficulty"]) || undefined,
    sort: (sp.get("sort") as SortId) || undefined,
  }
}

export function filtersToQuery(f: BankFilters): string {
  const sp = new URLSearchParams()
  if (f.q) sp.set("q", f.q)
  if (f.meals?.length) sp.set("meal", f.meals.join(","))
  if (f.cuisines?.length) sp.set("cuisine", f.cuisines.join(","))
  if (f.ages?.length) sp.set("age", f.ages.join(","))
  if (f.fits?.length) sp.set("fit", f.fits.join(","))
  if (f.diets?.length) sp.set("diet", f.diets.join(","))
  if (f.maxMinutes) sp.set("max", String(f.maxMinutes))
  if (f.difficulty) sp.set("difficulty", f.difficulty)
  if (f.sort && f.sort !== "recommended") sp.set("sort", f.sort)
  const s = sp.toString()
  return s ? `?${s}` : ""
}
