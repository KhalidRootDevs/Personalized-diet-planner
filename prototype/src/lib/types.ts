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
  /** Total sugars (§8.1). Optional; not summed by every calculation yet. */
  sugarsG?: number
}

export interface PortionUnit {
  label: string
  labelBn?: string
  grams: number
  /** Household/local measure whose gram weight is an estimate, not a measured standard (§42.6). */
  estimate?: boolean
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
  /** Preparation / composition notes, e.g. oil assumptions for fried variants (§8.1). */
  prepNotes?: string
  /** Food-data review state (§28). Undefined = not yet reviewed. */
  reviewStatus?: "reviewed" | "pending" | "unreviewed"
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
  /** §9.1 extras (optional; derived when missing). */
  equipment?: string[]
  reheating?: string
  source?: string
  /** Personal library (§42.5): notes, own cost estimate per serving, origin. */
  notes?: string
  costPerServingBdt?: number
  basedOnId?: string
  /** AI-suggested variation (§9.3B): always personal and not reviewed. */
  aiVariation?: { kind: string; modelVersion: string; validatedAt: string }
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
  validation: { nutrition: boolean; safety: boolean; requiresReview: boolean; warnings: string[]; checks?: PlanCheck[] }
  createdAt: string
  meals: PlannedMeal[]
  /** Planning inputs (§10.1, §19.3) — used to revise or regenerate the plan. */
  settings?: PlanSettings
  /** Snapshot of key profile inputs at generation time (§19.3). */
  inputs?: { label: string; value: string }[]
  /** Deterministic "why these meals" text (§10.1 step 9, §25.2 step 9). */
  explanation?: string[]
  /** Professional review workflow (§13.3, §28). Never "approved" without a reviewer decision. */
  review?: PlanReview
  /** Long-term framework (§10.2): weekly themes + rolling 7-day plans, not a rigid daily menu. */
  framework?: { months: number; weeks: { week: number; theme: string }[] }
  /** Approved but waiting for its start date (Autopilot, §42.14). */
  scheduledStart?: boolean
  nextReviewDate?: string
  adaptations?: string[]
}

export type PlanPreset = "balanced" | "lowest_cost" | "high_protein" | "quick" | "pantry" | "seasonal" | "family"

export interface PlanSettings {
  durationDays: number
  startDate: string
  mealsPerDay: 3 | 4 | 5
  preset: PlanPreset
  maxPrepMinutes: number
  times: Partial<Record<MealType, string>>
  /** Budget acts as a constraint on cost ranking (§42.7). */
  weeklyBudgetBdt?: number
  people?: number
  /** Recipes to favor (meals eaten as planned) / avoid (often skipped or replaced). */
  favorites?: string[]
  avoid?: string[]
  /** Per-slot cooking limits (e.g. quicker dinners from adaptive suggestions). */
  slotMaxMinutes?: Partial<Record<MealType, number>>
  frameworkMonths?: 3 | 6
}

export interface PlanCheck {
  id: string
  label: string
  status: "pass" | "warn" | "fail" | "na"
  detail: string
  /** A failing blocking check means the plan can't be activated (§10.5). */
  blocking: boolean
}

export interface PlanReview {
  status: "pending" | "approved" | "changes_requested"
  submittedAt: string
  reviewer?: string
  decidedAt?: string
  note?: string
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
  /** Alternative foods proposed when identification confidence is low (§41.3.4). */
  candidates?: string[]
}

