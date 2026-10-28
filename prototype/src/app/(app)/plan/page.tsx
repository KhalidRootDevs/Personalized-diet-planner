"use client"

import Link from "next/link"
import { useState } from "react"
import { CalendarDays, ChevronLeft, ChevronRight, ChefHat, Layers, Package, ShoppingBasket, Sparkles, Wand2 } from "lucide-react"
import { PageBody, PageHeader, Section, EmptyState } from "@/components/app/page"
import { MealActionsSheet } from "@/components/plan/meal-actions"
import { RecipeThumb } from "@/components/app/recipe-thumb"
import { FeatureBadge } from "@/components/app/badges"
import { CautionNote, InfoNote } from "@/components/app/alerts"
import { Button } from "@/components/ui/button"
import { useActivePlan, useActiveProfile, useApp } from "@/lib/store"
import { MEAL_LABEL } from "@/lib/planning"
import { addDays, formatDay, formatTime, fromISO, startOfWeek, toISODate, todayISO } from "@/lib/date"
import { fmt, recipeNutrition } from "@/lib/nutrition"
import { STATUS_STYLE, mealStatus, useRecipeLookup } from "@/lib/area-c-utils"
import { cn } from "@/lib/utils"
import type { PlannedMeal } from "@/lib/types"

type View = "day" | "week" | "month"

/** Plan tab: meal calendar with day/week/month views (§14, FR-016). */
export default function PlanPage() {
  const plan = useActivePlan()
  const profile = useActiveProfile()
  const [view, setView] = useState<View>("day")
  const [date, setDate] = useState(todayISO())

  if (profile && profile.type !== "adult") {
    return (
      <>
        <PageHeader title="Plan" large />
        <PageBody>
          <InfoNote title={`${profile.name}'s feeding is planned in the baby module`}>
            Infant plans follow age-appropriate textures and responsive feeding, not adult meal plans (§12).
          </InfoNote>
          <Button asChild className="w-full">
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
          <Shortcuts />
        </PageBody>
      </>
    )
  }

  const step = view === "day" ? 1 : view === "week" ? 7 : 28
  const planEnd = addDays(plan.startDate, plan.durationDays - 1)

  return (
    <>
      <PageHeader
        title="Plan"
        large
        subtitle={
          <Link href="/plan/plans" className="underline-offset-2 hover:underline">
            {plan.title} · {formatDay(plan.startDate, { day: "numeric", month: "short" })}–{formatDay(planEnd, { day: "numeric", month: "short" })}
          </Link>
        }
        action={
          <Button asChild size="sm" variant="outline">
            <Link href="/plan/generate">
              <Wand2 /> New plan
            </Link>
          </Button>
        }
      />
      <PageBody>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1" role="tablist" aria-label="Calendar view">
          {(["day", "week", "month"] as View[]).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={cn("h-9 rounded-lg text-sm font-medium capitalize", view === v ? "bg-card text-forest shadow-xs" : "text-muted-foreground")}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <Button size="icon-sm" variant="ghost" aria-label="Previous" onClick={() => setDate(addDays(date, -step))}>
            <ChevronLeft />
          </Button>
          <button className="text-sm font-semibold" onClick={() => setDate(todayISO())}>
            {view === "day" && (date === todayISO() ? `Today · ${formatDay(date)}` : formatDay(date, { weekday: "long", day: "numeric", month: "long" }))}
            {view === "week" && `Week of ${formatDay(startOfWeek(date), { day: "numeric", month: "short" })}`}
            {view === "month" && fromISO(date).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
          </button>
          <Button size="icon-sm" variant="ghost" aria-label="Next" onClick={() => setDate(addDays(date, step))}>
            <ChevronRight />
          </Button>
        </div>

        {view === "day" && <DayView date={date} onPick={setDate} meals={plan.meals} />}
        {view === "week" && <WeekView date={date} meals={plan.meals} onPick={(d) => { setDate(d); setView("day") }} />}
        {view === "month" && <MonthView date={date} meals={plan.meals} onPick={(d) => { setDate(d); setView("day") }} />}

        {plan.validation.warnings.length > 0 && (
          <CautionNote title="Plan notes">
            <ul className="list-disc pl-4">
              {plan.validation.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </CautionNote>
        )}

        <Shortcuts />
      </PageBody>
    </>
  )
}

function DayStrip({ date, onPick, meals }: { date: string; onPick: (d: string) => void; meals: PlannedMeal[] }) {
  const start = startOfWeek(date)
  return (
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: 7 }, (_, i) => addDays(start, i)).map((d) => {
        const has = meals.some((m) => m.date === d)
        const selected = d === date
        return (
          <button
            key={d}
            onClick={() => onPick(d)}
            aria-pressed={selected}
            className={cn("flex flex-col items-center rounded-xl py-2 text-xs", selected ? "bg-forest text-primary-foreground" : "bg-card text-foreground", d === todayISO() && !selected && "ring-1 ring-forest")}
          >
            <span className={selected ? "" : "text-muted-foreground"}>{formatDay(d, { weekday: "narrow" })}</span>
            <span className="tabular text-base font-semibold">{fromISO(d).getDate()}</span>
            <span className={cn("mt-0.5 size-1.5 rounded-full", has ? (selected ? "bg-primary-foreground" : "bg-forest") : "bg-transparent")} />
          </button>
        )
      })}
    </div>
  )
}

