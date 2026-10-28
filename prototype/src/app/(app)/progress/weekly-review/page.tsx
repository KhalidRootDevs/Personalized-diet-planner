"use client"

import { useState } from "react"
import Link from "next/link"
import { CalendarCheck, Check, ClipboardList, ListChecks, NotebookPen, RefreshCw, ShieldCheck, Shuffle, Sparkles, Wand2 } from "lucide-react"
import { toast } from "sonner"
import { formatDay } from "@/lib/date"
import { adherence } from "@/lib/nutrition"
import { useActivePlan, useApp, useSelfProfile } from "@/lib/store"
import { dayStats, lastNDays, mealsInRange, recordConfidence } from "@/lib/area-d-stats"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { FeatureBadge, PremiumGate, useFeature } from "@/components/app/badges"
import { InfoNote } from "@/components/app/alerts"
import { IconTile, ListGroup, ListRow, PageBody, PageHeader, Pill, Section, SectionLink, Surface } from "@/components/app/page"

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
  const insightsAllowed = useFeature("insights").allowed

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
        <Section title="Your week" badge={<FeatureBadge feature="weekly_review_basic" />} description="Based only on what you recorded. Unrecorded meals aren't counted as missed.">
          <ListGroup>
            <ListRow icon={<NotebookPen />} title="Meals logged" description="Days with at least one entry" trailing={<span className="tabular text-headline">{loggedDays}<span className="text-caption font-normal text-muted-foreground"> / 7</span></span>} />
            <ListRow
              icon={<CalendarCheck />}
              title="Planned meals eaten"
              description={ad.resolved ? "In any form, including changes" : "No meal outcomes recorded yet"}
              trailing={ad.resolved ? <span className="tabular text-headline">{ad.completed}<span className="text-caption font-normal text-muted-foreground"> / {ad.resolved}</span></span> : undefined}
            />
            {ad.replaced + ad.modified > 0 && <ListRow icon={<Shuffle />} title="Meals adapted to your day" description="Changed or replaced to fit real life" trailing={<span className="tabular text-headline">{ad.replaced + ad.modified}</span>} />}
          </ListGroup>
        </Section>

        <Section title="Choose one focus for next week" description="Small, specific goals are easier to keep.">
          <div className="space-y-2" role="radiogroup" aria-label="Focus for next week">
            {PRIORITIES.map((p) => {
              const on = priority === p
              return (
                <button
                  key={p}
                  role="radio"
                  aria-checked={on}
                  onClick={() => setPriority(p)}
                  className={cn("text-body flex min-h-14 w-full items-center gap-3 rounded-2xl border bg-card px-4 py-3 text-left transition-colors", on ? "border-forest bg-sage/40 font-medium" : "border-border/80 hover:bg-muted/50")}
                >
                  <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors", on ? "border-forest bg-forest text-ivory" : "border-input bg-card")}>{on && <Check className="size-3.5" strokeWidth={3} />}</span>
                  {p}
                </button>
              )
            })}
          </div>
          <Button variant="secondary" className="w-full" disabled={!priority} onClick={() => toast.success("Focus saved for next week")}>
            Save focus
          </Button>
        </Section>

        <Section title="Does your plan still fit?">
          <Surface tone="sage" padding="lg">
            <div className="flex gap-3">
              <IconTile tone="white">
                <RefreshCw />
              </IconTile>
              <p className="text-callout flex-1 text-charcoal/90">If your schedule, budget or goals changed, create a revised plan. Your current plan stays active until you choose to switch.</p>
            </div>
            <Button asChild className="mt-4 w-full">
              <Link href="/plan/generate">Revise my plan</Link>
            </Button>
          </Surface>
        </Section>

        <Section title="Habits" badge={<FeatureBadge feature="habits" />}>
          <PremiumGate variant="row" feature="habits">
            <ListGroup>
              <ListRow href="/progress/habits" icon={<ListChecks />} title="Review your habits" description={`Checked off ${habitDone} times across ${habits.length} ${habits.length === 1 ? "habit" : "habits"}`} />
            </ListGroup>
          </PremiumGate>
        </Section>

        <Section title="Insights" badge={<FeatureBadge feature="insights" />} action={insightsAllowed && <SectionLink href="/progress/insights">See all</SectionLink>}>
          <PremiumGate variant="row" feature="insights">
            <Surface>
              <div className="flex gap-3">
                <IconTile>
                  <Sparkles />
                </IconTile>
                <div className="min-w-0 flex-1">
                  <p className="text-body font-medium">Prepared breakfasts were more often eaten</p>
                  <p className="text-callout mt-1 text-muted-foreground">On days you prepared breakfast the night before, your recorded breakfasts were more often eaten as planned.</p>
                  <Pill tone="neutral" className="mt-3">
                    Correlation, not cause
                  </Pill>
                </div>
              </div>
            </Surface>
          </PremiumGate>
        </Section>

        <Section title="Suggested adjustment" badge={<FeatureBadge feature="adaptive" />}>
          <PremiumGate variant="row" feature="adaptive">
            {suggestion === "open" ? (
              <Surface>
                <div className="flex gap-3">
                  <IconTile>
                    <ClipboardList />
                  </IconTile>
                  <div className="min-w-0 flex-1">
                    <p className="text-body font-medium">Swap weekday lunches for quicker options</p>
                    <p className="text-callout mt-1 text-muted-foreground">You replaced several longer lunches this week. Every quicker option has passed the same safety and nutrition checks as your current plan.</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => setSuggestion("dismissed")}>
                    Not now
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSuggestion("accepted")
                      toast.success("Adjustment approved. Next week's lunches will update.")
                    }}
                  >
                    Approve
                  </Button>
                </div>
              </Surface>
            ) : (
              <InfoNote>{suggestion === "accepted" ? "Approved. You can undo this from your plan at any time." : "Dismissed. Your plan stays as it is."}</InfoNote>
            )}
          </PremiumGate>
        </Section>

        <Section title="Weekly Autopilot" badge={<FeatureBadge feature="autopilot" />}>
          <PremiumGate variant="row" feature="autopilot">
            <ListGroup>
              <ListRow href="/plan/autopilot" icon={<Wand2 />} title="Prepare next week" description="A draft plan and shopping list for you to review" />
            </ListGroup>
          </PremiumGate>
        </Section>

        <Section title="Record confidence" badge={<FeatureBadge feature="confidence" />}>
          <ListGroup>
            <ListRow
              href="/progress/insights#confidence"
              icon={<ShieldCheck />}
              title={
                <span>
                  <span className="tabular">{completeDays}</span> of 7 days well recorded
                </span>
              }
              description="How complete your records are, not your health"
            />
          </ListGroup>
        </Section>
      </PageBody>
    </>
  )
}
