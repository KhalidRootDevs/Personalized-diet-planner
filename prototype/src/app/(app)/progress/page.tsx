"use client"

import Link from "next/link"
import { CalendarCheck, Lightbulb, ListChecks, Scale, ShieldCheck } from "lucide-react"
import { adherence, adultTargets } from "@/lib/nutrition"
import { useActivePlan, useApp, useSelfProfile } from "@/lib/store"
import { average, dayStats, lastNDays, mealsInRange } from "@/lib/area-d-stats"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FeatureBadge } from "@/components/app/badges"
import { InfoNote } from "@/components/app/alerts"
import { EstimateNote, NutrientBar } from "@/components/app/nutrition"
import { ListLink, PageBody, PageHeader, Section } from "@/components/app/page"
import { DailyBars } from "@/components/progress/charts"

/** Progress (§17, §44.10). Supportive wording; unresolved meals are never counted as skipped (§14.6). */
export default function ProgressPage() {
  const self = useSelfProfile()
  const plan = useActivePlan()
  const journal = useApp((s) => s.journal)

  const days = lastNDays(7)
  const stats = self ? dayStats(journal, plan, self.id, days) : []
  const targets = self ? adultTargets(self) : null
  const ad = adherence(mealsInRange(plan, days))
  const loggedDays = stats.filter((s) => s.logged).length
  const avgProtein = average(stats, "proteinG")
  const avgFiber = average(stats, "fiberG")

  return (
    <>
      <PageHeader title="Progress" subtitle="Last 7 days" back="/home" large />
      <PageBody>
        <Section title="Energy by day" badge={<FeatureBadge feature="progress_basic" />}>
          <Card className="gap-3">
            <DailyBars data={stats.map((s) => ({ date: s.date, value: s.consumed.energyKcal, planned: s.planned.energyKcal }))} unit="kcal" label="Estimated energy logged per day compared with the plan" />
            <EstimateNote>Totals include only meals you logged and confirmed, so days with missing meals look lower.</EstimateNote>
          </Card>
        </Section>

        {targets?.supported && loggedDays > 0 && (
          <Section title="Daily averages on logged days">
            <Card className="gap-4">
              <NutrientBar label="Protein" value={avgProtein} low={targets.proteinG.low} high={targets.proteinG.high} unit="g" kind="range" estimate />
              <NutrientBar label="Fiber" value={avgFiber} low={targets.fiberMinG} unit="g" kind="min" estimate />
              <p className="text-xs text-muted-foreground">
                Averaged over {loggedDays} logged {loggedDays === 1 ? "day" : "days"}. These are general targets, not limits — being above or below on some days is normal.
              </p>
            </Card>
          </Section>
        )}

        <Section title="How your planned meals went">
          {ad.resolved === 0 ? (
            <InfoNote>No meal outcomes recorded yet this week. Mark meals as eaten, changed or skipped from your plan.</InfoNote>
          ) : (
            <Card className="gap-3">
              <p className="text-sm">
                You recorded <span className="font-semibold tabular">{ad.resolved}</span> planned meals. <span className="font-semibold tabular">{ad.completed}</span> were eaten in some form.
              </p>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                {[
                  ["As planned", ad.asPlanned],
                  ["With changes", ad.modified],
                  ["Replaced", ad.replaced],
                  ["Skipped", ad.skipped],
                ].map(([label, n]) => (
                  <div key={label} className="rounded-lg bg-muted/60 p-2.5">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="text-lg font-semibold tabular">{n}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-xs text-muted-foreground">Changes and replacements are part of real life. Meals without an outcome aren&apos;t counted.</p>
              {ad.skipped >= 3 && (
                <p className="text-sm">
                  Several meals were skipped. If the plan doesn&apos;t fit your week, a{" "}
                  <Link href="/plan/generate" className="font-medium text-forest underline underline-offset-2">
                    revised plan
                  </Link>{" "}
                  could help.
                </p>
              )}
            </Card>
          )}
        </Section>

        <Section title="Food journal">
          <Card className="gap-3">
            <div className="flex gap-1.5" aria-label={`Meals logged on ${loggedDays} of 7 days`}>
              {stats.map((s) => (
                <div key={s.date} className="flex flex-1 flex-col items-center gap-1">
                  <div className={s.logged ? "h-8 w-full rounded-md bg-forest" : "h-8 w-full rounded-md border border-dashed border-input"} />
                  <span className="text-[11px] tabular text-muted-foreground">{s.entries || "–"}</span>
                </div>
              ))}
            </div>
            <p className="text-sm">
              Meals logged on <span className="font-semibold tabular">{loggedDays}</span> of 7 days. Numbers show entries per day.
            </p>
          </Card>
        </Section>

        {self?.weightKg && (
          <Section title="Weight">
            <Card className="flex-row items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-sage text-forest">
                <Scale className="size-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold tabular">{self.weightKg} kg</p>
                <p className="text-sm text-muted-foreground">Last recorded in your profile</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/profile/edit">Update</Link>
              </Button>
            </Card>
            <p className="text-xs text-muted-foreground">Weight changes day to day with water and food. Trends over several weeks are more meaningful.</p>
          </Section>
        )}

        <Section title="Go deeper">
          <div className="space-y-2">
            <ListLink href="/progress/weekly-review" icon={<CalendarCheck className="size-5" />} title="Weekly review" description="Look back on the week and choose one focus" trailing={<FeatureBadge feature="weekly_review_basic" />} />
            <ListLink href="/progress/habits" icon={<ListChecks className="size-5" />} title="Habits" description="One small habit at a time" trailing={<FeatureBadge feature="habits" />} />
            <ListLink href="/progress/insights" icon={<Lightbulb className="size-5" />} title="Insights" description="Explained patterns in your records" trailing={<FeatureBadge feature="insights" />} />
            <ListLink href="/progress/insights#confidence" icon={<ShieldCheck className="size-5" />} title="Record confidence" description="How complete your food records are" trailing={<FeatureBadge feature="confidence" />} />
          </div>
        </Section>
      </PageBody>
    </>
  )
}
