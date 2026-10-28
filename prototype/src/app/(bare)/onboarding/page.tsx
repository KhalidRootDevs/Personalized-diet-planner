"use client"

// Progressive onboarding (§5.1–§5.9) with consent before health, photo and child data (§5.10, §21.4).
// Each step fits one phone screen without scrolling (UI-SPEC §5.2), so §5's nine sections are split into smaller steps.
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Armchair, Baby, Bike, Clock, Dumbbell, Footprints, HardHat, HeartPulse, Lock, ShieldAlert, ShieldCheck, Smile, Stethoscope, User, Users } from "lucide-react"
import { useApp } from "@/lib/store"
import { ageInMonths, ageInYears } from "@/lib/nutrition"
import { addDays, todayISO } from "@/lib/date"
import type { Allergen, ConsentRecord, Profile } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { PhaseBadge } from "@/components/app/badges"
import { CautionNote, InfoNote, SafetyAlert } from "@/components/app/alerts"
import { Splash } from "@/components/app/shell"
import { FlowHeader, IconTile, StatTile, StickyFooter, Surface, type IconTone } from "@/components/app/page"
import { ChipGroup, ChoiceCard, Field, PillGroup, WhyWeAsk } from "@/components/app/controls"
import { TargetsCard } from "@/components/profile/targets-card"
import { ACTIVITY, ALLERGENS, CONDITIONS, DIETS, GOALS, OCCUPATIONS, REVIEW_CONDITIONS } from "@/components/profile/options"
import { RECIPE_PHOTO } from "@/lib/data/photos"

type Who = "self" | "baby" | "child"

type StepId =
  | "who"
  | "basics"
  | "body"
  | "goal"
  | "work"
  | "activity"
  | "diet"
  | "health_consent"
  | "allergies"
  | "conditions"
  | "circumstances"
  | "health_flags"
  | "urgent"
  | "budget"
  | "cooking"
  | "kitchen"
  | "review"
  | "safeguards"
  | "permissions"
  | "child_consent"
  | "child_basics"
  | "child_details"
  | "child_health"
  | "child_reactions"

const ADULT_STEPS: StepId[] = ["who", "basics", "body", "goal", "work", "activity", "diet", "health_consent", "allergies", "conditions", "circumstances", "health_flags", "urgent", "budget", "cooking", "kitchen", "review", "safeguards", "permissions"]
const CHILD_STEPS: StepId[] = ["who", "child_consent", "child_basics", "child_details", "child_health", "child_reactions", "review", "permissions"]

const BUDGETS = [
  { value: 1200, label: "Very budget-conscious", description: "About ৳1,200 per week" },
  { value: 2000, label: "Budget-friendly", description: "About ৳2,000 per week" },
  { value: 3000, label: "Moderate", description: "About ৳3,000 per week" },
  { value: 4500, label: "Flexible", description: "About ৳4,500 per week" },
]

const PREP = [
  { value: 10, label: "Under 10 minutes" },
  { value: 20, label: "10–20 minutes" },
  { value: 40, label: "20–40 minutes" },
  { value: 60, label: "More than 40 minutes" },
]

const EQUIPMENT = [
  { value: "stove", label: "Stove" },
  { value: "fridge", label: "Refrigerator" },
  { value: "microwave", label: "Microwave" },
  { value: "rice_cooker", label: "Rice cooker" },
  { value: "batch", label: "I can batch-cook" },
  { value: "carry", label: "I carry food to work" },
]

/** §5 health conditions, split over two one-screen steps. Pregnancy and similar circumstances come second. */
const CIRCUMSTANCE_IDS = ["pregnancy", "breastfeeding", "eating_disorder", "swallowing"]
const CONDITION_OPTS = CONDITIONS.filter((c) => !CIRCUMSTANCE_IDS.includes(c.value))
const CIRCUMSTANCE_OPTS = CONDITIONS.filter((c) => CIRCUMSTANCE_IDS.includes(c.value))

const consent = (type: ConsentRecord["type"], granted: boolean): ConsentRecord => ({ type, granted, version: "1.0", at: new Date().toISOString() })