function DayView({ date, onPick, meals }: { date: string; onPick: (d: string) => void; meals: PlannedMeal[] }) {
  const lookup = useRecipeLookup()
  const day = meals.filter((m) => m.date === date).sort((a, b) => a.time.localeCompare(b.time))
  const kcal = day.reduce((s, m) => {
    const r = lookup(m.recipeId)
    return s + (r ? recipeNutrition(r, m.servings).energyKcal : 0)
  }, 0)
  return (
    <div className="space-y-3">
      <DayStrip date={date} onPick={onPick} meals={meals} />
      {day.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No meals planned for this day.</p>
      ) : (
        <>
          <p className="tabular text-sm text-muted-foreground">
            {day.length} meals planned · about {fmt.kcal(kcal)} (estimate)
          </p>
          <ol className="space-y-2">
            {day.map((m) => (
              <li key={m.id}>
                <MealRow meal={m} />
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  )
}

function MealRow({ meal }: { meal: PlannedMeal }) {
  const lookup = useRecipeLookup()
  const r = lookup(meal.recipeId)
  if (!r) return null
  const s = mealStatus(meal)
  return (
    <MealActionsSheet meal={meal}>
      <button className="flex w-full items-center gap-3 rounded-2xl border bg-card p-3 text-left hover:bg-muted/40">
        <RecipeThumb recipe={r} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">
            {MEAL_LABEL[meal.mealType]} · {formatTime(meal.time)}
          </p>
          <p className="truncate font-medium">{r.name}</p>
          <p className="tabular text-xs text-muted-foreground">
            ~{Math.round(recipeNutrition(r, meal.servings).energyKcal)} kcal · {r.prepMinutes + r.cookMinutes} min
            {meal.servings !== 1 && ` · ${meal.servings} servings`}
            {meal.prepLater && " · prep ahead"}
          </p>
        </div>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS_STYLE[s.tone])}>{s.label}</span>
      </button>
    </MealActionsSheet>
  )
}

function WeekView({ date, meals, onPick }: { date: string; meals: PlannedMeal[]; onPick: (d: string) => void }) {
  const lookup = useRecipeLookup()
  const start = startOfWeek(date)
  return (
    <div className="space-y-2">
      {Array.from({ length: 7 }, (_, i) => addDays(start, i)).map((d) => {
        const day = meals.filter((m) => m.date === d).sort((a, b) => a.time.localeCompare(b.time))
        return (
          <button key={d} onClick={() => onPick(d)} className={cn("w-full rounded-2xl border bg-card p-3 text-left", d === todayISO() && "border-forest")}>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-sm font-semibold">{formatDay(d)}</p>
              {d === todayISO() && <span className="text-xs font-medium text-forest">Today</span>}
            </div>
            {day.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nothing planned</p>
            ) : (
              <ul className="space-y-1">
                {day.map((m) => {
                  const s = mealStatus(m)
                  return (
                    <li key={m.id} className="flex items-center gap-2 text-sm">
                      <span className={cn("size-2 shrink-0 rounded-full", s.tone === "planned" ? "border border-muted-grey" : s.tone === "eaten" ? "bg-forest" : s.tone === "changed" ? "bg-terracotta" : "bg-muted-grey")} aria-hidden />
                      <span className="w-20 shrink-0 text-xs text-muted-foreground">{MEAL_LABEL[m.mealType]}</span>
                      <span className="truncate">{lookup(m.recipeId)?.name}</span>
                      <span className="sr-only">({s.label})</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </button>
        )
      })}
      <p className="text-xs text-muted-foreground">Filled dot: eaten · terracotta: changed or replaced · outline: planned.</p>
    </div>
  )
}

function MonthView({ date, meals, onPick }: { date: string; meals: PlannedMeal[]; onPick: (d: string) => void }) {
  const d0 = fromISO(date)
  const first = toISODate(new Date(d0.getFullYear(), d0.getMonth(), 1))
  const gridStart = startOfWeek(first)
  const month = d0.getMonth()
  return (
    <div>
      <div className="mb-1 grid grid-cols-7 text-center text-xs text-muted-foreground">
        {["M", "T", "W", "T", "F", "S", "S"].map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)).map((d) => {
          const dm = meals.filter((m) => m.date === d)
          const done = dm.filter((m) => m.outcome && m.outcome !== "skipped" && m.outcome !== "unresolved").length
          const inMonth = fromISO(d).getMonth() === month
          return (
            <button
              key={d}
              onClick={() => onPick(d)}
              className={cn("flex aspect-square flex-col items-center justify-center rounded-lg text-sm", inMonth ? "bg-card" : "text-muted-foreground/60", d === todayISO() && "ring-1 ring-forest")}
              aria-label={`${formatDay(d)}: ${dm.length} meals planned${dm.length ? `, ${done} recorded` : ""}`}
            >
              <span className="tabular">{fromISO(d).getDate()}</span>
              {dm.length > 0 && <span className="tabular text-[10px] text-forest">{done}/{dm.length}</span>}
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Numbers show meals recorded out of meals planned.</p>
    </div>
  )
}

function Shortcuts() {
  const prep = useApp((s) => s.plans.find((p) => p.id === s.activePlanId)?.meals.filter((m) => m.prepLater && !m.outcome).length ?? 0)
  const shopping = useApp((s) => s.shopping.filter((i) => !i.purchased).length)
  const items = [
    { href: "/plan/shopping", icon: <ShoppingBasket />, title: "Shopping list", hint: shopping ? `${shopping} to buy` : "Up to date" },
    { href: "/plan/prep", icon: <ChefHat />, title: "Meal prep", hint: prep ? `${prep} meals to prep` : "Batch cooking" },
    { href: "/plan/pantry", icon: <Package />, title: "Pantry", hint: "What you have", feature: "pantry" as const },
    { href: "/plan/autopilot", icon: <Sparkles />, title: "Weekly Autopilot", hint: "Next week draft", feature: "autopilot" as const },
    { href: "/plan/plans", icon: <Layers />, title: "My plans", hint: "History & suggestions" },
  ]
  return (
    <Section title="Plan tools">
      <div className="grid grid-cols-2 gap-2">
        {items.map((i) => (
          <Link key={i.href} href={i.href} className="flex flex-col gap-2 rounded-2xl border bg-card p-3 hover:bg-muted/40">
            <span className="flex items-center justify-between">
              <span className="grid size-9 place-items-center rounded-lg bg-sage text-forest [&_svg]:size-4.5">{i.icon}</span>
              {i.feature && <FeatureBadge feature={i.feature} />}
            </span>
            <span>
              <span className="block text-sm font-medium">{i.title}</span>
              <span className="block text-xs text-muted-foreground">{i.hint}</span>
            </span>
          </Link>
        ))}
      </div>
    </Section>
  )
}
