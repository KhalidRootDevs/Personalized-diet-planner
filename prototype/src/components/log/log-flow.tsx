"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { Barcode, Bookmark, Camera, CircleCheck, EyeOff, ImageUp, Keyboard, Loader2, Lock, Mic, Search, ShieldCheck, SkipForward, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PhaseBadge } from "@/components/app/badges"
import { InfoNote } from "@/components/app/alerts"
import { RecipeThumb } from "@/components/app/recipe-thumb"
import { FlowHeader, IconTile, ListGroup, ListRow, StickyFooter, Surface } from "@/components/app/page"
import { BarcodeStep, SavedStep, SearchStep, TextStep, VoiceStep } from "@/components/log/input-steps"
import { ReviewStep, TEXTURES, type ChildInfo, type Oil } from "@/components/log/review-step"
import { ResultStep } from "@/components/log/result-step"
import { useApp, useActivePlan, useActiveProfile } from "@/lib/store"
import { MEAL_LABEL } from "@/lib/planning"
import { nowHHMM, todayISO, uid } from "@/lib/date"
import { analyzePhoto } from "@/lib/vision-mock"
import { suggestMealType } from "@/lib/area-b-text"
import { entryTitle, itemFromFood, itemsFromRecipe } from "@/lib/area-b-log"
import { useRecipeLookup } from "@/lib/area-c-utils"
import { cn } from "@/lib/utils"
import type { JournalEntry, JournalItem, MealType, SavedMeal } from "@/lib/types"

type Step = "method" | "consent" | "analyzing" | "search" | "text" | "voice" | "barcode" | "saved" | "review" | "result"

const TITLES: Record<Step, string> = {
  method: "Log a meal",
  consent: "Photo privacy",
  analyzing: "Looking at your photo",
  search: "Search foods",
  text: "Describe your meal",
  voice: "Say what you ate",
  barcode: "Scan a barcode",
  saved: "Saved meals",
  review: "Confirm your meal",
  result: "Saved",
}

// Step indicator (UI-SPEC §5.2): choose an input → confirm → done.
const PHASE: Record<Step, number> = { method: 1, consent: 1, analyzing: 1, search: 1, text: 1, voice: 1, barcode: 1, saved: 1, review: 2, result: 3 }

const PICKABLE: MealType[] = ["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner", "evening_snack", "drinks"]

/**
 * Unified logging flow (§41.2, §42.3). Every input method produces the same structured entry
 * and goes through the same confirmation and deterministic calculation.
 */
