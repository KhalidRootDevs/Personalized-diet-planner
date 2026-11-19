"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Apple, BatteryMedium, ChefHat, Coffee, Droplets, Egg, Heart, Info, Moon, Pencil, Scale, Soup, Sprout, Utensils, Wallet } from "lucide-react"
import { toast } from "sonner"
import { formatDay } from "@/lib/date"
import { adultTargets, fmt } from "@/lib/nutrition"
import { useActivePlan, useApp, useSelfProfile } from "@/lib/store"
import { useAreaD, useAreaDSync, type Level3 } from "@/lib/area-d-store"
import { useConsent } from "@/lib/consent"
import { track } from "@/lib/analytics"
import { lastNDays, recordConfidence } from "@/lib/area-d-stats"
import { computeInsights, foodVariety, nutrientGaps, plannedSpending, prepPatterns, sodiumSummary, VARIETY_FOODS, VARIETY_LABEL, type InsightIcon, type InsightInput, type VarietyGroup } from "@/lib/insights"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FeatureBadge, PremiumGate } from "@/components/app/badges"
import { InfoNote } from "@/components/app/alerts"
import { Segmented } from "@/components/app/controls"
import { IconTile, KeyValue, ListGroup, ListRow, PageBody, PageHeader, Pill, Section, Surface, type IconTone } from "@/components/app/page"
import { DailyBars, LineTrend } from "@/components/progress/charts"
import { ConsentPrompt } from "@/components/privacy/consent-prompt"

const ICON: Record<InsightIcon, { icon: React.ReactNode; tone: IconTone }> = {
  breakfast: { icon: <Coffee />, tone: "amber" },
  snack: { icon: <Apple />, tone: "terracotta" },
  protein: { icon: <Egg />, tone: "sky" },
  water: { icon: <Droplets />, tone: "sky" },
  portion: { icon: <Utensils />, tone: "amber" },
  energy: { icon: <BatteryMedium />, tone: "lime" },
  dinner: { icon: <Moon />, tone: "terracotta" },
  enjoy: { icon: <Heart />, tone: "lime" },
}

const CONF_STYLE: Record<string, string> = {
  Complete: "bg-lime text-charcoal",
  "Mostly complete": "bg-lime-card text-charcoal",
  "Partially complete": "bg-muted text-charcoal",
  "Not enough data": "border border-dashed border-input text-muted-foreground",
}

/** Minimum consistent observations before a Nutrition Twin preference is used (§42.15). */
const TWIN_MIN = 5

/** Reads "on 9 of 12", "10 days", "3 ratings" → number of supporting observations. */
function twinEvidence(evidence: string): number {
  const of = evidence.match(/(\d+)\s+of\s+(?:the\s+last\s+)?(\d+)/i)
  if (of) return Number(of[1])
  const n = evidence.match(/(\d+)\s+(?:days|ratings|times|meals|entries|weeks)/i)
  return n ? Number(n[1]) : 0
}

type Range = "7" | "30"

