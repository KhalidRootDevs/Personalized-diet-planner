"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, ChevronRight, ClipboardCheck, Crown, Globe, Link2, LogOut, Pencil, Plus, Settings, ShieldCheck, Stethoscope, TriangleAlert } from "lucide-react"
import { useApp, useSelfProfile } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { HeaderIconButton, KeyValue, ListGroup, ListRow, PageBody, PageHeader, Section, SectionLink, StatTile, Surface } from "@/components/app/page"
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
      <PageBody className="pt-1">
        {self && (
          <Surface padding="lg">
            <div className="flex items-center gap-3.5">
              <ProfileAvatar profile={self} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="text-title truncate">{self.name}</p>
                <p className="text-callout truncate text-muted-foreground">{user?.email}</p>
              </div>
              <HeaderIconButton href="/profile/edit" label="Edit profile">
                <Pencil className="size-[18px]" />
              </HeaderIconButton>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <StatTile label="Age" value={profileAgeLabel(self).replace(" years", "")} unit="yrs" />
              <StatTile label="Height" value={self.heightCm ?? "—"} unit={self.heightCm ? "cm" : undefined} />
              <StatTile label="Weight" value={self.weightKg ?? "—"} unit={self.weightKg ? "kg" : undefined} />
            </div>
            <div className="mt-3 divide-y divide-border/70">
              <KeyValue label="Goal" value={GOAL_LABEL[self.goal ?? ""] ?? "Not set"} />
              {self.allergies.length > 0 && (
                <KeyValue
                  label={
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="size-4 text-forest" aria-hidden /> Allergy protection
                    </span>
                  }
                  value={self.allergies.map((a) => ALLERGENS.find((x) => x.value === a)?.label ?? a).join(", ")}
                />
              )}
            </div>
          </Surface>
        )}

        <Link href="/subscription" className="flex items-center gap-3.5 rounded-2xl bg-forest p-4 text-ivory transition-colors hover:bg-[#1d3f30]">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-ivory/12">
            <Crown className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-body font-semibold">{tier === "free" ? "Explore Premium" : "Your subscription"}</p>
            <p className="text-caption text-ivory/80">{tier === "free" ? "Coach, smarter swaps, family planning and more" : "Manage plan and billing"}</p>
          </div>
          <TierPill className="bg-ivory/15 text-ivory" />
          <ChevronRight className="size-[18px] shrink-0 text-ivory/70" aria-hidden />
        </Link>

        <Section title="Family" action={<SectionLink href="/profile/family">Manage</SectionLink>}>
          <ListGroup>
            {dependents.map((d) => (
              <ListRow key={d.id} href="/profile/family" icon={<ProfileAvatar profile={d} />} iconTone="white" title={d.name} description={`${profileAgeLabel(d)} · managed by you`} />
            ))}
            <ListRow href="/profile/family" icon={<Plus />} iconTone="muted" title={dependents.length ? "Add a profile" : "Add a child profile"} description={dependents.length ? undefined : "Baby feeding and child nutrition"} />
          </ListGroup>
        </Section>

        <Section title="Account">
          <ListGroup>
            <ListRow href="/profile/edit" icon={<Pencil />} title="Personal details" description="Body, goal, lifestyle, food and health" />
            <ListRow href="/profile/notifications" icon={<Bell />} title="Reminders" description="Meals, prep, logging and weekly review" />
            <ListRow href="/profile/privacy" icon={<ShieldCheck />} title="Privacy and data" description="Permissions, export and deletion" />
            <ListRow href="/profile/integrations" icon={<Link2 />} title={<>Connected apps <PhaseBadge phase={2} /></>} description="Calendar, health apps and wearables" />
            <ListRow href="/profile/professional" icon={<Stethoscope />} title={<>Share with a dietitian <PhaseBadge phase={3} /></>} description="Access controls and reports" />
            <ListRow href="/profile/settings" icon={<Settings />} title="App settings" description="Language and prototype options" />
          </ListGroup>
        </Section>

        <Section title="Help and safety">
          <ListGroup>
            <ListRow href="/safety/emergency" icon={<TriangleAlert />} iconTone="safety" title="Emergency guidance" description="When to stop and get medical help" />
            <ListRow href="/admin/reviews" icon={<ClipboardCheck />} iconTone="muted" title="Clinical review queue" description="Staff view (prototype)" />
          </ListGroup>
        </Section>

        <div className="space-y-4 pt-1">
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => {
              signOut()
              router.replace("/welcome")
            }}
          >
            <LogOut className="size-[18px]" /> Sign out
          </Button>
          <p className="text-caption flex items-center justify-center gap-1.5 text-center text-muted-foreground">
            <Globe className="size-3.5" aria-hidden /> NutriPlan prototype · v0.1 · Bangladesh
          </p>
        </div>
      </PageBody>
    </>
  )
}
