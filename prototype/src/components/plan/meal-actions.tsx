"use client"

import { useFeedbackPrompt } from "@/components/progress/meal-feedback-sheet"
import { useAreaD } from "@/lib/area-d-store"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { ArrowLeftRight, BookOpen, CalendarClock, Check, CircleCheck, NotebookPen, RefreshCw, Scale, SkipForward, Timer, Users } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RecipeThumb } from "@/components/app/recipe-thumb"
import { FeatureBadge, PremiumGate } from "@/components/app/badges"
import { CautionNote, InfoNote } from "@/components/app/alerts"
import { EstimateNote } from "@/components/app/nutrition"
import { BackButton, EmptyState, ListGroup, ListRow, Pill, StatTile, Surface } from "@/components/app/page"
import { Segmented, Stepper } from "@/components/app/controls"
import { useApp, useSelfProfile } from "@/lib/store"
import { MEAL_LABEL, regenerateDay, swapOptions, type SwapMode } from "@/lib/planning"
import { fmt, recipeAllergens, recipeCostPerServing, recipeNutrition } from "@/lib/nutrition"
import { ALLERGEN_LABELS } from "@/lib/data/foods"
import { formatDay, formatTime } from "@/lib/date"
import { STATUS_STYLE, mealStatus, revalidateAfterChange, useRecipeLookup } from "@/lib/area-c-utils"
import { cn } from "@/lib/utils"
import type { PlannedMeal } from "@/lib/types"

export type MealView = "main" | "swap" | "reschedule"
type View = MealView

