"use client"

// Prototype state. Everything lives in the browser (localStorage); there is no backend.
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { addDays, startOfWeek, todayISO, uid } from "@/lib/date"
import { buildShoppingList, generatePlan } from "@/lib/planning"
import type {
  AppNotification,
  CoachMessage,
  ConsentRecord,
  GrowthRecord,
  Habit,
  IntroducedFood,
  JournalEntry,
  MealOutcome,
  MealPlan,
  PantryItem,
  Profile,
  Recipe,
  SavedMeal,
  ShoppingItem,
  Tier,
} from "@/lib/types"

export interface User {
  id: string
  name: string
  email: string
}

export interface Settings {
  language: "en" | "bn"
  showPhaseBadges: boolean
  reminders: Record<string, { enabled: boolean; time: string }>
  reminderChannel: "push" | "email"
  integrations: Record<string, boolean>
  professionalAccess: { name: string; scope: string; grantedAt: string } | null
}

interface State {
  hydrated: boolean
  user: User | null
  onboarded: boolean
  tier: Tier
  billingCycle: "monthly" | "yearly"
  profiles: Profile[]
  activeProfileId: string
  plans: MealPlan[]
  activePlanId: string | null
  journal: JournalEntry[]
  shopping: ShoppingItem[]
  shoppingPeople: number
  pantry: PantryItem[]
  habits: Habit[]
  savedMeals: SavedMeal[]
  userRecipes: Recipe[]
  introduced: IntroducedFood[]
  growth: GrowthRecord[]
  coach: CoachMessage[]
  notifications: AppNotification[]
  consents: ConsentRecord[]
  twinPreferences: { id: string; text: string; evidence: string; active: boolean }[]
  settings: Settings

  // auth
  setHydrated: () => void
  signIn: (email: string, name?: string) => void
  signOut: () => void
  resetDemo: () => void
  completeOnboarding: (profile: Partial<Profile>, consents: ConsentRecord[], child?: Partial<Profile>) => void
  loadDemo: () => void
  // subscription
  setTier: (tier: Tier, cycle?: "monthly" | "yearly") => void
  // profiles
  setActiveProfile: (id: string) => void
  upsertProfile: (p: Profile) => void
  removeProfile: (id: string) => void
  // plans & meals
  addPlan: (plan: MealPlan, activate?: boolean) => void
  activatePlan: (id: string) => void
  setPlanStatus: (id: string, status: MealPlan["status"]) => void
  setMealOutcome: (mealId: string, outcome: MealOutcome, journalEntryId?: string) => void
  rescheduleMeal: (mealId: string, date: string, time: string) => void
  replaceMeal: (mealId: string, recipeId: string) => void
  setMealServings: (mealId: string, servings: number) => void
  togglePrepLater: (mealId: string) => void
  // journal
  addEntry: (e: JournalEntry) => void
  updateEntry: (e: JournalEntry) => void
  deleteEntry: (id: string, keepNutrition?: boolean) => void
  // shopping & pantry
  rebuildShopping: () => void
  setShoppingPeople: (n: number) => void
  toggleShopping: (id: string) => void
  updateShopping: (id: string, patch: Partial<ShoppingItem>) => void
  removeShopping: (id: string) => void
  addShopping: (item: ShoppingItem) => void
  upsertPantry: (item: PantryItem) => void
  removePantry: (id: string) => void
  // habits, saved meals, recipes
  toggleHabit: (id: string, date: string) => void
  addHabit: (h: Habit) => void
  removeHabit: (id: string) => void
  saveMeal: (m: SavedMeal) => void
  bumpSavedMeal: (id: string) => void
  upsertUserRecipe: (r: Recipe) => void
  removeUserRecipe: (id: string) => void
  // infant
  addIntroduced: (f: IntroducedFood) => void
  addGrowth: (g: GrowthRecord) => void
  // coach, notifications, consent, settings
  addCoachMessage: (m: CoachMessage) => void
  clearCoach: () => void
  markNotificationsRead: () => void
  pushNotification: (n: Omit<AppNotification, "id" | "createdAt" | "read">) => void
  setConsent: (type: ConsentRecord["type"], granted: boolean) => void
  setTwinPreference: (id: string, active: boolean) => void
  updateSettings: (patch: Partial<Settings>) => void
}

