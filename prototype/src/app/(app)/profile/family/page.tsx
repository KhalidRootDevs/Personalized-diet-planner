"use client"

// Dependent child profiles are Phase 1 and free (§5.10); other adult members need household
// permissions and belong to Family Nutrition (Phase 2, §42.9, §29.1).
import { useState } from "react"
import Link from "next/link"
import { Baby, Trash2, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { useApp } from "@/lib/store"
import { ageInMonths } from "@/lib/nutrition"
import { addDays, todayISO, uid } from "@/lib/date"
import type { Profile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EmptyState, ListGroup, PageBody, PageHeader, Section, SectionLink } from "@/components/app/page"
import { PhaseBadge, PremiumGate } from "@/components/app/badges"
import { InfoNote } from "@/components/app/alerts"
import { ProfileAvatar, profileAgeLabel } from "@/components/app/profile-switcher"
import { Field, PillGroup } from "@/components/app/controls"

const MOCK_MEMBERS = [
  { id: "m1", name: "Rafiq", relation: "Partner", avatarColor: "terracotta" as const },
  { id: "m2", name: "Amma", relation: "Mother", avatarColor: "sage" as const },
]

const PERMISSIONS = [
  { id: "shared_meals", label: "Shared meals and servings" },
  { id: "shopping", label: "Shared shopping list" },
  { id: "plan", label: "See their meal plan" },
  { id: "health", label: "See their health information" },
]

export default function FamilyPage() {
  const profiles = useApp((s) => s.profiles)
  const upsertProfile = useApp((s) => s.upsertProfile)
  const removeProfile = useApp((s) => s.removeProfile)
  const setActiveProfile = useApp((s) => s.setActiveProfile)
  const childConsent = useApp((s) => s.consents.find((c) => c.type === "child_data")?.granted ?? false)
  const setConsent = useApp((s) => s.setConsent)
  const children = profiles.filter((p) => p.relation === "child")

  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<Profile | null>(null)
  const [perms, setPerms] = useState<Record<string, Record<string, boolean>>>({
    m1: { shared_meals: true, shopping: true, plan: true, health: false },
    m2: { shared_meals: true, shopping: false, plan: false, health: false },
  })

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
                <div key={c.id} className="flex min-h-[64px] items-center gap-3 py-3 pr-2 pl-4">
                  <ProfileAvatar profile={c} />
                  <div className="min-w-0 flex-1">
                    <p className="text-body font-medium">{c.name}</p>
                    <p className="text-caption text-muted-foreground">
                      {profileAgeLabel(c)} · {c.type === "infant" ? "baby" : "child"}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/child" onClick={() => setActiveProfile(c.id)}>
                      Open
                    </Link>
                  </Button>
                  <Button size="icon" variant="ghost" className="text-muted-foreground" aria-label={`Remove ${c.name}`} onClick={() => setRemoving(c)}>
                    <Trash2 className="size-[18px]" />
                  </Button>
                </div>
              ))}
            </ListGroup>
          )}
          <InfoNote>Child profiles are free. You see their data as their caregiver; nobody else does unless you allow it.</InfoNote>
        </Section>

        <Section title="Household members" badge={<PhaseBadge phase={2} />}>
          <PremiumGate feature="family">
            <div className="space-y-3">
              {MOCK_MEMBERS.map((m) => (
                <div key={m.id} className="overflow-hidden rounded-2xl border border-border/80 bg-card">
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <ProfileAvatar profile={m} />
                    <div className="flex-1">
                      <p className="text-body font-medium">{m.name}</p>
                      <p className="text-caption text-muted-foreground">{m.relation} · their own account</p>
                    </div>
                  </div>
                  <div className="divide-y divide-border/70 border-t border-border/70">
                    {PERMISSIONS.map((perm) => (
                      <label key={perm.id} className="text-callout flex min-h-12 cursor-pointer items-center justify-between gap-3 px-4 py-2">
                        <span>{perm.label}</span>
                        <Switch
                          checked={perms[m.id][perm.id]}
                          onCheckedChange={(v) => {
                            setPerms((x) => ({ ...x, [m.id]: { ...x[m.id], [perm.id]: v } }))
                            if (perm.id === "health" && v) toast("Request sent", { description: `${m.name} must approve before you can see their health information.` })
                          }}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={() => toast("Invite link copied", { description: "Prototype: no invitation is sent." })}>
                <UserPlus className="size-[18px]" /> Invite a household member
              </Button>
              <InfoNote>Each adult controls their own health data. Shared meals give everyone the right portion — a baby never gets a smaller adult portion.</InfoNote>
            </div>
          </PremiumGate>
        </Section>
      </PageBody>

      <AddChildDialog
        open={adding}
        onOpenChange={setAdding}
        needsConsent={!childConsent}
        onSave={(c) => {
          if (!childConsent) setConsent("child_data", true)
          upsertProfile(c)
          toast.success(`${c.name} added`)
          setAdding(false)
        }}
      />

      <Dialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {removing?.name}&apos;s profile?</DialogTitle>
            <DialogDescription>This deletes their feeding records, growth records and food introductions from this device. It can&apos;t be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoving(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (removing) removeProfile(removing.id)
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