/** Bottom sheet with the daily meal actions (§42.16) and the meal status model (§14.6). */
export function MealActionsSheet({ meal, children }: { meal: PlannedMeal; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="bottom">
        <SheetTitle className="sr-only">Meal actions</SheetTitle>
        <SheetDescription className="sr-only">Mark, log, replace, reschedule or skip this meal.</SheetDescription>
        <MealActions mealId={meal.id} onDone={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}

/** Shared body for the sheet and the full-page meal detail. */
export function MealActions({ mealId, onDone, page, initialView = "main" }: { mealId: string; onDone?: () => void; page?: boolean; initialView?: View }) {
  const router = useRouter()
  const meal = useApp((s) => s.plans.flatMap((p) => p.meals).find((m) => m.id === mealId))
  const setOutcome = useApp((s) => s.setMealOutcome)
  const togglePrepLater = useApp((s) => s.togglePrepLater)
  const setServings = useApp((s) => s.setMealServings)
  const lookup = useRecipeLookup()
  const [view, setView] = useState<View>(initialView)
  const plan = useApp((s) => s.plans.find((p) => p.meals.some((m) => m.id === mealId)))
  const pantry = useApp((s) => s.pantry)
  const twin = useApp((s) => s.twinPreferences)
  const updatePlan = useApp((s) => s.updatePlan)
  const self = useSelfProfile()

  if (!meal) return <p className="text-callout p-6 text-muted-foreground">This meal is no longer in your plan.</p>
  const recipe = lookup(meal.recipeId)
  if (!recipe) return <p className="text-callout p-6 text-muted-foreground">Recipe not found.</p>
  const n = recipeNutrition(recipe, meal.servings)
  const cost = recipeCostPerServing(recipe) * meal.servings
  const status = mealStatus(meal)
  const prev = meal.outcome

  const mark = (outcome: PlannedMeal["outcome"], message: string) => {
    setOutcome(meal.id, outcome)
    toast(message, { action: { label: "Undo", onClick: () => setOutcome(meal.id, prev) } })
    onDone?.()
    // Optional post-meal feedback (§17.5), asked once per meal.
    const asked = useAreaD.getState().mealFeedback.some((f) => f.mealId === meal.id)
    if ((outcome === "eaten_as_planned" || outcome === "eaten_modified") && !asked) setTimeout(() => useFeedbackPrompt.getState().ask({ ...meal, outcome }), 450)
  }

  const regenerate = () => {
    if (!plan || !self) return
    const before = plan.meals
    const meals = regenerateDay(plan, meal.date, self, { pantry, twin: twin.filter((t) => t.active).map((t) => t.text) })
    updatePlan(plan.id, { meals })
    const first = meals.find((m) => m.date === meal.date && !m.outcome)
    const check = first ? revalidateAfterChange(first.id) : null
    toast(`${formatDay(meal.date)} rebuilt`, { description: check?.summary ?? "Meals you already recorded were kept.", action: { label: "Undo", onClick: () => updatePlan(plan.id, { meals: before }) } })
    onDone?.()
  }
  const allergens = recipeAllergens(recipe)
  const safety = [...recipe.safetyNotes, ...(allergens.length ? [`Contains ${allergens.map((a) => ALLERGEN_LABELS[a] ?? a).join(", ").toLowerCase()}.`] : [])]

  if (view === "swap") return <SwapView meal={meal} page={page} onBack={() => setView("main")} onDone={onDone} />
  if (view === "reschedule") return <RescheduleView meal={meal} page={page} onBack={() => setView("main")} onDone={onDone} />

  return (
    <div className={cn("space-y-5", !page && "px-5 pt-2")}>
      <div className={cn("flex items-center gap-3.5", !page && "pr-10")}>
        <RecipeThumb recipe={recipe} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-caption text-muted-foreground">
            {MEAL_LABEL[meal.mealType]} · {formatDay(meal.date)} · {formatTime(meal.time)}
          </p>
          <p className="text-title mt-0.5">{recipe.name}</p>
          <span className={cn("mt-1.5 inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium", STATUS_STYLE[status.tone])}>{status.label}</span>
        </div>
      </div>

      <Surface padding="sm" className="grid grid-cols-3 gap-2">
        <StatTile label="Energy" value={`~${Math.round(n.energyKcal)}`} unit="kcal" />
        <StatTile label="Protein" value={`~${Math.round(n.proteinG)}`} unit="g" />
        <StatTile label="Cost (est.)" value={fmt.bdt(cost)} />
        <StatTile label="Carbs" value={`~${Math.round(n.carbsG)}`} unit="g" />
        <StatTile label="Fat" value={`~${Math.round(n.fatG)}`} unit="g" />
        <StatTile label="Fiber" value={`~${Math.round(n.fiberG)}`} unit="g" />
      </Surface>
      {recipe.reviewStatus === "personal" && <Pill>Your recipe · not reviewed</Pill>}
      {safety.length > 0 && (
        <CautionNote title="Safety notes">
          <ul className="list-disc space-y-0.5 pl-4">
            {safety.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </CautionNote>
      )}

      <ListGroup>
        <ListRow
          icon={<Users />}
          iconTone="amber"
          title="Servings"
          description="Updates nutrition and shopping"
          trailing={
            <Stepper
              label="servings"
              value={meal.servings}
              decDisabled={meal.servings <= 0.5}
              incDisabled={meal.servings >= 6}
              onDec={() => setServings(meal.id, Math.max(0.5, meal.servings - 0.5))}
              onInc={() => setServings(meal.id, Math.min(6, meal.servings + 0.5))}
            />
          }
        />
      </ListGroup>

      {meal.outcome ? (
        <InfoNote>
          Recorded as <strong className="font-semibold">{status.label.toLowerCase()}</strong>.{" "}
          <button className="font-semibold text-forest underline underline-offset-2" onClick={() => setOutcome(meal.id, null)}>
            Change
          </button>
        </InfoNote>
      ) : (
        <Button className="w-full" size="lg" onClick={() => mark("eaten_as_planned", `${MEAL_LABEL[meal.mealType]} marked as eaten`)}>
          <CircleCheck className="size-5" /> Mark as eaten
        </Button>
      )}

      <ListGroup>
        <ListRow icon={<NotebookPen />} iconTone="lime" title="Log what I ate" description="Photo, search or text" onClick={() => router.push(`/log/new?meal=${meal.id}`)} />
        <ListRow icon={<ArrowLeftRight />} iconTone="sky" title="Replace meal" description="Similar, cheaper or quicker options" onClick={() => setView("swap")} />
        <ListRow icon={<BookOpen />} iconTone="terracotta" title="View recipe" description={`${recipe.prepMinutes + recipe.cookMinutes} min · serves ${recipe.servings}`} onClick={() => router.push(`/recipes/${recipe.id}?meal=${meal.id}`)} />
        <ListRow
          icon={<Timer />}
          iconTone="amber"
          title="Prepare later"
          description={meal.prepLater ? "In your meal-prep list" : "Add to your meal-prep list"}
          trailing={
            meal.prepLater ? (
              <Pill tone="sage" icon={<Check />}>
                Added
              </Pill>
            ) : undefined
          }
          chevron={false}
          onClick={() => {
            togglePrepLater(meal.id)
            toast(meal.prepLater ? "Removed from prep list" : "Added to your prep list")
          }}
        />
        <ListRow icon={<CalendarClock />} iconTone="sage" title="Reschedule" description="Move to another day or time" onClick={() => setView("reschedule")} />
        <ListRow icon={<RefreshCw />} iconTone="sky" title="Regenerate this day" description="New picks for unrecorded meals, same rules" chevron={false} onClick={regenerate} />
        <ListRow
          icon={<SkipForward />}
          iconTone="muted"
          title="Skip this meal"
          description="That's okay — your plan stays the same"
          chevron={false}
          onClick={() => mark("skipped", "Meal skipped — your plan stays the same")}
        />
      </ListGroup>

      <EstimateNote>Nutrition and cost are estimates from the recipe and our food database.</EstimateNote>
    </div>
  )
}

function SubViewHeader({ title, description, onBack, page }: { title: string; description?: string; onBack: () => void; page?: boolean }) {
  return (
    <div className={cn(!page && "pr-10")}>
      <div className="-ml-2.5 flex items-center gap-1">
        <BackButton onClick={onBack} />
        <p className="text-title">{title}</p>
      </div>
      {description && <p className="text-callout mt-1 text-muted-foreground">{description}</p>}
    </div>
  )
}

const MODES: { id: SwapMode; label: string; premium: boolean }[] = [
  { id: "similar", label: "Similar", premium: false },
  { id: "cheaper", label: "Cheaper", premium: true },
  { id: "quick", label: "Quick", premium: true },
  { id: "pantry", label: "I have", premium: true },
]

/** Smart meal swapping (§15.3, §42.11): modes only re-rank options that already pass hard constraints. */
function SwapView({ meal, onBack, onDone, page }: { meal: PlannedMeal; onBack: () => void; onDone?: () => void; page?: boolean }) {
  const profile = useSelfProfile()
  const pantry = useApp((s) => s.pantry)
  const replaceMeal = useApp((s) => s.replaceMeal)
  const [mode, setMode] = useState<SwapMode>("similar")
  const [chosen, setChosen] = useState<string | null>(null)
  if (!profile) return null
  const options = swapOptions(meal, profile, mode, pantry)
  const premium = MODES.find((m) => m.id === mode)?.premium
  const pick = options.find((o) => o.recipe.id === chosen)

  const list =
    options.length === 0 ? (
      <EmptyState icon={<ArrowLeftRight />} title="No safe alternatives" description="No other meal meets all of your restrictions for this slot. Your current meal stays as it is." />
    ) : (
      <ul className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-card shadow-card">
        {options.map((o) => {
          const n = recipeNutrition(o.recipe)
          const selected = chosen === o.recipe.id
          return (
            <li key={o.recipe.id}>
              <button
                onClick={() => setChosen(o.recipe.id)}
                className={cn("flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50", selected && "bg-sage/40 hover:bg-sage/50")}
                aria-pressed={selected}
              >
                <RecipeThumb recipe={o.recipe} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-body line-clamp-2 font-medium">{o.recipe.name}</p>
                  <p className="tabular text-caption text-muted-foreground">
                    ~{Math.round(n.energyKcal)} kcal · {fmt.bdt(recipeCostPerServing(o.recipe))} · {o.recipe.prepMinutes + o.recipe.cookMinutes} min
                    {mode === "pantry" && o.pantryHits > 0 ? ` · uses ${o.pantryHits} pantry item${o.pantryHits > 1 ? "s" : ""}` : ""}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <DeltaPill value={o.deltaKcal} unit=" kcal" />
                    <DeltaPill value={o.deltaProtein} unit=" g protein" />
                    <DeltaPill value={o.deltaCost} prefix="৳" unit="" />
                  </div>
                </div>
                <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border-[1.5px]", selected ? "border-forest bg-forest text-white" : "border-input")} aria-hidden>
                  {selected && <Check className="size-3.5" strokeWidth={3} />}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    )

  return (
    <div className={cn("space-y-4", !page && "px-5 pt-1")}>
      <SubViewHeader title="Replace this meal" description="Only options that respect your allergies, diet and age-specific rules." onBack={onBack} page={page} />
      <Segmented
        label="Swap mode"
        value={mode}
        onChange={(v) => {
          setMode(v)
          setChosen(null)
        }}
        options={MODES.map((m) => ({ value: m.id, label: m.label }))}
      />
      {premium ? (
        <div className="space-y-2">
          <p className="text-caption flex items-center gap-2 text-muted-foreground">
            <FeatureBadge feature="swap_modes" /> Extra swap modes
          </p>
          <PremiumGate feature="swap_modes" compact>
            {list}
          </PremiumGate>
        </div>
      ) : (
        list
      )}
      {pick && (
        <Button asChild variant="outline" className="w-full">
          <Link href={`/recipes/compare?a=${meal.recipeId}&b=${pick.recipe.id}`}>
            <Scale className="size-4" /> Compare cost and nutrition
          </Link>
        </Button>
      )}
      {pick?.material && (
        <CautionNote title="This changes your day noticeably">This swap changes energy or protein by more than a fifth. Your daily totals will be recalculated.</CautionNote>
      )}
      <Button
        className="w-full"
        size="lg"
        disabled={!pick}
        onClick={() => {
          if (!pick) return
          const before = meal.recipeId
          replaceMeal(meal.id, pick.recipe.id)
          const check = revalidateAfterChange(meal.id)
          toast(`Swapped to ${pick.recipe.name}`, {
            description: `${check?.summary ?? ""} Shopping list updated.`.trim(),
            action: {
              label: "Undo",
              onClick: () => {
                useApp.getState().replaceMeal(meal.id, before)
                revalidateAfterChange(meal.id)
              },
            },
          })
          onDone?.()
          onBack()
        }}
      >
        Use this meal
      </Button>
    </div>
  )
}

function DeltaPill({ value, unit, prefix = "" }: { value: number; unit: string; prefix?: string }) {
  return <Pill className="tabular h-[22px] px-2 text-[11px]">{signed(value, unit, prefix)}</Pill>
}

function signed(n: number, unit = "", prefix = ""): string {
  const r = Math.round(n)
  if (r === 0) return `±0${unit}`
  return `${r > 0 ? "+" : "−"}${prefix}${Math.abs(r)}${unit}`
}

function RescheduleView({ meal, onBack, onDone, page }: { meal: PlannedMeal; onBack: () => void; onDone?: () => void; page?: boolean }) {
  const reschedule = useApp((s) => s.rescheduleMeal)
  const [date, setDate] = useState(meal.date)
  const [time, setTime] = useState(meal.time)
  return (
    <div className={cn("space-y-5", !page && "px-5 pt-1")}>
      <SubViewHeader title="Move this meal" onBack={onBack} page={page} />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="rs-date">Day</Label>
          <Input id="rs-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rs-time">Time</Label>
          <Input id="rs-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>
      <InfoNote>We&apos;ll recheck the day&apos;s nutrition, timing and safety rules after the move and tell you the result.</InfoNote>
      <Button
        className="w-full"
        size="lg"
        onClick={() => {
          reschedule(meal.id, date, time)
          const check = revalidateAfterChange(meal.id)
          toast(`Moved to ${formatDay(date)}, ${formatTime(time)}`, { description: check?.summary })
          onDone?.()
          onBack()
        }}
      >
        Save new time
      </Button>
      <p className="text-caption text-center text-muted-foreground">
        Changed your work hours?{" "}
        <Link href="/profile/edit" className="font-semibold text-forest underline-offset-2 hover:underline">
          Update your schedule
        </Link>
      </p>
    </div>
  )
}
