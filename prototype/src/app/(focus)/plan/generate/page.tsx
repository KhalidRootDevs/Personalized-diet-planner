"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Banknote, CalendarDays, Check, Clock, Dumbbell, Flame, Leaf, Loader2, Lock, Package, Sprout, Timer, Users, Wallet } from "lucide-react"
import { MealTimeRow } from "@/components/plan/meal-time-row"
import { FlowHeader, IconTile, ListGroup, ListRow, PageBody, PageHeader, Section, StatTile, StickyFooter, Surface } from "@/components/app/page"
import { ChoiceCard } from "@/components/app/controls"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { FeatureBadge, useFeature } from "@/components/app/badges"
import { CautionNote, InfoNote, SafetyAlert } from "@/components/app/alerts"
import { EstimateNote, NutrientBar } from "@/components/app/nutrition"
import { RecipeThumb } from "@/components/app/recipe-thumb"
import { ValidationList } from "@/components/plan/validation-list"
import { useApp, useSelfProfile } from "@/lib/store"
import { useConsent } from "@/lib/consent"
import { ConsentPrompt } from "@/components/privacy/consent-prompt"
import { MEAL_LABEL, SLOTS, dayNutrition, defaultMealTimes, defaultMealsPerDay, generatePlan, prepRelaxSuggestion, presetLabel, type PlanOptions } from "@/lib/planning"
import { activeHardRules, adultTargets, findRecipe, fmt, hydrationGuide, recipeCostPerServing } from "@/lib/nutrition"
import { addDays, formatDay, formatTime, todayISO } from "@/lib/date"
import { cn } from "@/lib/utils"
import type { FeatureId } from "@/lib/features"
import type { MealPlan, PlanPreset, Profile } from "@/lib/types"

const DURATIONS: { days: number; label: string; unit: string; feature?: FeatureId; months?: 3 | 6 }[] = [
  { days: 1, label: "1", unit: "day", feature: "plan_long" },
  { days: 3, label: "3", unit: "days" },
  { days: 7, label: "7", unit: "days" },
  { days: 14, label: "14", unit: "days", feature: "plan_long" },
  { days: 30, label: "30", unit: "days", feature: "plan_long" },
  { days: 7, label: "3", unit: "months", feature: "plan_framework", months: 3 },
  { days: 7, label: "6", unit: "months", feature: "plan_framework", months: 6 },
]

const PRESETS: { id: PlanPreset; hint: string; icon: React.ReactNode; feature?: FeatureId }[] = [
  { id: "balanced", hint: "Variety across the week", icon: <Leaf /> },
  { id: "quick", hint: "Shorter cooking on workdays", icon: <Clock /> },
  { id: "high_protein", hint: "Protein-forward choices", icon: <Dumbbell /> },
  { id: "lowest_cost", hint: "Cheapest safe options, protein kept", icon: <Wallet />, feature: "budget_optimizer" },
  { id: "pantry", hint: "Ranks recipes by what's in your pantry", icon: <Package />, feature: "pantry" },
  { id: "seasonal", hint: "Produce in season now", icon: <Sprout />, feature: "budget_optimizer" },
  { id: "family", hint: "Batch-cookable dishes for the household", icon: <Users />, feature: "family" },
]

// Pipeline stages shown while the draft is built (§10.1, §18.2).
const STAGES = ["Checking your profile is complete", "Estimating energy and nutrient ranges", "Removing allergens and restricted foods", "Selecting verified recipes", "Sizing portions, balancing cost, time and variety", "Validating nutrition and safety"]

type Step = "setup" | "building" | "review"

export default function GeneratePlanPage() {
  const profile = useSelfProfile()
  const healthConsent = useConsent("health_data")
  if (!profile) return null
  if (!healthConsent)
    return (
      <>
        <PageHeader title="New meal plan" back="/plan" />
        <PageBody>
          <ConsentPrompt type="health_data" feature="Plan generation">
            Personal plans use your health information to keep meals safe and set ranges.
          </ConsentPrompt>
        </PageBody>
      </>
    )
  return <Generator profile={profile} />
}

