// AI Nutrition Coach, prototype (§42.2). Answers are built deterministically from the user's
// validated plan, journal and food DB. A production model would only phrase these facts and
// could not add foods that fail hard constraints (§18, §42.2 safety rules).
import { ALLERGEN_LABELS, FOOD_MAP } from "@/lib/data/foods"
import { RECIPES } from "@/lib/data/recipes"
import { MEAL_LABEL } from "@/lib/planning"
import { recipeAllergens, recipeCostPerServing, recipeNutrition, violatesHardConstraints, type Targets } from "@/lib/nutrition"
import { addDays, formatTime, todayISO } from "@/lib/date"
import type { MealType, Nutrients, PantryItem, PlannedMeal, Profile, Recipe, ShoppingItem } from "@/lib/types"

export interface CoachContext {
  profile: Profile
  targets: Targets
  totals: Nutrients
  loggedCount: number
  remaining: PlannedMeal[]
  lookup: (id: string) => Recipe | undefined
  /** Optional richer context (§42.2): pantry, shopping list, the week's plan and water records. */
  pantry?: PantryItem[]
  shopping?: ShoppingItem[]
  weekMeals?: PlannedMeal[]
  waterAvg?: number
  nowHHMM?: string
}

export interface CoachReply {
  text: string
  sources: string[]
  kind?: "emergency" | "referral"
  /** Quick-reply chips offered after this answer. */
  followUps?: string[]
}

/* Ingredient groups for pantry and "I don't have…" questions. Matched deterministically. */
const GROUPS: { key: string; label: string; match: RegExp; foods: string[] }[] = [
  { key: "egg", label: "eggs", match: /\beggs?\b|\bdim\b/, foods: ["egg_boiled", "omelette"] },
  { key: "rice", label: "rice", match: /\brice\b|\bbhat\b|\bchal\b/, foods: ["rice_cooked", "rice_dry", "khichuri"] },
  { key: "lentils", label: "lentils", match: /lentils?|\bdaa?l\b|masoor/, foods: ["dal_cooked", "lentils_dry"] },
  { key: "veg", label: "vegetables", match: /vegetables?|\bveg(gies)?\b|shak|spinach|pumpkin|potato|aloo/, foods: ["mixed_veg", "spinach_shak", "pumpkin", "aloo_bhorta"] },
  { key: "fish", label: "fish", match: /\bfish\b|\brui\b|hilsa|ilish|\bmach\b/, foods: ["rui_fish", "hilsa_fish", "fried_fish"] },
  { key: "chicken", label: "chicken", match: /chicken|murgi/, foods: ["chicken_curry", "biryani_home"] },
  { key: "beef", label: "beef", match: /\bbeef\b|\bmeat\b|gosht/, foods: ["beef_curry"] },
  { key: "milk", label: "milk", match: /\bmilk\b|dudh/, foods: ["milk", "milk_tea"] },
  { key: "doi", label: "yogurt", match: /yogh?urt|\bdoi\b|curd/, foods: ["doi"] },
  { key: "wheat", label: "roti or flour", match: /\broti\b|atta|flour|paratha|\bbread\b/, foods: ["roti", "paratha"] },
  { key: "oats", label: "oats", match: /\boats\b/, foods: ["oats_dry"] },
  { key: "chickpeas", label: "chickpeas", match: /chickpeas?|chola|chana/, foods: ["chickpeas_cooked"] },
  { key: "fruit", label: "fruit", match: /\bfruits?\b|banana|mango|guava|\bkola\b|\baam\b/, foods: ["banana", "mango", "guava"] },
  { key: "peanuts", label: "peanuts", match: /peanuts?|badam/, foods: ["peanuts"] },
]
const GROUP_OF: Record<string, string> = Object.fromEntries(GROUPS.flatMap((g) => g.foods.map((f) => [f, g.key])))
const groupOf = (foodId: string) => GROUP_OF[foodId] ?? foodId
// Oils are treated as kitchen staples when checking what can be cooked.
const isStaple = (foodId: string) => FOOD_MAP[foodId]?.category === "fat" && foodId !== "peanuts"
const mins = (r: Recipe) => r.prepMinutes + r.cookMinutes

export const EMERGENCY_SOURCE = "Emergency protocol"
export const REFERRAL_SOURCE = "Professional referral"

