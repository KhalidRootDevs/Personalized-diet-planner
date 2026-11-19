"use client";

import { consentGranted } from "@/lib/consent";
import { ConsentPrompt } from "@/components/privacy/consent-prompt";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Barcode,
  Bookmark,
  BookOpen,
  Camera,
  CircleCheck,
  EyeOff,
  History,
  ImageUp,
  Images,
  Keyboard,
  Loader2,
  Lock,
  Mic,
  Search,
  ShieldCheck,
  SkipForward,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeatureBadge, PhaseBadge } from "@/components/app/badges";
import { InfoNote } from "@/components/app/alerts";
import { RecipeThumb } from "@/components/app/recipe-thumb";
import {
  FlowHeader,
  IconTile,
  ListGroup,
  ListRow,
  StickyFooter,
  Surface,
  type IconTone,
} from "@/components/app/page";
import { SCENE_PHOTO } from "@/lib/data/photos";
import { FOOD_MAP } from "@/lib/data/foods";
import {
  BarcodeStep,
  RecipePickStep,
  SavedStep,
  SearchStep,
  TextStep,
  VoiceStep,
} from "@/components/log/input-steps";
import {
  recipeItems,
  ReviewStep,
  TEXTURES,
  toStoredHidden,
  type ChildInfo,
  type Hidden,
} from "@/components/log/review-step";
import { ResultStep } from "@/components/log/result-step";
import { useApp, useActivePlan, useActiveProfile } from "@/lib/store";
import { MEAL_LABEL } from "@/lib/planning";
import { formatDay, nowHHMM, todayISO, uid } from "@/lib/date";
import { analyzePhoto } from "@/lib/vision-mock";
import { suggestMealType } from "@/lib/area-b-text";
import {
  classifyOutcome,
  clearLogHandoff,
  entryTitle,
  itemFromFood,
  itemsKey,
  makeThumb,
  readLogHandoff,
  SOURCE_LABEL,
} from "@/lib/area-b-log";
import { useRecipeLookup } from "@/lib/area-c-utils";
import { cn } from "@/lib/utils";
import type {
  JournalEntry,
  JournalItem,
  MealType,
  Recipe,
  SavedMeal,
} from "@/lib/types";

type Step =
  | "method"
  | "consent"
  | "analyzing"
  | "search"
  | "text"
  | "voice"
  | "barcode"
  | "saved"
  | "recipe"
  | "review"
  | "result";

const TITLES: Record<Step, string> = {
  method: "Log a meal",
  consent: "Photo privacy",
  analyzing: "Looking at your photo",
  search: "Search foods",
  text: "Describe your meal",
  voice: "Say what you ate",
  barcode: "Scan a barcode",
  saved: "Saved meals",
  recipe: "From a recipe",
  review: "Confirm your meal",
  result: "Saved",
};

// Step indicator (UI-SPEC §5.2): choose an input → confirm → done.
const PHASE: Record<Step, number> = {
  method: 1,
  consent: 1,
  analyzing: 1,
  search: 1,
  text: 1,
  voice: 1,
  barcode: 1,
  saved: 1,
  recipe: 1,
  review: 2,
  result: 3,
};

const PICKABLE: MealType[] = [
  "breakfast",
  "morning_snack",
  "lunch",
  "afternoon_snack",
  "dinner",
  "evening_snack",
  "drinks",
  "other",
];

/** A sensible default time when logging for an earlier day. */
const TYPICAL_TIME: Record<MealType, string> = {
  breakfast: "08:00",
  morning_snack: "11:00",
  lunch: "13:30",
  afternoon_snack: "17:00",
  dinner: "20:30",
  evening_snack: "22:00",
  drinks: "16:00",
  other: "12:00",
};

/**
 * Unified logging flow (§41.2, §42.3). Every input method — photo, search, text, voice, barcode,
 * saved meal, recipe, restaurant and What-If handoffs — produces the same structured entry and
 * goes through the same confirmation and deterministic calculation.
 */
