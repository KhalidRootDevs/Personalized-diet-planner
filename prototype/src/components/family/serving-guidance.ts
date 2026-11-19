// Per-member serving guidance for one shared family meal (§42.9, FR-025). Deterministic.
// A baby never gets a smaller adult portion: infants and young children get age-appropriate
// texture, preparation and responsive-feeding notes instead (§12.5, §42.9 rules).
import { FOOD_MAP, ALLERGEN_LABELS } from "@/lib/data/foods"
import { ageInMonths, recipeAllergens, recipeNutrition } from "@/lib/nutrition"
import type { Profile, Recipe } from "@/lib/types"
import { feedingStage } from "@/components/child/feeding"

export interface MemberGuidance {
  profile: Profile
  status: "ok" | "adapt" | "not_suitable" | "not_applicable"
  headline: string
  notes: string[]
  safety: string[]
}

export function servingGuidance(recipe: Recipe, member: Profile, opts: { canSeeHealth: boolean; servings?: number }): MemberGuidance {
  const allergenHits = recipeAllergens(recipe).filter((a) => member.allergies.includes(a))
  const safety: string[] = []
  if (allergenHits.length) {
    safety.push(
      opts.canSeeHealth
        ? `Contains ${allergenHits.map((a) => ALLERGEN_LABELS[a] ?? a).join(", ")}, recorded as an allergy for ${member.name}.`
        : `Conflicts with a food restriction ${member.name} has shared with the household.`,
    )
  }

  if (member.type === "adult") {
    const veg = member.diet.includes("vegetarian") && recipe.ingredients.some((i) => ["fish", "meat"].includes(FOOD_MAP[i.foodId]?.category ?? ""))
    if (veg) safety.push(`Not vegetarian — ${member.name} follows a vegetarian diet.`)
    if (safety.length) return { profile: member, status: "not_suitable", headline: "Choose a separate option", notes: ["Use a swap that passes their restrictions; it's recalculated, not assumed equal."], safety }
    const kcal = Math.round(recipeNutrition(recipe, 1).energyKcal)
    const notes = [`About ${kcal.toLocaleString("en-US")} kcal per serving (estimate).`]
    if (member.goal === "build_muscle" || member.goal === "gain_weight") notes.push("Add an extra bowl of dal or an egg for more protein, if they like.")
    else notes.push("Extra vegetables or salad on the side if still hungry.")
    return { profile: member, status: "ok", headline: `${opts.servings && opts.servings > 1 && member.relation === "self" ? opts.servings : 1} adult serving`, notes, safety }
  }

  const months = ageInMonths(member.dateOfBirth)
  const stage = feedingStage(months)
  if (months < 6) return { profile: member, status: "not_applicable", headline: "Milk feeds only", notes: ["Not part of this meal — breast milk or formula meets their needs at this age."], safety }

  const unsafe: string[] = []
  const prep: string[] = []
  for (const i of recipe.ingredients) {
    const f = FOOD_MAP[i.foodId]
    if (!f) continue
    if (f.infantSafeFromMonths !== undefined && months < f.infantSafeFromMonths) unsafe.push(`Leave out ${f.name.toLowerCase()} — not suitable before ${f.infantSafeFromMonths} months.`)
    else if (f.chokingRisk) unsafe.push(`Leave out ${f.name.toLowerCase()} in its usual form (choking risk); ask your clinician about a safe form.`)
    if (f.category === "fish") prep.push("Flake the fish and remove every bone.")
    if (f.category === "drink" && f.id !== "breast_milk" && months < 24) unsafe.push(`Skip ${f.name.toLowerCase()} for this age.`)
  }
  safety.push(...unsafe)
  if (allergenHits.length) return { profile: member, status: "not_suitable", headline: "Not suitable — offer a separate option", notes: ["Ask your clinician before offering a food linked to a recorded reaction."], safety }

  const notes = [
    "Set aside their portion before adding salt, chilli or whole spices.",
    `Texture: ${stage.textures.toLowerCase()}.`,
    ...Array.from(new Set(prep)),
    stage.baby
      ? "Offer a few spoonfuls and follow hunger and fullness cues. This isn't a smaller adult portion — babies need different textures, no added salt, and their milk feeds continue."
      : "A child-sized plate, following their appetite. Offer more if they're still hungry — there's no amount they must finish.",
  ]
  return { profile: member, status: "adapt", headline: stage.baby ? "Adapted baby portion" : "Child-sized, adapted", notes, safety }
}
