"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Check, CircleAlert, Loader2, ShieldCheck } from "lucide-react"
import { PageHeader, PageBody, Section } from "@/components/app/page"
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

const PRESETS: { id: PlanOptions["preset"]; hint: string; feature?: "budget_optimizer" | "pantry" }[] = [
  { id: "balanced", hint: "Variety across the week" },
  { id: "quick", hint: "Shorter cooking on workdays" },
  { id: "high_protein", hint: "Protein-forward choices" },
  { id: "lowest_cost", hint: "Cheapest safe options", feature: "budget_optimizer" },
  { id: "pantry", hint: "Use what you have", feature: "pantry" },
]

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
        <PageBody className="pt-6">
          <p className="text-sm text-muted-foreground">Our nutrition engine decides what is permitted. The assistant only helps choose among safe options.</p>
          <ol className="space-y-3" aria-live="polite">
            {STAGES.map((s, i) => (
              <li key={s} className="flex items-center gap-3 text-sm">
                <span className={cn("grid size-7 place-items-center rounded-full", i < stage ? "bg-forest text-primary-foreground" : "bg-muted text-muted-foreground")}>
                  {i < stage ? <Check className="size-4" /> : i === stage ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" /> : <span className="size-1.5 rounded-full bg-muted-grey" />}
                </span>
                <span className={i <= stage ? "text-foreground" : "text-muted-foreground"}>{s}</span>
              </li>
            ))}
          </ol>
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

  return (
    <>
      <PageHeader title="New meal plan" back="/plan" />
      <PageBody>
        {!targets.supported && (
          <SafetyAlert title="This plan needs professional input">
            {targets.reason ?? "Your health information needs review before we can create a personalized plan."} We can still show general healthy-eating guidance.
          </SafetyAlert>
        )}

        <Section title="How long?">
          <div className="grid grid-cols-5 gap-1.5">
            {DURATIONS.map((d) => {
              const locked = d.premium && !longPlans.allowed
              return (
                <button
                  key={d.days}
                  disabled={locked}
                  onClick={() => setOpts({ ...opts, durationDays: d.days })}
                  aria-pressed={opts.durationDays === d.days}
                  className={cn("flex h-14 flex-col items-center justify-center rounded-xl border bg-card text-sm", opts.durationDays === d.days && "border-forest bg-sage/40 font-semibold text-forest", locked && "opacity-50")}
                >
                  <span className="tabular">{d.days}</span>
                  <span className="text-[11px] text-muted-foreground">{d.days === 1 ? "day" : "days"}</span>
                </button>
              )
            })}
          </div>
          {!longPlans.allowed && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FeatureBadge feature="plan_long" /> 1, 14 and 30-day plans are part of Premium.
            </p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="start">Start date</Label>
            <Input id="start" type="date" value={opts.startDate} min={todayISO()} onChange={(e) => setOpts({ ...opts, startDate: e.target.value })} />
          </div>
        </Section>

        <Section title="Meals each day">
          <div className="grid grid-cols-3 gap-1.5">
            {([3, 4, 5] as const).map((n) => (
              <button key={n} onClick={() => setOpts({ ...opts, mealsPerDay: n })} aria-pressed={opts.mealsPerDay === n} className={cn("rounded-xl border bg-card p-2.5 text-sm", opts.mealsPerDay === n && "border-forest bg-sage/40 font-semibold text-forest")}>
                {n} meals
                <span className="block text-[11px] font-normal text-muted-foreground">{n === 3 ? "No snacks" : n === 4 ? "1 snack" : "2 snacks"}</span>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Plan style">
          <div className="space-y-2">
            {PRESETS.map((p) => {
              const f = p.feature ? presetFeatures[p.feature] : null
              const locked = f ? !f.allowed : false
              return (
                <button
                  key={p.id}
                  disabled={locked}
                  onClick={() => setOpts({ ...opts, preset: p.id })}
                  aria-pressed={opts.preset === p.id}
                  className={cn("flex w-full items-center justify-between rounded-xl border bg-card p-3 text-left", opts.preset === p.id && "border-forest bg-sage/40", locked && "opacity-55")}
                >
                  <span>
                    <span className="block text-sm font-medium">{presetLabel(p.id)}</span>
                    <span className="block text-xs text-muted-foreground">{locked ? "Included in Premium" : p.hint}</span>
                  </span>
                  {p.feature && <FeatureBadge feature={p.feature} />}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground">Style only re-ranks recipes that already meet your allergies and dietary rules; it never makes an unsafe recipe eligible.</p>
        </Section>

        <Section title="Cooking time">
          <div className="flex items-center justify-between text-sm">
            <span>Up to</span>
            <span className="tabular font-semibold">{opts.maxPrepMinutes} min per meal</span>
          </div>
          <Slider min={10} max={90} step={5} value={[opts.maxPrepMinutes]} onValueChange={([v]) => setOpts({ ...opts, maxPrepMinutes: v })} aria-label="Maximum cooking time" />
        </Section>

        <InfoNote title="Using your profile">
          {profile.allergies.length ? `Excluding: ${profile.allergies.join(", ")}. ` : "No allergies recorded. "}
          {profile.diet.length ? `Diet: ${profile.diet.join(", ")}. ` : ""}
          {profile.budgetPerWeekBdt ? `Budget about ${fmt.bdt(profile.budgetPerWeekBdt)} a week.` : ""}
        </InfoNote>

        <Button size="lg" className="w-full" disabled={!targets.supported} onClick={start}>
          Create draft plan
        </Button>
      </PageBody>
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

  return (
    <>
      <PageHeader title="Review your draft" />
      <PageBody>
        <div>
          <p className="font-serif text-2xl">{draft.title}</p>
          <p className="text-sm text-muted-foreground">
            {formatDay(draft.startDate)} – {formatDay(addDays(draft.startDate, draft.durationDays - 1))}
          </p>
        </div>

        <Section title="Validation">
          <ul className="space-y-2 rounded-2xl border bg-card p-3">
            {checks.map((c) => (
              <li key={c.label} className="flex items-center gap-2 text-sm">
                {c.ok ? <ShieldCheck className="size-4.5 text-forest" /> : <CircleAlert className="size-4.5 text-safety" />}
                <span>{c.label}</span>
                <span className="sr-only">{c.ok ? "passed" : "failed"}</span>
              </li>
            ))}
          </ul>
          {!v.safety && (
            <SafetyAlert title="This draft can't be activated">
              {v.warnings.join(" ")} Try a longer cooking time or a different style.
            </SafetyAlert>
          )}
          {v.requiresReview && (
            <CautionNote title="Professional review required">
              Because of a recorded health condition, this plan stays a draft until a qualified professional reviews it (§13.3).
            </CautionNote>
          )}
        </Section>

        <Section title="Average day">
          <div className="space-y-3 rounded-2xl border bg-card p-4">
            <NutrientBar label="Energy" value={perDay(totals.kcal)} low={targets.energy.low} high={targets.energy.high} unit="kcal" kind="range" estimate />
            <NutrientBar label="Protein" value={perDay(totals.protein)} low={targets.proteinG.low} high={targets.proteinG.high} unit="g" kind="range" estimate />
            <NutrientBar label="Fiber" value={perDay(totals.fiber)} low={targets.fiberMinG} unit="g" kind="min" estimate />
            <p className="tabular text-sm">
              Estimated food cost: <strong>{fmt.bdt(totals.cost)}</strong> for the plan
            </p>
          </div>
          <EstimateNote>Targets are ranges from {targets.method}. Real intake will vary.</EstimateNote>
        </Section>

        <Section title="Meals">
          <div className="space-y-3">
            {days.map((d) => (
              <div key={d} className="rounded-2xl border bg-card p-3">
                <p className="mb-2 text-sm font-semibold">{formatDay(d)}</p>
                <ul className="space-y-2">
                  {draft.meals
                    .filter((m) => m.date === d)
                    .map((m) => {
                      const r = getRecipe(m.recipeId)
                      if (!r) return null
                      return (
                        <li key={m.id} className="flex items-center gap-2.5">
                          <RecipeThumb recipe={r} size="sm" />
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">
                              {MEAL_LABEL[m.mealType]} · {formatTime(m.time)}
                            </p>
                            <p className="truncate text-sm">{r.name}</p>
                          </div>
                        </li>
                      )
                    })}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        <div className="sticky bottom-0 -mx-4 space-y-2 border-t bg-background/95 px-4 pt-3 pb-safe backdrop-blur-none">
          <Button size="lg" className="w-full" disabled={!v.safety || v.requiresReview} onClick={onActivate}>
            Activate plan
          </Button>
          <div className="grid grid-cols-2 gap-2 pb-3">
            <Button variant="outline" onClick={onBack}>
              Change options
            </Button>
            <Button variant="outline" onClick={onSaveDraft}>
              Save as draft
            </Button>
          </div>
        </div>
      </PageBody>
    </>
  )
}
