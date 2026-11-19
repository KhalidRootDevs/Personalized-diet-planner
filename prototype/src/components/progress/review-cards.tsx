"use client"

// Shared cards for Progress and the Weekly Review: plan-review triggers (§17.4), post-meal feedback
// prompts (§17.5) and approved adjustments waiting for the next plan (§17.6). Nothing here changes
// a plan by itself; the user decides.
import { useEffect, useState } from "react"
import Link from "next/link"
import { Activity, Baby, MessageCircleHeart, RefreshCw, Scale, SkipForward, Undo2, Utensils, Wallet } from "lucide-react"
import { toast } from "sonner"
import { useActivePlan, useApp, useSelfProfile } from "@/lib/store"
import { useAreaD } from "@/lib/area-d-store"
import { useRecipeLookup } from "@/lib/area-c-utils"
import { track } from "@/lib/analytics"
import { addDays, formatDay, startOfWeek, todayISO } from "@/lib/date"
import { ageInMonths } from "@/lib/nutrition"
import { MEAL_LABEL } from "@/lib/planning"
import { lastNDays } from "@/lib/area-d-stats"
import type { PlannedMeal } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { IconTile, ListGroup, ListRow, Pill, Surface } from "@/components/app/page"
import { RecipeThumb } from "@/components/app/recipe-thumb"
import { feedingStage } from "@/components/child/feeding"
import { MealFeedbackSheet } from "./meal-feedback-sheet"

export interface ReviewTrigger {
  key: string
  icon: React.ReactNode
  title: string
  body: string
  href: string
  hrefLabel: string
  onAccept?: () => void
}

/** Plan-review triggers (§17.4), compared with a snapshot taken when the current plan became active. */
export function usePlanReviewTriggers(): ReviewTrigger[] {
  const self = useSelfProfile()
  const plan = useActivePlan()
  const profiles = useApp((s) => s.profiles)
  const upsertProfile = useApp((s) => s.upsertProfile)
  const weighIns = useAreaD((s) => s.weighIns)
  const checkIns = useAreaD((s) => s.checkIns)
  const baseline = useAreaD((s) => s.planBaseline)
  const setBaseline = useAreaD((s) => s.setPlanBaseline)
  const children = profiles.filter((p) => p.relation === "child")

  useEffect(() => {
    if (!plan || !self || baseline?.planId === plan.id) return
    setBaseline({
      planId: plan.id,
      weightKg: self.weightKg,
      activity: self.activity,
      budgetPerWeekBdt: self.budgetPerWeekBdt,
      childStages: Object.fromEntries(children.map((c) => [c.id, feedingStage(ageInMonths(c.dateOfBirth)).id])),
      dismissed: [],
    })
  }, [plan, self, baseline?.planId, children, setBaseline])

  if (!plan || !self || !baseline || baseline.planId !== plan.id) return []
  const week = startOfWeek(todayISO())
  const days = new Set(lastNDays(7))
  const out: ReviewTrigger[] = []

  const latest = [...weighIns].filter((w) => w.profileId === self.id && w.weightKg).sort((a, b) => a.date.localeCompare(b.date)).pop()
  if (latest?.weightKg && baseline.weightKg) {
    const diff = latest.weightKg - baseline.weightKg
    if (Math.abs(diff) >= Math.max(2, baseline.weightKg * 0.03))
      out.push({
        key: `weight:${latest.weightKg}`,
        icon: <Scale />,
        title: "Your recorded weight has changed",
        body: `About ${Math.abs(Math.round(diff * 10) / 10)} kg since this plan was made. Updating your profile keeps energy and protein ranges accurate.`,
        href: "/plan/generate",
        hrefLabel: "Update and review plan",
        onAccept: () => upsertProfile({ ...self, weightKg: latest.weightKg }),
      })
  }
  if (self.activity !== baseline.activity)
    out.push({ key: `activity:${self.activity}`, icon: <Activity />, title: "Your activity level changed", body: "A plan review recalculates your ranges with the new activity level.", href: "/plan/generate", hrefLabel: "Review plan" })
  const ex = checkIns.filter((c) => c.profileId === self.id && days.has(c.date) && c.exerciseMinutes !== undefined)
  if (ex.length >= 4 && ["sedentary", "light"].includes(self.activity ?? "") && ex.reduce((t, c) => t + c.exerciseMinutes!, 0) / ex.length >= 45)
    out.push({ key: `exercise:${week}`, icon: <Activity />, title: "You're recording more activity", body: "Your check-ins show more exercise than your profile's activity level. If that's your new routine, update it and review your plan.", href: "/profile/edit", hrefLabel: "Update activity" })
  if (self.budgetPerWeekBdt !== baseline.budgetPerWeekBdt)
    out.push({ key: `budget:${self.budgetPerWeekBdt}`, icon: <Wallet />, title: "Your food budget changed", body: `Now ৳${(self.budgetPerWeekBdt ?? 0).toLocaleString("en-US")} a week. A review can re-rank meals that already meet your needs.`, href: "/plan/generate", hrefLabel: "Review plan" })
  for (const c of children) {
    const stage = feedingStage(ageInMonths(c.dateOfBirth))
    const before = baseline.childStages[c.id]
    if (before && before !== stage.id)
      out.push({ key: `child:${c.id}:${stage.id}`, icon: <Baby />, title: `${c.name} has moved to a new stage`, body: `${stage.title}: ${stage.textures.toLowerCase()}. Their feeding guidance has updated.`, href: "/child", hrefLabel: "See feeding guidance" })
  }
  const skipped = plan.meals.filter((m) => days.has(m.date) && m.outcome === "skipped").length
  if (skipped >= 3)
    out.push({ key: `skips:${week}`, icon: <SkipForward />, title: "Several planned meals were skipped", body: `${skipped} this week. If the plan doesn't fit your days, a revised one could be easier — never stricter.`, href: "/plan/generate", hrefLabel: "Revise plan" })
  const hungry = checkIns.filter((c) => c.profileId === self.id && days.has(c.date) && c.hunger === "high").length
  if (hungry >= 3)
    out.push({ key: `hunger:${week}`, icon: <Utensils />, title: "You often felt hungry", body: `You reported high hunger on ${hungry} days. A plan review can check portions and snacks.`, href: "/plan/generate", hrefLabel: "Review plan" })

  return out.filter((t) => !baseline.dismissed.includes(t.key))
}

