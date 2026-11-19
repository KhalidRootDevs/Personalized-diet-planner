"use client"

import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Suspense, useRef, useState } from "react"
import { toast } from "sonner"
import { ArrowLeftRight, BookHeart, ChefHat, NotebookPen, Pencil, Scale, Trash2 } from "lucide-react"
import { ListGroup, ListRow, PageBody, PageHeader, Section, StickyFooter, Surface } from "@/components/app/page"
import { Segmented } from "@/components/app/controls"
import { FeatureBadge, PremiumGate, useFeature } from "@/components/app/badges"
import { Button } from "@/components/ui/button"
import { RecipeHero } from "@/components/recipes/detail/recipe-hero"
import { QuickFacts, RecipeChips } from "@/components/recipes/detail/recipe-meta"
import { AllergenPanel } from "@/components/recipes/detail/allergen-panel"
import { HealthFits } from "@/components/recipes/detail/health-fits"
import { FeedingPanel, NutritionPanel, NutritionSnapshot } from "@/components/recipes/detail/nutrition-panel"
import { IngredientsPanel } from "@/components/recipes/detail/ingredients-panel"
import { StepsPanel } from "@/components/recipes/detail/steps-panel"
import { AboutPanel } from "@/components/recipes/detail/about-panel"
import { AddToPlan, VariationFlow } from "@/components/recipes/detail/plan-actions"
import { MoreLikeThis } from "@/components/recipes/detail/more-like-this"
import { useActiveProfile, useApp, useSelfProfile } from "@/lib/store"
import { FOOD_MAP } from "@/lib/data/foods"
import { variationBlockedReason } from "@/lib/planning"
import { hardConstraintViolation, recipeAllergens, recipeCostPerServing, recipeNutrition } from "@/lib/nutrition"
import { recipeHealthFits } from "@/lib/recipe-bank"
import { uid } from "@/lib/date"
import { useRecipeLookup } from "@/lib/area-c-utils"
import type { Recipe } from "@/lib/types"

type Tab = "ingredients" | "steps" | "nutrition" | "about"

/**
 * Recipe screen (§9.1, §15.1): photo hero, key facts, allergen and profile safety checks (§13.6),
 * health fits with their rules (§42.11), then Ingredients | Steps | Nutrition | About.
 * Serving scaling (§15.2) and swaps (§8.4) always recalculate through the nutrition engine.
 * Infant and child recipes never show calories (§12).
 */
export default function RecipePage() {
  return (
    <Suspense fallback={null}>
      <RecipeScreen />
    </Suspense>
  )
}

