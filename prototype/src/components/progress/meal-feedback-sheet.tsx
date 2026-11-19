"use client"

// Post-meal feedback (§17.5). Reusable by any screen that knows a planned meal: e.g. after
// "Mark as eaten". Feedback improves future selection but never overrides safety constraints.
import { useState } from "react"
import { create } from "zustand"
import { toast } from "sonner"
import { useAreaD, type MealFeedback } from "@/lib/area-d-store"
import { track } from "@/lib/analytics"
import { useRecipeLookup } from "@/lib/area-c-utils"
import { MEAL_LABEL } from "@/lib/planning"
import type { PlannedMeal } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Field, Segmented } from "@/components/app/controls"

type YesNo = "yes" | "no"

/** Opens the feedback sheet from anywhere (e.g. right after "Mark as eaten"). Optional and dismissible. */
export const useFeedbackPrompt = create<{ meal: PlannedMeal | null; ask: (m: PlannedMeal) => void; close: () => void }>((set) => ({
  meal: null,
  ask: (meal) => set({ meal }),
  close: () => set({ meal: null }),
}))

/** Mount once in the app layout. */
export function FeedbackHost() {
  const meal = useFeedbackPrompt((s) => s.meal)
  const close = useFeedbackPrompt((s) => s.close)
  return <MealFeedbackSheet meal={meal} open={!!meal} onOpenChange={(o) => !o && close()} />
}

export function MealFeedbackSheet({ meal, open, onOpenChange }: { meal: PlannedMeal | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const lookup = useRecipeLookup()
  const recipe = meal ? lookup(meal.recipeId) : undefined
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>How was it?</SheetTitle>
          <SheetDescription>{recipe ? `${recipe.name} · ${meal ? MEAL_LABEL[meal.mealType].toLowerCase() : ""}` : "Your meal"}. Optional — it helps shape your next plan.</SheetDescription>
        </SheetHeader>
        {meal && <FeedbackForm key={meal.id} meal={meal} onDone={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  )
}

function FeedbackForm({ meal, onDone }: { meal: PlannedMeal; onDone: () => void }) {
  const existing = useAreaD((s) => s.mealFeedback.find((f) => f.mealId === meal.id))
  const addFeedback = useAreaD((s) => s.addFeedback)
  const [portion, setPortion] = useState<MealFeedback["portion"]>(existing?.portion ?? "right")
  const [enjoyed, setEnjoyed] = useState<MealFeedback["enjoyed"]>(existing?.enjoyed ?? "yes")
  const [again, setAgain] = useState<YesNo>(existing ? (existing.again ? "yes" : "no") : "yes")
  const [available, setAvailable] = useState<YesNo>(existing?.ingredientsAvailable === false ? "no" : "yes")
  const [easy, setEasy] = useState<YesNo>(existing?.easyToPrepare === false ? "no" : "yes")
  const yn = [
    { value: "yes" as const, label: "Yes" },
    { value: "no" as const, label: "No" },
  ]
  return (
    <form
      className="space-y-5 px-5 pt-2"
      onSubmit={(e) => {
        e.preventDefault()
        addFeedback({ mealId: meal.id, recipeId: meal.recipeId, date: meal.date, mealType: meal.mealType, portion, enjoyed, again: again === "yes", ingredientsAvailable: available === "yes", easyToPrepare: easy === "yes" })
        track("meal_feedback_saved", { portion, enjoyed, again: again === "yes" })
        toast.success("Thanks — saved", { description: "We'll use this when you approve your next plan." })
        onDone()
      }}
    >
      <Field label="Was the portion right?">
        <Segmented label="Portion" value={portion} onChange={setPortion} options={[{ value: "too_little", label: "Too little" }, { value: "right", label: "About right" }, { value: "too_much", label: "Too much" }]} />
      </Field>
      <Field label="Did you enjoy it?">
        <Segmented label="Enjoyed" value={enjoyed} onChange={setEnjoyed} options={[{ value: "yes", label: "Yes" }, { value: "somewhat", label: "Somewhat" }, { value: "no", label: "Not really" }]} />
      </Field>
      <Field label="Would you eat it again?">
        <Segmented label="Again" value={again} onChange={setAgain} options={yn} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Ingredients easy to get?">
          <Segmented label="Ingredients available" value={available} onChange={setAvailable} options={yn} />
        </Field>
        <Field label="Easy to prepare?">
          <Segmented label="Easy to prepare" value={easy} onChange={setEasy} options={yn} />
        </Field>
      </div>
      <p className="text-caption text-muted-foreground">Feedback can change which safe options are preferred. It never changes allergy protection or nutrition rules.</p>
      <Button type="submit" size="lg" className="w-full">
        Save feedback
      </Button>
    </form>
  )
}