export function PlanReviewTriggers() {
  const triggers = usePlanReviewTriggers()
  const dismiss = useAreaD((s) => s.dismissTrigger)
  const first = triggers[0]?.key
  useEffect(() => {
    if (first) track("plan_review_suggested", { count: triggers.length })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per new first trigger
  }, [first])
  if (!triggers.length) return null
  return (
    <div className="space-y-2.5">
      {triggers.map((t) => (
        <Surface key={t.key}>
          <div className="flex gap-3">
            <IconTile tone="amber">{t.icon}</IconTile>
            <div className="min-w-0 flex-1">
              <p className="text-body font-medium">{t.title}</p>
              <p className="text-callout mt-1 text-muted-foreground">{t.body}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => dismiss(t.key)}>
              Not now
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href={t.href} onClick={() => t.onAccept?.()}>
                {t.hrefLabel}
              </Link>
            </Button>
          </div>
        </Surface>
      ))}
      <p className="text-caption px-1 text-muted-foreground">Your current plan stays active until you choose a new one.</p>
    </div>
  )
}

/** Recently eaten planned meals without feedback (§17.5). */
export function FeedbackPrompts({ max = 3 }: { max?: number }) {
  const plan = useActivePlan()
  const feedback = useAreaD((s) => s.mealFeedback)
  const lookup = useRecipeLookup()
  const [meal, setMeal] = useState<PlannedMeal | null>(null)
  const today = todayISO()
  const since = addDays(today, -3)
  const rated = new Set(feedback.map((f) => f.mealId))
  const eaten = (plan?.meals ?? [])
    .filter((m) => m.date >= since && m.date <= today && (m.outcome === "eaten_as_planned" || m.outcome === "eaten_modified") && !rated.has(m.id))
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
    .slice(0, max)
  if (!eaten.length) return <p className="text-callout px-1 text-muted-foreground">No recent planned meals waiting for feedback.</p>
  return (
    <>
      <ListGroup>
        {eaten.map((m) => {
          const r = lookup(m.recipeId)
          return (
            <ListRow
              key={m.id}
              onClick={() => setMeal(m)}
              icon={r ? <RecipeThumb recipe={r} size="sm" /> : <MessageCircleHeart />}
              iconTone="white"
              title={<span className="truncate">{r?.name ?? "Meal"}</span>}
              description={`${formatDay(m.date, { weekday: "short" })} · ${MEAL_LABEL[m.mealType]}`}
              trailing={<Pill tone="sage">Rate</Pill>}
            />
          )
        })}
      </ListGroup>
      <MealFeedbackSheet meal={meal} open={!!meal} onOpenChange={(o) => !o && setMeal(null)} />
    </>
  )
}

/** Approved adjustments waiting for the next plan, with undo (§17.6). */
export function PendingAdjustments() {
  const all = useAreaD((s) => s.approvedAdjustments)
  const items = all.filter((a) => a.status === "pending_next_plan")
  const undo = useAreaD((s) => s.undoAdjustment)
  if (!items.length) return null
  return (
    <ListGroup label="Approved for your next plan">
      {items.map((a) => (
        <ListRow
          key={a.id}
          icon={<RefreshCw />}
          iconTone="lime"
          title={a.title}
          description={`${a.detail} · applies when you generate your next plan`}
          trailing={
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                undo(a.id)
                track("adjustment_undone")
                toast("Adjustment undone")
              }}
            >
              <Undo2 /> Undo
            </Button>
          }
        />
      ))}
    </ListGroup>
  )
}
