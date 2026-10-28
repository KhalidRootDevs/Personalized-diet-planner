"use client"

// 9-step progressive onboarding (§5.1–§5.9) with consent before health, photo and child data (§5.10, §21.4).
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Baby, ChevronLeft, Clock, HeartPulse, Lock, Smile, User, Users } from "lucide-react"
import { useApp } from "@/lib/store"
import { ageInMonths, ageInYears } from "@/lib/nutrition"
import { addDays, todayISO } from "@/lib/date"
import type { Allergen, ConsentRecord, Profile } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { PhaseBadge } from "@/components/app/badges"
import { CautionNote, InfoNote, SafetyAlert } from "@/components/app/alerts"
import { Splash } from "@/components/app/shell"
import { ChipGroup, ChoiceCard, Field, PillGroup, WhyWeAsk } from "@/components/profile/form-bits"
import { TargetsCard } from "@/components/profile/targets-card"
import { ACTIVITY, ALLERGENS, CONDITIONS, DIETS, GOALS, OCCUPATIONS, REVIEW_CONDITIONS } from "@/components/profile/options"

type Who = "self" | "baby" | "child"

type StepId = "who" | "basics" | "goal" | "lifestyle" | "diet" | "health" | "budget" | "cooking" | "review" | "child_consent" | "child_basics" | "child_health"

