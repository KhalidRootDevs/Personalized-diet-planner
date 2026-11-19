"use client"

// Consent enforcement helpers (§5.10, §29, FR-041). Withdrawing a consent turns off the features
// that depend on it; manual logging and safety features always keep working.
import { useApp } from "@/lib/store"
import type { ConsentRecord } from "@/lib/types"

export type ConsentType = ConsentRecord["type"]

export function consentGranted(consents: ConsentRecord[], type: ConsentType): boolean {
  return consents.find((c) => c.type === type)?.granted ?? false
}

/**
 * `true` while the user has granted this consent.
 * - `health_data`: needed for plan generation and personal targets.
 * - `ai_processing`: needed for photo/text AI analysis (manual logging still works without it).
 * - `food_photos`: needed to store meal photos.
 * - `child_data`: needed to edit child profiles (read-only without it).
 * - `analytics`: product analytics events.
 */
export function useConsent(type: ConsentType): boolean {
  return useApp((s) => consentGranted(s.consents, type))
}

export const CONSENT_LABEL: Record<ConsentType, string> = {
  health_data: "Health information",
  food_photos: "Food photos",
  child_data: "Child information",
  ai_processing: "AI processing",
  analytics: "Product analytics",
}
