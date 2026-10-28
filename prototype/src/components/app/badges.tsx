"use client"

import Link from "next/link"
import { Crown, Lock } from "lucide-react"
import { FEATURES, tierAllows, type FeatureId } from "@/lib/features"
import { useApp } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ListGroup, ListRow } from "@/components/app/page"
import type { Phase } from "@/lib/types"

/** Release-phase marker for stakeholder reviews (§43). Toggle in Profile → Prototype settings. */
export function PhaseBadge({ phase, className }: { phase: Phase; className?: string }) {
  const show = useApp((s) => s.settings.showPhaseBadges)
  if (!show) return null
  const style = { 1: "bg-sage text-forest", 2: "bg-amber-tint text-amber-text", 3: "bg-coral-tint text-terracotta-text" }[phase]
  return (
    <span className={cn("inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[11px] leading-none font-semibold tracking-wide", style, className)} title={`Release Phase ${phase} (§43)`}>
      P{phase}
    </span>
  )
}

export function FeatureBadge({ feature, className }: { feature: FeatureId; className?: string }) {
  return <PhaseBadge phase={FEATURES[feature].phase} className={className} />
}

export function useFeature(feature: FeatureId) {
  const tier = useApp((s) => s.tier)
  const info = FEATURES[feature]
  return { ...info, allowed: tierAllows(tier, info.tier) }
}

/**
 * Wraps a premium feature. When the current (proposed) tier doesn't include it,
 * shows a calm upsell card instead of the content. Never wrap safety features.
 */
export function PremiumGate({ feature, children, compact, variant = "card" }: { feature: FeatureId; children: React.ReactNode; compact?: boolean; variant?: "card" | "row" }) {
  const f = useFeature(feature)
  if (f.allowed) return <>{children}</>
  const tierName = f.tier === "family" ? "Family" : f.tier === "professional" ? "Professional" : "Premium"
  // Row variant: for screens with several gated sections, so upsells don't stack (UI-SPEC §5.5).
  if (variant === "row")
    return (
      <ListGroup>
        <ListRow href={`/subscription?feature=${feature}`} icon={<Crown />} iconTone="lime" title={f.name} description={`Included in ${tierName} · see plans`} />
      </ListGroup>
    )
  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-card text-center shadow-card", compact ? "px-4 py-5" : "px-6 py-8")}>
      <span className="absolute -top-12 -right-12 size-32 rounded-full bg-sage" aria-hidden />
      <span className="relative mx-auto mb-4 grid size-14 place-items-center rounded-full bg-lime text-charcoal">
        {f.tier === "free" ? <Lock className="size-6" /> : <Crown className="size-6" />}
      </span>
      <p className="relative text-headline">{f.name}</p>
      <p className="text-callout mx-auto mt-1 max-w-[17rem] text-muted-foreground">Included in {tierName}. Safety features and core planning always stay free.</p>
      <Button asChild className="mt-5" size="sm">
        <Link href={`/subscription?feature=${feature}`}>See plans</Link>
      </Button>
    </div>
  )
}

export function TierPill({ className }: { className?: string }) {
  const tier = useApp((s) => s.tier)
  const label = { free: "Free", premium: "Premium", family: "Family", professional: "Professional" }[tier]
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-sage px-2.5 py-0.5 text-xs font-medium text-forest", className)}>
      {tier !== "free" && <Crown className="size-3" />}
      {label}
    </span>
  )
}
