"use client"

import { Section } from "@/components/app/page"
import { RecipeCard } from "@/components/recipes/bank/recipe-card"
import { RECIPES } from "@/lib/data/recipes"
import { browseRecipes, recipeCuisine } from "@/lib/recipe-bank"
import type { Profile, Recipe } from "@/lib/types"

/**
 * "More like this" rail: same cuisine or a shared meal type, already filtered by the active
 * profile's hard constraints through browseRecipes (never re-includes an excluded recipe).
 */
export function MoreLikeThis({ recipe, profile }: { recipe: Recipe; profile: Profile | undefined }) {
  const { results } = browseRecipes(RECIPES, {}, profile)
  const cuisine = recipeCuisine(recipe)
  const childRecipe = recipe.profile !== "adult"
  const score = (r: Recipe) => (recipeCuisine(r) === cuisine ? 2 : 0) + (r.mealTypes.some((t) => recipe.mealTypes.includes(t)) ? 1 : 0)
  const list = results
    .filter((r) => r.id !== recipe.id && (r.profile !== "adult") === childRecipe && score(r) > 0)
    .sort((a, b) => score(b) - score(a))
    .slice(0, 8)
  if (list.length === 0) return null
  return (
    <Section title="More like this">
      <div className="-mx-[var(--gutter)] px-gutter flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none]">
        {list.map((r) => (
          <RecipeCard key={r.id} recipe={r} variant="rail" />
        ))}
      </div>
    </Section>
  )
}