const DEFAULT_SETTINGS: Settings = {
  language: "en",
  showPhaseBadges: true,
  reminderChannel: "push",
  reminders: {
    meals: { enabled: true, time: "15 min before" },
    prep: { enabled: true, time: "19:30" },
    logging: { enabled: true, time: "21:00" },
    water: { enabled: false, time: "Every 2 hours" },
    shopping: { enabled: true, time: "Fri 18:00" },
    weekly_review: { enabled: true, time: "Sun 20:00" },
    baby_feeding: { enabled: false, time: "After each feed" },
  },
  integrations: { google_calendar: false, health_connect: false, apple_health: false, fitbit: false },
  professionalAccess: null,
}

const EMPTY = {
  user: null as User | null,
  onboarded: false,
  tier: "free" as Tier,
  billingCycle: "monthly" as const,
  profiles: [] as Profile[],
  activeProfileId: "",
  plans: [] as MealPlan[],
  activePlanId: null as string | null,
  journal: [] as JournalEntry[],
  shopping: [] as ShoppingItem[],
  shoppingPeople: 1,
  pantry: [] as PantryItem[],
  habits: [] as Habit[],
  savedMeals: [] as SavedMeal[],
  userRecipes: [] as Recipe[],
  introduced: [] as IntroducedFood[],
  growth: [] as GrowthRecord[],
  coach: [] as CoachMessage[],
  notifications: [] as AppNotification[],
  consents: [] as ConsentRecord[],
  twinPreferences: [] as State["twinPreferences"],
  settings: DEFAULT_SETTINGS,
}

function demoAdult(name: string, overrides: Partial<Profile> = {}): Profile {
  return {
    id: "p_self",
    type: "adult",
    relation: "self",
    name,
    dateOfBirth: "1996-04-12",
    sex: "female",
    heightCm: 162,
    weightKg: 64,
    goal: "improve_nutrition",
    occupation: "office_worker",
    activity: "light",
    workStart: "10:00",
    workEnd: "19:00",
    diet: ["halal"],
    allergies: [],
    conditions: [],
    budgetPerWeekBdt: 2500,
    maxPrepMinutes: 30,
    mealsPerDay: 4,
    includeSnacks: true,
    avatarColor: "forest",
    ...overrides,
  }
}

function demoChild(): Profile {
  return {
    id: "p_baby",
    type: "infant",
    relation: "child",
    name: "Ayaan",
    dateOfBirth: addDays(todayISO(), -225),
    sex: "male",
    weightKg: 7.9,
    heightCm: 68,
    diet: [],
    allergies: [],
    conditions: [],
    feeding: "breastfeeding",
    avatarColor: "sage",
  }
}

