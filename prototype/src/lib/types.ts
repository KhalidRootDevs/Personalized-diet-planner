// Domain types for the prototype. Field names follow docs/prd §23 and §41.7 where defined.

export type Tier = "free" | "premium" | "family" | "professional"
export type Phase = 1 | 2 | 3

export type Allergen =
  | "egg"
  | "milk"
  | "fish"
  | "wheat"
  | "peanut"
  | "tree_nut"
  | "sesame"
  | "shellfish"
  | "soy"
  | "mustard"

export type MealType = "breakfast" | "morning_snack" | "lunch" | "afternoon_snack" | "dinner" | "evening_snack" | "drinks" | "other"

export interface Nutrients {
  energyKcal: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
  ironMg?: number
  calciumMg?: number
  sodiumMg?: number
}

export interface PortionUnit {
  label: string
  labelBn?: string
  grams: number
}

export interface Food {
  id: string
  name: string
  nameBn: string
  category: "grain" | "pulse" | "fish" | "meat" | "egg" | "dairy" | "vegetable" | "fruit" | "fat" | "mixed_dish" | "drink" | "sweet"
  state: "raw" | "cooked" | "dry" | "prepared"
  per100g: Nutrients
  allergens: Allergen[]
  units: PortionUnit[]
  costPer100gBdt?: number
  variant?: "home" | "restaurant"
  dataSource: string
  confidence: "high" | "moderate" | "low"
  infantSafeFromMonths?: number
  chokingRisk?: boolean
}

export interface RecipeIngredient {
  foodId: string
  grams: number
  note?: string
  optional?: boolean
}

export interface Recipe {
  id: string
  name: string
  nameBn: string
  description: string
  mealTypes: MealType[]
  profile: "adult" | "infant" | "child"
  minAgeMonths?: number
  texture?: string
  prepMinutes: number
  cookMinutes: number
  servings: number
  difficulty: "easy" | "medium"
  ingredients: RecipeIngredient[]
  steps: string[]
  safetyNotes: string[]
  storage?: string
  tags: string[]
  reviewStatus: "approved" | "pending" | "personal"
  swatch: "sage" | "terracotta" | "ivory" | "forest"
  icon: string
}

export type ScheduleStatus = "upcoming" | "due" | "rescheduled" | "paused"
export type MealOutcome = "eaten_as_planned" | "eaten_modified" | "replaced" | "skipped" | "unresolved" | null

export interface PlannedMeal {
  id: string
  date: string // yyyy-mm-dd
  mealType: MealType
  time: string // HH:mm
  recipeId: string
  servings: number
  scheduleStatus: ScheduleStatus
  outcome: MealOutcome
  linkedJournalEntryId?: string
  prepLater?: boolean
}

export interface MealPlan {
  id: string
  title: string
  goal: string
  durationDays: number
  startDate: string
  status: "draft" | "active" | "paused" | "archived"
  validation: { nutrition: boolean; safety: boolean; requiresReview: boolean; warnings: string[] }
  createdAt: string
  meals: PlannedMeal[]
}

export interface JournalItem {
  id: string
  foodId: string
  displayName: string
  grams: number
  unitLabel?: string
  identificationConfidence: "high" | "moderate" | "low"
  quantityConfidence: "high" | "moderate" | "low"
  confirmedByUser: boolean
  cookingMethod?: string
  aiOriginal?: { foodId: string; grams: number }
}

export interface JournalEntry {
  id: string
  profileId: string
  mealType: MealType
  consumedAt: string // ISO
  source: "photo" | "manual" | "text" | "voice" | "barcode" | "saved" | "recipe" | "restaurant" | "planned"
  hasPhoto: boolean
  items: JournalItem[]
  hiddenIngredients: { oil?: "none" | "little" | "moderate" | "lots"; sugar?: boolean; sauce?: boolean }
  analysisStatus: "pending_confirmation" | "confirmed"
  linkedPlannedMealId?: string
  note?: string
}

export interface Profile {
  id: string
  type: "adult" | "infant" | "child"
  relation: "self" | "child" | "partner" | "family"
  name: string
  dateOfBirth: string
  sex?: "female" | "male"
  heightCm?: number
  weightKg?: number
  goal?: string
  occupation?: string
  activity?: string
  workStart?: string
  workEnd?: string
  diet: string[]
  allergies: Allergen[]
  conditions: string[]
  budgetPerWeekBdt?: number
  maxPrepMinutes?: number
  mealsPerDay?: number
  includeSnacks?: boolean
  feeding?: "breastfeeding" | "formula" | "both"
  avatarColor: "sage" | "terracotta" | "forest"
}

export interface IntroducedFood {
  id: string
  profileId: string
  foodName: string
  date: string
  preparation: string
  texture: string
  accepted: "yes" | "somewhat" | "no"
  reaction: string
  clinicianAdvisedAvoid: boolean
}

export interface GrowthRecord {
  id: string
  profileId: string
  date: string
  weightKg?: number
  lengthCm?: number
  source: "home" | "clinic"
}

export interface ShoppingItem {
  id: string
  foodId: string
  name: string
  category: string
  grams: number
  purchased: boolean
  optional?: boolean
  costBdt: number
  manual?: boolean
}

export interface PantryItem {
  id: string
  foodId: string
  name: string
  grams: number
  expiresOn?: string
}

export interface Habit {
  id: string
  title: string
  description: string
  icon: string
  days: Record<string, boolean> // yyyy-mm-dd -> done
}

export interface CoachMessage {
  id: string
  role: "user" | "coach"
  text: string
  createdAt: string
  sources?: string[]
}

export interface SavedMeal {
  id: string
  name: string
  mealType: MealType
  items: { foodId: string; grams: number }[]
  timesConfirmed: number
}

export interface AppNotification {
  id: string
  title: string
  body: string
  createdAt: string
  read: boolean
  href?: string
}

export interface ConsentRecord {
  type: "health_data" | "food_photos" | "child_data" | "ai_processing" | "analytics"
  granted: boolean
  version: string
  at: string
}
