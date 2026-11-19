"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Beef, CalendarCheck, CalendarDays, Check, EyeOff, Footprints, Lightbulb, ListChecks, MessageSquareText, Pencil, Repeat, Scale, ShieldCheck, SkipForward, Target, Utensils, Watch } from "lucide-react"
import { toast } from "sonner"
import { addDays, formatDay, startOfWeek, todayISO } from "@/lib/date"
import { adherence, adultTargets } from "@/lib/nutrition"
import { useActivePlan, useApp, useSelfProfile } from "@/lib/store"
import { useAreaD, useAreaDSync, type Level3 } from "@/lib/area-d-store"
import { useConsent } from "@/lib/consent"
import { track } from "@/lib/analytics"
import { average, dayStats, lastNDays, mealsInRange } from "@/lib/area-d-stats"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { FeatureBadge, PremiumGate } from "@/components/app/badges"
import { InfoNote } from "@/components/app/alerts"
import { EstimateNote, NutrientBar } from "@/components/app/nutrition"
import { Field, PillGroup, Segmented, Stepper } from "@/components/app/controls"
import { IconTile, ListGroup, ListRow, PageBody, PageHeader, Section, Surface, type IconTone } from "@/components/app/page"
import { DailyBars, LineTrend } from "@/components/progress/charts"
import { FeedbackPrompts, PendingAdjustments, PlanReviewTriggers } from "@/components/progress/review-cards"
import { ConsentPrompt } from "@/components/privacy/consent-prompt"

type Range = "7" | "30"

