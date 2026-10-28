"use client"

import Link from "next/link"
import { useState } from "react"
import { CalendarDays, Check, ChefHat, ChevronLeft, ChevronRight, Layers, Package, Plus, ShieldCheck, ShoppingBasket, Sparkles, TriangleAlert } from "lucide-react"
import { EmptyState, ListGroup, ListRow, PageBody, PageHeader, Pill, Section, StatTile, Surface } from "@/components/app/page"
import { MealList } from "@/components/plan/meal-row"
import { Segmented } from "@/components/app/controls"
import { FeatureBadge } from "@/components/app/badges"
import { CautionNote, InfoNote } from "@/components/app/alerts"
import { Button } from "@/components/ui/button"
import { useActivePlan, useActiveProfile, useApp } from "@/lib/store"
import { addDays, formatDay, fromISO, nowHHMM, startOfWeek, toISODate, todayISO } from "@/lib/date"
import { fmt, recipeCostPerServing, recipeNutrition } from "@/lib/nutrition"
import { useRecipeLookup } from "@/lib/area-c-utils"
import { cn } from "@/lib/utils"
import type { MealPlan, PlannedMeal } from "@/lib/types"

type View = "day" | "week" | "month"

const byTime = (a: PlannedMeal, b: PlannedMeal) => a.time.localeCompare(b.time)

/** Plan tab: meal calendar with day/week/month views (§14, FR-016, UI-SPEC §5). */
export default function PlanPage() {
  const plan = useActivePlan()
  const profile = useActiveProfile()
  const [view, setView] = useState<View>("day")
  const [date, setDate] = useState(todayISO())

  const newPlan = (
    <Button asChild size="sm" variant="outline">
      <Link href="/plan/generate">
        <Plus className="size-4" /> New plan
      </Link>
    </Button>
  )

  if (profile && profile.type !== "adult") {
    return (
      <>
        <PageHeader title="Plan" large />
        <PageBody>
          <InfoNote title={`${profile.name}'s feeding is planned in the baby module`}>Infant plans follow age-appropriate textures and responsive feeding, not adult meal plans (§12).</InfoNote>
          <Button asChild size="lg" className="w-full">
            <Link href="/child">Open feeding plan</Link>
          </Button>
        </PageBody>
      </>
    )
  }

  if (!plan) {
    return (
      <>
        <PageHeader title="Plan" large />
        <PageBody>
          <EmptyState
            icon={<CalendarDays />}
            title="No active meal plan"
            description="Create a 3- or 7-day plan built around your goals, budget and schedule."
            action={
              <Button asChild>
                <Link href="/plan/generate">Create a meal plan</Link>
              </Button>
            }
          />
          <PlanTools />
        </PageBody>
      </>
    )
  }

  const step = view === "day" ? 1 : view === "week" ? 7 : 28
  const label =
    view === "day"
      ? date === todayISO()
        ? `Today · ${formatDay(date, { weekday: "short", day: "numeric", month: "short" })}`
        : formatDay(date, { weekday: "long", day: "numeric", month: "long" })
      : view === "week"
        ? `Week of ${formatDay(startOfWeek(date), { day: "numeric", month: "short" })}`
        : fromISO(date).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
  const navBtn = "grid size-10 place-items-center rounded-full border border-border/80 bg-card text-charcoal transition-colors hover:bg-muted"

  return (
    <>
      <PageHeader title="Plan" large action={newPlan} />
      <PageBody>
        <PlanSummary plan={plan} />

        <div className="space-y-4">
          <Segmented
            label="Calendar view"
            value={view}
            onChange={setView}
            options={[
              { value: "day", label: "Day" },
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
            ]}
          />
          <div className="flex items-center justify-between gap-2">
            <button className={navBtn} aria-label="Previous" onClick={() => setDate(addDays(date, -step))}>
              <ChevronLeft className="size-5" />
            </button>
            <button className="text-headline min-w-0 truncate rounded-lg px-2 py-1 hover:bg-muted" onClick={() => setDate(todayISO())} title="Go to today">
              {label}
            </button>
            <button className={navBtn} aria-label="Next" onClick={() => setDate(addDays(date, step))}>
              <ChevronRight className="size-5" />
            </button>
          </div>
          {view === "day" && <DayView date={date} onPick={setDate} meals={plan.meals} />}
          {view === "week" && <WeekView date={date} meals={plan.meals} />}
          {view === "month" && <MonthView date={date} meals={plan.meals} onPick={setDate} />}
        </div>

        {plan.validation.warnings.length > 0 && (
          <CautionNote title="Plan notes">
            <ul className="list-disc space-y-0.5 pl-4">
              {plan.validation.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </CautionNote>
        )}

        <PlanTools />
      </PageBody>
    </>
  )
}

function PlanSummary({ plan }: { plan: MealPlan }) {
  const end = addDays(plan.startDate, plan.durationDays - 1)
  const v = plan.validation
  return (
    <Link href="/plan/plans" className="block rounded-2xl border border-border/80 bg-card p-4 transition-colors hover:bg-muted/40">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sage text-forest">
          <CalendarDays className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-body font-semibold">{plan.title}</p>
          <p className="text-caption text-muted-foreground">
            {plan.durationDays} days · {formatDay(plan.startDate, { day: "numeric", month: "short" })} – {formatDay(end, { day: "numeric", month: "short" })} · {plan.status === "active" ? "Active" : plan.status}
          </p>
        </div>
        <ChevronRight className="mt-2.5 size-[18px] shrink-0 text-muted-grey" aria-hidden />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Pill tone={v.nutrition ? "sage" : "caution"} icon={v.nutrition ? <Check /> : <TriangleAlert />}>
          {v.nutrition ? "Nutrition checked" : "Nutrition needs attention"}
        </Pill>
        <Pill tone={v.safety ? "sage" : "safety"} icon={<ShieldCheck />}>
          {v.safety ? "Safety checked" : "Safety check failed"}
        </Pill>
        {v.requiresReview && <Pill tone="caution">Review needed</Pill>}
      </div>
    </Link>
  )
}

function DayStrip({ date, onPick, meals }: { date: string; onPick: (d: string) => void; meals: PlannedMeal[] }) {
  const start = startOfWeek(date)
  const today = todayISO()
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {Array.from({ length: 7 }, (_, i) => addDays(start, i)).map((d) => {
        const has = meals.some((m) => m.date === d)
        const selected = d === date
        const isToday = d === today
        return (
          <button
            key={d}
            onClick={() => onPick(d)}
            aria-pressed={selected}
            aria-label={`${formatDay(d, { weekday: "long", day: "numeric", month: "long" })}${isToday ? ", today" : ""}${has ? ", meals planned" : ""}`}
            className={cn(
              "flex h-[68px] flex-col items-center justify-center gap-0.5 rounded-2xl border transition-colors",
              selected ? "border-forest bg-forest text-ivory" : isToday ? "border-forest/60 bg-card text-forest" : "border-border/80 bg-card hover:bg-muted/60",
            )}
          >
            <span className={cn("text-[11px] font-medium", selected ? "text-ivory/80" : "text-muted-foreground")}>{formatDay(d, { weekday: "short" }).slice(0, 2)}</span>
            <span className="tabular text-headline leading-none">{fromISO(d).getDate()}</span>
            <span className={cn("mt-1 size-1.5 rounded-full", has ? (selected ? "bg-ivory" : "bg-forest") : "bg-transparent")} aria-hidden />
          </button>
        )
      })}
    </div>
  )
}

