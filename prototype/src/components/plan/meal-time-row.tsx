"use client"

/** Meal-time row used by plan settings and plan generation (UI-SPEC §4.4, §4.6). */
import { Apple, Coffee, CupSoda, Moon, Sun, Sunrise, Sunset, Utensils } from "lucide-react"
import { ListRow, type IconTone } from "@/components/app/page"
import { Input } from "@/components/ui/input"
import { MEAL_LABEL } from "@/lib/planning"
import type { MealType } from "@/lib/types"

const LOOK: Record<MealType, { icon: React.ReactNode; tone: IconTone }> = {
  breakfast: { icon: <Sunrise />, tone: "amber" },
  morning_snack: { icon: <Coffee />, tone: "terracotta" },
  lunch: { icon: <Sun />, tone: "lime" },
  afternoon_snack: { icon: <Apple />, tone: "terracotta" },
  dinner: { icon: <Moon />, tone: "sky" },
  evening_snack: { icon: <Sunset />, tone: "amber" },
  drinks: { icon: <CupSoda />, tone: "sky" },
  other: { icon: <Utensils />, tone: "sage" },
}

export function mealLook(t: MealType) {
  return LOOK[t] ?? LOOK.other
}

/** A grouped-list row with the meal's icon and a time input wide enough for "08:30 AM". */
export function MealTimeRow({ id, mealType, value, onChange }: { id: string; mealType: MealType; value: string; onChange: (v: string) => void }) {
  const look = mealLook(mealType)
  return (
    <ListRow
      icon={look.icon}
      iconTone={look.tone}
      title={<label htmlFor={id}>{MEAL_LABEL[mealType]}</label>}
      trailing={<Input id={id} type="time" className="tabular w-[136px] shrink-0 px-3.5" value={value} onChange={(e) => onChange(e.target.value)} />}
    />
  )
}
