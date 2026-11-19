"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight, CircleCheck, ListChecks, Pause, Play, RotateCcw, ShieldAlert, Sun, Timer, X } from "lucide-react"
import { HeaderIconButton, IconTile } from "@/components/app/page"
import { InfoNote } from "@/components/app/alerts"
import { RecipeThumb } from "@/components/app/recipe-thumb"
import { FoodTile } from "@/components/log/food-tile"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { FOOD_MAP } from "@/lib/data/foods"
import { friendlyGrams } from "@/lib/area-c-utils"
import { cn } from "@/lib/utils"
import type { Recipe } from "@/lib/types"
import { CHILD_FEEDING_NOTES, STATE_LABEL, householdUnit, minutesLabel, stepSafety } from "./helpers"

const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

/** Keeps the screen awake while cooking (Screen Wake Lock API, feature-detected). */
function useWakeLock() {
  const [active, setActive] = useState(false)
  useEffect(() => {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return
    let sentinel: WakeLockSentinel | null = null
    let cancelled = false
    const acquire = async () => {
      try {
        sentinel = await navigator.wakeLock.request("screen")
        if (cancelled) {
          void sentinel.release()
          return
        }
        setActive(true)
        sentinel.addEventListener("release", () => setActive(false))
      } catch {
        setActive(false)
      }
    }
    const onVisible = () => {
      if (document.visibilityState === "visible" && (!sentinel || sentinel.released)) void acquire()
    }
    void acquire()
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      cancelled = true
      document.removeEventListener("visibilitychange", onVisible)
      void sentinel?.release().catch(() => {})
    }
  }, [])
  return active
}

interface TimerState {
  step: number
  /** Seconds left when paused; when running, derived from endAt. */
  remaining: number
  endAt: number | null
}