/** Progress (§17, §44.10). Supportive wording; unresolved meals are never counted as skipped (§14.6). */
export default function ProgressPage() {
  useAreaDSync()
  const self = useSelfProfile()
  const plan = useActivePlan()
  const journal = useApp((s) => s.journal)
  const focus = useAreaD((s) => s.weeklyFocus)
  const notes = useAreaD((s) => s.professionalNotes)
  const healthOk = useConsent("health_data")
  const [range, setRange] = useState<Range>("7")

  useEffect(() => {
    track("progress_viewed", { range: Number(range) })
  }, [range])

  const n = Number(range)
  const days = lastNDays(n)
  const today = todayISO()
  const stats = self ? dayStats(journal, plan, self.id, days) : []
  const targets = self && healthOk ? adultTargets(self) : null
  const ad = adherence(mealsInRange(plan, days))
  const loggedDays = stats.filter((s) => s.logged).length
  const avgProtein = average(stats, "proteinG")
  const avgFiber = average(stats, "fiberG")
  const logged = stats.filter((s) => s.logged)
  const avgEnergy = logged.length ? logged.reduce((t, s) => t + s.consumed.energyKcal, 0) / logged.length : 0
  const count = (v: number) => <span className="tabular text-headline">{v}</span>
  const thisWeek = startOfWeek(today)

  // 30-day view groups days into weeks so the chart stays readable.
  const chart =
    n === 7
      ? stats.map((s) => ({ date: s.date, value: s.consumed.energyKcal, planned: s.planned.energyKcal }))
      : Array.from(new Set(stats.map((s) => startOfWeek(s.date)))).map((wk) => {
          const inWk = stats.filter((s) => startOfWeek(s.date) === wk)
          const lg = inWk.filter((s) => s.logged)
          const pl = inWk.filter((s) => s.planned.energyKcal > 0)
          return { date: wk, value: lg.length ? lg.reduce((t, s) => t + s.consumed.energyKcal, 0) / lg.length : 0, planned: pl.length ? pl.reduce((t, s) => t + s.planned.energyKcal, 0) / pl.length : 0 }
        })

  return (
    <>
      <PageHeader title="Progress" subtitle={`Last ${n} days`} back="/home" />
      <PageBody>
        <Segmented<Range> label="Time range" value={range} onChange={setRange} options={[{ value: "7", label: "7 days" }, { value: "30", label: "30 days" }]} />

        {focus && focus.weekStart === thisWeek && (
          <Surface tone="sage" className="flex items-center gap-3">
            <IconTile tone="white">
              <Target />
            </IconTile>
            <div className="min-w-0 flex-1">
              <p className="text-overline text-lime-text">Your focus this week</p>
              <p className="text-body font-medium">{focus.text}</p>
            </div>
          </Surface>
        )}

        <div className="grid grid-cols-3 gap-2.5">
          <ColorStat icon={<CalendarDays />} tone="lime" label="Days logged" value={loggedDays} unit={`of ${n}`} />
          <ColorStat icon={<Utensils />} tone="amber" label="Meals eaten" value={ad.completed} unit={`of ${ad.resolved}`} />
          <ColorStat icon={<Beef />} tone="sky" label="Avg protein" value={loggedDays ? `~${Math.round(avgProtein)}` : "–"} unit="g" />
        </div>

        <Section title={n === 7 ? "Energy by day" : "Energy by week"} badge={<FeatureBadge feature="progress_basic" />}>
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
              <DailyBars
                data={chart}
                unit="kcal"
                label={n === 7 ? "Estimated energy logged per day compared with the plan" : "Average estimated energy per logged day, by week, compared with the plan"}
                highlight={n === 7 ? today : chart[chart.length - 1]?.date}
                labelFor={n === 7 ? undefined : (d) => formatDay(d, { day: "numeric", month: "short" })}
                legend={n === 7 ? "Logged" : "Avg logged day"}
              />
            </div>
            <div className="mt-4 border-t border-border/70 pt-3">
              <EstimateNote>Only meals you logged and confirmed are counted, so days with missing meals look lower.</EstimateNote>
            </div>
          </Surface>
        </Section>

        {!healthOk ? (
          <ConsentPrompt type="health_data" feature="Personal targets">
            Your ranges for energy, protein and fiber are hidden until you allow it again.
          </ConsentPrompt>
        ) : (
          targets?.supported &&
          loggedDays > 0 && (
            <Section title="Daily averages" description={`On the ${loggedDays} ${loggedDays === 1 ? "day" : "days"} you logged meals`}>
              <Surface className="space-y-4">
                <NutrientBar label="Protein" color="protein" value={avgProtein} low={targets.proteinG.low} high={targets.proteinG.high} unit="g" kind="range" estimate />
                <NutrientBar label="Fiber" color="fiber" value={avgFiber} low={targets.fiberMinG} unit="g" kind="min" estimate />
                <p className="text-caption border-t border-border/70 pt-3 text-muted-foreground">These are general targets, not limits. Being above or below on some days is normal.</p>
              </Surface>
            </Section>
          )
        )}

        {notes[0] && (
          <Section title="From your dietitian">
            <ListGroup>
              <ListRow href="/profile/professional" icon={<MessageSquareText />} iconTone="sky" title={<span className="text-callout line-clamp-2 font-normal">{notes[0].text}</span>} description={notes[0].author} />
            </ListGroup>
          </Section>
        )}

        {self && <CheckInCard profileId={self.id} days={days} />}

        {self && <BodyCard profileId={self.id} profileWeight={self.weightKg} days={days} />}

        <Section title="Does your plan still fit?" badge={<FeatureBadge feature="progress_basic" />}>
          <PlanReviewTriggers />
          <PendingAdjustments />
          <ListGroup>
            <ListRow href="/plan/generate" icon={<Repeat />} iconTone="lime" title="Revise my plan" description="Your current plan stays active until you switch" />
          </ListGroup>
        </Section>

        <Section title="How was it?" description="A quick rating after a meal helps shape your next plan.">
          <FeedbackPrompts />
        </Section>

        <Section title="How your planned meals went" description="Changes and replacements are part of real life.">
          {ad.resolved === 0 ? (
            <InfoNote>No meal outcomes recorded in this period. Mark meals as eaten, changed or skipped from your plan.</InfoNote>
          ) : (
            <>
              <ListGroup>
                <ListRow icon={<Check />} iconTone="lime" title="Eaten as planned" trailing={count(ad.asPlanned)} />
                <ListRow icon={<Pencil />} iconTone="amber" title="Eaten with changes" trailing={count(ad.modified)} />
                <ListRow icon={<Repeat />} iconTone="sky" title="Replaced" trailing={count(ad.replaced)} />
                <ListRow icon={<SkipForward />} iconTone="muted" title="Skipped" trailing={count(ad.skipped)} />
              </ListGroup>
              <p className="text-caption px-1 text-muted-foreground">Based on {ad.resolved} recorded planned meals. Meals without an outcome aren&apos;t counted.</p>
            </>
          )}
        </Section>

        {n === 7 && (
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
        )}

        <WearablesCard days={lastNDays(7)} />

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

const LEVELS: { value: Level3; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "ok", label: "OK" },
  { value: "high", label: "High" },
]

/** Self-reported energy, hunger, fullness, sleep and exercise (§17.1). All optional. */
function CheckInCard({ profileId, days }: { profileId: string; days: string[] }) {
  const today = todayISO()
  const checkIns = useAreaD((s) => s.checkIns)
  const upsert = useAreaD((s) => s.upsertCheckIn)
  const existing = checkIns.find((c) => c.profileId === profileId && c.date === today)
  const [energy, setEnergy] = useState<Level3>(existing?.energy ?? "ok")
  const [hunger, setHunger] = useState<Level3>(existing?.hunger ?? "ok")
  const [fullness, setFullness] = useState<Level3>(existing?.fullness ?? "ok")
  const [sleep, setSleep] = useState(existing?.sleepHours ?? 7)
  const [exercise, setExercise] = useState(existing?.exerciseMinutes ?? 0)
  const inRange = checkIns.filter((c) => c.profileId === profileId && days.includes(c.date))
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
  const mostly = (key: "energy" | "hunger") => {
    const vals = inRange.map((c) => c[key]).filter(Boolean) as Level3[]
    if (!vals.length) return "–"
    const top = (["low", "ok", "high"] as Level3[]).map((l) => [l, vals.filter((v) => v === l).length] as const).sort((a, b) => b[1] - a[1])[0][0]
    return `mostly ${LEVELS.find((l) => l.value === top)!.label.toLowerCase()}`
  }
  const sleeps = inRange.filter((c) => c.sleepHours !== undefined).map((c) => c.sleepHours!)
  const ex = inRange.filter((c) => c.exerciseMinutes !== undefined).map((c) => c.exerciseMinutes!)

  return (
    <Section title="How are you feeling today?" badge={<FeatureBadge feature="progress_basic" />} description="Optional. Helps explain patterns — it's not scored.">
      <Surface padding="lg" className="space-y-4">
        <Field label="Energy">
          <Segmented label="Energy" value={energy} onChange={setEnergy} options={LEVELS} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Hunger">
            <Segmented label="Hunger" value={hunger} onChange={setHunger} options={LEVELS} />
          </Field>
          <Field label="Fullness after meals">
            <Segmented label="Fullness" value={fullness} onChange={setFullness} options={LEVELS} />
          </Field>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-callout font-medium">Sleep last night</span>
          <Stepper label="sleep hours" value={sleep} suffix="h" onDec={() => setSleep((x) => Math.max(0, x - 0.5))} onInc={() => setSleep((x) => Math.min(14, x + 0.5))} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-callout font-medium">Exercise or active time</span>
          <Stepper label="exercise minutes" value={exercise} suffix="min" onDec={() => setExercise((x) => Math.max(0, x - 5))} onInc={() => setExercise((x) => Math.min(300, x + 5))} />
        </div>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            upsert({ profileId, date: today, energy, hunger, fullness, sleepHours: sleep, exerciseMinutes: exercise })
            track("check_in_saved")
            toast.success(existing ? "Check-in updated" : "Check-in saved")
          }}
        >
          {existing ? "Update check-in" : "Save check-in"}
        </Button>
        {inRange.length > 0 && (
          <dl className="text-caption grid grid-cols-2 gap-x-3 gap-y-1 border-t border-border/70 pt-3 text-muted-foreground">
            <dt>Energy</dt>
            <dd className="text-right text-charcoal">{mostly("energy")}</dd>
            <dt>Hunger</dt>
            <dd className="text-right text-charcoal">{mostly("hunger")}</dd>
            <dt>Sleep</dt>
            <dd className="tabular text-right text-charcoal">{sleeps.length ? `~${Math.round(avg(sleeps) * 10) / 10} h a night` : "–"}</dd>
            <dt>Active time</dt>
            <dd className="tabular text-right text-charcoal">{ex.length ? `~${Math.round(avg(ex))} min a day` : "–"}</dd>
            <dd className="col-span-2 pt-1">From {inRange.length} check-ins in this period</dd>
          </dl>
        )}
      </Surface>
    </Section>
  )
}

