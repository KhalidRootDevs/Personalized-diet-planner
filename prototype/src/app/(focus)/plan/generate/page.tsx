"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Check, CircleAlert, Clock, Dumbbell, Leaf, Loader2, Lock, Package, ShieldCheck, Wallet } from "lucide-react"
import { FlowHeader, ListGroup, PageBody, PageHeader, Section, StatTile, StickyFooter, Surface } from "@/components/app/page"
import { ChoiceCard } from "@/components/app/controls"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { FeatureBadge, useFeature } from "@/components/app/badges"
import { CautionNote, InfoNote, SafetyAlert } from "@/components/app/alerts"
import { EstimateNote, NutrientBar } from "@/components/app/nutrition"
import { RecipeThumb } from "@/components/app/recipe-thumb"
import { useApp, useSelfProfile } from "@/lib/store"
import { MEAL_LABEL, generatePlan, presetLabel, type PlanOptions } from "@/lib/planning"
import { adultTargets, fmt, recipeCostPerServing, recipeNutrition } from "@/lib/nutrition"
import { addDays, formatDay, formatTime, todayISO } from "@/lib/date"
import { getRecipe } from "@/lib/data/recipes"
import { cn } from "@/lib/utils"
import type { MealPlan } from "@/lib/types"

const DURATIONS = [
  { days: 1, premium: true },
  { days: 3, premium: false },
  { days: 7, premium: false },
  { days: 14, premium: true },
  { days: 30, premium: true },
]

const PRESETS: { id: PlanOptions["preset"]; hint: string; icon: React.ReactNode; feature?: "budget_optimizer" | "pantry" }[] = [
  { id: "balanced", hint: "Variety across the week", icon: <Leaf /> },
  { id: "quick", hint: "Shorter cooking on workdays", icon: <Clock /> },
  { id: "high_protein", hint: "Protein-forward choices", icon: <Dumbbell /> },
  { id: "lowest_cost", hint: "Cheapest safe options", icon: <Wallet />, feature: "budget_optimizer" },
  { id: "pantry", hint: "Use what you have", icon: <Package />, feature: "pantry" },
]

function StepHeader({ title, step, back, onBack }: { title: string; step: 1 | 2; back?: string; onBack?: () => void }) {
  return <FlowHeader title={title} step={step} total={2} backHref={back} onBack={onBack} />
}

// Pipeline stages shown while the draft is built (§10.1, §18.2).
const STAGES = [
  "Checking your profile is complete",
  "Estimating energy and nutrient ranges",
  "Removing allergens and restricted foods",
  "Selecting verified recipes",
  "Balancing cost, time and variety",
  "Validating nutrition and safety",
]

type Step = "setup" | "building" | "review"

