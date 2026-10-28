"use client"

import Link from "next/link"
import { CalendarCheck, Check, Lightbulb, ListChecks, Pencil, Repeat, Scale, ShieldCheck, SkipForward } from "lucide-react"
import { formatDay, todayISO } from "@/lib/date"
import { adherence, adultTargets } from "@/lib/nutrition"
import { useActivePlan, useApp, useSelfProfile } from "@/lib/store"
import { average, dayStats, lastNDays, mealsInRange } from "@/lib/area-d-stats"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { FeatureBadge } from "@/components/app/badges"
import { InfoNote } from "@/components/app/alerts"
import { EstimateNote, NutrientBar } from "@/components/app/nutrition"
import { ListGroup, ListRow, PageBody, PageHeader, Section, StatTile, Surface } from "@/components/app/page"
import { DailyBars } from "@/components/progress/charts"

/** Progress (§17, §44.10). Supportive wording; unresolved meals are never counted as skipped (§14.6). */
export default function ProgressPage() {
  const self = useSelfProfile()
  const plan = useActivePlan()
  const journal = useApp((s) => s.journal)

  const days = lastNDays(7)
  const today = todayISO()
  const stats = self ? dayStats(journal, plan, self.id, days) : []
  const targets = self ? adultTargets(self) : null
  const ad = adherence(mealsInRange(plan, days))
  const loggedDays = stats.filter((s) => s.logged).length
  const avgProtein = average(stats, "proteinG")
  const avgFiber = average(stats, "fiberG")
  const count = (n: number) => <span className="tabular text-headline">{n}</span>

  return (
    <>
      <PageHeader title="Progress" subtitle="Last 7 days" back="/home" />
      <PageBody>
        <div className="grid grid-cols-3 gap-2">
          <StatTile label="Days logged" value={loggedDays} unit="of 7" />
          <StatTile label="Meals eaten" value={ad.completed} unit={`of ${ad.resolved}`} />
          <StatTile label="Avg protein" value={loggedDays ? `~${Math.round(avgProtein)}` : "–"} unit="g" />
        </div>

        <Section title="Energy by day" badge={<FeatureBadge feature="progress_basic" />}>
          <Surface>
            <DailyBars data={stats.map((s) => ({ date: s.date, value: s.consumed.energyKcal, planned: s.planned.energyKcal }))} unit="kcal" label="Estimated energy logged per day compared with the plan" />
            <div className="mt-4 border-t border-border/70 pt-3">
              <EstimateNote>Only meals you logged and confirmed are counted, so days with missing meals look lower.</EstimateNote>
            </div>
          </Surface>
        </Section>

        {targets?.supported && loggedDays > 0 && (
          <Section title="Daily averages" description={`On the ${loggedDays} ${loggedDays === 1 ? "day" : "days"} you logged meals`}>
            <Surface className="space-y-4">
              <NutrientBar label="Protein" value={avgProtein} low={targets.proteinG.low} high={targets.proteinG.high} unit="g" kind="range" estimate />
              <NutrientBar label="Fiber" value={avgFiber} low={targets.fiberMinG} unit="g" kind="min" estimate />
              <p className="text-caption border-t border-border/70 pt-3 text-muted-foreground">These are general targets, not limits. Being above or below on some days is normal.</p>
            </Surface>
          </Section>
        )}

        <Section title="How your planned meals went" description="Changes and replacements are part of real life.">
          {ad.resolved === 0 ? (
            <InfoNote>No meal outcomes recorded yet this week. Mark meals as eaten, changed or skipped from your plan.</InfoNote>
          ) : (
            <>
              <ListGroup>
                <ListRow icon={<Check />} title="Eaten as planned" trailing={count(ad.asPlanned)} />
                <ListRow icon={<Pencil />} title="Eaten with changes" trailing={count(ad.modified)} />
                <ListRow icon={<Repeat />} title="Replaced" trailing={count(ad.replaced)} />
                <ListRow icon={<SkipForward />} iconTone="muted" title="Skipped" trailing={count(ad.skipped)} />
              </ListGroup>
              <p className="text-caption px-1 text-muted-foreground">Based on {ad.resolved} recorded planned meals. Meals without an outcome aren&apos;t counted.</p>
              {ad.skipped >= 3 && (
                <InfoNote>
                  Several meals were skipped. If the plan doesn&apos;t fit your week,{" "}
                  <Link href="/plan/generate" className="font-semibold text-forest underline underline-offset-2">
                    a revised plan
                  </Link>{" "}
                  could help.
                </InfoNote>
              )}
            </>
          )}
        </Section>

        <Section title="Food journal" description={`Meals logged on ${loggedDays} of 7 days`}>
          <Surface>
            <div className="grid grid-cols-7 gap-1.5" aria-label={`Meals logged on ${loggedDays} of 7 days`}>
              {stats.map((s) => (
                <div key={s.date} className="flex flex-col items-center gap-1.5">
                  <span className={cn("text-caption", s.date === today ? "font-semibold text-charcoal" : "text-muted-foreground")}>{formatDay(s.date, { weekday: "narrow" })}</span>
                  <span
                    className={cn("tabular text-callout grid size-9 place-items-center rounded-full font-semibold", s.logged ? "bg-sage text-forest" : "border border-dashed border-input text-muted-foreground", s.date === today && "ring-2 ring-forest/30 ring-offset-1")}
                    aria-label={`${formatDay(s.date, { weekday: "long" })}: ${s.entries} entries`}
                  >
                    {s.entries || "–"}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-caption mt-3 text-muted-foreground">Numbers show how many entries were logged each day.</p>
          </Surface>
        </Section>

        {self?.weightKg && (
          <Section title="Weight">
            <ListGroup>
              <ListRow
                icon={<Scale />}
                title={<span className="tabular">{self.weightKg} kg</span>}
                description="Last recorded in your profile"
                trailing={
                  <Button asChild variant="outline" size="sm">
                    <Link href="/profile/edit">Update</Link>
                  </Button>
                }
              />
            </ListGroup>
            <p className="text-caption px-1 text-muted-foreground">Weight changes day to day with water and food. Trends over several weeks are more meaningful.</p>
          </Section>
        )}

        <Section title="Go deeper">
          <ListGroup>
            <ListRow href="/progress/weekly-review" icon={<CalendarCheck />} title={<>Weekly review <FeatureBadge feature="weekly_review_basic" /></>} description="Look back on the week and choose one focus" />
            <ListRow href="/progress/habits" icon={<ListChecks />} title={<>Habits <FeatureBadge feature="habits" /></>} description="One small habit at a time" />
            <ListRow href="/progress/insights" icon={<Lightbulb />} title={<>Insights <FeatureBadge feature="insights" /></>} description="Explained patterns in your records" />
            <ListRow href="/progress/insights#confidence" icon={<ShieldCheck />} title={<>Record confidence <FeatureBadge feature="confidence" /></>} description="How complete your food records are" />
          </ListGroup>
        </Section>
      </PageBody>
    </>
  )
}
