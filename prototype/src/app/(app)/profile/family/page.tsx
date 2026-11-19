"use client"

// Dependent child profiles are Phase 1 and free (§5.10); other adult members need household
// permissions and belong to Family Nutrition (Phase 2, §42.9, §29.1, FR-025, FR-052).
import { useState } from "react"
import Link from "next/link"
import { Baby, Copy, Link2, Pencil, Trash2, UserPlus, UsersRound } from "lucide-react"
import { toast } from "sonner"
import { useApp } from "@/lib/store"
import { useAreaD, useAreaDSync, type MemberPermission } from "@/lib/area-d-store"
import { useConsent } from "@/lib/consent"
import { track } from "@/lib/analytics"
import { ageInMonths } from "@/lib/nutrition"
import { addDays, todayISO, uid } from "@/lib/date"
import type { Allergen, Profile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EmptyState, ListGroup, ListRow, PageBody, PageHeader, Pill, Section, SectionLink } from "@/components/app/page"
import { FeatureBadge, PhaseBadge, PremiumGate, useFeature } from "@/components/app/badges"
import { InfoNote } from "@/components/app/alerts"
import { ProfileAvatar, profileAgeLabel } from "@/components/app/profile-switcher"
import { ChipGroup, Field, PillGroup } from "@/components/app/controls"
import { ALLERGENS } from "@/components/profile/options"
import { SharedMeal } from "@/components/family/shared-meal"

const PERMISSIONS: { id: MemberPermission; label: string }[] = [
  { id: "shared_meals", label: "Shared meals and servings" },
  { id: "shopping", label: "Shared shopping list" },
  { id: "plan", label: "See their meal plan" },
  { id: "health", label: "See their health information" },
]

const RELATION_LABEL: Record<string, string> = { partner: "Partner", family: "Family member" }

