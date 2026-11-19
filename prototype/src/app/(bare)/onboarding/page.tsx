"use client"

// Progressive onboarding (§5.1–§5.9) with consent before health, photo and child data (§5.10, §21.4).
// One question group per screen (UI-SPEC §5.2). Optional groups can be skipped and filled in later from Profile.
import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Armchair, Baby, Bike, Clock, Dumbbell, Footprints, HardHat, HeartPulse, Lock, ShieldAlert, ShieldCheck, Smile, Stethoscope, User, UserPlus, Users } from "lucide-react"
import { useApp } from "@/lib/store"
import { ageInMonths, ageInYears } from "@/lib/nutrition"
import { addDays, todayISO, uid } from "@/lib/date"
import { useTx } from "@/lib/i18n"
import type { Allergen, ConsentRecord, Profile } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { FeatureBadge, PhaseBadge, useFeature } from "@/components/app/badges"
import { CautionNote, InfoNote, SafetyAlert } from "@/components/app/alerts"
import { Splash } from "@/components/app/shell"
import { FlowHeader, IconTile, StatTile, StickyFooter, Surface, type IconTone } from "@/components/app/page"
import { ChipGroup, ChoiceCard, Field, PillGroup, Segmented, WhyWeAsk } from "@/components/app/controls"
import { TargetsCard } from "@/components/profile/targets-card"
import {
  ACTIVITY,
  ALLERGENS,
  CHILD_CONDITIONS,
  CONDITIONS,
  DEFICIENCIES,
  DIETS,
  EQUIPMENT,
  FEEDING_DIFFICULTIES,
  FIRST_FOODS,
  FOOD_CHOICES,
  GOALS,
  NO_RESTRICTION_CONDITIONS,
  OCCUPATIONS,
  READINESS_SIGNS,
  REGIONS,
  REVIEW_REQUIRED_CONDITIONS,
} from "@/components/profile/options"
import { RECIPE_PHOTO } from "@/lib/data/photos"

type Who = "self" | "baby" | "child" | "partner" | "family"

type StepId =
  | "who"
  | "household"
  | "basics"
  | "body"
  | "goal"
  | "work"
  | "work_details"
  | "activity"
  | "schedule"
  | "diet"
  | "food_likes"
  | "health_consent"
  | "allergies"
  | "conditions"
  | "circumstances"
  | "health_flags"
  | "weight_goal"
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
  | "child_readiness"
  | "child_health"
  | "child_reactions"
  | "child_history"

/** Optional groups: "Skip for now" leaves them empty, editable later in Profile. */
const SKIPPABLE: StepId[] = ["work_details", "schedule", "food_likes", "kitchen", "child_readiness", "child_history"]

const BUDGETS = [
  { value: 1200, label: "Very budget-conscious", bn: "খুব সাশ্রয়ী", description: "About ৳1,200 per week" },
  { value: 2000, label: "Budget-friendly", bn: "সাশ্রয়ী", description: "About ৳2,000 per week" },
  { value: 3000, label: "Moderate", bn: "মাঝারি", description: "About ৳3,000 per week" },
  { value: 4500, label: "Flexible", bn: "নমনীয়", description: "About ৳4,500 per week" },
]

const PREP = [
  { value: 10, label: "Under 10 minutes" },
  { value: 20, label: "10–20 minutes" },
  { value: 40, label: "20–40 minutes" },
  { value: 60, label: "More than 40 minutes" },
]

/** §5 health conditions, split over two one-screen steps. Pregnancy and similar circumstances come second. */
const CIRCUMSTANCE_IDS = ["pregnancy", "breastfeeding", "eating_disorder", "swallowing"]
const CONDITION_OPTS = CONDITIONS.filter((c) => !CIRCUMSTANCE_IDS.includes(c.value))
const CIRCUMSTANCE_OPTS = CONDITIONS.filter((c) => CIRCUMSTANCE_IDS.includes(c.value))

const consent = (type: ConsentRecord["type"], granted: boolean): ConsentRecord => ({ type, granted, version: "1.0", at: new Date().toISOString() })

const CM_PER_IN = 2.54
const KG_PER_LB = 0.453592

