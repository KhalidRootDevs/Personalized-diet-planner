"use client"

import { ShieldCheck, TriangleAlert } from "lucide-react"
import { Pill } from "@/components/app/page"
import { SafetyAlert } from "@/components/app/alerts"
import { ALLERGEN_LABELS } from "@/lib/data/foods"
import type { ConstraintKind } from "@/lib/nutrition"
import type { Allergen, Profile } from "@/lib/types"

const TITLE: Record<ConstraintKind, (name: string) => string> = {
  allergen: (n) => `Allergy alert for ${n}`,
  age: (n) => `Not suitable for ${n}'s age`,
  diet: (n) => `Doesn't match ${n}'s diet`,
  medical: (n) => `Not suitable for ${n}'s health needs`,
}

/**
 * Allergen facts for the recipe (§13.6), plus a prominent, non-dismissible hard alert when the
 * recipe (including any swaps) conflicts with the active profile. The conflict also blocks Add to plan.
 */
export function AllergenPanel({ allergens, conflict, profile }: { allergens: Allergen[]; conflict: { kind: ConstraintKind; reason: string } | null; profile: Profile | undefined }) {
  return (
    <div className="space-y-3">
      {conflict && profile && (
        <SafetyAlert title={TITLE[conflict.kind](profile.name)}>
          {conflict.reason} It can&apos;t be added to {profile.relation === "self" ? "your" : `${profile.name}'s`} plan or shopping list.
        </SafetyAlert>
      )}
      <div className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-card">
        {allergens.length > 0 ? <TriangleAlert className="mt-0.5 size-5 shrink-0 text-caution" aria-hidden /> : <ShieldCheck className="mt-0.5 size-5 shrink-0 text-forest" aria-hidden />}
        <div className="min-w-0 flex-1">
          {allergens.length > 0 ? (
            <>
              <p className="text-callout font-semibold">Contains allergens</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {allergens.map((a) => (
                  <Pill key={a} tone={conflict?.kind === "allergen" && profile?.allergies.includes(a) ? "safety" : "terracotta"}>
                    {ALLERGEN_LABELS[a] ?? a}
                    {profile?.allergies.includes(a) ? " · your allergy" : ""}
                  </Pill>
                ))}
              </div>
            </>
          ) : (
            <p className="text-callout font-semibold">No common allergens recorded in these ingredients</p>
          )}
          <p className="text-caption mt-2 text-muted-foreground">
            {!conflict && profile?.allergies.length ? `Checked against ${profile.relation === "self" ? "your" : `${profile.name}'s`} allergies: no match. ` : ""}
            Check labels on packaged ingredients, which can vary by brand.
          </p>
        </div>
      </div>
    </div>
  )
}
