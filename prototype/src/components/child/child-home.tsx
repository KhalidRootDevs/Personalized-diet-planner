"use client"

import Link from "next/link"
import { Baby, ChevronRight, Clock, Hand, HeartHandshake, Milk, Ruler, ShieldAlert, Siren, Soup, Utensils } from "lucide-react"
import { RECIPES } from "@/lib/data/recipes"
import { ageInMonths } from "@/lib/nutrition"
import { useApp } from "@/lib/store"
import { formatDay } from "@/lib/date"
import type { Profile } from "@/lib/types"
import { FeatureBadge } from "@/components/app/badges"
import { CautionNote, InfoNote } from "@/components/app/alerts"
import { IconTile, ListGroup, ListRow, Section, Surface } from "@/components/app/page"
import { RecipeThumb } from "@/components/app/recipe-thumb"
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
      <Surface tone="sage" padding="lg" className="relative overflow-hidden">
        <span className="absolute -top-14 -right-12 size-44 rounded-full bg-lime-card/60" aria-hidden />
        <div className="relative flex items-center gap-3">
          <span className="rounded-full bg-white p-1 shadow-card">
            <ProfileAvatar profile={{ ...profile, avatarColor: "sage" }} size="lg" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-caption flex flex-wrap items-center gap-1.5 font-medium text-lime-text">
              <Baby className="size-4" /> {profile.name} · {months} months <FeatureBadge feature="baby_module" />
            </p>
            <p className="text-title mt-0.5">{stage.title}</p>
          </div>
        </div>
        {stage.solidsPlanned && recipes.length > 0 && (
          <div className="relative mt-4 flex items-center">
            <div className="flex -space-x-3">
              {recipes.slice(0, 4).map((r) => (
                <RecipeThumb key={r.id} recipe={r} size="sm" className="ring-[3px] ring-sage" />
              ))}
            </div>
            <p className="text-caption ml-3 text-charcoal/80">First foods for this stage</p>
          </div>
        )}
        <p className="text-callout relative mt-4 text-charcoal/90">{stage.focus}</p>
        <dl className="relative mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-white/85 px-3 py-2.5">
            <dt className="text-caption flex items-center gap-1 text-muted-foreground">
              <Clock className="size-3.5 text-water" aria-hidden /> Feeding opportunities
            </dt>
            <dd className="text-callout mt-0.5 font-medium">{stage.opportunities}</dd>
          </div>
          <div className="rounded-xl bg-white/85 px-3 py-2.5">
            <dt className="text-caption flex items-center gap-1 text-muted-foreground">
              <Soup className="size-3.5 text-terracotta" aria-hidden /> Textures
            </dt>
            <dd className="text-callout mt-0.5 font-medium">{stage.textures}</dd>
          </div>
        </dl>
      </Surface>

      <CautionNote title="Guidance pending clinical review">
        This baby-feeding content is a prototype. Before launch, every rule and recipe is reviewed by pediatric nutrition professionals. Ask your clinician about your baby&apos;s individual needs.
      </CautionNote>

      <Section title="Today's feeding plan" description="Offer small amounts and follow your baby's cues. There is no amount your baby has to finish.">
        <ol className="space-y-3">
          <li className="flex items-center gap-3.5 rounded-2xl bg-card p-3 pr-4 shadow-card">
            <IconTile tone="sky" className="size-14 [&_svg]:size-6">
              <Milk />
            </IconTile>
            <div className="min-w-0 flex-1">
              <p className="text-body font-semibold">{milk}</p>
              <p className="text-caption mt-0.5 text-muted-foreground">Continue your baby&apos;s usual milk feeds, on demand</p>
            </div>
          </li>
          {stage.solidsPlanned &&
            recipes.slice(0, months < 7 ? 2 : 3).map((r, i) => (
              <li key={r.id}>
                <Link href={`/recipes/${r.id}`} className="flex items-center gap-3.5 rounded-2xl bg-card p-3 pr-4 shadow-card transition-colors hover:bg-muted/40">
                  <RecipeThumb recipe={r} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="text-caption text-muted-foreground">Feeding opportunity {i + 1}</p>
                    <p className="text-body font-semibold">{r.name}</p>
                    {r.texture && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-sage px-2 py-0.5 text-[11px] font-medium text-lime-text">
                        <Soup className="size-3" aria-hidden /> {r.texture}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="size-[18px] shrink-0 text-muted-grey" aria-hidden />
                </Link>
              </li>
            ))}
        </ol>
        {!stage.solidsPlanned && (
          <InfoNote title="No solid foods yet">Most babies are ready for first foods around 6 months, when they can sit with support and show interest in food. Every baby is different.</InfoNote>
        )}
      </Section>

      <Section title="Follow your baby's cues" description="Feed patiently and never force your baby to finish a serving.">
        <div className="grid grid-cols-2 gap-3">
          {RESPONSIVE_FEEDING.map((c, i) => (
            <Surface key={c.cue}>
              <IconTile size="sm" tone={i === 0 ? "amber" : "sky"}>
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
          <ListRow href="/child/foods" icon={<Utensils />} iconTone="lime" title="Food introduction" description={`${introduced.length} foods so far${lastIntro ? ` · latest: ${lastIntro.foodName}` : ""}`} />
          <ListRow
            href="/child/growth"
            icon={<Ruler />}
            iconTone="sky"
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
