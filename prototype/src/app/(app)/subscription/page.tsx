"use client"

// Subscription tiers. Tier contents and prices are PROPOSALS (open decision §43.7 #1).
// Safety features are never paywalled (§30.1).
import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Check, Crown, Leaf, ShieldCheck, Stethoscope, UsersRound } from "lucide-react"
import { useApp } from "@/lib/store"
import { FEATURES, TIERS, tierAllows, type FeatureId } from "@/lib/features"
import type { Tier } from "@/lib/types"
import { fmt } from "@/lib/nutrition"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { IconTile, PageBody, PageHeader, Pill, Surface, type IconTone } from "@/components/app/page"
import { SCENE_PHOTO } from "@/lib/data/photos"
import { CautionNote, InfoNote } from "@/components/app/alerts"
import { PhaseBadge } from "@/components/app/badges"

const TIER_LOOK: Record<Tier, { tone: IconTone; icon: React.ReactNode }> = {
  free: { tone: "sage", icon: <Leaf /> },
  premium: { tone: "lime", icon: <Crown /> },
  family: { tone: "amber", icon: <UsersRound /> },
  professional: { tone: "sky", icon: <Stethoscope /> },
}

export default function SubscriptionPage() {
  return (
    <Suspense>
      <Subscription />
    </Suspense>
  )
}

function Subscription() {
  const params = useSearchParams()
  const feature = params.get("feature") as FeatureId | null
  const highlight = feature && feature in FEATURES ? FEATURES[feature] : null
  const tier = useApp((s) => s.tier)
  const savedCycle = useApp((s) => s.billingCycle)
  const setTier = useApp((s) => s.setTier)
  const [cycle, setCycle] = useState<"monthly" | "yearly">(savedCycle)

  return (
    <>
      <PageHeader back title="Plans" />
      <PageBody>
        {highlight ? (
          <Surface tone="lime">
            <p className="text-overline flex items-center gap-1.5 text-lime-text">
              <Crown className="size-3.5" aria-hidden /> Unlock this feature
            </p>
            <p className="text-headline mt-2 flex flex-wrap items-center gap-2">
              {highlight.name} <PhaseBadge phase={highlight.phase} />
            </p>
            <p className="text-callout mt-0.5 text-charcoal/80">Included in {highlight.tier === "family" ? "Family" : "Premium"} and above.</p>
          </Surface>
        ) : (
          <div className="relative overflow-hidden rounded-2xl bg-charcoal text-white">
            {/* eslint-disable-next-line @next/next/no-img-element -- static prototype asset */}
            <img src={SCENE_PHOTO.fruits} alt="" className="absolute inset-0 size-full object-cover opacity-55" />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/60 to-charcoal/10" aria-hidden />
            <div className="relative px-5 pt-24 pb-5">
              <h2 className="text-display">Choose what fits your household</h2>
              <p className="text-body mt-1.5 text-white/85">Start free. Upgrade any time, cancel any time.</p>
            </div>
          </div>
        )}

        <div role="radiogroup" aria-label="Billing cycle" className="grid h-12 grid-cols-2 gap-1 rounded-full bg-card p-1 shadow-card">
          {(["monthly", "yearly"] as const).map((c) => (
            <button
              key={c}
              role="radio"
              aria-checked={cycle === c}
              onClick={() => setCycle(c)}
              className={cn("text-callout rounded-full font-medium transition-colors", cycle === c ? "bg-lime font-semibold text-charcoal" : "text-muted-foreground hover:text-charcoal")}
            >
              {c === "monthly" ? "Monthly" : "Yearly · 2 months free"}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {TIERS.map((t) => {
            const current = tier === t.id
            const recommended = highlight ? t.id === highlight.tier : t.id === "premium"
            const covers = highlight ? tierAllows(t.id, highlight.tier) : true
            const price = cycle === "monthly" ? t.monthly : t.yearly
            return (
              <Surface key={t.id} padding="lg" tone={recommended && covers ? "lime" : "default"} className={cn("relative overflow-hidden", highlight && !covers && "opacity-60")}>
                {recommended && covers && <span className="absolute -top-12 -right-12 size-36 rounded-full bg-white/25" aria-hidden />}
                <div className="relative flex items-start justify-between gap-3">
                  <IconTile tone={recommended && covers ? "white" : TIER_LOOK[t.id].tone} size="lg">
                    {TIER_LOOK[t.id].icon}
                  </IconTile>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-title">{t.name}</p>
                      {current && <Pill tone="forest">Current</Pill>}
                      {recommended && covers && !current && <Pill className="bg-charcoal text-white">Suggested</Pill>}
                    </div>
                    <p className={cn("text-callout mt-0.5", recommended && covers ? "text-charcoal/80" : "text-muted-foreground")}>{t.tagline}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="tabular text-title">{price === 0 ? "৳0" : fmt.bdt(price)}</p>
                    <p className={cn("text-caption", recommended && covers ? "text-charcoal/75" : "text-muted-foreground")}>{price === 0 ? "forever" : cycle === "monthly" ? "per month" : "per year"}</p>
                  </div>
                </div>
                <ul className={cn("text-callout relative mt-4 space-y-2 border-t pt-4", recommended && covers ? "border-charcoal/10" : "border-border/70")}>
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-2.5">
                      <span className={cn("mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full", recommended && covers ? "bg-charcoal text-lime" : "bg-sage text-forest")} aria-hidden>
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                {!current &&
                  (t.id === "free" ? (
                    <Button variant="outline" className="relative mt-5 w-full" onClick={() => setTier("free")}>
                      Switch to Free
                    </Button>
                  ) : (
                    <Button asChild className={cn("relative mt-5 w-full", recommended && covers && "bg-charcoal hover:bg-charcoal/90")} variant={recommended && covers ? "default" : "outline"}>
                      <Link href={`/subscription/checkout?tier=${t.id}&cycle=${cycle}`}>{tier === "free" ? "Start 7-day free trial" : `Switch to ${t.name}`}</Link>
                    </Button>
                  ))}
              </Surface>
            )
          })}
        </div>

        <InfoNote title="Always free">
          <span className="flex items-start gap-1.5"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-forest" aria-hidden />Allergy protection, food-safety checks, infant safety rules and emergency guidance are included in every plan and are never paywalled.</span>
        </InfoNote>
        <CautionNote title="Placeholder pricing">Tier contents and prices are a proposal for stakeholder review (§43.7). They aren&apos;t final.</CautionNote>
        <TierNote tier={tier} />
      </PageBody>
    </>
  )
}

function TierNote({ tier }: { tier: Tier }) {
  if (tier === "free") return null
  return <p className="text-caption text-center text-muted-foreground">Manage or cancel your subscription any time. You keep access until the end of the billing period.</p>
}
