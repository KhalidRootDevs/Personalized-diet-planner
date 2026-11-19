"use client"

import { useState } from "react"
import { Camera, ChevronDown, CookingPot, ImagePlus, Plus } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CautionNote, InfoNote, SafetyAlert } from "@/components/app/alerts"
import { PillGroup, Stepper } from "@/components/app/controls"
import { MacroTiles } from "@/components/log/macro-tiles"
import { EstimateNote } from "@/components/app/nutrition"
import { ItemEditor } from "@/components/log/item-editor"
import { FoodPickerSheet } from "@/components/log/food-picker"
import { PhotoPlaceholder } from "@/components/log/entry-card"
import { StickyAction } from "@/components/log/input-steps"
import { RecipeThumb } from "@/components/app/recipe-thumb"
import { ListGroup, ListRow, Section, Surface } from "@/components/app/page"
import { ALLERGEN_LABELS, FOOD_MAP } from "@/lib/data/foods"
import { RECIPES } from "@/lib/data/recipes"
import { MEAL_LABEL } from "@/lib/planning"
import { formatTime, todayISO } from "@/lib/date"
import { entryUncertainty, recipeNutrition, violatesHardConstraints } from "@/lib/nutrition"
import {
  allergenHits,
  entryNutritionFull,
  familyOf,
  hiddenAllergenHits,
  hiddenQuestions,
  infantFlags,
  itemFromFood,
  itemsFromRecipe,
  MAIN_INGREDIENTS,
  MEAL_ORDER,
  mixedDishItem,
  type HiddenKey,
} from "@/lib/area-b-log"
import { useRecipeLookup } from "@/lib/area-c-utils"
import { useApp } from "@/lib/store"
import type { JournalEntry, JournalItem, MealType, PlannedMeal, Profile, Recipe } from "@/lib/types"

export type Oil = NonNullable<JournalEntry["hiddenIngredients"]["oil"]>
export type Hidden = Omit<JournalEntry["hiddenIngredients"], "oil"> & { oil?: Oil | "unsure" }
export interface ChildInfo {
  texture: string
  accepted: "yes" | "somewhat" | "no"
  reaction: string
  firstTime: boolean
}

export const TEXTURES = ["Smooth purée", "Mashed", "Soft lumps", "Soft finger food", "Chopped family food"]

const OIL: { value: Oil | "unsure"; label: string }[] = [
  { value: "none", label: "None" },
  { value: "little", label: "A little" },
  { value: "moderate", label: "Moderate" },
  { value: "lots", label: "A lot" },
  { value: "unsure", label: "Not sure" },
]
const YES_NO: { value: "yes" | "no"; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
]

export function toStoredHidden(h: Hidden): JournalEntry["hiddenIngredients"] {
  return { ...h, oil: h.oil === "unsure" ? "moderate" : h.oil }
}

/**
 * Confirmation step (§41.2 Step 3, §41.3.4). Nothing is saved until the user confirms; nutrition is
 * then computed by the engine from the food DB. Hidden-ingredient questions appear only when they
 * could materially change the estimate, and at most two up front (§41.3.3).
 */
