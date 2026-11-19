import type { Allergen } from "@/lib/types"
import { REVIEW_REQUIRED_CONDITIONS as ENGINE_REVIEW_REQUIRED } from "@/lib/nutrition"

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
  { value: "infant_feeding", label: "Plan infant complementary feeding" },
  { value: "family", label: "Plan meals for the family" },
] as const

/** Goals that route to another workflow rather than an adult target (§5.3). Hidden in the adult profile editor. */
export const ROUTING_GOALS = ["infant_feeding"]

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

/** Conditions that need professional review before a specialized plan (§13.1 Level 3). Single source: the nutrition engine. */
export const REVIEW_REQUIRED_CONDITIONS: string[] = [...ENGINE_REVIEW_REQUIRED]
/** @deprecated alias kept for existing imports. */
export const REVIEW_CONDITIONS = REVIEW_REQUIRED_CONDITIONS
/** Circumstances where calorie restriction is never automated (§13, CLAUDE.md guardrails). */
export const NO_RESTRICTION_CONDITIONS = ["pregnancy", "breastfeeding", "eating_disorder"]
/** Conditions that are clinically gated in later phases (§43 2.18, 2.23). */
export const GATED_CONDITIONS = ["diabetes", "pregnancy", "breastfeeding", "heart_disease", "hypertension"]

export const CONDITION_LABEL: Record<string, string> = Object.fromEntries(CONDITIONS.map((c) => [c.value, c.label]))
export const DIET_LABEL: Record<string, string> = Object.fromEntries(DIETS.map((d) => [d.value, d.label]))
export const OCCUPATION_LABEL: Record<string, string> = Object.fromEntries(OCCUPATIONS.map((d) => [d.value, d.label]))
export const ACTIVITY_LABEL: Record<string, string> = Object.fromEntries(ACTIVITY.map((d) => [d.value, d.label]))

export const REGIONS = ["Dhaka", "Chattogram", "Khulna", "Rajshahi", "Barishal", "Sylhet", "Rangpur", "Mymensingh"].map((r) => ({ value: r, label: r }))

/** Diagnosed deficiencies only (§5.6). We never infer a deficiency from food records. */
export const DEFICIENCIES = [
  { value: "iron", label: "Iron / anaemia" },
  { value: "vitamin_d", label: "Vitamin D" },
  { value: "b12", label: "Vitamin B12" },
  { value: "calcium", label: "Calcium" },
  { value: "iodine", label: "Iodine" },
  { value: "zinc", label: "Zinc" },
]

/** Common local foods for likes / dislikes / unavailable chips (§5.5). */
export const FOOD_CHOICES = ["Rice", "Roti", "Dal", "Fish", "Hilsa", "Chicken", "Beef", "Mutton", "Egg", "Shak (leafy greens)", "Khichuri", "Bhorta", "Shutki", "Milk", "Doi", "Seasonal fruit", "Oats"].map((f) => ({ value: f, label: f }))

export const EQUIPMENT = [
  { value: "stove", label: "Stove" },
  { value: "fridge", label: "Refrigerator" },
  { value: "microwave", label: "Microwave" },
  { value: "rice_cooker", label: "Rice cooker" },
  { value: "blender", label: "Blender" },
  { value: "pressure_cooker", label: "Pressure cooker" },
]

/** Developmental readiness signs for solids, around 6 months (§12). Caregiver-reported, not a diagnosis. */
export const READINESS_SIGNS = [
  { value: "sits", label: "Sits with little support" },
  { value: "head_control", label: "Good head and neck control" },
  { value: "interest", label: "Shows interest in food" },
  { value: "opens_mouth", label: "Opens mouth when food comes near" },
  { value: "swallows", label: "Swallows rather than pushes food out" },
]

/** Diagnosed conditions for a child profile (§12, §13). Any of these keeps suggestions general. */
export const CHILD_CONDITIONS = [
  { value: "anaemia", label: "Diagnosed anaemia" },
  { value: "reflux", label: "Reflux" },
  { value: "developmental", label: "Developmental condition" },
  { value: "faltering_growth", label: "Growth concern raised by a clinician" },
  { value: "other", label: "Other diagnosed condition" },
]

export const FEEDING_DIFFICULTIES = [
  { value: "gagging", label: "Frequent gagging or choking" },
  { value: "refuses", label: "Refuses most foods" },
  { value: "chewing", label: "Difficulty chewing or swallowing" },
  { value: "slow", label: "Very long or stressful feeds" },
]

export const FIRST_FOODS = ["Rice", "Dal", "Pumpkin", "Potato", "Banana", "Egg", "Fish", "Chicken", "Khichuri", "Suji", "Papaya", "Doi"].map((f) => ({ value: f, label: f }))
