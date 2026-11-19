"use client"

// Progress, feedback, privacy audit, family permissions and analytics state (§17, §29, §31, §42.9,
// §42.18, §42.24). Kept in its own persisted slice so it doesn't collide with the shared app store.
// Everything stays in this browser; there is no backend.
import { useEffect } from "react"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { addDays, startOfWeek, todayISO, uid } from "@/lib/date"
import { useApp } from "@/lib/store"
import type { JournalEntry } from "@/lib/types"

export interface WeighIn {
  id: string
  profileId: string
  date: string
  weightKg?: number
  waistCm?: number
}

export type Level3 = "low" | "ok" | "high"

export interface CheckIn {
  id: string
  profileId: string
  date: string
  energy?: Level3
  hunger?: Level3
  fullness?: Level3
  sleepHours?: number
  exerciseMinutes?: number
}

/** Post-meal feedback (§17.5). Improves future selection; never overrides safety constraints. */
export interface MealFeedback {
  id: string
  mealId: string
  recipeId: string
  date: string
  mealType: string
  portion: "right" | "too_much" | "too_little"
  enjoyed: "yes" | "somewhat" | "no"
  again: boolean
  ingredientsAvailable?: boolean
  easyToPrepare?: boolean
  createdAt: string
}

/** A user-approved adjustment that applies when the next plan is generated (§17.6, §42.13). */
export interface ApprovedAdjustment {
  id: string
  key: string
  title: string
  detail: string
  approvedAt: string
  status: "pending_next_plan" | "undone"
}

export interface AuditEntry {
  id: string
  at: string
  action: string
  detail: string
  actor: "you" | "professional" | "system"
}

export interface AnalyticsEvent {
  id: string
  at: string
  name: string
  props?: Record<string, string | number | boolean>
}

export interface ProfessionalNote {
  id: string
  at: string
  author: string
  text: string
}

export type MemberPermission = "shared_meals" | "shopping" | "plan" | "health"
export interface MemberPermissions {
  shared_meals: boolean
  shopping: boolean
  plan: boolean
  /** "requested" = waiting for that adult's own approval (§29.1). */
  health: boolean | "requested"
}

export interface HouseholdInvite {
  id: string
  code: string
  relation: "partner" | "family"
  createdAt: string
}

export interface HabitReview {
  weekStart: string
  struggled: string[]
  priorities: string[]
  savedAt: string
}

export interface PlanBaseline {
  planId: string
  weightKg?: number
  activity?: string
  budgetPerWeekBdt?: number
  childStages: Record<string, string>
  dismissed: string[]
}

export interface ProgressPrefs {
  trackingFrequency: "weekly" | "fortnightly" | "monthly" | "off"
  hideWeight: boolean
}

interface AreaDState {
  seededFor: string | null
  weighIns: WeighIn[]
  checkIns: CheckIn[]
  mealFeedback: MealFeedback[]
  weeklyFocus: { weekStart: string; text: string; savedAt: string } | null
  approvedAdjustments: ApprovedAdjustment[]
  dismissedAdjustments: string[]
  auditLog: AuditEntry[]
  events: AnalyticsEvent[]
  professionalNotes: ProfessionalNote[]
  familyPermissions: Record<string, MemberPermissions>
  invites: HouseholdInvite[]
  habitReviews: HabitReview[]
  childFoodChecks: string[]
  twinEdits: Record<string, string>
  planBaseline: PlanBaseline | null
  progressPrefs: ProgressPrefs

  addWeighIn: (w: Omit<WeighIn, "id">) => void
  removeWeighIn: (id: string) => void
  upsertCheckIn: (c: Omit<CheckIn, "id">) => void
  addFeedback: (f: Omit<MealFeedback, "id" | "createdAt">) => void
  setWeeklyFocus: (text: string) => void
  approveAdjustment: (a: { key: string; title: string; detail: string }) => void
  undoAdjustment: (id: string) => void
  dismissAdjustment: (key: string) => void
  audit: (action: string, detail: string, actor?: AuditEntry["actor"]) => void
  logEvent: (e: Omit<AnalyticsEvent, "id" | "at">) => void
  clearEvents: () => void
  addProfessionalNote: (author: string, text: string) => void
  setMemberPermission: (profileId: string, key: MemberPermission, value: boolean | "requested") => void
  removeMember: (profileId: string) => void
  addInvite: (relation: HouseholdInvite["relation"]) => HouseholdInvite
  cancelInvite: (id: string) => void
  saveHabitReview: (r: Omit<HabitReview, "savedAt">) => void
  markChildFoodCheck: (key: string) => void
  editTwin: (id: string, text: string) => void
  setPlanBaseline: (b: PlanBaseline) => void
  dismissTrigger: (key: string) => void
  setProgressPrefs: (p: Partial<ProgressPrefs>) => void
  seed: (userId: string) => void
  reset: () => void
}

