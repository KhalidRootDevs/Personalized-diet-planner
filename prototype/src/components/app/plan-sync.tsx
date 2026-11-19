"use client"

/**
 * Background sync for the prototype (no backend): derives meal status (§14.6) and due reminders
 * (§26) on load and once a minute, and deducts pantry stock when a planned meal is marked eaten
 * as planned (§42.8.2). Undoing the outcome puts the stock back.
 */
import { useEffect } from "react"
import { toast } from "sonner"
import { useApp } from "@/lib/store"
import { runReminders } from "@/lib/reminders"
import { applyPantryDelta, mealPantryUse } from "@/lib/shopping"
import { RECIPE_MAP } from "@/lib/data/recipes"
import { FOOD_MAP } from "@/lib/data/foods"

export function PlanSync() {
  const hydrated = useApp((s) => s.hydrated)
  const onboarded = useApp((s) => s.onboarded)

  useEffect(() => {
    if (!hydrated || !onboarded) return
    runReminders()
    const t = setInterval(() => runReminders(), 60_000)
    return () => clearInterval(t)
  }, [hydrated, onboarded])

  useEffect(() => {
    if (!hydrated) return
    return useApp.subscribe((s, prev) => {
      if (s.plans === prev.plans) return
      const before = new Map(prev.plans.flatMap((p) => p.meals).map((m) => [m.id, m.outcome]))
      for (const m of s.plans.flatMap((p) => p.meals)) {
        const was = before.get(m.id)
        if (was === m.outcome) continue
        const state = useApp.getState()
        const deducted = state.pantryDeducted?.[m.id]
        if (m.outcome === "eaten_as_planned" && !deducted) {
          const recipe = RECIPE_MAP[m.recipeId] ?? state.userRecipes.find((r) => r.id === m.recipeId)
          if (!recipe) continue
          const use = mealPantryUse(m, recipe, state.pantry)
          if (!use.length) continue
          state.setPantryDeduction(m.id, use, applyPantryDelta(state.pantry, use, -1))
          toast("Pantry updated", { description: `Used ${use.map((u) => `~${u.grams} g ${FOOD_MAP[u.foodId]?.name.toLowerCase() ?? u.foodId}`).join(", ")}.` })
        } else if (m.outcome !== "eaten_as_planned" && deducted) {
          state.setPantryDeduction(m.id, null, applyPantryDelta(state.pantry, deducted, 1))
        }
      }
    })
  }, [hydrated])

  return null
}
