// AI Nutrition Coach, prototype (§42.2). Answers are built deterministically from the user's
// validated plan, journal and food DB. A production model would only phrase these facts and
// could not add foods that fail hard constraints (§18, §42.2 safety rules).
import { RECIPES } from "@/lib/data/recipes"
import { MEAL_LABEL } from "@/lib/planning"
import { recipeCostPerServing, recipeNutrition, violatesHardConstraints, type Targets } from "@/lib/nutrition"
import { formatTime } from "@/lib/date"
import type { Nutrients, PlannedMeal, Profile, Recipe } from "@/lib/types"

export interface CoachContext {
  profile: Profile
  targets: Targets
  totals: Nutrients
  loggedCount: number
  remaining: PlannedMeal[]
  lookup: (id: string) => Recipe | undefined
}

export interface CoachReply {
  text: string
  sources: string[]
  kind?: "emergency" | "referral"
}

export const EMERGENCY_SOURCE = "Emergency protocol"
export const REFERRAL_SOURCE = "Professional referral"

const EMERGENCY = /(can'?t breathe|cannot breathe|trouble breathing|difficulty breathing|chest pain|throat (is )?(swelling|closing)|swollen (tongue|lips|face)|anaphyla|faint|unconscious|seizure|suicid|self.?harm|very low (blood )?sugar|blood sugar.*(low|high).*(dizzy|shaking|confused)|vomiting blood)/i
const MEDICATION = /(medicine|medication|dose|dosage|insulin|metformin|tablet|pill|supplement.*(how much|dose)|stop taking|prescri)/i
const DIAGNOSE = /(do i have|am i (deficient|diabetic|anaemic|anemic)|diagnos|deficien)/i
const RESTRICT = /(skip (a |my |the )?(meal|dinner|lunch|breakfast)|fast(ing)? (to|for)|starve|burn (it )?off|make up for|compensate|lose .* (fast|quickly|in a week)|crash diet|eat nothing|purge)/i

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

export const STARTERS = ["What should I eat for dinner?", "How much protein have I had today?", "Give me a cheaper lunch idea", "I ate too much at a dawat", "Why is my plan this many calories?"]