function DaySummary({ meals }: { meals: PlannedMeal[] }) {
  const lookup = useRecipeLookup()
  const totals = meals.reduce(
    (acc, m) => {
      const r = lookup(m.recipeId)
      if (!r) return acc
      const n = recipeNutrition(r, m.servings)
      return { kcal: acc.kcal + n.energyKcal, protein: acc.protein + n.proteinG, cost: acc.cost + recipeCostPerServing(r) * m.servings }
    },
    { kcal: 0, protein: 0, cost: 0 },
  )
  return (
    <div className="grid grid-cols-3 gap-2">
      <StatTile label="Energy" value={`~${Math.round(totals.kcal).toLocaleString("en-US")}`} unit="kcal" />
      <StatTile label="Protein" value={`~${Math.round(totals.protein)}`} unit="g" />
      <StatTile label="Cost (est.)" value={fmt.bdt(totals.cost)} />
    </div>
  )
}

function DayView({ date, onPick, meals }: { date: string; onPick: (d: string) => void; meals: PlannedMeal[] }) {
  const day = meals.filter((m) => m.date === date).sort(byTime)
  const nextId = date === todayISO() ? day.find((m) => !m.outcome && m.time >= nowHHMM())?.id : undefined
  return (
    <div className="space-y-4">
      <DayStrip date={date} onPick={onPick} meals={meals} />
      {day.length === 0 ? (
        <EmptyState icon={<CalendarDays />} title="Nothing planned" description="This day is outside your current plan." />
      ) : (
        <>
          <DaySummary meals={day} />
          <MealList meals={day} highlightId={nextId} />
        </>
      )}
    </div>
  )
}