const DEFAULT_PERMS: MemberPermissions = { shared_meals: true, shopping: true, plan: false, health: false }

const EMPTY = {
  seededFor: null as string | null,
  weighIns: [] as WeighIn[],
  checkIns: [] as CheckIn[],
  mealFeedback: [] as MealFeedback[],
  weeklyFocus: null as AreaDState["weeklyFocus"],
  approvedAdjustments: [] as ApprovedAdjustment[],
  dismissedAdjustments: [] as string[],
  auditLog: [] as AuditEntry[],
  events: [] as AnalyticsEvent[],
  professionalNotes: [] as ProfessionalNote[],
  familyPermissions: {} as Record<string, MemberPermissions>,
  invites: [] as HouseholdInvite[],
  habitReviews: [] as HabitReview[],
  childFoodChecks: [] as string[],
  twinEdits: {} as Record<string, string>,
  planBaseline: null as PlanBaseline | null,
  progressPrefs: { trackingFrequency: "weekly", hideWeight: false } as ProgressPrefs,
}

export const useAreaD = create<AreaDState>()(
  persist(
    (set, get) => ({
      ...EMPTY,

      addWeighIn: (w) => set({ weighIns: [...get().weighIns.filter((x) => !(x.profileId === w.profileId && x.date === w.date)), { ...w, id: uid("wi") }].sort((a, b) => a.date.localeCompare(b.date)) }),
      removeWeighIn: (id) => set({ weighIns: get().weighIns.filter((w) => w.id !== id) }),
      upsertCheckIn: (c) => {
        const existing = get().checkIns.find((x) => x.profileId === c.profileId && x.date === c.date)
        const next = existing ? { ...existing, ...c } : { ...c, id: uid("ci") }
        set({ checkIns: [...get().checkIns.filter((x) => x !== existing), next].sort((a, b) => a.date.localeCompare(b.date)) })
      },
      addFeedback: (f) => set({ mealFeedback: [...get().mealFeedback.filter((x) => x.mealId !== f.mealId), { ...f, id: uid("fb"), createdAt: new Date().toISOString() }] }),
      setWeeklyFocus: (text) => set({ weeklyFocus: { weekStart: startOfWeek(todayISO()), text, savedAt: new Date().toISOString() } }),
      approveAdjustment: (a) => set({ approvedAdjustments: [...get().approvedAdjustments.filter((x) => x.key !== a.key), { ...a, id: uid("adj"), approvedAt: new Date().toISOString(), status: "pending_next_plan" }] }),
      undoAdjustment: (id) => set({ approvedAdjustments: get().approvedAdjustments.map((a) => (a.id === id ? { ...a, status: "undone" } : a)) }),
      dismissAdjustment: (key) => set({ dismissedAdjustments: [...get().dismissedAdjustments, key] }),
      audit: (action, detail, actor = "you") => set({ auditLog: [{ id: uid("aud"), at: new Date().toISOString(), action, detail, actor }, ...get().auditLog].slice(0, 200) }),
      logEvent: (e) => set({ events: [...get().events, { ...e, id: uid("ev"), at: new Date().toISOString() }].slice(-500) }),
      clearEvents: () => set({ events: [] }),
      addProfessionalNote: (author, text) => set({ professionalNotes: [{ id: uid("pn"), at: new Date().toISOString(), author, text }, ...get().professionalNotes] }),
      setMemberPermission: (profileId, key, value) => {
        const cur = get().familyPermissions[profileId] ?? DEFAULT_PERMS
        set({ familyPermissions: { ...get().familyPermissions, [profileId]: { ...cur, [key]: value } } })
      },
      removeMember: (profileId) => {
        const rest = { ...get().familyPermissions }
        delete rest[profileId]
        set({ familyPermissions: rest })
      },
      addInvite: (relation) => {
        const inv: HouseholdInvite = { id: uid("inv"), code: Math.random().toString(36).slice(2, 8).toUpperCase(), relation, createdAt: new Date().toISOString() }
        set({ invites: [...get().invites, inv] })
        return inv
      },
      cancelInvite: (id) => set({ invites: get().invites.filter((i) => i.id !== id) }),
      saveHabitReview: (r) => set({ habitReviews: [...get().habitReviews.filter((x) => x.weekStart !== r.weekStart), { ...r, savedAt: new Date().toISOString() }] }),
      markChildFoodCheck: (key) => set({ childFoodChecks: [...get().childFoodChecks, key] }),
      editTwin: (id, text) => set({ twinEdits: { ...get().twinEdits, [id]: text } }),
      setPlanBaseline: (b) => set({ planBaseline: b }),
      dismissTrigger: (key) => {
        const b = get().planBaseline
        if (b) set({ planBaseline: { ...b, dismissed: [...b.dismissed, key] } })
      },
      setProgressPrefs: (p) => set({ progressPrefs: { ...get().progressPrefs, ...p } }),

      seed: (userId) => {
        const today = todayISO()
        const app = useApp.getState()
        const self = app.profiles.find((p) => p.relation === "self")
        if (!self) return
        // Illustrative history so trends and insights have something to show (prototype only).
        const base = self.weightKg ?? 64
        const weighIns: WeighIn[] = [42, 35, 28, 21, 14, 7, 0].map((d, i) => ({ id: uid("wi"), profileId: self.id, date: addDays(today, -d), weightKg: Math.round((base + 0.6 - i * 0.1 + (i % 2 ? 0.2 : 0)) * 10) / 10, waistCm: i % 3 === 0 ? 78 - i * 0.2 : undefined }))
        const L: Level3[] = ["ok", "high", "ok", "low", "ok", "ok", "high", "ok", "low", "ok"]
        const checkIns: CheckIn[] = Array.from({ length: 10 }, (_, i) => ({ id: uid("ci"), profileId: self.id, date: addDays(today, -(i + 1)), energy: L[i], hunger: L[(i + 3) % 10], fullness: L[(i + 5) % 10], sleepHours: 6 + (i % 4) * 0.5, exerciseMinutes: [20, 0, 30, 15, 0, 45, 10, 0, 25, 30][i] }))
        // Recent eaten planned meals get one piece of feedback so insights have an example.
        const plan = app.plans.find((p) => p.id === app.activePlanId)
        const eaten = (plan?.meals ?? []).filter((m) => m.date < today && (m.outcome === "eaten_as_planned" || m.outcome === "eaten_modified")).slice(0, 2)
        const mealFeedback: MealFeedback[] = eaten.map((m, i) => ({ id: uid("fb"), mealId: m.id, recipeId: m.recipeId, date: m.date, mealType: m.mealType, portion: i === 0 ? "too_much" : "right", enjoyed: "yes", again: true, createdAt: `${m.date}T21:00:00` }))
        const familyPermissions: Record<string, MemberPermissions> = {}
        app.profiles.filter((p) => p.relation === "partner" || p.relation === "family").forEach((p) => (familyPermissions[p.id] = DEFAULT_PERMS))
        // A logged food for the child that isn't in the introduction tracker yet (§12.8 demo).
        const child = app.profiles.find((p) => p.type === "infant" || p.type === "child")
        if (child && !app.journal.some((e) => e.profileId === child.id)) {
          const entry: JournalEntry = {
            id: uid("entry"),
            profileId: child.id,
            mealType: "lunch",
            consumedAt: `${addDays(today, -1)}T12:30:00`,
            source: "manual",
            hasPhoto: false,
            items: [{ id: uid("it"), foodId: "mango", displayName: "Mango", grams: 30, unitLabel: "2 tbsp mashed", identificationConfidence: "high", quantityConfidence: "moderate", confirmedByUser: true }],
            hiddenIngredients: {},
            analysisStatus: "confirmed",
          }
          app.addEntry(entry)
        }
        set({ ...EMPTY, seededFor: userId, weighIns, checkIns, mealFeedback, familyPermissions, auditLog: [{ id: uid("aud"), at: new Date().toISOString(), action: "Consents recorded", detail: "Consent choices saved during onboarding", actor: "you" }] })
      },
      reset: () => set({ ...EMPTY }),
    }),
    { name: "nutriplan-prototype-progress", version: 1 },
  ),
)

