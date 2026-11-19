"use client"

import { useParams, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { PageBody, PageHeader } from "@/components/app/page"
import { CookMode } from "@/components/recipes/detail/cook-mode"
import { useRecipeLookup } from "@/lib/area-c-utils"
import { FOOD_MAP } from "@/lib/data/foods"

/** Cook mode route (§15.1): /recipes/[id]/cook?servings=3&subs=0:foodId. No tab bar (focus layout). */
export default function CookPage() {
  return (
    <Suspense fallback={null}>
      <CookScreen />
    </Suspense>
  )
}

function CookScreen() {
  const { id } = useParams<{ id: string }>()
  const params = useSearchParams()
  const recipe = useRecipeLookup()(id)
  if (!recipe || recipe.steps.length === 0)
    return (
      <>
        <PageHeader title="Cook mode" back={`/recipes/${id}`} />
        <PageBody>
          <p className="text-callout text-muted-foreground">This recipe has no steps to cook.</p>
        </PageBody>
      </>
    )
  const n = Number(params.get("servings"))
  const servings = Number.isInteger(n) && n >= 1 && n <= 12 ? n : recipe.servings
  // Swaps chosen on the recipe screen, e.g. "0:brown_rice,2:tofu". Only known foods for existing rows are used.
  const subs: Record<number, string> = {}
  for (const part of (params.get("subs") ?? "").split(",")) {
    const [k, v] = part.split(":")
    const idx = Number(k)
    if (v && FOOD_MAP[v] && Number.isInteger(idx) && idx >= 0 && idx < recipe.ingredients.length) subs[idx] = v
  }
  return <CookMode recipe={recipe} servings={servings} subs={subs} />
}