/** Explained insights (§42.19), nutrient gaps (§42.12), Nutrition Twin (§42.15), confidence (§42.20). */
export default function InsightsPage() {
  useAreaDSync()
  const self = useSelfProfile()
  const plan = useActivePlan()
  const journal = useApp((s) => s.journal)
  const water = useApp((s) => s.water)
  const twin = useApp((s) => s.twinPreferences)
  const setTwinPreference = useApp((s) => s.setTwinPreference)
  const feedback = useAreaD((s) => s.mealFeedback)
  const checkIns = useAreaD((s) => s.checkIns)
  const weighIns = useAreaD((s) => s.weighIns)
  const prefs = useAreaD((s) => s.progressPrefs)
  const twinEdits = useAreaD((s) => s.twinEdits)
  const editTwin = useAreaD((s) => s.editTwin)
  const healthOk = useConsent("health_data")
  const [range, setRange] = useState<Range>("7")
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null)

  useEffect(() => {
    track("insights_viewed", { range: Number(range) })
  }, [range])

  if (!self) return null
  const days = lastNDays(Number(range))
  const input: InsightInput = { journal, plan, profile: self, water, feedback, checkIns, days }
  const insights = computeInsights(input)
  const loggedDays = days.filter((d) => journal.some((e) => e.profileId === self.id && e.consumedAt.slice(0, 10) === d)).length
  const targets = healthOk ? adultTargets(self) : null
  const gaps = targets?.supported ? nutrientGaps(input, targets) : []
  const variety = foodVariety(input)
  const lowVariety = (Object.keys(variety.groups) as VarietyGroup[]).filter((g) => variety.loggedDays >= 4 && variety.groups[g].days < variety.loggedDays / 2)
  const sodium = sodiumSummary(input)
  const spend = plannedSpending(plan, days)
  const prep = prepPatterns(input)
  const conf = lastNDays(7).map((d) => ({ date: d, ...recordConfidence(journal, plan, self.id, d) }))
  const ci = checkIns.filter((c) => c.profileId === self.id && days.includes(c.date))
  const weights = weighIns.filter((w) => w.profileId === self.id && w.weightKg)

  return (
    <>
      <PageHeader title="Insights" back="/progress" />
      <PageBody>
        <InfoNote title="How to read insights">
          Insights describe patterns in your own records. A pattern doesn&apos;t prove that one thing causes another, and records may be incomplete.
        </InfoNote>
        <Segmented<Range> label="Time range" value={range} onChange={setRange} options={[{ value: "7", label: "7 days" }, { value: "30", label: "30 days" }]} />

        <Section title="Patterns in your records" badge={<FeatureBadge feature="insights" />}>
          <PremiumGate feature="insights" compact>
            {insights.length === 0 ? (
              <InfoNote>Not enough records for an insight yet. Insights appear only once a pattern shows up on several days.</InfoNote>
            ) : (
              <div className="space-y-3">
                {insights.map((i) => (
                  <Surface key={i.id}>
                    <div className="flex gap-3">
                      <IconTile tone={ICON[i.icon].tone}>{ICON[i.icon].icon}</IconTile>
                      <div className="min-w-0 flex-1">
                        <p className="text-body font-medium">{i.title}</p>
                        <p className="text-callout mt-1 text-charcoal/85">{i.body}</p>
                        <p className="text-caption mt-2 text-muted-foreground">Limitation: {i.limitation}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Pill tone="neutral">{i.kind === "correlation" ? "Correlation, not cause" : "Observation"}</Pill>
                          <span className="text-caption text-muted-foreground">{i.basis}</span>
                        </div>
                        {i.action && (
                          <Link href={i.action.href} className="text-callout mt-2 inline-block font-semibold text-forest underline-offset-4 hover:underline">
                            {i.action.label}
                          </Link>
                        )}
                      </div>
                    </div>
                  </Surface>
                ))}
              </div>
            )}
          </PremiumGate>
        </Section>

        <Section title="Hunger, energy and satisfaction" badge={<FeatureBadge feature="insights" />} description="From your check-ins and meal ratings.">
          <PremiumGate feature="insights" variant="row">
            {ci.length === 0 && feedback.length === 0 ? (
              <InfoNote>Add a check-in on Progress or rate a meal to see this view.</InfoNote>
            ) : (
              <Surface>
                <LevelRow label="Energy" values={ci.map((c) => c.energy)} />
                <LevelRow label="Hunger" values={ci.map((c) => c.hunger)} />
                <LevelRow label="Fullness after meals" values={ci.map((c) => c.fullness)} />
                <KeyValue label="Meals enjoyed" value={feedback.length ? `${feedback.filter((f) => f.enjoyed === "yes").length} of ${feedback.length} rated` : "–"} />
                <KeyValue label="Portion felt right" value={feedback.length ? `${feedback.filter((f) => f.portion === "right").length} of ${feedback.length} rated` : "–"} />
                <p className="text-caption border-t border-border/70 pt-2 text-muted-foreground">Based on {ci.length} check-ins and {feedback.length} meal ratings. Self-reports vary with sleep, stress and work.</p>
              </Surface>
            )}
          </PremiumGate>
        </Section>

        <Section title="Estimated food spending" badge={<FeatureBadge feature="insights" />} description="From the planned meals you didn't skip, at estimated local prices.">
          <PremiumGate feature="insights" variant="row">
            {spend.daysWithPlan === 0 ? (
              <InfoNote>No planned meals in this period.</InfoNote>
            ) : (
              <Surface>
                <div className="flex items-center gap-3">
                  <IconTile tone="amber">
                    <Wallet />
                  </IconTile>
                  <div>
                    <p className="text-caption text-muted-foreground">About · estimate</p>
                    <p className="tabular text-headline">
                      ~{fmt.bdt(spend.total)} <span className="text-caption font-normal text-muted-foreground">over {spend.daysWithPlan} plan days</span>
                    </p>
                  </div>
                </div>
                {range === "7" && (
                  <div className="mt-3">
                    <DailyBars data={spend.perDay.map((d) => ({ date: d.date, value: d.value }))} unit="৳" label="Estimated planned food cost per day" legend="Planned cost" />
                  </div>
                )}
                {self.budgetPerWeekBdt ? <p className="text-caption mt-2 text-muted-foreground tabular">Your weekly budget: {fmt.bdt(self.budgetPerWeekBdt)}. Prices change by market and season.</p> : null}
              </Surface>
            )}
          </PremiumGate>
        </Section>

        <Section title="Meal-prep patterns" badge={<FeatureBadge feature="insights" />}>
          <PremiumGate feature="insights" variant="row">
            <ListGroup>
              <ListRow icon={<ChefHat />} iconTone="lime" title="Meals marked to prep ahead" trailing={<span className="tabular text-headline">{prep.preppedMeals}</span>} description={prep.preppedResolved ? `${prep.preppedEaten} of ${prep.preppedResolved} recorded were eaten` : "No outcomes recorded for prepped meals yet"} />
              <ListRow icon={<Soup />} iconTone="sky" title="Logged from your plan or a recipe" trailing={<span className="tabular text-headline">{prep.fromPlan}</span>} description={`Out of ${prep.total} logged entries`} />
              <ListRow icon={<Utensils />} iconTone="terracotta" title="Restaurant or street food" trailing={<span className="tabular text-headline">{prep.restaurant}</span>} description="Restaurant values are wider estimates" />
            </ListGroup>
          </PremiumGate>
        </Section>

        <Section title="Body measurements" badge={<FeatureBadge feature="insights" />}>
          {prefs.hideWeight || prefs.trackingFrequency === "off" ? (
            <ListGroup>
              <ListRow href="/progress" icon={<Scale />} iconTone="sky" title="Hidden" description="You've chosen to hide or not track weight. Change this on Progress." />
            </ListGroup>
          ) : weights.length < 2 ? (
            <InfoNote>Record at least two measurements a week or more apart to see a trend.</InfoNote>
          ) : (
            <Surface>
              <LineTrend points={weights.slice(-8).map((w) => ({ date: w.date, value: w.weightKg! }))} unit="kg" label="Recorded weight" />
              <p className="text-caption mt-2 text-muted-foreground">Weight moves with water, food and timing. Changes in your records can&apos;t be attributed to any single food or habit.</p>
            </Surface>
          )}
        </Section>

        <Section title="Nutrients and variety to look at" badge={<FeatureBadge feature="nutrient_gaps" />}>
          <PremiumGate feature="nutrient_gaps" variant="row">
            {!healthOk ? (
              <ConsentPrompt type="health_data" feature="Nutrient comparisons">
                Comparisons with your personal targets are paused.
              </ConsentPrompt>
            ) : !targets?.supported ? (
              <InfoNote>Nutrient comparisons aren&apos;t available for this profile.</InfoNote>
            ) : loggedDays < 4 ? (
              <InfoNote>Log meals on at least 4 days to see nutrient patterns. A few entries aren&apos;t enough to draw conclusions.</InfoNote>
            ) : (
              <>
                {gaps.length === 0 && lowVariety.length === 0 ? (
                  <InfoNote>Your recorded meals were close to your general targets for protein, fiber, iron and calcium, with a good mix of food groups.</InfoNote>
                ) : (
                  <div className="space-y-3">
                    {gaps.map((g) => (
                      <Surface key={g.key}>
                        <div className="flex gap-3">
                          <IconTile tone="sky">
                            <Sprout />
                          </IconTile>
                          <div className="min-w-0 flex-1">
                            <p className="text-body font-medium">Your recorded meals may be {g.kind === "limit" ? "high" : "low"} in {g.name}</p>
                            <p className="tabular text-caption mt-1 text-muted-foreground">
                              About {Math.round(g.avg).toLocaleString("en-US")} {g.unit} a day on logged days · {g.kind === "limit" ? "general upper limit" : "general target"} {g.target.toLocaleString("en-US")} {g.unit}
                            </p>
                            <p className="text-callout mt-2">{g.kind === "limit" ? "Ideas" : "Foods that could help"}: {g.foods}.</p>
                          </div>
                        </div>
                      </Surface>
                    ))}
                    {lowVariety.map((g) => (
                      <Surface key={g}>
                        <div className="flex gap-3">
                          <IconTile tone="lime">
                            <Apple />
                          </IconTile>
                          <div className="min-w-0 flex-1">
                            <p className="text-body font-medium">Your recorded meals may be low in {VARIETY_LABEL[g]}</p>
                            <p className="tabular text-caption mt-1 text-muted-foreground">
                              Included on {variety.groups[g].days} of {variety.loggedDays} logged days
                            </p>
                            <p className="text-callout mt-2">Easy additions: {VARIETY_FOODS[g]}.</p>
                          </div>
                        </div>
                      </Surface>
                    ))}
                  </div>
                )}
                <p className="text-caption px-1 text-muted-foreground">
                  Based on {loggedDays} logged days, {variety.distinctFoods} different foods and estimated values.{" "}
                  {sodium.coverage < 0.7 ? "Sodium isn't assessed yet because most of your logged foods don't have sodium values in the food database. " : ""}
                  This is not a test of your nutrient status and can&apos;t diagnose a deficiency. If you&apos;re concerned, speak to a doctor or dietitian.
                </p>
              </>
            )}
          </PremiumGate>
        </Section>

        <Section title="Your Nutrition Twin" badge={<FeatureBadge feature="twin" />} description="What NutriPlan has learned about your preferences. Correct anything that's wrong, or turn it off.">
          <PremiumGate feature="twin" variant="row">
            <ListGroup>
              {twin.map((t) => {
                const text = twinEdits[t.id] ?? t.text
                const corrected = t.id in twinEdits
                const n = twinEvidence(t.evidence)
                const enough = corrected || n >= TWIN_MIN
                const active = t.active && enough
                return (
                  <div key={t.id} className="flex min-h-[60px] items-center gap-2 py-3 pr-3 pl-4">
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-body font-medium", !active && "text-muted-foreground")}>{text}</p>
                      <p className="text-caption mt-0.5 text-muted-foreground">{corrected ? "Corrected by you" : t.evidence}</p>
                      {!enough && (
                        <Pill tone="outline" className="mt-1.5">
                          Learning · {n} of {TWIN_MIN} observations
                        </Pill>
                      )}
                    </div>
                    <Button size="icon" variant="ghost" className="text-muted-foreground" aria-label={`Correct: ${text}`} onClick={() => setEditing({ id: t.id, text })}>
                      <Pencil className="size-[18px]" />
                    </Button>
                    <Switch checked={active} disabled={!enough} onCheckedChange={(v) => setTwinPreference(t.id, v)} aria-label={`Use: ${text}`} />
                  </div>
                )
              })}
            </ListGroup>
            <p className="text-caption px-1 text-muted-foreground">
              A preference is only used once it shows up at least {TWIN_MIN} times, or when you correct it yourself. It never overrides allergies, diet or nutrition rules.
            </p>
          </PremiumGate>
        </Section>

        <Section title="Record confidence" badge={<FeatureBadge feature="confidence" />} description="How complete and certain your food records are. Not a health score.">
          <div id="confidence" className="scroll-mt-20 space-y-3">
            <Surface>
              <div className="grid grid-cols-7 gap-1.5">
                {conf.map((c) => (
                  <div key={c.date} className="flex flex-col items-center gap-1.5">
                    <span className="text-caption text-muted-foreground">{formatDay(c.date, { weekday: "narrow" })}</span>
                    <span className={cn("text-callout grid size-9 place-items-center rounded-full font-semibold", CONF_STYLE[c.level])} title={c.level} aria-label={`${formatDay(c.date, { weekday: "long" })}: ${c.level}`}>
                      {c.level === "Not enough data" ? "–" : c.level === "Complete" ? "✓" : c.level === "Mostly complete" ? "~" : "½"}
                    </span>
                  </div>
                ))}
              </div>
              <ul className="text-caption mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-border/70 pt-3 text-muted-foreground">
                <li><b className="font-semibold text-charcoal">✓</b> Complete</li>
                <li><b className="font-semibold text-charcoal">~</b> Mostly complete</li>
                <li><b className="font-semibold text-charcoal">½</b> Partially complete</li>
                <li><b className="font-semibold text-charcoal">–</b> Not enough data</li>
              </ul>
            </Surface>
            {conf.length > 0 && (
              <ListGroup>
                <ListRow
                  href="/log"
                  title={<>Today · {conf[6].level}</>}
                  description={
                    <span className="tabular">
                      {conf[6].logged} {conf[6].logged === 1 ? "meal" : "meals"} confirmed
                      {conf[6].fromPhoto ? ` · ${conf[6].fromPhoto} from photos` : ""}
                      {conf[6].missing ? ` · ${conf[6].missing} planned not yet logged` : ""}
                    </span>
                  }
                />
              </ListGroup>
            )}
            <p className="text-caption flex gap-2 px-1 text-muted-foreground">
              <Info className="mt-px size-4 shrink-0" />
              <span>
                Use it to judge how much to rely on totals and insights.{" "}
                <Link href="/log" className="font-semibold text-forest underline underline-offset-2">
                  Go to Food Log
                </Link>
              </span>
            </p>
          </div>
        </Section>
      </PageBody>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Correct this preference</DialogTitle>
            <DialogDescription>Write it the way it&apos;s true for you. Your correction replaces what was learned.</DialogDescription>
          </DialogHeader>
          <Input value={editing?.text ?? ""} onChange={(e) => setEditing((x) => (x ? { ...x, text: e.target.value } : x))} aria-label="Preference" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              disabled={!editing?.text.trim()}
              onClick={() => {
                if (!editing) return
                editTwin(editing.id, editing.text.trim())
                setEditing(null)
                toast.success("Preference corrected")
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function LevelRow({ label, values }: { label: string; values: (Level3 | undefined)[] }) {
  const v = values.filter(Boolean) as Level3[]
  const c = (l: Level3) => v.filter((x) => x === l).length
  return <KeyValue label={label} value={v.length ? `${c("low")} low · ${c("ok")} OK · ${c("high")} high` : "–"} />
}
