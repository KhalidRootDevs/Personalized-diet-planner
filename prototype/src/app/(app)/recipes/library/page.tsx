"use client"

import Link from "next/link"
import { BookHeart, Plus } from "lucide-react"
import { EmptyState, PageBody, PageHeader } from "@/components/app/page"
import { FeatureBadge, PremiumGate } from "@/components/app/badges"
import { InfoNote } from "@/components/app/alerts"
import { RecipeThumb } from "@/components/app/recipe-thumb"
import { Button } from "@/components/ui/button"
import { useApp } from "@/lib/store"
import { recipeNutrition } from "@/lib/nutrition"

/** Personal Recipe Library (§42.5): user recipes get calculated nutrition but are never "reviewed". */
export default function LibraryPage() {
  const recipes = useApp((s) => s.userRecipes)
  return (
    <>
      <PageHeader title="My recipe library" back="/recipes" action={<FeatureBadge feature="recipe_library" />} />
      <PageBody>
        <PremiumGate feature="recipe_library">
          <div className="space-y-4">
            {recipes.length === 0 ? (
              <EmptyState
                icon={<BookHeart />}
                title="No recipes yet"
                description="Add your family's dishes. We calculate nutrition from the ingredients you enter."
                action={
                  <Button asChild>
                    <Link href="/recipes/new">Add a recipe</Link>
                  </Button>
                }
              />
            ) : (
              <>
                <ul className="space-y-2">
                  {recipes.map((r) => (
                    <li key={r.id}>
                      <Link href={`/recipes/${r.id}`} className="flex items-center gap-3 rounded-2xl border bg-card p-3">
                        <RecipeThumb recipe={r} size="md" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{r.name}</p>
                          <p className="tabular text-xs text-muted-foreground">
                            ~{Math.round(recipeNutrition(r).energyKcal)} kcal per serving · {r.servings} servings
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/recipes/new">
                    <Plus /> Add another recipe
                  </Link>
                </Button>
              </>
            )}
            <InfoNote>Your recipes can be logged as meals. They aren&apos;t professionally reviewed, so meal plans keep using verified recipes.</InfoNote>
          </div>
        </PremiumGate>
      </PageBody>
    </>
  )
}