export function LogFlow() {
  const router = useRouter()
  const params = useSearchParams()
  const profile = useActiveProfile()
  const plan = useActivePlan()
  const consents = useApp((s) => s.consents)
  const setConsent = useApp((s) => s.setConsent)
  const lookup = useRecipeLookup()
  const today = todayISO()
  const isChild = !!profile && profile.type !== "adult"

  const paramMeal = plan?.meals.find((m) => m.id === params.get("meal"))
  const openMeals = useMemo(
    () => (isChild ? [] : (plan?.meals ?? []).filter((m) => (m.date === today && !m.outcome) || m.id === paramMeal?.id).sort((a, b) => a.time.localeCompare(b.time))),
    [plan, today, isChild, paramMeal?.id],
  )

  const [step, setStep] = useState<Step>("method")
  const [history, setHistory] = useState<Step[]>([])
  const [mealType, setMealType] = useState<MealType>(paramMeal?.mealType ?? suggestMealType())
  const [items, setItems] = useState<JournalItem[]>([])
  const [source, setSource] = useState<JournalEntry["source"]>("manual")
  const [photoUrl, setPhotoUrl] = useState<string>()
  const [hasPhoto, setHasPhoto] = useState(false)
  const [oil, setOil] = useState<Oil | "unsure">()
  const [sugar, setSugar] = useState<boolean>()
  const [linkedChoice, setLinkedMealId] = useState<string>()
  const [time, setTime] = useState(paramMeal && paramMeal.date === today && paramMeal.time < nowHHMM() ? paramMeal.time : nowHHMM())
  const [saveAsUsual, setSaveAsUsual] = useState(false)
  const [savedMealId, setSavedMealId] = useState<string>()
  const [plannedSnapshot, setPlannedSnapshot] = useState<string>()
  const [child, setChild] = useState<ChildInfo>({ texture: TEXTURES[1], accepted: "yes", reaction: "None observed", firstTime: false })
  const [entryId, setEntryId] = useState<string>()
  const fileRef = useRef<HTMLInputElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const afterConsent = useRef<"file" | "sample">("file")

  useEffect(() => () => window.clearTimeout(timer.current), [])

  // Default the plan link to the open planned meal of the chosen type (§41.5).
  const linkedMealId = linkedChoice ?? paramMeal?.id ?? openMeals.find((m) => m.mealType === mealType)?.id ?? "none"

  if (!profile) return null
  const photoConsent = consents.find((c) => c.type === "food_photos")?.granted
  const linkedMeal = openMeals.find((m) => m.id === linkedMealId)
  const plannedRecipe = linkedMeal ? lookup(linkedMeal.recipeId) : undefined

  const go = (next: Step) => {
    setHistory((h) => [...h, step])
    setStep(next)
  }
  const back = () => {
    window.clearTimeout(timer.current)
    const prev = history[history.length - 1]
    if (!prev) return router.back()
    setHistory((h) => h.slice(0, -1))
    setStep(prev)
  }

  const startPhoto = (url?: string, replace?: boolean) => {
    setPhotoUrl(url)
    setHasPhoto(true)
    setSource("photo")
    setOil(undefined)
    setSugar(undefined)
    if (replace) setStep("analyzing")
    else go("analyzing")
    timer.current = window.setTimeout(() => {
      setItems(analyzePhoto(mealType))
      setStep("review")
    }, 1600)
  }
  const choosePhoto = (sample?: boolean) => {
    afterConsent.current = sample ? "sample" : "file"
    if (!photoConsent) return go("consent")
    if (sample) startPhoto()
    else fileRef.current?.click()
  }

  const eatAsPlanned = () => {
    if (!linkedMeal || !plannedRecipe) return
    const list = itemsFromRecipe(plannedRecipe, linkedMeal.servings).map((i) => ({ ...i, confirmedByUser: true }))
    setItems(list)
    setPlannedSnapshot(JSON.stringify(list.map((i) => [i.foodId, i.grams])))
    setSource("planned")
    setHasPhoto(false)
    setMealType(linkedMeal.mealType)
    go("review")
  }

  const skipPlanned = () => {
    if (!linkedMeal) return
    const prev = linkedMeal.outcome
    useApp.getState().setMealOutcome(linkedMeal.id, "skipped")
    toast(`${MEAL_LABEL[linkedMeal.mealType]} marked as skipped`, { description: "Your plan stays the same.", action: { label: "Undo", onClick: () => useApp.getState().setMealOutcome(linkedMeal.id, prev) } })
    router.push("/home")
  }

  const pickSaved = (m: SavedMeal) => {
    setItems(m.items.map((i) => ({ ...itemFromFood(i.foodId, i.grams), quantityConfidence: "high" as const, confirmedByUser: true })))
    setSavedMealId(m.id)
    setSource("saved")
    setHasPhoto(false)
    go("review")
  }

  const confirm = () => {
    const s = useApp.getState()
    const id = uid("entry")
    const date = linkedMeal?.date ?? today
    const finalItems = items.map((i) => ({ ...i, confirmedByUser: true }))
    const entry: JournalEntry = {
      id,
      profileId: profile.id,
      mealType: linkedMeal?.mealType ?? mealType,
      consumedAt: `${date}T${time}:00`,
      source,
      hasPhoto,
      items: finalItems,
      hiddenIngredients: { oil: oil === "unsure" ? "moderate" : oil, sugar },
      analysisStatus: "confirmed",
      linkedPlannedMealId: linkedMeal?.id,
      note: isChild ? `${child.texture} · ${child.accepted === "yes" ? "enjoyed" : child.accepted === "somewhat" ? "ate a little" : "not today"} · ${child.reaction}` : undefined,
    }
    s.addEntry(entry)
    if (linkedMeal) {
      const unchanged = source === "planned" && plannedSnapshot === JSON.stringify(finalItems.map((i) => [i.foodId, i.grams]))
      s.setMealOutcome(linkedMeal.id, unchanged ? "eaten_as_planned" : "eaten_modified", id)
    }
    if (savedMealId) s.bumpSavedMeal(savedMealId)
    if (saveAsUsual && !isChild) s.saveMeal({ id: uid("sm"), name: entryTitle(entry), mealType: entry.mealType, items: finalItems.map((i) => ({ foodId: i.foodId, grams: i.grams })), timesConfirmed: 1 })
    if (isChild && child.firstTime) {
      s.addIntroduced({
        id: uid("intro"),
        profileId: profile.id,
        foodName: entryTitle(entry),
        date,
        preparation: child.texture,
        texture: child.texture,
        accepted: child.accepted,
        reaction: child.reaction || "None observed",
        clinicianAdvisedAvoid: false,
      })
    }
    setEntryId(id)
    setHistory([])
    setStep("result")
  }

  return (
    <div className="flex flex-1 flex-col">
      <FlowHeader title={TITLES[step]} step={PHASE[step]} total={3} onBack={step !== "result" && step !== "method" ? back : undefined} closeHref={isChild ? "/log" : "/home"} />

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) startPhoto(URL.createObjectURL(f))
          e.target.value = ""
        }}
      />

      {step === "method" && (
        <div className="px-gutter space-y-6 pt-3 pb-8">
          {isChild ? (
            <p className="text-callout text-muted-foreground">Logging for {profile.name}. We record foods, textures and how it went — not calories.</p>
          ) : (
            <div>
              <p className="text-overline mb-2 text-muted-foreground">Meal</p>
              <div className="no-scrollbar -mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)]" role="radiogroup" aria-label="Meal">
                {PICKABLE.map((t) => (
                  <button
                    key={t}
                    role="radio"
                    aria-checked={mealType === t}
                    onClick={() => setMealType(t)}
                    className={cn(
                      "text-callout h-9 shrink-0 rounded-full border px-4 font-medium transition-colors",
                      mealType === t ? "border-forest bg-forest text-primary-foreground" : "border-border/80 bg-card text-charcoal hover:bg-muted",
                    )}
                  >
                    {MEAL_LABEL[t]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {linkedMeal && plannedRecipe && (
            <Surface>
              <div className="flex items-center gap-3">
                <RecipeThumb recipe={plannedRecipe} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-caption text-muted-foreground">Planned for {MEAL_LABEL[linkedMeal.mealType].toLowerCase()}</p>
                  <p className="text-body font-medium">{plannedRecipe.name}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={eatAsPlanned}>
                  <CircleCheck /> Ate as planned
                </Button>
                <Button variant="outline" onClick={skipPlanned}>
                  <SkipForward /> Skipped it
                </Button>
              </div>
              <p className="text-caption mt-3 text-muted-foreground">Ate something different? Use a photo or search below.</p>
            </Surface>
          )}

          {!isChild && (
            <button onClick={() => choosePhoto()} className="flex w-full items-center gap-4 rounded-2xl bg-forest p-5 text-left text-primary-foreground transition-colors hover:bg-[#1d3f30]">
              <span className="grid size-14 shrink-0 place-items-center rounded-[16px] bg-white/12">
                <Camera className="size-7" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-headline flex items-center gap-2">
                  Take or upload a photo <PhaseBadge phase={1} className="bg-white/20 text-primary-foreground" />
                </span>
                <span className="text-callout mt-0.5 block text-primary-foreground/80">We suggest the foods and portions — you confirm.</span>
              </span>
            </button>
          )}

          <div>
            <p className="text-overline mb-2 text-muted-foreground">{isChild ? "Add what was offered" : "Other ways to log"}</p>
            <div className="grid grid-cols-2 gap-3">
              <MethodTile
                icon={<Search />}
                label="Search foods"
                hint="Pick from the list"
                onClick={() => {
                  setSource("manual")
                  setHasPhoto(false)
                  setItems([])
                  go("search")
                }}
              />
              <MethodTile
                icon={<Keyboard />}
                label="Type it"
                hint="“2 roti and dal”"
                onClick={() => {
                  setHasPhoto(false)
                  go("text")
                }}
              />
              {!isChild && (
                <>
                  <MethodTile icon={<Bookmark />} label="Saved meals" hint="Your usual meals" onClick={() => go("saved")} phase={2} />
                  <MethodTile
                    icon={<Mic />}
                    label="Voice"
                    hint="Say what you ate"
                    onClick={() => {
                      setHasPhoto(false)
                      go("voice")
                    }}
                    phase={2}
                  />
                  <MethodTile icon={<Barcode />} label="Barcode" hint="Packaged food" onClick={() => go("barcode")} phase={2} />
                  <MethodTile icon={<ImageUp />} label="Sample photo" hint="Demo without a camera" onClick={() => choosePhoto(true)} />
                </>
              )}
            </div>
          </div>
          <p className="text-caption flex items-start gap-2 text-muted-foreground">
            <ShieldCheck className="mt-px size-4 shrink-0 text-forest" aria-hidden />
            If photo analysis isn&apos;t available, search and typing always work and nothing you enter is lost.
          </p>
        </div>
      )}

      {step === "consent" && (
        <div className="flex flex-1 flex-col">
          <div className="px-gutter space-y-6 pt-6 pb-6">
            <div className="text-center">
              <IconTile size="lg" className="mx-auto">
                <ShieldCheck />
              </IconTile>
              <p className="text-title mt-4">Before you add photos</p>
              <p className="text-callout mx-auto mt-1 max-w-[18rem] text-muted-foreground">Here&apos;s how we handle your meal photos.</p>
            </div>
            <ListGroup>
              <ListRow icon={<Lock />} title="Stored privately" description="Never on a public link. Location data is removed." />
              <ListRow icon={<EyeOff />} title="No personal details shared" description="An AI service suggests foods from the photo. It doesn't receive your name or health details." />
              <ListRow icon={<Trash2 />} title="Delete any time" description="Removing a photo keeps your nutrition history." />
            </ListGroup>
            <p className="text-caption text-center text-muted-foreground">
              Change this any time in{" "}
              <Link href="/profile/privacy" className="font-medium text-forest underline-offset-2 hover:underline">
                Privacy
              </Link>
              .
            </p>
          </div>
          <StickyFooter>
            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                setConsent("food_photos", true)
                if (afterConsent.current === "sample") return startPhoto(undefined, true)
                setHistory((h) => h.slice(0, -1))
                setStep("method")
                fileRef.current?.click()
              }}
            >
              Allow photo logging
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep("search")}>
              Not now — search instead
            </Button>
          </StickyFooter>
        </div>
      )}

      {step === "analyzing" && (
        <div className="px-gutter flex flex-1 flex-col items-center gap-3 pt-12 text-center">
          <div className="relative">
            <div className="size-44 overflow-hidden rounded-[24px] border border-border/80">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="Your meal" className="size-full object-cover" />
              ) : (
                <div className="size-full bg-[repeating-linear-gradient(135deg,#dce7d8_0_10px,#e6eee2_10px_20px)]" />
              )}
            </div>
            <Loader2 className="absolute -right-3 -bottom-3 size-9 animate-spin rounded-full bg-card p-1.5 text-forest motion-reduce:animate-none" aria-hidden />
          </div>
          <p className="text-title mt-4" aria-live="polite">
            Finding foods and portions…
          </p>
          <p className="text-callout max-w-xs text-muted-foreground">You&apos;ll check everything before it&apos;s saved.</p>
          <Button
            variant="ghost"
            onClick={() => {
              window.clearTimeout(timer.current)
              setSource("manual")
              setHasPhoto(false)
              setItems([])
              setStep("search")
            }}
          >
            Taking too long? Log it by search
          </Button>
        </div>
      )}

      {step === "search" && <SearchStep items={items} setItems={setItems} profile={profile} onNext={() => go("review")} />}
      {step === "text" && (
        <TextStep
          onParsed={(list, src) => {
            setItems(list)
            setSource(src)
            go("review")
          }}
        />
      )}
      {step === "voice" && (
        <VoiceStep
          onParsed={(list, src) => {
            setItems(list)
            setSource(src)
            go("review")
          }}
        />
      )}
      {step === "barcode" && (
        <BarcodeStep
          profile={profile}
          onSearchInstead={() => {
            setSource("manual")
            setItems([])
            setStep("search")
          }}
        />
      )}
      {step === "saved" && <SavedStep mealType={mealType} onPick={pickSaved} />}

      {step === "review" && (
        <ReviewStep
          profile={profile}
          source={source}
          photoUrl={photoUrl}
          hasPhoto={hasPhoto}
          items={items}
          setItems={setItems}
          oil={oil}
          setOil={setOil}
          sugar={sugar}
          setSugar={setSugar}
          linkedMealId={linkedMealId}
          setLinkedMealId={setLinkedMealId}
          openMeals={openMeals}
          time={time}
          setTime={setTime}
          saveAsUsual={saveAsUsual}
          setSaveAsUsual={setSaveAsUsual}
          child={child}
          setChild={setChild}
          onConfirm={confirm}
        />
      )}

      {step === "result" && entryId && <ResultStep entryId={entryId} firstTime={isChild && child.firstTime} />}

      {step === "method" && isChild && (
        <div className="px-gutter pb-8">
          <InfoNote>Breast milk or formula stays the main food in the first year. Offer solids alongside, never instead.</InfoNote>
        </div>
      )}
    </div>
  )
}

function MethodTile({ icon, label, hint, onClick, phase }: { icon: React.ReactNode; label: string; hint: string; onClick: () => void; phase?: 1 | 2 | 3 }) {
  return (
    <button onClick={onClick} className="flex min-h-[112px] flex-col items-start justify-between gap-3 rounded-2xl border border-border/80 bg-card p-4 text-left transition-colors hover:bg-muted/50 active:bg-muted">
      <span className="flex w-full items-start justify-between">
        <IconTile>{icon}</IconTile>
        {phase && <PhaseBadge phase={phase} />}
      </span>
      <span>
        <span className="text-callout block font-semibold">{label}</span>
        <span className="text-caption block text-muted-foreground">{hint}</span>
      </span>
    </button>
  )
}
