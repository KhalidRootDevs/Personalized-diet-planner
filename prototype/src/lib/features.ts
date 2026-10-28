// Release phase (§43) and PROPOSED subscription tier per feature.
// Tier assignment is an open decision (§43.7 #1) — this mapping exists only so stakeholders
// can react to a concrete proposal. Safety features are never gated (§30.1, §43 rule 2).
import type { Phase, Tier } from "@/lib/types"

export type FeatureId =
  | "journal_photo" | "journal_text" | "dashboard" | "planned_vs_actual" | "plan_3_7" | "calendar" | "reminders" | "shopping"
  | "swap_similar" | "baby_module" | "weekly_review_basic" | "progress_basic" | "child_profiles"
  | "coach" | "swap_modes" | "voice_logging" | "barcode_logging" | "saved_meals" | "recipe_library" | "ai_recipe_variations"
  | "pantry" | "budget_optimizer" | "what_if" | "habits" | "insights" | "smart_reminders" | "family" | "plan_long" | "google_calendar"
  | "adaptive" | "autopilot" | "twin" | "confidence" | "nutrient_gaps" | "restaurant" | "wearables" | "professional" | "plan_framework"

export interface FeatureInfo {
  name: string
  phase: Phase
  tier: Tier
  spec: string
}

export const FEATURES: Record<FeatureId, FeatureInfo> = {
  journal_photo: { name: "Photo food logging", phase: 1, tier: "free", spec: "§41" },
  journal_text: { name: "Manual & text logging", phase: 1, tier: "free", spec: "§41, §42.3" },
  dashboard: { name: "Daily nutrition dashboard", phase: 1, tier: "free", spec: "§41.4" },
  planned_vs_actual: { name: "Planned vs actual", phase: 1, tier: "free", spec: "§41.5" },
  plan_3_7: { name: "3- and 7-day plans", phase: 1, tier: "free", spec: "§10" },
  calendar: { name: "Meal calendar & daily tasks", phase: 1, tier: "free", spec: "§14, §42.16" },
  reminders: { name: "Reminders", phase: 1, tier: "free", spec: "§26" },
  shopping: { name: "Shopping list", phase: 1, tier: "free", spec: "§16" },
  swap_similar: { name: "Replace meal (similar nutrition)", phase: 1, tier: "free", spec: "§15.3" },
  baby_module: { name: "Baby feeding module", phase: 1, tier: "free", spec: "§12" },
  weekly_review_basic: { name: "Weekly review", phase: 1, tier: "free", spec: "§17.6" },
  progress_basic: { name: "Progress tracking", phase: 1, tier: "free", spec: "§17" },
  child_profiles: { name: "Dependent child profiles", phase: 1, tier: "free", spec: "§5.10" },

  coach: { name: "AI Nutrition Coach", phase: 2, tier: "premium", spec: "§42.2" },
  swap_modes: { name: "Cheaper / quick / pantry swaps", phase: 2, tier: "premium", spec: "§42.11" },
  voice_logging: { name: "Voice logging", phase: 2, tier: "premium", spec: "§42.3" },
  barcode_logging: { name: "Barcode logging", phase: 2, tier: "premium", spec: "§42.3" },
  saved_meals: { name: "Saved meals & meal memory", phase: 2, tier: "free", spec: "§42.3.2" },
  recipe_library: { name: "Personal recipe library", phase: 2, tier: "premium", spec: "§42.5" },
  ai_recipe_variations: { name: "AI recipe variations", phase: 2, tier: "premium", spec: "§9.3" },
  pantry: { name: "Pantry", phase: 2, tier: "premium", spec: "§42.8.2" },
  budget_optimizer: { name: "Budget optimizer", phase: 2, tier: "premium", spec: "§42.7" },
  what_if: { name: "What if I eat this?", phase: 2, tier: "premium", spec: "§42.4" },
  habits: { name: "Habit builder", phase: 2, tier: "premium", spec: "§42.18" },
  insights: { name: "Explained insights", phase: 2, tier: "premium", spec: "§42.19" },
  smart_reminders: { name: "Learning reminders", phase: 2, tier: "premium", spec: "§42.17" },
  family: { name: "Family profiles & shared meals", phase: 2, tier: "family", spec: "§42.9" },
  plan_long: { name: "1, 14 and 30-day plans", phase: 2, tier: "premium", spec: "§10.2" },
  google_calendar: { name: "Google Calendar sync", phase: 2, tier: "premium", spec: "§14.4" },

  adaptive: { name: "Adaptive meal plans", phase: 3, tier: "premium", spec: "§42.13" },
  autopilot: { name: "Weekly Nutrition Autopilot", phase: 3, tier: "premium", spec: "§42.14" },
  twin: { name: "Personal Nutrition Twin", phase: 3, tier: "premium", spec: "§42.15" },
  confidence: { name: "Nutrition confidence score", phase: 3, tier: "free", spec: "§42.20" },
  nutrient_gaps: { name: "Nutrient gap detection", phase: 3, tier: "premium", spec: "§42.12" },
  restaurant: { name: "Restaurant assistant", phase: 3, tier: "premium", spec: "§42.22" },
  wearables: { name: "Wearable integrations", phase: 3, tier: "premium", spec: "§42.23" },
  professional: { name: "Dietitian access & reports", phase: 3, tier: "premium", spec: "§42.24" },
  plan_framework: { name: "3–6 month plan frameworks", phase: 3, tier: "premium", spec: "§10.2" },
}

const RANK: Record<Tier, number> = { free: 0, premium: 1, family: 2, professional: 3 }

export function tierAllows(current: Tier, required: Tier): boolean {
  if (required === "family") return current === "family" || current === "professional"
  return RANK[current] >= RANK[required]
}

export const TIERS: { id: Tier; name: string; monthly: number; yearly: number; tagline: string; features: string[] }[] = [
  {
    id: "free",
    name: "Free",
    monthly: 0,
    yearly: 0,
    tagline: "Everything you need to plan and log",
    features: ["One primary profile + child profiles", "3- and 7-day meal plans", "Photo, manual and text food logging", "Daily nutrition dashboard", "Calendar, reminders and shopping list", "All allergy and safety protection"],
  },
  {
    id: "premium",
    name: "Premium",
    monthly: 299,
    yearly: 2990,
    tagline: "A personal coach and smarter planning",
    features: ["AI Nutrition Coach", "Cheaper, quick and pantry swaps", "Voice and barcode logging", "Budget optimizer and pantry", "Habits and explained insights", "Longer plans and Weekly Autopilot"],
  },
  {
    id: "family",
    name: "Family",
    monthly: 499,
    yearly: 4990,
    tagline: "Plan for the whole household",
    features: ["Everything in Premium", "Up to 6 household profiles", "Shared family meals with per-person servings", "Shared shopping list", "Per-member privacy controls"],
  },
  {
    id: "professional",
    name: "Professional",
    monthly: 1499,
    yearly: 14990,
    tagline: "For dietitians and clinics",
    features: ["Client management", "Journal and plan review", "Plan approval workflow", "Client progress reports", "Professional notes"],
  },
]
