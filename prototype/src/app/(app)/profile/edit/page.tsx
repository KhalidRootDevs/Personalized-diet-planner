"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useApp, useSelfProfile } from "@/lib/store"
import type { Allergen, Profile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { PageBody, PageHeader, Section } from "@/components/app/page"
import { CautionNote, SafetyAlert } from "@/components/app/alerts"
import { Splash } from "@/components/app/shell"
import { ChipGroup, Field, PillGroup } from "@/components/app/controls"
import { TargetsCard } from "@/components/profile/targets-card"
import { ACTIVITY, ALLERGENS, CONDITIONS, DIETS, GOALS, OCCUPATIONS, REVIEW_CONDITIONS } from "@/components/profile/options"

export default function EditProfilePage() {
  const self = useSelfProfile()
  if (!self) return <Splash />
  return <EditForm initial={self} />
}

function EditForm({ initial }: { initial: Profile }) {
  const router = useRouter()
  const upsertProfile = useApp((s) => s.upsertProfile)
  const healthConsent = useApp((s) => s.consents.find((c) => c.type === "health_data")?.granted ?? false)
  const [p, setP] = useState<Profile>(initial)
  const set = (patch: Partial<Profile>) => setP((x) => ({ ...x, ...patch }))
  const removedAllergies = initial.allergies.filter((a) => !p.allergies.includes(a))
  const dirty = JSON.stringify(p) !== JSON.stringify(initial)

  const save = () => {
    upsertProfile(p)
    toast.success("Profile updated", { description: "Targets recalculated. Your next generated plan will use them." })
    router.push("/profile")
  }

  return (
    <>
      <PageHeader back="/profile" title="Personal details" action={<Button size="sm" variant="ghost" disabled={!dirty} onClick={save}>Save</Button>} />
      <PageBody>
        <Section title="Your starting ranges">
          <TargetsCard profile={p} />
        </Section>

        <Section title="Your details">
        <Accordion type="multiple" defaultValue={["body"]} className="divide-y divide-border/70 rounded-2xl border border-border/80 bg-card px-4 [&>[data-slot=accordion-item]]:border-b-0">
          <AccordionItem value="body">
            <AccordionTrigger className="text-body py-4 font-semibold hover:no-underline">Body and basics</AccordionTrigger>
            <AccordionContent className="space-y-5 pt-1 pb-5">
              <Field label="Name" htmlFor="name">
                <Input id="name" value={p.name} onChange={(e) => set({ name: e.target.value })} />
              </Field>
              <Field label="Date of birth" htmlFor="dob">
                <Input id="dob" type="date" value={p.dateOfBirth} onChange={(e) => set({ dateOfBirth: e.target.value })} />
              </Field>
              <Field label="Sex">
                <PillGroup label="Sex" value={p.sex} onChange={(v) => set({ sex: v })} options={[{ value: "female", label: "Female" }, { value: "male", label: "Male" }]} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Height (cm)" htmlFor="h">
                  <Input id="h" type="number" inputMode="decimal" value={p.heightCm ?? ""} onChange={(e) => set({ heightCm: Number(e.target.value) || undefined })} />
                </Field>
                <Field label="Weight (kg)" htmlFor="w">
                  <Input id="w" type="number" inputMode="decimal" value={p.weightKg ?? ""} onChange={(e) => set({ weightKg: Number(e.target.value) || undefined })} />
                </Field>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="goal">
            <AccordionTrigger className="text-body py-4 font-semibold hover:no-underline">Goal and lifestyle</AccordionTrigger>
            <AccordionContent className="space-y-5 pt-1 pb-5">
              <Field label="Main goal">
                <PillGroup label="Goal" value={p.goal} onChange={(v) => set({ goal: v })} options={GOALS.map((g) => ({ value: g.value, label: g.label }))} />
              </Field>
              {p.goal === "lose_weight" && p.conditions.some((c) => ["eating_disorder", "pregnancy", "breastfeeding"].includes(c)) && (
                <CautionNote title="We won't plan a calorie deficit">With what you&apos;ve told us, restriction isn&apos;t safe to automate. Your plan will focus on balanced, regular meals.</CautionNote>
              )}
              <Field label="Occupation">
                <PillGroup label="Occupation" value={p.occupation} onChange={(v) => set({ occupation: v })} options={OCCUPATIONS} />
              </Field>
              <Field label="Daily activity">
                <PillGroup label="Activity" value={p.activity} onChange={(v) => set({ activity: v })} options={ACTIVITY} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Work starts" htmlFor="ws">
                  <Input id="ws" type="time" value={p.workStart ?? ""} onChange={(e) => set({ workStart: e.target.value })} />
                </Field>
                <Field label="Work ends" htmlFor="we">
                  <Input id="we" type="time" value={p.workEnd ?? ""} onChange={(e) => set({ workEnd: e.target.value })} />
                </Field>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="food">
            <AccordionTrigger className="text-body py-4 font-semibold hover:no-underline">Food, budget and cooking</AccordionTrigger>
            <AccordionContent className="space-y-5 pt-1 pb-5">
              <Field label="Dietary preferences">
                <ChipGroup label="Dietary preferences" value={p.diet} onChange={(v) => set({ diet: v })} options={DIETS} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Weekly budget (৳)" htmlFor="b">
                  <Input id="b" type="number" inputMode="numeric" value={p.budgetPerWeekBdt ?? ""} onChange={(e) => set({ budgetPerWeekBdt: Number(e.target.value) || undefined })} />
                </Field>
                <Field label="Max prep (min)" htmlFor="prep">
                  <Input id="prep" type="number" inputMode="numeric" value={p.maxPrepMinutes ?? ""} onChange={(e) => set({ maxPrepMinutes: Number(e.target.value) || undefined })} />
                </Field>
              </div>
              <Field label="Meals per day">
                <PillGroup label="Meals per day" value={String(p.mealsPerDay ?? 3)} onChange={(v) => set({ mealsPerDay: Number(v) })} options={["3", "4", "5"].map((v) => ({ value: v, label: v }))} />
              </Field>
              <label className="text-body flex min-h-12 items-center justify-between rounded-xl bg-muted px-4">
                Include snacks
                <Switch checked={!!p.includeSnacks} onCheckedChange={(v) => set({ includeSnacks: v })} />
              </label>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="health" className="border-b-0">
            <AccordionTrigger className="text-body py-4 font-semibold hover:no-underline">Allergies and health</AccordionTrigger>
            <AccordionContent className="space-y-5 pt-1 pb-5">
              {!healthConsent ? (
                <CautionNote title="Health permission is off">Turn it on in Privacy and data to record allergies and conditions.</CautionNote>
              ) : (
                <>
                  <Field label="Food allergies" hint="Hard safety rules everywhere in the app.">
                    <ChipGroup<Allergen> label="Food allergies" value={p.allergies} onChange={(v) => set({ allergies: v })} options={ALLERGENS} />
                  </Field>
                  {removedAllergies.length > 0 && (
                    <SafetyAlert title="Removing an allergy">
                      Only remove an allergy if a doctor has confirmed it&apos;s safe. Foods containing {removedAllergies.join(", ")} may appear in your plans again.
                    </SafetyAlert>
                  )}
                  <Field label="Conditions">
                    <ChipGroup label="Conditions" value={p.conditions} onChange={(v) => set({ conditions: v })} options={CONDITIONS} />
                  </Field>
                  {p.conditions.some((c) => REVIEW_CONDITIONS.includes(c)) && (
                    <CautionNote title="Professional review needed">New plans will use general guidance and be flagged for review by a qualified professional.</CautionNote>
                  )}
                </>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        </Section>

        <Button size="lg" className="w-full" disabled={!dirty} onClick={save}>
          Save changes
        </Button>
        <p className="text-caption -mt-4 text-center text-muted-foreground">Saving doesn&apos;t change your active plan. Generate a new plan to use updated targets.</p>
      </PageBody>
    </>
  )
}
