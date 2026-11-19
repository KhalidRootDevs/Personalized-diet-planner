"use client"

import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { toast } from "sonner"
import { ArrowLeftRight, BadgeCheck, BookHeart, CalendarPlus, ChefHat, Clock, CookingPot, Flame, Hourglass, NotebookPen, Pencil, Refrigerator, Scale, Trash2, Wallet, Wand2 } from "lucide-react"
import { BackButton, IconTile, ListGroup, ListRow, PageBody, PageHeader, Pill, Section, StatTile, Surface, type IconTone } from "@/components/app/page"
import { FoodTile } from "@/components/log/food-tile"
import { cn } from "@/lib/utils"
import { ChoiceCard, Stepper } from "@/components/app/controls"
import { RecipeThumb } from "@/components/app/recipe-thumb"
import { FeatureBadge, PremiumGate, useFeature } from "@/components/app/badges"
import { CautionNote, InfoNote, SafetyAlert } from "@/components/app/alerts"
import { EstimateNote } from "@/components/app/nutrition"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useActivePlan, useActiveProfile, useApp, useSelfProfile } from "@/lib/store"
import { FOOD_MAP, ALLERGEN_LABELS } from "@/lib/data/foods"
import { MEAL_LABEL, VARIATION_LABEL, ingredientAlternatives, mockProposeVariation, validateVariation, variationBlockedReason, type VariationKind, type VariationResult } from "@/lib/planning"
import { fmt, recipeAllergens, recipeCostPerServing, recipeNutrition, violatesHardConstraints } from "@/lib/nutrition"
import { formatDay, todayISO, uid } from "@/lib/date"
import { friendlyGrams, recipeEquipment, recipeReheating, recipeSource, revalidateAfterChange, useRecipeLookup } from "@/lib/area-c-utils"
import type { Nutrients, Recipe } from "@/lib/types"

/** Recipe screen (§9.1, §15.1) with serving scaling (§15.2), ingredient alternatives (§8.4) and allergen checks (§13.6). */
export default function RecipePage() {
  return (
    <Suspense fallback={null}>
      <RecipeScreen />
    </Suspense>
  )
}