function RecipeScreen() {
  const { id } = useParams<{ id: string }>()
  const mealId = useSearchParams().get("meal")
  const router = useRouter()
  const lookup = useRecipeLookup()
  const profile = useActiveProfile()
  const self = useSelfProfile()
  const removeUserRecipe = useApp((s) => s.removeUserRecipe)
  const saveRecipe = useApp((s) => s.upsertUserRecipe)
  const userRecipes = useApp((s) => s.userRecipes)
  const library = useFeature("recipe_library")
  const recipe = lookup(id)
  const [servings, setServings] = useState<number | null>(null)
  const [subs, setSubs] = useState<Record<number, string>>({})
  const [tab, setTab] = useState<Tab>("ingredients")
  const tabsRef = useRef<HTMLDivElement>(null)

  if (!recipe) {
    return (
      <>
        <PageHeader title="Recipe" back="/recipes" />
        <PageBody>
          <p className="text-callout text-muted-foreground">This recipe isn&apos;t available.</p>
        </PageBody>
      </>
    )
  }

  const s = servings ?? recipe.servings
  const variant: Recipe = {
    ...recipe,
    ingredients: recipe.ingredients.map((i, idx) => (subs[idx] ? { ...i, foodId: subs[idx], note: `instead of ${FOOD_MAP[i.foodId]?.name.toLowerCase() ?? i.foodId}` } : i)),
  }
  const changed = Object.keys(subs).length > 0
  const original = recipeNutrition(recipe)
  const perServing = recipeNutrition(variant)
  const conflict = profile ? hardConstraintViolation(variant, profile) : null
  const allergens = recipeAllergens(variant)
  const cost = recipeCostPerServing(variant)
  const adult = recipe.profile === "adult"
  const fits = recipeHealthFits(variant)
  const canAdd = adult && (recipe.reviewStatus === "approved" || recipe.reviewStatus === "personal") && !conflict
  const savedCopy = userRecipes.find((r) => r.basedOnId === recipe.id && !r.aiVariation)
  const canSave = adult && recipe.reviewStatus === "approved"
  const subsParam = Object.entries(subs)
    .map(([k, v]) => `${k}:${v}`)
    .join(",")
  const cookHref = `/recipes/${recipe.id}/cook?servings=${s}${subsParam ? `&subs=${encodeURIComponent(subsParam)}` : ""}`

  const saveVersion = (r: Recipe, message: string) => {
    saveRecipe(r)
    toast(message, { description: "Saved as your recipe · not reviewed." })
    router.push(`/recipes/${r.id}`)
  }
  const saveMyVersion = () => saveVersion({ ...variant, id: uid("ur"), name: `${recipe.name} (my version)`, reviewStatus: "personal", basedOnId: recipe.id, source: "You · adapted from a reviewed recipe", aiVariation: undefined }, "Your version is saved")
  const bookmark = () => {
    if (savedCopy) return router.push(`/recipes/${savedCopy.id}`)
    if (!library.allowed) return router.push("/subscription?feature=recipe_library")
    const copy: Recipe = { ...recipe, id: uid("ur"), reviewStatus: "personal", basedOnId: recipe.id, source: "Saved from a reviewed NutriPlan recipe" }
    saveRecipe(copy)
    toast("Saved to your library", { description: "Your copy is marked as not reviewed.", action: { label: "Open", onClick: () => router.push(`/recipes/${copy.id}`) } })
  }
  const showTab = (t: Tab) => {
    setTab(t)
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    requestAnimationFrame(() => tabsRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }))
  }

  const cookButton = (primary: boolean) => (
    <Button size="lg" variant={primary ? "default" : "secondary"} className={primary ? "w-full" : "shrink-0 px-5"} onClick={() => router.push(cookHref)}>
      <ChefHat className="size-5" /> {primary ? "Start cooking" : "Cook"}
    </Button>
  )

  return (
    <>
      <RecipeHero recipe={recipe} saved={canSave ? !!savedCopy : null} onSave={bookmark}>
        <h1 className="text-display">{recipe.name}</h1>
        {recipe.nameBn && (
          <p className="text-body mt-0.5 text-muted-foreground" lang="bn">
            {recipe.nameBn}
          </p>
        )}
        <p className="text-body mt-3">{recipe.description}</p>
        <div className="mt-4">
          <RecipeChips recipe={recipe} />
        </div>
      </RecipeHero>

      <PageBody className="pt-5">
        {recipe.notes && (
          <Surface tone="sage" className="text-callout">
            <p className="font-semibold">My notes</p>
            <p className="mt-0.5 whitespace-pre-line">{recipe.notes}</p>
          </Surface>
        )}

        <QuickFacts recipe={recipe} cost={cost} />

        <AllergenPanel allergens={allergens} conflict={conflict} profile={profile} />

        <HealthFits fits={fits} />

        {adult && <NutritionSnapshot n={perServing} onMore={() => showTab("nutrition")} />}

        <div className="space-y-5">
          <div ref={tabsRef} className="sticky top-0 z-10 -mx-[var(--gutter)] scroll-mt-0 bg-background/95 px-gutter pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 backdrop-blur-md">
            <Segmented<Tab>
              label="Recipe sections"
              value={tab}
              onChange={setTab}
              options={[
                { value: "ingredients", label: "Ingredients" },
                { value: "steps", label: "Steps" },
                { value: "nutrition", label: adult ? "Nutrition" : "Feeding" },
                { value: "about", label: "About" },
              ]}
            />
          </div>
          <div role="tabpanel" aria-label={tab}>
            {tab === "ingredients" && (
              <IngredientsPanel recipe={recipe} variant={variant} servings={s} onServings={setServings} subs={subs} onSubs={setSubs} profile={profile} blocked={!!conflict} onSaveVersion={saveMyVersion} costPerServing={cost} />
            )}
            {tab === "steps" && <StepsPanel recipe={recipe} cookHref={cookHref} />}
            {tab === "nutrition" && (adult ? <NutritionPanel recipe={variant} perServing={perServing} original={original} changed={changed} /> : <FeedingPanel recipe={recipe} />)}
            {tab === "about" && <AboutPanel recipe={recipe} />}
          </div>
        </div>

        {!conflict && (
          <Section title="More actions">
            <ListGroup>
              <ListRow href={`/log/new?recipe=${recipe.id}`} icon={<NotebookPen />} iconTone="lime" title={adult ? "I ate this" : "Record what they ate"} description="Add it to the food journal, then confirm the portion" />
              {adult && <ListRow href={`/recipes/compare?a=${recipe.id}`} icon={<Scale />} iconTone="sky" title="Compare with another meal" description="Side-by-side nutrition and cost estimates" />}
              {canSave && !changed && (
                <ListRow onClick={bookmark} icon={<BookHeart />} iconTone="terracotta" title={savedCopy ? "Open my saved copy" : "Save to my library"} description={library.allowed ? "Keep a copy you can edit and add notes to" : "Included in Premium · see plans"} />
              )}
              {recipe.reviewStatus === "personal" && <ListRow href={`/recipes/new?edit=${recipe.id}`} icon={<Pencil />} iconTone="sage" title="Edit recipe" />}
              {recipe.reviewStatus === "personal" && (
                <ListRow
                  onClick={() => {
                    removeUserRecipe(recipe.id)
                    toast("Recipe deleted")
                    router.replace("/recipes/library")
                  }}
                  icon={<Trash2 />}
                  iconTone="muted"
                  title="Delete recipe"
                  chevron={false}
                />
              )}
            </ListGroup>
          </Section>
        )}

        {adult && recipe.reviewStatus === "approved" && (
          <Section title="Suggest a variation" badge={<FeatureBadge feature="ai_recipe_variations" />} description="An AI proposes a change; our nutrition engine checks it against your rules and recalculates it.">
            <PremiumGate feature="ai_recipe_variations" compact>
              <VariationFlow recipe={recipe} blocked={variationBlockedReason(profile, self)} onSave={(r) => saveVersion(r, "Variation saved to your library")} />
            </PremiumGate>
          </Section>
        )}

        <MoreLikeThis recipe={recipe} profile={profile} />
      </PageBody>

      <StickyFooter>
        {conflict ? (
          <p className="text-caption py-1 text-center text-muted-foreground">Not available for {profile?.name}&apos;s plan. See the alert above.</p>
        ) : mealId && adult ? (
          <div className="flex gap-2">
            {cookButton(false)}
            <Button size="lg" className="flex-1" onClick={() => router.push(`/plan/meal/${mealId}?view=swap`)}>
              <ArrowLeftRight className="size-5" /> Replace this meal
            </Button>
          </div>
        ) : canAdd ? (
          <div className="flex gap-2">
            {cookButton(false)}
            <AddToPlan recipe={changed ? null : recipe} className="flex-1" />
          </div>
        ) : (
          cookButton(true)
        )}
      </StickyFooter>
    </>
  )
}
