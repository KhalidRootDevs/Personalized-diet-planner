"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, RefreshCw, Sparkles, Wand2 } from "lucide-react"
import { toast } from "sonner"
import { formatDay } from "@/lib/date"
import { adherence } from "@/lib/nutrition"
import { useActivePlan, useApp, useSelfProfile } from "@/lib/store"
import { dayStats, lastNDays, mealsInRange, recordConfidence } from "@/lib/area-d-stats"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FeatureBadge, PremiumGate } from "@/components/app/badges"
import { InfoNote } from "@/components/app/alerts"
import { PageBody, PageHeader, Section } from "@/components/app/page"

const PRIORITIES = [
  "Log meals on more days",
  "Prepare breakfast the night before",
  "Add a vegetable to dinner",
  "Keep lunches quick on workdays",
  "Keep things as they are",
]

/** One Weekly Review screen that grows by phase (§17.6). Nothing changes until the user approves. */
export default function WeeklyReviewPage() {
  const self = useSelfProfile()
  const plan = useActivePlan()
  const journal = useApp((s) => s.journal)
  const habits = useApp((s) => s.habits)
  const [priority, setPriority] = useState<string | null>(null)
  const [suggestion, setSuggestion] = useState<"open" | "accepted" | "dismissed">("open")

  const days = lastNDays(7)
  const stats = self ? dayStats(journal, plan, self.id, days) : []
  const ad = adherence(mealsInRange(plan, days))
  const loggedDays = stats.filter((s) => s.logged).length
  const conf = self ? days.map((d) => recordConfidence(journal, plan, self.id, d)) : []
  const completeDays = conf.filter((c) => c.level === "Complete" || c.level === "Mostly complete").length
  const habitDone = habits.reduce((acc, h) => acc + days.filter((d) => h.days[d]).length, 0)

  return (
    <>
      <PageHeader title="Weekly review" subtitle={`${formatDay(days[0], { day: "numeric", month: "short" })} – ${formatDay(days[6], { day: "numeric", month: "short" })}`} back="/progress" />
      <PageBody>
        <Section title="Your week" badge={<FeatureBadge feature="weekly_review_basic" />}>
          <Card className="gap-3">
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-forest" /> You logged meals on <b className="tabular">{loggedDays}</b> of 7 days.
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-forest" /> {ad.resolved ? <>You ate <b className="tabular">{ad.completed}</b> of <b className="tabular">{ad.resolved}</b> recorded planned meals in some form.</> : "No meal outcomes recorded yet."}
              </li>
              {ad.replaced + ad.modified > 0 && (
                <li className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-forest" /> You adapted <b className="tabular">{ad.replaced + ad.modified}</b> meals to fit your day.
                </li>
              )}
            </ul>
            <p className="text-xs text-muted-foreground">Based only on what you recorded. Unrecorded meals aren&apos;t counted as missed.</p>
          </Card>
        </Section>

        <Section title="Choose one focus for next week">
          <div className="space-y-2" role="radiogroup" aria-label="Focus for next week">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                role="radio"
                aria-checked={priority === p}
                onClick={() => setPriority(p)}
                className={cn("flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left text-sm", priority === p && "border-forest bg-sage/40")}
              >
                <span className={cn("grid size-5 place-items-center rounded-full border", priority === p && "border-forest bg-forest text-white")}>{priority === p && <Check className="size-3" />}</span>
                {p}
              </button>
            ))}
          </div>
          <Button className="w-full" disabled={!priority} onClick={() => toast.success("Focus saved for next week")}>
            Save focus
          </Button>
        </Section>

        <Section title="Does your plan still fit?">
          <Card className="flex-row items-center gap-3">
            <RefreshCw className="size-5 shrink-0 text-forest" />
            <p className="flex-1 text-sm">If your schedule, budget or goals changed, you can create a revised plan. Your current plan stays until you activate a new one.</p>
          </Card>
          <Button asChild variant="outline" className="w-full">
            <Link href="/plan/generate">Revise my plan</Link>
          </Button>
        </Section>

        <Section title="Habits" badge={<FeatureBadge feature="habits" />}>
          <PremiumGate feature="habits" compact>
            <Card className="gap-2">
              <p className="text-sm">
                You checked off habits <b className="tabular">{habitDone}</b> times across {habits.length} habits.
              </p>
              <Link href="/progress/habits" className="text-sm font-medium text-forest underline underline-offset-2">
                Review habits
              </Link>
            </Card>
          </PremiumGate>
        </Section>

        <Section title="Insights" badge={<FeatureBadge feature="insights" />}>
          <PremiumGate feature="insights" compact>
            <Card className="gap-2">
              <p className="text-sm">On days you prepared breakfast the night before, your recorded breakfasts were more often eaten as planned.</p>
              <p className="text-xs text-muted-foreground">A pattern in your records, not proof of cause.</p>
              <Link href="/progress/insights" className="text-sm font-medium text-forest underline underline-offset-2">
                See all insights
              </Link>
            </Card>
          </PremiumGate>
        </Section>

        <Section title="Suggested adjustment" badge={<FeatureBadge feature="adaptive" />}>
          <PremiumGate feature="adaptive" compact>
            {suggestion === "open" ? (
              <Card className="gap-3">
                <p className="flex items-center gap-2 font-medium">
                  <Sparkles className="size-4 text-forest" /> Swap weekday lunches for quicker options
                </p>
                <p className="text-sm text-muted-foreground">
                  Why: you replaced several longer lunches this week. Every quicker option has passed the same safety and nutrition checks as your current plan.
                </p>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => { setSuggestion("accepted"); toast.success("Adjustment approved. Your next week's lunches will update.") }}>
                    Approve
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setSuggestion("dismissed")}>
                    Not now
                  </Button>
                </div>
              </Card>
            ) : (
              <InfoNote>{suggestion === "accepted" ? "Approved. You can undo this from your plan at any time." : "Dismissed. Your plan stays as it is."}</InfoNote>
            )}
          </PremiumGate>
        </Section>

        <Section title="Weekly Autopilot" badge={<FeatureBadge feature="autopilot" />}>
          <PremiumGate feature="autopilot" compact>
            <Card className="flex-row items-center gap-3">
              <Wand2 className="size-5 shrink-0 text-forest" />
              <p className="flex-1 text-sm">Prepare next week&apos;s draft plan and shopping list for you to review.</p>
              <Button asChild size="sm" variant="outline">
                <Link href="/plan/autopilot">Open</Link>
              </Button>
            </Card>
          </PremiumGate>
        </Section>

        <Section title="Record confidence" badge={<FeatureBadge feature="confidence" />}>
          <Card className="gap-2">
            <p className="text-sm">
              <b className="tabular">{completeDays}</b> of 7 days have complete or mostly complete records.
            </p>
            <p className="text-xs text-muted-foreground">This describes how complete your food records are, not your health.</p>
            <Link href="/progress/insights#confidence" className="text-sm font-medium text-forest underline underline-offset-2">
              How this works
            </Link>
          </Card>
        </Section>
      </PageBody>
    </>
  )
}