function signed(n: number, unit: string, digits = 0) {
  const v = Number(n.toFixed(digits))
  if (v === 0) return `±0 ${unit}`
  return `${v > 0 ? "+" : "−"}${Math.abs(v)} ${unit}`
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
  const library = useFeature("recipe_library")
  const recipe = lookup(id)
  const [servings, setServings] = useState<number | null>(null)
  const [subs, setSubs] = useState<Record<number, string>>({})
  const [swapping, setSwapping] = useState<number | null>(null)

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
  const total = recipeNutrition(variant, s)
  const factor = s / recipe.servings
  const conflict = profile ? violatesHardConstraints(variant, profile) : null
  const allergens = recipeAllergens(variant)
  const cost = recipeCostPerServing(variant)
  const adult = recipe.profile === "adult"
  const partial = (k: "ironMg" | "calciumMg") => variant.ingredients.some((i) => FOOD_MAP[i.foodId]?.per100g[k] === undefined)
  const reheating = recipeReheating(recipe)

  const canAdd = adult && (recipe.reviewStatus === "approved" || recipe.reviewStatus === "personal") && !conflict

  const saveVersion = (r: Recipe, message: string) => {
    saveRecipe(r)
    toast(message, { description: "Saved as your recipe · not reviewed." })
    router.push(`/recipes/${r.id}`)
  }

  return (
    <>
      <div className="relative">
        <RecipeThumb recipe={recipe} size="hero" className="h-[300px] rounded-none" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <BackButton onClick={() => router.back()} />
          <ReviewBadge recipe={recipe} />
        </div>
      </div>
      <PageBody className="relative -mt-8 rounded-t-[28px] bg-background pt-6">
        <div className="space-y-4">
          <div>
            <h1 className="text-display">{recipe.name}</h1>
            {recipe.nameBn && (
              <p className="text-body mt-0.5 text-muted-foreground" lang="bn">
                {recipe.nameBn}
              </p>
            )}
            <p className="text-body mt-3">{recipe.description}</p>
            <p className="text-caption mt-2 text-muted-foreground">Source: {recipeSource(recipe)}</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <InfoTile icon={<Clock />} tone="sky" label="Prep" value={`${recipe.prepMinutes} min`} />
            <InfoTile icon={<Flame />} tone="terracotta" label="Cook" value={`${recipe.cookMinutes} min`} />
            <InfoTile icon={<ChefHat />} tone="amber" label="Level" value={<span className="capitalize">{recipe.difficulty}</span>} />
            <InfoTile icon={<Wallet />} tone="lime" label="Cost est." value={`${fmt.bdt(cost)}`} />
          </div>
          <p className="text-caption text-muted-foreground">
            Serves {recipe.servings} · cost is per serving, an estimate from typical local prices{recipe.costPerServingBdt ? " (your own estimate)" : ""}.
          </p>
          {(recipe.texture || recipe.minAgeMonths || (recipe.reviewStatus === "personal" && recipe.tags.length > 0)) && (
            <div className="flex flex-wrap gap-1.5">
              {recipe.texture && <Pill>{recipe.texture}</Pill>}
              {recipe.minAgeMonths && <Pill tone="sage">From {recipe.minAgeMonths} months</Pill>}
              {recipe.reviewStatus === "personal" && recipe.tags.map((t) => <Pill key={t}>{t}</Pill>)}
            </div>
          )}
        </div>

        {conflict && (
          <SafetyAlert title={`Not suitable for ${profile?.name}`}>
            {conflict} This recipe can&apos;t be added to their plan.
          </SafetyAlert>
        )}

        {allergens.length > 0 && (
          <div className="text-callout flex flex-wrap items-center gap-1.5">
            <span className="mr-1 font-medium">Contains</span>
            {allergens.map((a) => (
              <Pill key={a} tone="terracotta">
                {ALLERGEN_LABELS[a] ?? a}
              </Pill>
            ))}
          </div>
        )}

        {!conflict && (
          <div className="space-y-2">
            {mealId && adult ? (
              <Button size="lg" className="w-full" onClick={() => router.push(`/plan/meal/${mealId}?view=swap`)}>
                <ArrowLeftRight className="size-5" /> Replace this meal
              </Button>
            ) : (
              canAdd && <AddToPlan recipe={changed ? null : recipe} />
            )}
            <Button variant="outline" className="w-full" onClick={() => router.push(`/log/new?recipe=${recipe.id}`)}>
              <NotebookPen className="size-4" /> I ate this
            </Button>
            {adult && (
              <Button asChild variant="ghost" className="w-full">
                <Link href={`/recipes/compare?a=${recipe.id}`}>
                  <Scale className="size-4" /> Compare with another meal
                </Link>
              </Button>
            )}
          </div>
        )}

        {recipe.notes && (
          <Surface tone="sage" className="text-callout">
            <p className="font-semibold">My notes</p>
            <p className="mt-0.5 whitespace-pre-line">{recipe.notes}</p>
          </Surface>
        )}

        <Section title="Nutrition per serving">
          <Surface padding="lg">
            <p className="text-caption text-muted-foreground">Energy · estimate</p>
            <p className="tabular mt-1 text-[30px] leading-none font-bold tracking-tight">
              ~{Math.round(perServing.energyKcal)}
              <span className="text-callout ml-1 font-medium tracking-normal text-muted-foreground">kcal</span>
            </p>
            <MacroSplit protein={perServing.proteinG} carbs={perServing.carbsG} fat={perServing.fatG} />
            <div className="mt-4 grid grid-cols-3 gap-2">
              <StatTile label="Fiber" value={`~${Math.round(perServing.fiberG)}`} unit="g" />
              <StatTile label="Iron" value={`~${(perServing.ironMg ?? 0).toFixed(1)}`} unit="mg" hint={partial("ironMg") ? "partial data" : undefined} />
              <StatTile label="Calcium" value={`~${Math.round(perServing.calciumMg ?? 0)}`} unit="mg" hint={partial("calciumMg") ? "partial data" : undefined} />
            </div>
            <p className="text-caption mt-3 text-muted-foreground">Bars show each nutrient&apos;s share of the energy. &quot;Partial data&quot; means some ingredients have no value for that nutrient yet, so the real amount may be higher.</p>
          </Surface>
          {changed && <SubstitutionNote before={original} after={perServing} />}
          <EstimateNote>Calculated from each ingredient&apos;s cooked or raw weight in our food database. Changing ingredients recalculates these values.</EstimateNote>
        </Section>

        <Section title="Ingredients" description={adult ? "Tap Swap to see alternatives that fit your rules. Nutrition is recalculated — swaps are never assumed equivalent." : undefined}>
          <ListGroup>
            <ListRow
              title="Servings"
              description={`Whole recipe ~${fmt.kcal(total.energyKcal)} · about ${fmt.bdt(cost * s)}`}
              trailing={<Stepper label="servings" value={s} decDisabled={s <= 1} incDisabled={s >= 12} onDec={() => setServings(s - 1)} onInc={() => setServings(s + 1)} />}
            />
            {variant.ingredients.map((i, idx) => {
              const f = FOOD_MAP[i.foodId]
              const grams = i.grams * factor
              const unit = f?.units.find((u) => u.grams > 0 && Math.abs(grams / u.grams - Math.round(grams / u.grams)) < 0.15 && grams / u.grams >= 1)
              const alts = adult && profile ? ingredientAlternatives(recipe.ingredients[idx].foodId, profile) : []
              return (
                <div key={`${idx}-${i.foodId}`} className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <FoodTile foodId={i.foodId} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-body">{f?.name ?? i.foodId}</p>
                      <p className="text-caption text-muted-foreground">
                        {f && <span className="capitalize">{f.state}</span>}
                        {i.note && ` · ${i.note}`}
                      </p>
                    </div>
                    <div className="tabular shrink-0 text-right">
                      <p className="text-callout font-semibold">{friendlyGrams(grams)}</p>
                      {unit && (
                        <p className="text-caption text-muted-foreground">
                          ≈ {Math.round(grams / unit.grams)} × {unit.label.replace(/^1 /, "")}
                        </p>
                      )}
                    </div>
                    {alts.length > 0 && (
                      <Button size="sm" variant="ghost" aria-expanded={swapping === idx} onClick={() => setSwapping(swapping === idx ? null : idx)}>
                        Swap
                      </Button>
                    )}
                  </div>
                  {swapping === idx && (
                    <div className="mt-2 flex flex-wrap gap-1.5 pl-12">
                      {alts.map((a) => (
                        <button
                          key={a}
                          className={cn("h-9 rounded-full px-3 text-sm font-medium shadow-card", subs[idx] === a ? "bg-lime text-charcoal" : "bg-card")}
                          onClick={() => {
                            setSubs({ ...subs, [idx]: a })
                            setSwapping(null)
                          }}
                        >
                          {FOOD_MAP[a]?.name}
                        </button>
                      ))}
                      {subs[idx] && (
                        <button
                          className="h-9 rounded-full px-3 text-sm font-medium text-forest"
                          onClick={() => {
                            const next = { ...subs }
                            delete next[idx]
                            setSubs(next)
                            setSwapping(null)
                          }}
                        >
                          Undo swap
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </ListGroup>
          {s !== recipe.servings && <p className="text-caption px-1 text-muted-foreground">Scaled from {recipe.servings} servings. Cooking times and seasoning may not scale exactly.</p>}
          {changed && (
            <PremiumGate feature="recipe_library" variant="row">
              <Button variant="secondary" className="w-full" onClick={() => saveVersion({ ...variant, id: uid("ur"), name: `${recipe.name} (my version)`, reviewStatus: "personal", basedOnId: recipe.id, source: "You · adapted from a reviewed recipe", aiVariation: undefined }, "Your version is saved")}>
                <BookHeart className="size-4" /> Save my version to my library
              </Button>
            </PremiumGate>
          )}
        </Section>

        <Section title="Equipment">
          <div className="flex flex-wrap gap-1.5">
            {recipeEquipment(recipe).map((e) => (
              <Pill key={e} icon={<CookingPot />}>
                {e}
              </Pill>
            ))}
          </div>
        </Section>

        <Section title="Steps">
          <ol className="space-y-4">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-3.5 rounded-2xl bg-card p-3.5 shadow-card">
                <span className="tabular text-callout grid size-8 shrink-0 place-items-center rounded-full bg-lime font-bold text-charcoal">{i + 1}</span>
                <p className="text-body pt-0.5">{step}</p>
              </li>
            ))}
          </ol>
        </Section>

        {(recipe.safetyNotes.length > 0 || recipe.storage || reheating) && (
          <Section title="Safety, storage and reheating">
            {recipe.safetyNotes.length > 0 && (
              <CautionNote title="Food safety">
                <ul className="list-disc space-y-0.5 pl-4">
                  {recipe.safetyNotes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </CautionNote>
            )}
            {(recipe.storage || reheating) && (
              <Surface className="text-callout space-y-2 bg-sky-tint shadow-none">
                {recipe.storage && (
                  <p className="flex gap-3">
                    <Refrigerator className="mt-0.5 size-5 shrink-0 text-sky-text" />
                    <span>
                      <strong className="font-semibold">Storage:</strong> {recipe.storage}
                    </span>
                  </p>
                )}
                {reheating && (
                  <p className="flex gap-3">
                    <Flame className="mt-0.5 size-5 shrink-0 text-sky-text" />
                    <span>
                      <strong className="font-semibold">Reheating:</strong> {reheating}
                    </span>
                  </p>
                )}
              </Surface>
            )}
          </Section>
        )}

        {adult && recipe.reviewStatus === "approved" && (
          <Section title="Suggest a variation" badge={<FeatureBadge feature="ai_recipe_variations" />}>
            <PremiumGate feature="ai_recipe_variations" compact>
              <VariationFlow recipe={recipe} blocked={variationBlockedReason(profile, self)} onSave={(r) => saveVersion(r, "Variation saved to your library")} />
            </PremiumGate>
          </Section>
        )}

        {recipe.reviewStatus === "approved" && adult && library.allowed && !changed && (
          <Button variant="outline" className="w-full" onClick={() => saveVersion({ ...recipe, id: uid("ur"), reviewStatus: "personal", basedOnId: recipe.id, source: "Saved from a reviewed NutriPlan recipe", name: recipe.name }, "Saved to your library")}>
            <BookHeart className="size-4" /> Save to my library
          </Button>
        )}

        {recipe.reviewStatus === "personal" && (
          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="outline">
              <Link href={`/recipes/new?edit=${recipe.id}`}>
                <Pencil className="size-4" /> Edit
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => {
                removeUserRecipe(recipe.id)
                toast("Recipe deleted")
                router.replace("/recipes/library")
              }}
            >
              <Trash2 className="size-4" /> Delete
            </Button>
          </div>
        )}
      </PageBody>
    </>
  )
}

function SubstitutionNote({ before, after }: { before: Nutrients; after: Nutrients }) {
  return (
    <InfoNote title="Recalculated after your swap">
      Per serving: energy {signed(after.energyKcal - before.energyKcal, "kcal")}, protein {signed(after.proteinG - before.proteinG, "g")}, fat {signed(after.fatG - before.fatG, "g")}, fiber {signed(after.fiberG - before.fiberG, "g")}, iron {signed((after.ironMg ?? 0) - (before.ironMg ?? 0), "mg", 1)}.
    </InfoNote>
  )
}

/** AI-assisted variation (§9.3 Approach B): a mock model proposes structured changes; the engine validates them. */
function VariationFlow({ recipe, blocked, onSave }: { recipe: Recipe; blocked: string | null; onSave: (r: Recipe) => void }) {
  const profile = useActiveProfile()
  const [kind, setKind] = useState<VariationKind | null>(null)
  const [result, setResult] = useState<VariationResult | null>(null)
  if (blocked) return <InfoNote>{blocked}</InfoNote>
  if (!profile) return null
  return (
    <div className="space-y-3">
      <div className="space-y-2" role="radiogroup" aria-label="Variation">
        {(Object.keys(VARIATION_LABEL) as VariationKind[]).map((k) => (
          <ChoiceCard
            key={k}
            selected={kind === k}
            onSelect={() => {
              setKind(k)
              setResult(null)
            }}
            icon={<Wand2 />}
            title={VARIATION_LABEL[k].title}
            description={VARIATION_LABEL[k].hint}
          />
        ))}
      </div>
      <Button variant="secondary" className="w-full" disabled={!kind} onClick={() => kind && setResult(validateVariation(mockProposeVariation(recipe, kind), recipe, profile))}>
        Suggest a variation
      </Button>
      {result && !result.ok && <CautionNote title="Not shown">{result.reason}</CautionNote>}
      {result && result.ok && (
        <Surface className="space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <Pill tone="caution">AI suggestion · not reviewed</Pill>
            <Pill tone="sage" icon={<BadgeCheck />}>
              Passed your safety rules
            </Pill>
          </div>
          <p className="text-body font-semibold">{result.recipe.name}</p>
          <p className="text-callout text-muted-foreground">{result.rationale}</p>
          <p className="tabular text-callout">
            Per serving: {signed(result.delta.energyKcal, "kcal")} · protein {signed(result.delta.proteinG, "g")} · fat {signed(result.delta.fatG, "g")} · fiber {signed(result.delta.fiberG, "g")}
          </p>
          <EstimateNote>The AI only proposed the change. Our nutrition engine checked allergens, diet and quantities and recalculated nutrition from the food database.</EstimateNote>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => onSave(result.recipe)}>Save to library</Button>
            <Button variant="outline" onClick={() => setResult(null)}>
              Discard
            </Button>
          </div>
        </Surface>
      )}
    </div>
  )
}

function ReviewBadge({ recipe }: { recipe: Recipe }) {
  if (recipe.reviewStatus === "approved")
    return (
      <Pill tone="sage" icon={<BadgeCheck />}>
        Verified recipe
      </Pill>
    )
  if (recipe.reviewStatus === "pending")
    return (
      <Pill tone="caution" icon={<Hourglass />}>
        Awaiting clinical review
      </Pill>
    )
  return <Pill className="bg-card">{recipe.aiVariation ? "AI variation · not reviewed" : "Your recipe · not reviewed"}</Pill>
}

function AddToPlan({ recipe }: { recipe: Recipe | null }) {
  const plan = useActivePlan()
  const replaceMeal = useApp((s) => s.replaceMeal)
  const [open, setOpen] = useState(false)
  const [mealId, setMealId] = useState<string | null>(null)
  const lookup = useRecipeLookup()
  if (!recipe)
    return (
      <Button size="lg" className="w-full" disabled>
        <CalendarPlus className="size-5" /> Save your version first to add it
      </Button>
    )
  const slots = (plan?.meals ?? []).filter((m) => m.date >= todayISO() && !m.outcome && recipe.mealTypes.some((t) => t === m.mealType || (t.includes("snack") && m.mealType.includes("snack")))).slice(0, 10)
  const personal = recipe.reviewStatus === "personal"

  return (
    <>
      <Button size="lg" className="w-full" onClick={() => setOpen(true)} disabled={!plan}>
        <CalendarPlus className="size-5" /> Add to plan
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to your plan</DialogTitle>
            <DialogDescription>Choose a meal to replace. Daily totals, checks and your shopping list are recalculated.</DialogDescription>
          </DialogHeader>
          {personal && <InfoNote>It passed your allergy and diet checks. It will show as &quot;Your recipe · not reviewed&quot; in your plan.</InfoNote>}
          {slots.length === 0 ? (
            <InfoNote>No upcoming {recipe.mealTypes.map((t) => MEAL_LABEL[t].toLowerCase()).join(" or ")} slots in your active plan.</InfoNote>
          ) : (
            <ul className="-mx-1 max-h-72 space-y-2 overflow-y-auto px-1">
              {slots.map((m) => (
                <li key={m.id}>
                  <ChoiceCard className="min-h-0 py-3" selected={mealId === m.id} onSelect={() => setMealId(m.id)} title={`${formatDay(m.date)} · ${MEAL_LABEL[m.mealType]}`} description={`Currently: ${lookup(m.recipeId)?.name ?? "—"}`} />
                </li>
              ))}
            </ul>
          )}
          <DialogFooter>
            <Button
              className="w-full"
              disabled={!mealId}
              onClick={() => {
                if (!mealId) return
                replaceMeal(mealId, recipe.id)
                const check = revalidateAfterChange(mealId)
                toast(`${recipe.name} added to your plan`, { description: check?.summary })
                setOpen(false)
              }}
            >
              Replace meal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function InfoTile({ icon, tone, label, value }: { icon: React.ReactNode; tone: IconTone; label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-card px-1.5 py-3 text-center shadow-card">
      <IconTile tone={tone} size="sm">
        {icon}
      </IconTile>
      <p className="text-caption mt-1.5 text-muted-foreground">{label}</p>
      <p className="tabular text-callout font-semibold">{value}</p>
    </div>
  )
}

/** Share of energy from each macronutrient (protein and carbs 4 kcal/g, fat 9 kcal/g). */
function MacroSplit({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const kcal = protein * 4 + carbs * 4 + fat * 9 || 1
  const rows = [
    { label: "Protein", g: protein, share: (protein * 4) / kcal, fill: "bg-protein" },
    { label: "Carbs", g: carbs, share: (carbs * 4) / kcal, fill: "bg-carbs" },
    { label: "Fat", g: fat, share: (fat * 9) / kcal, fill: "bg-fat" },
  ]
  return (
    <div className="mt-4 grid grid-cols-3 gap-3">
      {rows.map((r) => (
        <div key={r.label} role="img" aria-label={`${r.label}: about ${Math.round(r.g)} grams, ${Math.round(r.share * 100)}% of energy`}>
          <p className="text-caption font-medium">{r.label}</p>
          <div className="mt-1.5 h-2 rounded-full bg-muted">
            <div className={cn("h-full rounded-full", r.fill)} style={{ width: `${Math.max(4, r.share * 100)}%` }} />
          </div>
          <p className="tabular text-callout mt-1.5 font-semibold">
            ~{Math.round(r.g)} g <span className="text-caption font-normal text-muted-foreground">· {Math.round(r.share * 100)}%</span>
          </p>
        </div>
      ))}
    </div>
  )
}