function buildDemoData(adult: Profile, child: Profile | null) {
  const today = todayISO()
  const start = startOfWeek(today)
  const plan = generatePlan(adult, {
    durationDays: 7,
    startDate: start,
    mealsPerDay: 4,
    preset: "balanced",
    maxPrepMinutes: adult.maxPrepMinutes ?? 30,
    times: { breakfast: "08:30", lunch: "13:00", afternoon_snack: "16:30", dinner: "20:30" },
  })
  plan.status = "active"
  plan.title = "This week's balanced plan"
  const journal: JournalEntry[] = []
  const pastOutcomes: MealOutcome[] = ["eaten_as_planned", "eaten_as_planned", "eaten_modified", "eaten_as_planned", "replaced", "eaten_as_planned", "skipped", "eaten_as_planned"]
  let k = 0
  plan.meals = plan.meals.map((m) => {
    if (m.date < today) {
      const outcome = pastOutcomes[k++ % pastOutcomes.length]
      return { ...m, scheduleStatus: "upcoming", outcome }
    }
    if (m.date === today && m.mealType === "breakfast") {
      const entryId = uid("entry")
      journal.push({
        id: entryId,
        profileId: adult.id,
        mealType: "breakfast",
        consumedAt: `${today}T08:40:00`,
        source: "photo",
        hasPhoto: true,
        items: [
          { id: uid("it"), foodId: "egg_boiled", displayName: "Boiled egg", grams: 100, unitLabel: "2 eggs", identificationConfidence: "high", quantityConfidence: "high", confirmedByUser: true },
          { id: uid("it"), foodId: "roti", displayName: "Whole-wheat roti", grams: 80, unitLabel: "2 roti", identificationConfidence: "high", quantityConfidence: "moderate", confirmedByUser: true },
          { id: uid("it"), foodId: "milk_tea", displayName: "Milk tea with sugar", grams: 150, unitLabel: "1 cup", identificationConfidence: "moderate", quantityConfidence: "moderate", confirmedByUser: true },
        ],
        hiddenIngredients: { oil: "none", sugar: false },
        analysisStatus: "confirmed",
        linkedPlannedMealId: m.id,
      })
      return { ...m, outcome: "eaten_modified", linkedJournalEntryId: entryId }
    }
    return m
  })
  // Past-day journal entries so trends and insights have data (§42.19)
  for (let d = 1; d <= 6; d++) {
    const date = addDays(today, -d)
    journal.push({
      id: uid("entry"),
      profileId: adult.id,
      mealType: "lunch",
      consumedAt: `${date}T13:10:00`,
      source: d % 2 ? "photo" : "manual",
      hasPhoto: d % 2 === 1,
      items: [
        { id: uid("it"), foodId: "rice_cooked", displayName: "Cooked rice", grams: 220 + d * 10, identificationConfidence: "high", quantityConfidence: "moderate", confirmedByUser: true },
        { id: uid("it"), foodId: d % 3 ? "rui_fish" : "chicken_curry", displayName: d % 3 ? "Rui fish (cooked)" : "Chicken curry (home)", grams: 100, identificationConfidence: "moderate", quantityConfidence: "moderate", confirmedByUser: true },
        { id: uid("it"), foodId: "dal_cooked", displayName: "Masoor dal (cooked)", grams: 150, identificationConfidence: "high", quantityConfidence: "moderate", confirmedByUser: true },
      ],
      hiddenIngredients: { oil: "moderate" },
      analysisStatus: "confirmed",
    })
    journal.push({
      id: uid("entry"),
      profileId: adult.id,
      mealType: "dinner",
      consumedAt: `${date}T20:45:00`,
      source: "planned",
      hasPhoto: false,
      items: [
        { id: uid("it"), foodId: "roti", displayName: "Whole-wheat roti", grams: 120, identificationConfidence: "high", quantityConfidence: "high", confirmedByUser: true },
        { id: uid("it"), foodId: d % 2 ? "chickpeas_cooked" : "omelette", displayName: d % 2 ? "Chickpeas (cooked)" : "Vegetable omelette", grams: 150, identificationConfidence: "high", quantityConfidence: "high", confirmedByUser: true },
      ],
      hiddenIngredients: {},
      analysisStatus: "confirmed",
    })
  }
  const pantry: PantryItem[] = [
    { id: uid("pan"), foodId: "rice_dry", name: "Rice (dry)", grams: 2000 },
    { id: uid("pan"), foodId: "lentils_dry", name: "Red lentils (dry)", grams: 500, expiresOn: addDays(today, 60) },
    { id: uid("pan"), foodId: "egg_boiled", name: "Eggs", grams: 300, expiresOn: addDays(today, 5) },
    { id: uid("pan"), foodId: "milk", name: "Cow's milk", grams: 500, expiresOn: addDays(today, 2) },
  ]
  const habitDays = (pattern: number[]) => Object.fromEntries(pattern.map((v, i) => [addDays(today, -6 + i), v === 1]))
  const habits: Habit[] = [
    { id: "h_breakfast", title: "Prepare breakfast the night before", description: "Picked because breakfast was often skipped on workdays.", icon: "Sunrise", days: habitDays([1, 0, 1, 1, 0, 1, 0]) },
    { id: "h_protein", title: "Include a protein source at lunch", description: "One manageable goal to start with.", icon: "Egg", days: habitDays([1, 1, 1, 0, 1, 1, 0]) },
    { id: "h_water", title: "Drink water with each meal", description: "Optional hydration habit.", icon: "GlassWater", days: habitDays([1, 1, 0, 1, 1, 1, 0]) },
  ]
  const introduced: IntroducedFood[] = child
    ? [
        { id: uid("intro"), profileId: child.id, foodName: "Masoor dal purée", date: addDays(today, -20), preparation: "Boiled, blended smooth", texture: "Smooth purée", accepted: "yes", reaction: "None observed", clinicianAdvisedAvoid: false },
        { id: uid("intro"), profileId: child.id, foodName: "Mashed pumpkin", date: addDays(today, -16), preparation: "Steamed, mashed", texture: "Smooth mash", accepted: "yes", reaction: "None observed", clinicianAdvisedAvoid: false },
        { id: uid("intro"), profileId: child.id, foodName: "Mashed banana", date: addDays(today, -11), preparation: "Raw, mashed", texture: "Smooth mash", accepted: "somewhat", reaction: "None observed", clinicianAdvisedAvoid: false },
        { id: uid("intro"), profileId: child.id, foodName: "Well-cooked egg", date: addDays(today, -5), preparation: "Hard-boiled, finely mashed", texture: "Finely mashed", accepted: "yes", reaction: "Mild redness around mouth, settled within an hour — discuss with clinician", clinicianAdvisedAvoid: false },
      ]
    : []
  const growth: GrowthRecord[] = child
    ? [
        { id: uid("g"), profileId: child.id, date: addDays(today, -120), weightKg: 6.4, lengthCm: 63, source: "clinic" },
        { id: uid("g"), profileId: child.id, date: addDays(today, -60), weightKg: 7.2, lengthCm: 66, source: "clinic" },
        { id: uid("g"), profileId: child.id, date: addDays(today, -7), weightKg: 7.9, lengthCm: 68, source: "home" },
      ]
    : []
  const notifications: AppNotification[] = [
    { id: uid("n"), title: "Lunch at 1:00 PM", body: "Your lunch is scheduled for 1:00 PM. Would you like to view the recipe or choose an alternative?", createdAt: `${today}T12:45:00`, read: false, href: "/plan" },
    { id: uid("n"), title: "Prep for tomorrow", body: "Soak chickpeas tonight for tomorrow's dinner.", createdAt: `${addDays(today, -1)}T19:30:00`, read: false, href: "/plan/prep" },
    { id: uid("n"), title: "Your weekly review is ready", body: "See how last week went and choose one priority for this week.", createdAt: `${addDays(today, -2)}T20:00:00`, read: true, href: "/progress/weekly-review" },
  ]
  const savedMeals: SavedMeal[] = [
    { id: uid("sm"), name: "My usual breakfast", mealType: "breakfast", items: [{ foodId: "egg_boiled", grams: 100 }, { foodId: "roti", grams: 80 }, { foodId: "milk_tea", grams: 150 }], timesConfirmed: 4 },
    { id: uid("sm"), name: "Office lunch box", mealType: "lunch", items: [{ foodId: "rice_cooked", grams: 250 }, { foodId: "chicken_curry", grams: 120 }, { foodId: "mixed_veg", grams: 100 }], timesConfirmed: 3 },
  ]
  const twinPreferences = [
    { id: uid("tw"), text: "Prefers quick lunches (≤ 20 min) on weekdays", evidence: "Chose quick options on 9 of 12 workdays", active: true },
    { id: uid("tw"), text: "Usually eats dinner around 8:30 PM", evidence: "Logged dinner between 8:15 and 9:00 PM on 10 days", active: true },
    { id: uid("tw"), text: "Often skips the afternoon snack on busy days", evidence: "Skipped 4 of the last 7 afternoon snacks", active: true },
    { id: uid("tw"), text: "Enjoys fish more than chicken", evidence: "Based on only 3 ratings — not enough to rely on yet", active: false },
  ]
  return { plan, journal, pantry, habits, introduced, growth, notifications, savedMeals, twinPreferences }
}