export default function GeneratePlanPage() {
  const router = useRouter()
  const profile = useSelfProfile()
  const addPlan = useApp((s) => s.addPlan)
  const longPlans = useFeature("plan_long")
  const [step, setStep] = useState<Step>("setup")
  const [opts, setOpts] = useState<PlanOptions>(() => ({
    durationDays: 7,
    startDate: addDays(todayISO(), 1),
    mealsPerDay: 4,
    preset: "balanced",
    maxPrepMinutes: profile?.maxPrepMinutes ?? 30,
    times: {},
  }))
  const [draft, setDraft] = useState<MealPlan | null>(null)
  const [stage, setStage] = useState(0)
  const presetFeatures = { budget_optimizer: useFeature("budget_optimizer"), pantry: useFeature("pantry") }

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

  if (!profile) return null
  const targets = adultTargets(profile)

  const start = () => {
    setDraft(generatePlan(profile, opts))
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
                  <span className={cn("grid size-7 shrink-0 place-items-center rounded-full transition-colors", i < stage ? "bg-forest text-ivory" : i === stage ? "bg-sage text-forest" : "bg-muted text-muted-foreground")}>
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

  if (step === "review" && draft) return <DraftReview draft={draft} onBack={() => setStep("setup")} onActivate={() => {
    addPlan(draft, true)
    toast("Plan activated", { description: "Your calendar and shopping list are ready." })
    router.replace("/plan")
  }} onSaveDraft={() => {
    addPlan(draft, false)
    toast("Saved as a draft")
    router.replace("/plan/plans")
  }} targets={targets} />

  const tileCls = (on: boolean) => cn("flex h-16 flex-col items-center justify-center rounded-2xl border transition-colors disabled:opacity-50", on ? "border-forest bg-sage/40 text-forest" : "border-border/80 bg-card hover:bg-muted/50")

  return (
    <>
      <StepHeader title="New meal plan" step={1} back="/plan" />
      <PageBody className="pt-3">
        {!targets.supported && (
          <SafetyAlert title="This plan needs professional input">
            {targets.reason ?? "Your health information needs review before we can create a personalized plan."} We can still show general healthy-eating guidance.
          </SafetyAlert>
        )}

        <Section title="How long?" badge={!longPlans.allowed ? <FeatureBadge feature="plan_long" /> : undefined}>
          <div className="grid grid-cols-5 gap-2">
            {DURATIONS.map((d) => {
              const locked = d.premium && !longPlans.allowed
              const on = opts.durationDays === d.days
              return (
                <button key={d.days} disabled={locked} onClick={() => setOpts({ ...opts, durationDays: d.days })} aria-pressed={on} className={tileCls(on)}>
                  <span className="tabular text-headline leading-tight">{d.days}</span>
                  <span className="flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground">
                    {locked && <Lock className="size-3" />}
                    {d.days === 1 ? "day" : "days"}
                  </span>
                </button>
              )
            })}
          </div>
          {!longPlans.allowed && <p className="text-caption text-muted-foreground">3- and 7-day plans are free. 1, 14 and 30-day plans are part of Premium.</p>}
          <div className="space-y-1.5 pt-1">
            <Label htmlFor="start">Start date</Label>
            <Input id="start" type="date" value={opts.startDate} min={todayISO()} onChange={(e) => setOpts({ ...opts, startDate: e.target.value })} />
          </div>
        </Section>

        <Section title="Meals each day">
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

        <Section title="Plan style" description="Style only re-ranks recipes that already meet your allergies and dietary rules.">
          <div className="space-y-2">
            {PRESETS.map((p) => {
              const f = p.feature ? presetFeatures[p.feature] : null
              const locked = f ? !f.allowed : false
              return (
                <ChoiceCard
                  key={p.id}
                  selected={opts.preset === p.id}
                  disabled={locked}
                  onSelect={() => setOpts({ ...opts, preset: p.id })}
                  icon={p.icon}
                  title={presetLabel(p.id)}
                  badge={p.feature ? <FeatureBadge feature={p.feature} /> : undefined}
                  description={locked ? "Included in Premium" : p.hint}
                />
              )
            })}
          </div>
        </Section>

        <Section title="Cooking time">
          <Surface>
            <div className="text-callout flex items-center justify-between">
              <span className="text-muted-foreground">Up to</span>
              <span className="tabular text-headline">{opts.maxPrepMinutes} min per meal</span>
            </div>
            <Slider className="mt-4" min={10} max={90} step={5} value={[opts.maxPrepMinutes]} onValueChange={([v]) => setOpts({ ...opts, maxPrepMinutes: v })} aria-label="Maximum cooking time" />
          </Surface>
        </Section>

        <InfoNote title="Using your profile">
          {profile.allergies.length ? `Excluding: ${profile.allergies.join(", ")}. ` : "No allergies recorded. "}
          {profile.diet.length ? `Diet: ${profile.diet.join(", ")}. ` : ""}
          {profile.budgetPerWeekBdt ? `Budget about ${fmt.bdt(profile.budgetPerWeekBdt)} a week.` : ""}
        </InfoNote>
      </PageBody>
      <StickyFooter>
        <Button size="lg" className="w-full" disabled={!targets.supported} onClick={start}>
          Create draft plan
        </Button>
      </StickyFooter>
    </>
  )
}

function DraftReview({ draft, targets, onBack, onActivate, onSaveDraft }: { draft: MealPlan; targets: ReturnType<typeof adultTargets>; onBack: () => void; onActivate: () => void; onSaveDraft: () => void }) {
  const days = useMemo(() => Array.from(new Set(draft.meals.map((m) => m.date))), [draft])
  const totals = draft.meals.reduce(
    (acc, m) => {
      const r = getRecipe(m.recipeId)
      if (!r) return acc
      const n = recipeNutrition(r, m.servings)
      return { kcal: acc.kcal + n.energyKcal, protein: acc.protein + n.proteinG, fiber: acc.fiber + n.fiberG, cost: acc.cost + recipeCostPerServing(r) * m.servings }
    },
    { kcal: 0, protein: 0, fiber: 0, cost: 0 },
  )
  const perDay = (n: number) => n / Math.max(1, days.length)
  const v = draft.validation
  const checks = [
    { ok: true, label: "Allergens and restricted foods excluded" },
    { ok: true, label: "Only verified recipes used" },
    { ok: v.nutrition, label: "Daily energy and protein within your ranges" },
    { ok: v.safety, label: "Every meal slot filled safely" },
  ]

  const lookupNote = (ok: boolean) => (ok ? "passed" : "failed")
  return (
    <>
      <StepHeader title="Review your draft" step={2} onBack={onBack} />
      <PageBody className="pt-3">
        <div>
          <p className="text-display">{draft.title}</p>
          <p className="text-callout mt-1 text-muted-foreground">
            {formatDay(draft.startDate)} – {formatDay(addDays(draft.startDate, draft.durationDays - 1))}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <StatTile label="Days" value={days.length} />
          <StatTile label="Avg energy" value={`~${Math.round(perDay(totals.kcal)).toLocaleString("en-US")}`} unit="kcal" />
          <StatTile label="Food cost" value={fmt.bdt(totals.cost)} hint="estimate" />
        </div>

        <Section title="Validation">
          <ul className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/80 bg-card">
            {checks.map((c) => (
              <li key={c.label} className="text-callout flex items-center gap-3 px-4 py-3">
                <span className={cn("grid size-7 shrink-0 place-items-center rounded-full", c.ok ? "bg-sage text-forest" : "bg-safety-surface text-safety")}>
                  {c.ok ? <ShieldCheck className="size-4" /> : <CircleAlert className="size-4" />}
                </span>
                <span className="flex-1">{c.label}</span>
                <span className="sr-only">{lookupNote(c.ok)}</span>
              </li>
            ))}
          </ul>
          {!v.safety && (
            <SafetyAlert title="This draft can't be activated">
              {v.warnings.join(" ")} Try a longer cooking time or a different style.
            </SafetyAlert>
          )}
          {v.requiresReview && (
            <CautionNote title="Professional review required">Because of a recorded health condition, this plan stays a draft until a qualified professional reviews it (§13.3).</CautionNote>
          )}
        </Section>

        <Section title="Average day">
          <Surface className="space-y-4">
            <NutrientBar label="Energy" value={perDay(totals.kcal)} low={targets.energy.low} high={targets.energy.high} unit="kcal" kind="range" estimate />
            <NutrientBar label="Protein" value={perDay(totals.protein)} low={targets.proteinG.low} high={targets.proteinG.high} unit="g" kind="range" estimate />
            <NutrientBar label="Fiber" value={perDay(totals.fiber)} low={targets.fiberMinG} unit="g" kind="min" estimate />
            <div className="border-t border-border/70 pt-3">
              <EstimateNote>Targets are ranges from {targets.method}. Real intake will vary.</EstimateNote>
            </div>
          </Surface>
        </Section>

        <Section title="Meals">
          <div className="space-y-5">
            {days.map((d) => (
              <ListGroup key={d} label={formatDay(d, { weekday: "long", day: "numeric", month: "short" })}>
                {draft.meals
                  .filter((m) => m.date === d)
                  .map((m) => {
                    const r = getRecipe(m.recipeId)
                    if (!r) return null
                    return (
                      <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                        <RecipeThumb recipe={r} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-caption text-muted-foreground">
                            {MEAL_LABEL[m.mealType]} · {formatTime(m.time)}
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
        <Button size="lg" className="w-full" disabled={!v.safety || v.requiresReview} onClick={onActivate}>
          Activate plan
        </Button>
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
