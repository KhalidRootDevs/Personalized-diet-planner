"use client"

// Edit a dependent child or household member (§5.10, §12.1, §42.9, §29.1).
// Children: caregiver edits allergies, conditions and feeding; read-only without child-data consent.
// Adults: only the safety restrictions they've shared are editable here; their health details stay
// private unless they've approved access.
import { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Lock, UserRound } from "lucide-react"
import { toast } from "sonner"
import { useApp } from "@/lib/store"
import { useAreaD, useAreaDSync } from "@/lib/area-d-store"
import { useConsent } from "@/lib/consent"
import { ageInMonths } from "@/lib/nutrition"
import { todayISO } from "@/lib/date"
import type { Allergen, Profile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState, PageBody, PageHeader, StickyFooter } from "@/components/app/page"
import { InfoNote, SafetyAlert } from "@/components/app/alerts"
import { ChipGroup, Field, FieldGroup, PillGroup } from "@/components/app/controls"
import { ALLERGENS, CHILD_CONDITIONS, DIETS, FEEDING_DIFFICULTIES } from "@/components/profile/options"

export default function FamilyMemberPage() {
  useAreaDSync()
  const { id } = useParams<{ id: string }>()
  const profile = useApp((s) => s.profiles.find((p) => p.id === id))
  if (!profile || profile.relation === "self")
    return (
      <>
        <PageHeader back="/profile/family" title="Family member" />
        <PageBody>
          <EmptyState icon={<UserRound />} title="Profile not found" description="It may have been removed." action={<Button asChild><Link href="/profile/family">Back to family</Link></Button>} />
        </PageBody>
      </>
    )
  return <MemberForm key={profile.id} profile={profile} />
}

function MemberForm({ profile }: { profile: Profile }) {
  const router = useRouter()
  const upsertProfile = useApp((s) => s.upsertProfile)
  const audit = useAreaD((s) => s.audit)
  const perm = useAreaD((s) => s.familyPermissions[profile.id])
  const childConsent = useConsent("child_data")
  const isChild = profile.relation === "child"
  const readOnly = isChild && !childConsent
  const canSeeHealth = isChild || perm?.health === true

  const [name, setName] = useState(profile.name)
  const [dob, setDob] = useState(profile.dateOfBirth)
  const [allergies, setAllergies] = useState<Allergen[]>(profile.allergies)
  const [conditions, setConditions] = useState<string[]>(profile.conditions)
  const [diet, setDiet] = useState<string[]>(profile.diet)
  const [feeding, setFeeding] = useState(profile.feeding)
  const months = ageInMonths(dob)

  const save = () => {
    const next: Profile = {
      ...profile,
      name: name.trim() || profile.name,
      dateOfBirth: dob,
      allergies,
      diet,
      conditions: canSeeHealth ? conditions : profile.conditions,
      feeding: isChild && months < 24 ? feeding : undefined,
      type: isChild ? (months < 12 ? "infant" : "child") : "adult",
    }
    upsertProfile(next)
    audit("Profile updated", isChild ? "Child profile details" : "Household member restrictions")
    toast.success("Saved", { description: allergies.length !== profile.allergies.length ? "Allergy protection updated for meals, swaps and shopping." : undefined })
    router.push("/profile/family")
  }

  return (
    <>
      <PageHeader back="/profile/family" title={profile.name} subtitle={isChild ? "Child profile · managed by you" : profile.relation === "partner" ? "Partner" : "Family member"} />
      <PageBody>
        {readOnly && (
          <InfoNote title="Read-only">
            You withdrew permission to store child information.{" "}
            <Link href="/profile/privacy" className="font-semibold text-forest underline underline-offset-2">
              Allow it again
            </Link>{" "}
            to make changes.
          </InfoNote>
        )}
        <fieldset disabled={readOnly} className="space-y-7 disabled:opacity-70">
          <FieldGroup title="Basics">
            <Field label="Name or nickname" htmlFor="m-name">
              <Input id="m-name" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Date of birth" htmlFor="m-dob" hint={isChild ? `${months < 24 ? `${months} months` : `${Math.floor(months / 12)} years`} old` : undefined}>
              <Input id="m-dob" type="date" max={todayISO()} value={dob} onChange={(e) => setDob(e.target.value)} />
            </Field>
          </FieldGroup>

          <FieldGroup title="Food allergies" description={isChild ? "Allergies a clinician has confirmed or advised you to avoid. These are safety rules for every meal and recipe." : "Restrictions they've shared with you, used to keep shared meals safe."}>
            <ChipGroup label="Allergies" value={allergies} onChange={setAllergies} options={ALLERGENS} />
            {allergies.length > 0 && <SafetyAlert title="Allergy protection on">Meals, swaps, recipes and shopping lists exclude {allergies.length === 1 ? "this allergen" : "these allergens"} for {name || profile.name}.</SafetyAlert>}
          </FieldGroup>

          {isChild ? (
            <>
              {months < 24 && (
                <FieldGroup title="Milk feeding">
                  <PillGroup label="Milk feeding" value={feeding} onChange={setFeeding} options={[{ value: "breastfeeding", label: "Breast milk" }, { value: "formula", label: "Formula" }, { value: "both", label: "Both" }]} />
                </FieldGroup>
              )}
              <FieldGroup title="Diagnosed conditions and feeding difficulties" description="Any of these keeps suggestions general and points you to your clinician.">
                <ChipGroup label="Conditions" value={conditions} onChange={setConditions} options={[...CHILD_CONDITIONS, ...FEEDING_DIFFICULTIES]} />
              </FieldGroup>
            </>
          ) : (
            <>
              <FieldGroup title="Food preferences">
                <ChipGroup label="Diet" value={diet} onChange={setDiet} options={DIETS} />
              </FieldGroup>
              {!canSeeHealth && (
                <InfoNote title="Health information is private">
                  <span className="flex items-start gap-2">
                    <Lock className="mt-0.5 size-4 shrink-0" aria-hidden /> Conditions and body measurements belong to {profile.name}. Ask for access from the Family screen; they decide.
                  </span>
                </InfoNote>
              )}
            </>
          )}
        </fieldset>
      </PageBody>
      <StickyFooter>
        <Button size="lg" onClick={save} disabled={readOnly || !name.trim()}>
          Save changes
        </Button>
      </StickyFooter>
    </>
  )
}