const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.max(0, sec % 60)).padStart(2, "0")}`

/**
 * Cook mode (§15.1): one step at a time, large type, swipe or buttons, per-step timers,
 * step safety notes inline, an ingredients drawer for the chosen servings, and the screen kept awake.
 */
export function CookMode({ recipe, servings, subs }: { recipe: Recipe; servings: number; subs: Record<number, string> }) {
  const router = useRouter()
  const total = recipe.steps.length
  const [step, setStep] = useState(0) // `total` = done screen
  const [timer, setTimer] = useState<TimerState | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [drawer, setDrawer] = useState(false)
  const awake = useWakeLock()
  const { byStep, general } = stepSafety(recipe)
  const child = recipe.profile !== "adult"
  const done = step >= total
  const recipeHref = `/recipes/${recipe.id}`

  const go = useCallback((delta: number) => setStep((s) => Math.min(total, Math.max(0, s + delta))), [total])

  // Timer tick
  useEffect(() => {
    if (!timer?.endAt) return
    const t = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(t)
  }, [timer?.endAt])

  const left = timer ? (timer.endAt ? Math.max(0, Math.ceil((timer.endAt - now) / 1000)) : timer.remaining) : 0

  // Timer finished: toast always, vibrate unless the person prefers reduced motion.
  useEffect(() => {
    if (!timer?.endAt) return
    const { step: s, endAt } = timer
    const t = window.setTimeout(() => {
      setTimer({ step: s, remaining: 0, endAt: null })
      toast(`Step ${s + 1} timer is done`, { description: recipe.steps[s], duration: 10000 })
      if (!prefersReducedMotion() && "vibrate" in navigator) navigator.vibrate([250, 120, 250])
    }, Math.max(0, endAt - Date.now()))
    return () => window.clearTimeout(t)
  }, [timer, recipe.steps])

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (drawer) return
      if (e.key === "ArrowRight") go(1)
      if (e.key === "ArrowLeft") go(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [go, drawer])

  // Swipe
  const touch = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return
    const dx = e.changedTouches[0].clientX - touch.current.x
    const dy = e.changedTouches[0].clientY - touch.current.y
    touch.current = null
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1)
  }

  const mins = done ? null : recipe.stepMinutes?.[step]
  const timerHere = timer && timer.step === step
  const startTimer = () => {
    const secs = timerHere && timer.remaining > 0 ? timer.remaining : (mins ?? 0) * 60
    setNow(Date.now())
    setTimer({ step, remaining: secs, endAt: Date.now() + secs * 1000 })
  }
  const pauseTimer = () => timer && setTimer({ ...timer, remaining: left, endAt: null })
  const resetTimer = () => setTimer(null)

  const factor = servings / recipe.servings
  const ingredients = recipe.ingredients.map((i, idx) => (subs[idx] && FOOD_MAP[subs[idx]] ? { ...i, foodId: subs[idx], swapped: true } : { ...i, swapped: false }))

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-background lg:min-h-0">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/92 pt-safe backdrop-blur-md">
        <div className="flex h-14 items-center gap-3 pr-[calc(var(--gutter)-4px)] pl-3">
          <HeaderIconButton href={recipeHref} label="Close cook mode">
            <X className="size-[18px]" />
          </HeaderIconButton>
          <RecipeThumb recipe={recipe} size="xs" />
          <div className="min-w-0 flex-1">
            <p className="text-callout truncate font-semibold">{recipe.name}</p>
            <p className="tabular text-caption text-muted-foreground">{done ? "All steps done" : `Step ${step + 1} of ${total}`}</p>
          </div>
          <HeaderIconButton onClick={() => setDrawer(true)} label="Show ingredients">
            <ListChecks className="size-[19px]" />
          </HeaderIconButton>
        </div>
        <div className="px-gutter pb-3" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={Math.min(step + 1, total)} aria-label={done ? "All steps done" : `Step ${step + 1} of ${total}`}>
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
            {recipe.steps.map((_, i) => (
              <span key={i} className={cn("h-1.5 rounded-full transition-colors duration-200", i <= step ? "bg-lime" : "bg-border")} />
            ))}
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="px-gutter flex flex-1 flex-col pt-4 pb-6" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} aria-live="polite">
        {done ? (
          <DoneView recipe={recipe} child={child} recipeHref={recipeHref} />
        ) : (
          <div key={step} className="flex flex-1 flex-col motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200">
            <div className="flex items-center gap-2">
              <span className="tabular grid size-12 place-items-center rounded-full bg-lime text-[20px] font-bold text-charcoal">{step + 1}</span>
              <span className="text-overline text-muted-foreground">Step {step + 1}</span>
              {awake && (
                <span className="text-caption ml-auto inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                  <Sun className="size-3.5" aria-hidden /> Screen stays on
                </span>
              )}
            </div>

            <p className="mt-5 text-[26px] leading-[1.35] font-semibold tracking-[-0.01em] text-charcoal">{recipe.steps[step]}</p>

            {(byStep[step].length > 0 || (step === 0 && general.length > 0)) && (
              <div className="mt-5 space-y-2">
                {[...(step === 0 ? general : []), ...byStep[step]].map((n) => (
                  <p key={n} className="text-body flex gap-2.5 rounded-2xl bg-caution-surface p-4">
                    <ShieldAlert className="mt-0.5 size-5 shrink-0 text-caution" aria-hidden />
                    <span>
                      <span className="font-semibold">Safety: </span>
                      {n}
                    </span>
                  </p>
                ))}
              </div>
            )}

            {child && step === 0 && (
              <InfoNote title="Cooking for a little one" className="mt-5">
                Keep their portion free of added salt, sugar and chilli. Cook until very soft and check the texture before serving.
              </InfoNote>
            )}

            {mins ? (
              <div className="mt-6 rounded-3xl bg-card p-5 shadow-card">
                <div className="flex items-center gap-3">
                  <IconTile tone="sky">
                    <Timer />
                  </IconTile>
                  <div className="min-w-0 flex-1">
                    <p className="text-caption text-muted-foreground">Timer for this step · {minutesLabel(mins)}</p>
                    <p className="tabular text-[40px] leading-none font-bold tracking-tight" aria-live="off">
                      {mmss(timerHere ? left : mins * 60)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  {timerHere && timer.endAt ? (
                    <Button variant="secondary" className="flex-1" onClick={pauseTimer}>
                      <Pause className="size-4" /> Pause
                    </Button>
                  ) : (
                    <Button variant="secondary" className="flex-1" onClick={startTimer} disabled={!!timerHere && left === 0}>
                      <Play className="size-4" /> {timerHere && left > 0 && left < mins * 60 ? "Resume" : timerHere && left === 0 ? "Done" : "Start timer"}
                    </Button>
                  )}
                  <Button variant="outline" className="px-4" onClick={resetTimer} disabled={!timerHere} aria-label="Reset timer">
                    <RotateCcw className="size-4" /> Reset
                  </Button>
                </div>
                <p className="text-caption mt-3 text-muted-foreground">Times are a guide. Check doneness by look, texture and temperature, not the clock alone.</p>
              </div>
            ) : null}

            {timer && timer.step !== step && (timer.endAt || timer.remaining > 0) && (
              <button type="button" onClick={() => setStep(timer.step)} className="text-callout mt-5 inline-flex items-center gap-2 self-start rounded-full bg-sky-tint px-3.5 py-2 font-medium text-sky-text">
                <Timer className="size-4" aria-hidden />
                Step {timer.step + 1} timer · <span className="tabular">{mmss(left)}</span>
                {!timer.endAt && " (paused)"}
              </button>
            )}

            <p className="text-caption mt-auto pt-8 text-center text-muted-foreground">Swipe left or right to change steps</p>
          </div>
        )}
      </main>

      {/* Footer */}
      {!done && (
        <div className="px-gutter sticky bottom-0 z-20 border-t border-border/70 bg-background/95 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md">
          <div className="flex gap-2">
            <Button size="lg" variant="outline" className="px-5" onClick={() => (step === 0 ? router.push(recipeHref) : go(-1))} aria-label={step === 0 ? "Back to recipe" : "Previous step"}>
              <ChevronLeft className="size-5" /> {step === 0 ? "Recipe" : "Back"}
            </Button>
            <Button size="lg" className="flex-1" onClick={() => go(1)}>
              {step === total - 1 ? (
                <>
                  <CircleCheck className="size-5" /> Finish
                </>
              ) : (
                <>
                  Next step <ChevronRight className="size-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle className="text-title">Ingredients</SheetTitle>
            <SheetDescription className="text-callout">
              For {servings} serving{servings === 1 ? "" : "s"}
              {servings !== recipe.servings ? ` (scaled from ${recipe.servings})` : ""}
            </SheetDescription>
          </SheetHeader>
          <ul className="divide-y divide-border/70 px-5">
            {ingredients.map((i, idx) => {
              const f = FOOD_MAP[i.foodId]
              const g = i.grams * factor
              const unit = householdUnit(f, g)
              return (
                <li key={idx} className="flex items-center gap-3 py-3">
                  <FoodTile foodId={i.foodId} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-body font-medium">
                      {f?.name ?? i.foodId}
                      {i.optional && <span className="text-caption font-normal text-muted-foreground"> · optional</span>}
                    </p>
                    <p className="tabular text-caption text-muted-foreground">
                      <span className="font-semibold text-charcoal">{friendlyGrams(g)}</span>
                      {unit && ` ${unit}`}
                      {f && ` · ${STATE_LABEL[f.state].toLowerCase()} weight`}
                      {i.swapped && " · your swap"}
                      {!i.swapped && i.note && ` · ${i.note}`}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function DoneView({ recipe, child, recipeHref }: { recipe: Recipe; child: boolean; recipeHref: string }) {
  return (
    <div className="flex flex-1 flex-col motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200">
      <div className="mt-2 overflow-hidden rounded-3xl bg-card shadow-card">
        <RecipeThumb recipe={recipe} size="hero" className="h-48 rounded-none" />
        <div className="p-5 text-center">
          <span className="relative mx-auto -mt-12 grid size-14 place-items-center rounded-full bg-lime text-charcoal ring-4 ring-card">
            <CircleCheck className="size-7" />
          </span>
          <p className="text-title mt-3">{child ? "Ready to serve" : "Ready to eat"}</p>
          <p className="text-callout mx-auto mt-1 max-w-[18rem] text-muted-foreground">
            {child ? "Let it cool to a safe temperature and check the texture before serving." : "Enjoy your meal. Recording it helps compare what you ate with your plan."}
          </p>
        </div>
      </div>
      {child && (
        <InfoNote title="Responsive feeding" className="mt-4">
          {CHILD_FEEDING_NOTES.responsive} {CHILD_FEEDING_NOTES.choking}
        </InfoNote>
      )}
      <div className="mt-auto space-y-2 pt-6">
        <Button asChild size="lg" className="w-full">
          <Link href={`/log/new?recipe=${recipe.id}`}>{child ? "Record what they ate" : "Record this meal"}</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="w-full">
          <Link href={recipeHref}>Back to recipe</Link>
        </Button>
      </div>
    </div>
  )
}