export default function FamilyPage() {
  useAreaDSync()
  const profiles = useApp((s) => s.profiles)
  const upsertProfile = useApp((s) => s.upsertProfile)
  const removeProfile = useApp((s) => s.removeProfile)
  const setActiveProfile = useApp((s) => s.setActiveProfile)
  const childConsent = useConsent("child_data")
  const setConsent = useApp((s) => s.setConsent)
  const perms = useAreaD((s) => s.familyPermissions)
  const setPerm = useAreaD((s) => s.setMemberPermission)
  const removeMemberPerms = useAreaD((s) => s.removeMember)
  const invites = useAreaD((s) => s.invites)
  const addInvite = useAreaD((s) => s.addInvite)
  const cancelInvite = useAreaD((s) => s.cancelInvite)
  const audit = useAreaD((s) => s.audit)
  const family = useFeature("family")
  const children = profiles.filter((p) => p.relation === "child")
  const adults = profiles.filter((p) => p.relation === "partner" || p.relation === "family")

  const [adding, setAdding] = useState(false)
  const [addingAdult, setAddingAdult] = useState(false)
  const [removing, setRemoving] = useState<Profile | null>(null)

  const copyInvite = (relation: "partner" | "family") => {
    const inv = addInvite(relation)
    const link = `${typeof window !== "undefined" ? window.location.origin : ""}/signup?invite=${inv.code}`
    navigator.clipboard?.writeText(link).catch(() => undefined)
    audit("Household invite created", `${RELATION_LABEL[relation]} invite link`)
    toast.success("Invite link copied", { description: "Prototype: nothing is sent. Share the link yourself; they join with their own account." })
  }

  return (
    <>
      <PageHeader back="/profile" title="Family" />
      <PageBody>
        <Section title="Children you manage" badge={<PhaseBadge phase={1} />} action={children.length > 0 && <SectionLink onClick={() => setAdding(true)}>Add a child</SectionLink>}>
          {children.length === 0 ? (
            <EmptyState icon={<Baby />} title="No child profiles yet" description="Add a baby or child to get age-appropriate feeding guidance, first-food tracking and growth records." action={<Button onClick={() => setAdding(true)}>Add a child</Button>} />
          ) : (
            <ListGroup>
              {children.map((c) => (
                <div key={c.id} className="flex min-h-[64px] items-center gap-2 py-3 pr-2 pl-4">
                  <ProfileAvatar profile={c} />
                  <div className="ml-1 min-w-0 flex-1">
                    <p className="text-body font-medium">{c.name}</p>
                    <p className="text-caption text-muted-foreground">
                      {profileAgeLabel(c)} · {c.type === "infant" ? "baby" : "child"}
                      {c.allergies.length > 0 && ` · ${c.allergies.length} ${c.allergies.length === 1 ? "allergy" : "allergies"}`}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/child" onClick={() => setActiveProfile(c.id)}>
                      Open
                    </Link>
                  </Button>
                  <Button asChild size="icon" variant="ghost" className="text-muted-foreground" aria-label={`Edit ${c.name}`}>
                    <Link href={`/profile/family/${c.id}`}>
                      <Pencil className="size-[18px]" />
                    </Link>
                  </Button>
                  <Button size="icon" variant="ghost" className="text-muted-foreground" aria-label={`Remove ${c.name}`} disabled={!childConsent} onClick={() => setRemoving(c)}>
                    <Trash2 className="size-[18px]" />
                  </Button>
                </div>
              ))}
            </ListGroup>
          )}
          <InfoNote>Child profiles are free. You see their data as their caregiver; nobody else does unless you allow it.</InfoNote>
        </Section>

        <Section title="Household members" badge={<FeatureBadge feature="family" />} description="Adults keep control of their own health information.">
          {!family.allowed ? (
            <PremiumGate feature="family" variant="row">
              {null}
            </PremiumGate>
          ) : (
            <div className="space-y-3">
              {adults.length === 0 && <InfoNote>No other adults yet. Add a partner or family member to plan shared meals.</InfoNote>}
              {adults.map((m) => {
                const p = perms[m.id] ?? { shared_meals: true, shopping: true, plan: false, health: false }
                return (
                  <div key={m.id} className="overflow-hidden rounded-2xl bg-card shadow-card">
                    <div className="flex items-center gap-3 py-3.5 pr-2 pl-4">
                      <ProfileAvatar profile={m} />
                      <div className="min-w-0 flex-1">
                        <p className="text-body font-medium">{m.name}</p>
                        <p className="text-caption text-muted-foreground">{RELATION_LABEL[m.relation]} · {profileAgeLabel(m)}</p>
                      </div>
                      <Button asChild size="icon" variant="ghost" className="text-muted-foreground" aria-label={`Edit ${m.name}`}>
                        <Link href={`/profile/family/${m.id}`}>
                          <Pencil className="size-[18px]" />
                        </Link>
                      </Button>
                      <Button size="icon" variant="ghost" className="text-muted-foreground" aria-label={`Remove ${m.name}`} onClick={() => setRemoving(m)}>
                        <Trash2 className="size-[18px]" />
                      </Button>
                    </div>
                    <div className="divide-y divide-border/70 border-t border-border/70">
                      {PERMISSIONS.map((perm) => {
                        const v = p[perm.id]
                        return (
                          <label key={perm.id} className="text-callout flex min-h-12 cursor-pointer items-center justify-between gap-3 px-4 py-2">
                            <span className="flex flex-wrap items-center gap-2">
                              {perm.label}
                              {v === "requested" && <Pill tone="outline">Waiting for {m.name}</Pill>}
                            </span>
                            <Switch
                              checked={v === true}
                              onCheckedChange={(on) => {
                                // Health information needs the other adult's own approval (§29.1).
                                const next = perm.id === "health" && on ? "requested" : on
                                setPerm(m.id, perm.id, next)
                                audit(on ? "Household permission requested" : "Household permission removed", `${perm.label} · ${RELATION_LABEL[m.relation]}`)
                                if (next === "requested") toast("Request sent", { description: `${m.name} must approve before you can see their health information.` })
                              }}
                            />
                          </label>
                        )
                      })}
                    </div>
                    {p.health === "requested" && (
                      <div className="border-t border-border/70 px-4 py-2.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="-ml-3"
                          onClick={() => {
                            setPerm(m.id, "health", true)
                            audit("Household permission approved", `Health information · ${RELATION_LABEL[m.relation]}`, "system")
                          }}
                        >
                          Simulate {m.name}&apos;s approval (prototype)
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => setAddingAdult(true)}>
                  <UserPlus className="size-[18px]" /> Add a member
                </Button>
                <Button variant="outline" onClick={() => copyInvite("partner")}>
                  <Link2 className="size-[18px]" /> Invite link
                </Button>
              </div>
              {invites.length > 0 && (
                <ListGroup label="Pending invites">
                  {invites.map((inv) => (
                    <ListRow
                      key={inv.id}
                      icon={<Copy />}
                      iconTone="muted"
                      title={<span className="tabular">Code {inv.code}</span>}
                      description={`${RELATION_LABEL[inv.relation]} · not sent by NutriPlan`}
                      trailing={
                        <Button size="sm" variant="ghost" onClick={() => cancelInvite(inv.id)}>
                          Cancel
                        </Button>
                      }
                    />
                  ))}
                </ListGroup>
              )}
            </div>
          )}
        </Section>

        <Section title="Shared family meal" badge={<FeatureBadge feature="family" />} description="One pot, the right serving for everyone. A baby never gets a smaller adult portion.">
          <PremiumGate feature="family" variant="row">
            {profiles.length < 2 ? (
              <ListGroup>
                <ListRow icon={<UsersRound />} title="Add a family member first" description="Shared meals compare servings across your household." />
              </ListGroup>
            ) : (
              <SharedMeal />
            )}
          </PremiumGate>
        </Section>
      </PageBody>

      <AddChildDialog
        open={adding}
        onOpenChange={setAdding}
        needsConsent={!childConsent}
        onSave={(c) => {
          if (!childConsent) {
            setConsent("child_data", true)
            audit("Consent granted", "Child information")
          }
          upsertProfile(c)
          audit("Child profile added", c.type === "infant" ? "Baby profile" : "Child profile")
          toast.success(`${c.name} added`)
          setAdding(false)
        }}
      />

      <AddAdultDialog
        open={addingAdult}
        onOpenChange={setAddingAdult}
        onSave={(p) => {
          upsertProfile(p)
          setPerm(p.id, "shared_meals", true)
          audit("Household member added", RELATION_LABEL[p.relation])
          track("family_member_added", { relation: p.relation })
          toast.success(`${p.name} added`, { description: "Their health information stays private unless they allow you to see it." })
          setAddingAdult(false)
        }}
      />

      <Dialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {removing?.name}&apos;s profile?</DialogTitle>
            <DialogDescription>
              {removing?.relation === "child" ? "This deletes their feeding records, growth records and food introductions from this device. It can't be undone." : "They'll no longer appear in shared meals or the shared shopping list."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoving(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (removing) {
                  removeProfile(removing.id)
                  removeMemberPerms(removing.id)
                  audit("Profile deleted", removing.relation === "child" ? "Child profile and its records" : "Household member")
                }
                toast("Profile removed")
                setRemoving(null)
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function AddChildDialog({ open, onOpenChange, onSave, needsConsent }: { open: boolean; onOpenChange: (o: boolean) => void; onSave: (p: Profile) => void; needsConsent: boolean }) {
  const [name, setName] = useState("")
  const [dob, setDob] = useState(addDays(todayISO(), -213))
  const [sex, setSex] = useState<"female" | "male">("female")
  const [feeding, setFeeding] = useState<"breastfeeding" | "formula" | "both">("breastfeeding")
  const [consent, setConsent] = useState(!needsConsent)
  const months = ageInMonths(dob)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a child</DialogTitle>
          <DialogDescription>Age-appropriate guidance only — never adult calorie equations.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Name or nickname" htmlFor="child-name">
            <Input id="child-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Date of birth" htmlFor="child-dob" hint={months >= 0 ? `${months < 24 ? `${months} months` : `${Math.floor(months / 12)} years`} old` : undefined}>
            <Input id="child-dob" type="date" max={todayISO()} value={dob} onChange={(e) => setDob(e.target.value)} />
          </Field>
          <Field label="Sex">
            <PillGroup label="Sex" value={sex} onChange={setSex} options={[{ value: "female", label: "Girl" }, { value: "male", label: "Boy" }]} />
          </Field>
          {months < 24 && (
            <Field label="Milk feeding">
              <PillGroup label="Milk feeding" value={feeding} onChange={setFeeding} options={[{ value: "breastfeeding", label: "Breast milk" }, { value: "formula", label: "Formula" }, { value: "both", label: "Both" }]} />
            </Field>
          )}
          {needsConsent && (
            <label className="text-callout flex items-start gap-3 rounded-xl bg-muted p-4">
              <Switch checked={consent} onCheckedChange={setConsent} className="mt-0.5" />
              <span className="text-muted-foreground">I&apos;m this child&apos;s parent or caregiver and allow NutriPlan to store their information for feeding guidance.</span>
            </label>
          )}
        </div>
        <DialogFooter>
          <Button
            size="lg"
            className="w-full"
            disabled={!name.trim() || !consent || months < 0}
            onClick={() => {
              onSave({
                id: uid("p"),
                type: months < 12 ? "infant" : "child",
                relation: "child",
                name: name.trim(),
                dateOfBirth: dob,
                sex,
                feeding: months < 24 ? feeding : undefined,
                diet: [],
                allergies: [],
                conditions: [],
                avatarColor: "sage",
              })
              setName("")
            }}
          >
            Add child
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AddAdultDialog({ open, onOpenChange, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; onSave: (p: Profile) => void }) {
  const [name, setName] = useState("")
  const [relation, setRelation] = useState<"partner" | "family">("partner")
  const [dob, setDob] = useState("1993-01-01")
  const [sex, setSex] = useState<"female" | "male">("male")
  const [allergies, setAllergies] = useState<Allergen[]>([])
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a household member</DialogTitle>
          <DialogDescription>For shared meals and shopping. They can later join with their own account to manage their own details.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Name" htmlFor="adult-name">
            <Input id="adult-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Relationship">
            <PillGroup label="Relationship" value={relation} onChange={setRelation} options={[{ value: "partner", label: "Spouse or partner" }, { value: "family", label: "Another family member" }]} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date of birth" htmlFor="adult-dob">
              <Input id="adult-dob" type="date" max={todayISO()} value={dob} onChange={(e) => setDob(e.target.value)} />
            </Field>
            <Field label="Sex">
              <PillGroup label="Sex" value={sex} onChange={setSex} options={[{ value: "female", label: "F" }, { value: "male", label: "M" }]} />
            </Field>
          </div>
          <Field label="Food allergies they've shared with you" hint="Used only to keep shared meals safe for them.">
            <ChipGroup label="Allergies" value={allergies} onChange={setAllergies} options={ALLERGENS} />
          </Field>
        </div>
        <DialogFooter>
          <Button
            size="lg"
            className="w-full"
            disabled={!name.trim()}
            onClick={() => {
              onSave({ id: uid("p"), type: "adult", relation, name: name.trim(), dateOfBirth: dob, sex, diet: [], allergies, conditions: [], avatarColor: "terracotta" })
              setName("")
              setAllergies([])
            }}
          >
            Add member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

