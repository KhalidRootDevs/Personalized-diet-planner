"use client"

/**
 * Plan-tab calendar extras (§14): .ics export, pause/resume, add a meal to a day and the
 * smart-rescheduling banner. Built from the shared components (UI-SPEC §4).
 */
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { CalendarClock, CalendarPlus, Download, Pause, Play, Plus, ShieldCheck } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, PillGroup, Segmented } from "@/components/app/controls"
import { IconTile, Pill, Surface } from "@/components/app/page"
import { InfoNote } from "@/components/app/alerts"
import { RecipeThumb } from "@/components/app/recipe-thumb"
import { useApp } from "@/lib/store"
import { RECIPES } from "@/lib/data/recipes"
import { MEAL_LABEL } from "@/lib/planning"
import { recipeNutrition, violatesHardConstraints } from "@/lib/nutrition"
import { buildIcs, calendarEvents, downloadIcs, portableSnackDays, rangeMeals, workHourConflicts, type IcsRange } from "@/lib/calendar"
import { formatDay, formatTime, startOfWeek, uid } from "@/lib/date"
import { cn } from "@/lib/utils"
import type { MealPlan, MealType, Profile } from "@/lib/types"

/* ───────────── Export (.ics) ───────────── */

export function ExportSheet({ plan, date, open, onOpenChange }: { plan: MealPlan; date: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [range, setRange] = useState<IcsRange>("week")
  const prepTime = useApp((s) => s.settings.reminders.prep?.time)
  const events = calendarEvents(rangeMeals(plan.meals, range, date, startOfWeek), { prepTime })
  const preview = events.slice(0, 4)
  const label = { day: formatDay(date, { weekday: "long", day: "numeric", month: "short" }), week: `Week of ${formatDay(startOfWeek(date), { day: "numeric", month: "short" })}`, plan: "Whole plan" }[range]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle className="text-title">Add to your calendar</SheetTitle>
          <SheetDescription>Download a calendar file (.ics) for Google, Apple or Outlook Calendar.</SheetDescription>
        </SheetHeader>
        <div className="space-y-5 px-5">
          <Segmented
            label="What to export"
            value={range}
            onChange={setRange}
            options={[
              { value: "day", label: "Day" },
              { value: "week", label: "Week" },
              { value: "plan", label: "Whole plan" },
            ]}
          />
          <Surface tone="muted" className="space-y-2">
            <p className="text-overline text-muted-foreground">
              {label} · {events.length} events
            </p>
            {preview.map((e) => (
              <div key={e.uid} className="text-callout flex items-center justify-between gap-3">
                <span className="font-medium">{e.title}</span>
                <span className="tabular text-muted-foreground">
                  {formatDay(e.date, { weekday: "short", day: "numeric" })} · {formatTime(e.start)}
                </span>
              </div>
            ))}
            {events.length > preview.length && <p className="text-caption text-muted-foreground">+ {events.length - preview.length} more</p>}
            {events.length === 0 && <p className="text-callout text-muted-foreground">No meals in this range.</p>}
          </Surface>
          <InfoNote>
            Event titles stay neutral (“Lunch”, “Meal prep”) and never include health details. Importing an updated file again updates the same events instead of adding duplicates.
          </InfoNote>
          <Button
            size="lg"
            className="w-full"
            disabled={!events.length}
            onClick={() => {
              downloadIcs(`nutriplan-${range === "plan" ? "plan" : range === "week" ? `week-${startOfWeek(date)}` : date}.ics`, buildIcs(events))
              toast.success("Calendar file downloaded", { description: "Open it to add the events to your calendar." })
              onOpenChange(false)
            }}
          >
            <Download className="size-4" /> Download .ics
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/* ───────────── Pause / resume (§14.1) ───────────── */

export function PausedBanner({ plan }: { plan: MealPlan }) {
  const setStatus = useApp((s) => s.setPlanStatus)
  const sync = useApp((s) => s.syncMealStatuses)
  return (
    <Surface tone="muted" className="flex items-center gap-3">
      <IconTile tone="white">
        <Pause />
      </IconTile>
      <div className="min-w-0 flex-1">
        <p className="text-body font-semibold">Plan paused</p>
        <p className="text-caption text-muted-foreground">Meals are on hold and meal reminders are off. Your food log still works.</p>
      </div>
      <Button
        size="sm"
        onClick={() => {
          setStatus(plan.id, "active")
          sync()
          toast.success("Plan resumed", { description: "Upcoming meals and reminders are back on." })
        }}
      >
        <Play className="size-4" /> Resume
      </Button>
    </Surface>
  )
}

export function PauseDialog({ plan, open, onOpenChange }: { plan: MealPlan; open: boolean; onOpenChange: (o: boolean) => void }) {
  const setStatus = useApp((s) => s.setPlanStatus)
  const sync = useApp((s) => s.syncMealStatuses)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pause this plan?</DialogTitle>
          <DialogDescription>Upcoming meals are put on hold and meal, prep and shopping reminders stop until you resume. Nothing is deleted, and you can keep logging what you eat.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep going
          </Button>
          <Button
            onClick={() => {
              setStatus(plan.id, "paused")
              sync()
              onOpenChange(false)
              toast("Plan paused", { action: { label: "Undo", onClick: () => (setStatus(plan.id, "active"), sync()) } })
            }}
          >
            Pause plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ───────────── Add a meal (§14.1 "schedule individual meals") ───────────── */

const ADD_TYPES: MealType[] = ["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner", "evening_snack"]
const TYPE_TIMES: Record<string, string> = { breakfast: "08:30", morning_snack: "11:00", lunch: "13:00", afternoon_snack: "16:30", dinner: "20:30", evening_snack: "21:30" }

export function AddMealSheet({ plan, date, profile, open, onOpenChange }: { plan: MealPlan; date: string; profile: Profile; open: boolean; onOpenChange: (o: boolean) => void }) {
  const addMeal = useApp((s) => s.addMeal)
  const taken = new Set(plan.meals.filter((m) => m.date === date).map((m) => m.mealType))
  const firstFree = ADD_TYPES.find((t) => !taken.has(t)) ?? "afternoon_snack"
  const [type, setType] = useState<MealType>(firstFree)
  const [time, setTime] = useState(TYPE_TIMES[firstFree])
  const [recipeId, setRecipeId] = useState<string | null>(null)

  const { safe, hidden } = useMemo(() => {
    const slotMatch = (types: MealType[]) => types.includes(type) || (type.includes("snack") && types.some((t) => t.includes("snack")))
    const pool = RECIPES.filter((r) => r.profile === "adult" && r.reviewStatus === "approved" && slotMatch(r.mealTypes))
    const safe = pool.filter((r) => !violatesHardConstraints(r, profile))
    const hidden = pool.flatMap((r) => {
      const why = violatesHardConstraints(r, profile)
      return why ? [{ name: r.name, why }] : []
    })
    return { safe, hidden }
  }, [type, profile])

  const save = () => {
    const recipe = safe.find((r) => r.id === recipeId)
    if (!recipe) return
    addMeal(plan.id, { id: uid("meal"), date, mealType: type, time, recipeId: recipe.id, servings: 1, scheduleStatus: plan.status === "paused" ? "paused" : "upcoming", outcome: null })
    toast.success(`${MEAL_LABEL[type]} added`, { description: `${recipe.name} · ${formatDay(date)} · ${formatTime(time)}. Shopping list updated.` })
    setRecipeId(null)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle className="text-title">Add a meal</SheetTitle>
          <SheetDescription>{formatDay(date, { weekday: "long", day: "numeric", month: "long" })}</SheetDescription>
        </SheetHeader>
        <div className="space-y-5 px-5">
          <Field label="Meal">
            <PillGroup
              label="Meal"
              value={type}
              onChange={(t) => {
                setType(t)
                setTime(TYPE_TIMES[t])
                setRecipeId(null)
              }}
              options={ADD_TYPES.map((t) => ({ value: t, label: `${MEAL_LABEL[t]}${taken.has(t) ? " · planned" : ""}` }))}
            />
          </Field>
          <Field label="Time" htmlFor="add-time">
            <Input id="add-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-40" />
          </Field>
          <div className="space-y-2">
            <p className="text-callout font-medium">Choose a recipe</p>
            <div className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-card shadow-card" role="radiogroup" aria-label="Recipe">
              {safe.map((r) => {
                const on = recipeId === r.id
                const n = recipeNutrition(r)
                return (
                  <button key={r.id} type="button" role="radio" aria-checked={on} onClick={() => setRecipeId(r.id)} className={cn("flex w-full items-center gap-3 px-4 py-3 text-left transition-colors", on ? "bg-sage" : "hover:bg-muted/50")}>
                    <RecipeThumb recipe={r} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="text-body line-clamp-2 block font-medium">{r.name}</span>
                      <span className="tabular text-caption block text-muted-foreground">
                        ~{Math.round(n.energyKcal)} kcal · {r.prepMinutes + r.cookMinutes} min
                      </span>
                    </span>
                    {on && <Pill tone="lime">Selected</Pill>}
                  </button>
                )
              })}
              {safe.length === 0 && <p className="text-callout px-4 py-3 text-muted-foreground">No reviewed recipe for this meal fits your safety settings.</p>}
            </div>
            <p className="text-caption flex items-start gap-1.5 text-muted-foreground">
              <ShieldCheck className="mt-px size-4 shrink-0 text-forest" aria-hidden />
              Only reviewed recipes that pass your allergy and diet rules are shown{hidden.length ? ` (${hidden.length} hidden: ${Array.from(new Set(hidden.map((h) => h.why))).join(" ")})` : ""}.
            </p>
          </div>
          <Button size="lg" className="w-full" disabled={!recipeId || !time} onClick={save}>
            <Plus className="size-4" /> Add to {formatDay(date, { weekday: "short" })}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function AddMealButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-callout flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-input bg-card font-semibold text-forest transition-colors hover:bg-muted/50">
      <CalendarPlus className="size-[18px]" aria-hidden /> Add a meal to this day
    </button>
  )
}

/* ───────────── Smart rescheduling (§14.5) ───────────── */

export function RescheduleBanner({ plan, profile }: { plan: MealPlan; profile: Profile }) {
  const reschedule = useApp((s) => s.rescheduleMeal)
  const [dismissed, setDismissed] = useState<string[]>([])
  const conflicts = workHourConflicts(plan.meals, profile).filter((c) => !dismissed.includes(`${c.mealType}:${c.suggestedTime}`))
  const snackDays = portableSnackDays(plan.meals, profile)
  if (plan.status === "paused" || (!conflicts.length && !snackDays)) return null
  return (
    <Surface tone="sage" className="space-y-3">
      <div className="flex items-center gap-3">
        <IconTile tone="white">
          <CalendarClock />
        </IconTile>
        <div className="min-w-0 flex-1">
          <p className="text-body font-semibold">Fitting meals around work</p>
          {profile.workStart && profile.workEnd && (
            <p className="tabular text-caption text-muted-foreground">
              Your work hours: {formatTime(profile.workStart)} – {formatTime(profile.workEnd)}
            </p>
          )}
        </div>
      </div>
      {conflicts.map((c) => {
        const k = `${c.mealType}:${c.suggestedTime}`
        return (
          <div key={k} className="space-y-2">
            <p className="text-body">
              {c.meals.length} upcoming {MEAL_LABEL[c.mealType].toLowerCase()}
              {c.meals.length > 1 ? "s are" : " is"} at {formatTime(c.currentTime)}, {c.reason}. Move {c.meals.length > 1 ? "them" : "it"} to <span className="tabular font-semibold">{formatTime(c.suggestedTime)}</span>?
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  const prev = c.meals.map((m) => ({ id: m.id, date: m.date, time: m.time }))
                  c.meals.forEach((m) => reschedule(m.id, m.date, c.suggestedTime))
                  toast.success(`${MEAL_LABEL[c.mealType]} moved to ${formatTime(c.suggestedTime)}`, {
                    description: "Only the time changed, so nutrition and safety checks still apply.",
                    action: { label: "Undo", onClick: () => prev.forEach((p) => reschedule(p.id, p.date, p.time)) },
                  })
                }}
              >
                Move to {formatTime(c.suggestedTime)}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDismissed([...dismissed, k])}>
                Keep times
              </Button>
            </div>
          </div>
        )
      })}
      {snackDays > 0 && <p className="text-callout">Snacks on {snackDays} day{snackDays > 1 ? "s" : ""} fall during work — pick a portable option (fruit, doi, peanuts if safe for you) or replace it from the meal sheet.</p>}
      <p className="text-caption text-muted-foreground">Suggestions only. Meals that no longer fit can be replaced or prepared the evening before.</p>
    </Surface>
  )
}

