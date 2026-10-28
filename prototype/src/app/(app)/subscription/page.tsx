"use client"

// Subscription tiers. Tier contents and prices are PROPOSALS (open decision §43.7 #1).
// Safety features are never paywalled (§30.1).
import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Check, Crown, ShieldCheck } from "lucide-react"
import { useApp } from "@/lib/store"
import { FEATURES, TIERS, tierAllows, type FeatureId } from "@/lib/features"
import type { Tier } from "@/lib/types"
import { fmt } from "@/lib/nutrition"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PageBody, PageHeader, Pill, Surface } from "@/components/app/page"
import { CautionNote, InfoNote } from "@/components/app/alerts"
import { PhaseBadge } from "@/components/app/badges"

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
          <Surface tone="sage">
            <p className="text-overline flex items-center gap-1.5 text-forest">
              <Crown className="size-3.5" aria-hidden /> Unlock this feature
            </p>
            <p className="text-headline mt-2 flex flex-wrap items-center gap-2">
              {highlight.name} <PhaseBadge phase={highlight.phase} />
            </p>
            <p className="text-callout mt-0.5 text-charcoal/80">Included in {highlight.tier === "family" ? "Family" : "Premium"} and above.</p>
          </Surface>
        ) : (
          <div>
            <h2 className="text-display text-[28px] leading-[34px]">Choose what fits your household</h2>
            <p className="text-body mt-2 text-muted-foreground">Start free. Upgrade any time, cancel any time.</p>
          </div>
        )}

        <div role="radiogroup" aria-label="Billing cycle" className="grid h-11 grid-cols-2 gap-1 rounded-xl bg-muted p-1">
          {(["monthly", "yearly"] as const).map((c) => (
            <button
              key={c}
              role="radio"
              aria-checked={cycle === c}
              onClick={() => setCycle(c)}
              className={cn("text-callout rounded-[10px] font-medium transition-colors", cycle === c ? "bg-card text-charcoal shadow-[0_1px_3px_rgba(41,47,43,0.12)]" : "text-muted-foreground hover:text-charcoal")}
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
              <Surface key={t.id} padding="lg" className={cn(recommended && covers && "border-forest ring-1 ring-forest", highlight && !covers && "opacity-60")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-title">{t.name}</p>
                      {current && <Pill tone="forest">Current</Pill>}
                      {recommended && covers && !current && <Pill tone="sage">Suggested</Pill>}
                    </div>
                    <p className="text-callout mt-0.5 text-muted-foreground">{t.tagline}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="tabular text-title">{price === 0 ? "৳0" : fmt.bdt(price)}</p>
                    <p className="text-caption text-muted-foreground">{price === 0 ? "forever" : cycle === "monthly" ? "per month" : "per year"}</p>
                  </div>
                </div>
                <ul className="text-callout mt-4 space-y-2 border-t border-border/70 pt-4">
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-forest" strokeWidth={2.5} aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
                {!current &&
                  (t.id === "free" ? (
                    <Button variant="outline" className="mt-5 w-full" onClick={() => setTier("free")}>
                      Switch to Free
                    </Button>
                  ) : (
                    <Button asChild className="mt-5 w-full" variant={recommended && covers ? "default" : "outline"}>
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