export function LogFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const profile = useActiveProfile();
  const plan = useActivePlan();
  const consents = useApp((s) => s.consents);
  const savedMeals = useApp((s) => s.savedMeals);
  const setConsent = useApp((s) => s.setConsent);
  const lookup = useRecipeLookup();
  const today = todayISO();
  const isChild = !!profile && profile.type !== "adult";

  const paramMeal = plan?.meals.find((m) => m.id === params.get("meal"));
  const paramDateRaw = params.get("date");
  const paramDate =
    paramDateRaw &&
    /^\d{4}-\d{2}-\d{2}$/.test(paramDateRaw) &&
    paramDateRaw <= today
      ? paramDateRaw
      : undefined;
  const paramRecipe = lookup(params.get("recipe") ?? "");
  // Items handed over from the restaurant assistant or What-If simulator (never saved unconfirmed).
  const [handoff] = useState(() =>
    params.get("handoff") ? readLogHandoff() : null,
  );
  useEffect(() => {
    if (handoff) clearLogHandoff();
  }, [handoff]);

  const initialMeal: MealType =
    handoff?.mealType ?? paramMeal?.mealType ?? suggestMealType();
  const [date, setDate] = useState(paramMeal?.date ?? paramDate ?? today);
  const [step, setStep] = useState<Step>(
    handoff || paramRecipe ? "review" : "method",
  );
  const [history, setHistory] = useState<Step[]>([]);
  const [mealType, setMealType] = useState<MealType>(initialMeal);
  const [recipe, setRecipe] = useState<Recipe | undefined>(paramRecipe);
  const [servings, setServings] = useState(1);
  const [items, setItems] = useState<JournalItem[]>(
    () => handoff?.items ?? (paramRecipe ? recipeItems(paramRecipe, 1) : []),
  );
  const [source, setSource] = useState<JournalEntry["source"]>(
    handoff?.source ?? (paramRecipe ? "recipe" : "manual"),
  );
  const [photos, setPhotos] = useState<string[]>([]);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [hidden, setHidden] = useState<Hidden>({});
  const [linkedChoice, setLinkedMealId] = useState<string>();
  const [time, setTime] = useState(() => {
    if (paramMeal && (paramMeal.date < today || paramMeal.time < nowHHMM()))
      return paramMeal.time;
    if (paramDate && paramDate < today) return TYPICAL_TIME[initialMeal];
    return nowHHMM();
  });
  const [saveAsUsual, setSaveAsUsual] = useState(false);
  const [savedMealId, setSavedMealId] = useState<string>();
  const [plannedSnapshot, setPlannedSnapshot] = useState<string>();
  const [child, setChild] = useState<ChildInfo>({
    texture: TEXTURES[1],
    accepted: "yes",
    reaction: "None observed",
    firstTime: false,
  });
  const [entryId, setEntryId] = useState<string>();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const afterConsent = useRef<"camera" | "gallery" | "sample">("camera");
  const addingAngle = useRef(false);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const openMeals = useMemo(
    () =>
      isChild
        ? []
        : (plan?.meals ?? [])
            .filter(
              (m) => (m.date === date && !m.outcome) || m.id === paramMeal?.id,
            )
            .sort((a, b) => a.time.localeCompare(b.time)),
    [plan, date, isChild, paramMeal?.id],
  );

  // Default the plan link to the open planned meal of the chosen type (§41.5).
  const linkedMealId =
    linkedChoice ??
    paramMeal?.id ??
    (handoff
      ? "none"
      : (openMeals.find((m) => m.mealType === mealType)?.id ?? "none"));

  if (!profile) return null;
  const photoConsent = consents.find((c) => c.type === "food_photos")?.granted;
  // Without AI-processing consent, photo/text/voice analysis is off; manual logging keeps working (§29, FR-041).
  const aiConsent = consentGranted(consents, "ai_processing");
  const linkedMeal = openMeals.find((m) => m.id === linkedMealId);
  const plannedRecipe = linkedMeal ? lookup(linkedMeal.recipeId) : undefined;
  // Meal memory (§42.3.2): a meal confirmed 3+ times at this time of day.
  const usual = isChild
    ? undefined
    : [...savedMeals]
        .filter((m) => m.mealType === mealType && m.timesConfirmed >= 3)
        .sort((a, b) => b.timesConfirmed - a.timesConfirmed)[0];

  const go = (next: Step) => {
    setHistory((h) => [...h, step]);
    setStep(next);
  };
  const back = () => {
    window.clearTimeout(timer.current);
    const prev = history[history.length - 1];
    if (!prev) return router.back();
    setHistory((h) => h.slice(0, -1));
    setStep(prev);
  };

  const runAnalysis = (replace?: boolean) => {
    setHasPhoto(true);
    setSource("photo");
    setHidden({});
    setRecipe(undefined);
    if (replace) setStep("analyzing");
    else go("analyzing");
    timer.current = window.setTimeout(() => {
      setItems(analyzePhoto(mealType));
      setStep("review");
    }, 1600);
  };

  const onFiles = async (files: FileList | null) => {
    const list = Array.from(files ?? []).slice(0, 4);
    if (!list.length) return;
    const adding = addingAngle.current;
    addingAngle.current = false;
    try {
      const thumbs = await Promise.all(list.map((f) => makeThumb(f)));
      if (adding) {
        setPhotos((p) => [...p, ...thumbs].slice(0, 4));
        toast("Photo added", {
          description:
            "Extra angles help you check portions. The suggested foods don't change.",
        });
        return;
      }
      setPhotos(thumbs);
      runAnalysis(step === "consent");
    } catch {
      // Image analysis failure never blocks logging (§41.10 Req. 10).
      toast("We couldn't read that photo", {
        description:
          "Try another photo, or log it by search — nothing is lost.",
      });
    }
  };

  const choosePhoto = (mode: "camera" | "gallery" | "sample") => {
    afterConsent.current = mode;
    if (!photoConsent) return go("consent");
    if (mode === "sample") {
      setPhotos([samplePhoto(mealType)]);
      return runAnalysis();
    }
    (mode === "camera" ? cameraRef : galleryRef).current?.click();
  };

  const addAngle = (mode: "camera" | "gallery") => {
    addingAngle.current = true;
    (mode === "camera" ? cameraRef : galleryRef).current?.click();
  };

  const eatAsPlanned = () => {
    if (!linkedMeal || !plannedRecipe) return;
    const list = recipeItems(plannedRecipe, linkedMeal.servings);
    setItems(list);
    setPlannedSnapshot(itemsSnapshot(list));
    setSource("planned");
    setHasPhoto(false);
    setRecipe(undefined);
    setMealType(linkedMeal.mealType);
    go("review");
  };

  const skipPlanned = () => {
    if (!linkedMeal) return;
    const prev = linkedMeal.outcome;
    useApp.getState().setMealOutcome(linkedMeal.id, "skipped");
    toast(`${MEAL_LABEL[linkedMeal.mealType]} marked as skipped`, {
      description: "Your plan stays the same.",
      action: {
        label: "Undo",
        onClick: () => useApp.getState().setMealOutcome(linkedMeal.id, prev),
      },
    });
    router.push("/home");
  };

  const pickSaved = (m: SavedMeal) => {
    setItems(
      m.items.map((i) => ({
        ...itemFromFood(i.foodId, i.grams),
        quantityConfidence: "high" as const,
        confirmedByUser: true,
      })),
    );
    setSavedMealId(m.id);
    setSource("saved");
    setHasPhoto(false);
    setRecipe(undefined);
    go("review");
  };

  const pickRecipe = (r: Recipe) => {
    setRecipe(r);
    setServings(1);
    setItems(recipeItems(r, 1));
    setSource("recipe");
    setHasPhoto(false);
    go("review");
  };

  const confirm = () => {
    const s = useApp.getState();
    const id = uid("entry");
    const day = linkedMeal?.date ?? date;
    const finalItems = items.map((i) => ({ ...i, confirmedByUser: true }));
    const at = new Date().toISOString();
    const entry: JournalEntry = {
      id,
      profileId: profile.id,
      mealType: linkedMeal?.mealType ?? mealType,
      consumedAt: `${day}T${time}:00`,
      source,
      hasPhoto,
      photoThumb: hasPhoto ? photos[0] : undefined,
      photos: hasPhoto && photos.length ? photos : undefined,
      items: finalItems,
      hiddenIngredients: toStoredHidden(hidden),
      analysisStatus: "confirmed",
      linkedPlannedMealId: linkedMeal?.id,
      recipeId: recipe?.id,
      history: [
        {
          at,
          change: `Logged by ${SOURCE_LABEL[source].toLowerCase()} and confirmed${day !== today ? ` for ${formatDay(day)}` : ""}`,
        },
      ],
      note: isChild
        ? `${child.texture} · ${child.accepted === "yes" ? "enjoyed" : child.accepted === "somewhat" ? "ate a little" : "not today"} · ${child.reaction}`
        : undefined,
    };
    s.addEntry(entry);
    if (linkedMeal) {
      // Unified meal status (§14.6): as planned / changed / replaced.
      const unchanged =
        source === "planned" && plannedSnapshot === itemsSnapshot(finalItems);
      s.setMealOutcome(
        linkedMeal.id,
        unchanged
          ? "eaten_as_planned"
          : classifyOutcome(plannedRecipe, linkedMeal.servings, finalItems),
        id,
      );
    }
    if (savedMealId) s.bumpSavedMeal(savedMealId);
    if (
      saveAsUsual &&
      !isChild &&
      !s.savedMeals.some((m) => itemsKey(m.items) === itemsKey(finalItems))
    )
      s.saveMeal({
        id: uid("sm"),
        name: entryTitle(entry),
        mealType: entry.mealType,
        items: finalItems.map((i) => ({ foodId: i.foodId, grams: i.grams })),
        timesConfirmed: 1,
      });
    if (isChild && child.firstTime) {
      s.addIntroduced({
        id: uid("intro"),
        profileId: profile.id,
        foodName: entryTitle(entry),
        date: day,
        preparation: child.texture,
        texture: child.texture,
        accepted: child.accepted,
        reaction: child.reaction || "None observed",
        clinicianAdvisedAvoid: false,
      });
    }
    setEntryId(id);
    setHistory([]);
    setStep("result");
  };

  return (
    <div className="flex flex-1 flex-col">
      <FlowHeader
        title={TITLES[step]}
        step={PHASE[step]}
        total={3}
        onBack={step !== "result" && step !== "method" ? back : undefined}
        closeHref={isChild ? "/log" : "/home"}
      />

      {/* Camera opens the rear camera; gallery allows several existing photos (§41.2 Step 1). */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          void onFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          void onFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {step === "method" && (
        <div className="px-gutter space-y-6 pt-3 pb-8">
          {date !== today && (
            <InfoNote title={`Logging for ${formatDay(date)}`}>
              You can change the date and time on the next screen.
            </InfoNote>
          )}
          {isChild ? (
            <p className="text-callout text-muted-foreground">
              Logging for {profile.name}. We record foods, textures and how it
              went — not calories.
            </p>
          ) : (
            <div>
              <p className="text-overline mb-2 text-muted-foreground">Meal</p>
              <div
                className="no-scrollbar -mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)]"
                role="radiogroup"
                aria-label="Meal"
              >
                {PICKABLE.map((t) => (
                  <button
                    key={t}
                    role="radio"
                    aria-checked={mealType === t}
                    onClick={() => setMealType(t)}
                    className={cn(
                      "text-callout h-9 shrink-0 rounded-full border px-4 font-medium transition-colors",
                      mealType === t
                        ? "border-lime bg-lime text-charcoal"
                        : "border-transparent bg-card text-charcoal shadow-card hover:bg-muted",
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
                  <p className="text-caption text-muted-foreground">
                    Planned for {MEAL_LABEL[linkedMeal.mealType].toLowerCase()}
                  </p>
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
              <p className="text-caption mt-3 text-muted-foreground">
                Ate something different? Use a photo or search below.
              </p>
            </Surface>
          )}

          {usual && !linkedMeal && (
            <Surface tone="sage">
              <p className="text-overline flex items-center gap-1.5 text-forest">
                <History className="size-3.5" aria-hidden /> Meal memory{" "}
                <FeatureBadge feature="saved_meals" />
              </p>
              <p className="text-headline mt-2">
                Is this your usual {MEAL_LABEL[mealType].toLowerCase()}?
              </p>
              <p className="text-callout mt-0.5 text-charcoal/80">
                {usual.name} ·{" "}
                {usual.items
                  .map((i) => FOOD_MAP[i.foodId]?.name ?? i.foodId)
                  .join(", ")}
              </p>
              <Button
                variant="outline"
                className="mt-3 w-full"
                onClick={() => pickSaved(usual)}
              >
                <CircleCheck /> Yes, log my usual
              </Button>
              <p className="text-caption mt-2 text-muted-foreground">
                You&apos;ll still check portions before it&apos;s saved.
              </p>
            </Surface>
          )}

          {!isChild && !aiConsent && (
            <ConsentPrompt
              type="ai_processing"
              feature="Photo and text analysis"
            >
              Search, recipes, saved meals and barcodes still work, and nothing
              you logged is lost.
            </ConsentPrompt>
          )}
          {!isChild && aiConsent && (
            <div className="relative flex w-full items-center gap-3 overflow-hidden rounded-2xl bg-lime-card p-5 pr-2 text-charcoal">
              <div className="relative z-10 min-w-0 flex-1">
                <span className="text-caption inline-flex items-center gap-1.5 rounded-full bg-white/65 px-2.5 py-1 font-medium">
                  <Camera className="size-3.5" aria-hidden /> Photo logging{" "}
                  <PhaseBadge phase={1} className="bg-white/70" />
                </span>
                <span className="text-title mt-3 block leading-tight">
                  Take or upload a photo
                </span>
                <span className="text-callout mt-1 block text-charcoal/75">
                  We suggest the foods and portions — you confirm. Add more than
                  one angle if you like.
                </span>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => choosePhoto("camera")}
                    className="text-callout inline-flex h-10 items-center gap-2 rounded-full bg-charcoal px-4 font-semibold text-white"
                  >
                    <Camera className="size-4" aria-hidden /> Camera
                  </button>
                  <button
                    onClick={() => choosePhoto("gallery")}
                    className="text-callout inline-flex h-10 items-center gap-2 rounded-full bg-white/80 px-4 font-semibold text-charcoal"
                  >
                    <Images className="size-4" aria-hidden /> Gallery
                  </button>
                </div>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element -- static prototype asset */}
              <img
                src={SCENE_PHOTO.salad}
                alt=""
                className="size-28 shrink-0 rounded-full object-cover ring-[6px] ring-white/50"
              />
            </div>
          )}

          <div>
            <p className="text-overline mb-2 text-muted-foreground">
              {isChild ? "Add what was offered" : "Other ways to log"}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <MethodTile
                icon={<Search />}
                label="Search foods"
                tone="sky"
                hint="Pick from the list"
                onClick={() => {
                  setSource("manual");
                  setHasPhoto(false);
                  setRecipe(undefined);
                  setItems([]);
                  go("search");
                }}
              />
              {aiConsent && (
                <MethodTile
                  icon={<Keyboard />}
                  label="Type it"
                  tone="amber"
                  hint="“2 roti and dal”"
                  onClick={() => {
                    setHasPhoto(false);
                    setRecipe(undefined);
                    go("text");
                  }}
                />
              )}
              <MethodTile
                icon={<BookOpen />}
                label="From a recipe"
                tone="lime"
                hint="A dish you cooked"
                onClick={() => go("recipe")}
              />
              {!isChild && (
                <>
                  <MethodTile
                    icon={<Bookmark />}
                    label="Saved meals"
                    tone="lime"
                    hint="Your usual meals"
                    onClick={() => go("saved")}
                    phase={2}
                  />
                  {aiConsent && (
                    <MethodTile
                      icon={<Mic />}
                      label="Voice"
                      tone="terracotta"
                      hint="Say what you ate"
                      onClick={() => {
                        setHasPhoto(false);
                        setRecipe(undefined);
                        go("voice");
                      }}
                      phase={2}
                    />
                  )}
                  <MethodTile
                    icon={<Barcode />}
                    label="Barcode"
                    tone="muted"
                    hint="Packaged food"
                    onClick={() => go("barcode")}
                    phase={2}
                  />
                  {aiConsent && (
                    <MethodTile
                      icon={<ImageUp />}
                      label="Sample photo"
                      tone="sage"
                      hint="Demo without a camera"
                      onClick={() => choosePhoto("sample")}
                    />
                  )}
                </>
              )}
            </div>
          </div>
          <p className="text-caption flex items-start gap-2 text-muted-foreground">
            <ShieldCheck
              className="mt-px size-4 shrink-0 text-forest"
              aria-hidden
            />
            If photo analysis isn&apos;t available, search and typing always
            work and nothing you enter is lost.
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
              <p className="text-callout mx-auto mt-1 max-w-[18rem] text-muted-foreground">
                Here&apos;s how we handle your meal photos.
              </p>
            </div>
            <ListGroup>
              <ListRow
                icon={<Lock />}
                title="Stored privately"
                description="Never on a public link. Location data is removed."
              />
              <ListRow
                icon={<EyeOff />}
                title="No personal details shared"
                description="An AI service suggests foods from the photo. It doesn't receive your name or health details."
              />
              <ListRow
                icon={<Trash2 />}
                title="Delete any time"
                description="Removing a photo keeps your nutrition history."
              />
            </ListGroup>
            <p className="text-caption text-center text-muted-foreground">
              Change this any time in{" "}
              <Link
                href="/profile/privacy"
                className="font-medium text-forest underline-offset-2 hover:underline"
              >
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
                setConsent("food_photos", true);
                if (afterConsent.current === "sample") {
                  setPhotos([samplePhoto(mealType)]);
                  return runAnalysis(true);
                }
                setHistory((h) => h.slice(0, -1));
                setStep("method");
                (afterConsent.current === "camera"
                  ? cameraRef
                  : galleryRef
                ).current?.click();
              }}
            >
              Allow photo logging
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setStep("search")}
            >
              Not now — search instead
            </Button>
          </StickyFooter>
        </div>
      )}

      {step === "analyzing" && (
        <div className="px-gutter flex flex-1 flex-col items-center gap-3 pt-12 text-center">
          <div className="relative">
            <div className="size-48 overflow-hidden rounded-full ring-8 ring-lime/60">
              {photos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photos[0]}
                  alt="Your meal"
                  className="size-full object-cover"
                />
              ) : (
                <div className="size-full bg-[repeating-linear-gradient(135deg,#eef8df_0_10px,#e2f1cc_10px_20px)]" />
              )}
            </div>
            <Loader2
              className="absolute right-1 bottom-1 size-11 animate-spin rounded-full bg-card p-2 text-lime-text shadow-card motion-reduce:animate-none"
              aria-hidden
            />
          </div>
          <p className="text-title mt-4" aria-live="polite">
            Finding foods and portions…
          </p>
          <p className="text-callout max-w-xs text-muted-foreground">
            You&apos;ll check everything before it&apos;s saved.
          </p>
          <Button
            variant="ghost"
            onClick={() => {
              window.clearTimeout(timer.current);
              setSource("manual");
              setHasPhoto(false);
              setItems([]);
              setStep("search");
            }}
          >
            Taking too long? Log it by search
          </Button>
        </div>
      )}

      {step === "search" && (
        <SearchStep
          items={items}
          setItems={setItems}
          profile={profile}
          onNext={() => go("review")}
        />
      )}
      {step === "text" && (
        <TextStep
          onParsed={(list, src) => {
            setItems(list);
            setSource(src);
            go("review");
          }}
        />
      )}
      {step === "voice" && (
        <VoiceStep
          onParsed={(list, src) => {
            setItems(list);
            setSource(src);
            go("review");
          }}
        />
      )}
      {step === "barcode" && (
        <BarcodeStep
          profile={profile}
          onVerified={(list) => {
            setItems(list);
            setSource("barcode");
            setHasPhoto(false);
            setRecipe(undefined);
            go("review");
          }}
          onSearchInstead={() => {
            setSource("manual");
            setItems([]);
            setStep("search");
          }}
        />
      )}
      {step === "saved" && <SavedStep mealType={mealType} onPick={pickSaved} />}
      {step === "recipe" && (
        <RecipePickStep profile={profile} onPick={pickRecipe} />
      )}

      {step === "review" && (
        <ReviewStep
          profile={profile}
          source={source}
          photos={photos}
          hasPhoto={hasPhoto}
          onAddPhoto={hasPhoto ? addAngle : undefined}
          items={items}
          setItems={setItems}
          hidden={hidden}
          setHidden={setHidden}
          mealType={mealType}
          setMealType={setMealType}
          linkedMealId={linkedMealId}
          setLinkedMealId={setLinkedMealId}
          openMeals={openMeals}
          date={date}
          setDate={setDate}
          time={time}
          setTime={setTime}
          saveAsUsual={saveAsUsual}
          setSaveAsUsual={setSaveAsUsual}
          child={child}
          setChild={setChild}
          recipeCtx={
            recipe
              ? {
                  recipe,
                  servings,
                  setServings: (n) => {
                    setServings(n);
                    setItems(recipeItems(recipe, n));
                  },
                }
              : undefined
          }
          onUseRecipe={(r) => {
            setRecipe(r);
            setServings(1);
            setItems(recipeItems(r, 1));
            setHidden({});
          }}
          context={handoff?.context}
          onConfirm={confirm}
        />
      )}

      {step === "result" && entryId && (
        <ResultStep entryId={entryId} firstTime={isChild && child.firstTime} />
      )}

      {step === "method" && isChild && (
        <div className="px-gutter pb-8">
          <InfoNote>
            Breast milk or formula stays the main food in the first year. Offer
            solids alongside, never instead.
          </InfoNote>
        </div>
      )}
    </div>
  );
}

