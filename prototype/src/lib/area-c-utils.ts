"use client"

// Helpers for the Plan and Recipes areas.
import { RECIPE_MAP } from "@/lib/data/recipes"
import { useApp } from "@/lib/store"
import type { MealOutcome, PlannedMeal, Recipe } from "@/lib/types"

/** Looks up a library recipe, falling back to the user's personal recipes (§42.5). */
export function useRecipeLookup() {
  const userRecipes = useApp((s) => s.userRecipes)
  return (id: string): Recipe | undefined => RECIPE_MAP[id] ?? userRecipes.find((r) => r.id === id)
}

export function friendlyGrams(g: number): string {
  if (g >= 1000) return `${(Math.round(g / 100) / 10).toLocaleString("en-US")} kg`
  return `${Math.round(g)} g`
}

/** Status label for a planned meal (§14.6) — planned vs eaten must read clearly. */
export function mealStatus(meal: PlannedMeal): { label: string; tone: "planned" | "eaten" | "changed" | "skipped" | "unknown" } {
  const map: Record<Exclude<MealOutcome, null>, { label: string; tone: "planned" | "eaten" | "changed" | "skipped" | "unknown" }> = {
    eaten_as_planned: { label: "Eaten", tone: "eaten" },
    eaten_modified: { label: "Eaten, changed", tone: "changed" },
    replaced: { label: "Replaced", tone: "changed" },
    skipped: { label: "Skipped", tone: "skipped" },
    unresolved: { label: "Not recorded", tone: "unknown" },
  }
  if (meal.outcome) return map[meal.outcome]
  if (meal.scheduleStatus === "rescheduled") return { label: "Planned · moved", tone: "planned" }
  return { label: "Planned", tone: "planned" }
}

export const STATUS_STYLE: Record<string, string> = {
  planned: "border border-dashed border-input text-muted-foreground",
  eaten: "bg-sage text-forest",
  changed: "bg-amber-tint text-amber-text",
  skipped: "bg-muted text-muted-foreground",
  unknown: "bg-muted text-muted-foreground",
}