export function ReviewStep({
  profile,
  source,
  photos,
  hasPhoto,
  onAddPhoto,
  items,
  setItems,
  hidden,
  setHidden,
  mealType,
  setMealType,
  linkedMealId,
  setLinkedMealId,
  openMeals,
  date,
  setDate,
  time,
  setTime,
  saveAsUsual,
  setSaveAsUsual,
  child,
  setChild,
  recipeCtx,
  onUseRecipe,
  context,
  onConfirm,
}: {
  profile: Profile
  source: JournalEntry["source"]
  photos: string[]
  hasPhoto: boolean
  onAddPhoto?: (mode: "camera" | "gallery") => void
  items: JournalItem[]
  setItems: (i: JournalItem[]) => void
  hidden: Hidden
  setHidden: (h: Hidden) => void
  mealType: MealType
  setMealType: (m: MealType) => void
  linkedMealId: string
  setLinkedMealId: (id: string) => void
  openMeals: PlannedMeal[]
  date: string
  setDate: (d: string) => void
  time: string
  setTime: (t: string) => void
  saveAsUsual: boolean
  setSaveAsUsual: (v: boolean) => void
  child: ChildInfo
  setChild: (c: ChildInfo) => void
  recipeCtx?: { recipe: Recipe; servings: number; setServings: (n: number) => void }
  onUseRecipe: (recipe: Recipe) => void
  context?: string
  onConfirm: () => void
}) {
  const lookup = useRecipeLookup()
  const userRecipes = useApp((s) => s.userRecipes)
  const [activePhoto, setActivePhoto] = useState(0)
  const [showMore, setShowMore] = useState(false)
  const [main, setMain] = useState<string>()
  const isChild = profile.type !== "adult"
  const aiProposed = source === "photo" || source === "text" || source === "voice" || source === "restaurant"
  const questions: HiddenKey[] = !isChild && aiProposed ? hiddenQuestions(items) : []
  const upFront = questions.slice(0, 2)
  const later = questions.slice(2)
  const hits = allergenHits(items, profile)
  const hiddenHits = hiddenAllergenHits(toStoredHidden(hidden), profile)
  const allergenNames = Array.from(new Set([...hits.map((h) => h.allergen), ...hiddenHits].map((a) => ALLERGEN_LABELS[a] ?? a)))
  const infant = isChild ? items.map((i) => ({ i, flag: infantFlags(i.foodId, profile) })).filter((x) => x.flag) : []
  const mixed = !isChild && aiProposed ? mixedDishItem(items) : undefined
  const mixedIsCurry = !!mixed && FOOD_MAP[mixed.foodId]?.category !== "mixed_dish"
  const linked = openMeals.find((m) => m.id === linkedMealId)

  // Recipes that match the mixed dish (§41.3.3: "select a recipe from the database").
  const family = main ? MAIN_INGREDIENTS.find((m) => m.id === main)?.category : mixed ? familyOf(mixed.foodId) : undefined
  const matching =
    mixed && family
      ? [...RECIPES, ...userRecipes]
          .filter((r) => r.profile === "adult" && r.ingredients.some((i) => familyOf(i.foodId) === family || FOOD_MAP[i.foodId]?.category === family))
          .filter((r) => !violatesHardConstraints(r, profile))
          .slice(0, 3)
      : []

  const draft: JournalEntry = {
    id: "draft",
    profileId: profile.id,
    mealType,
    consumedAt: "",
    source,
    hasPhoto,
    items,
    hiddenIngredients: toStoredHidden(hidden),
    analysisStatus: "pending_confirmation",
  }
  const n = entryNutritionFull(draft)
  const unanswered = upFront.filter((q) => hidden[q] === undefined).length
  const u = entryUncertainty(draft) + (hidden.oil === "unsure" ? 0.05 : 0) + unanswered * 0.03 + (mixed && mixedIsCurry && !main ? 0.05 : 0)
  const shownPhoto = photos[Math.min(activePhoto, photos.length - 1)]

  const question = (q: HiddenKey) => {
    if (q === "oil")
      return (
        <Section key={q} title="How much oil or ghee was used?" description={source === "restaurant" ? "Restaurant cooking often uses more oil than home cooking. A photo can't show it." : "A photo can't show oil, and it can change the estimate a lot."}>
          <PillGroup label="Oil or ghee" options={OIL} value={hidden.oil} onChange={(oil) => setHidden({ ...hidden, oil })} />
        </Section>
      )
    const yn = (label: string, description: string, key: Exclude<HiddenKey, "oil">) => (
      <Section key={q} title={label} description={description}>
        <PillGroup label={label} options={YES_NO} value={hidden[key] === undefined ? undefined : hidden[key] ? "yes" : "no"} onChange={(v) => setHidden({ ...hidden, [key]: v === "yes" })} />
      </Section>
    )
    if (q === "coconutMilk") return yn("Was coconut milk or cream added?", "It isn't visible in a photo but adds noticeable energy.", "coconutMilk")
    if (q === "butter") return yn("Butter or ghee on your roti or paratha?", "Spread butter or ghee can't be seen in a photo.", "butter")
    if (q === "sugar") return yn("Was sugar added?", "For tea, doi, milk or oats. A photo can't show sugar.", "sugar")
    return yn("Any sauce, ketchup or dressing?", "Only if you had some on the side or on top.", "sauce")
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-gutter flex-1 space-y-7 pt-3 pb-8">
        {hasPhoto && (
          <Surface padding="none" className="overflow-hidden">
            <div className="relative">
              <PhotoPlaceholder src={shownPhoto} className="h-48 w-full rounded-none" />
              <span className="text-caption absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-card/95 px-2.5 py-1 font-semibold">
                {items.length} food{items.length === 1 ? "" : "s"} suggested · estimate
              </span>
            </div>
            <div className="p-4">
              <p className="text-headline">Check what we found</p>
              <p className="text-caption mt-0.5 text-muted-foreground">Suggestions from your photo. Fix anything that&apos;s wrong.</p>
              <div className="mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
                {photos.map((p, i) => (
                  <button key={i} type="button" onClick={() => setActivePhoto(i)} aria-label={`Show photo ${i + 1}`} aria-pressed={i === activePhoto} className="shrink-0 rounded-xl">
                    <PhotoPlaceholder src={p} className={`size-14 ${i === activePhoto ? "ring-2 ring-lime" : ""}`} />
                  </button>
                ))}
                {onAddPhoto && photos.length < 4 && (
                  <>
                    <button type="button" onClick={() => onAddPhoto("camera")} className="text-caption grid size-14 shrink-0 place-items-center rounded-xl border border-dashed border-input font-medium text-forest" aria-label="Take another angle">
                      <Camera className="size-5" aria-hidden />
                    </button>
                    <button type="button" onClick={() => onAddPhoto("gallery")} className="text-caption grid size-14 shrink-0 place-items-center rounded-xl border border-dashed border-input font-medium text-forest" aria-label="Add a photo from your gallery">
                      <ImagePlus className="size-5" aria-hidden />
                    </button>
                  </>
                )}
              </div>
              {onAddPhoto && <p className="text-caption mt-1.5 text-muted-foreground">Another angle can help you check portions. Photos stay private.</p>}
            </div>
          </Surface>
        )}
        {!hasPhoto && (source === "text" || source === "voice") && <InfoNote title="Check what we found">We matched your words to foods in our database. Fix anything that&apos;s wrong.</InfoNote>}
        {context && <InfoNote>{context}</InfoNote>}

        {recipeCtx && (
          <Surface>
            <div className="flex items-center gap-3">
              <RecipeThumb recipe={recipeCtx.recipe} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-caption text-muted-foreground">From a recipe{recipeCtx.recipe.reviewStatus === "personal" ? " · your own, not reviewed" : ""}</p>
                <p className="text-body font-medium">{recipeCtx.recipe.name}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/70 pt-3">
              <span className="text-callout">Servings you ate</span>
              <Stepper
                label="servings"
                value={recipeCtx.servings}
                onDec={() => recipeCtx.setServings(Math.max(0.5, recipeCtx.servings - 0.5))}
                onInc={() => recipeCtx.setServings(recipeCtx.servings + 0.5)}
                decDisabled={recipeCtx.servings <= 0.5}
              />
            </div>
            <p className="text-caption mt-2 text-muted-foreground">Ingredients are scaled from the recipe. Adjust any item below if your portion was different.</p>
          </Surface>
        )}

        {(allergenNames.length > 0 || infant.length > 0) && (
          <div className="space-y-3">
            {allergenNames.length > 0 && (
              <SafetyAlert title={`Contains ${allergenNames.join(", ")}`} emergency>
                {[...hits.map((h) => h.item.displayName), ...(hiddenHits.includes("milk") ? ["Butter or ghee"] : []), ...(hiddenHits.includes("mustard") ? ["Cooking oil (if mustard oil)"] : [])].join(", ")} may contain an allergen recorded in {isChild ? `${profile.name}'s` : "your"} profile. You can still record it. If there are signs of a reaction, get help now.
              </SafetyAlert>
            )}
            {infant.length > 0 && (
              <SafetyAlert title="Check this food for your baby's age">
                <ul className="list-disc pl-4">
                  {infant.map(({ i, flag }) => (
                    <li key={i.id}>
                      {i.displayName}: {flag}
                    </li>
                  ))}
                </ul>
              </SafetyAlert>
            )}
          </div>
        )}

        <Section title={`Foods (${items.length})`} description={aiProposed ? "Food and portion confidence are shown separately and stay visible after you confirm." : undefined}>
          <div className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-card shadow-card">
            {items.map((it, idx) => (
              <ItemEditor
                key={it.id}
                variant="row"
                item={it}
                profile={profile}
                showConfidence={aiProposed}
                hideNutrition={isChild}
                onChange={(next) => setItems(items.map((x, j) => (j === idx ? next : x)))}
                onRemove={() => setItems(items.filter((_, j) => j !== idx))}
              />
            ))}
            <FoodPickerSheet
              profile={profile}
              onPick={(id) => setItems([...items, { ...itemFromFood(id), confirmedByUser: true }])}
              trigger={
                <button type="button" className="text-callout flex min-h-[56px] w-full items-center gap-3 px-4 font-semibold text-forest transition-colors hover:bg-muted/50">
                  <span className="grid size-8 place-items-center rounded-full border border-dashed border-forest/40">
                    <Plus className="size-4" />
                  </span>
                  Add a food we missed
                </button>
              }
            />
          </div>
          {aiProposed && !isChild && items.some((i) => i.quantityConfidence === "low" && !i.confirmedByUser) && (
            <CautionNote title="Some portions are hard to judge">Adjust them if you can — a rough guess is fine.</CautionNote>
          )}
        </Section>

        {mixed && (mixedIsCurry || matching.length > 0) && (
          <Section
            title={mixedIsCurry ? `What was the main ingredient in the ${mixed.displayName.replace(/ \(.*\)/, "").toLowerCase()}?` : `Is your ${mixed.displayName.replace(/ \(.*\)/, "").toLowerCase()} like one of these recipes?`}
            description="Mixed dishes vary a lot. A matching recipe gives a better estimate than a single food."
          >
            {mixedIsCurry && (
              <PillGroup
                label="Main ingredient"
                options={MAIN_INGREDIENTS.map((m) => ({ value: m.id, label: m.label }))}
                value={main}
                onChange={(id) => {
                  setMain(id)
                  const m = MAIN_INGREDIENTS.find((x) => x.id === id)
                  if (!m) return
                  setItems(items.map((i) => (i.id === mixed.id ? { ...i, foodId: m.foodId, displayName: FOOD_MAP[m.foodId]?.name ?? m.foodId, cookingMethod: m.cooking ?? i.cookingMethod ?? "Curry", unitLabel: undefined, confirmedByUser: true } : i)))
                }}
              />
            )}
            {matching.length > 0 && (
              <ListGroup label="Matching recipes">
                {matching.map((r) => (
                  <ListRow
                    key={r.id}
                    onClick={() => onUseRecipe(r)}
                    icon={<CookingPot />}
                    iconTone="lime"
                    title={r.name}
                    description={`Use 1 serving (~${Math.round(recipeNutrition(r, 1).energyKcal)} kcal). Replaces the foods above.`}
                  />
                ))}
              </ListGroup>
            )}
          </Section>
        )}

        {upFront.map(question)}
        {later.length > 0 && (
          <div>
            <button type="button" onClick={() => setShowMore((v) => !v)} aria-expanded={showMore} className="text-callout inline-flex items-center gap-1.5 font-semibold text-forest">
              More details (optional) <ChevronDown className={`size-4 transition-transform ${showMore ? "rotate-180" : ""}`} aria-hidden />
            </button>
            {showMore && <div className="mt-4 space-y-7">{later.map(question)}</div>}
          </div>
        )}

        {isChild ? (
          <Section title="How it went">
            <Surface className="space-y-5">
              <div className="space-y-1.5">
                <Label>Texture</Label>
                <Select value={child.texture} onValueChange={(texture) => setChild({ ...child, texture })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEXTURES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <fieldset className="space-y-2">
                <legend className="text-callout mb-2 font-medium">How much was eaten?</legend>
                <PillGroup
                  label="How much was eaten"
                  options={[
                    { value: "yes", label: "Enjoyed it" },
                    { value: "somewhat", label: "A little" },
                    { value: "no", label: "Not today" },
                  ]}
                  value={child.accepted}
                  onChange={(accepted) => setChild({ ...child, accepted: accepted as ChildInfo["accepted"] })}
                />
                <p className="text-caption text-muted-foreground">Let your baby decide how much. It can take many tries to accept a new food.</p>
              </fieldset>
              <div className="space-y-1.5">
                <Label htmlFor="reaction">Any reaction?</Label>
                <Textarea id="reaction" rows={2} value={child.reaction} onChange={(e) => setChild({ ...child, reaction: e.target.value })} placeholder="e.g. none observed, mild rash around mouth" />
              </div>
              <label className="flex min-h-11 items-center justify-between gap-3 border-t border-border/70 pt-4">
                <span className="min-w-0">
                  <span className="text-callout block font-medium">First time trying this</span>
                  <span className="text-caption block text-muted-foreground">Adds it to the introduction tracker</span>
                </span>
                <Switch checked={child.firstTime} onCheckedChange={(v) => setChild({ ...child, firstTime: v })} aria-label="First time trying this" />
              </label>
            </Surface>
          </Section>
        ) : (
          <Section title="Estimate for this meal">
            <Surface padding="lg">
              <p className="text-metric">
                ~{Math.round(n.energyKcal)}
                <span className="text-callout ml-1 font-normal tracking-normal text-muted-foreground">kcal</span>
              </p>
              <p className="tabular text-caption mt-0.5 text-muted-foreground">
                Likely {Math.round(n.energyKcal * (1 - u))}–{Math.round(n.energyKcal * (1 + u))} kcal
              </p>
              <MacroTiles className="mt-4" values={n} />
              <div className="mt-4 border-t border-border/70 pt-3">
                <EstimateNote>Calculated from our food database after you confirm. The range reflects portion and ingredient uncertainty.</EstimateNote>
              </div>
            </Surface>
          </Section>
        )}

        <Section title="Details">
          <Surface className="space-y-4">
            {!isChild && openMeals.length > 0 && (
              <div className="space-y-1.5">
                <Label>Which planned meal was this?</Label>
                <Select value={linkedMealId} onValueChange={setLinkedMealId}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {openMeals.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {MEAL_LABEL[m.mealType]} · {formatTime(m.time)} — {lookup(m.recipeId)?.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="none">Not from my plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {!linked && (
              <div className="flex items-center justify-between gap-3">
                <Label>Meal</Label>
                <Select value={mealType} onValueChange={(v) => setMealType(v as MealType)}>
                  <SelectTrigger className="w-44" aria-label="Meal">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEAL_ORDER.map((t) => (
                      <SelectItem key={t} value={t}>
                        {MEAL_LABEL[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="when-date">Date</Label>
              <Input id="when-date" type="date" value={date} max={todayISO()} disabled={!!linked} onChange={(e) => e.target.value && setDate(e.target.value > todayISO() ? todayISO() : e.target.value)} className="tabular w-44" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="when">When did {isChild ? `${profile.name} eat` : "you eat"}?</Label>
              <Input id="when" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="tabular w-36" />
            </div>
            {!isChild && source !== "saved" && (
              <label className="flex min-h-11 items-center justify-between gap-3 border-t border-border/70 pt-4">
                <span className="min-w-0">
                  <span className="text-callout block font-medium">Save as a usual meal</span>
                  <span className="text-caption block text-muted-foreground">Log it again in one tap next time</span>
                </span>
                <Switch checked={saveAsUsual} onCheckedChange={setSaveAsUsual} aria-label="Save as a usual meal" />
              </label>
            )}
          </Surface>
        </Section>
      </div>
      <StickyAction label={isChild ? "Save to diary" : "Confirm and save"} disabled={!items.length} onClick={onConfirm} />
    </div>
  )
}

/** Recipe items for logging, confirmed because they come from known ingredient quantities. */
export function recipeItems(recipe: Recipe, servings: number): JournalItem[] {
  return itemsFromRecipe(recipe, servings).map((i) => ({ ...i, confirmedByUser: true }))
}
