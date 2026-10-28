"use client"

import { Baby, Hand, HeartHandshake, Milk, Ruler, ShieldAlert, Siren, Utensils } from "lucide-react"
import { RECIPES } from "@/lib/data/recipes"
import { ageInMonths } from "@/lib/nutrition"
import { useApp } from "@/lib/store"
import { formatDay } from "@/lib/date"
import type { Profile } from "@/lib/types"
import { FeatureBadge } from "@/components/app/badges"
import { CautionNote, InfoNote } from "@/components/app/alerts"
import { IconTile, ListGroup, ListRow, Section, Surface } from "@/components/app/page"
import { DataIcon } from "@/components/app/icon"
import { ProfileAvatar } from "@/components/app/profile-switcher"
import { RESPONSIVE_FEEDING, SAFETY_ESSENTIALS, feedingStage } from "./feeding"

/**
 * Baby / young-child dashboard (§12, §12.8, §42.10, §44.9). Caregiver language,
 * milestones and textures — never calories, adult targets or scores.
 * Renders its own screen body (gutter + section rhythm) so it can sit directly
 * under the Home header or the /child header.
 */
export function ChildHome({ profile }: { profile: Profile }) {
  const allIntroduced = useApp((s) => s.introduced)
  const allGrowth = useApp((s) => s.growth)
  const introduced = allIntroduced.filter((f) => f.profileId === profile.id)
  const growth = allGrowth.filter((g) => g.profileId === profile.id)
  const months = ageInMonths(profile.dateOfBirth)
  const stage = feedingStage(months)
  const recipes = RECIPES.filter((r) => r.profile === "infant" && (r.minAgeMonths ?? 0) <= months)
  const latestGrowth = [...growth].sort((a, b) => b.date.localeCompare(a.date))[0]
  const lastIntro = [...introduced].sort((a, b) => b.date.localeCompare(a.date))[0]
  const milk = profile.feeding === "formula" ? "Formula" : profile.feeding === "both" ? "Breast milk and formula" : "Breast milk"

  return (
    <div className="px-gutter space-y-7 pt-1 pb-8">
      <Surface tone="sage" padding="lg">
        <div className="flex items-center gap-3">
          <ProfileAvatar profile={{ ...profile, avatarColor: "forest" }} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-caption flex items-center gap-1.5 text-forest">
              <Baby className="size-4" /> {profile.name} · {months} months <FeatureBadge feature="baby_module" />
            </p>
            <p className="mt-0.5 font-serif text-[24px] leading-7 font-medium">{stage.title}</p>
          </div>
        </div>
        <p className="text-callout mt-4 text-charcoal/90">{stage.focus}</p>
        <dl className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-card/85 px-3 py-2.5">
            <dt className="text-caption text-muted-foreground">Feeding opportunities</dt>
            <dd className="text-callout mt-0.5 font-medium">{stage.opportunities}</dd>
          </div>
          <div className="rounded-xl bg-card/85 px-3 py-2.5">
            <dt className="text-caption text-muted-foreground">Textures</dt>
            <dd className="text-callout mt-0.5 font-medium">{stage.textures}</dd>
          </div>
        </dl>
      </Surface>

      <CautionNote title="Guidance pending clinical review">
        This baby-feeding content is a prototype. Before launch, every rule and recipe is reviewed by pediatric nutrition professionals. Ask your clinician about your baby&apos;s individual needs.
      </CautionNote>

      <Section title="Today's feeding plan" description="Offer small amounts and follow your baby's cues. There is no amount your baby has to finish.">
        <ListGroup>
          <ListRow icon={<Milk />} title={milk} description="Continue your baby's usual milk feeds, on demand" />
          {stage.solidsPlanned &&
            recipes.slice(0, months < 7 ? 2 : 3).map((r, i) => (
              <ListRow
                key={r.id}
                href={`/recipes/${r.id}`}
                icon={<DataIcon name={r.icon} />}
                title={r.name}
                description={`Feeding opportunity ${i + 1} · ${r.texture}`}
              />
            ))}
        </ListGroup>
        {!stage.solidsPlanned && (
          <InfoNote title="No solid foods yet">Most babies are ready for first foods around 6 months, when they can sit with support and show interest in food. Every baby is different.</InfoNote>
        )}
      </Section>

      <Section title="Follow your baby's cues" description="Feed patiently and never force your baby to finish a serving.">
        <div className="grid grid-cols-2 gap-3">
          {RESPONSIVE_FEEDING.map((c, i) => (
            <Surface key={c.cue}>
              <IconTile size="sm" tone={i === 0 ? "sage" : "muted"}>
                {i === 0 ? <Hand /> : <HeartHandshake />}
              </IconTile>
              <p className="text-body mt-3 font-medium">{c.cue}</p>
              <p className="text-caption mt-1 text-muted-foreground">{c.examples}</p>
            </Surface>
          ))}
        </div>
      </Section>

      <Section title="Tracking">
        <ListGroup>
          <ListRow href="/child/foods" icon={<Utensils />} title="Food introduction" description={`${introduced.length} foods so far${lastIntro ? ` · latest: ${lastIntro.foodName}` : ""}`} />
          <ListRow
            href="/child/growth"
            icon={<Ruler />}
            title="Growth measurements"
            description={latestGrowth ? `${latestGrowth.weightKg ?? "–"} kg · ${latestGrowth.lengthCm ?? "–"} cm on ${formatDay(latestGrowth.date, { day: "numeric", month: "short" })}` : "No measurements yet"}
          />
        </ListGroup>
      </Section>

      <Section title="Safety essentials">
        <div className="rounded-2xl border border-safety/20 bg-safety-surface">
          <div className="flex items-center gap-2 px-4 pt-4 pb-2">
            <ShieldAlert className="size-5 text-safety" aria-hidden />
            <p className="text-callout font-semibold text-safety">Check before every meal</p>
          </div>
          <ul className="divide-y divide-safety/10">
            {SAFETY_ESSENTIALS.map((s) => (
              <li key={s.title} className="px-4 py-3">
                <p className="text-callout font-semibold text-charcoal">{s.title}</p>
                <p className="text-caption mt-0.5 text-charcoal/80">{s.body}</p>
              </li>
            ))}
          </ul>
        </div>
        <ListGroup>
          <ListRow href="/safety/emergency" icon={<Siren />} iconTone="safety" title="Breathing difficulty, swelling or choking?" description="Open emergency guidance" />
        </ListGroup>
      </Section>
    </div>
  )
}
