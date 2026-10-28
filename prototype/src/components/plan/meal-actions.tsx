"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import {
  ArrowLeftRight, BookOpen, CalendarClock, Check, ChevronLeft, CircleCheck, Clock, Minus, NotebookPen, Plus, SkipForward, Timer,
} from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RecipeThumb } from "@/components/app/recipe-thumb"
import { FeatureBadge, PremiumGate } from "@/components/app/badges"
import { CautionNote, InfoNote } from "@/components/app/alerts"
import { EstimateNote } from "@/components/app/nutrition"
import { useApp, useSelfProfile } from "@/lib/store"
import { MEAL_LABEL, swapOptions, type SwapMode } from "@/lib/planning"
import { fmt, recipeCostPerServing, recipeNutrition } from "@/lib/nutrition"
import { formatDay, formatTime } from "@/lib/date"
import { STATUS_STYLE, mealStatus, useRecipeLookup } from "@/lib/area-c-utils"
import { cn } from "@/lib/utils"
import type { PlannedMeal } from "@/lib/types"

type View = "main" | "swap" | "reschedule"

/** Bottom sheet with the daily meal actions (§42.16) and the meal status model (§14.6). */
export function MealActionsSheet({ meal, children }: { meal: PlannedMeal; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="bottom" className="mx-auto max-h-[90dvh] max-w-[440px] overflow-y-auto rounded-t-3xl pb-safe">
        <SheetTitle className="sr-only">Meal actions</SheetTitle>
        <SheetDescription className="sr-only">Mark, log, replace, reschedule or skip this meal.</SheetDescription>
        <MealActions mealId={meal.id} onDone={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}

/** Shared body for the sheet and the full-page meal detail. */
export function MealActions({ mealId, onDone, page }: { mealId: string; onDone?: () => void; page?: boolean }) {
  const router = useRouter()
  const meal = useApp((s) => s.plans.flatMap((p) => p.meals).find((m) => m.id === mealId))
  const setOutcome = useApp((s) => s.setMealOutcome)
  const togglePrepLater = useApp((s) => s.togglePrepLater)
  const setServings = useApp((s) => s.setMealServings)
  const lookup = useRecipeLookup()
  const [view, setView] = useState<View>("main")

  if (!meal) return <p className="p-6 text-sm text-muted-foreground">This meal is no longer in your plan.</p>
  const recipe = lookup(meal.recipeId)
  if (!recipe) return <p className="p-6 text-sm text-muted-foreground">Recipe not found.</p>
  const n = recipeNutrition(recipe, meal.servings)
  const cost = recipeCostPerServing(recipe) * meal.servings
  const status = mealStatus(meal)
  const prev = meal.outcome

  const mark = (outcome: PlannedMeal["outcome"], message: string) => {
    setOutcome(meal.id, outcome)
    toast(message, { action: { label: "Undo", onClick: () => setOutcome(meal.id, prev) } })
    onDone?.()
  }

  if (view === "swap") return <SwapView meal={meal} onBack={() => setView("main")} onDone={onDone} />
  if (view === "reschedule") return <RescheduleView meal={meal} onBack={() => setView("main")} onDone={onDone} />

  return (
    <div className={cn("space-y-5", page ? "" : "px-4 pt-5 pb-6")}>
      <div className="flex gap-3">
        <RecipeThumb recipe={recipe} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">
            {MEAL_LABEL[meal.mealType]} · {formatDay(meal.date)} · {formatTime(meal.time)}
          </p>
          <p className="text-lg leading-snug font-semibold">{recipe.name}</p>
          <span className={cn("mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium", STATUS_STYLE[status.tone])}>{status.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Energy" value={`~${Math.round(n.energyKcal)}`} unit="kcal" />
        <Stat label="Protein" value={`~${Math.round(n.proteinG)}`} unit="g" />
        <Stat label="Cost" value={fmt.bdt(cost)} unit="estimate" />
      </div>

      <div className="flex items-center justify-between rounded-xl border bg-card px-3 py-2">
        <div>
          <p className="text-sm font-medium">Servings</p>
          <p className="text-xs text-muted-foreground">Updates nutrition and your shopping list</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="icon-sm" variant="outline" aria-label="Fewer servings" disabled={meal.servings <= 0.5} onClick={() => setServings(meal.id, Math.max(0.5, meal.servings - 0.5))}>
            <Minus />
          </Button>
          <span className="tabular w-8 text-center font-semibold">{meal.servings}</span>
          <Button size="icon-sm" variant="outline" aria-label="More servings" disabled={meal.servings >= 6} onClick={() => setServings(meal.id, Math.min(6, meal.servings + 0.5))}>
            <Plus />
          </Button>
        </div>
      </div>

      {meal.outcome ? (
        <InfoNote>
          Recorded as <strong>{status.label.toLowerCase()}</strong>.{" "}
          <button className="font-medium text-forest underline underline-offset-2" onClick={() => setOutcome(meal.id, null)}>
            Change
          </button>
        </InfoNote>
      ) : (
        <Button className="w-full" size="lg" onClick={() => mark("eaten_as_planned", `${MEAL_LABEL[meal.mealType]} marked as eaten`)}>
          <CircleCheck /> Mark as eaten
        </Button>
      )}

      <div className="grid grid-cols-2 gap-2">
        <ActionTile icon={<NotebookPen />} label="Log what I ate" hint="Photo or text" onClick={() => router.push(`/log/new?meal=${meal.id}`)} />
        <ActionTile icon={<ArrowLeftRight />} label="Replace meal" hint="Find a swap" onClick={() => setView("swap")} />
        <ActionTile icon={<BookOpen />} label="View recipe" hint={`${recipe.prepMinutes + recipe.cookMinutes} min`} onClick={() => router.push(`/recipes/${recipe.id}`)} />
        <ActionTile
          icon={<Timer />}
          label={meal.prepLater ? "Prep planned" : "Prepare later"}
          hint={meal.prepLater ? "In your prep list" : "Add to prep list"}
          active={meal.prepLater}
          onClick={() => {
            togglePrepLater(meal.id)
            toast(meal.prepLater ? "Removed from prep list" : "Added to your prep list")
          }}
        />
        <ActionTile icon={<CalendarClock />} label="Reschedule" hint="Move day or time" onClick={() => setView("reschedule")} />
        <ActionTile icon={<SkipForward />} label="Skip this meal" hint="That's okay" onClick={() => mark("skipped", "Meal skipped — your plan stays the same")} />
      </div>

      <EstimateNote>Nutrition and cost are estimates from the recipe and our food database.</EstimateNote>
    </div>
  )
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-xl bg-muted/60 px-2 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="tabular font-semibold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{unit}</p>
    </div>
  )
}

function ActionTile({ icon, label, hint, onClick, active }: { icon: React.ReactNode; label: string; hint: string; onClick: () => void; active?: boolean }) {
  return (
    <button onClick={onClick} className={cn("flex min-h-16 items-center gap-2.5 rounded-xl border bg-card p-3 text-left transition-colors hover:bg-muted/50", active && "border-forest bg-sage/40")}>
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-sage text-forest [&_svg]:size-4.5">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm leading-tight font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
    </button>
  )
}

const MODES: { id: SwapMode; label: string; premium: boolean }[] = [
  { id: "similar", label: "Similar", premium: false },
  { id: "cheaper", label: "Cheaper", premium: true },
  { id: "quick", label: "Quick", premium: true },
  { id: "pantry", label: "What I have", premium: true },
]

/** Smart meal swapping (§15.3, §42.11): modes only re-rank options that already pass hard constraints. */
function SwapView({ meal, onBack, onDone }: { meal: PlannedMeal; onBack: () => void; onDone?: () => void }) {
  const profile = useSelfProfile()
  const pantry = useApp((s) => s.pantry)
  const replaceMeal = useApp((s) => s.replaceMeal)
  const [mode, setMode] = useState<SwapMode>("similar")
  const [chosen, setChosen] = useState<string | null>(null)
  if (!profile) return null
  const options = swapOptions(meal, profile, mode, pantry)
  const premium = MODES.find((m) => m.id === mode)?.premium
  const pick = options.find((o) => o.recipe.id === chosen)

  const list = (
    <div className="space-y-2">
      {options.length === 0 && <p className="text-sm text-muted-foreground">No alternative meets all of your restrictions for this meal.</p>}
      {options.map((o) => {
        const n = recipeNutrition(o.recipe)
        return (
          <button
            key={o.recipe.id}
            onClick={() => setChosen(o.recipe.id)}
            className={cn("flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left", chosen === o.recipe.id && "border-forest bg-sage/30")}
            aria-pressed={chosen === o.recipe.id}
          >
            <RecipeThumb recipe={o.recipe} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{o.recipe.name}</p>
              <p className="tabular text-xs text-muted-foreground">
                ~{Math.round(n.energyKcal)} kcal ({signed(o.deltaKcal)}) · protein {signed(o.deltaProtein, "g")} · {fmt.bdt(recipeCostPerServing(o.recipe))} ({signed(o.deltaCost, "", "৳")})
              </p>
              <p className="text-xs text-muted-foreground">
                {o.recipe.prepMinutes + o.recipe.cookMinutes} min{mode === "pantry" && o.pantryHits > 0 ? ` · uses ${o.pantryHits} pantry item${o.pantryHits > 1 ? "s" : ""}` : ""}
              </p>
            </div>
            {chosen === o.recipe.id && <Check className="size-5 text-forest" />}
          </button>
        )
      })}
    </div>
  )

  return (
    <div className="space-y-4 px-4 pt-4 pb-6">
      <button onClick={onBack} className="-ml-1 flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="size-4" /> Back
      </button>
      <div>
        <p className="text-lg font-semibold">Replace this meal</p>
        <p className="text-sm text-muted-foreground">Alternatives that respect your allergies, diet and age-specific rules.</p>
      </div>
      <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted p-1" role="tablist" aria-label="Swap mode">
        {MODES.map((m) => (
          <button
            key={m.id}
            role="tab"
            aria-selected={mode === m.id}
            onClick={() => {
              setMode(m.id)
              setChosen(null)
            }}
            className={cn("flex min-h-10 flex-col items-center justify-center rounded-lg px-1 text-xs font-medium", mode === m.id ? "bg-card text-forest shadow-xs" : "text-muted-foreground")}
          >
            {m.label}
          </button>
        ))}
      </div>
      {premium ? (
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <FeatureBadge feature="swap_modes" /> Extra swap modes
          </p>
          <PremiumGate feature="swap_modes" compact>
            {list}
          </PremiumGate>
        </div>
      ) : (
        list
      )}
      {pick?.material && (
        <CautionNote title="This changes your day noticeably">
          This swap changes energy or protein by more than a fifth. Your daily totals will be recalculated.
        </CautionNote>
      )}
      <Button
        className="w-full"
        size="lg"
        disabled={!pick}
        onClick={() => {
          if (!pick) return
          const before = meal.recipeId
          replaceMeal(meal.id, pick.recipe.id)
          toast(`Swapped to ${pick.recipe.name}`, { description: "Shopping list updated", action: { label: "Undo", onClick: () => useApp.getState().replaceMeal(meal.id, before) } })
          onDone?.()
          onBack()
        }}
      >
        Use this meal
      </Button>
    </div>
  )
}

function signed(n: number, unit = "", prefix = ""): string {
  const r = Math.round(n)
  if (r === 0) return `±0${unit}`
  return `${r > 0 ? "+" : "−"}${prefix}${Math.abs(r)}${unit}`
}

function RescheduleView({ meal, onBack, onDone }: { meal: PlannedMeal; onBack: () => void; onDone?: () => void }) {
  const reschedule = useApp((s) => s.rescheduleMeal)
  const [date, setDate] = useState(meal.date)
  const [time, setTime] = useState(meal.time)
  return (
    <div className="space-y-4 px-4 pt-4 pb-6">
      <button onClick={onBack} className="-ml-1 flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="size-4" /> Back
      </button>
      <p className="text-lg font-semibold">Move this meal</p>
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
      <InfoNote>
        <span className="flex items-center gap-1.5">
          <Clock className="size-4" /> We&apos;ll recheck the day&apos;s nutrition and safety rules after the move.
        </span>
      </InfoNote>
      <Button
        className="w-full"
        size="lg"
        onClick={() => {
          reschedule(meal.id, date, time)
          toast(`Moved to ${formatDay(date)}, ${formatTime(time)}`)
          onDone?.()
          onBack()
        }}
      >
        Save new time
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Changed your work hours? <Link href="/profile/edit" className="underline underline-offset-2">Update your schedule</Link>
      </p>
    </div>
  )
}
