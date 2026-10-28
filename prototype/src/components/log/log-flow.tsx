"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { Barcode, Bookmark, Camera, ChevronLeft, CircleCheck, ImageUp, Keyboard, Loader2, Mic, Search, ShieldCheck, SkipForward, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PhaseBadge } from "@/components/app/badges"
import { InfoNote } from "@/components/app/alerts"
import { RecipeThumb } from "@/components/app/recipe-thumb"
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
      <header className="sticky top-0 z-20 bg-background/95 pt-safe backdrop-blur-sm">
        <div className="flex h-14 items-center gap-2 px-2">
          {step !== "result" && step !== "method" ? (
            <button onClick={back} className="grid size-11 place-items-center rounded-full hover:bg-muted" aria-label="Back">
              <ChevronLeft className="size-5" />
            </button>
          ) : (
            <span className="size-11" aria-hidden />
          )}
          <h1 className="flex-1 truncate text-center text-lg font-semibold">{TITLES[step]}</h1>
          <Link href={isChild ? "/log" : "/home"} className="grid size-11 place-items-center rounded-full hover:bg-muted" aria-label="Close">
            <X className="size-5" />
          </Link>
        </div>
      </header>

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
        <div className="space-y-5 px-4 pb-8">
          {isChild ? (
            <p className="text-sm text-muted-foreground">Logging for {profile.name}. We record foods, textures and how it went — not calories.</p>
          ) : (
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="radiogroup" aria-label="Meal">
              {PICKABLE.map((t) => (
                <button
                  key={t}
                  role="radio"
                  aria-checked={mealType === t}
                  onClick={() => setMealType(t)}
                  className={cn("min-h-10 shrink-0 rounded-full border px-4 text-sm", mealType === t ? "border-forest bg-forest text-primary-foreground" : "bg-card")}
                >
                  {MEAL_LABEL[t]}
                </button>
              ))}
            </div>
          )}

          {linkedMeal && plannedRecipe && (
            <div className="rounded-2xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">Planned for {MEAL_LABEL[linkedMeal.mealType].toLowerCase()}</p>
              <div className="mt-1 flex items-center gap-3">
                <RecipeThumb recipe={plannedRecipe} size="sm" />
                <p className="flex-1 font-medium">{plannedRecipe.name}</p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button onClick={eatAsPlanned}>
                  <CircleCheck /> Ate as planned
                </Button>
                <Button variant="outline" onClick={skipPlanned}>
                  <SkipForward /> Skipped it
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Ate something different? Use a photo or search below.</p>
            </div>
          )}

          {!isChild && (
            <button onClick={() => choosePhoto()} className="flex w-full items-center gap-4 rounded-2xl bg-forest p-5 text-left text-primary-foreground">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/15">
                <Camera className="size-7" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-lg font-semibold">
                  Take or upload a photo <PhaseBadge phase={1} className="bg-white/20 text-primary-foreground" />
                </span>
                <span className="block text-sm text-primary-foreground/80">We suggest the foods and portions — you confirm.</span>
              </span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <MethodTile icon={<Search />} label="Search foods" hint="Pick from the list" onClick={() => {
                setSource("manual")
                setHasPhoto(false)
                setItems([])
                go("search")
              }} />
            <MethodTile icon={<Keyboard />} label="Type it" hint="“2 roti and dal”" onClick={() => {
                setHasPhoto(false)
                go("text")
              }} />
            {!isChild && (
              <>
                <MethodTile icon={<Bookmark />} label="Saved meals" hint="Your usual meals" onClick={() => go("saved")} phase={2} />
                <MethodTile icon={<Mic />} label="Voice" hint="Say what you ate" onClick={() => {
                    setHasPhoto(false)
                    go("voice")
                  }} phase={2} />
                <MethodTile icon={<Barcode />} label="Barcode" hint="Packaged food" onClick={() => go("barcode")} phase={2} />
                <MethodTile icon={<ImageUp />} label="Sample photo" hint="Demo without a camera" onClick={() => choosePhoto(true)} />
              </>
            )}
          </div>
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            If photo analysis isn&apos;t available, search and typing always work and nothing you enter is lost.
          </p>
        </div>
      )}

      {step === "consent" && (
        <div className="space-y-4 px-4 pb-8">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-sage text-forest">
            <ShieldCheck className="size-7" />
          </div>
          <p className="text-center text-lg font-semibold">Before you add photos</p>
          <ul className="space-y-2 rounded-2xl border bg-card p-4 text-sm">
            <li>• Photos are stored privately — never on a public link — and location data is removed.</li>
            <li>• An AI service looks at the photo to suggest foods. It doesn&apos;t receive your name or health details.</li>
            <li>• You can delete a photo any time and keep your nutrition history.</li>
          </ul>
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
          <p className="text-center text-xs text-muted-foreground">
            Change this any time in{" "}
            <Link href="/profile/privacy" className="underline underline-offset-2">
              Privacy
            </Link>
            .
          </p>
        </div>
      )}

      {step === "analyzing" && (
        <div className="flex flex-1 flex-col items-center gap-4 px-6 pt-10 text-center">
          <div className="relative">
            <div className="size-40 overflow-hidden rounded-2xl">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="Your meal" className="size-full object-cover" />
              ) : (
                <div className="size-full bg-[repeating-linear-gradient(135deg,#dce7d8_0_10px,#e6eee2_10px_20px)]" />
              )}
            </div>
            <Loader2 className="absolute -right-3 -bottom-3 size-9 animate-spin rounded-full bg-card p-1.5 text-forest motion-reduce:animate-none" aria-hidden />
          </div>
          <p className="font-semibold" aria-live="polite">
            Finding foods and portions…
          </p>
          <p className="max-w-xs text-sm text-muted-foreground">You&apos;ll check everything before it&apos;s saved.</p>
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
        <div className="px-4 pb-8">
          <InfoNote>Breast milk or formula stays the main food in the first year. Offer solids alongside, never instead.</InfoNote>
        </div>
      )}
    </div>
  )
}

function MethodTile({ icon, label, hint, onClick, phase }: { icon: React.ReactNode; label: string; hint: string; onClick: () => void; phase?: 1 | 2 | 3 }) {
  return (
    <button onClick={onClick} className="flex min-h-20 flex-col items-start gap-1.5 rounded-xl border bg-card p-3 text-left transition-colors hover:bg-muted/50">
      <span className="flex w-full items-center justify-between">
        <span className="grid size-9 place-items-center rounded-lg bg-sage text-forest [&_svg]:size-4.5">{icon}</span>
        {phase && <PhaseBadge phase={phase} />}
      </span>
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
    </button>
  )
}
