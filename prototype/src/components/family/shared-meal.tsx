"use client"

// Shared family meal: pick a planned meal and see per-member serving guidance (§42.9, FR-025).
import { useEffect, useState } from "react"
import { useActivePlan, useApp } from "@/lib/store"
import { useAreaD } from "@/lib/area-d-store"
import { useRecipeLookup } from "@/lib/area-c-utils"
import { MEAL_LABEL } from "@/lib/planning"
import { formatDay, todayISO } from "@/lib/date"
import { track } from "@/lib/analytics"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SafetyAlert } from "@/components/app/alerts"
import { Pill, Surface, type PillTone } from "@/components/app/page"
import { RecipeThumb } from "@/components/app/recipe-thumb"
import { ProfileAvatar } from "@/components/app/profile-switcher"
import { Field } from "@/components/app/controls"
import { servingGuidance, type MemberGuidance } from "./serving-guidance"

const STATUS: Record<MemberGuidance["status"], { label: string; tone: PillTone }> = {
  ok: { label: "Shares the meal", tone: "sage" },
  adapt: { label: "Adapted", tone: "neutral" },
  not_suitable: { label: "Not suitable", tone: "safety" },
  not_applicable: { label: "Not this meal", tone: "outline" },
}

export function SharedMeal() {
  const plan = useActivePlan()
  const profiles = useApp((s) => s.profiles)
  const perms = useAreaD((s) => s.familyPermissions)
  const lookup = useRecipeLookup()
  const today = todayISO()
  const upcoming = (plan?.meals ?? []).filter((m) => m.date >= today && ["lunch", "dinner"].includes(m.mealType)).slice(0, 8)
  const [mealId, setMealId] = useState<string>(upcoming[0]?.id ?? "")
  const meal = upcoming.find((m) => m.id === mealId) ?? upcoming[0]
  const recipe = meal ? lookup(meal.recipeId) : undefined

  useEffect(() => {
    if (meal) track("shared_meal_viewed", { members: profiles.length })
  }, [meal, profiles.length])

  if (!meal || !recipe) return <p className="text-callout text-muted-foreground">No upcoming lunches or dinners in your active plan.</p>

  // Adults appear only when they've agreed to shared meals; children are always managed by you.
  const members = profiles.filter((p) => p.relation === "self" || p.relation === "child" || (perms[p.id]?.shared_meals ?? true))
  const guidance = members.map((m) => servingGuidance(recipe, m, { canSeeHealth: m.relation === "self" || m.relation === "child" || perms[m.id]?.health === true, servings: meal.servings }))
  const flagged = guidance.filter((g) => g.status === "not_suitable")

  return (
    <div className="space-y-3">
      <Field label="Planned meal">
        <Select value={meal.id} onValueChange={setMealId}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {upcoming.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {formatDay(m.date, { weekday: "short", day: "numeric", month: "short" })} · {MEAL_LABEL[m.mealType]} · {lookup(m.recipeId)?.name ?? "Meal"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Surface>
        <div className="flex items-center gap-3">
          <RecipeThumb recipe={recipe} size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-body font-semibold">{recipe.name}</p>
            <p className="text-caption text-muted-foreground">One pot for {members.length} {members.length === 1 ? "person" : "people"}, served differently</p>
          </div>
        </div>
      </Surface>

      {flagged.length > 0 && (
        <SafetyAlert title={`Not suitable for ${flagged.map((g) => g.profile.name).join(" and ")}`}>
          Their serving needs a separate option. Allergy protection always applies to everyone at the table.
        </SafetyAlert>
      )}

      <ul className="space-y-2.5">
        {guidance.map((g) => (
          <li key={g.profile.id} className="rounded-2xl bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <ProfileAvatar profile={g.profile} />
              <div className="min-w-0 flex-1">
                <p className="text-body font-medium">{g.profile.relation === "self" ? `${g.profile.name} (you)` : g.profile.name}</p>
                <p className="text-caption text-muted-foreground">{g.headline}</p>
              </div>
              <Pill tone={STATUS[g.status].tone}>{STATUS[g.status].label}</Pill>
            </div>
            {(g.safety.length > 0 || g.notes.length > 0) && (
              <ul className="text-caption mt-3 space-y-1.5 border-t border-border/70 pt-3">
                {g.safety.map((s) => (
                  <li key={s} className="font-medium text-safety">
                    {s}
                  </li>
                ))}
                {g.notes.map((n) => (
                  <li key={n} className="text-muted-foreground">
                    {n}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
