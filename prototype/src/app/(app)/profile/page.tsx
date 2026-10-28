"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, ClipboardCheck, Crown, Globe, Link2, LogOut, Pencil, Settings, ShieldCheck, Stethoscope, TriangleAlert, Users } from "lucide-react"
import { useApp, useSelfProfile } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { PageBody, PageHeader, Section, ListLink } from "@/components/app/page"
import { PhaseBadge, TierPill } from "@/components/app/badges"
import { ProfileAvatar, profileAgeLabel } from "@/components/app/profile-switcher"
import { ALLERGENS, GOAL_LABEL } from "@/components/profile/options"

export default function ProfilePage() {
  const router = useRouter()
  const self = useSelfProfile()
  const user = useApp((s) => s.user)
  const profiles = useApp((s) => s.profiles)
  const tier = useApp((s) => s.tier)
  const signOut = useApp((s) => s.signOut)
  const dependents = profiles.filter((p) => p.relation !== "self")

  return (
    <>
      <PageHeader large title="Profile" />
      <PageBody>
        {self && (
          <div className="rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <ProfileAvatar profile={self} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-semibold">{self.name}</p>
                <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <Button asChild size="icon" variant="ghost" aria-label="Edit profile">
                <Link href="/profile/edit">
                  <Pencil className="size-4" />
                </Link>
              </Button>
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-xl bg-muted/60 p-2">
                <dt className="text-xs text-muted-foreground">Age</dt>
                <dd className="tabular font-medium">{profileAgeLabel(self)}</dd>
              </div>
              <div className="rounded-xl bg-muted/60 p-2">
                <dt className="text-xs text-muted-foreground">Height</dt>
                <dd className="tabular font-medium">{self.heightCm ? `${self.heightCm} cm` : "—"}</dd>
              </div>
              <div className="rounded-xl bg-muted/60 p-2">
                <dt className="text-xs text-muted-foreground">Weight</dt>
                <dd className="tabular font-medium">{self.weightKg ? `${self.weightKg} kg` : "—"}</dd>
              </div>
            </dl>
            <p className="mt-3 text-sm">
              <span className="text-muted-foreground">Goal: </span>
              {GOAL_LABEL[self.goal ?? ""] ?? "Not set"}
            </p>
            {self.allergies.length > 0 && (
              <p className="mt-1 flex items-center gap-1.5 text-sm">
                <ShieldCheck className="size-4 text-forest" aria-hidden />
                Allergy protection: {self.allergies.map((a) => ALLERGENS.find((x) => x.value === a)?.label ?? a).join(", ")}
              </p>
            )}
          </div>
        )}

        <Link href="/subscription" className="flex items-center gap-3 rounded-2xl bg-forest p-4 text-ivory">
          <Crown className="size-5 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-medium">{tier === "free" ? "Explore Premium" : "Your subscription"}</p>
            <p className="text-sm text-ivory/80">{tier === "free" ? "Coach, smarter swaps, family planning and more" : "Manage plan and billing"}</p>
          </div>
          <TierPill className="bg-ivory/15 text-ivory" />
        </Link>

        <Section title="Family" action={<Link href="/profile/family" className="text-sm font-medium text-forest">Manage</Link>}>
          {dependents.length === 0 ? (
            <ListLink href="/profile/family" icon={<Users className="size-5" />} title="Add a child profile" description="Baby feeding and child nutrition" />
          ) : (
            <div className="space-y-2">
              {dependents.map((d) => (
                <ListLink key={d.id} href="/profile/family" icon={<ProfileAvatar profile={d} />} title={d.name} description={`${profileAgeLabel(d)} · managed by you`} className="[&>div:first-child]:bg-transparent" />
              ))}
            </div>
          )}
        </Section>

        <Section title="Account">
          <div className="space-y-2">
            <ListLink href="/profile/edit" icon={<Pencil className="size-5" />} title="Personal details" description="Body, goal, lifestyle, food and health" />
            <ListLink href="/profile/notifications" icon={<Bell className="size-5" />} title="Reminders" description="Meals, prep, logging and weekly review" />
            <ListLink href="/profile/privacy" icon={<ShieldCheck className="size-5" />} title="Privacy and data" description="Permissions, export and deletion" />
            <ListLink href="/profile/integrations" icon={<Link2 className="size-5" />} title={<>Connected apps <PhaseBadge phase={2} /></>} description="Calendar, health apps and wearables" />
            <ListLink href="/profile/professional" icon={<Stethoscope className="size-5" />} title={<>Share with a dietitian <PhaseBadge phase={3} /></>} description="Access controls and reports" />
            <ListLink href="/profile/settings" icon={<Settings className="size-5" />} title="App settings" description="Language and prototype options" />
          </div>
        </Section>

        <Section title="Help and safety">
          <div className="space-y-2">
            <ListLink href="/safety/emergency" icon={<TriangleAlert className="size-5" />} title="Emergency guidance" description="When to stop and get medical help" />
            <ListLink href="/admin/reviews" icon={<ClipboardCheck className="size-5" />} title="Clinical review queue" description="Admin view (prototype)" />
          </div>
        </Section>

        <div className="space-y-3 pt-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              signOut()
              router.replace("/welcome")
            }}
          >
            <LogOut className="size-4" /> Sign out
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <Globe className="size-3.5" aria-hidden /> NutriPlan prototype · v0.1 · Bangladesh
          </p>
        </div>
      </PageBody>
    </>
  )
}