const ADULT_STEPS: StepId[] = ["who", "basics", "goal", "lifestyle", "diet", "health", "budget", "cooking", "review"]
const CHILD_STEPS: StepId[] = ["who", "child_consent", "child_basics", "child_health", "review"]

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
  const pct = Math.round(((step + 1) / steps.length) * 100)

  const adultAge = p.dateOfBirth ? ageInYears(p.dateOfBirth) : 0
  const childMonths = child.dateOfBirth ? ageInMonths(child.dateOfBirth) : 0
  const reviewNeeded = (p.conditions ?? []).filter((c) => REVIEW_CONDITIONS.includes(c))
  const restrictionUnsafe = (p.conditions ?? []).some((c) => ["eating_disorder", "pregnancy", "breastfeeding"].includes(c)) || flags.weightChange

  const canNext = useMemo(() => {
    switch (id) {
      case "basics":
        return !!p.dateOfBirth && adultAge >= 18 && !!p.sex && !!p.heightCm && !!p.weightKg
      case "health":
        return consents.health_data
      case "child_consent":
        return consents.child_data
      case "child_basics":
        return !!child.name?.trim() && !!child.dateOfBirth && childMonths >= 0
      default:
        return true
    }
  }, [id, p, adultAge, consents, child, childMonths])

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
    <main className="flex flex-1 flex-col pt-safe">
      <header className="sticky top-0 z-20 bg-background/95 px-4 backdrop-blur-sm">
        <div className="flex h-14 items-center gap-2">
          <button onClick={back} className="-ml-2 grid size-10 place-items-center rounded-full hover:bg-muted" aria-label="Back">
            <ChevronLeft className="size-5" />
          </button>
          <div className="flex-1">
            <Progress value={pct} aria-label={`Step ${step + 1} of ${steps.length}`} className="h-1.5" />
          </div>
          <span className="tabular w-12 text-right text-xs text-muted-foreground">
            {step + 1} / {steps.length}
          </span>
        </div>
      </header>

      <div className="flex-1 space-y-6 px-5 pt-4 pb-6">
        {id === "who" && (
          <StepIntro title="Who is this plan for?" text="We tailor every question to the person the plan is for. Babies and children never get an adult questionnaire.">
            <div role="radiogroup" className="space-y-3">
              <ChoiceCard selected={who === "self"} onSelect={() => setWho("self")} icon={<User className="size-5" />} title="Myself" description="Plans for your body, work and goals" />
              <ChoiceCard selected={who === "baby"} onSelect={() => { setWho("baby"); setC({ dateOfBirth: addDays(todayISO(), -213) }) }} icon={<Baby className="size-5" />} title="My baby" description="First foods from about 6 months, with a caregiver view" />
              <ChoiceCard selected={who === "child"} onSelect={() => { setWho("child"); setC({ dateOfBirth: addDays(todayISO(), -365 * 4) }) }} icon={<Smile className="size-5" />} title="My child" description="Child-appropriate guidance, no calorie counting" />
              <ChoiceCard selected={false} disabled onSelect={() => {}} icon={<Users className="size-5" />} title="Partner or family member" description="Needs household permissions — part of Family Nutrition" badge={<PhaseBadge phase={2} />} />
            </div>
            {who !== "self" && <InfoNote>Your own account is the primary profile. You manage {who === "baby" ? "your baby's" : "your child's"} profile as their caregiver and can complete your own profile later.</InfoNote>}
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
            <div className="grid grid-cols-2 gap-3">
              <Field label="Height (cm)" htmlFor="height">
                <Input id="height" type="number" inputMode="decimal" min={100} max={230} value={p.heightCm ?? ""} onChange={(e) => set({ heightCm: Number(e.target.value) || undefined })} />
              </Field>
              <Field label="Weight (kg)" htmlFor="weight">
                <Input id="weight" type="number" inputMode="decimal" min={30} max={250} value={p.weightKg ?? ""} onChange={(e) => set({ weightKg: Number(e.target.value) || undefined })} />
              </Field>
            </div>
            <p className="text-xs text-muted-foreground">Self-reported values. We keep them separate from clinically measured ones.</p>
            <Field label="Language">
              <PillGroup label="Language" value={language} onChange={(v) => updateSettings({ language: v })} options={[{ value: "en", label: "English" }, { value: "bn", label: "বাংলা" }]} />
            </Field>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border bg-card p-3">
                <p className="text-muted-foreground">Country</p>
                <p className="font-medium">Bangladesh</p>
              </div>
              <div className="rounded-xl border bg-card p-3">
                <p className="text-muted-foreground">Time zone · currency</p>
                <p className="font-medium">Asia/Dhaka · BDT</p>
              </div>
            </div>
          </StepIntro>
        )}

        {id === "goal" && (
          <StepIntro title="What's your main goal?" text="Pick the one that matters most right now.">
            <div role="radiogroup" className="space-y-2">
              {GOALS.map((g) => (
                <ChoiceCard key={g.value} selected={p.goal === g.value} onSelect={() => set({ goal: g.value })} title={g.label} />
              ))}
            </div>
            {p.goal === "condition" && <InfoNote>We&apos;ll ask about your health next. Specialized condition plans open only for conditions that have passed clinical review.</InfoNote>}
          </StepIntro>
        )}

        {id === "lifestyle" && (
          <StepIntro title="Your day" text="Work and activity change how much energy you need and when you eat.">
            <Field label="Occupation">
              <PillGroup label="Occupation" value={p.occupation} onChange={(v) => set({ occupation: v })} options={OCCUPATIONS} />
            </Field>
            <Field label="Daily activity">
              <div role="radiogroup" className="space-y-2">
                {ACTIVITY.map((a) => (
                  <ChoiceCard key={a.value} selected={p.activity === a.value} onSelect={() => set({ activity: a.value })} title={a.label} description={a.description} />
                ))}
              </div>
            </Field>
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

        {id === "diet" && (
          <StepIntro title="How do you like to eat?" text="Preferences shape your plan. Allergies come next and are treated as safety rules.">
            <Field label="Dietary preferences">
              <ChipGroup label="Dietary preferences" value={p.diet ?? []} onChange={(v) => set({ diet: v })} options={DIETS} />
            </Field>
            <InfoNote>Preferences are flexible. If you can&apos;t eat something for a medical reason, record it as an allergy or condition in the next step.</InfoNote>
          </StepIntro>
        )}

        {id === "health" && (
          <StepIntro title="Health information" text="Only what's needed to keep your plan safe.">
            <ConsentCard
              icon={<HeartPulse className="size-5" />}
              title="Allow NutriPlan to use health information"
              text="We use allergies and conditions only to filter unsafe foods and decide when a professional should review your plan. Stored separately from your general profile. You can withdraw this any time in Privacy."
              checked={consents.health_data}
              onChange={(v) => toggleConsent("health_data", v)}
            />
            {consents.health_data ? (
              <>
                <Field label="Food allergies" hint="Allergies are hard safety rules across meals, snacks, swaps and shopping lists.">
                  <ChipGroup<Allergen> label="Food allergies" value={p.allergies ?? []} onChange={(v) => set({ allergies: v })} options={ALLERGENS} />
                </Field>
                <Field label="Diagnosed conditions or circumstances">
                  <ChipGroup label="Conditions" value={p.conditions ?? []} onChange={(v) => set({ conditions: v })} options={CONDITIONS} />
                </Field>
                <div className="space-y-2">
                  <Toggle label="I take medication that affects food or fluids" checked={flags.medications} onChange={(v) => setFlags((f) => ({ ...f, medications: v }))} />
                  <Toggle label="A clinician advised me to follow a specific diet" checked={flags.clinicianDiet} onChange={(v) => setFlags((f) => ({ ...f, clinicianDiet: v }))} />
                  <Toggle label="I've had recent unexplained weight change" checked={flags.weightChange} onChange={(v) => setFlags((f) => ({ ...f, weightChange: v }))} />
                  <Toggle label="I have chest pain, severe breathlessness, fainting or a severe allergic reaction right now" checked={emergency} onChange={setEmergency} />
                </div>
                {emergency && (
                  <SafetyAlert title="Please get urgent help now" emergency>
                    These symptoms need immediate medical attention. In Bangladesh call 999. A meal plan can wait.
                  </SafetyAlert>
                )}
                {reviewNeeded.length > 0 && (
                  <CautionNote title="Professional review needed">
                    We&apos;ll give general healthy-eating guidance only. A specialized plan for this needs a qualified professional, and we won&apos;t calculate restrictive targets.
                  </CautionNote>
                )}
                {flags.medications && <InfoNote>We never change medication or doses. Please keep following your clinician&apos;s advice; your plan stays within general guidance.</InfoNote>}
                {flags.weightChange && <CautionNote title="Worth checking with a doctor">Unexplained weight change can have many causes. We won&apos;t suggest calorie restriction, and we recommend speaking with a health professional.</CautionNote>}
                <WhyWeAsk>Health details let the nutrition engine exclude unsafe foods and route complex needs to professionals. We never diagnose a condition from your answers.</WhyWeAsk>
              </>
            ) : (
              <div className="flex items-start gap-3 rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
                <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
                Turn on the permission above to record allergies and conditions. Without it we can&apos;t check meals against your allergies, so a plan can&apos;t be created.
              </div>
            )}
          </StepIntro>
        )}

        {id === "budget" && (
          <StepIntro title="Food budget" text="We prioritize affordable local foods. Prices are estimates.">
            <div role="radiogroup" className="space-y-2">
              {BUDGETS.map((b) => (
                <ChoiceCard key={b.value} selected={p.budgetPerWeekBdt === b.value} onSelect={() => set({ budgetPerWeekBdt: b.value })} title={b.label} description={b.description} />
              ))}
            </div>
            <Field label="Or enter a weekly amount (৳)" htmlFor="budget">
              <Input id="budget" type="number" inputMode="numeric" min={300} step={100} value={p.budgetPerWeekBdt ?? ""} onChange={(e) => set({ budgetPerWeekBdt: Number(e.target.value) || undefined })} />
            </Field>
            <InfoNote>A low budget never makes a plan nutritionally inadequate. If a plan can&apos;t meet minimums within budget, we&apos;ll tell you.</InfoNote>
          </StepIntro>
        )}

        {id === "cooking" && (
          <StepIntro title="Cooking and meals" text="So recipes fit your kitchen and your time.">
            <Field label="Time per meal">
              <PillGroup label="Time per meal" value={String(p.maxPrepMinutes)} onChange={(v) => set({ maxPrepMinutes: Number(v) })} options={PREP.map((x) => ({ value: String(x.value), label: x.label }))} />
            </Field>
            <Field label="Meals per day">
              <PillGroup label="Meals per day" value={String(p.mealsPerDay)} onChange={(v) => set({ mealsPerDay: Number(v) })} options={["3", "4", "5"].map((v) => ({ value: v, label: `${v} meals` }))} />
            </Field>
            <Toggle label="Include snacks" checked={!!p.includeSnacks} onChange={(v) => set({ includeSnacks: v })} />
            <Field label="What do you have?">
              <ChipGroup label="Equipment" value={equipment} onChange={setEquipment} options={EQUIPMENT} />
            </Field>
            {!equipment.includes("fridge") && <InfoNote>No fridge: we&apos;ll avoid recipes that need cooked food stored for later.</InfoNote>}
          </StepIntro>
        )}

        {id === "child_consent" && (
          <StepIntro title={`About ${who === "baby" ? "your baby" : "your child"}`} text="You'll manage this profile as their parent or caregiver.">
            <ConsentCard
              icon={<Baby className="size-5" />}
              title="Allow NutriPlan to store your child's information"
              text="Age, feeding, growth records and food reactions are used only for age-appropriate, safe suggestions. Other household members can't see this without your permission. You can delete it at any time."
              checked={consents.child_data}
              onChange={(v) => toggleConsent("child_data", v)}
            />
            <ConsentCard
              icon={<HeartPulse className="size-5" />}
              title="Allow health information (allergies, conditions)"
              text="Used to exclude unsafe foods. Optional, but recommended."
              checked={consents.health_data}
              onChange={(v) => toggleConsent("health_data", v)}
            />
          </StepIntro>
        )}

        {id === "child_basics" && (
          <StepIntro title={who === "baby" ? "Your baby" : "Your child"} text="Age matters most. We use age-appropriate references — never adult equations.">
            <Field label="Name or nickname" htmlFor="cname">
              <Input id="cname" value={child.name ?? ""} onChange={(e) => setC({ name: e.target.value })} />
            </Field>
            <Field label="Date of birth" htmlFor="cdob">
              <Input id="cdob" type="date" value={child.dateOfBirth ?? ""} max={todayISO()} onChange={(e) => setC({ dateOfBirth: e.target.value })} />
            </Field>
            {who === "baby" && childMonths < 6 && (
              <InfoNote title="Under 6 months">
                Breast milk or infant formula provides what your baby needs until about 6 months. Food suggestions start then — talk to your health worker about readiness signs.
              </InfoNote>
            )}
            {childMonths >= 12 && who === "baby" && <InfoNote>Your child is over 12 months — we&apos;ll use toddler guidance.</InfoNote>}
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
          <StepIntro title="Allergies and reactions" text="We'll exclude these everywhere, including swaps and shopping lists.">
            {consents.health_data ? (
              <>
                <Field label="Known food allergies">
                  <ChipGroup<Allergen> label="Known food allergies" value={child.allergies ?? []} onChange={(v) => setC({ allergies: v })} options={ALLERGENS} />
                </Field>
                <Toggle label="Has had a reaction to a food (rash, vomiting, swelling)" checked={childReactions} onChange={setChildReactions} />
                {childReactions && (
                  <CautionNote title="Talk to a health professional first">
                    Before introducing common allergens, ask your doctor. We&apos;ll keep allergen introductions out of suggestions until a professional has advised you.
                  </CautionNote>
                )}
              </>
            ) : (
              <InfoNote>You skipped health permission, so we can&apos;t record allergies. You can turn it on later in Privacy.</InfoNote>
            )}
            <SafetyAlert title="Always on for babies">Honey before 12 months, whole nuts, and hard round foods are never suggested. Textures follow your baby&apos;s age and readiness.</SafetyAlert>
          </StepIntro>
        )}

        {id === "review" && (
          <StepIntro title="Your nutrition profile" text={who === "self" ? "Here's where your plan starts. These are ranges, not exact numbers." : "Here's how we'll support you."}>
            {who === "self" ? (
              <>
                <TargetsCard profile={{ ...(p as Profile), id: "draft", name: user.name, avatarColor: "forest", diet: p.diet ?? [], allergies: p.allergies ?? [], conditions: p.conditions ?? [], goal: restrictionUnsafe && p.goal === "lose_weight" ? "improve_nutrition" : p.goal }} />
                {restrictionUnsafe && p.goal === "lose_weight" && (
                  <CautionNote title="No calorie deficit for now">Because of what you told us, we won&apos;t plan for weight loss. Your plan focuses on balanced, regular meals — a professional can advise on anything more.</CautionNote>
                )}
                {(p.allergies?.length ?? 0) > 0 && <SafetyAlert title="Allergy protection on">Excluding {p.allergies!.map((a) => ALLERGENS.find((x) => x.value === a)?.label).join(", ")} from every meal, snack, swap and shopping list.</SafetyAlert>}
              </>
            ) : (
              <div className="space-y-3 rounded-2xl border bg-sage/40 p-4">
                <p className="font-serif text-xl">{child.name || "Your child"}</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2"><Clock className="mt-0.5 size-4 shrink-0 text-forest" />{childMonths < 24 ? `${childMonths} months old` : `${Math.floor(childMonths / 12)} years old`}</li>
                  <li className="flex gap-2"><Smile className="mt-0.5 size-4 shrink-0 text-forest" />Textures, new foods and milestones — not calories</li>
                  <li className="flex gap-2"><Baby className="mt-0.5 size-4 shrink-0 text-forest" />Responsive feeding: follow your child&apos;s hunger and fullness cues</li>
                </ul>
                <p className="text-xs text-muted-foreground">Baby food suggestions are clinically gated and use reviewed recipes only.</p>
              </div>
            )}
            <div className="space-y-3">
              <p className="text-sm font-medium">Optional permissions</p>
              <ConsentCard compact title="Food photos" text="Store meal photos privately to log what you eat. No public links. Delete any time." checked={consents.food_photos} onChange={(v) => toggleConsent("food_photos", v)} />
              <ConsentCard compact title="AI processing" text="Send de-identified meal descriptions and photos to our AI provider to suggest foods. Manual logging always works without it." checked={consents.ai_processing} onChange={(v) => toggleConsent("ai_processing", v)} />
              <ConsentCard compact title="Product analytics" text="Anonymous usage data to improve NutriPlan." checked={consents.analytics} onChange={(v) => toggleConsent("analytics", v)} />
            </div>
          </StepIntro>
        )}
      </div>

      <div className="sticky bottom-0 border-t bg-background/95 px-5 pt-3 pb-safe backdrop-blur-sm">
        <div className="pb-4">
          <Button size="lg" className="w-full" disabled={!canNext || (id === "health" && emergency)} onClick={next}>
            {id === "review" ? (who === "self" ? "Create my first plan" : "Start") : "Continue"}
          </Button>
          {id === "review" && <p className="mt-2 text-center text-xs text-muted-foreground">Estimates support healthy eating and don&apos;t replace medical advice.</p>}
        </div>
      </div>
    </main>
  )
}

function StepIntro({ title, text, children }: { title: string; text?: string; children: React.ReactNode }) {
  return (
    <>
      <div>
        <h1 className="font-serif text-[28px] leading-tight">{title}</h1>
        {text && <p className="mt-2 text-muted-foreground">{text}</p>}
      </div>
      <div className="space-y-5">{children}</div>
    </>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-12 items-center justify-between gap-3 rounded-xl border bg-card px-3 py-2 text-sm">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  )
}

function ConsentCard({ icon, title, text, checked, onChange, compact }: { icon?: React.ReactNode; title: string; text: string; checked: boolean; onChange: (v: boolean) => void; compact?: boolean }) {
  return (
    <label className={cn("flex gap-3 rounded-xl border bg-card", compact ? "p-3" : "p-4", checked && !compact && "border-forest")}>
      {icon && <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-sage text-forest">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{text}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} className="mt-1" />
    </label>
  )
}
