"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CalendarCheck, Check, ClipboardList, ListChecks, NotebookPen, Repeat2, ShieldCheck, Shuffle, Sparkles, Target, Wand2 } from "lucide-react"
import { toast } from "sonner"
import { formatDay, startOfWeek, todayISO } from "@/lib/date"
import { adherence } from "@/lib/nutrition"
import { useActivePlan, useApp, useSelfProfile } from "@/lib/store"
import { useAreaD, useAreaDSync } from "@/lib/area-d-store"
import { track } from "@/lib/analytics"
import { dayStats, lastNDays, mealsInRange, recordConfidence } from "@/lib/area-d-stats"
import { adjustmentSuggestions, computeInsights, recurringPatterns, type InsightInput } from "@/lib/insights"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { FeatureBadge, PremiumGate, useFeature } from "@/components/app/badges"
import { InfoNote } from "@/components/app/alerts"
import { IconTile, ListGroup, ListRow, PageBody, PageHeader, Pill, Section, SectionLink, Surface } from "@/components/app/page"
import { FeedbackPrompts, PendingAdjustments, PlanReviewTriggers } from "@/components/progress/review-cards"

const BASE_PRIORITIES = ["Log meals on more days", "Prepare breakfast the night before", "Add a vegetable to dinner", "Keep lunches quick on workdays", "Keep things as they are"]