const FREQ_DAYS = { weekly: 7, fortnightly: 14, monthly: 30, off: 0 } as const

/** Optional weigh-ins with a trend (§17.1). Neutral language; never daily; can be hidden. */
function BodyCard({ profileId, profileWeight, days }: { profileId: string; profileWeight?: number; days: string[] }) {
  const weighIns = useAreaD((s) => s.weighIns)
  const prefs = useAreaD((s) => s.progressPrefs)
  const setPrefs = useAreaD((s) => s.setProgressPrefs)
  const addWeighIn = useAreaD((s) => s.addWeighIn)
  const [weight, setWeight] = useState("")
  const [waist, setWaist] = useState("")
  const mine = weighIns.filter((w) => w.profileId === profileId)
  const points = mine.filter((w) => w.weightKg && (days.length > 7 ? w.date >= days[0] : true)).slice(-8)
  const last = mine[mine.length - 1]
  const freq = FREQ_DAYS[prefs.trackingFrequency]
  const nextDate = last && freq ? addDays(last.date, freq) : null
  const waistPoints = mine.filter((w) => w.waistCm)

  return (
    <Section title="Body measurements" badge={<FeatureBadge feature="progress_basic" />} description="Optional. Weight naturally varies from day to day; trends over several weeks are more useful.">
      <Surface padding="lg" className="space-y-4">
        <Field label="How often would you like to record?">
          <PillGroup
            label="Tracking frequency"
            value={prefs.trackingFrequency}
            onChange={(v) => setPrefs({ trackingFrequency: v })}
            options={[
              { value: "weekly", label: "Weekly" },
              { value: "fortnightly", label: "Every 2 weeks" },
              { value: "monthly", label: "Monthly" },
              { value: "off", label: "Don't track" },
            ]}
          />
        </Field>
        <label className="text-callout flex min-h-11 items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <EyeOff className="size-4 text-muted-grey" aria-hidden /> Hide weight on this screen
          </span>
          <Switch checked={prefs.hideWeight} onCheckedChange={(v) => setPrefs({ hideWeight: v })} aria-label="Hide weight" />
        </label>
      </Surface>

      {prefs.trackingFrequency === "off" ? (
        <InfoNote>You&apos;ve chosen not to track body measurements. You can turn it back on any time.</InfoNote>
      ) : prefs.hideWeight ? (
        <ListGroup>
          <ListRow icon={<Scale />} iconTone="sky" title="Weight is hidden" description={`${mine.length} measurements stored · visible only to you`} />
        </ListGroup>
      ) : (
        <>
          {points.length >= 2 ? (
            <Surface>
              <LineTrend points={points.map((w) => ({ date: w.date, value: w.weightKg! }))} unit="kg" label="Recorded weight over time" />
              <p className="text-caption mt-2 text-muted-foreground">
                {points.length} recordings
                {waistPoints.length > 0 && ` · waist last recorded ${waistPoints[waistPoints.length - 1].waistCm} cm`}. A single reading isn&apos;t a trend.
              </p>
            </Surface>
          ) : (
            <ListGroup>
              <ListRow icon={<Scale />} iconTone="sky" title={<span className="tabular">{last?.weightKg ?? profileWeight ?? "–"} kg</span>} description={last ? `Recorded ${formatDay(last.date, { day: "numeric", month: "short" })}` : "From your profile"} />
            </ListGroup>
          )}
          <Surface className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Weight (kg)" htmlFor="wi-weight">
                <Input id="wi-weight" type="number" inputMode="decimal" step="0.1" min="20" max="300" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder={String(last?.weightKg ?? profileWeight ?? "")} />
              </Field>
              <Field label="Waist (cm, optional)" htmlFor="wi-waist">
                <Input id="wi-waist" type="number" inputMode="decimal" step="0.5" min="30" max="200" value={waist} onChange={(e) => setWaist(e.target.value)} />
              </Field>
            </div>
            <Button
              variant="outline"
              className="w-full"
              disabled={!(Number(weight) >= 20 && Number(weight) <= 300)}
              onClick={() => {
                addWeighIn({ profileId, date: todayISO(), weightKg: Math.round(Number(weight) * 10) / 10, waistCm: Number(waist) > 0 ? Number(waist) : undefined })
                track("weigh_in_recorded")
                setWeight("")
                setWaist("")
                toast.success("Measurement saved")
              }}
            >
              Save measurement
            </Button>
            {nextDate && nextDate > todayISO() && <p className="text-caption text-muted-foreground">No need to weigh again before {formatDay(nextDate, { weekday: "short", day: "numeric", month: "short" })}.</p>}
          </Surface>
        </>
      )}
    </Section>
  )
}