function Generator({ profile }: { profile: Profile }) {
  const router = useRouter()
  const addPlan = useApp((s) => s.addPlan)
  const pantry = useApp((s) => s.pantry)
  const twin = useApp((s) => s.twinPreferences)
  const profileCount = useApp((s) => s.profiles.length)
  const [step, setStep] = useState<Step>("setup")
  const [opts, setOpts] = useState<PlanOptions>(() => ({
    durationDays: 7,
    startDate: addDays(todayISO(), 1),
    mealsPerDay: defaultMealsPerDay(profile),
    preset: "balanced",
    maxPrepMinutes: profile.maxPrepMinutes ?? 30,
    times: {},
    weeklyBudgetBdt: profile.budgetPerWeekBdt,
  }))
  const [useBudget, setUseBudget] = useState(!!profile.budgetPerWeekBdt)
  const [draft, setDraft] = useState<MealPlan | null>(null)
  const [stage, setStage] = useState(0)
  const features = {
    plan_long: useFeature("plan_long"),
    plan_framework: useFeature("plan_framework"),
    budget_optimizer: useFeature("budget_optimizer"),
    pantry: useFeature("pantry"),
    family: useFeature("family"),
  } as Record<string, { allowed: boolean }>

  useEffect(() => {
    if (step !== "building") return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const id = window.setInterval(() => {
      setStage((s) => {
        if (s + 1 >= STAGES.length) {
          window.clearInterval(id)
          window.setTimeout(() => setStep("review"), 250)
          return STAGES.length
        }
        return s + 1
      })
    }, reduce ? 120 : 450)
    return () => window.clearInterval(id)
  }, [step])

  const targets = adultTargets(profile)
  const baseTimes = defaultMealTimes(profile)
  const slots = SLOTS[opts.mealsPerDay]

  const build = (o: PlanOptions) => {
    const final: PlanOptions = { ...o, weeklyBudgetBdt: useBudget ? o.weeklyBudgetBdt : undefined, people: o.preset === "family" ? profileCount : undefined, times: Object.fromEntries(slots.map((s) => [s, o.times[s] ?? baseTimes[s]])) }
    setOpts(final)
    setDraft(generatePlan(profile, final, { pantry, twin: twin.filter((t) => t.active).map((t) => t.text) }))
    setStage(0)
    setStep("building")
  }

  if (step === "building") {
    return (
      <>
        <PageHeader title="Building your plan" />
        <PageBody className="pt-4">
          <Surface padding="lg">
            <ol className="space-y-4" aria-live="polite">
              {STAGES.map((s, i) => (
                <li key={s} className="text-callout flex items-center gap-3">
                  <span className={cn("grid size-7 shrink-0 place-items-center rounded-full transition-colors", i < stage ? "bg-lime text-charcoal" : i === stage ? "bg-sage text-forest" : "bg-muted text-muted-foreground")}>
                    {i < stage ? <Check className="size-4" /> : i === stage ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" /> : <span className="size-1.5 rounded-full bg-muted-grey" />}
                  </span>
                  <span className={i <= stage ? "font-medium text-charcoal" : "text-muted-foreground"}>{s}</span>
                </li>
              ))}
            </ol>
          </Surface>
          <p className="text-caption px-1 text-muted-foreground">Our nutrition engine decides what is permitted. The assistant only helps choose among safe options.</p>
        </PageBody>
      </>
    )
  }

  if (step === "review" && draft)
    return (
      <DraftReview
        draft={draft}
        profile={profile}
        relaxTo={draft.validation.safety ? null : prepRelaxSuggestion(profile, opts)}
        onRelax={(m) => build({ ...opts, maxPrepMinutes: m })}
        onBack={() => setStep("setup")}
        onActivate={() => {
          addPlan(draft, true)
          toast("Plan activated", { description: "Your calendar and shopping list are ready." })
          router.replace("/plan")
        }}
        onSubmitReview={() => {
          addPlan({ ...draft, review: { status: "pending", submittedAt: new Date().toISOString() } }, false)
          toast("Sent for professional review", { description: "You'll be able to activate it once a dietitian approves it." })
          router.replace("/plan/plans")
        }}
        onSaveDraft={() => {
          addPlan(draft, false)
          toast("Saved as a draft")
          router.replace("/plan/plans")
        }}
      />
    )

  const tileCls = (on: boolean) =>
    cn(
      "flex h-16 flex-col items-center justify-center rounded-2xl border-2 transition-colors disabled:cursor-not-allowed disabled:bg-muted disabled:shadow-none",
      on ? "border-lime bg-sage text-forest" : "border-transparent bg-card shadow-card hover:bg-muted/50",
    )
  const durationTile = (d: (typeof DURATIONS)[number]) => {
    const locked = !!d.feature && !features[d.feature]?.allowed
    const on = d.months ? opts.frameworkMonths === d.months : !opts.frameworkMonths && opts.durationDays === d.days
    return (
      <button key={`${d.label}${d.unit}`} disabled={locked} onClick={() => setOpts({ ...opts, durationDays: d.days, frameworkMonths: d.months })} aria-pressed={on} className={tileCls(on)}>
        <span className={cn("tabular text-headline leading-tight", locked && "text-muted-foreground")}>{d.label}</span>
        <span className="flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground">
          {locked && <Lock className="size-3" aria-label="Premium" />}
          {d.unit}
        </span>
      </button>
    )
  }
  const rules = activeHardRules(profile)

  if (!targets.supported) {
    return (
      <>
        <FlowHeader title="New meal plan" backHref="/plan" />
        <PageBody className="pt-3">
          <SafetyAlert title="A personalized plan needs professional input">{targets.reason ?? "Your health information needs review before we can create a personalized plan."}</SafetyAlert>
          <GeneralGuidance profile={profile} />
        </PageBody>
        <StickyFooter>
          <Button asChild size="lg" className="w-full">
            <Link href="/profile/professional">Share with a professional</Link>
          </Button>
        </StickyFooter>
      </>
    )
  }

  return (
    <>
      <FlowHeader title="New meal plan" step={1} total={2} backHref="/plan" />
      <PageBody className="pt-3">
        {targets.safetyWarnings.map((w) => (
          <InfoNote key={w} title="About your goal">
            {w}
          </InfoNote>
        ))}

        <Section title="How long?" badge={<FeatureBadge feature="plan_long" />}>
          <div className="grid grid-cols-5 gap-2">{DURATIONS.filter((d) => !d.months).map(durationTile)}</div>
          <p className="text-caption px-1 text-muted-foreground">3- and 7-day plans are free. 1, 14 and 30 days are Premium.</p>
          <div className="space-y-2 pt-2">
            <p className="text-overline flex items-center gap-2 px-1 text-muted-foreground">
              Long-term framework <FeatureBadge feature="plan_framework" />
            </p>
            <div className="grid grid-cols-2 gap-2">{DURATIONS.filter((d) => d.months).map(durationTile)}</div>
            <p className="text-caption px-1 text-muted-foreground">Weekly themes and a fresh 7-day plan each week, not a fixed daily menu.</p>
          </div>
        </Section>

        <Section title="Start date">
          <Input id="start" type="date" aria-label="Start date" value={opts.startDate} min={todayISO()} onChange={(e) => setOpts({ ...opts, startDate: e.target.value })} />
        </Section>

        <Section title="Meals each day" description={profile.mealsPerDay ? "Defaulted from your profile." : undefined}>
          <div className="grid grid-cols-3 gap-2">
            {([3, 4, 5] as const).map((n) => {
              const on = opts.mealsPerDay === n
              return (
                <button key={n} onClick={() => setOpts({ ...opts, mealsPerDay: n })} aria-pressed={on} className={tileCls(on)}>
                  <span className="text-body font-semibold">{n} meals</span>
                  <span className="text-[11px] font-medium text-muted-foreground">{n === 3 ? "No snacks" : n === 4 ? "1 snack" : "2 snacks"}</span>
                </button>
              )
            })}
          </div>
        </Section>

        <Section title="Meal times" description={profile.workStart && profile.workEnd ? `Suggested from your work hours (${formatTime(profile.workStart)}–${formatTime(profile.workEnd)}).` : "Change any time to fit your day."}>
          <ListGroup>
            {slots.map((s) => (
              <MealTimeRow key={s} id={`t-${s}`} mealType={s} value={opts.times[s] ?? baseTimes[s]} onChange={(v) => setOpts({ ...opts, times: { ...opts.times, [s]: v } })} />
            ))}
          </ListGroup>
        </Section>

        <Section title="Plan style" description="Style only re-ranks recipes that already meet your allergies and dietary rules.">
          <div className="space-y-2" role="radiogroup" aria-label="Plan style">
            {PRESETS.map((p) => {
              const locked = p.feature ? !features[p.feature]?.allowed : false
              return (
                <ChoiceCard
                  key={p.id}
                  selected={opts.preset === p.id}
                  disabled={locked}
                  onSelect={() => setOpts({ ...opts, preset: p.id })}
                  icon={p.icon}
                  title={presetLabel(p.id)}
                  badge={p.feature ? <FeatureBadge feature={p.feature} /> : undefined}
                  description={locked ? "Included in Premium" : p.id === "pantry" ? `${p.hint} (${pantry.length} items)` : p.id === "family" ? `${p.hint} · shopping for ${profileCount}` : p.hint}
                />
              )
            })}
          </div>
        </Section>

        <Section title="Budget" badge={<FeatureBadge feature="budget_optimizer" />}>
          <ListGroup>
            <ListRow icon={<Wallet />} iconTone="amber" title={<label htmlFor="budget-on">Keep within my weekly budget</label>} description="Cheaper safe recipes are preferred until the plan fits. Never at the cost of allergy, diet or protein needs." trailing={<Switch id="budget-on" checked={useBudget} onCheckedChange={setUseBudget} />} />
            {useBudget && (
              <ListRow
                icon={<Banknote />}
                iconTone="lime"
                title={<label htmlFor="budget">Weekly food budget</label>}
                trailing={
                  <div className="flex items-center gap-1.5">
                    <span className="text-callout text-muted-foreground">৳</span>
                    <Input id="budget" inputMode="numeric" className="w-24" value={opts.weeklyBudgetBdt ?? ""} onChange={(e) => setOpts({ ...opts, weeklyBudgetBdt: Number(e.target.value.replace(/\D/g, "")) || undefined })} />
                  </div>
                }
              />
            )}
          </ListGroup>
        </Section>

        <Section title="Cooking time">
          <Surface>
            <div className="flex items-center gap-3">
              <IconTile tone="sky">
                <Timer />
              </IconTile>
              <div className="min-w-0 flex-1">
                <p className="text-caption text-muted-foreground">Up to</p>
                <p className="tabular text-headline">{opts.maxPrepMinutes} min per meal</p>
              </div>
            </div>
            <Slider className="mt-4" min={10} max={90} step={5} value={[opts.maxPrepMinutes]} onValueChange={([v]) => setOpts({ ...opts, maxPrepMinutes: v })} aria-label="Maximum cooking time" />
            <p className="text-caption mt-3 text-muted-foreground">We only use recipes within this time. If a meal can&apos;t be filled, we&apos;ll ask before allowing longer.</p>
          </Surface>
        </Section>

        <InfoNote title="Rules we always apply">
          {rules.length ? `${rules.join("; ")}.` : "No allergies or diet rules recorded."} Age and food-safety rules apply to every meal.
        </InfoNote>
      </PageBody>
      <StickyFooter>
        <Button size="lg" className="w-full" onClick={() => build(opts)}>
          Create draft plan
        </Button>
      </StickyFooter>
    </>
  )
}

/** General healthy-eating guidance for profiles whose targets need a professional (§13.1). No calorie numbers. */
function GeneralGuidance({ profile }: { profile: Profile }) {
  const h = hydrationGuide(profile)
  const tips = [
    { title: "Build a familiar plate", body: "About half vegetables or shak, a quarter rice or roti, and a quarter dal, fish, egg or chicken." },
    { title: "Eat regularly", body: "Three meals at roughly the same times each day, with a snack if you're hungry in between." },
    { title: "Include pulses and greens", body: "Masoor dal, chickpeas and leafy shak add protein, fiber and iron." },
    { title: "Choose water first", body: h.kind === "range" ? `Around ${h.lowGlasses}–${h.highGlasses} glasses a day from all drinks, as a general guide.` : h.note },
    { title: "Go easy on salt and sugar", body: "Taste before adding salt, and keep sweets and sugary drinks occasional." },
  ]
  return (
    <Section title="General healthy-eating guidance" description="Safe, general guidance while a professional sets your personal targets. It doesn't replace their advice.">
      <ListGroup>
        {tips.map((t) => (
          <ListRow key={t.title} icon={<Leaf />} title={t.title} description={t.body} />
        ))}
      </ListGroup>
      <InfoNote>You can still browse reviewed recipes and log meals. We won&apos;t show calorie targets until your care team sets them.</InfoNote>
    </Section>
  )
}

function DraftReview({
  draft,
  profile,
  relaxTo,
  onRelax,
  onBack,
  onActivate,
  onSaveDraft,
  onSubmitReview,
}: {
  draft: MealPlan
  profile: Profile
  relaxTo: number | null
  onRelax: (m: number) => void
  onBack: () => void
  onActivate: () => void
  onSaveDraft: () => void
  onSubmitReview: () => void
}) {
  const targets = adultTargets(profile)
  const days = useMemo(() => Array.from(new Set(draft.meals.map((m) => m.date))), [draft])
  const totals = useMemo(() => dayNutrition(draft.meals), [draft])
  const cost = draft.meals.reduce((s, m) => {
    const r = findRecipe(m.recipeId)
    return s + (r ? recipeCostPerServing(r) * m.servings : 0)
  }, 0)
  const perDay = (n: number) => n / Math.max(1, days.length)
  const v = draft.validation
  const checks = v.checks ?? []

  return (
    <>
      <FlowHeader title="Review your draft" step={2} total={2} onBack={onBack} />
      <PageBody className="pt-3">
        <div>
          <p className="text-display">{draft.title}</p>
          <p className="text-callout mt-1 text-muted-foreground">
            {formatDay(draft.startDate)} – {formatDay(addDays(draft.startDate, draft.durationDays - 1))}
            {draft.framework && " · first week of your framework"}
          </p>
        </div>

        <Surface padding="sm" className="grid grid-cols-3 gap-2">
          <StatTile label="Days" value={days.length} icon={<CalendarDays />} iconTone="lime" />
          <StatTile label="Avg energy" value={`~${Math.round(perDay(totals.energyKcal)).toLocaleString("en-US")}`} unit="kcal" icon={<Flame />} iconTone="terracotta" />
          <StatTile label="Food cost" value={fmt.bdt(cost)} hint="estimate" icon={<Wallet />} iconTone="amber" />
        </Surface>

        {!v.safety && (
          <SafetyAlert title="This draft can't be activated">
            {v.warnings.join(" ")}
            {relaxTo && (
              <Button size="sm" variant="outline" className="mt-3" onClick={() => onRelax(relaxTo)}>
                Allow up to {relaxTo} min and rebuild
              </Button>
            )}
          </SafetyAlert>
        )}
        {v.requiresReview && (
          <CautionNote title="Professional review required">Because of a recorded health condition, a qualified professional reviews this plan before it can be activated (§13.3). Until then it stays a draft and isn&apos;t marked as reviewed.</CautionNote>
        )}

        <Section title="Why these meals">
          <Surface>
            <ul className="text-callout space-y-2.5">
              {(draft.explanation ?? []).map((e) => (
                <li key={e} className="flex gap-2.5">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-sage text-forest">
                    <Check className="size-3" strokeWidth={3} aria-hidden />
                  </span>
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </Surface>
          <EstimateNote>Built by our rules-based nutrition engine from your profile — not written by AI.</EstimateNote>
        </Section>

        <Section title="Validation">
          <ValidationList checks={checks} />
        </Section>

        {draft.framework && (
          <Section title="Your framework" badge={<FeatureBadge feature="plan_framework" />}>
            <ListGroup>
              {draft.framework.weeks.slice(0, 8).map((w) => (
                <ListRow key={w.week} title={`Week ${w.week}`} description={w.theme} />
              ))}
            </ListGroup>
            <InfoNote>
              {draft.framework.weeks.length} weeks in total. Each new week is planned from your latest records and preferences, and every 4 weeks we ask you to update your weight, schedule and goals before continuing.
            </InfoNote>
          </Section>
        )}

        {targets.supported && (
          <Section title="Average day">
            <Surface className="space-y-4">
              <NutrientBar label="Energy" value={perDay(totals.energyKcal)} low={targets.energy.low} high={targets.energy.high} unit="kcal" kind="range" estimate />
              <NutrientBar label="Protein" value={perDay(totals.proteinG)} low={targets.proteinG.low} high={targets.proteinG.high} unit="g" kind="range" estimate color="protein" />
              <NutrientBar label="Fiber" value={perDay(totals.fiberG)} low={targets.fiberMinG} unit="g" kind="min" estimate color="fiber" />
              <div className="border-t border-border/70 pt-3">
                <EstimateNote>Targets are ranges from {targets.method}. Real intake will vary.</EstimateNote>
              </div>
            </Surface>
          </Section>
        )}

        <Section title="Meals">
          <div className="space-y-5">
            {days.map((d) => (
              <ListGroup key={d} label={formatDay(d, { weekday: "long", day: "numeric", month: "short" })}>
                {draft.meals
                  .filter((m) => m.date === d)
                  .map((m) => {
                    const r = findRecipe(m.recipeId)
                    if (!r) return null
                    return (
                      <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                        <RecipeThumb recipe={r} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-caption text-muted-foreground">
                            {MEAL_LABEL[m.mealType]} · {formatTime(m.time)}
                            {m.servings !== 1 && ` · ${m.servings} servings`}
                          </p>
                          <p className="text-body line-clamp-2 font-medium">{r.name}</p>
                        </div>
                      </div>
                    )
                  })}
              </ListGroup>
            ))}
          </div>
        </Section>
      </PageBody>
      <StickyFooter>
        {v.requiresReview ? (
          <Button size="lg" className="w-full" disabled={!v.safety} onClick={onSubmitReview}>
            Send for professional review
          </Button>
        ) : (
          <Button size="lg" className="w-full" disabled={!v.safety} onClick={onActivate}>
            Activate plan
          </Button>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={onBack}>
            Change options
          </Button>
          <Button variant="outline" onClick={onSaveDraft}>
            Save as draft
          </Button>
        </div>
      </StickyFooter>
    </>
  )
}
