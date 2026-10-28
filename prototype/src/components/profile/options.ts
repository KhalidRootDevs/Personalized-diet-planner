import type { Allergen } from "@/lib/types"

export const GOALS = [
  { value: "maintain", label: "Maintain current weight" },
  { value: "lose_weight", label: "Lose weight" },
  { value: "gain_weight", label: "Gain weight" },
  { value: "build_muscle", label: "Build muscle" },
  { value: "improve_nutrition", label: "Improve general nutrition" },
  { value: "consistency", label: "Improve meal consistency" },
  { value: "sports", label: "Support sports performance" },
  { value: "pregnancy", label: "Plan nutrition during pregnancy" },
  { value: "breastfeeding", label: "Support breastfeeding nutrition" },
  { value: "variety", label: "Improve dietary variety" },
  { value: "condition", label: "Follow guidance for a health condition" },
] as const

export const GOAL_LABEL: Record<string, string> = Object.fromEntries(GOALS.map((g) => [g.value, g.label]))

export const OCCUPATIONS = [
  { value: "office_worker", label: "Desk-based office work" },
  { value: "remote", label: "Remote work from home" },
  { value: "teaching", label: "Teaching" },
  { value: "retail", label: "Retail or hospitality" },
  { value: "healthcare", label: "Healthcare work" },
  { value: "construction", label: "Construction" },
  { value: "agriculture", label: "Agriculture" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "delivery", label: "Delivery or transportation" },
  { value: "sports", label: "Sports or fitness" },
  { value: "student", label: "Student" },
  { value: "other", label: "Other" },
]

export const ACTIVITY = [
  { value: "sedentary", label: "Mostly sedentary", description: "Sitting most of the day, little walking" },
  { value: "light", label: "Lightly active", description: "Some walking, light chores, commuting on foot" },
  { value: "moderate", label: "Moderately active", description: "On your feet much of the day, or exercise 3–5×/week" },
  { value: "very", label: "Very active", description: "Physical work most of the day, or daily training" },
  { value: "extreme", label: "Extremely active", description: "Heavy labour or intense training, often in heat" },
]

export const DIETS = [
  { value: "halal", label: "Halal" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "egg_free", label: "Egg-free (preference)" },
  { value: "dairy_free", label: "Dairy-free (preference)" },
  { value: "gluten_free", label: "Gluten-free (preference)" },
]

export const ALLERGENS: { value: Allergen; label: string }[] = [
  { value: "egg", label: "Egg" },
  { value: "milk", label: "Milk" },
  { value: "fish", label: "Fish" },
  { value: "shellfish", label: "Shellfish" },
  { value: "wheat", label: "Wheat / gluten (celiac)" },
  { value: "peanut", label: "Peanut" },
  { value: "tree_nut", label: "Tree nuts" },
  { value: "sesame", label: "Sesame" },
  { value: "soy", label: "Soy" },
  { value: "mustard", label: "Mustard" },
]

export const CONDITIONS = [
  { value: "diabetes", label: "Diabetes" },
  { value: "hypertension", label: "High blood pressure" },
  { value: "kidney_disease", label: "Chronic kidney disease" },
  { value: "heart_disease", label: "Heart disease" },
  { value: "gi_condition", label: "Digestive condition" },
  { value: "celiac", label: "Celiac disease" },
  { value: "iron_deficiency", label: "Diagnosed iron deficiency" },
  { value: "pregnancy", label: "Pregnant" },
  { value: "breastfeeding", label: "Breastfeeding" },
  { value: "eating_disorder", label: "History of an eating disorder" },
  { value: "swallowing", label: "Difficulty swallowing or eating" },
]

/** Conditions that need professional review before a specialized plan (§13.1 Level 3). */
export const REVIEW_CONDITIONS = ["kidney_disease", "eating_disorder", "swallowing"]
/** Conditions that are clinically gated in later phases (§43 2.18, 2.23). */
export const GATED_CONDITIONS = ["diabetes", "pregnancy", "breastfeeding", "heart_disease", "hypertension"]

export const CONDITION_LABEL: Record<string, string> = Object.fromEntries(CONDITIONS.map((c) => [c.value, c.label]))
export const DIET_LABEL: Record<string, string> = Object.fromEntries(DIETS.map((d) => [d.value, d.label]))
export const OCCUPATION_LABEL: Record<string, string> = Object.fromEntries(OCCUPATIONS.map((d) => [d.value, d.label]))
export const ACTIVITY_LABEL: Record<string, string> = Object.fromEntries(ACTIVITY.map((d) => [d.value, d.label]))
