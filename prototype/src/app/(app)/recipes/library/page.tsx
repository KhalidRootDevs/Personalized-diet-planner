"use client"

import Link from "next/link"
import { BookHeart, ChevronRight, Plus } from "lucide-react"
import { EmptyState, ListGroup, PageBody, PageHeader, Pill } from "@/components/app/page"
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
          <div className="space-y-5">
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
                <ListGroup>
                  {recipes.map((r) => (
                    <Link key={r.id} href={`/recipes/${r.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
                      <RecipeThumb recipe={r} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-body line-clamp-2 font-medium">{r.name}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <Pill className="h-[22px] px-2 text-[11px]">Not reviewed</Pill>
                          <span className="tabular text-caption text-muted-foreground">
                            ~{Math.round(recipeNutrition(r).energyKcal)} kcal · serves {r.servings}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="size-[18px] shrink-0 text-muted-grey" aria-hidden />
                    </Link>
                  ))}
                </ListGroup>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/recipes/new">
                    <Plus className="size-4" /> Add another recipe
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
