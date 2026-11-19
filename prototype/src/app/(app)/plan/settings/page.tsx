"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { ListGroup, ListRow, PageBody, PageHeader, Section, StickyFooter } from "@/components/app/page"
import { Segmented } from "@/components/app/controls"
import { InfoNote } from "@/components/app/alerts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useActivePlan, useApp, useSelfProfile } from "@/lib/store"
import { MEAL_LABEL, SLOTS, defaultMealTimes, defaultMealsPerDay, validatePlan } from "@/lib/planning"
import { formatTime, todayISO } from "@/lib/date"
import type { MealType, Profile } from "@/lib/types"

/** Plan settings (§10.1 step 6, §10.3): meal structure and times, saved to the profile. */
export default function PlanSettingsPage() {
  const profile = useSelfProfile()
  return (
    <>
      <PageHeader title="Meal times & structure" back="/plan" />
      {profile && <SettingsForm profile={profile} />}
    </>
  )
}

function SettingsForm({ profile }: { profile: Profile }) {
  const router = useRouter()
  const upsertProfile = useApp((s) => s.upsertProfile)
  const updatePlan = useApp((s) => s.updatePlan)
  const plan = useActivePlan()
  const [count, setCount] = useState<3 | 4 | 5>(defaultMealsPerDay(profile))
  const [times, setTimes] = useState<Record<MealType, string>>(() => defaultMealTimes(profile))
  const [applyToPlan, setApplyToPlan] = useState(true)
  const slots = SLOTS[count]

  const save = () => {
    const next: Profile = { ...profile, mealsPerDay: count, includeSnacks: count > 3, mealTimes: Object.fromEntries(slots.map((s) => [s, times[s]])) }
    upsertProfile(next)
    let moved = 0
    if (applyToPlan && plan) {
      const today = todayISO()
      const meals = plan.meals.map((m) => {
        if (m.date < today || m.outcome || m.scheduleStatus === "rescheduled" || !times[m.mealType] || m.time === times[m.mealType]) return m
        moved++
        return { ...m, time: times[m.mealType] }
      })
      const updated = { ...plan, meals, settings: plan.settings ? { ...plan.settings, times: { ...plan.settings.times, ...next.mealTimes } } : plan.settings }
      updatePlan(plan.id, { meals, settings: updated.settings, validation: validatePlan(updated, next) })
    }
    toast("Meal times saved", { description: moved ? `${moved} upcoming meals moved. Timing re-checked.` : "New plans will use these times." })
    router.push("/plan")
  }

  return (
    <>
      <PageBody>
        <Section title="Meals each day" description="Snack count changes apply to your next generated plan.">
          <Segmented
            label="Meals each day"
            value={String(count) as "3" | "4" | "5"}
            onChange={(v) => setCount(Number(v) as 3 | 4 | 5)}
            options={[
              { value: "3", label: "3 meals" },
              { value: "4", label: "+1 snack" },
              { value: "5", label: "+2 snacks" },
            ]}
          />
        </Section>
        <Section title="Meal times" description={profile.workStart && profile.workEnd ? `Suggestions are based on your work hours (${formatTime(profile.workStart)}–${formatTime(profile.workEnd)}).` : undefined}>
          <ListGroup>
            {slots.map((s) => (
              <ListRow key={s} title={<label htmlFor={`st-${s}`}>{MEAL_LABEL[s]}</label>} trailing={<Input id={`st-${s}`} type="time" className="w-32" value={times[s]} onChange={(e) => setTimes({ ...times, [s]: e.target.value })} />} />
            ))}
          </ListGroup>
        </Section>
        {plan && (
          <ListGroup>
            <ListRow title={<label htmlFor="apply">Update upcoming meals in my plan</label>} description="Meals you've recorded or moved yourself stay as they are." trailing={<Switch id="apply" checked={applyToPlan} onCheckedChange={setApplyToPlan} />} />
          </ListGroup>
        )}
        <InfoNote>Meals are kept at least 90 minutes apart; we&apos;ll tell you if a time is very late or too close to another meal.</InfoNote>
      </PageBody>
      <StickyFooter>
        <Button size="lg" className="w-full" onClick={save}>
          Save
        </Button>
      </StickyFooter>
    </>
  )
}