const SOURCES: Record<string, string> = { health_connect: "Health Connect", apple_health: "Apple Health", fitbit: "Fitbit" }

function seeded(date: string, salt: number) {
  let h = salt
  for (const c of date) h = (h * 31 + c.charCodeAt(0)) % 9973
  return h / 9973
}

/** Imported activity as ranges (§42.23). Never raises food targets automatically. */
function WearablesCard({ days }: { days: string[] }) {
  const integrations = useApp((s) => s.settings.integrations)
  const connected = Object.keys(SOURCES).filter((k) => integrations[k])
  if (!connected.length) return null
  const rows = days.map((d) => {
    const steps = 4000 + Math.round(seeded(d, 7) * 6000)
    const mins = 10 + Math.round(seeded(d, 13) * 40)
    return { date: d, stepsLow: Math.round((steps * 0.9) / 100) * 100, stepsHigh: Math.round((steps * 1.1) / 100) * 100, mins }
  })
  const avgSteps = rows.reduce((t, r) => t + (r.stepsLow + r.stepsHigh) / 2, 0) / rows.length
  return (
    <Section title={`From ${connected.map((c) => SOURCES[c]).join(" and ")}`} badge={<FeatureBadge feature="wearables" />} description="Imported activity, shown as ranges.">
      <PremiumGate feature="wearables" variant="row">
        <Surface>
          <div className="flex items-center gap-3">
            <IconTile tone="sky">
              <Footprints />
            </IconTile>
            <div className="min-w-0 flex-1">
              <p className="text-caption text-muted-foreground">Average steps · last 7 days</p>
              <p className="tabular text-headline">~{(Math.round(avgSteps / 500) * 500).toLocaleString("en-US")} a day</p>
            </div>
          </div>
          <ul className="mt-3 divide-y divide-border/70 border-t border-border/70">
            {rows.slice(-4).map((r) => (
              <li key={r.date} className="text-callout flex justify-between py-2">
                <span className="text-muted-foreground">{formatDay(r.date, { weekday: "short", day: "numeric" })}</span>
                <span className="tabular">
                  {r.stepsLow.toLocaleString("en-US")}–{r.stepsHigh.toLocaleString("en-US")} steps · ~{r.mins} active min
                </span>
              </li>
            ))}
          </ul>
        </Surface>
        <InfoNote>
          <span className="flex items-start gap-2">
            <Watch className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              Device calorie estimates are themselves estimates, so they never raise your food targets automatically. If your activity has changed,{" "}
              <Link href="/profile/edit" className="font-semibold text-forest underline underline-offset-2">
                update your activity level
              </Link>
              .
            </span>
          </span>
        </InfoNote>
      </PremiumGate>
    </Section>
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
