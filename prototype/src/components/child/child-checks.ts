// Deterministic checks for child profiles: foods logged in the journal that aren't in the
// introduction tracker yet (§12.8), and growth patterns that deserve a clinical conversation (§12.7).
// Neither check diagnoses anything.
import { addDays, todayISO } from "@/lib/date"
import type { GrowthRecord, IntroducedFood, JournalEntry } from "@/lib/types"

const STOP = new Set(["mashed", "cooked", "boiled", "soft", "smooth", "puree", "purée", "well", "with", "and", "home", "fresh", "plain", "raw", "chopped", "pieces", "piece", "the", "small", "family"])

export function nameWords(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[()]/g, " ")
    .split(/[^a-zÀ-ɏ]+/)
    .filter((w) => w.length >= 3 && !STOP.has(w))
}

export function isKnownFood(name: string, introduced: IntroducedFood[]): boolean {
  const words = nameWords(name)
  return introduced.some((f) => {
    const t = nameWords(f.foodName)
    return words.some((w) => t.includes(w))
  })
}

export interface NewFoodCandidate {
  key: string
  name: string
  date: string
  foodId: string
}

/** Logged items for this child in the last 14 days that don't match a tracker entry. */
export function newFoodCandidates(journal: JournalEntry[], introduced: IntroducedFood[], childId: string, checked: string[]): NewFoodCandidate[] {
  const since = addDays(todayISO(), -14)
  const mine = introduced.filter((f) => f.profileId === childId)
  const seen = new Set<string>()
  const out: NewFoodCandidate[] = []
  for (const e of journal) {
    if (e.profileId !== childId || e.consumedAt.slice(0, 10) < since) continue
    for (const i of e.items) {
      const key = `${e.id}:${i.id}`
      if (checked.includes(key) || i.foodId === "breast_milk" || isKnownFood(i.displayName, mine) || seen.has(i.foodId)) continue
      seen.add(i.foodId)
      out.push({ key, name: i.displayName, date: e.consumedAt.slice(0, 10), foodId: i.foodId })
    }
  }
  return out
}

/**
 * A growth pattern worth discussing with a clinician (§12.7, §42.10 D). Home measurements may be
 * inaccurate, so the wording invites a check rather than interpreting the result.
 */
export function growthReviewPrompt(records: GrowthRecord[]): string | null {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date))
  const weights = sorted.filter((r) => typeof r.weightKg === "number")
  for (let i = 1; i < weights.length; i++) {
    if (weights[i].weightKg! < weights[i - 1].weightKg! - 0.2) return "A recorded weight was lower than the one before it."
  }
  const lengths = sorted.filter((r) => typeof r.lengthCm === "number")
  for (let i = 1; i < lengths.length; i++) {
    if (lengths[i].lengthCm! < lengths[i - 1].lengthCm! - 0.5) return "A recorded length or height was lower than the one before it, which is often a measuring difference."
  }
  if (weights.length >= 2) {
    const a = weights[weights.length - 2]
    const b = weights[weights.length - 1]
    const daysApart = (new Date(b.date).getTime() - new Date(a.date).getTime()) / 86400000
    if (daysApart >= 60 && Math.abs(b.weightKg! - a.weightKg!) < 0.1) return "Weight stayed about the same across two measurements more than two months apart."
  }
  return null
}
