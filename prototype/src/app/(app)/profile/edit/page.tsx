"use client"

// Edit the account owner's profile: every onboarding answer (§5.2–§5.8) stays editable here.
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useApp, useSelfProfile } from "@/lib/store"
import { useTx } from "@/lib/i18n"
import type { Allergen, Profile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { PageBody, PageHeader, Pill, Section } from "@/components/app/page"
import { CautionNote, InfoNote, SafetyAlert } from "@/components/app/alerts"
import { Splash } from "@/components/app/shell"
import { ChipGroup, Field, PillGroup } from "@/components/app/controls"
import { TargetsCard } from "@/components/profile/targets-card"
import {
  ACTIVITY,
  ALLERGENS,
  CONDITIONS,
  DEFICIENCIES,
  DIETS,
  EQUIPMENT,
  FOOD_CHOICES,
  GOALS,
  NO_RESTRICTION_CONDITIONS,
  OCCUPATIONS,
  REGIONS,
  REVIEW_REQUIRED_CONDITIONS,
  ROUTING_GOALS,
} from "@/components/profile/options"

export default function EditProfilePage() {
  const self = useSelfProfile()
  if (!self) return <Splash />
  return <EditForm initial={self} />
}

const TRIGGER = "text-body py-4 font-semibold hover:no-underline"
const CONTENT = "space-y-5 pt-1 pb-5"

function EditForm({ initial }: { initial: Profile }) {
  const router = useRouter()
  const tx = useTx()
  const upsertProfile = useApp((s) => s.upsertProfile)
  const healthConsent = useApp((s) => s.consents.find((c) => c.type === "health_data")?.granted ?? false)
  const [p, setP] = useState<Profile>(initial)
  const set = (patch: Partial<Profile>) => setP((x) => ({ ...x, ...patch }))
  const removedAllergies = initial.allergies.filter((a) => !p.allergies.includes(a))
  const dirty = JSON.stringify(p) !== JSON.stringify(initial)

  const work = p.work ?? {}
  const schedule = p.schedule ?? {}
  const prefs = p.foodPrefs ?? { enjoyed: [], disliked: [], unavailable: [] }
  const health = p.healthAnswers ?? {}
  const cooking = p.cooking ?? { whoCooks: "self", equipment: [], carriesFoodToWork: false, batchCook: false }
  const budget = p.budget ?? { amountBdt: p.budgetPerWeekBdt ?? 0, period: "week" as const, scope: "personal" as const, includes: "groceries" as const }
  const noRestriction = p.conditions.some((c) => NO_RESTRICTION_CONDITIONS.includes(c)) || !!health.recentWeightChange

  const save = () => {
    const weekly = budget.amountBdt ? Math.round(budget.period === "day" ? budget.amountBdt * 7 : budget.period === "month" ? budget.amountBdt / 4.33 : budget.amountBdt) : p.budgetPerWeekBdt
    upsertProfile({ ...p, budgetPerWeekBdt: weekly, weightLossPace: p.goal === "lose_weight" && !noRestriction ? p.weightLossPace : undefined })
    toast.success(tx("Profile updated", "প্রোফাইল হালনাগাদ হয়েছে"), { description: p.caregiverOnly ? undefined : tx("Your next generated plan will use these details.", "পরের পরিকল্পনায় এই তথ্য ব্যবহার হবে।") })
    router.push("/profile")
  }

  const header = <PageHeader back="/profile" title={tx("Personal details", "ব্যক্তিগত তথ্য")} action={<Button size="sm" variant="ghost" disabled={!dirty} onClick={save}>{tx("Save", "সংরক্ষণ")}</Button>} />

  // Caregiver accounts hold no health data of their own (§5.10) until the person chooses to add it.
  if (p.caregiverOnly)
    return (
      <>
        {header}
        <PageBody>
          <Section title={tx("Caregiver account", "অভিভাবক অ্যাকাউন্ট")}>
            <InfoNote>{tx("You set up NutriPlan to care for someone else, so we hold no health details about you. You can add your own nutrition profile any time.", "আপনি অন্য কারও যত্নের জন্য NutriPlan চালু করেছেন, তাই আপনার স্বাস্থ্য তথ্য রাখা হয়নি। চাইলে নিজের প্রোফাইল যোগ করতে পারেন।")}</InfoNote>
            <Field label={tx("Name", "নাম")} htmlFor="name">
              <Input id="name" value={p.name} onChange={(e) => set({ name: e.target.value })} />
            </Field>
          </Section>
          <Button size="lg" variant={dirty ? "outline" : "default"} className="w-full" onClick={() => set({ caregiverOnly: false, measurementSource: "self_reported", units: "metric" })}>
            {tx("Add my own nutrition profile", "নিজের পুষ্টি প্রোফাইল যোগ করুন")}
          </Button>
          {dirty && (
            <Button size="lg" className="w-full" onClick={save}>
              {tx("Save changes", "পরিবর্তন সংরক্ষণ করুন")}
            </Button>
          )}
        </PageBody>
      </>
    )

  return (
    <>
      {header}
      <PageBody>
        <Section title={tx("Your starting ranges", "আপনার শুরুর পরিসর")}>
          <TargetsCard profile={p} />
        </Section>

        <Section title={tx("Your details", "আপনার তথ্য")}>
          <Accordion type="multiple" defaultValue={["body"]} className="divide-y divide-border/70 rounded-2xl bg-card px-4 shadow-card [&>[data-slot=accordion-item]]:border-b-0">
            <AccordionItem value="body">
              <AccordionTrigger className={TRIGGER}>{tx("Body and basics", "শরীর ও মৌলিক তথ্য")}</AccordionTrigger>
              <AccordionContent className={CONTENT}>
                <Field label={tx("Name", "নাম")} htmlFor="name">
                  <Input id="name" value={p.name} onChange={(e) => set({ name: e.target.value })} />
                </Field>
                <Field label={tx("Date of birth", "জন্মতারিখ")} htmlFor="dob">
                  <Input id="dob" type="date" value={p.dateOfBirth} onChange={(e) => set({ dateOfBirth: e.target.value })} />
                </Field>
                <Field label={tx("Sex", "লিঙ্গ")}>
                  <PillGroup label="Sex" value={p.sex} onChange={(v) => set({ sex: v })} options={[{ value: "female", label: "Female" }, { value: "male", label: "Male" }]} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={tx("Height (cm)", "উচ্চতা (সেমি)")} htmlFor="h">
                    <Input id="h" type="number" inputMode="decimal" value={p.heightCm ?? ""} onChange={(e) => set({ heightCm: Number(e.target.value) || undefined })} />
                  </Field>
                  <Field label={tx("Weight (kg)", "ওজন (কেজি)")} htmlFor="w">
                    <Input id="w" type="number" inputMode="decimal" value={p.weightKg ?? ""} onChange={(e) => set({ weightKg: Number(e.target.value) || undefined })} />
                  </Field>
                </div>
                <Field label={tx("Measurement source", "মাপের উৎস")} hint={<MeasurementFlag source={p.measurementSource} />}>
                  <PillGroup label="Measurement source" value={p.measurementSource ?? "self_reported"} onChange={(v) => set({ measurementSource: v })} options={[{ value: "self_reported", label: tx("Self-reported", "নিজে দেওয়া") }, { value: "clinical", label: tx("Clinically measured", "ক্লিনিকে মাপা") }]} />
                </Field>
                <Field label={tx("Preferred units", "পছন্দের একক")} hint={tx("Values are stored in cm and kg.", "মান সেমি ও কেজিতে সংরক্ষিত হয়।")}>
                  <PillGroup label="Units" value={p.units ?? "metric"} onChange={(v) => set({ units: v })} options={[{ value: "metric", label: "Metric (cm, kg)" }, { value: "imperial", label: "Imperial (ft, lb)" }]} />
                </Field>
                <Field label={tx("Region", "অঞ্চল")}>
                  <PillGroup label="Region" value={p.region} onChange={(v) => set({ region: v })} options={REGIONS} />
                </Field>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="goal">
              <AccordionTrigger className={TRIGGER}>{tx("Goal", "লক্ষ্য")}</AccordionTrigger>
              <AccordionContent className={CONTENT}>
                <PillGroup label="Goal" value={p.goal} onChange={(v) => set({ goal: v })} options={GOALS.filter((g) => !ROUTING_GOALS.includes(g.value)).map((g) => ({ value: g.value, label: g.label }))} />
                {p.goal === "lose_weight" &&
                  (noRestriction ? (
                    <CautionNote title={tx("We won't plan a calorie deficit", "ক্যালরি ঘাটতির পরিকল্পনা করা হবে না")}>{tx("With what you've told us, restriction isn't safe to automate. Your plan will focus on balanced, regular meals.", "আপনার তথ্য অনুযায়ী স্বয়ংক্রিয় ঘাটতি নিরাপদ নয়। পরিকল্পনা সুষম, নিয়মিত খাবারে মনোযোগ দেবে।")}</CautionNote>
                  ) : (
                    <Field label={tx("Preferred pace", "পছন্দের গতি")}>
                      <PillGroup label="Pace" value={p.weightLossPace ?? "gradual"} onChange={(v) => set({ weightLossPace: v })} options={[{ value: "gradual", label: "Gradual (~0.25 kg/week)" }, { value: "steady", label: "Steady (up to ~0.5 kg/week)" }]} />
                    </Field>
                  ))}
                {p.goal === "family" && <InfoNote>{tx("Family profiles and shared meals are part of the Family plan. Add members from Profile → Family.", "পরিবারের প্রোফাইল ফ্যামিলি প্ল্যানে। প্রোফাইল → পরিবার থেকে যোগ করুন।")}</InfoNote>}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="work">
              <AccordionTrigger className={TRIGGER}>{tx("Work and activity", "কাজ ও সক্রিয়তা")}</AccordionTrigger>
              <AccordionContent className={CONTENT}>
                <Field label={tx("Occupation", "পেশা")}>
                  <PillGroup label="Occupation" value={p.occupation} onChange={(v) => set({ occupation: v })} options={OCCUPATIONS} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={tx("Work starts", "কাজ শুরু")} htmlFor="ws">
                    <Input id="ws" type="time" value={p.workStart ?? ""} onChange={(e) => set({ workStart: e.target.value })} />
                  </Field>
                  <Field label={tx("Work ends", "কাজ শেষ")} htmlFor="we">
                    <Input id="we" type="time" value={p.workEnd ?? ""} onChange={(e) => set({ workEnd: e.target.value })} />
                  </Field>
                </div>
                <Field label={tx("Workdays per week", "সপ্তাহে কর্মদিবস")}>
                  <PillGroup label="Workdays" value={String(work.daysPerWeek ?? "")} onChange={(v) => set({ work: { ...work, daysPerWeek: Number(v) } })} options={["3", "4", "5", "6", "7"].map((v) => ({ value: v, label: v }))} />
                </Field>
                <Field label={tx("Time spent sitting", "বসে থাকার সময়")}>
                  <PillGroup label="Sitting" value={work.sitting} onChange={(v) => set({ work: { ...work, sitting: v } })} options={[{ value: "most", label: "Most of the day" }, { value: "half", label: "About half" }, { value: "little", label: "Mostly standing/walking" }]} />
                </Field>
                <SwitchRow label={tx("Lifting or strenuous work", "ভারী বা পরিশ্রমের কাজ")} checked={!!work.lifting} onChange={(v) => set({ work: { ...work, lifting: v } })} />
                <SwitchRow label={tx("Outdoors or in heat", "বাইরে বা গরমে")} checked={!!work.outdoorsOrHeat} onChange={(v) => set({ work: { ...work, outdoorsOrHeat: v } })} />
                <SwitchRow label={tx("Night shifts", "রাতের শিফট")} checked={!!work.nightShift} onChange={(v) => set({ work: { ...work, nightShift: v } })} />
                <Field label={tx("Daily activity", "দৈনন্দিন সক্রিয়তা")}>
                  <PillGroup label="Activity" value={p.activity} onChange={(v) => set({ activity: v })} options={ACTIVITY} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={tx("Exercise days / week", "সপ্তাহে ব্যায়াম")} htmlFor="exd">
                    <Input id="exd" type="number" inputMode="numeric" min={0} max={7} value={p.exercise?.daysPerWeek ?? 0} onChange={(e) => set({ exercise: { minutesPerSession: p.exercise?.minutesPerSession ?? 30, daysPerWeek: Math.min(7, Math.max(0, Number(e.target.value) || 0)) } })} />
                  </Field>
                  <Field label={tx("Minutes per session", "প্রতিবার মিনিট")} htmlFor="exm">
                    <Input id="exm" type="number" inputMode="numeric" min={0} step={5} value={p.exercise?.minutesPerSession ?? 30} onChange={(e) => set({ exercise: { daysPerWeek: p.exercise?.daysPerWeek ?? 0, minutesPerSession: Math.max(0, Number(e.target.value) || 0) } })} />
                  </Field>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="schedule">
              <AccordionTrigger className={TRIGGER}>{tx("Daily schedule", "দৈনিক সময়সূচি")}</AccordionTrigger>
              <AccordionContent className={CONTENT}>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      ["wake", tx("Wake up", "ঘুম থেকে ওঠা")],
                      ["sleep", tx("Sleep", "ঘুম")],
                      ["breakfast", tx("Breakfast", "নাস্তা")],
                      ["lunch", tx("Lunch", "দুপুরের খাবার")],
                      ["dinner", tx("Dinner", "রাতের খাবার")],
                    ] as const
                  ).map(([k, label]) => (
                    <Field key={k} label={label} htmlFor={`s-${k}`}>
                      <Input id={`s-${k}`} type="time" value={schedule[k] ?? ""} onChange={(e) => set({ schedule: { ...schedule, [k]: e.target.value } })} />
                    </Field>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="food">
              <AccordionTrigger className={TRIGGER}>{tx("Food preferences", "খাবারের পছন্দ")}</AccordionTrigger>
              <AccordionContent className={CONTENT}>
                <Field label={tx("Dietary preferences", "খাদ্যাভ্যাস")}>
                  <ChipGroup label="Dietary preferences" value={p.diet} onChange={(v) => set({ diet: v })} options={DIETS} />
                </Field>
                <Field label={tx("Religious or cultural rules", "ধর্মীয় বা সাংস্কৃতিক নিয়ম")} htmlFor="relig">
                  <Input id="relig" value={prefs.religious ?? ""} onChange={(e) => set({ foodPrefs: { ...prefs, religious: e.target.value } })} />
                </Field>
                <Field label={tx("Foods I enjoy", "যে খাবার পছন্দ")}>
                  <ChipGroup label="Enjoyed" value={prefs.enjoyed} onChange={(v) => set({ foodPrefs: { ...prefs, enjoyed: v } })} options={FOOD_CHOICES.filter((o) => !prefs.disliked.includes(o.value))} />
                </Field>
                <Field label={tx("Foods I dislike", "যে খাবার অপছন্দ")}>
                  <ChipGroup label="Disliked" value={prefs.disliked} onChange={(v) => set({ foodPrefs: { ...prefs, disliked: v } })} options={FOOD_CHOICES.filter((o) => !prefs.enjoyed.includes(o.value))} />
                </Field>
                <Field label={tx("Hard to get where I live", "যা পাওয়া কঠিন")}>
                  <ChipGroup label="Unavailable" value={prefs.unavailable} onChange={(v) => set({ foodPrefs: { ...prefs, unavailable: v } })} options={FOOD_CHOICES} />
                </Field>
                <Field label={tx("Where I usually eat", "সাধারণত কোথায় খাই")}>
                  <PillGroup label="Home cooked" value={prefs.homeCooked} onChange={(v) => set({ foodPrefs: { ...prefs, homeCooked: v } })} options={[{ value: "mostly_home", label: "Mostly home-cooked" }, { value: "mixed", label: "A mix" }, { value: "mostly_out", label: "Often eat out" }]} />
                </Field>
                <Field label={tx("Notes", "নোট")} htmlFor="pnotes">
                  <Textarea id="pnotes" rows={2} value={prefs.notes ?? ""} onChange={(e) => set({ foodPrefs: { ...prefs, notes: e.target.value } })} />
                </Field>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="budget">
              <AccordionTrigger className={TRIGGER}>{tx("Budget and cooking", "বাজেট ও রান্না")}</AccordionTrigger>
              <AccordionContent className={CONTENT}>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={tx("Budget (৳)", "বাজেট (৳)")} htmlFor="b">
                    <Input id="b" type="number" inputMode="numeric" value={budget.amountBdt || ""} onChange={(e) => set({ budget: { ...budget, amountBdt: Number(e.target.value) || 0 } })} />
                  </Field>
                  <Field label={tx("Max prep (min)", "সর্বোচ্চ রান্নার সময় (মিনিট)")} htmlFor="prep">
                    <Input id="prep" type="number" inputMode="numeric" value={p.maxPrepMinutes ?? ""} onChange={(e) => set({ maxPrepMinutes: Number(e.target.value) || undefined })} />
                  </Field>
                </div>
                <PillGroup label="Budget period" value={budget.period} onChange={(v) => set({ budget: { ...budget, period: v } })} options={[{ value: "day", label: "Per day" }, { value: "week", label: "Per week" }, { value: "month", label: "Per month" }]} />
                <PillGroup label="Budget scope" value={budget.scope} onChange={(v) => set({ budget: { ...budget, scope: v } })} options={[{ value: "personal", label: "Just me" }, { value: "household", label: "Whole household" }]} />
                <PillGroup label="Budget includes" value={budget.includes} onChange={(v) => set({ budget: { ...budget, includes: v } })} options={[{ value: "groceries", label: "Groceries only" }, { value: "groceries_and_eating_out", label: "Incl. eating out" }]} />
                <Field label={tx("Who cooks", "কে রান্না করেন")}>
                  <PillGroup label="Who cooks" value={cooking.whoCooks} onChange={(v) => set({ cooking: { ...cooking, whoCooks: v } })} options={[{ value: "self", label: "I cook" }, { value: "someone_else", label: "Someone else cooks for me" }, { value: "shared", label: "Shared" }]} />
                </Field>
                <Field label={tx("Kitchen equipment", "রান্নাঘরের সরঞ্জাম")}>
                  <ChipGroup label="Equipment" value={cooking.equipment} onChange={(v) => set({ cooking: { ...cooking, equipment: v } })} options={EQUIPMENT} />
                </Field>
                <SwitchRow label={tx("I can batch-cook", "একসাথে বেশি রান্না করতে পারি")} checked={cooking.batchCook} onChange={(v) => set({ cooking: { ...cooking, batchCook: v } })} />
                <SwitchRow label={tx("I carry food to work", "কাজে খাবার নিয়ে যাই")} checked={cooking.carriesFoodToWork} onChange={(v) => set({ cooking: { ...cooking, carriesFoodToWork: v } })} />
                <Field label={tx("Meals per day", "দিনে কয় বেলা")}>
                  <PillGroup label="Meals per day" value={String(p.mealsPerDay ?? 3)} onChange={(v) => set({ mealsPerDay: Number(v) })} options={["3", "4", "5"].map((v) => ({ value: v, label: v }))} />
                </Field>
                <SwitchRow label={tx("Include snacks", "স্ন্যাকস রাখুন")} checked={!!p.includeSnacks} onChange={(v) => set({ includeSnacks: v })} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="health" className="border-b-0">
              <AccordionTrigger className={TRIGGER}>{tx("Allergies and health", "অ্যালার্জি ও স্বাস্থ্য")}</AccordionTrigger>
              <AccordionContent className={CONTENT}>
                {!healthConsent ? (
                  <CautionNote title={tx("Health permission is off", "স্বাস্থ্য অনুমতি বন্ধ")}>{tx("Turn it on in Privacy and data to record allergies and conditions.", "অ্যালার্জি ও রোগ লিখতে প্রাইভেসি থেকে চালু করুন।")}</CautionNote>
                ) : (
                  <>
                    <Field label={tx("Food allergies", "খাদ্য অ্যালার্জি")} hint={tx("Hard safety rules everywhere in the app.", "অ্যাপের সব জায়গায় কঠোর নিরাপত্তা নিয়ম।")}>
                      <ChipGroup<Allergen> label="Food allergies" value={p.allergies} onChange={(v) => set({ allergies: v })} options={ALLERGENS} />
                    </Field>
                    {removedAllergies.length > 0 && (
                      <SafetyAlert title={tx("Removing an allergy", "অ্যালার্জি সরানো হচ্ছে")}>
                        Only remove an allergy if a doctor has confirmed it&apos;s safe. Foods containing {removedAllergies.join(", ")} may appear in your plans again.
                      </SafetyAlert>
                    )}
                    <Field label={tx("Conditions", "রোগ")}>
                      <ChipGroup label="Conditions" value={p.conditions} onChange={(v) => set({ conditions: v })} options={CONDITIONS} />
                    </Field>
                    {p.conditions.some((c) => REVIEW_REQUIRED_CONDITIONS.includes(c)) && (
                      <CautionNote title={tx("Professional review needed", "পেশাদার পর্যালোচনা প্রয়োজন")}>{tx("New plans will use general guidance and be flagged for review by a qualified professional.", "নতুন পরিকল্পনা সাধারণ নির্দেশনা ব্যবহার করবে এবং পর্যালোচনার জন্য চিহ্নিত হবে।")}</CautionNote>
                    )}
                    <SwitchRow label={tx("I take medication that affects food or fluids", "খাবারে প্রভাব ফেলে এমন ওষুধ খাই")} checked={!!health.takesMedication} onChange={(v) => set({ healthAnswers: { ...health, takesMedication: v } })} />
                    {health.takesMedication && <InfoNote>{tx("We never change medication or doses. Keep following your clinician's advice.", "আমরা কখনো ওষুধ বা ডোজ বদলাই না।")}</InfoNote>}
                    <SwitchRow label={tx("A clinician advised a specific diet", "চিকিৎসক নির্দিষ্ট খাদ্যাভ্যাস বলেছেন")} checked={!!health.clinicianAdvisedDiet} onChange={(v) => set({ healthAnswers: { ...health, clinicianAdvisedDiet: v } })} />
                    <SwitchRow label={tx("Recent unexplained weight change", "সাম্প্রতিক অব্যাখ্যাত ওজন পরিবর্তন")} checked={!!health.recentWeightChange} onChange={(v) => set({ healthAnswers: { ...health, recentWeightChange: v } })} />
                    <Field label={tx("Deficiencies diagnosed by a clinician", "চিকিৎসক নির্ণীত ঘাটতি")} hint={tx("Only what a test or clinician confirmed.", "শুধু পরীক্ষা বা চিকিৎসক যা নিশ্চিত করেছেন।")}>
                      <ChipGroup label="Diagnosed deficiencies" value={health.diagnosedDeficiencies ?? []} onChange={(v) => set({ healthAnswers: { ...health, diagnosedDeficiencies: v } })} options={DEFICIENCIES} />
                    </Field>
                  </>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Section>

        <Button size="lg" className="w-full" disabled={!dirty} onClick={save}>
          {tx("Save changes", "পরিবর্তন সংরক্ষণ করুন")}
        </Button>
        <p className="text-caption -mt-4 text-center text-muted-foreground">{tx("Saving doesn't change your active plan. Generate a new plan to use updated targets.", "সংরক্ষণে সক্রিয় পরিকল্পনা বদলায় না। নতুন লক্ষ্য ব্যবহারে নতুন পরিকল্পনা তৈরি করুন।")}</p>
      </PageBody>
    </>
  )
}

/** Shows whether height/weight are self-reported or clinically measured (§5.2). Text, not color alone. */
function MeasurementFlag({ source }: { source?: Profile["measurementSource"] }) {
  return source === "clinical" ? <Pill tone="sage">Clinically measured</Pill> : <Pill tone="outline">Self-reported</Pill>
}

function SwitchRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="text-body flex min-h-12 items-center justify-between gap-4 rounded-xl bg-muted px-4 py-2">
      {label}
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  )
}