export default function OnboardingPage() {
  const router = useRouter()
  const hydrated = useApp((s) => s.hydrated)
  const user = useApp((s) => s.user)
  const onboarded = useApp((s) => s.onboarded)
  const completeOnboarding = useApp((s) => s.completeOnboarding)
  const updateSettings = useApp((s) => s.updateSettings)
  const language = useApp((s) => s.settings.language)

  useEffect(() => {
    if (!hydrated) return
    if (!user) router.replace("/welcome")
    else if (onboarded) router.replace("/home")
  }, [hydrated, user, onboarded, router])

  const [who, setWho] = useState<Who>("self")
  const [step, setStep] = useState(0)

  // Adult answers
  const [p, setP] = useState<Partial<Profile>>({
    type: "adult",
    relation: "self",
    dateOfBirth: "1995-01-01",
    diet: ["halal"],
    allergies: [],
    conditions: [],
    activity: "light",
    occupation: "office_worker",
    workStart: "09:00",
    workEnd: "17:00",
    goal: "improve_nutrition",
    budgetPerWeekBdt: 2000,
    maxPrepMinutes: 20,
    mealsPerDay: 3,
    includeSnacks: true,
  })
  const set = (patch: Partial<Profile>) => setP((x) => ({ ...x, ...patch }))
  const [equipment, setEquipment] = useState<string[]>(["stove", "fridge"])
  const [flags, setFlags] = useState({ medications: false, clinicianDiet: false, weightChange: false })
  const [emergency, setEmergency] = useState(false)

  // Child answers
  const [child, setChild] = useState<Partial<Profile>>({
    type: "infant",
    relation: "child",
    name: "",
    dateOfBirth: addDays(todayISO(), -213),
    sex: "male",
    feeding: "breastfeeding",
    allergies: [],
    conditions: [],
    diet: [],
    avatarColor: "sage",
  })
  const setC = (patch: Partial<Profile>) => setChild((x) => ({ ...x, ...patch }))
  const [childReactions, setChildReactions] = useState(false)

  // Consents (§5.10): asked right before the data they cover.
  const [consents, setConsents] = useState({ health_data: false, child_data: false, food_photos: true, ai_processing: true, analytics: false })
  const toggleConsent = (k: keyof typeof consents, v: boolean) => setConsents((c) => ({ ...c, [k]: v }))

  const steps = who === "self" ? ADULT_STEPS : CHILD_STEPS
  const id = steps[step]

  const adultAge = p.dateOfBirth ? ageInYears(p.dateOfBirth) : 0
  const childMonths = child.dateOfBirth ? ageInMonths(child.dateOfBirth) : 0
  const reviewNeeded = (p.conditions ?? []).filter((c) => REVIEW_CONDITIONS.includes(c))
  const restrictionUnsafe = (p.conditions ?? []).some((c) => ["eating_disorder", "pregnancy", "breastfeeding"].includes(c)) || flags.weightChange

  const canNext = useMemo(() => {
    switch (id) {
      case "basics":
        return !!p.dateOfBirth && adultAge >= 18 && !!p.sex
      case "body":
        return !!p.heightCm && !!p.weightKg
      case "health_consent":
        return consents.health_data
      case "urgent":
        return !emergency
      case "child_consent":
        return consents.child_data
      case "child_basics":
        return !!child.name?.trim() && !!child.dateOfBirth && childMonths >= 0
      default:
        return true
    }
  }, [id, p, adultAge, consents, child, childMonths, emergency])

  if (!hydrated || !user || onboarded) return <Splash />

  const finish = () => {
    const records = (Object.keys(consents) as (keyof typeof consents)[]).map((k) => consent(k, consents[k]))
    const goal = restrictionUnsafe && p.goal === "lose_weight" ? "improve_nutrition" : p.goal
    if (who === "self") {
      completeOnboarding({ ...p, goal, name: user.name }, records)
    } else {
      const months = childMonths
      completeOnboarding({ name: user.name }, records, { ...child, type: months < 12 ? "infant" : "child", name: child.name!.trim() })
      useApp.getState().setActiveProfile("p_baby")
    }
    router.replace("/home")
  }

  const next = () => (step < steps.length - 1 ? setStep(step + 1) : finish())
  const back = () => (step > 0 ? setStep(step - 1) : router.push("/welcome"))

  return (
    <main className="flex flex-1 flex-col">
      <FlowHeader title="Set up your profile" step={step + 1} total={steps.length} onBack={back} />

      <div className="px-gutter flex-1 space-y-4 pt-2 pb-5">
        {id === "who" && (
          <StepIntro title="Who is this plan for?" text="Babies and children never get an adult questionnaire.">
            <div role="radiogroup" className="space-y-2">
              <ChoiceCard className={cn(DENSE, TONE.lime)} selected={who === "self"} onSelect={() => setWho("self")} icon={<User className="size-5" />} title="Myself" description="Plans for your body, work and goals" />
              <ChoiceCard className={cn(DENSE, TONE.sky)} selected={who === "baby"} onSelect={() => { setWho("baby"); setC({ dateOfBirth: addDays(todayISO(), -213) }) }} icon={<Baby className="size-5" />} title="My baby" description="First foods from about 6 months" />
              <ChoiceCard className={cn(DENSE, TONE.amber)} selected={who === "child"} onSelect={() => { setWho("child"); setC({ dateOfBirth: addDays(todayISO(), -365 * 4) }) }} icon={<Smile className="size-5" />} title="My child" description="Child-appropriate guidance, no calorie counting" />
              <ChoiceCard className={cn(DENSE, TONE.coral)} selected={false} disabled onSelect={() => {}} icon={<Users className="size-5" />} title="Partner or family" description="Needs household permissions" badge={<PhaseBadge phase={2} />} />
            </div>
            {who !== "self" && <InfoNote className={NOTE}>You stay the primary profile and manage {who === "baby" ? "your baby's" : "your child's"} profile as their caregiver.</InfoNote>}
          </StepIntro>
        )}

        {id === "basics" && (
          <StepIntro title="A few basics" text="Used to estimate your energy needs. You can update these any time.">
            <Field label="Date of birth" htmlFor="dob" error={p.dateOfBirth && adultAge < 18 ? "Personal adult plans are for people 18 and over. For a younger person, add a child profile instead." : undefined}>
              <Input id="dob" type="date" value={p.dateOfBirth ?? ""} max={todayISO()} onChange={(e) => set({ dateOfBirth: e.target.value })} />
            </Field>
            <Field label="Sex" hint="Used only where validated estimation methods need it.">
              <PillGroup label="Sex" value={p.sex} onChange={(v) => set({ sex: v })} options={[{ value: "female", label: "Female" }, { value: "male", label: "Male" }]} />
            </Field>
            <Field label="Language">
              <PillGroup label="Language" value={language} onChange={(v) => updateSettings({ language: v })} options={[{ value: "en", label: "English" }, { value: "bn", label: "বাংলা" }]} />
            </Field>
          </StepIntro>
        )}

        {id === "body" && (
          <StepIntro title="Height and weight" text="Self-reported values. We keep them separate from clinically measured ones.">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Height (cm)" htmlFor="height">
                <Input id="height" type="number" inputMode="decimal" min={100} max={230} value={p.heightCm ?? ""} onChange={(e) => set({ heightCm: Number(e.target.value) || undefined })} />
              </Field>
              <Field label="Weight (kg)" htmlFor="weight">
                <Input id="weight" type="number" inputMode="decimal" min={30} max={250} value={p.weightKg ?? ""} onChange={(e) => set({ weightKg: Number(e.target.value) || undefined })} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Country" value="Bangladesh" />
              <StatTile label="Time zone · currency" value="Dhaka · BDT" />
            </div>
          </StepIntro>
        )}

        {id === "goal" && (
          <StepIntro title="What's your main goal?" text="Pick the one that matters most right now.">
            <PillGroup label="Main goal" value={p.goal} onChange={(v) => set({ goal: v })} options={GOALS.map((g) => ({ value: g.value, label: g.label }))} />
            {p.goal === "condition" && <p className="text-caption text-muted-foreground">We&apos;ll ask about your health soon. Condition plans open only after clinical review.</p>}
          </StepIntro>
        )}

        {id === "work" && (
          <StepIntro title="Your work" text="Work changes how much energy you need and when you eat.">
            <PillGroup label="Occupation" value={p.occupation} onChange={(v) => set({ occupation: v })} options={OCCUPATIONS} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Work starts" htmlFor="ws">
                <Input id="ws" type="time" value={p.workStart ?? ""} onChange={(e) => set({ workStart: e.target.value })} />
              </Field>
              <Field label="Work ends" htmlFor="we">
                <Input id="we" type="time" value={p.workEnd ?? ""} onChange={(e) => set({ workEnd: e.target.value })} />
              </Field>
            </div>
          </StepIntro>
        )}

        {id === "activity" && (
          <StepIntro title="Daily activity" text="Think about a typical day, including work.">
            <div role="radiogroup" className="space-y-2">
              {ACTIVITY.map((a) => {
                const look = ACTIVITY_LOOK[a.value]
                return <ChoiceCard key={a.value} className={cn(DENSE, TONE[look.tone])} selected={p.activity === a.value} onSelect={() => set({ activity: a.value })} icon={look.icon} title={a.label} description={a.description} />
              })}
            </div>
          </StepIntro>
        )}

        {id === "diet" && (
          <StepIntro title="How do you like to eat?" text="Preferences shape your plan. Allergies come later and are treated as safety rules.">
            <ChipGroup label="Dietary preferences" value={p.diet ?? []} onChange={(v) => set({ diet: v })} options={DIETS} />
            <InfoNote className={NOTE}>Preferences are flexible. If you can&apos;t eat something for a medical reason, record it as an allergy or condition.</InfoNote>
          </StepIntro>
        )}

        {id === "health_consent" && (
          <StepIntro title="Health information" text="Only what's needed to keep your plan safe.">
            <ConsentCard
              icon={<HeartPulse className="size-5" />}
              tone="terracotta"
              title="Allow NutriPlan to use health information"
              text="We use allergies and conditions only to filter unsafe foods and decide when a professional should review your plan. Stored separately from your general profile. You can withdraw this any time in Privacy."
              checked={consents.health_data}
              onChange={(v) => toggleConsent("health_data", v)}
            />
            {consents.health_data ? (
              <WhyWeAsk>Health details let the nutrition engine exclude unsafe foods and route complex needs to professionals. We never diagnose a condition from your answers.</WhyWeAsk>
            ) : (
              <div className="text-callout flex items-start gap-3 rounded-2xl bg-muted p-3.5 text-muted-foreground">
                <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
                Turn this on to record allergies and conditions. Without it we can&apos;t check meals against your allergies, so a plan can&apos;t be created.
              </div>
            )}
          </StepIntro>
        )}

        {id === "allergies" && (
          <StepIntro title="Food allergies" text="Allergies are hard safety rules across meals, snacks, swaps and shopping lists.">
            <ChipGroup<Allergen> label="Food allergies" value={p.allergies ?? []} onChange={(v) => set({ allergies: v })} options={ALLERGENS} />
            {(p.allergies?.length ?? 0) === 0 && <p className="text-caption text-muted-foreground">No allergies? Just continue.</p>}
          </StepIntro>
        )}

        {id === "conditions" && (
          <StepIntro title="Health conditions" text="Diagnosed conditions only. Skip if none apply.">
            <ChipGroup label="Conditions" value={(p.conditions ?? []).filter((c) => !CIRCUMSTANCE_IDS.includes(c))} onChange={(v) => set({ conditions: [...v, ...(p.conditions ?? []).filter((c) => CIRCUMSTANCE_IDS.includes(c))] })} options={CONDITION_OPTS} />
            {reviewNeeded.some((c) => !CIRCUMSTANCE_IDS.includes(c)) && <ReviewNote />}
            {p.goal === "condition" && <p className="text-caption text-muted-foreground">Specialized condition plans open only for conditions that have passed clinical review.</p>}
          </StepIntro>
        )}

        {id === "circumstances" && (
          <StepIntro title="Life stage and eating" text="Any of these change what's safe to plan. Skip if none apply.">
            <ChipGroup label="Circumstances" value={(p.conditions ?? []).filter((c) => CIRCUMSTANCE_IDS.includes(c))} onChange={(v) => set({ conditions: [...(p.conditions ?? []).filter((c) => !CIRCUMSTANCE_IDS.includes(c)), ...v] })} options={CIRCUMSTANCE_OPTS} />
            {reviewNeeded.some((c) => CIRCUMSTANCE_IDS.includes(c)) && <ReviewNote />}
          </StepIntro>
        )}

        {id === "health_flags" && (
          <StepIntro title="Anything else we should know?" text="These help us decide when to keep your plan general.">
            <ToggleList>
              <Toggle label="I take medication that affects food or fluids" checked={flags.medications} onChange={(v) => setFlags((f) => ({ ...f, medications: v }))} />
              <Toggle label="A clinician advised me to follow a specific diet" checked={flags.clinicianDiet} onChange={(v) => setFlags((f) => ({ ...f, clinicianDiet: v }))} />
              <Toggle label="I've had recent unexplained weight change" checked={flags.weightChange} onChange={(v) => setFlags((f) => ({ ...f, weightChange: v }))} />
            </ToggleList>
            {flags.medications && <InfoNote className={NOTE}>We never change medication or doses. Keep following your clinician&apos;s advice.</InfoNote>}
            {flags.weightChange && <CautionNote className={NOTE} title="Worth checking with a doctor">We won&apos;t suggest calorie restriction.</CautionNote>}
          </StepIntro>
        )}

        {id === "urgent" && (
          <StepIntro title="How are you feeling right now?" text="One safety check before we plan anything.">
            <ToggleList>
              <Toggle label="I have chest pain, severe breathlessness, fainting or a severe allergic reaction right now" checked={emergency} onChange={setEmergency} />
            </ToggleList>
            {emergency && (
              <SafetyAlert title="Please get urgent help now" emergency>
                These symptoms need immediate medical attention. In Bangladesh call 999. A meal plan can wait.
              </SafetyAlert>
            )}
          </StepIntro>
        )}

        {id === "budget" && (
          <StepIntro title="Food budget" text="We prioritize affordable local foods. Prices are estimates.">
            <div role="radiogroup" className="grid grid-cols-2 gap-2">
              {BUDGETS.map((b) => (
                <ChoiceCard key={b.value} className="min-h-0 px-3 py-3" selected={p.budgetPerWeekBdt === b.value} onSelect={() => set({ budgetPerWeekBdt: b.value })} title={<span className="text-callout font-semibold">{b.label}</span>} description={b.description} />
              ))}
            </div>
            <Field label="Or enter a weekly amount (৳)" htmlFor="budget">
              <Input id="budget" type="number" inputMode="numeric" min={300} step={100} value={p.budgetPerWeekBdt ?? ""} onChange={(e) => set({ budgetPerWeekBdt: Number(e.target.value) || undefined })} />
            </Field>
            <InfoNote className={NOTE}>A low budget never makes a plan nutritionally inadequate. If a plan can&apos;t meet minimums within budget, we&apos;ll tell you.</InfoNote>
          </StepIntro>
        )}

        {id === "cooking" && (
          <StepIntro title="Cooking and meals" text="So recipes fit your time.">
            <Field label="Time per meal">
              <PillGroup label="Time per meal" value={String(p.maxPrepMinutes)} onChange={(v) => set({ maxPrepMinutes: Number(v) })} options={PREP.map((x) => ({ value: String(x.value), label: x.label }))} />
            </Field>
            <Field label="Meals per day">
              <PillGroup label="Meals per day" value={String(p.mealsPerDay)} onChange={(v) => set({ mealsPerDay: Number(v) })} options={["3", "4", "5"].map((v) => ({ value: v, label: `${v} meals` }))} />
            </Field>
            <ToggleList>
              <Toggle label="Include snacks" checked={!!p.includeSnacks} onChange={(v) => set({ includeSnacks: v })} />
            </ToggleList>
          </StepIntro>
        )}

        {id === "kitchen" && (
          <StepIntro title="Your kitchen" text="Select everything that applies.">
            <ChipGroup label="Equipment" value={equipment} onChange={setEquipment} options={EQUIPMENT} />
            {!equipment.includes("fridge") && <InfoNote className={NOTE}>No fridge: we&apos;ll avoid recipes that need cooked food stored for later.</InfoNote>}
          </StepIntro>
        )}

        {id === "child_consent" && (
          <StepIntro title={`About ${who === "baby" ? "your baby" : "your child"}`} text="You'll manage this profile as their parent or caregiver.">
            <ConsentCard
              icon={<Baby className="size-5" />}
              tone="sky"
              title="Allow NutriPlan to store your child's information"
              text="Age, feeding, growth records and food reactions are used only for age-appropriate, safe suggestions. Other household members can't see this without your permission. You can delete it at any time."
              checked={consents.child_data}
              onChange={(v) => toggleConsent("child_data", v)}
            />
            <ConsentCard
              icon={<HeartPulse className="size-5" />}
              tone="terracotta"
              title="Allow health information (allergies, conditions)"
              text="Used to exclude unsafe foods. Optional, but recommended."
              checked={consents.health_data}
              onChange={(v) => toggleConsent("health_data", v)}
            />
          </StepIntro>
        )}

        {id === "child_basics" && (
          <StepIntro title={who === "baby" ? "Your baby" : "Your child"} text="Age matters most. We use age-appropriate references, never adult equations.">
            <Field label="Name or nickname" htmlFor="cname">
              <Input id="cname" value={child.name ?? ""} onChange={(e) => setC({ name: e.target.value })} />
            </Field>
            <Field label="Date of birth" htmlFor="cdob">
              <Input id="cdob" type="date" value={child.dateOfBirth ?? ""} max={todayISO()} onChange={(e) => setC({ dateOfBirth: e.target.value })} />
            </Field>
            {who === "baby" && childMonths < 6 && (
              <InfoNote className={NOTE} title="Under 6 months">
                Breast milk or infant formula provides what your baby needs until about 6 months. Food suggestions start then — talk to your health worker about readiness signs.
              </InfoNote>
            )}
            {childMonths >= 12 && who === "baby" && <InfoNote className={NOTE}>Your child is over 12 months — we&apos;ll use toddler guidance.</InfoNote>}
          </StepIntro>
        )}

        {id === "child_details" && (
          <StepIntro title={`More about ${child.name?.trim() || (who === "baby" ? "your baby" : "your child")}`} text="Weight and length are optional and help with growth tracking.">
            <Field label="Sex">
              <PillGroup label="Sex" value={child.sex} onChange={(v) => setC({ sex: v })} options={[{ value: "female", label: "Girl" }, { value: "male", label: "Boy" }]} />
            </Field>
            {who === "baby" && (
              <Field label="Milk feeding">
                <PillGroup label="Milk feeding" value={child.feeding} onChange={(v) => setC({ feeding: v })} options={[{ value: "breastfeeding", label: "Breast milk" }, { value: "formula", label: "Formula" }, { value: "both", label: "Both" }]} />
              </Field>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Weight (kg)" htmlFor="cw" hint="Optional">
                <Input id="cw" type="number" inputMode="decimal" step="0.1" value={child.weightKg ?? ""} onChange={(e) => setC({ weightKg: Number(e.target.value) || undefined })} />
              </Field>
              <Field label="Length/height (cm)" htmlFor="ch" hint="Optional">
                <Input id="ch" type="number" inputMode="decimal" value={child.heightCm ?? ""} onChange={(e) => setC({ heightCm: Number(e.target.value) || undefined })} />
              </Field>
            </div>
          </StepIntro>
        )}

        {id === "child_health" && (
          <StepIntro title="Known food allergies" text="We'll exclude these everywhere, including swaps and shopping lists.">
            {consents.health_data ? (
              <ChipGroup<Allergen> label="Known food allergies" value={child.allergies ?? []} onChange={(v) => setC({ allergies: v })} options={ALLERGENS} />
            ) : (
              <InfoNote className={NOTE}>You skipped health permission, so we can&apos;t record allergies. You can turn it on later in Privacy.</InfoNote>
            )}
          </StepIntro>
        )}

        {id === "child_reactions" && (
          <StepIntro title="Food reactions" text="Helps us keep new foods safe.">
            {consents.health_data && (
              <>
                <ToggleList>
                  <Toggle label="Has had a reaction to a food (rash, vomiting, swelling)" checked={childReactions} onChange={setChildReactions} />
                </ToggleList>
                {childReactions && (
                  <CautionNote className={NOTE} title="Talk to a health professional first">
                    Ask your doctor before introducing common allergens. We&apos;ll keep allergen introductions out of suggestions until then.
                  </CautionNote>
                )}
              </>
            )}
            <SafetyAlert className={NOTE} title="Always on for babies">Honey before 12 months, whole nuts, and hard round foods are never suggested. Textures follow your baby&apos;s age and readiness.</SafetyAlert>
          </StepIntro>
        )}

        {id === "review" && (
          <StepIntro title="Your nutrition profile" text={who === "self" ? "Here's where your plan starts. These are ranges, not exact numbers." : "Here's how we'll support you."}>
            {who === "self" ? (
              <>
                <TargetsCard profile={{ ...(p as Profile), id: "draft", name: user.name, avatarColor: "forest", diet: p.diet ?? [], allergies: p.allergies ?? [], conditions: p.conditions ?? [], goal: restrictionUnsafe && p.goal === "lose_weight" ? "improve_nutrition" : p.goal }} />
              </>
            ) : (
              <Surface tone="lime" padding="lg" className="relative space-y-3 overflow-hidden">
                <span className="absolute -top-8 -right-8 size-32 rounded-full bg-white/25" aria-hidden />
                <div className="relative flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- static prototype asset */}
                  <img src={who === "baby" ? RECIPE_PHOTO.r_inf_banana : RECIPE_PHOTO.r_khichuri} alt="" className="size-16 shrink-0 rounded-full object-cover ring-4 ring-white/70" />
                  <div className="min-w-0">
                    <p className="text-title truncate">{child.name || "Your child"}</p>
                    <p className="text-caption text-charcoal/75">{childMonths < 24 ? `${childMonths} months old` : `${Math.floor(childMonths / 12)} years old`}</p>
                  </div>
                </div>
                <ul className="text-callout relative space-y-2.5">
                  <li className="flex gap-2"><Clock className="mt-0.5 size-4 shrink-0" />Textures, new foods and milestones — not calories</li>
                  <li className="flex gap-2"><Smile className="mt-0.5 size-4 shrink-0" />Responsive feeding: follow your child&apos;s hunger and fullness cues</li>
                  <li className="flex gap-2"><Baby className="mt-0.5 size-4 shrink-0" />Baby food suggestions are clinically gated and use reviewed recipes only</li>
                </ul>
              </Surface>
            )}
          </StepIntro>
        )}

        {id === "safeguards" && (
          <StepIntro title="How we'll keep it safe" text="These rules apply to every plan, swap and shopping list.">
            <ul className="space-y-2">
              {(p.allergies?.length ?? 0) > 0 ? (
                <RuleRow tone="safety" icon={<ShieldAlert />} title="Allergy protection on">
                  Excluding {p.allergies!.map((a) => ALLERGENS.find((x) => x.value === a)?.label).join(", ")} from every meal, snack, swap and shopping list.
                </RuleRow>
              ) : (
                <RuleRow tone="info" icon={<ShieldAlert />} title="No allergies recorded">
                  Add them any time in your profile.
                </RuleRow>
              )}
              {restrictionUnsafe && p.goal === "lose_weight" && (
                <RuleRow tone="caution" icon={<HeartPulse />} title="No calorie deficit for now">
                  Because of what you told us, your plan focuses on balanced, regular meals, not weight loss.
                </RuleRow>
              )}
              {reviewNeeded.length > 0 && (
                <RuleRow tone="caution" icon={<Stethoscope />} title="Professional review needed">
                  General healthy-eating guidance only. A specialized plan needs a qualified professional.
                </RuleRow>
              )}
              <RuleRow tone="info" icon={<ShieldCheck />} title="Reviewed recipes only">
                Every meal is checked against food-safety rules.
              </RuleRow>
            </ul>
          </StepIntro>
        )}

        {id === "permissions" && (
          <StepIntro title="Optional permissions" text="Change these any time in Privacy.">
            <div className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-card shadow-card">
              <ConsentCard compact title="Food photos" text="Store meal photos privately to log what you eat. No public links. Delete any time." checked={consents.food_photos} onChange={(v) => toggleConsent("food_photos", v)} />
              <ConsentCard compact title="AI processing" text="Send de-identified meal descriptions and photos to our AI provider to suggest foods. Manual logging always works without it." checked={consents.ai_processing} onChange={(v) => toggleConsent("ai_processing", v)} />
              <ConsentCard compact title="Product analytics" text="Anonymous usage data to improve NutriPlan." checked={consents.analytics} onChange={(v) => toggleConsent("analytics", v)} />
            </div>
          </StepIntro>
        )}
      </div>

      <StickyFooter>
        <Button size="lg" className="w-full" disabled={!canNext} onClick={next}>
          {id === "permissions" ? (who === "self" ? "Create my first plan" : "Start") : "Continue"}
        </Button>
        {id === "permissions" && <p className="text-caption text-center text-muted-foreground">Estimates support healthy eating and don&apos;t replace medical advice.</p>}
      </StickyFooter>
    </main>
  )
}

/** Denser choice cards and notes so every step fits one screen. */
const DENSE = "min-h-14 py-3"
const NOTE = "p-3.5"

/** Colorful round icon tiles on choice cards (refs: colorful category icons). Use only on cards with an icon. */
const TONE = {
  lime: "[&>span:first-child]:rounded-full [&>span:first-child]:bg-lime [&>span:first-child]:text-charcoal",
  sky: "[&>span:first-child]:rounded-full [&>span:first-child]:bg-sky-tint [&>span:first-child]:text-sky-text",
  amber: "[&>span:first-child]:rounded-full [&>span:first-child]:bg-amber-tint [&>span:first-child]:text-amber-text",
  coral: "[&>span:first-child]:rounded-full [&>span:first-child]:bg-coral-tint [&>span:first-child]:text-terracotta-text",
  forest: "[&>span:first-child]:rounded-full [&>span:first-child]:bg-forest [&>span:first-child]:text-white",
} as const

const ACTIVITY_LOOK: Record<string, { icon: React.ReactNode; tone: keyof typeof TONE }> = {
  sedentary: { icon: <Armchair />, tone: "sky" },
  light: { icon: <Footprints />, tone: "lime" },
  moderate: { icon: <Bike />, tone: "amber" },
  very: { icon: <HardHat />, tone: "coral" },
  extreme: { icon: <Dumbbell />, tone: "forest" },
}

/** One safety rule on the safeguards step: safety alerts keep a distinct alert state (§44.12). */
function RuleRow({ tone, icon, title, children }: { tone: "safety" | "caution" | "info"; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  const look = {
    safety: { box: "bg-safety-surface ring-1 ring-safety/25", tile: "safety" as IconTone, title: "text-safety" },
    caution: { box: "bg-caution-surface", tile: "caution" as IconTone, title: "text-caution" },
    info: { box: "bg-card shadow-card", tile: "sage" as IconTone, title: "text-charcoal" },
  }[tone]
  return (
    <li className={cn("flex gap-3 rounded-2xl p-3.5", look.box)} role={tone === "safety" ? "alert" : undefined}>
      <IconTile tone={look.tile} size="sm">
        {icon}
      </IconTile>
      <div className="min-w-0">
        <p className={cn("text-callout font-semibold", look.title)}>{title}</p>
        <p className="text-caption mt-0.5 text-charcoal/80">{children}</p>
      </div>
    </li>
  )
}

function ReviewNote() {
  return (
    <CautionNote className={NOTE} title="Professional review needed">
      We&apos;ll give general healthy-eating guidance only. A specialized plan needs a qualified professional, and we won&apos;t calculate restrictive targets.
    </CautionNote>
  )
}

function StepIntro({ title, text, children }: { title: string; text?: string; children: React.ReactNode }) {
  return (
    <>
      <div>
        <h1 className="text-[26px] leading-8 font-bold tracking-tight">{title}</h1>
        {text && <p className="text-callout mt-1 text-muted-foreground">{text}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </>
  )
}

/** Grouped list of switch rows (UI-SPEC §5.4). */
function ToggleList({ children }: { children: React.ReactNode }) {
  return <div className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-card shadow-card">{children}</div>
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="text-callout flex min-h-13 cursor-pointer items-center justify-between gap-4 px-4 py-3">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  )
}

/** Consent with an explanation. `compact` renders as a row inside a grouped list. */
function ConsentCard({ icon, tone = "lime", title, text, checked, onChange, compact }: { icon?: React.ReactNode; tone?: IconTone; title: string; text: string; checked: boolean; onChange: (v: boolean) => void; compact?: boolean }) {
  return (
    <label className={cn("flex cursor-pointer gap-3", compact ? "px-4 py-3" : "rounded-2xl bg-card p-4 shadow-card transition-colors", !compact && checked && "bg-sage ring-2 ring-lime")}>
      {icon && <IconTile tone={tone}>{icon}</IconTile>}
      <span className="min-w-0 flex-1">
        <span className="text-body block font-medium">{title}</span>
        <span className="text-caption mt-0.5 block text-muted-foreground">{text}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} className="mt-0.5" />
    </label>
  )
}
