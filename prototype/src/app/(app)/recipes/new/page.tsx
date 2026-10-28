"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"
import { PageBody, PageHeader, Section, StatTile, Surface } from "@/components/app/page"
import { FeatureBadge, PremiumGate } from "@/components/app/badges"
import { EstimateNote } from "@/components/app/nutrition"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useApp } from "@/lib/store"
import { FOODS, FOOD_MAP } from "@/lib/data/foods"
import { recipeNutrition } from "@/lib/nutrition"
import { uid } from "@/lib/date"
import type { MealType, Recipe, RecipeIngredient } from "@/lib/types"

const TYPES: { id: MealType; label: string }[] = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "afternoon_snack", label: "Snack" },
]

/** Add a personal recipe (§42.5). Nutrition is computed from ingredients; status is always "personal". */
export default function NewRecipePage() {
  return (
    <>
      <PageHeader title="New recipe" back="/recipes/library" action={<FeatureBadge feature="recipe_library" />} />
      <PageBody>
        <PremiumGate feature="recipe_library">
          <RecipeForm />
        </PremiumGate>
      </PageBody>
    </>
  )
}

function RecipeForm() {
  const router = useRouter()
  const save = useApp((s) => s.upsertUserRecipe)
  const [name, setName] = useState("")
  const [servings, setServings] = useState("2")
  const [mealType, setMealType] = useState<MealType>("dinner")
  const [minutes, setMinutes] = useState("30")
  const [steps, setSteps] = useState("")
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([{ foodId: "rice_cooked", grams: 300 }])

  const draft: Recipe = {
    id: uid("ur"),
    name: name.trim() || "My recipe",
    nameBn: "",
    description: "Added by you",
    mealTypes: [mealType],
    profile: "adult",
    prepMinutes: Math.round(Number(minutes) / 3) || 0,
    cookMinutes: Number(minutes) - (Math.round(Number(minutes) / 3) || 0) || 0,
    servings: Math.max(1, Number(servings) || 1),
    difficulty: "easy",
    ingredients: ingredients.filter((i) => i.grams > 0),
    steps: steps.split("\n").map((s) => s.trim()).filter(Boolean),
    safetyNotes: [],
    tags: [],
    reviewStatus: "personal",
    swatch: "ivory",
    icon: "CookingPot",
  }
  const n = recipeNutrition(draft)

  return (
    <div className="space-y-7">
      <Section title="Basics">
        <Surface className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Recipe name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ammu's shorshe ilish" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="sv">Servings</Label>
              <Input id="sv" inputMode="numeric" value={servings} onChange={(e) => setServings(e.target.value.replace(/\D/g, ""))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mn">Minutes</Label>
              <Input id="mn" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ""))} />
            </div>
            <div className="space-y-1.5">
              <Label>Meal</Label>
              <Select value={mealType} onValueChange={(v) => setMealType(v as MealType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Surface>
      </Section>

      <Section title="Ingredients" description="Amounts for the whole recipe. Choose raw or cooked — the values differ a lot (e.g. dry vs cooked rice).">
        <Surface className="space-y-3">
          {ingredients.map((ing, idx) => (
            <div key={idx} className="flex items-end gap-2">
              <div className="min-w-0 flex-1 space-y-1">
                <Select value={ing.foodId} onValueChange={(v) => setIngredients(ingredients.map((x, i) => (i === idx ? { ...x, foodId: v } : x)))}>
                  <SelectTrigger className="w-full" aria-label="Ingredient">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FOODS.filter((f) => f.id !== "breast_milk").map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                className="w-20"
                inputMode="numeric"
                aria-label="Grams"
                value={ing.grams || ""}
                onChange={(e) => setIngredients(ingredients.map((x, i) => (i === idx ? { ...x, grams: Number(e.target.value.replace(/\D/g, "")) } : x)))}
              />
              <span className="text-callout pb-3.5 text-muted-foreground">g</span>
              <button className="mb-1 grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted" aria-label="Remove ingredient" onClick={() => setIngredients(ingredients.filter((_, i) => i !== idx))}>
                <Trash2 className="size-[18px]" />
              </button>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={() => setIngredients([...ingredients, { foodId: "dal_cooked", grams: 100 }])}>
            <Plus className="size-4" /> Add ingredient
          </Button>
        </Surface>
      </Section>

      <Section title="Steps">
        <Textarea rows={4} value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="One step per line" aria-label="Steps" />
      </Section>

      <Section title="Calculated per serving">
        <div className="grid grid-cols-2 gap-2">
          <StatTile label="Energy" value={`~${Math.round(n.energyKcal)}`} unit="kcal" />
          <StatTile label="Protein" value={`~${Math.round(n.proteinG)}`} unit="g" />
          <StatTile label="Carbohydrate" value={`~${Math.round(n.carbsG)}`} unit="g" />
          <StatTile label="Fat" value={`~${Math.round(n.fatG)}`} unit="g" />
        </div>
        <EstimateNote>
          Calculated from {draft.ingredients.map((i) => FOOD_MAP[i.foodId]?.name).filter(Boolean).length} ingredients in our food database. Your recipe is saved as &quot;not reviewed&quot;.
        </EstimateNote>
      </Section>

      <Button
        size="lg"
        className="w-full"
        disabled={!name.trim() || draft.ingredients.length === 0}
        onClick={() => {
          save(draft)
          toast("Recipe saved to your library")
          router.replace(`/recipes/${draft.id}`)
        }}
      >
        Save recipe
      </Button>
    </div>
  )
}
