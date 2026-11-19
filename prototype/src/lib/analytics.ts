"use client"

// Product analytics (§31, §42.26). Events go to a local log only, never include personal or
// health details, and are recorded only while the "Product analytics" consent is on (§29).
import { useApp } from "@/lib/store"
import { useAreaD } from "@/lib/area-d-store"

export type EventName =
  | "progress_viewed"
  | "weekly_review_viewed"
  | "weekly_focus_saved"
  | "adjustment_approved"
  | "adjustment_undone"
  | "meal_feedback_saved"
  | "weigh_in_recorded"
  | "check_in_saved"
  | "habit_review_saved"
  | "insights_viewed"
  | "coach_question"
  | "coach_escalation"
  | "coach_emergency_route"
  | "emergency_guidance_viewed"
  | "data_exported"
  | "consent_changed"
  | "family_member_added"
  | "shared_meal_viewed"
  | "professional_report_opened"
  | "child_food_added"
  | "plan_review_suggested"

type PropValue = string | number | boolean

const MAX_STRING = 32
// Free text, names, emails and long strings are dropped so no PII reaches the event log.
function clean(props: Record<string, PropValue> = {}): Record<string, PropValue> {
  const out: Record<string, PropValue> = {}
  for (const [k, v] of Object.entries(props)) {
    if (typeof v === "string") {
      if (v.length > MAX_STRING || v.includes("@") || /\s/.test(v)) continue
      out[k] = v
    } else if (typeof v === "number" && Number.isFinite(v)) out[k] = v
    else if (typeof v === "boolean") out[k] = v
  }
  return out
}

export function analyticsAllowed(): boolean {
  return useApp.getState().consents.find((c) => c.type === "analytics")?.granted ?? false
}

/** Append an event to the local log. Props must be enums, counts or flags — never names or free text. */
export function track(name: EventName, props?: Record<string, PropValue>): void {
  if (typeof window === "undefined" || !analyticsAllowed()) return
  useAreaD.getState().logEvent({ name, props: clean(props) })
}