// Account deletion / demo reset clears this slice too (§29.3). Signing out keeps the device's data,
// like the main store does.
if (typeof window !== "undefined") {
  useApp.subscribe((s, prev) => {
    if (prev.profiles.length && !s.profiles.length) useAreaD.getState().reset()
  })
}

/**
 * Seeds illustrative progress data once per signed-in user, and clears it when the user signs
 * out or deletes the account. Call from any screen that reads this slice.
 */
export function useAreaDSync() {
  const userId = useApp((s) => (s.onboarded ? s.user?.id ?? null : null))
  const hasUser = useApp((s) => s.profiles.length > 0)
  const seededFor = useAreaD((s) => s.seededFor)
  useEffect(() => {
    if (!hasUser && seededFor) useAreaD.getState().reset()
    else if (userId && seededFor !== userId) useAreaD.getState().seed(userId)
  }, [userId, hasUser, seededFor])
}

/**
 * Adjustments the user approved in the Weekly Review that should be applied the next time a plan
 * is generated (§17.6). Planning screens can show these as "pending for next plan" and mark them
 * applied by calling `useAreaD.getState().undoAdjustment(id)` once used.
 */
export function usePendingAdjustments(): ApprovedAdjustment[] {
  const all = useAreaD((s) => s.approvedAdjustments)
  return all.filter((a) => a.status === "pending_next_plan")
}