const EMERGENCY = /(can'?t breathe|cannot breathe|trouble breathing|difficulty breathing|chest pain|throat (is )?(swelling|closing)|swollen (tongue|lips|face)|anaphyla|faint|unconscious|seizure|suicid|self.?harm|very low (blood )?sugar|blood sugar.*(low|high).*(dizzy|shaking|confused)|vomiting blood)/i
const MEDICATION = /(medicine|medication|dose|dosage|insulin|metformin|tablet|pill|supplement.*(how much|dose)|stop taking|prescri)/i
const DIAGNOSE = /(do i have|am i (deficient|diabetic|anaemic|anemic)|diagnos|deficien)/i
const RESTRICT = /(skip (a |my |the )?(meal|dinner|lunch|breakfast)|\bfast(ing)? (to|for)|starve|burn (it )?off|make up for|compensate|lose .* (fast|quickly|in a week)|crash diet|eat nothing|purge)/i

function safeRecipes(ctx: CoachContext, filter: (r: Recipe) => boolean): Recipe[] {
  return RECIPES.filter((r) => r.profile === "adult" && r.reviewStatus === "approved" && !violatesHardConstraints(r, ctx.profile) && filter(r))
}

function list(recipes: Recipe[], extra: (r: Recipe) => string): string {
  return recipes.map((r) => `• ${r.name} — ${extra(r)}`).join("\n")
}

/** Deterministic coach reply. Safety routing runs first and cannot be overridden by other intents. */
export function coachReply(question: string, ctx: CoachContext): CoachReply {
  const q = question.toLowerCase()
  const { targets, totals, remaining, lookup } = ctx
  const logged = `${ctx.loggedCount} logged meal${ctx.loggedCount === 1 ? "" : "s"} today`

  if (EMERGENCY.test(q)) {
    return {
      kind: "emergency",
      text: "This could be an emergency. Please call 999 (Bangladesh national emergency) or go to the nearest hospital now. If you have a prescribed adrenaline auto-injector for allergies, use it as directed. I can't help with this in the app.",
      sources: [EMERGENCY_SOURCE],
    }
  }
  if (MEDICATION.test(q)) {
    return {
      kind: "referral",
      text: "I can't advise on medicines, doses or supplements — please ask your doctor or pharmacist. I can help you plan meals around the guidance they give you.",
      sources: [REFERRAL_SOURCE],
    }
  }
  if (DIAGNOSE.test(q)) {
    return {
      kind: "referral",
      text: "I can't tell whether you have a condition or deficiency from food records. If you're worried, a doctor can check with the right tests. What I can say is what your recorded meals contain — ask me about protein, fiber or iron in your log.",
      sources: [REFERRAL_SOURCE, "Your food log"],
    }
  }
  if (RESTRICT.test(q)) {
    return {
      text: "There's no need to skip meals or cut back to make up for anything. One day doesn't change your progress. Keep your next meal as planned and eat when you're hungry. If you often feel you need to compensate, talking to a dietitian can really help.",
      sources: ["Your meal plan", "Safety rules (no compensatory restriction)"],
    }
  }

  const grounded = groundedReply(q, ctx)
  if (grounded) return grounded

  if (/dinner|lunch|breakfast|next meal|what (should|can) i eat|eat (now|tonight)/.test(q)) {
    // A named meal ("dinner") answers about that meal; otherwise about the next one.
    const asked = /breakfast/.test(q) ? "breakfast" : /lunch/.test(q) ? "lunch" : /dinner|tonight/.test(q) ? "dinner" : null
    const next = asked ? remaining.find((m) => m.mealType === asked) : remaining[0]
    const planned = next ? lookup(next.recipeId) : undefined
    const slot = next?.mealType ?? asked ?? "dinner"
    const alts = safeRecipes(ctx, (r) => r.mealTypes.includes(slot) && r.id !== planned?.id).slice(0, 2)
    const head = planned && next ? `Your plan has ${planned.name} for ${MEAL_LABEL[next.mealType].toLowerCase()} at ${formatTime(next.time)} (~${Math.round(recipeNutrition(planned, next.servings).energyKcal)} kcal, ${Math.round(recipeNutrition(planned, next.servings).proteinG)} g protein). It fits your day as planned.` : asked ? `You don't have ${asked} left in today's plan.` : `You don't have another planned meal today.`
    return {
      text: `${head}${alts.length ? `\n\nIf you'd like something different, these also fit your allergies and diet:\n${list(alts, (r) => `~${Math.round(recipeNutrition(r).energyKcal)} kcal, ${r.prepMinutes + r.cookMinutes} min`)}` : ""}`,
      sources: ["Your meal plan", "Verified recipes", "Your allergies and diet"],
    }
  }

  if (/protein/.test(q)) {
    const gap = Math.max(0, targets.proteinG.low - totals.proteinG)
    const rich = safeRecipes(ctx, () => true)
      .sort((a, b) => recipeNutrition(b).proteinG - recipeNutrition(a).proteinG)
      .slice(0, 3)
    return {
      text: `From ${logged}, you've had about ${Math.round(totals.proteinG)} g of protein. Your range is ${targets.proteinG.low}–${targets.proteinG.high} g a day.${gap > 0 ? ` Your recorded meals may be low in protein so far — your remaining planned meals will add some of this.` : " You're within or near your range."}\n\nProtein-rich options that fit your profile:\n${list(rich, (r) => `~${Math.round(recipeNutrition(r).proteinG)} g protein`)}`,
      sources: ["Your food log", "Your targets", "Food database"],
    }
  }

  if (/fib(re|er)|vegetable/.test(q)) {
    return {
      text: `From ${logged}, you've had about ${Math.round(totals.fiberG)} g of fiber. Aim for at least ${targets.fiberMinG} g a day. Dal, chickpeas, whole-wheat roti, shak and fruit like guava are easy ways to add more.`,
      sources: ["Your food log", "Your targets", "Food database"],
    }
  }

  if (/cheap|budget|cost|money|taka|৳/.test(q)) {
    const cheap = safeRecipes(ctx, (r) => r.mealTypes.some((t) => ["lunch", "dinner"].includes(t)))
      .sort((a, b) => recipeCostPerServing(a) - recipeCostPerServing(b))
      .slice(0, 3)
    return {
      text: `Lower-cost meals that still meet your nutrition needs and restrictions:\n${list(cheap, (r) => `about ৳${Math.round(recipeCostPerServing(r))} per serving`)}\n\nPrices are estimates and change by market and season.`,
      sources: ["Verified recipes", "Food prices (estimates)", "Your allergies and diet"],
    }
  }

  if (/snack|hungry/.test(q)) {
    const snacks = safeRecipes(ctx, (r) => r.mealTypes.some((t) => t.includes("snack"))).slice(0, 3)
    return {
      text: `Snacks that fit your profile:\n${list(snacks, (r) => `~${Math.round(recipeNutrition(r).energyKcal)} kcal`)}\n\nIt's fine to eat when you're hungry — your plan is a guide, not a rule.`,
      sources: ["Verified recipes", "Your allergies and diet"],
    }
  }

  if (/ate too much|overate|too much|over (my )?(target|calories)|biryani|party|wedding|dawat/.test(q)) {
    return {
      text: "That happens, especially with family meals and celebrations. There's no need to skip or cut back — just carry on with your plan at the next meal. Over a week, one bigger meal makes little difference.",
      sources: ["Your meal plan", "Safety rules (no compensatory restriction)"],
    }
  }

  if (/why|explain/.test(q) && /plan|recipe|meal|calorie|target/.test(q)) {
    return {
      text: targets.supported
        ? `Your energy range (${targets.energy.low.toLocaleString("en-US")}–${targets.energy.high.toLocaleString("en-US")} kcal) comes from the ${targets.method}, using your age, height, weight and activity. Meals are chosen only from verified recipes that pass your allergy and diet rules, then ranked by your budget and cooking time. It's an estimate, and we adjust it as we learn what works for you.`
        : "Your targets are set with your care team, so I don't calculate them here. Meals still respect your allergies and diet.",
      sources: ["Your profile", "Nutrition engine", "Verified recipes"],
    }
  }

  if (/today|how am i doing|so far|summary/.test(q)) {
    return {
      text: `So far: about ${Math.round(totals.energyKcal)} kcal and ${Math.round(totals.proteinG)} g protein from ${logged}. These are estimates and only cover meals you've recorded${remaining.length ? `; ${remaining.length} planned meal${remaining.length === 1 ? " is" : "s are"} still to come` : ""}.`,
      sources: ["Your food log", "Your meal plan"],
    }
  }

  return {
    text: "I can help with questions about your plan and what you've logged — for example what to eat next, protein or fiber today, cheaper meals, snack ideas, or why your plan looks the way it does. For medical questions, please talk to a doctor.",
    sources: ["Your meal plan", "Your food log"],
  }
}

export const STARTERS = [
  "What should I eat for dinner?",
  "I have eggs, rice, lentils and vegetables. What can I cook?",
  "What ingredients do I need this week?",
  "I don't have fish at home",
  "I skipped breakfast. What should I eat now?",
  "I ate biryani for lunch. What should I have for dinner?",
  "I work at a desk all day. How can I eat better?",
  "I want to gain muscle on a budget",
  "How much protein have I had today?",
]

/** Simulated voice input phrases (§42.3 voice is an input channel of the coach). */
export const VOICE_SAMPLES = ["I skipped breakfast. What should I eat now?", "I don't have fish at home. What can I replace it with?", "Give me a quick breakfast for tomorrow"]

function mentionedGroups(q: string) {
  return GROUPS.filter((g) => g.match.test(q))
}

function allergyNote(groups: typeof GROUPS, p: Profile): string {
  const blocked = groups.filter((g) => g.foods.some((f) => (FOOD_MAP[f]?.allergens ?? []).some((a) => p.allergies.includes(a))))
  return blocked.length ? `\n\nRecipes with ${blocked.map((g) => g.label).join(" or ")} are left out because ${blocked.length === 1 ? "it's" : "they're"} recorded as an allergy.` : ""
}

/** Grounded answers for the §42.2 example questions. Returns null when no intent matches. */
function groundedReply(q: string, ctx: CoachContext): CoachReply | null {
  const { profile, targets, totals } = ctx
  const today = todayISO()
  const week = ctx.weekMeals ?? []

  // "I skipped breakfast. What should I eat now?" — supportive, never a catch-up meal (§41.6.2).
  const skipped = /(skipped|missed|didn'?t (eat|have)|no time for)\s+(my |the |a )?(breakfast|lunch|dinner|meal)/.exec(q)
  if (skipped) {
    const meal = skipped[4] === "meal" ? "meal" : skipped[4]
    const now = ctx.nowHHMM ?? "12:00"
    const slot: MealType = now < "11:00" ? "breakfast" : "afternoon_snack"
    const quick = safeRecipes(ctx, (r) => (slot === "breakfast" ? r.mealTypes.includes("breakfast") : r.mealTypes.some((t) => t.includes("snack"))) && mins(r) <= 20).slice(0, 2)
    const next = ctx.remaining.find((m) => m.mealType !== skipped[4])
    const nextRecipe = next ? ctx.lookup(next.recipeId) : undefined
    return {
      text: `That's okay — it happens on busy days. If you're hungry now, something quick and ordinary is perfect:\n${list(quick, (r) => `${mins(r)} min, ~${Math.round(recipeNutrition(r).proteinG)} g protein`)}${nextRecipe && next ? `\n\nThen have ${nextRecipe.name} at ${formatTime(next.time)} as planned. There's no need to make it bigger to catch up on the ${meal}.` : "\n\nThere's no need to eat extra later to catch up."}`,
      sources: ["Your meal plan", "Verified recipes", "Your allergies and diet", "Safety rules (no catch-up meals)"],
      followUps: ["Give me a quick breakfast for tomorrow", "How much protein have I had today?"],
    }
  }

  // "I ate biryani for lunch. What should I have for dinner?" — account for it, no restriction.
  const ateHeavy = /(ate|had|eaten|eating)\b.*\b(biryani|kacchi|tehari|polao|pulao|fried|burger|pizza|fast food|party|dawat|wedding|heavy|big (lunch|meal|breakfast)|a lot)/.test(q)
  const asksNext = /dinner|lunch|next|tonight|later|what (should|can|do) i/.test(q)
  if (ateHeavy && asksNext) {
    const slot: MealType = /lunch/.test(q) && !/for lunch/.test(q) ? "lunch" : "dinner"
    const options = safeRecipes(ctx, (r) => r.mealTypes.includes(slot) && recipeNutrition(r).energyKcal >= 350)
      .sort((a, b) => recipeNutrition(b).fiberG / recipeNutrition(b).energyKcal - recipeNutrition(a).fiberG / recipeNutrition(a).energyKcal)
      .slice(0, 2)
    const logged = ctx.loggedCount ? `Your log today shows about ${Math.round(totals.energyKcal).toLocaleString("en-US")} kcal from ${ctx.loggedCount} meal${ctx.loggedCount === 1 ? "" : "s"}${targets.supported ? ` (your daily range is ${targets.energy.low.toLocaleString("en-US")}–${targets.energy.high.toLocaleString("en-US")})` : ""}.` : "Nothing is logged yet today."
    return {
      text: `Biryani and celebration meals are part of life. ${logged} If that meal isn't logged yet, adding it gives a better picture.\n\nFor ${slot}, a normal-sized, balanced plate with vegetables and dal, fish or egg works well — lighter on oil, not smaller than usual:\n${list(options, (r) => `~${Math.round(recipeNutrition(r).energyKcal)} kcal, ${Math.round(recipeNutrition(r).fiberG)} g fiber`)}\n\nNo need to skip ${slot} or cut back to make up for it.`,
      sources: ["Your food log", "Verified recipes", "Your allergies and diet", "Safety rules (no compensatory restriction)"],
      followUps: ["How much protein have I had today?", "What's in my plan for tomorrow?"],
    }
  }

  // "What ingredients do I need for this week's meals?" — from the shopping list.
  if (/ingredients|shopping|grocer|what (do|should) i (need to )?buy|market list|bazaar/.test(q) && !/i have/.test(q)) {
    const items = (ctx.shopping ?? []).filter((i) => !i.purchased)
    if (!items.length) return { text: "Your shopping list is empty or everything is ticked off. It's built automatically from your active plan, minus what's in your pantry.", sources: ["Your shopping list"], followUps: ["What can I cook with what I have?"] }
    const byCat = new Map<string, ShoppingItem[]>()
    items.forEach((i) => byCat.set(i.category, [...(byCat.get(i.category) ?? []), i]))
    const lines = [...byCat.entries()].map(([cat, xs]) => `• ${cat}: ${xs.map((x) => `${x.name} (${x.grams >= 1000 ? `${Math.round(x.grams / 100) / 10} kg` : `${Math.round(x.grams)} g`})`).join(", ")}`)
    const cost = items.reduce((t, i) => t + i.costBdt, 0)
    return {
      text: `For the rest of this week's plan you still need:\n${lines.join("\n")}\n\nEstimated cost about ৳${Math.round(cost).toLocaleString("en-US")}. Items already in your pantry are left out. Open Plan → Shopping list to tick things off.`,
      sources: ["Your shopping list", "Your meal plan", "Your pantry", "Food prices (estimates)"],
      followUps: ["Give me a cheaper lunch idea", "I don't have fish at home"],
    }
  }

  // "I don't have fish at home. What can I replace it with?" — swaps from safe options, recalculated.
  if (/(don'?t|do not|didn'?t) have|out of|ran out|no \w+ (at home|left)|instead of|replace|substitute/.test(q)) {
    const g = mentionedGroups(q)[0]
    if (!g) return { text: "Which ingredient don't you have? For example: \"I don't have fish\". I'll check your upcoming planned meals and suggest options that still fit your allergies and diet.", sources: ["Your meal plan"], followUps: ["I don't have fish at home", "I don't have eggs"] }
    const upcoming = week.filter((m) => m.date >= today && !m.outcome).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    const affected = upcoming.filter((m) => ctx.lookup(m.recipeId)?.ingredients.some((i) => groupOf(i.foodId) === g.key))
    if (!affected.length) return { text: `None of your upcoming planned meals use ${g.label}, so nothing needs to change.`, sources: ["Your meal plan"], followUps: ["What ingredients do I need this week?"] }
    const meal = affected[0]
    const planned = ctx.lookup(meal.recipeId)!
    const p0 = recipeNutrition(planned).proteinG
    const alts = safeRecipes(ctx, (r) => r.id !== planned.id && r.mealTypes.includes(meal.mealType) && !r.ingredients.some((i) => groupOf(i.foodId) === g.key))
      .sort((a, b) => Math.abs(recipeNutrition(a).proteinG - p0) - Math.abs(recipeNutrition(b).proteinG - p0))
      .slice(0, 2)
    const day = meal.date === today ? "today" : meal.date === addDays(today, 1) ? "tomorrow" : new Date(`${meal.date}T00:00:00`).toLocaleDateString("en-GB", { weekday: "long" })
    return {
      text: `${planned.name} (${MEAL_LABEL[meal.mealType].toLowerCase()} ${day}) uses ${g.label}${affected.length > 1 ? `, and ${affected.length - 1} more planned meal${affected.length > 2 ? "s do" : " does"} too` : ""}. Options without it that fit your allergies and diet:\n${list(alts, (r) => `~${Math.round(recipeNutrition(r).proteinG)} g protein vs ~${Math.round(p0)} g planned`)}\n\nNutrition is recalculated for any swap — it's never assumed to be the same. You can swap it from the meal in your plan.`,
      sources: ["Your meal plan", "Verified recipes", "Your allergies and diet", "Nutrition engine"],
      followUps: ["What can I cook with what I have?", "What ingredients do I need this week?"],
    }
  }

  // "I have eggs, rice, lentils and vegetables at home. What can I cook?" — pantry + verified recipes.
  const said = mentionedGroups(q)
  if ((/what can i (cook|make)|i have|at home|in my (fridge|pantry|kitchen)/.test(q) && said.length) || /what can i (cook|make)/.test(q)) {
    const fromPantry = (ctx.pantry ?? []).map((p) => groupOf(p.foodId))
    const have = new Set([...said.map((g) => g.key), ...(said.length ? [] : fromPantry)])
    const scored = safeRecipes(ctx, () => true)
      .map((r) => {
        const need = r.ingredients.filter((i) => !i.optional && !isStaple(i.foodId))
        const missing = need.filter((i) => !have.has(groupOf(i.foodId)))
        return { r, missing, ratio: need.length ? (need.length - missing.length) / need.length : 0 }
      })
      .filter((x) => x.ratio >= 0.5)
      .sort((a, b) => b.ratio - a.ratio || mins(a.r) - mins(b.r))
      .slice(0, 3)
    const source = said.length ? `With ${said.map((g) => g.label).join(", ")}` : "With what's in your pantry"
    if (!scored.length) return { text: `${source}, none of our verified recipes are a close match yet. Adding one or two more ingredients, like dal or vegetables, opens up more options.${allergyNote(said, profile)}`, sources: [said.length ? "Your message" : "Your pantry", "Verified recipes"], followUps: ["What ingredients do I need this week?"] }
    return {
      text: `${source}, you could make:\n${scored.map(({ r, missing }) => `• ${r.name} — ${missing.length ? `also needs ${Array.from(new Set(missing.map((m) => FOOD_MAP[m.foodId]?.name.toLowerCase() ?? m.foodId))).join(", ")}` : "you have the main ingredients"} (${mins(r)} min)`).join("\n")}\n\nAll of these pass your allergy and diet rules. Nutrition comes from the recipe's actual quantities.${allergyNote(said, profile)}`,
      sources: [said.length ? "Your message" : "Your pantry", "Verified recipes", "Your allergies and diet"],
      followUps: ["Give me a quick breakfast for tomorrow", "What ingredients do I need this week?"],
    }
  }

  // "I work at a desk all day. How can I improve my eating habits?"
  if (/desk|office job|sit(ting)? (all day|a lot)|sedentary|computer all day/.test(q)) {
    const tomorrow = week.filter((m) => m.date === today || m.date === addDays(today, 1))
    const lunch = tomorrow.find((m) => m.mealType === "lunch")
    const snack = tomorrow.find((m) => m.mealType.includes("snack"))
    const skippedSnacks = week.filter((m) => m.date < today && m.mealType.includes("snack") && m.outcome === "skipped").length
    const tips = [
      lunch ? `Your plan has lunch at ${formatTime(lunch.time)}${snack ? ` and a snack at ${formatTime(snack.time)}` : ""}. Keeping those times regular helps on long workdays.` : "Regular meal times help on long workdays.",
      skippedSnacks >= 2 ? `You skipped the afternoon snack ${skippedSnacks} times this week. Packing it the night before makes it easier to have at your desk.` : "Pack your snack the night before so it's ready at your desk.",
      ctx.waterAvg !== undefined ? `You've recorded about ${Math.round(ctx.waterAvg)} glasses of water a day. A bottle on your desk is an easy reminder.` : "Keep a water bottle on your desk.",
      "Choose fiber-rich lunches like dal, vegetables and roti — they keep you full through the afternoon.",
      "A short walk after lunch breaks up long sitting time.",
    ]
    return {
      text: `A few ideas based on your plan and records${profile.workStart && profile.workEnd ? ` (you work ${formatTime(profile.workStart)}–${formatTime(profile.workEnd)})` : ""}:\n${tips.map((t) => `• ${t}`).join("\n")}\n\nWant to turn one into a habit? Try Progress → Habits.`,
      sources: ["Your profile", "Your meal plan", "Your water records"],
      followUps: ["Give me a snack idea", "What should I eat for lunch today?"],
    }
  }

  // "I want to gain muscle without spending too much money on food."
  if (/muscle|gain (weight|mass)|bulk/.test(q)) {
    const rich = safeRecipes(ctx, (r) => r.mealTypes.some((t) => ["breakfast", "lunch", "dinner"].includes(t)))
      .map((r) => ({ r, p: recipeNutrition(r).proteinG, c: Math.max(1, recipeCostPerServing(r)) }))
      .filter((x) => x.p >= 15)
      .sort((a, b) => b.p / b.c - a.p / a.c)
      .slice(0, 3)
    const budget = profile.budgetPerWeekBdt
    const weekCost = rich[0] ? rich[0].c * 7 : 0
    const goalNote = profile.goal === "build_muscle" ? `Your protein range for building muscle is ${targets.proteinG.low}–${targets.proteinG.high} g a day.` : `Your current goal isn't set to building muscle. If you change it in your profile, your protein range is recalculated with validated rules (now ${targets.proteinG.low}–${targets.proteinG.high} g a day).`
    return {
      text: `${goalNote}\n\nBest protein for the money among recipes that fit you:\n${rich.map(({ r, p, c }) => `• ${r.name} — ~${Math.round(p)} g protein for about ৳${c}`).join("\n")}${budget && rich[0] ? `\n\nHaving the first one daily would cost about ৳${weekCost.toLocaleString("en-US")} a week, against your ৳${budget.toLocaleString("en-US")} weekly budget.` : ""}\n\nEggs, dal, chickpeas and small fish are the cheapest protein sources locally. Strength training matters as much as food, and results vary from person to person.`,
      sources: ["Your budget", "Your targets", "Verified recipes", "Food prices (estimates)"],
      followUps: ["Give me a cheaper lunch idea", "How much protein have I had today?"],
    }
  }

  // "Give me a quick breakfast for tomorrow."
  if (/tomorrow/.test(q) && /breakfast|lunch|dinner|plan|meal/.test(q)) {
    const tmr = addDays(today, 1)
    const slot: MealType | null = /breakfast/.test(q) ? "breakfast" : /lunch/.test(q) ? "lunch" : /dinner/.test(q) ? "dinner" : null
    const meals = week.filter((m) => m.date === tmr && (!slot || m.mealType === slot))
    const quick = slot ? safeRecipes(ctx, (r) => r.mealTypes.includes(slot) && mins(r) <= 15).slice(0, 2) : []
    return {
      text: `${meals.length ? `Tomorrow's plan:\n${meals.map((m) => `• ${MEAL_LABEL[m.mealType]} at ${formatTime(m.time)} — ${ctx.lookup(m.recipeId)?.name ?? "meal"}`).join("\n")}` : "There's nothing planned for tomorrow yet."}${quick.length ? `\n\nQuick ${slot} options (15 min or less) that fit you:\n${list(quick, (r) => `${mins(r)} min`)}` : ""}`,
      sources: ["Your meal plan", "Verified recipes", "Your allergies and diet"],
      followUps: ["What ingredients do I need this week?"],
    }
  }

  return null
}

/** Allergens of a recipe that conflict with the profile (for explanations only). */
export function recipeConflicts(r: Recipe, p: Profile): string[] {
  return recipeAllergens(r).filter((a) => p.allergies.includes(a)).map((a) => ALLERGEN_LABELS[a] ?? a)
}