export default function OnboardingPage() {
  const router = useRouter()
  const tx = useTx()
  const hydrated = useApp((s) => s.hydrated)
  const user = useApp((s) => s.user)
  const onboarded = useApp((s) => s.onboarded)
  const completeOnboarding = useApp((s) => s.completeOnboarding)
  const updateSettings = useApp((s) => s.updateSettings)
  const language = useApp((s) => s.settings.language)
  const familyAllowed = useFeature("family").allowed

  // Set while finishing, so the "already onboarded" redirect doesn't override the finish destination.
  const finishing = useRef(false)
  useEffect(() => {
    if (!hydrated || finishing.current) return
    if (!user) router.replace("/welcome")
    else if (onboarded) router.replace("/home")
  }, [hydrated, user, onboarded, router])

  const [who, setWho] = useState<Who>("self")
  const [step, setStep] = useState(0)
  const [skipped, setSkipped] = useState<Set<StepId>>(new Set())

  // Adult answers (the account owner, or another adult with Family)
  const [p, setP] = useState<Partial<Profile>>({
    type: "adult",
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
    units: "metric",
    measurementSource: "self_reported",
  })
  const set = (patch: Partial<Profile>) => setP((x) => ({ ...x, ...patch }))
  const [personName, setPersonName] = useState("")
  const [householdOk, setHouseholdOk] = useState(false)
  const [imperial, setImperial] = useState({ ft: "", inch: "", lb: "" })
  const [work, setWork] = useState<NonNullable<Profile["work"]>>({ daysPerWeek: 5, sitting: "most", lifting: false, outdoorsOrHeat: false, nightShift: false })
  const [exercise, setExercise] = useState({ daysPerWeek: 0, minutesPerSession: 30 })
  const [schedule, setSchedule] = useState<NonNullable<Profile["schedule"]>>({ wake: "07:00", sleep: "23:00", breakfast: "08:00", lunch: "13:30", dinner: "21:00" })
  const [prefs, setPrefs] = useState<NonNullable<Profile["foodPrefs"]>>({ enjoyed: [], disliked: [], unavailable: [], religious: "", homeCooked: "mostly_home", notes: "" })
  const [prefTab, setPrefTab] = useState<"enjoyed" | "disliked" | "unavailable">("enjoyed")
  const [flags, setFlags] = useState({ medications: false, clinicianDiet: false, weightChange: false })
  const [deficiencies, setDeficiencies] = useState<string[]>([])
  const [pace, setPace] = useState<"gradual" | "steady">("gradual")
  const [noLossAdvice, setNoLossAdvice] = useState(false)
  const [emergency, setEmergency] = useState(false)
  const [budget, setBudget] = useState<NonNullable<Profile["budget"]>>({ amountBdt: 2000, period: "week", scope: "personal", includes: "groceries" })
  const [cooking, setCooking] = useState<NonNullable<Profile["cooking"]>>({ whoCooks: "self", equipment: ["stove", "fridge"], carriesFoodToWork: false, batchCook: false })

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
    measurementSource: "self_reported",
  })
  const setC = (patch: Partial<Profile>) => setChild((x) => ({ ...x, ...patch }))
  const [ci, setCi] = useState<NonNullable<Profile["childInfo"]>>({ premature: false, readinessSigns: [], conditions: [], feedingDifficulties: [], foodsIntroduced: [], clinicianRestrictions: "", pastReaction: false, pastReactionNote: "" })
  const setCI = (patch: Partial<NonNullable<Profile["childInfo"]>>) => setCi((x) => ({ ...x, ...patch }))

  // Consents (§5.10): asked right before the data they cover.
  const [consents, setConsents] = useState({ health_data: false, child_data: false, food_photos: true, ai_processing: true, analytics: false })
  const toggleConsent = (k: keyof typeof consents, v: boolean) => setConsents((c) => ({ ...c, [k]: v }))

  const adultFlow = who === "self" || who === "partner" || who === "family"
  const forOther = who === "partner" || who === "family"
  const steps = useMemo<StepId[]>(() => {
    if (!adultFlow) return ["who", "child_consent", "child_basics", "child_details", ...(who === "baby" ? (["child_readiness"] as StepId[]) : []), "child_health", "child_reactions", "child_history", "review", "permissions"]
    return [
      "who",
      ...(forOther ? (["household"] as StepId[]) : []),
      "basics", "body", "goal", "work", "work_details", "activity", "schedule", "diet", "food_likes",
      "health_consent", "allergies", "conditions", "circumstances", "health_flags",
      ...(p.goal === "lose_weight" ? (["weight_goal"] as StepId[]) : []),
      "urgent", "budget", "cooking", "kitchen", "review", "safeguards", "permissions",
    ]
  }, [adultFlow, forOther, who, p.goal])
  const id = steps[Math.min(step, steps.length - 1)]

  const adultAge = p.dateOfBirth ? ageInYears(p.dateOfBirth) : 0
  const childMonths = child.dateOfBirth ? ageInMonths(child.dateOfBirth) : 0
  // Corrected age for babies born before 37 weeks (§12): months minus the weeks born early.
  const weeksEarly = ci.premature && ci.gestationWeeks ? Math.max(0, 40 - ci.gestationWeeks) : 0
  const correctedMonths = Math.max(0, Math.round(childMonths - weeksEarly / 4.35))
  const bmiValue = p.heightCm && p.weightKg ? p.weightKg / (p.heightCm / 100) ** 2 : null
  const reviewNeeded = (p.conditions ?? []).filter((c) => REVIEW_REQUIRED_CONDITIONS.includes(c))
  // Any contraindication routes weight loss to a non-restrictive plan (§5.3, §13).
  const restrictionUnsafe = (p.conditions ?? []).some((c) => NO_RESTRICTION_CONDITIONS.includes(c)) || flags.weightChange || noLossAdvice || (bmiValue !== null && bmiValue < 18.5)
  const effectiveGoal = restrictionUnsafe && p.goal === "lose_weight" ? "improve_nutrition" : p.goal
  const theirs = forOther ? (personName.trim() || tx("this person", "এই ব্যক্তি")) : null

  const canNext = useMemo(() => {
    switch (id) {
      case "household":
        return householdOk
      case "basics":
        return !!p.dateOfBirth && adultAge >= 18 && !!p.sex && (!forOther || !!personName.trim())
      case "body":
        return !!p.heightCm && !!p.weightKg
      case "health_consent":
        return consents.health_data
      case "urgent":
        return !emergency
      case "child_consent":
        return consents.child_data
      case "child_basics":
        return !!child.name?.trim() && !!child.dateOfBirth && childMonths >= 0 && (!ci.premature || (!!ci.gestationWeeks && ci.gestationWeeks >= 22 && ci.gestationWeeks <= 36))
      default:
        return true
    }
  }, [id, p, adultAge, consents, child, childMonths, emergency, householdOk, forOther, personName, ci])

  if (!hydrated || !user || onboarded) return <Splash />

  const finish = () => {
    finishing.current = true
    const records = (Object.keys(consents) as (keyof typeof consents)[]).map((k) => consent(k, consents[k]))
    const state = useApp.getState()
    if (adultFlow) {
      const weeklyBudget = Math.round(budget.period === "day" ? budget.amountBdt * 7 : budget.period === "month" ? budget.amountBdt / 4.33 : budget.amountBdt)
      const hours = p.workStart && p.workEnd ? hoursBetween(p.workStart, p.workEnd) : undefined
      const answers: Partial<Profile> = {
        ...p,
        goal: effectiveGoal,
        weightLossPace: effectiveGoal === "lose_weight" ? pace : undefined,
        work: skipped.has("work_details") ? { daysPerWeek: work.daysPerWeek, hoursPerDay: hours } : { ...work, hoursPerDay: hours },
        exercise,
        schedule: skipped.has("schedule") ? undefined : schedule,
        foodPrefs: skipped.has("food_likes") ? { enjoyed: [], disliked: [], unavailable: [], religious: prefs.religious } : prefs,
        healthAnswers: { takesMedication: flags.medications, clinicianAdvisedDiet: flags.clinicianDiet, recentWeightChange: flags.weightChange, diagnosedDeficiencies: deficiencies },
        budget,
        budgetPerWeekBdt: weeklyBudget,
        cooking: skipped.has("kitchen") ? { ...cooking, equipment: [] } : cooking,
      }
      if (who === "self") {
        completeOnboarding({ ...answers, relation: "self", name: user.name }, records)
      } else {
        // The account owner manages this adult's profile with their agreement (Family, §42.9); the owner gets no invented health data.
        completeOnboarding({ name: user.name, caregiverOnly: true }, records, { ...answers, type: "adult", relation: who === "partner" ? "partner" : "family", name: personName.trim(), avatarColor: "terracotta" })
      }
      // A new account starts without a plan: go to plan setup (§10.1).
      router.replace("/plan/generate")
      return
    }
    // Caregiver account: no adult health data, no adult plan (§5.10).
    const healthOk = consents.health_data
    const info: Profile["childInfo"] = {
      ...ci,
      gestationWeeks: ci.premature ? ci.gestationWeeks : undefined,
      readinessSigns: skipped.has("child_readiness") ? [] : ci.readinessSigns,
      foodsIntroduced: skipped.has("child_history") ? [] : ci.foodsIntroduced,
      conditions: healthOk ? ci.conditions : [],
      feedingDifficulties: healthOk ? ci.feedingDifficulties : [],
      pastReaction: healthOk ? ci.pastReaction : undefined,
      pastReactionNote: healthOk && ci.pastReaction ? ci.pastReactionNote : undefined,
      clinicianRestrictions: healthOk ? ci.clinicianRestrictions : undefined,
    }
    completeOnboarding({ name: user.name, caregiverOnly: true }, records, {
      ...child,
      allergies: healthOk ? child.allergies : [],
      type: childMonths < 12 ? "infant" : "child",
      name: child.name!.trim(),
      childInfo: info,
    })
    const dep = useApp.getState().profiles.find((x) => x.relation === "child")
    if (dep) {
      state.setActiveProfile(dep.id)
      // Foods already introduced feed the introduction tracker (§12.8); reactions stay unrecorded unless reported.
      for (const name of info.foodsIntroduced ?? [])
        useApp.getState().addIntroduced({ id: uid("intro"), profileId: dep.id, foodName: name, date: todayISO(), preparation: "Reported during setup", texture: "Not recorded", accepted: "yes", reaction: "Not recorded", clinicianAdvisedAvoid: false })
    }
    router.replace("/home")
  }

  const next = () => {
    setSkipped((s) => {
      const n = new Set(s)
      n.delete(id)
      return n
    })
    if (step < steps.length - 1) setStep(step + 1)
    else finish()
  }
  const skip = () => {
    setSkipped((s) => new Set(s).add(id))
    setStep(step + 1)
  }
  const back = () => (step > 0 ? setStep(step - 1) : router.push("/welcome"))

  const setHeightImperial = (ft: string, inch: string) => {
    setImperial((x) => ({ ...x, ft, inch }))
    const total = (Number(ft) || 0) * 12 + (Number(inch) || 0)
    set({ heightCm: total ? Math.round(total * CM_PER_IN) : undefined })
  }
  const setWeightImperial = (lb: string) => {
    setImperial((x) => ({ ...x, lb }))
    set({ weightKg: Number(lb) ? Math.round(Number(lb) * KG_PER_LB * 10) / 10 : undefined })
  }

  const prefOptions = FOOD_CHOICES.filter((o) => prefTab === "enjoyed" ? !prefs.disliked.includes(o.value) : prefTab === "disliked" ? !prefs.enjoyed.includes(o.value) : true)
  const whoLabel = who === "baby" ? tx("your baby", "আপনার শিশু") : tx("your child", "আপনার সন্তান")

  return (
    <main className="flex flex-1 flex-col">
      <FlowHeader title={tx("Set up your profile", "প্রোফাইল তৈরি করুন")} step={step + 1} total={steps.length} onBack={back} />

      <div className="px-gutter flex-1 space-y-4 pt-2 pb-5">
        {id === "who" && (
          <StepIntro title={tx("Who is this plan for?", "এই পরিকল্পনা কার জন্য?")} text={tx("Babies and children never get an adult questionnaire.", "শিশুদের জন্য কখনো প্রাপ্তবয়স্কদের প্রশ্নাবলি ব্যবহার করা হয় না।")}>
            <div role="radiogroup" className="space-y-2">
              <ChoiceCard className={cn(DENSE, TONE.lime)} selected={who === "self"} onSelect={() => setWho("self")} icon={<User className="size-5" />} title={tx("Myself", "নিজের জন্য")} description={tx("Plans for your body, work and goals", "আপনার শরীর, কাজ ও লক্ষ্য অনুযায়ী")} />
              <ChoiceCard className={cn(DENSE, TONE.sky)} selected={who === "baby"} onSelect={() => { setWho("baby"); setC({ dateOfBirth: addDays(todayISO(), -213) }) }} icon={<Baby className="size-5" />} title={tx("My baby", "আমার শিশু")} description={tx("First foods from about 6 months", "প্রায় ৬ মাস থেকে প্রথম খাবার")} />
              <ChoiceCard className={cn(DENSE, TONE.amber)} selected={who === "child"} onSelect={() => { setWho("child"); setC({ dateOfBirth: addDays(todayISO(), -365 * 4) }) }} icon={<Smile className="size-5" />} title={tx("My child", "আমার সন্তান")} description={tx("Child-appropriate guidance, no calorie counting", "শিশু-উপযোগী নির্দেশনা, ক্যালরি গণনা নয়")} />
              <ChoiceCard className={cn(DENSE, TONE.coral)} selected={who === "partner"} disabled={!familyAllowed} onSelect={() => setWho("partner")} icon={<Users className="size-5" />} title={tx("My spouse or partner", "আমার স্বামী/স্ত্রী বা সঙ্গী")} description={familyAllowed ? tx("With their agreement", "তাদের সম্মতিতে") : tx("Included in Family", "ফ্যামিলি প্ল্যানে অন্তর্ভুক্ত")} badge={<FeatureBadge feature="family" />} />
              <ChoiceCard className={cn(DENSE, TONE.forest)} selected={who === "family"} disabled={!familyAllowed} onSelect={() => setWho("family")} icon={<UserPlus className="size-5" />} title={tx("Another family member", "পরিবারের অন্য সদস্য")} description={familyAllowed ? tx("With their agreement", "তাদের সম্মতিতে") : tx("Included in Family", "ফ্যামিলি প্ল্যানে অন্তর্ভুক্ত")} badge={<FeatureBadge feature="family" />} />
            </div>
            {!familyAllowed && <p className="text-caption text-muted-foreground">{tx("Adult family profiles need household permissions, part of the Family plan. You can add them later from Profile → Family.", "প্রাপ্তবয়স্ক পরিবারের প্রোফাইলের জন্য ফ্যামিলি প্ল্যান লাগবে। পরে প্রোফাইল → পরিবার থেকে যোগ করতে পারবেন।")}</p>}
            {(who === "baby" || who === "child") && <InfoNote className={NOTE}>{tx(`You stay the account owner and manage ${who === "baby" ? "your baby's" : "your child's"} profile as their caregiver. We won't ask for your own health details.`, "আপনি অ্যাকাউন্টের মালিক থাকবেন এবং অভিভাবক হিসেবে প্রোফাইলটি পরিচালনা করবেন। আপনার নিজের স্বাস্থ্য তথ্য চাওয়া হবে না।")}</InfoNote>}
          </StepIntro>
        )}

        {id === "household" && (
          <StepIntro title={tx("Their agreement", "তাদের সম্মতি")} text={tx("You'll enter another adult's details. They should know and agree.", "আপনি অন্য একজন প্রাপ্তবয়স্কের তথ্য দেবেন। তাদের জানা ও সম্মতি থাকা উচিত।")}>
            <ConsentCard icon={<Users className="size-5" />} tone="terracotta" title={tx("They agreed to share their information with me", "তারা আমার সাথে তথ্য শেয়ার করতে রাজি")} text={tx("Their health details stay private to their profile. They can take over or delete their profile at any time.", "তাদের স্বাস্থ্য তথ্য তাদের প্রোফাইলেই গোপন থাকবে। তারা যেকোনো সময় প্রোফাইল নিজের করে নিতে বা মুছতে পারবেন।")} checked={householdOk} onChange={setHouseholdOk} />
            <InfoNote className={NOTE}>{tx("Household members never see each other's health data without permission.", "অনুমতি ছাড়া পরিবারের সদস্যরা একে অপরের স্বাস্থ্য তথ্য দেখতে পারেন না।")}</InfoNote>
          </StepIntro>
        )}

        {id === "basics" && (
          <StepIntro title={tx("A few basics", "কিছু মৌলিক তথ্য")} text={tx("Used to estimate energy needs. You can update these any time.", "শক্তির চাহিদা অনুমানে ব্যবহৃত। যেকোনো সময় বদলাতে পারবেন।")}>
            {forOther && (
              <Field label={tx("Their name", "তাদের নাম")} htmlFor="pname">
                <Input id="pname" value={personName} onChange={(e) => setPersonName(e.target.value)} />
              </Field>
            )}
            <Field label={tx("Date of birth", "জন্মতারিখ")} htmlFor="dob" error={p.dateOfBirth && adultAge < 18 ? tx("Personal adult plans are for people 18 and over. For a younger person, add a child profile instead.", "প্রাপ্তবয়স্ক পরিকল্পনা ১৮ বছর ও তার বেশি বয়সীদের জন্য।") : undefined}>
              <Input id="dob" type="date" value={p.dateOfBirth ?? ""} max={todayISO()} onChange={(e) => set({ dateOfBirth: e.target.value })} />
            </Field>
            <Field label={tx("Sex", "লিঙ্গ")} hint={tx("Used only where validated estimation methods need it.", "শুধু যেখানে যাচাইকৃত পদ্ধতিতে প্রয়োজন।")}>
              <PillGroup label="Sex" value={p.sex} onChange={(v) => set({ sex: v })} options={[{ value: "female", label: tx("Female", "নারী") }, { value: "male", label: tx("Male", "পুরুষ") }]} />
            </Field>
            <Field label={tx("Language", "ভাষা")}>
              <PillGroup label="Language" value={language} onChange={(v) => updateSettings({ language: v })} options={[{ value: "en", label: "English" }, { value: "bn", label: "বাংলা" }]} />
            </Field>
          </StepIntro>
        )}

        {id === "body" && (
          <StepIntro title={tx("Height, weight and region", "উচ্চতা, ওজন ও অঞ্চল")} text={tx("We keep self-reported values separate from clinically measured ones.", "নিজে দেওয়া মাপ ও ক্লিনিকে মাপা মান আলাদা রাখা হয়।")}>
            <Segmented label="Units" value={p.units ?? "metric"} onChange={(v) => set({ units: v })} options={[{ value: "metric", label: "cm · kg" }, { value: "imperial", label: "ft/in · lb" }]} />
            {p.units === "imperial" ? (
              <div className="grid grid-cols-3 gap-3">
                <Field label="Height (ft)" htmlFor="hft">
                  <Input id="hft" type="number" inputMode="numeric" min={3} max={7} value={imperial.ft} onChange={(e) => setHeightImperial(e.target.value, imperial.inch)} />
                </Field>
                <Field label="(in)" htmlFor="hin">
                  <Input id="hin" type="number" inputMode="numeric" min={0} max={11} value={imperial.inch} onChange={(e) => setHeightImperial(imperial.ft, e.target.value)} />
                </Field>
                <Field label="Weight (lb)" htmlFor="wlb">
                  <Input id="wlb" type="number" inputMode="decimal" min={66} max={550} value={imperial.lb} onChange={(e) => setWeightImperial(e.target.value)} />
                </Field>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Field label={tx("Height (cm)", "উচ্চতা (সেমি)")} htmlFor="height">
                  <Input id="height" type="number" inputMode="decimal" min={100} max={230} value={p.heightCm ?? ""} onChange={(e) => set({ heightCm: Number(e.target.value) || undefined })} />
                </Field>
                <Field label={tx("Weight (kg)", "ওজন (কেজি)")} htmlFor="weight">
                  <Input id="weight" type="number" inputMode="decimal" min={30} max={250} value={p.weightKg ?? ""} onChange={(e) => set({ weightKg: Number(e.target.value) || undefined })} />
                </Field>
              </div>
            )}
            <Field label={tx("Where do these numbers come from?", "এই মাপ কোথা থেকে?")}>
              <PillGroup label="Measurement source" value={p.measurementSource} onChange={(v) => set({ measurementSource: v })} options={[{ value: "self_reported", label: tx("My own estimate or scale", "নিজের মাপ") }, { value: "clinical", label: tx("Measured at a clinic", "ক্লিনিকে মাপা") }]} />
            </Field>
            <Field label={tx("Region (optional)", "অঞ্চল (ঐচ্ছিক)")} hint={tx("Helps suggest foods available near you.", "কাছাকাছি পাওয়া যায় এমন খাবার সাজেস্ট করতে।")}>
              <PillGroup label="Region" value={p.region} onChange={(v) => set({ region: v })} options={REGIONS} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <StatTile label={tx("Country", "দেশ")} value="Bangladesh" />
              <StatTile label={tx("Time zone · currency", "সময় অঞ্চল · মুদ্রা")} value="Dhaka · BDT" />
            </div>
          </StepIntro>
        )}

        {id === "goal" && (
          <StepIntro title={tx("What's the main goal?", "মূল লক্ষ্য কী?")} text={tx("Pick the one that matters most right now.", "এখন যেটি সবচেয়ে গুরুত্বপূর্ণ সেটি বেছে নিন।")}>
            <PillGroup label="Main goal" value={p.goal} onChange={(v) => set({ goal: v })} options={GOALS.map((g) => ({ value: g.value, label: g.label }))} />
            {p.goal === "condition" && <p className="text-caption text-muted-foreground">{tx("We'll ask about health soon. Condition plans open only after clinical review.", "শীঘ্রই স্বাস্থ্য বিষয়ে জিজ্ঞেস করা হবে। রোগভিত্তিক পরিকল্পনা ক্লিনিক্যাল পর্যালোচনার পরেই চালু হয়।")}</p>}
            {p.goal === "lose_weight" && <p className="text-caption text-muted-foreground">{tx("We'll ask a couple of safety questions about this after the health section.", "স্বাস্থ্য অংশের পরে এ নিয়ে কয়েকটি নিরাপত্তা প্রশ্ন থাকবে।")}</p>}
            {p.goal === "infant_feeding" && (
              <InfoNote className={NOTE} title={tx("Baby feeding has its own setup", "শিশুর খাবারের আলাদা সেটআপ")}>
                <span className="block">{tx("Infant complementary feeding uses a separate, age-based workflow.", "শিশুর পরিপূরক খাবারের জন্য বয়সভিত্তিক আলাদা প্রক্রিয়া আছে।")}</span>
                <Button size="sm" variant="secondary" className="mt-2" onClick={() => { setWho("baby"); setC({ dateOfBirth: addDays(todayISO(), -213) }); set({ goal: "improve_nutrition" }); setStep(1) }}>
                  {tx("Set up a baby profile", "শিশুর প্রোফাইল তৈরি করুন")}
                </Button>
              </InfoNote>
            )}
            {p.goal === "family" && (
              <InfoNote className={NOTE} title={tx("Family meals", "পারিবারিক খাবার")}>
                {tx("We'll set up your own profile first. Family profiles and shared meals come with the Family plan; add members later from Profile → Family.", "আগে আপনার প্রোফাইল তৈরি হবে। পরিবারের প্রোফাইল ও একসাথে খাবার ফ্যামিলি প্ল্যানে; পরে প্রোফাইল → পরিবার থেকে যোগ করুন।")} <PhaseBadge phase={2} />
              </InfoNote>
            )}
          </StepIntro>
        )}

        {id === "work" && (
          <StepIntro title={tx("Work", "কাজ")} text={tx("Work changes how much energy is needed and when meals fit.", "কাজ অনুযায়ী শক্তির চাহিদা ও খাবারের সময় বদলায়।")}>
            <PillGroup label="Occupation" value={p.occupation} onChange={(v) => set({ occupation: v })} options={OCCUPATIONS} />
            <div className="grid grid-cols-2 gap-3">
              <Field label={tx("Work starts", "কাজ শুরু")} htmlFor="ws">
                <Input id="ws" type="time" value={p.workStart ?? ""} onChange={(e) => set({ workStart: e.target.value })} />
              </Field>
              <Field label={tx("Work ends", "কাজ শেষ")} htmlFor="we">
                <Input id="we" type="time" value={p.workEnd ?? ""} onChange={(e) => set({ workEnd: e.target.value })} />
              </Field>
            </div>
            <Field label={tx("Workdays per week", "সপ্তাহে কর্মদিবস")}>
              <PillGroup label="Workdays per week" value={String(work.daysPerWeek ?? 5)} onChange={(v) => setWork((w) => ({ ...w, daysPerWeek: Number(v) }))} options={["3", "4", "5", "6", "7"].map((v) => ({ value: v, label: v }))} />
            </Field>
          </StepIntro>
        )}

        {id === "work_details" && (
          <StepIntro title={tx("Your workday", "আপনার কর্মদিবস")} text={tx("Occupation alone doesn't tell us enough. Optional.", "শুধু পেশা থেকে যথেষ্ট বোঝা যায় না। ঐচ্ছিক।")}>
            <Field label={tx("How much of the day is spent sitting?", "দিনের কতটা সময় বসে কাটে?")}>
              <PillGroup label="Sitting" value={work.sitting} onChange={(v) => setWork((w) => ({ ...w, sitting: v }))} options={[{ value: "most", label: tx("Most of it", "বেশিরভাগ") }, { value: "half", label: tx("About half", "প্রায় অর্ধেক") }, { value: "little", label: tx("Mostly standing or walking", "বেশিরভাগ দাঁড়িয়ে/হেঁটে") }]} />
            </Field>
            <ToggleList>
              <Toggle label={tx("Lifting or strenuous work", "ভারী জিনিস তোলা বা পরিশ্রমের কাজ")} checked={!!work.lifting} onChange={(v) => setWork((w) => ({ ...w, lifting: v }))} />
              <Toggle label={tx("Outdoors or in hot conditions", "বাইরে বা গরম পরিবেশে")} checked={!!work.outdoorsOrHeat} onChange={(v) => setWork((w) => ({ ...w, outdoorsOrHeat: v }))} />
              <Toggle label={tx("Night shifts", "রাতের শিফট")} checked={!!work.nightShift} onChange={(v) => setWork((w) => ({ ...w, nightShift: v }))} />
            </ToggleList>
            {work.outdoorsOrHeat && <InfoNote className={NOTE}>{tx("We'll add water and hydration reminders around your work hours.", "কাজের সময় ঘিরে পানি পানের রিমাইন্ডার যোগ করা হবে।")}</InfoNote>}
          </StepIntro>
        )}

        {id === "activity" && (
          <StepIntro title={tx("Daily activity", "দৈনন্দিন সক্রিয়তা")} text={tx("A typical day, including work. Exercise is asked separately.", "কাজসহ সাধারণ একটি দিন। ব্যায়াম আলাদাভাবে জিজ্ঞেস করা হয়।")}>
            <div role="radiogroup" className="space-y-2">
              {ACTIVITY.map((a) => {
                const look = ACTIVITY_LOOK[a.value]
                return <ChoiceCard key={a.value} className={cn("min-h-0 py-2.5", TONE[look.tone])} selected={p.activity === a.value} onSelect={() => set({ activity: a.value })} icon={look.icon} title={a.label} description={a.description} />
              })}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={tx("Exercise days / week", "সপ্তাহে ব্যায়ামের দিন")} htmlFor="exd">
                <Input id="exd" type="number" inputMode="numeric" min={0} max={7} value={exercise.daysPerWeek} onChange={(e) => setExercise((x) => ({ ...x, daysPerWeek: Math.min(7, Math.max(0, Number(e.target.value) || 0)) }))} />
              </Field>
              <Field label={tx("Minutes per session", "প্রতিবার কত মিনিট")} htmlFor="exm">
                <Input id="exm" type="number" inputMode="numeric" min={0} max={240} step={5} value={exercise.minutesPerSession} onChange={(e) => setExercise((x) => ({ ...x, minutesPerSession: Math.max(0, Number(e.target.value) || 0) }))} />
              </Field>
            </div>
          </StepIntro>
        )}

        {id === "schedule" && (
          <StepIntro title={tx("Your day", "আপনার দিন")} text={tx("So meals and reminders land at realistic times. Optional.", "যাতে খাবার ও রিমাইন্ডার বাস্তবসম্মত সময়ে আসে। ঐচ্ছিক।")}>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["wake", tx("Wake up", "ঘুম থেকে ওঠা")],
                  ["sleep", tx("Sleep", "ঘুমাতে যাওয়া")],
                  ["breakfast", tx("Breakfast", "সকালের নাস্তা")],
                  ["lunch", tx("Lunch", "দুপুরের খাবার")],
                  ["dinner", tx("Dinner", "রাতের খাবার")],
                ] as const
              ).map(([k, label]) => (
                <Field key={k} label={label} htmlFor={`t-${k}`}>
                  <Input id={`t-${k}`} type="time" value={schedule[k] ?? ""} onChange={(e) => setSchedule((s) => ({ ...s, [k]: e.target.value }))} />
                </Field>
              ))}
            </div>
          </StepIntro>
        )}

        {id === "diet" && (
          <StepIntro title={tx("How do you like to eat?", "কীভাবে খেতে পছন্দ করেন?")} text={tx("Preferences shape the plan. Allergies come later and are treated as safety rules.", "পছন্দ অনুযায়ী পরিকল্পনা হয়। অ্যালার্জি পরে জিজ্ঞেস করা হবে এবং নিরাপত্তা নিয়ম হিসেবে ধরা হবে।")}>
            <ChipGroup label="Dietary preferences" value={p.diet ?? []} onChange={(v) => set({ diet: v })} options={DIETS} />
            <Field label={tx("Religious or cultural food rules (optional)", "ধর্মীয় বা সাংস্কৃতিক খাদ্য নিয়ম (ঐচ্ছিক)")} htmlFor="relig" hint={tx("For example: no beef, fasting during Ramadan.", "যেমন: গরুর মাংস নয়, রমজানে রোজা।")}>
              <Input id="relig" value={prefs.religious ?? ""} onChange={(e) => setPrefs((x) => ({ ...x, religious: e.target.value }))} />
            </Field>
            <InfoNote className={NOTE}>{tx("Preferences are flexible. If you can't eat something for a medical reason, record it as an allergy or condition.", "পছন্দ নমনীয়। চিকিৎসাজনিত কারণে কিছু খেতে না পারলে তা অ্যালার্জি বা রোগ হিসেবে লিখুন।")}</InfoNote>
          </StepIntro>
        )}

        {id === "food_likes" && (
          <StepIntro title={tx("Foods you know", "পরিচিত খাবার")} text={tx("Helps us pick meals you'll actually eat. Optional.", "যে খাবার আসলেই খাবেন তা বাছতে সাহায্য করে। ঐচ্ছিক।")}>
            <Segmented label="Food list" value={prefTab} onChange={setPrefTab} options={[{ value: "enjoyed", label: tx("Enjoy", "পছন্দ") }, { value: "disliked", label: tx("Dislike", "অপছন্দ") }, { value: "unavailable", label: tx("Can't get", "পাওয়া যায় না") }]} />
            <ChipGroup label={prefTab} value={prefs[prefTab]} onChange={(v) => setPrefs((x) => ({ ...x, [prefTab]: v }))} options={prefOptions} />
            <Field label={tx("Where do you usually eat?", "সাধারণত কোথায় খান?")}>
              <PillGroup label="Home cooked" value={prefs.homeCooked} onChange={(v) => setPrefs((x) => ({ ...x, homeCooked: v }))} options={[{ value: "mostly_home", label: tx("Mostly home-cooked", "বেশিরভাগ ঘরে রান্না") }, { value: "mixed", label: tx("A mix", "দুটোই") }, { value: "mostly_out", label: tx("Often eat out", "প্রায়ই বাইরে") }]} />
            </Field>
            <Field label={tx("Anything else? (optional)", "আর কিছু? (ঐচ্ছিক)")} htmlFor="pnotes">
              <Textarea id="pnotes" rows={2} value={prefs.notes ?? ""} onChange={(e) => setPrefs((x) => ({ ...x, notes: e.target.value }))} placeholder={tx("e.g. I prefer simple meals on weekdays", "যেমন: কর্মদিবসে সহজ খাবার পছন্দ")} />
            </Field>
          </StepIntro>
        )}

        {id === "health_consent" && (
          <StepIntro title={tx("Health information", "স্বাস্থ্য তথ্য")} text={tx("Only what's needed to keep the plan safe.", "শুধু পরিকল্পনা নিরাপদ রাখতে যা দরকার।")}>
            <ConsentCard
              icon={<HeartPulse className="size-5" />}
              tone="terracotta"
              title={tx("Allow NutriPlan to use health information", "NutriPlan-কে স্বাস্থ্য তথ্য ব্যবহারের অনুমতি দিন")}
              text={tx("We use allergies and conditions only to filter unsafe foods and decide when a professional should review a plan. Stored separately from the general profile. You can withdraw this any time in Privacy.", "অ্যালার্জি ও রোগের তথ্য শুধু অনিরাপদ খাবার বাদ দিতে এবং কখন পেশাদার পর্যালোচনা দরকার তা ঠিক করতে ব্যবহার হয়। যেকোনো সময় প্রত্যাহার করা যায়।")}
              checked={consents.health_data}
              onChange={(v) => toggleConsent("health_data", v)}
            />
            {consents.health_data ? (
              <WhyWeAsk>{tx("Health details let the nutrition engine exclude unsafe foods and route complex needs to professionals. We never diagnose a condition from your answers.", "স্বাস্থ্য তথ্য দিয়ে অনিরাপদ খাবার বাদ দেওয়া হয় এবং জটিল প্রয়োজন পেশাদারের কাছে পাঠানো হয়। আমরা কখনো রোগ নির্ণয় করি না।")}</WhyWeAsk>
            ) : (
              <div className="text-callout flex items-start gap-3 rounded-2xl bg-muted p-3.5 text-muted-foreground">
                <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
                {tx("Turn this on to record allergies and conditions. Without it we can't check meals against allergies, so a plan can't be created.", "অ্যালার্জি ও রোগ লিখতে এটি চালু করুন। এটি ছাড়া অ্যালার্জি যাচাই করা যায় না, তাই পরিকল্পনা তৈরি হবে না।")}
              </div>
            )}
          </StepIntro>
        )}

        {id === "allergies" && (
          <StepIntro title={tx("Food allergies", "খাবারে অ্যালার্জি")} text={tx("Allergies are hard safety rules across meals, snacks, swaps and shopping lists.", "অ্যালার্জি সব খাবার, স্ন্যাকস, বদল ও বাজারের তালিকায় কঠোর নিরাপত্তা নিয়ম।")}>
            <ChipGroup<Allergen> label="Food allergies" value={p.allergies ?? []} onChange={(v) => set({ allergies: v })} options={ALLERGENS} />
            {(p.allergies?.length ?? 0) === 0 && <p className="text-caption text-muted-foreground">{tx("No allergies? Just continue.", "অ্যালার্জি নেই? চালিয়ে যান।")}</p>}
          </StepIntro>
        )}

        {id === "conditions" && (
          <StepIntro title={tx("Health conditions", "স্বাস্থ্যগত অবস্থা")} text={tx("Diagnosed conditions only. Skip if none apply.", "শুধু নির্ণীত রোগ। প্রযোজ্য না হলে চালিয়ে যান।")}>
            <ChipGroup label="Conditions" value={(p.conditions ?? []).filter((c) => !CIRCUMSTANCE_IDS.includes(c))} onChange={(v) => set({ conditions: [...v, ...(p.conditions ?? []).filter((c) => CIRCUMSTANCE_IDS.includes(c))] })} options={CONDITION_OPTS} />
            {reviewNeeded.some((c) => !CIRCUMSTANCE_IDS.includes(c)) && <ReviewNote />}
            {p.goal === "condition" && <p className="text-caption text-muted-foreground">{tx("Specialized condition plans open only for conditions that have passed clinical review.", "বিশেষ রোগভিত্তিক পরিকল্পনা শুধু ক্লিনিক্যালি পর্যালোচিত রোগের জন্য।")}</p>}
          </StepIntro>
        )}

        {id === "circumstances" && (
          <StepIntro title={tx("Life stage and eating", "জীবনপর্যায় ও খাওয়া")} text={tx("Any of these change what's safe to plan. Skip if none apply.", "এগুলো নিরাপদ পরিকল্পনা বদলে দেয়। প্রযোজ্য না হলে চালিয়ে যান।")}>
            <ChipGroup label="Circumstances" value={(p.conditions ?? []).filter((c) => CIRCUMSTANCE_IDS.includes(c))} onChange={(v) => set({ conditions: [...(p.conditions ?? []).filter((c) => !CIRCUMSTANCE_IDS.includes(c)), ...v] })} options={CIRCUMSTANCE_OPTS} />
            {reviewNeeded.some((c) => CIRCUMSTANCE_IDS.includes(c)) && <ReviewNote />}
          </StepIntro>
        )}

        {id === "health_flags" && (
          <StepIntro title={tx("Anything else we should know?", "আর কিছু জানানো দরকার?")} text={tx("These help us decide when to keep the plan general.", "কখন পরিকল্পনা সাধারণ রাখতে হবে তা বুঝতে সাহায্য করে।")}>
            <ToggleList>
              <Toggle label={tx("I take medication that affects food or fluids", "খাবার বা তরলে প্রভাব ফেলে এমন ওষুধ খাই")} checked={flags.medications} onChange={(v) => setFlags((f) => ({ ...f, medications: v }))} />
              <Toggle label={tx("A clinician advised a specific diet", "চিকিৎসক নির্দিষ্ট খাদ্যাভ্যাসের পরামর্শ দিয়েছেন")} checked={flags.clinicianDiet} onChange={(v) => setFlags((f) => ({ ...f, clinicianDiet: v }))} />
              <Toggle label={tx("Recent unexplained weight change", "সম্প্রতি অব্যাখ্যাত ওজন পরিবর্তন")} checked={flags.weightChange} onChange={(v) => setFlags((f) => ({ ...f, weightChange: v }))} />
            </ToggleList>
            <Field label={tx("Deficiencies diagnosed by a clinician (if any)", "চিকিৎসক নির্ণীত ঘাটতি (যদি থাকে)")} hint={tx("Only what a test or clinician confirmed. We never infer a deficiency from meals.", "শুধু পরীক্ষা বা চিকিৎসক যা নিশ্চিত করেছেন।")}>
              <ChipGroup label="Diagnosed deficiencies" value={deficiencies} onChange={setDeficiencies} options={DEFICIENCIES} />
            </Field>
            {flags.medications && <InfoNote className={NOTE}>{tx("We never change medication or doses. Keep following your clinician's advice.", "আমরা কখনো ওষুধ বা ডোজ বদলাই না। চিকিৎসকের পরামর্শ মেনে চলুন।")}</InfoNote>}
            {flags.clinicianDiet && <InfoNote className={NOTE}>{tx("Your clinician's advice comes first. We'll keep suggestions general and easy to share with them.", "চিকিৎসকের পরামর্শই আগে। আমরা সাধারণ পরামর্শ দেব।")}</InfoNote>}
            {flags.weightChange && <CautionNote className={NOTE} title={tx("Worth checking with a doctor", "ডাক্তারের সাথে কথা বলা ভালো")}>{tx("We won't suggest calorie restriction.", "আমরা ক্যালরি কমানোর পরামর্শ দেব না।")}</CautionNote>}
          </StepIntro>
        )}

        {id === "weight_goal" && (
          <StepIntro title={tx("About weight loss", "ওজন কমানো প্রসঙ্গে")} text={tx("A couple of safety checks before we plan any calorie deficit.", "ক্যালরি ঘাটতির পরিকল্পনার আগে কয়েকটি নিরাপত্তা যাচাই।")}>
            <ToggleList>
              <Toggle label={tx("A clinician has advised against losing weight", "চিকিৎসক ওজন কমাতে নিষেধ করেছেন")} checked={noLossAdvice} onChange={setNoLossAdvice} />
            </ToggleList>
            {restrictionUnsafe ? (
              <CautionNote className={NOTE} title={tx("We'll focus on balanced, regular meals", "নিয়মিত, সুষম খাবারে মনোযোগ দেব")}>
                {tx("From what you've shared (pregnancy, breastfeeding, an eating disorder history, recent weight change, clinician advice or current measurements), a calorie deficit isn't safe to automate. A qualified professional can help with weight goals.", "আপনার দেওয়া তথ্য অনুযায়ী ক্যালরি ঘাটতি স্বয়ংক্রিয়ভাবে করা নিরাপদ নয়। একজন পেশাদার সাহায্য করতে পারবেন।")}
              </CautionNote>
            ) : (
              <Field label={tx("Preferred pace", "পছন্দের গতি")} hint={tx("Slower changes are easier to keep. You can change this any time.", "ধীর পরিবর্তন ধরে রাখা সহজ।")}>
                <div role="radiogroup" className="space-y-2">
                  <ChoiceCard className={DENSE} selected={pace === "gradual"} onSelect={() => setPace("gradual")} title={tx("Gradual", "ধীরে")} description={tx("Around 0.25 kg a week · a small, steady change", "সপ্তাহে প্রায় ০.২৫ কেজি")} />
                  <ChoiceCard className={DENSE} selected={pace === "steady"} onSelect={() => setPace("steady")} title={tx("Steady", "স্থির")} description={tx("Up to about 0.5 kg a week · never faster", "সপ্তাহে সর্বোচ্চ প্রায় ০.৫ কেজি")} />
                </div>
              </Field>
            )}
            <p className="text-caption text-muted-foreground">{tx("Plans never go below safe minimums, and a missed target never makes the plan stricter.", "পরিকল্পনা কখনো নিরাপদ সীমার নিচে যায় না।")}</p>
          </StepIntro>
        )}

        {id === "urgent" && (
          <StepIntro title={tx("How are you feeling right now?", "এই মুহূর্তে কেমন বোধ করছেন?")} text={tx("One safety check before we plan anything.", "পরিকল্পনার আগে একটি নিরাপত্তা যাচাই।")}>
            <ToggleList>
              <Toggle label={tx("Chest pain, severe breathlessness, fainting or a severe allergic reaction right now", "এখন বুকে ব্যথা, তীব্র শ্বাসকষ্ট, অজ্ঞান হওয়া বা তীব্র অ্যালার্জি")} checked={emergency} onChange={setEmergency} />
            </ToggleList>
            {emergency && (
              <SafetyAlert title={tx("Please get urgent help now", "এখনই জরুরি সাহায্য নিন")} emergency>
                {tx("These symptoms need immediate medical attention. In Bangladesh call 999. A meal plan can wait.", "এই লক্ষণগুলোর জন্য এখনই চিকিৎসা প্রয়োজন। বাংলাদেশে ৯৯৯-এ কল করুন।")}
              </SafetyAlert>
            )}
          </StepIntro>
        )}

        {id === "budget" && (
          <StepIntro title={tx("Food budget", "খাবারের বাজেট")} text={tx("We prioritize affordable local foods. Prices are estimates.", "সাশ্রয়ী স্থানীয় খাবারকে অগ্রাধিকার দেওয়া হয়। দাম আনুমানিক।")}>
            <div role="radiogroup" className="grid grid-cols-2 gap-2">
              {BUDGETS.map((b) => (
                <ChoiceCard key={b.value} className="min-h-0 px-3 py-2.5" selected={budget.period === "week" && budget.amountBdt === b.value} onSelect={() => setBudget((x) => ({ ...x, period: "week", amountBdt: b.value }))} title={<span className="text-callout font-semibold">{tx(b.label, b.bn)}</span>} description={b.description} />
              ))}
            </div>
            <div className="grid grid-cols-[1fr_auto] items-end gap-3">
              <Field label={tx("Amount (৳)", "পরিমাণ (৳)")} htmlFor="budget">
                <Input id="budget" type="number" inputMode="numeric" min={50} step={50} value={budget.amountBdt || ""} onChange={(e) => setBudget((x) => ({ ...x, amountBdt: Number(e.target.value) || 0 }))} />
              </Field>
              <PillGroup label="Budget period" value={budget.period} onChange={(v) => setBudget((x) => ({ ...x, period: v }))} options={[{ value: "day", label: tx("Day", "দিন") }, { value: "week", label: tx("Week", "সপ্তাহ") }, { value: "month", label: tx("Month", "মাস") }]} />
            </div>
            <PillGroup label="Budget scope" value={budget.scope} onChange={(v) => setBudget((x) => ({ ...x, scope: v }))} options={[{ value: "personal", label: tx("Just me", "শুধু আমার") }, { value: "household", label: tx("Whole household", "পুরো পরিবার") }]} />
            <PillGroup label="Budget includes" value={budget.includes} onChange={(v) => setBudget((x) => ({ ...x, includes: v }))} options={[{ value: "groceries", label: tx("Groceries only", "শুধু বাজার") }, { value: "groceries_and_eating_out", label: tx("Incl. eating out", "বাইরের খাবারসহ") }]} />
            <InfoNote className={NOTE}>{tx("A low budget never makes a plan nutritionally inadequate. If a plan can't meet minimums within budget, we'll say so.", "কম বাজেটে কখনো পুষ্টির ঘাটতি রাখা হয় না। বাজেটে সম্ভব না হলে জানানো হবে।")}</InfoNote>
          </StepIntro>
        )}

        {id === "cooking" && (
          <StepIntro title={tx("Cooking and meals", "রান্না ও খাবার")} text={tx("So recipes fit real life.", "যাতে রেসিপি বাস্তব জীবনের সাথে মানায়।")}>
            <Field label={tx("Who usually cooks?", "সাধারণত কে রান্না করেন?")}>
              <PillGroup label="Who cooks" value={cooking.whoCooks} onChange={(v) => setCooking((c) => ({ ...c, whoCooks: v }))} options={[{ value: "self", label: tx("I cook", "আমি রান্না করি") }, { value: "someone_else", label: tx("Someone else cooks for me", "অন্য কেউ রান্না করেন") }, { value: "shared", label: tx("Shared", "মিলেমিশে") }]} />
            </Field>
            <Field label={tx("Time per meal", "প্রতি বেলায় সময়")}>
              <PillGroup label="Time per meal" value={String(p.maxPrepMinutes)} onChange={(v) => set({ maxPrepMinutes: Number(v) })} options={PREP.map((x) => ({ value: String(x.value), label: x.label }))} />
            </Field>
            <Field label={tx("Meals per day", "দিনে কয় বেলা")}>
              <PillGroup label="Meals per day" value={String(p.mealsPerDay)} onChange={(v) => set({ mealsPerDay: Number(v) })} options={["3", "4", "5"].map((v) => ({ value: v, label: `${v} meals` }))} />
            </Field>
            <ToggleList>
              <Toggle label={tx("Include snacks", "স্ন্যাকস রাখুন")} checked={!!p.includeSnacks} onChange={(v) => set({ includeSnacks: v })} />
            </ToggleList>
            {cooking.whoCooks === "someone_else" && <InfoNote className={NOTE}>{tx("We'll keep recipes easy to share with whoever cooks.", "যিনি রান্না করেন তার সাথে সহজে শেয়ার করা যায় এমন রেসিপি দেব।")}</InfoNote>}
          </StepIntro>
        )}

        {id === "kitchen" && (
          <StepIntro title={tx("Kitchen and routine", "রান্নাঘর ও রুটিন")} text={tx("Select everything that applies. Optional.", "যা প্রযোজ্য সব বেছে নিন। ঐচ্ছিক।")}>
            <ChipGroup label="Equipment" value={cooking.equipment} onChange={(v) => setCooking((c) => ({ ...c, equipment: v }))} options={EQUIPMENT} />
            <ToggleList>
              <Toggle label={tx("I can batch-cook", "একসাথে বেশি রান্না করতে পারি")} checked={cooking.batchCook} onChange={(v) => setCooking((c) => ({ ...c, batchCook: v }))} />
              <Toggle label={tx("I carry food to work", "কাজে খাবার নিয়ে যাই")} checked={cooking.carriesFoodToWork} onChange={(v) => setCooking((c) => ({ ...c, carriesFoodToWork: v }))} />
            </ToggleList>
            {!cooking.equipment.includes("fridge") && <InfoNote className={NOTE}>{tx("No fridge: we'll avoid recipes that need cooked food stored for later.", "ফ্রিজ নেই: রান্না করা খাবার রেখে দিতে হয় এমন রেসিপি এড়ানো হবে।")}</InfoNote>}
          </StepIntro>
        )}

        {id === "child_consent" && (
          <StepIntro title={tx(`About ${whoLabel}`, `${whoLabel} সম্পর্কে`)} text={tx("You'll manage this profile as their parent or caregiver.", "আপনি অভিভাবক হিসেবে এই প্রোফাইল পরিচালনা করবেন।")}>
            <ConsentCard
              icon={<Baby className="size-5" />}
              tone="sky"
              title={tx("Allow NutriPlan to store your child's information", "আপনার সন্তানের তথ্য রাখার অনুমতি দিন")}
              text={tx("Age, feeding, growth records and food reactions are used only for age-appropriate, safe suggestions. Other household members can't see this without your permission. You can delete it at any time.", "বয়স, খাওয়ানো, বৃদ্ধি ও খাবারে প্রতিক্রিয়ার তথ্য শুধু বয়স-উপযোগী নিরাপদ পরামর্শের জন্য। যেকোনো সময় মুছে ফেলা যায়।")}
              checked={consents.child_data}
              onChange={(v) => toggleConsent("child_data", v)}
            />
            <ConsentCard
              icon={<HeartPulse className="size-5" />}
              tone="terracotta"
              title={tx("Allow health information (allergies, conditions)", "স্বাস্থ্য তথ্যের অনুমতি (অ্যালার্জি, রোগ)")}
              text={tx("Used to exclude unsafe foods. Optional, but recommended.", "অনিরাপদ খাবার বাদ দিতে ব্যবহৃত। ঐচ্ছিক, তবে সুপারিশকৃত।")}
              checked={consents.health_data}
              onChange={(v) => toggleConsent("health_data", v)}
            />
          </StepIntro>
        )}

        {id === "child_basics" && (
          <StepIntro title={who === "baby" ? tx("Your baby", "আপনার শিশু") : tx("Your child", "আপনার সন্তান")} text={tx("Age matters most. We use age-appropriate references, never adult equations.", "বয়সই সবচেয়ে গুরুত্বপূর্ণ। প্রাপ্তবয়স্কদের সূত্র কখনো ব্যবহার হয় না।")}>
            <Field label={tx("Name or nickname", "নাম বা ডাকনাম")} htmlFor="cname">
              <Input id="cname" value={child.name ?? ""} onChange={(e) => setC({ name: e.target.value })} />
            </Field>
            <Field label={tx("Date of birth", "জন্মতারিখ")} htmlFor="cdob">
              <Input id="cdob" type="date" value={child.dateOfBirth ?? ""} max={todayISO()} onChange={(e) => setC({ dateOfBirth: e.target.value })} />
            </Field>
            <ToggleList>
              <Toggle label={tx("Born early (before 37 weeks)", "নির্ধারিত সময়ের আগে জন্ম (৩৭ সপ্তাহের আগে)")} checked={!!ci.premature} onChange={(v) => setCI({ premature: v })} />
            </ToggleList>
            {ci.premature && (
              <Field label={tx("Weeks of pregnancy at birth", "জন্মের সময় গর্ভকাল (সপ্তাহ)")} htmlFor="gw" hint={correctedMonths !== childMonths ? tx(`Corrected age about ${correctedMonths} months. Ask your clinician which age to use for milestones and solids.`, `সংশোধিত বয়স প্রায় ${correctedMonths} মাস।`) : undefined}>
                <Input id="gw" type="number" inputMode="numeric" min={22} max={36} value={ci.gestationWeeks ?? ""} onChange={(e) => setCI({ gestationWeeks: Number(e.target.value) || undefined })} />
              </Field>
            )}
            {who === "baby" && correctedMonths < 6 && (
              <InfoNote className={NOTE} title={tx("Under 6 months", "৬ মাসের কম")}>
                {tx("Breast milk or infant formula provides what your baby needs until about 6 months. Food suggestions start then — talk to your health worker about readiness signs.", "প্রায় ৬ মাস পর্যন্ত বুকের দুধ বা ফর্মুলাই যথেষ্ট। তখন থেকে খাবারের পরামর্শ শুরু হবে।")}
              </InfoNote>
            )}
            {childMonths >= 12 && who === "baby" && <InfoNote className={NOTE}>{tx("Your child is over 12 months — we'll use toddler guidance.", "আপনার সন্তান ১২ মাসের বেশি — শিশুর নির্দেশনা ব্যবহার হবে।")}</InfoNote>}
          </StepIntro>
        )}

        {id === "child_details" && (
          <StepIntro title={tx(`More about ${child.name?.trim() || whoLabel}`, `${child.name?.trim() || whoLabel} সম্পর্কে আরও`)} text={tx("Weight and length are optional and help with growth tracking.", "ওজন ও দৈর্ঘ্য ঐচ্ছিক, বৃদ্ধি অনুসরণে সাহায্য করে।")}>
            <Field label={tx("Sex", "লিঙ্গ")}>
              <PillGroup label="Sex" value={child.sex} onChange={(v) => setC({ sex: v })} options={[{ value: "female", label: tx("Girl", "মেয়ে") }, { value: "male", label: tx("Boy", "ছেলে") }]} />
            </Field>
            {who === "baby" && (
              <Field label={tx("Milk feeding", "দুধ খাওয়ানো")}>
                <PillGroup label="Milk feeding" value={child.feeding} onChange={(v) => setC({ feeding: v })} options={[{ value: "breastfeeding", label: tx("Breast milk", "বুকের দুধ") }, { value: "formula", label: tx("Formula", "ফর্মুলা") }, { value: "both", label: tx("Both", "দুটোই") }]} />
              </Field>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label={tx("Weight (kg)", "ওজন (কেজি)")} htmlFor="cw" hint={tx("Optional", "ঐচ্ছিক")}>
                <Input id="cw" type="number" inputMode="decimal" step="0.1" value={child.weightKg ?? ""} onChange={(e) => setC({ weightKg: Number(e.target.value) || undefined })} />
              </Field>
              <Field label={tx("Length/height (cm)", "দৈর্ঘ্য (সেমি)")} htmlFor="ch" hint={tx("Optional", "ঐচ্ছিক")}>
                <Input id="ch" type="number" inputMode="decimal" value={child.heightCm ?? ""} onChange={(e) => setC({ heightCm: Number(e.target.value) || undefined })} />
              </Field>
            </div>
            {(child.weightKg || child.heightCm) && (
              <Field label={tx("Where was this measured?", "কোথায় মাপা হয়েছে?")}>
                <PillGroup label="Measurement source" value={child.measurementSource} onChange={(v) => setC({ measurementSource: v })} options={[{ value: "self_reported", label: tx("At home", "বাড়িতে") }, { value: "clinical", label: tx("At a clinic", "ক্লিনিকে") }]} />
              </Field>
            )}
          </StepIntro>
        )}

        {id === "child_readiness" && (
          <StepIntro title={tx("Readiness for solids", "শক্ত খাবারের প্রস্তুতি")} text={tx("Which of these do you notice? Optional — your health worker can help.", "এর কোনগুলো লক্ষ্য করেন? ঐচ্ছিক।")}>
            <ChipGroup label="Readiness signs" value={ci.readinessSigns ?? []} onChange={(v) => setCI({ readinessSigns: v })} options={READINESS_SIGNS} />
            {(ci.readinessSigns?.length ?? 0) < 3 ? (
              <InfoNote className={NOTE}>{tx("Most babies show several of these around 6 months. If you're unsure, we'll keep to milk feeds and simple first tastes, and suggest asking your health worker.", "বেশিরভাগ শিশু ৬ মাসের কাছাকাছি এগুলোর কয়েকটি দেখায়। নিশ্চিত না হলে স্বাস্থ্যকর্মীর পরামর্শ নিন।")}</InfoNote>
            ) : (
              <InfoNote className={NOTE}>{tx("Sounds like good signs. We'll start with smooth textures and move on as your baby is ready.", "ভালো লক্ষণ। মসৃণ খাবার দিয়ে শুরু হবে।")}</InfoNote>
            )}
          </StepIntro>
        )}

        {id === "child_health" && (
          <StepIntro title={tx("Allergies and health", "অ্যালার্জি ও স্বাস্থ্য")} text={tx("We'll exclude allergens everywhere, including swaps and shopping lists.", "সব জায়গায় অ্যালার্জেন বাদ দেওয়া হবে।")}>
            {consents.health_data ? (
              <>
                <Field label={tx("Known food allergies", "জানা খাদ্য অ্যালার্জি")}>
                  <ChipGroup<Allergen> label="Known food allergies" value={child.allergies ?? []} onChange={(v) => setC({ allergies: v })} options={ALLERGENS} />
                </Field>
                <Field label={tx("Diagnosed conditions", "নির্ণীত রোগ")}>
                  <ChipGroup label="Child conditions" value={ci.conditions ?? []} onChange={(v) => setCI({ conditions: v })} options={CHILD_CONDITIONS} />
                </Field>
                <Field label={tx("Feeding difficulties", "খাওয়ানোর সমস্যা")}>
                  <ChipGroup label="Feeding difficulties" value={ci.feedingDifficulties ?? []} onChange={(v) => setCI({ feedingDifficulties: v })} options={FEEDING_DIFFICULTIES} />
                </Field>
                {((ci.conditions?.length ?? 0) > 0 || (ci.feedingDifficulties?.length ?? 0) > 0) && (
                  <CautionNote className={NOTE} title={tx("Let's involve your clinician", "চিকিৎসকের পরামর্শ নিন")}>
                    {tx("Suggestions stay general and clinically reviewed. A health professional should guide feeding plans for these.", "পরামর্শ সাধারণ থাকবে। এগুলোর জন্য পেশাদারের নির্দেশনা প্রয়োজন।")}
                  </CautionNote>
                )}
              </>
            ) : (
              <InfoNote className={NOTE}>{tx("You skipped health permission, so we can't record allergies or conditions. You can turn it on later in Privacy.", "স্বাস্থ্য অনুমতি দেননি, তাই অ্যালার্জি বা রোগ লেখা যাবে না। পরে প্রাইভেসি থেকে চালু করতে পারবেন।")}</InfoNote>
            )}
          </StepIntro>
        )}

        {id === "child_reactions" && (
          <StepIntro title={tx("Food reactions and advice", "খাবারে প্রতিক্রিয়া ও পরামর্শ")} text={tx("Helps us keep new foods safe.", "নতুন খাবার নিরাপদ রাখতে সাহায্য করে।")}>
            {consents.health_data && (
              <>
                <ToggleList>
                  <Toggle label={tx("Has had a reaction to a food (rash, vomiting, swelling)", "কোনো খাবারে প্রতিক্রিয়া হয়েছে (র‍্যাশ, বমি, ফোলা)")} checked={!!ci.pastReaction} onChange={(v) => setCI({ pastReaction: v })} />
                </ToggleList>
                {ci.pastReaction && (
                  <>
                    <Field label={tx("Which food, and what happened? (optional)", "কোন খাবার, কী হয়েছিল? (ঐচ্ছিক)")} htmlFor="react">
                      <Input id="react" value={ci.pastReactionNote ?? ""} onChange={(e) => setCI({ pastReactionNote: e.target.value })} />
                    </Field>
                    <CautionNote className={NOTE} title={tx("Talk to a health professional first", "আগে স্বাস্থ্য পেশাদারের সাথে কথা বলুন")}>
                      {tx("Ask your doctor before introducing common allergens. We'll keep allergen introductions out of suggestions until then.", "সাধারণ অ্যালার্জেন দেওয়ার আগে ডাক্তারকে জিজ্ঞেস করুন। ততদিন এগুলো পরামর্শে থাকবে না।")}
                    </CautionNote>
                  </>
                )}
                <Field label={tx("Foods a clinician told you to avoid (optional)", "চিকিৎসক যে খাবার এড়াতে বলেছেন (ঐচ্ছিক)")} htmlFor="crest">
                  <Input id="crest" value={ci.clinicianRestrictions ?? ""} onChange={(e) => setCI({ clinicianRestrictions: e.target.value })} />
                </Field>
              </>
            )}
            <SafetyAlert className={NOTE} title={tx("Always on for babies", "শিশুদের জন্য সবসময় চালু")}>{tx("Honey before 12 months, whole nuts, and hard round foods are never suggested. Textures follow your baby's age and readiness.", "১২ মাসের আগে মধু, আস্ত বাদাম ও শক্ত গোল খাবার কখনো পরামর্শ দেওয়া হয় না।")}</SafetyAlert>
          </StepIntro>
        )}

        {id === "child_history" && (
          <StepIntro title={tx("Foods already tried", "যে খাবার আগে দেওয়া হয়েছে")} text={tx("They go into the introduction tracker. Optional.", "এগুলো খাবার পরিচিতি ট্র্যাকারে যাবে। ঐচ্ছিক।")}>
            <ChipGroup label="Foods already introduced" value={ci.foodsIntroduced ?? []} onChange={(v) => setCI({ foodsIntroduced: v })} options={FIRST_FOODS} />
            <p className="text-caption text-muted-foreground">{tx("You can add how each one went later.", "প্রতিটি কেমন গেল পরে যোগ করতে পারবেন।")}</p>
          </StepIntro>
        )}

        {id === "review" && (
          <StepIntro title={adultFlow ? tx("Nutrition profile", "পুষ্টি প্রোফাইল") : tx("How we'll support you", "আমরা কীভাবে সাহায্য করব")} text={adultFlow ? tx("Where the plan starts. These are ranges, not exact numbers.", "পরিকল্পনার শুরু। এগুলো পরিসর, নির্দিষ্ট সংখ্যা নয়।") : undefined}>
            {adultFlow ? (
              <>
                <TargetsCard profile={{ ...(p as Profile), id: "draft", relation: "self", name: theirs ?? user.name, avatarColor: "forest", diet: p.diet ?? [], allergies: p.allergies ?? [], conditions: p.conditions ?? [], goal: effectiveGoal }} />
                <p className="text-caption text-muted-foreground">{p.measurementSource === "clinical" ? tx("Based on clinically measured height and weight.", "ক্লিনিকে মাপা উচ্চতা ও ওজনের ভিত্তিতে।") : tx("Based on self-reported height and weight.", "নিজে দেওয়া উচ্চতা ও ওজনের ভিত্তিতে।")}</p>
              </>
            ) : (
              <Surface tone="lime" padding="lg" className="relative space-y-3 overflow-hidden">
                <span className="absolute -top-8 -right-8 size-32 rounded-full bg-white/25" aria-hidden />
                <div className="relative flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- static prototype asset */}
                  <img src={who === "baby" ? RECIPE_PHOTO.r_inf_banana : RECIPE_PHOTO.r_khichuri} alt="" className="size-16 shrink-0 rounded-full object-cover ring-4 ring-white/70" />
                  <div className="min-w-0">
                    <p className="text-title truncate">{child.name || tx("Your child", "আপনার সন্তান")}</p>
                    <p className="text-caption text-charcoal/75">
                      {childMonths < 24 ? `${childMonths} months old` : `${Math.floor(childMonths / 12)} years old`}
                      {weeksEarly > 0 && childMonths < 24 ? ` · corrected ~${correctedMonths} months` : ""}
                    </p>
                  </div>
                </div>
                <ul className="text-callout relative space-y-2.5">
                  <li className="flex gap-2"><Clock className="mt-0.5 size-4 shrink-0" />{tx("Textures, new foods and milestones — not calories", "টেক্সচার, নতুন খাবার ও মাইলফলক — ক্যালরি নয়")}</li>
                  <li className="flex gap-2"><Smile className="mt-0.5 size-4 shrink-0" />{tx("Responsive feeding: follow your child's hunger and fullness cues", "শিশুর ক্ষুধা ও তৃপ্তির সংকেত অনুসরণ করুন")}</li>
                  <li className="flex gap-2"><Baby className="mt-0.5 size-4 shrink-0" />{tx("Baby food suggestions are clinically gated and use reviewed recipes only", "শুধু পর্যালোচিত রেসিপি ব্যবহার হয়")}</li>
                </ul>
              </Surface>
            )}
          </StepIntro>
        )}

        {id === "safeguards" && (
          <StepIntro title={tx("How we'll keep it safe", "কীভাবে নিরাপদ রাখব")} text={tx("These rules apply to every plan, swap and shopping list.", "এই নিয়ম প্রতিটি পরিকল্পনা, বদল ও বাজারের তালিকায় প্রযোজ্য।")}>
            <ul className="space-y-2">
              {(p.allergies?.length ?? 0) > 0 ? (
                <RuleRow tone="safety" icon={<ShieldAlert />} title={tx("Allergy protection on", "অ্যালার্জি সুরক্ষা চালু")}>
                  Excluding {p.allergies!.map((a) => ALLERGENS.find((x) => x.value === a)?.label).join(", ")} from every meal, snack, swap and shopping list.
                </RuleRow>
              ) : (
                <RuleRow tone="info" icon={<ShieldAlert />} title={tx("No allergies recorded", "কোনো অ্যালার্জি নেই")}>
                  {tx("Add them any time in the profile.", "যেকোনো সময় প্রোফাইলে যোগ করুন।")}
                </RuleRow>
              )}
              {restrictionUnsafe && p.goal === "lose_weight" && (
                <RuleRow tone="caution" icon={<HeartPulse />} title={tx("No calorie deficit for now", "এখন ক্যালরি ঘাটতি নয়")}>
                  {tx("The plan focuses on balanced, regular meals, not weight loss.", "পরিকল্পনা সুষম, নিয়মিত খাবারে মনোযোগ দেবে।")}
                </RuleRow>
              )}
              {reviewNeeded.length > 0 && (
                <RuleRow tone="caution" icon={<Stethoscope />} title={tx("Professional review needed", "পেশাদার পর্যালোচনা প্রয়োজন")}>
                  {tx("General healthy-eating guidance only. A specialized plan needs a qualified professional.", "শুধু সাধারণ স্বাস্থ্যকর খাবারের নির্দেশনা।")}
                </RuleRow>
              )}
              <RuleRow tone="info" icon={<ShieldCheck />} title={tx("Reviewed recipes only", "শুধু পর্যালোচিত রেসিপি")}>
                {tx("Every meal is checked against food-safety rules.", "প্রতিটি খাবার খাদ্য-নিরাপত্তা নিয়মে যাচাই হয়।")}
              </RuleRow>
            </ul>
          </StepIntro>
        )}

        {id === "permissions" && (
          <StepIntro title={tx("Optional permissions", "ঐচ্ছিক অনুমতি")} text={tx("Change these any time in Privacy.", "যেকোনো সময় প্রাইভেসি থেকে বদলাতে পারবেন।")}>
            <div className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-card shadow-card">
              <ConsentCard compact title={tx("Food photos", "খাবারের ছবি")} text={tx("Store meal photos privately to log what you eat. No public links. Delete any time.", "খাবারের ছবি গোপনে রাখা হয়। কোনো পাবলিক লিংক নেই।")} checked={consents.food_photos} onChange={(v) => toggleConsent("food_photos", v)} />
              <ConsentCard compact title={tx("AI processing", "এআই প্রসেসিং")} text={tx("Send de-identified meal descriptions and photos to our AI provider to suggest foods. Manual logging always works without it.", "পরিচয়হীন খাবারের বিবরণ ও ছবি এআই সেবায় পাঠানো হয়। এটি ছাড়াও নিজে লগ করা যায়।")} checked={consents.ai_processing} onChange={(v) => toggleConsent("ai_processing", v)} />
              <ConsentCard compact title={tx("Product analytics", "অ্যানালিটিক্স")} text={tx("Anonymous usage data to improve NutriPlan.", "NutriPlan উন্নত করতে বেনামি ব্যবহার তথ্য।")} checked={consents.analytics} onChange={(v) => toggleConsent("analytics", v)} />
            </div>
          </StepIntro>
        )}
      </div>

      <StickyFooter>
        {SKIPPABLE.includes(id) && (
          <Button variant="outline" className="w-full" onClick={skip}>
            {tx("Skip for now", "এখন বাদ দিন")}
          </Button>
        )}
        <Button size="lg" className="w-full" disabled={!canNext} onClick={next}>
          {id === "permissions" ? (adultFlow ? tx("Set up my first plan", "প্রথম পরিকল্পনা তৈরি করুন") : tx("Start", "শুরু করুন")) : tx("Continue", "চালিয়ে যান")}
        </Button>
        {id === "permissions" && <p className="text-caption text-center text-muted-foreground">{tx("Estimates support healthy eating and don't replace medical advice.", "অনুমান স্বাস্থ্যকর খাবারে সহায়তা করে, চিকিৎসা পরামর্শের বিকল্প নয়।")}</p>}
      </StickyFooter>
    </main>
  )
}

function hoursBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)
  let mins = eh * 60 + em - (sh * 60 + sm)
  if (mins <= 0) mins += 24 * 60 // overnight shift
  return Math.round((mins / 60) * 10) / 10
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
  const tx = useTx()
  return (
    <CautionNote className={NOTE} title={tx("Professional review needed", "পেশাদার পর্যালোচনা প্রয়োজন")}>
      {tx("We'll give general healthy-eating guidance only. A specialized plan needs a qualified professional, and we won't calculate restrictive targets.", "শুধু সাধারণ নির্দেশনা দেওয়া হবে। বিশেষ পরিকল্পনার জন্য যোগ্য পেশাদার প্রয়োজন।")}
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