function itemsSnapshot(list: JournalItem[]): string {
  return JSON.stringify(list.map((i) => [i.foodId, i.grams]));
}

/** Demo photo matching the sample analysis for this meal (vision-mock SAMPLES). */
function samplePhoto(meal: MealType): string {
  if (meal === "breakfast") return "/food/omelette-roti.jpg";
  if (meal === "lunch") return "/food/rice-fish-dal.jpg";
  if (meal === "dinner") return "/food/rice-chicken-dal.jpg";
  return "/food/tea-chickpea.jpg";
}

function MethodTile({
  icon,
  label,
  hint,
  onClick,
  phase,
  tone = "sage",
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
  phase?: 1 | 2 | 3;
  tone?: IconTone;
}) {
  return (
    <button
      onClick={onClick}
      className="flex min-h-[116px] flex-col items-start justify-between gap-3 rounded-2xl bg-card p-4 text-left shadow-card transition-colors hover:bg-muted/50 active:bg-muted"
    >
      <span className="flex w-full items-start justify-between">
        <IconTile tone={tone} size="lg">
          {icon}
        </IconTile>
        {phase && <PhaseBadge phase={phase} />}
      </span>
      <span>
        <span className="text-callout block font-semibold">{label}</span>
        <span className="text-caption block text-muted-foreground">{hint}</span>
      </span>
    </button>
  );
}