function WeekView({ date, meals }: { date: string; meals: PlannedMeal[] }) {
  const start = startOfWeek(date)
  const today = todayISO()
  return (
    <div className="space-y-5">
      {Array.from({ length: 7 }, (_, i) => addDays(start, i)).map((d) => {
        const day = meals.filter((m) => m.date === d).sort(byTime)
        return (
          <div key={d}>
            <p className="text-overline mb-2 flex items-center gap-2 px-1 text-muted-foreground">
              {formatDay(d, { weekday: "long", day: "numeric", month: "short" })}
              {d === today && <span className="text-forest">· Today</span>}
            </p>
            {day.length === 0 ? <p className="text-callout rounded-2xl border border-dashed border-input bg-card px-4 py-3 text-muted-foreground">Nothing planned</p> : <MealList meals={day} />}
          </div>
        )
      })}
    </div>
  )
}

function MonthView({ date, meals, onPick }: { date: string; meals: PlannedMeal[]; onPick: (d: string) => void }) {
  const d0 = fromISO(date)
  const first = toISODate(new Date(d0.getFullYear(), d0.getMonth(), 1))
  const gridStart = startOfWeek(first)
  const month = d0.getMonth()
  const today = todayISO()
  const selectedMeals = meals.filter((m) => m.date === date).sort(byTime)
  return (
    <div className="space-y-4">
      <Surface padding="sm" className="px-2 pb-3">
        <div className="grid grid-cols-7 pb-1 text-center">
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((l) => (
            <span key={l} className="text-caption py-1.5 font-medium text-muted-foreground">
              {l}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)).map((d) => {
            const dm = meals.filter((m) => m.date === d)
            const recorded = dm.filter((m) => m.outcome && m.outcome !== "unresolved").length
            const inMonth = fromISO(d).getMonth() === month
            const selected = d === date
            return (
              <button
                key={d}
                onClick={() => onPick(d)}
                className="flex flex-col items-center gap-0.5 py-0.5"
                aria-pressed={selected}
                aria-label={`${formatDay(d)}: ${dm.length} meals planned${dm.length ? `, ${recorded} recorded` : ""}`}
              >
                <span
                  className={cn(
                    "tabular text-callout grid size-10 place-items-center rounded-full",
                    selected ? "bg-forest font-semibold text-ivory" : d === today ? "font-semibold text-forest ring-1 ring-forest" : inMonth ? "text-charcoal hover:bg-muted" : "text-muted-foreground/50",
                  )}
                >
                  {fromISO(d).getDate()}
                </span>
                <span className={cn("size-1.5 rounded-full", dm.length === 0 ? "bg-transparent" : recorded === dm.length ? "bg-forest" : "border border-forest")} aria-hidden />
              </button>
            )
          })}
        </div>
        <div className="text-caption mt-2 flex justify-center gap-4 text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full border border-forest" aria-hidden /> Planned
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-forest" aria-hidden /> All recorded
          </span>
        </div>
      </Surface>
      <Section title={formatDay(date, { weekday: "long", day: "numeric", month: "long" })}>
        {selectedMeals.length === 0 ? <p className="text-callout rounded-2xl border border-dashed border-input bg-card px-4 py-3 text-muted-foreground">Nothing planned</p> : <MealList meals={selectedMeals} />}
      </Section>
    </div>
  )
}

function PlanTools() {
  const prep = useApp((s) => s.plans.find((p) => p.id === s.activePlanId)?.meals.filter((m) => m.prepLater && !m.outcome).length ?? 0)
  const shopping = useApp((s) => s.shopping.filter((i) => !i.purchased).length)
  return (
    <Section title="Plan tools">
      <ListGroup>
        <ListRow href="/plan/shopping" icon={<ShoppingBasket />} title="Shopping list" description={shopping ? `${shopping} items to buy` : "Up to date"} />
        <ListRow href="/plan/prep" icon={<ChefHat />} title="Meal prep" description={prep ? `${prep} meals to prepare ahead` : "Batch cooking and storage"} />
        <ListRow
          href="/plan/pantry"
          icon={<Package />}
          title={
            <>
              Pantry <FeatureBadge feature="pantry" />
            </>
          }
          description="What you already have at home"
        />
        <ListRow
          href="/plan/autopilot"
          icon={<Sparkles />}
          title={
            <>
              Weekly Autopilot <FeatureBadge feature="autopilot" />
            </>
          }
          description="A draft of next week for you to approve"
        />
        <ListRow href="/plan/plans" icon={<Layers />} title="My plans" description="Active, drafts, history and suggestions" />
      </ListGroup>
    </Section>
  )
}