export const useApp = create<State>()(
  persist(
    (set, get) => ({
      hydrated: false,
      ...EMPTY,

      setHydrated: () => set({ hydrated: true }),
      signIn: (email, name) =>
        set({ user: { id: uid("u"), email, name: name || email.split("@")[0].replace(/^\w/, (c) => c.toUpperCase()) } }),
      signOut: () => set({ ...EMPTY, settings: get().settings }),
      resetDemo: () => set({ ...EMPTY }),

      completeOnboarding: (profile, consents, child) => {
        const user = get().user
        const adult = demoAdult(profile.name || user?.name || "Friend", profile)
        const kid = child ? { ...demoChild(), ...child } : null
        const d = buildDemoData(adult, kid)
        set({
          onboarded: true,
          profiles: kid ? [adult, kid] : [adult],
          activeProfileId: adult.id,
          plans: [d.plan],
          activePlanId: d.plan.id,
          journal: d.journal,
          shopping: buildShoppingList(d.plan.meals.filter((m) => m.date >= todayISO()), 1, d.pantry),
          pantry: d.pantry,
          habits: d.habits,
          introduced: d.introduced,
          growth: d.growth,
          notifications: d.notifications,
          savedMeals: d.savedMeals,
          twinPreferences: d.twinPreferences,
          consents,
        })
      },
      loadDemo: () => {
        const at = new Date().toISOString()
        set({ user: { id: "u_demo", name: "Nadia", email: "nadia@example.com" } })
        get().completeOnboarding({ name: "Nadia" }, [
          { type: "health_data", granted: true, version: "1.0", at },
          { type: "food_photos", granted: true, version: "1.0", at },
          { type: "child_data", granted: true, version: "1.0", at },
          { type: "ai_processing", granted: true, version: "1.0", at },
          { type: "analytics", granted: false, version: "1.0", at },
        ], {})
      },

      setTier: (tier, cycle) => set({ tier, billingCycle: cycle ?? get().billingCycle }),

      setActiveProfile: (id) => set({ activeProfileId: id }),
      upsertProfile: (p) => set({ profiles: get().profiles.some((x) => x.id === p.id) ? get().profiles.map((x) => (x.id === p.id ? p : x)) : [...get().profiles, p] }),
      removeProfile: (id) => set({ profiles: get().profiles.filter((p) => p.id !== id), activeProfileId: get().activeProfileId === id ? "p_self" : get().activeProfileId }),

      addPlan: (plan, activate) =>
        set({
          plans: [...get().plans.map((p) => (activate && p.status === "active" ? { ...p, status: "archived" as const } : p)), activate ? { ...plan, status: "active" } : plan],
          activePlanId: activate ? plan.id : get().activePlanId,
          shopping: activate ? buildShoppingList(plan.meals.filter((m) => m.date >= todayISO()), get().shoppingPeople, get().pantry) : get().shopping,
        }),
      activatePlan: (id) => {
        const plan = get().plans.find((p) => p.id === id)
        if (!plan || !plan.validation.safety) return
        set({
          plans: get().plans.map((p) => (p.id === id ? { ...p, status: "active" } : p.status === "active" ? { ...p, status: "archived" } : p)),
          activePlanId: id,
          shopping: buildShoppingList(plan.meals.filter((m) => m.date >= todayISO()), get().shoppingPeople, get().pantry),
        })
      },
      setPlanStatus: (id, status) => set({ plans: get().plans.map((p) => (p.id === id ? { ...p, status } : p)) }),
      setMealOutcome: (mealId, outcome, journalEntryId) =>
        set({ plans: get().plans.map((p) => ({ ...p, meals: p.meals.map((m) => (m.id === mealId ? { ...m, outcome, linkedJournalEntryId: journalEntryId ?? m.linkedJournalEntryId } : m)) })) }),
      rescheduleMeal: (mealId, date, time) =>
        set({ plans: get().plans.map((p) => ({ ...p, meals: p.meals.map((m) => (m.id === mealId ? { ...m, date, time, scheduleStatus: "rescheduled" } : m)) })) }),
      replaceMeal: (mealId, recipeId) => {
        set({ plans: get().plans.map((p) => ({ ...p, meals: p.meals.map((m) => (m.id === mealId ? { ...m, recipeId } : m)) })) })
        get().rebuildShopping()
      },
      setMealServings: (mealId, servings) => {
        set({ plans: get().plans.map((p) => ({ ...p, meals: p.meals.map((m) => (m.id === mealId ? { ...m, servings } : m)) })) })
        get().rebuildShopping()
      },
      togglePrepLater: (mealId) => set({ plans: get().plans.map((p) => ({ ...p, meals: p.meals.map((m) => (m.id === mealId ? { ...m, prepLater: !m.prepLater } : m)) })) }),

      addEntry: (e) => set({ journal: [...get().journal, e] }),
      updateEntry: (e) => set({ journal: get().journal.map((x) => (x.id === e.id ? e : x)) }),
      deleteEntry: (id) => {
        set({
          journal: get().journal.filter((x) => x.id !== id),
          plans: get().plans.map((p) => ({ ...p, meals: p.meals.map((m) => (m.linkedJournalEntryId === id ? { ...m, linkedJournalEntryId: undefined, outcome: null } : m)) })),
        })
      },

      rebuildShopping: () => {
        const plan = get().plans.find((p) => p.id === get().activePlanId)
        if (!plan) return
        const purchased = new Set(get().shopping.filter((s) => s.purchased).map((s) => s.foodId))
        const manual = get().shopping.filter((s) => s.manual)
        const fresh = buildShoppingList(plan.meals.filter((m) => m.date >= todayISO()), get().shoppingPeople, get().pantry).map((s) => ({ ...s, purchased: purchased.has(s.foodId) }))
        set({ shopping: [...fresh, ...manual] })
      },
      setShoppingPeople: (n) => {
        set({ shoppingPeople: n })
        get().rebuildShopping()
      },
      toggleShopping: (id) => set({ shopping: get().shopping.map((s) => (s.id === id ? { ...s, purchased: !s.purchased } : s)) }),
      updateShopping: (id, patch) => set({ shopping: get().shopping.map((s) => (s.id === id ? { ...s, ...patch } : s)) }),
      removeShopping: (id) => set({ shopping: get().shopping.filter((s) => s.id !== id) }),
      addShopping: (item) => set({ shopping: [...get().shopping, item] }),
      upsertPantry: (item) => {
        set({ pantry: get().pantry.some((x) => x.id === item.id) ? get().pantry.map((x) => (x.id === item.id ? item : x)) : [...get().pantry, item] })
        get().rebuildShopping()
      },
      removePantry: (id) => {
        set({ pantry: get().pantry.filter((x) => x.id !== id) })
        get().rebuildShopping()
      },

      toggleHabit: (id, date) => set({ habits: get().habits.map((h) => (h.id === id ? { ...h, days: { ...h.days, [date]: !h.days[date] } } : h)) }),
      addHabit: (h) => set({ habits: [...get().habits, h] }),
      removeHabit: (id) => set({ habits: get().habits.filter((h) => h.id !== id) }),
      saveMeal: (m) => set({ savedMeals: [...get().savedMeals, m] }),
      bumpSavedMeal: (id) => set({ savedMeals: get().savedMeals.map((m) => (m.id === id ? { ...m, timesConfirmed: m.timesConfirmed + 1 } : m)) }),
      upsertUserRecipe: (r) => set({ userRecipes: get().userRecipes.some((x) => x.id === r.id) ? get().userRecipes.map((x) => (x.id === r.id ? r : x)) : [...get().userRecipes, r] }),
      removeUserRecipe: (id) => set({ userRecipes: get().userRecipes.filter((r) => r.id !== id) }),

      addIntroduced: (f) => set({ introduced: [...get().introduced, f] }),
      addGrowth: (g) => set({ growth: [...get().growth, g] }),

      addCoachMessage: (m) => set({ coach: [...get().coach, m] }),
      clearCoach: () => set({ coach: [] }),
      markNotificationsRead: () => set({ notifications: get().notifications.map((n) => ({ ...n, read: true })) }),
      pushNotification: (n) => set({ notifications: [{ ...n, id: uid("n"), createdAt: new Date().toISOString(), read: false }, ...get().notifications] }),
      setConsent: (type, granted) => {
        const at = new Date().toISOString()
        const rest = get().consents.filter((c) => c.type !== type)
        set({ consents: [...rest, { type, granted, version: "1.0", at }] })
      },
      setTwinPreference: (id, active) => set({ twinPreferences: get().twinPreferences.map((t) => (t.id === id ? { ...t, active } : t)) }),
      updateSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),
    }),
    {
      name: "nutriplan-prototype",
      version: 1,
      partialize: (s) => {
        const { hydrated: _hydrated, ...rest } = s
        void _hydrated
        return Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== "function")) as Partial<State>
      },
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
)

// Selectors
export function useActiveProfile(): Profile | undefined {
  return useApp((s) => s.profiles.find((p) => p.id === s.activeProfileId) ?? s.profiles[0])
}

export function useActivePlan(): MealPlan | undefined {
  return useApp((s) => s.plans.find((p) => p.id === s.activePlanId))
}

export function useSelfProfile(): Profile | undefined {
  return useApp((s) => s.profiles.find((p) => p.relation === "self"))
}