/** One Weekly Review screen that grows by phase (§17.6). Nothing changes until the user approves. */
export default function WeeklyReviewPage() {
  useAreaDSync()
  const self = useSelfProfile()
  const plan = useActivePlan()
  const journal = useApp((s) => s.journal)
  const water = useApp((s) => s.water)
  const habits = useApp((s) => s.habits)
  const feedback = useAreaD((s) => s.mealFeedback)
  const checkIns = useAreaD((s) => s.checkIns)
  const focus = useAreaD((s) => s.weeklyFocus)
  const setFocus = useAreaD((s) => s.setWeeklyFocus)
  const approved = useAreaD((s) => s.approvedAdjustments)
  const dismissed = useAreaD((s) => s.dismissedAdjustments)
  const approve = useAreaD((s) => s.approveAdjustment)
  const dismiss = useAreaD((s) => s.dismissAdjustment)
  const insightsAllowed = useFeature("insights").allowed
  const thisWeek = startOfWeek(todayISO())
  const currentFocus = focus?.weekStart === thisWeek ? focus.text : null
  const [priority, setPriority] = useState<string | null>(currentFocus)

  useEffect(() => {
    track("weekly_review_viewed")
  }, [])

  const days = lastNDays(7)
  const stats = self ? dayStats(journal, plan, self.id, days) : []
  const ad = adherence(mealsInRange(plan, days))
  const loggedDays = stats.filter((s) => s.logged).length
  const conf = self ? days.map((d) => recordConfidence(journal, plan, self.id, d)) : []
  const completeDays = conf.filter((c) => c.level === "Complete" || c.level === "Mostly complete").length
  const habitDone = habits.reduce((acc, h) => acc + days.filter((d) => h.days[d]).length, 0)

  const input: InsightInput | null = self ? { journal, plan, profile: self, water, feedback, checkIns, days } : null
  const patterns = input ? recurringPatterns(input) : []
  const insights = input ? computeInsights(input) : []
  const handled = new Set([...approved.filter((a) => a.status === "pending_next_plan").map((a) => a.key), ...dismissed])
  const suggestions = input ? adjustmentSuggestions(input).filter((s) => !handled.has(s.key)) : []
  const priorities = Array.from(new Set([...(currentFocus ? [currentFocus] : []), ...suggestions.slice(0, 1).map((s) => s.title), ...BASE_PRIORITIES]))

  return (
    <>
      <PageHeader title="Weekly review" subtitle={`${formatDay(days[0], { day: "numeric", month: "short" })} – ${formatDay(days[6], { day: "numeric", month: "short" })}`} back="/progress" />
      <PageBody>
        {currentFocus && (
          <Surface tone="sage" className="flex items-center gap-3">
            <IconTile tone="white">
              <Target />
            </IconTile>
            <div className="min-w-0 flex-1">
              <p className="text-overline text-lime-text">Your focus this week</p>
              <p className="text-body font-medium">{currentFocus}</p>
              <p className="text-caption text-muted-foreground">Saved {new Date(focus!.savedAt).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</p>
            </div>
          </Surface>
        )}

        <Section title="Your week" badge={<FeatureBadge feature="weekly_review_basic" />} description="Based only on what you recorded. Unrecorded meals aren't counted as missed.">
          <Surface tone="lime" padding="lg" className="relative overflow-hidden">
            <span className="absolute -top-12 -right-12 size-40 rounded-full bg-white/25" aria-hidden />
            <dl className="relative grid grid-cols-3 gap-3">
              <WeekStat icon={<NotebookPen />} label="Days with meals logged" value={loggedDays} of={7} />
              <WeekStat icon={<CalendarCheck />} label={ad.resolved ? "Planned meals eaten, any form" : "No meal outcomes yet"} value={ad.resolved ? ad.completed : "–"} of={ad.resolved || undefined} />
              <WeekStat icon={<Shuffle />} label="Meals adapted to your day" value={ad.replaced + ad.modified} />
            </dl>
          </Surface>
        </Section>

        <Section title="Recurring patterns" badge={<FeatureBadge feature="weekly_review_basic" />}>
          {patterns.length === 0 ? (
            <InfoNote>No repeating patterns this week. Patterns appear once something happens at least twice.</InfoNote>
          ) : (
            <ListGroup>
              {patterns.map((p) => (
                <ListRow key={p.text} icon={<Repeat2 />} iconTone="sky" title={p.text} description={p.detail} />
              ))}
            </ListGroup>
          )}
        </Section>

        <Section title="How were your meals?" description="Rate a few recent planned meals. It helps shape the next plan.">
          <FeedbackPrompts />
        </Section>

        <Section title={currentFocus ? "Change your focus" : "Choose one focus for this week"} description="Small, specific goals are easier to keep.">
          <div className="space-y-2" role="radiogroup" aria-label="Focus for this week">
            {priorities.map((p) => {
              const on = priority === p
              return (
                <button
                  key={p}
                  role="radio"
                  aria-checked={on}
                  onClick={() => setPriority(p)}
                  className={cn("text-body flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 bg-card px-4 py-3 text-left shadow-card transition-colors", on ? "border-lime bg-sage font-medium" : "border-transparent hover:bg-muted/50")}
                >
                  <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors", on ? "border-forest bg-forest text-white" : "border-input bg-card")}>{on && <Check className="size-3.5" strokeWidth={3} />}</span>
                  {p}
                </button>
              )
            })}
          </div>
          <Button
            variant="secondary"
            className="w-full"
            disabled={!priority || priority === currentFocus}
            onClick={() => {
              if (!priority) return
              setFocus(priority)
              track("weekly_focus_saved")
              toast.success("Focus saved", { description: "You'll see it on Progress and here until next week." })
            }}
          >
            {priority && priority === currentFocus ? "Focus saved" : "Save focus"}
          </Button>
        </Section>

        <Section title="Does your plan still fit?">
          <PlanReviewTriggers />
          <ListGroup>
            <ListRow href="/plan/generate" icon={<ClipboardList />} iconTone="lime" title="Revise my plan" description="If your schedule, budget or goals changed. Your current plan stays active until you switch." />
          </ListGroup>
        </Section>

        <Section title="Habits" badge={<FeatureBadge feature="habits" />}>
          <PremiumGate variant="row" feature="habits">
            <ListGroup>
              <ListRow href="/progress/habits#review" icon={<ListChecks />} title="Weekly habit review" description={`Checked off ${habitDone} times across ${habits.length} ${habits.length === 1 ? "habit" : "habits"} · choose 1–2 priorities`} />
            </ListGroup>
          </PremiumGate>
        </Section>

        <Section title="Insights" badge={<FeatureBadge feature="insights" />} action={insightsAllowed && <SectionLink href="/progress/insights">See all</SectionLink>}>
          <PremiumGate variant="row" feature="insights">
            {insights[0] ? (
              <Surface>
                <div className="flex gap-3">
                  <IconTile>
                    <Sparkles />
                  </IconTile>
                  <div className="min-w-0 flex-1">
                    <p className="text-body font-medium">{insights[0].title}</p>
                    <p className="text-callout mt-1 text-muted-foreground">{insights[0].body}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Pill tone="neutral">{insights[0].kind === "correlation" ? "Correlation, not cause" : "Observation"}</Pill>
                      <span className="text-caption text-muted-foreground">{insights[0].basis}</span>
                    </div>
                  </div>
                </div>
              </Surface>
            ) : (
              <InfoNote>Not enough records for an insight yet. Insights appear once a pattern shows up on several days.</InfoNote>
            )}
          </PremiumGate>
        </Section>

        <Section title="Suggested adjustments" badge={<FeatureBadge feature="adaptive" />} description="Based on your outcomes and ratings. Nothing changes unless you approve it.">
          <PremiumGate variant="row" feature="adaptive">
            <PendingAdjustments />
            {suggestions.length === 0 ? (
              <InfoNote>No new adjustments suggested this week.</InfoNote>
            ) : (
              <div className="space-y-2.5">
                {suggestions.slice(0, 3).map((s) => (
                  <Surface key={s.key}>
                    <div className="flex gap-3">
                      <IconTile>
                        <ClipboardList />
                      </IconTile>
                      <div className="min-w-0 flex-1">
                        <p className="text-body font-medium">{s.title}</p>
                        <p className="text-callout mt-1 text-muted-foreground">{s.detail}</p>
                        <p className="text-caption mt-1.5 text-muted-foreground">Why: {s.reason}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={() => dismiss(s.key)}>
                        Not now
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          approve({ key: s.key, title: s.title, detail: s.detail })
                          track("adjustment_approved", { key: s.key.split("_")[0] })
                          toast.success("Approved for your next plan", { description: "Your current plan isn't changed. It's applied when you generate the next one, and still has to pass every safety and nutrition check." })
                        }}
                      >
                        Approve
                      </Button>
                    </div>
                  </Surface>
                ))}
              </div>
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
          <p className="text-caption px-1 text-muted-foreground">
            Want to look back further?{" "}
            <Link href="/progress" className="font-semibold text-forest underline underline-offset-2">
              See 30-day progress
            </Link>
          </p>
        </Section>
      </PageBody>
    </>
  )
}

function WeekStat({ icon, label, value, of }: { icon: React.ReactNode; label: string; value: React.ReactNode; of?: number }) {
  return (
    <div>
      <span className="grid size-9 place-items-center rounded-full bg-white/70 [&_svg]:size-[18px]" aria-hidden>
        {icon}
      </span>
      <dd className="mt-3 text-[26px] leading-none font-bold tabular">
        {value}
        {of !== undefined && <span className="text-callout font-medium text-charcoal/70"> / {of}</span>}
      </dd>
      <dt className="text-caption mt-1.5 text-charcoal/80">{label}</dt>
    </div>
  )
}
