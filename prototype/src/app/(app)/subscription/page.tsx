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
import { PageBody, PageHeader } from "@/components/app/page"
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
          <div className="rounded-2xl bg-sage p-4">
            <p className="flex items-center gap-2 font-medium text-forest"><Crown className="size-4" /> {highlight.name}</p>
            <p className="mt-1 text-sm text-charcoal/80">
              Included in {highlight.tier === "family" ? "Family" : "Premium"} and above. <PhaseBadge phase={highlight.phase} className="ml-1 align-middle" />
            </p>
          </div>
        ) : (
          <div>
            <h2 className="font-serif text-[26px] leading-tight">Choose what fits your household</h2>
            <p className="mt-1 text-muted-foreground">Start free. Upgrade any time, cancel any time.</p>
          </div>
        )}

        <div role="radiogroup" aria-label="Billing cycle" className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
          {(["monthly", "yearly"] as const).map((c) => (
            <button key={c} role="radio" aria-checked={cycle === c} onClick={() => setCycle(c)} className={cn("h-10 rounded-lg text-sm font-medium", cycle === c ? "bg-card shadow-sm" : "text-muted-foreground")}>
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
              <div key={t.id} className={cn("rounded-2xl border bg-card p-4", recommended && covers && "border-forest ring-1 ring-forest", highlight && !covers && "opacity-70")}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 text-lg font-semibold">
                      {t.name}
                      {recommended && covers && !current && <span className="rounded-full bg-sage px-2 py-0.5 text-[11px] font-semibold text-forest">Suggested</span>}
                      {current && <span className="rounded-full bg-forest px-2 py-0.5 text-[11px] font-semibold text-ivory">Current</span>}
                    </p>
                    <p className="text-sm text-muted-foreground">{t.tagline}</p>
                  </div>
                  <div className="text-right">
                    <p className="tabular text-xl font-semibold">{price === 0 ? "৳0" : fmt.bdt(price)}</p>
                    <p className="text-xs text-muted-foreground">{price === 0 ? "forever" : cycle === "monthly" ? "per month" : "per year"}</p>
                  </div>
                </div>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-forest" aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
                {!current &&
                  (t.id === "free" ? (
                    <Button variant="outline" className="mt-4 w-full" onClick={() => setTier("free")}>
                      Switch to Free
                    </Button>
                  ) : (
                    <Button asChild className="mt-4 w-full" variant={recommended ? "default" : "outline"}>
                      <Link href={`/subscription/checkout?tier=${t.id}&cycle=${cycle}`}>{tier === "free" ? "Start 7-day free trial" : `Switch to ${t.name}`}</Link>
                    </Button>
                  ))}
              </div>
            )
          })}
        </div>

        <InfoNote title="Always free">
          <span className="flex items-start gap-1.5"><ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />Allergy protection, food-safety checks, infant safety rules and emergency guidance are included in every plan and are never paywalled.</span>
        </InfoNote>
        <CautionNote title="Placeholder pricing">Tier contents and prices are a proposal for stakeholder review (§43.7). They aren&apos;t final.</CautionNote>
        <TierNote tier={tier} />
      </PageBody>
    </>
  )
}

function TierNote({ tier }: { tier: Tier }) {
  if (tier === "free") return null
  return <p className="text-center text-xs text-muted-foreground">Manage or cancel your subscription any time. You keep access until the end of the billing period.</p>
}