export interface JournalEntry {
  id: string
  profileId: string
  mealType: MealType
  consumedAt: string // ISO
  source: "photo" | "manual" | "text" | "voice" | "barcode" | "saved" | "recipe" | "restaurant" | "planned"
  hasPhoto: boolean
  items: JournalItem[]
  hiddenIngredients: { oil?: "none" | "little" | "moderate" | "lots"; sugar?: boolean; sauce?: boolean; butter?: boolean; coconutMilk?: boolean }
  analysisStatus: "pending_confirmation" | "confirmed"
  linkedPlannedMealId?: string
  note?: string
  /** Downscaled private thumbnail of the first photo (data URL, never a public link — §41.7.3). */
  photoThumb?: string
  /** All photo thumbnails for this meal (several angles, §41.2). */
  photos?: string[]
  /** Timestamped edits after saving (§41.7, §41.10 Req. 9). The AI original stays on each item. */
  history?: { at: string; change: string }[]
  /** Recipe the entry was logged from, if any (§42.3.1 recipe entry). */
  recipeId?: string
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
  /** Preferred meal times (plan settings, §10.1 step 6). */
  mealTimes?: Partial<Record<MealType, string>>
  feeding?: "breastfeeding" | "formula" | "both"
  avatarColor: "sage" | "terracotta" | "forest"
  // ── Onboarding details (§5.2–§5.8). All optional and additive. ──
  /** Account owner who set up NutriPlan only to care for a dependent: no health data, no own plan (§5.10). */
  caregiverOnly?: boolean
  /** Setup asked only safety-critical questions; work, schedule, food likes and kitchen are still on defaults (§5.1). */
  personalizeLater?: boolean
  region?: string
  units?: "metric" | "imperial"
  /** Where height/weight came from (§5.2): self-reported vs clinically measured. */
  measurementSource?: "self_reported" | "clinical"
  /** Weight-loss follow-up (§5.3). Only used when restriction is safe to automate. */
  weightLossPace?: "gradual" | "steady"
  work?: { hoursPerDay?: number; daysPerWeek?: number; sitting?: "most" | "half" | "little"; lifting?: boolean; outdoorsOrHeat?: boolean; nightShift?: boolean }
  exercise?: { daysPerWeek: number; minutesPerSession: number }
  schedule?: { wake?: string; sleep?: string; breakfast?: string; lunch?: string; dinner?: string }
  foodPrefs?: { enjoyed: string[]; disliked: string[]; unavailable: string[]; religious?: string; homeCooked?: "mostly_home" | "mixed" | "mostly_out"; notes?: string }
  /** §5.6 answers. Medication is recorded only to keep plans general — never to change medicines or doses. */
  healthAnswers?: { takesMedication?: boolean; clinicianAdvisedDiet?: boolean; recentWeightChange?: boolean; diagnosedDeficiencies?: string[] }
  budget?: { amountBdt: number; period: "day" | "week" | "month"; scope: "personal" | "household"; includes: "groceries" | "groceries_and_eating_out" }
  cooking?: { whoCooks: "self" | "someone_else" | "shared"; equipment: string[]; carriesFoodToWork: boolean; batchCook: boolean }
  /** Child-specific setup answers (§12). Measurements still never use adult equations. */
  childInfo?: {
    premature?: boolean
    gestationWeeks?: number
    readinessSigns?: string[]
    conditions?: string[]
    feedingDifficulties?: string[]
    foodsIntroduced?: string[]
    clinicianRestrictions?: string
    pastReaction?: boolean
    pastReactionNote?: string
  }
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
  /** Quantity changed by the user (§16.2); kept when the list is rebuilt. */
  edited?: boolean
  /** Name of the ingredient this replaced (§42.8.1 unavailable / §16.3 cheaper). */
  substitutedFrom?: string
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

/** Admin console drafts (§28). Nothing here changes live food, recipe or rule data until reviewed. */
export interface AdminState {
  /** Draft edits to food records, awaiting review before publishing. */
  foodOverrides: Record<string, { name?: string; nameBn?: string; costPer100gBdt?: number; confidence?: Food["confidence"]; prepNotes?: string; per100g?: Partial<Nutrients>; reviewStatus?: Food["reviewStatus"]; editedAt: string }>
  recipeStatus: Record<string, Recipe["reviewStatus"]>
  ruleChanges: { id: string; ruleId: string; summary: string; rationale: string; source: string; submittedAt: string; status: "submitted" }[]
  translationStatus: Record<string, "approved" | "needs_review">
}
