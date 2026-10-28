"use client"

import Link from "next/link"
import { Beef, CalendarCheck, CalendarDays, Check, Lightbulb, ListChecks, Pencil, Repeat, Scale, ShieldCheck, SkipForward, Utensils } from "lucide-react"
import { formatDay, todayISO } from "@/lib/date"
import { adherence, adultTargets } from "@/lib/nutrition"
import { useActivePlan, useApp, useSelfProfile } from "@/lib/store"
import { average, dayStats, lastNDays, mealsInRange } from "@/lib/area-d-stats"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { FeatureBadge } from "@/components/app/badges"
import { InfoNote } from "@/components/app/alerts"
import { EstimateNote, NutrientBar } from "@/components/app/nutrition"
import { IconTile, ListGroup, ListRow, PageBody, PageHeader, Section, Surface, type IconTone } from "@/components/app/page"
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
  const logged = stats.filter((s) => s.logged)
  const avgEnergy = logged.length ? logged.reduce((t, s) => t + s.consumed.energyKcal, 0) / logged.length : 0
  const count = (n: number) => <span className="tabular text-headline">{n}</span>

  return (
    <>
      <PageHeader title="Progress" subtitle="Last 7 days" back="/home" />
      <PageBody>
        <div className="grid grid-cols-3 gap-2.5">
          <ColorStat icon={<CalendarDays />} tone="lime" label="Days logged" value={loggedDays} unit="of 7" />
          <ColorStat icon={<Utensils />} tone="amber" label="Meals eaten" value={ad.completed} unit={`of ${ad.resolved}`} />
          <ColorStat icon={<Beef />} tone="sky" label="Avg protein" value={loggedDays ? `~${Math.round(avgProtein)}` : "–"} unit="g" />
        </div>

        <Section title="Energy by day" badge={<FeatureBadge feature="progress_basic" />}>
          <Surface padding="lg">
            <p className="text-caption text-muted-foreground">Average on logged days · estimate</p>
            <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
              <span className="text-[34px] leading-none font-bold tracking-tight tabular">{avgEnergy ? `~${Math.round(avgEnergy).toLocaleString("en-US")}` : "–"}</span>
              <span className="text-callout text-muted-foreground">kcal / day</span>
              {targets?.supported && (
                <span className="text-caption ml-auto text-muted-foreground tabular">
                  Range {Math.round(targets.energy.low).toLocaleString("en-US")}–{Math.round(targets.energy.high).toLocaleString("en-US")}
                </span>
              )}
            </p>
            <div className="mt-4">
              <DailyBars data={stats.map((s) => ({ date: s.date, value: s.consumed.energyKcal, planned: s.planned.energyKcal }))} unit="kcal" label="Estimated energy logged per day compared with the plan" highlight={today} />
            </div>
            <div className="mt-4 border-t border-border/70 pt-3">
              <EstimateNote>Only meals you logged and confirmed are counted, so days with missing meals look lower.</EstimateNote>
            </div>
          </Surface>
        </Section>

        {targets?.supported && loggedDays > 0 && (
          <Section title="Daily averages" description={`On the ${loggedDays} ${loggedDays === 1 ? "day" : "days"} you logged meals`}>
            <Surface className="space-y-4">
              <NutrientBar label="Protein" color="protein" value={avgProtein} low={targets.proteinG.low} high={targets.proteinG.high} unit="g" kind="range" estimate />
              <NutrientBar label="Fiber" color="fiber" value={avgFiber} low={targets.fiberMinG} unit="g" kind="min" estimate />
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
                <ListRow icon={<Check />} iconTone="lime" title="Eaten as planned" trailing={count(ad.asPlanned)} />
                <ListRow icon={<Pencil />} iconTone="amber" title="Eaten with changes" trailing={count(ad.modified)} />
                <ListRow icon={<Repeat />} iconTone="sky" title="Replaced" trailing={count(ad.replaced)} />
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
                    className={cn("tabular text-callout grid size-9 place-items-center rounded-full font-semibold", s.logged ? (s.date === today ? "bg-lime text-charcoal" : "bg-lime-card text-charcoal") : "border border-dashed border-input text-muted-foreground")}
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
                iconTone="sky"
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
            <ListRow href="/progress/weekly-review" icon={<CalendarCheck />} iconTone="lime" title={<>Weekly review <FeatureBadge feature="weekly_review_basic" /></>} description="Look back on the week and choose one focus" />
            <ListRow href="/progress/habits" icon={<ListChecks />} iconTone="amber" title={<>Habits <FeatureBadge feature="habits" /></>} description="One small habit at a time" />
            <ListRow href="/progress/insights" icon={<Lightbulb />} iconTone="sky" title={<>Insights <FeatureBadge feature="insights" /></>} description="Explained patterns in your records" />
            <ListRow href="/progress/insights#confidence" icon={<ShieldCheck />} title={<>Record confidence <FeatureBadge feature="confidence" /></>} description="How complete your food records are" />
          </ListGroup>
        </Section>
      </PageBody>
    </>
  )
}

function ColorStat({ icon, tone, label, value, unit }: { icon: React.ReactNode; tone: IconTone; label: string; value: React.ReactNode; unit: string }) {
  return (
    <div className="rounded-2xl bg-card p-3 shadow-card">
      <IconTile tone={tone} size="sm">
        {icon}
      </IconTile>
      <p className="mt-2.5 text-[20px] leading-none font-bold tabular">
        {value}
        <span className="text-caption ml-1 font-normal text-muted-foreground">{unit}</span>
      </p>
      <p className="text-caption mt-1 text-muted-foreground">{label}</p>
    </div>
  )
}
