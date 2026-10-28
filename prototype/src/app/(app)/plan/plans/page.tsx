"use client"

import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { Lightbulb, Pause, Play, Plus, ShieldAlert } from "lucide-react"
import { IconTile, PageBody, PageHeader, Pill, Section, Surface } from "@/components/app/page"
import { FeatureBadge, PremiumGate } from "@/components/app/badges"
import { InfoNote } from "@/components/app/alerts"
import { Button } from "@/components/ui/button"
import { useApp, useSelfProfile } from "@/lib/store"
import { adherence } from "@/lib/nutrition"
import { addDays, formatDay, todayISO } from "@/lib/date"
import { swapOptions } from "@/lib/planning"
import { cn } from "@/lib/utils"
import type { MealPlan } from "@/lib/types"

const STATUS_LABEL: Record<MealPlan["status"], string> = { draft: "Draft", active: "Active", paused: "Paused", archived: "Past" }

/** Plan history (§10.4) and adaptive suggestions the user approves (§42.13). */
export default function PlansPage() {
  const plans = useApp((s) => s.plans)
  const activatePlan = useApp((s) => s.activatePlan)
  const setPlanStatus = useApp((s) => s.setPlanStatus)
  const sorted = [...plans].sort((a, b) => order(a) - order(b) || b.createdAt.localeCompare(a.createdAt))

  return (
    <>
      <PageHeader
        title="My plans"
        back="/plan"
        action={
          <Button asChild size="sm" variant="outline">
            <Link href="/plan/generate">
              <Plus className="size-4" /> New plan
            </Link>
          </Button>
        }
      />
      <PageBody>
        <Section title="Suggested changes" badge={<FeatureBadge feature="adaptive" />}>
          <PremiumGate feature="adaptive" compact>
            <AdaptiveSuggestions />
          </PremiumGate>
        </Section>

        <Section title="All plans">
          <ul className="space-y-3">
            {sorted.map((p) => {
              const a = adherence(p.meals)
              return (
                <li key={p.id}>
                  <Surface className={cn(p.status === "active" && "border-forest/50")}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-body font-semibold">{p.title}</p>
                        <p className="text-caption text-muted-foreground">
                          {p.durationDays} days · {formatDay(p.startDate, { day: "numeric", month: "short" })} – {formatDay(addDays(p.startDate, p.durationDays - 1), { day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <Pill tone={p.status === "active" ? "forest" : p.status === "draft" ? "outline" : "neutral"}>{STATUS_LABEL[p.status]}</Pill>
                    </div>
                    {a.resolved > 0 && (
                      <p className="tabular text-callout mt-3 text-muted-foreground">
                        {a.completed} of {a.resolved} recorded meals eaten · {a.asPlanned} as planned, {a.modified + a.replaced} changed
                      </p>
                    )}
                    {!p.validation.safety && (
                      <p className="text-callout mt-3 flex items-center gap-1.5 font-medium text-safety">
                        <ShieldAlert className="size-4" /> Failed safety validation — can&apos;t be activated
                      </p>
                    )}
                    {p.validation.requiresReview && p.validation.safety && <p className="text-callout mt-3 text-caution">Waiting for professional review before it can be activated.</p>}
                    {p.status !== "archived" || p.validation.safety ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(p.status === "draft" || p.status === "archived") && (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={!p.validation.safety || p.validation.requiresReview}
                            onClick={() => {
                              activatePlan(p.id)
                              toast("Plan activated")
                            }}
                          >
                            <Play className="size-4" /> Activate
                          </Button>
                        )}
                        {p.status === "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPlanStatus(p.id, "paused")
                              toast("Plan paused — reminders stop until you resume")
                            }}
                          >
                            <Pause className="size-4" /> Pause
                          </Button>
                        )}
                        {p.status === "paused" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPlanStatus(p.id, "active")
                              toast("Plan resumed")
                            }}
                          >
                            <Play className="size-4" /> Resume
                          </Button>
                        )}
                      </div>
                    ) : null}
                  </Surface>
                </li>
              )
            })}
          </ul>
        </Section>
      </PageBody>
    </>
  )
}

function order(p: MealPlan) {
  return { active: 0, paused: 1, draft: 2, archived: 3 }[p.status]
}

function AdaptiveSuggestions() {
  const plan = useApp((s) => s.plans.find((p) => p.id === s.activePlanId))
  const pantry = useApp((s) => s.pantry)
  const replaceMeal = useApp((s) => s.replaceMeal)
  const profile = useSelfProfile()
  const [dismissed, setDismissed] = useState<string[]>([])
  if (!plan || !profile) return <p className="text-callout text-muted-foreground">Suggestions appear once you have an active plan.</p>

  const past = plan.meals.filter((m) => m.date < todayISO())
  const changedDinners = past.filter((m) => m.mealType === "dinner" && (m.outcome === "replaced" || m.outcome === "eaten_modified" || m.outcome === "skipped")).length
  const upcomingDinners = plan.meals.filter((m) => m.mealType === "dinner" && m.date >= todayISO() && !m.outcome)
  const suggestions = [
    {
      id: "quick_dinner",
      title: "Quicker dinners on workdays",
      why: `${changedDinners || 2} dinners were changed or skipped recently. Shorter recipes may fit your evenings better.`,
      apply: () => {
        let n = 0
        for (const m of upcomingDinners) {
          const q = swapOptions(m, profile, "quick", pantry)[0]
          if (q && q.deltaMinutes < 0) {
            replaceMeal(m.id, q.recipe.id)
            n++
          }
        }
        return n ? `${n} upcoming dinners swapped for quicker recipes` : "Your dinners are already the quickest safe options"
      },
    },
    {
      id: "repeat_breakfast",
      title: "Keep breakfasts you enjoy",
      why: "You eat breakfast as planned most days. We can repeat your favorites instead of rotating.",
      apply: () => "We'll favor your usual breakfasts in the next plan",
    },
  ].filter((s) => !dismissed.includes(s.id))

  if (!suggestions.length) return <p className="text-callout text-muted-foreground">No suggestions right now.</p>

  return (
    <div className="space-y-3">
      {suggestions.map((s) => (
        <Surface key={s.id}>
          <div className="flex gap-3">
            <IconTile>
              <Lightbulb />
            </IconTile>
            <div className="min-w-0 flex-1">
              <p className="text-body font-semibold">{s.title}</p>
              <p className="text-callout mt-0.5 text-muted-foreground">{s.why}</p>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    toast(s.apply())
                    setDismissed([...dismissed, s.id])
                  }}
                >
                  Apply
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDismissed([...dismissed, s.id])}>
                  Not now
                </Button>
              </div>
            </div>
          </div>
        </Surface>
      ))}
      <InfoNote>Suggestions never make your plan stricter because a target was missed. Nothing changes until you approve it.</InfoNote>
    </div>
  )
}
