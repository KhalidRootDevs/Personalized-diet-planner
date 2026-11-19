"use client"

import { useState } from "react"
import { HeartPulse, Info, ShieldCheck, Sparkles } from "lucide-react"
import { IconTile } from "@/components/app/page"
import { FeatureBadge } from "@/components/app/badges"
import { InfoNote } from "@/components/app/alerts"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { HEALTH_FIT_MAP } from "@/lib/recipe-bank"
import type { HealthFitId } from "@/lib/types"

/**
 * Health-fit chips (§42.11). Only fits that pass their deterministic rule are passed in
 * (recipeHealthFits). Tapping one explains the exact rule ("Why this label?").
 */
export function HealthFits({ fits }: { fits: HealthFitId[] }) {
  const [open, setOpen] = useState<HealthFitId | null>(null)
  if (fits.length === 0) return null
  const info = open ? HEALTH_FIT_MAP[open] : null
  return (
    <div>
      <p className="text-overline mb-2 text-muted-foreground">Good fit for</p>
      <div className="flex flex-wrap gap-1.5">
        {fits.map((id) => {
          const h = HEALTH_FIT_MAP[id]
          return (
            <button
              key={id}
              type="button"
              onClick={() => setOpen(id)}
              className="text-callout inline-flex h-9 items-center gap-1.5 rounded-full bg-card pr-2.5 pl-3 font-medium shadow-card transition-colors hover:bg-muted"
              aria-label={`${h.label}: why this label?`}
            >
              {h.kind === "condition" ? <HeartPulse className="size-4 text-terracotta" aria-hidden /> : <Sparkles className="size-4 text-lime-text" aria-hidden />}
              {h.label}
              <Info className="size-3.5 text-muted-grey" aria-hidden />
            </button>
          )
        })}
      </div>
      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent side="bottom">
          {info && (
            <>
              <SheetHeader>
                <div className="mb-2 flex items-center gap-3">
                  <IconTile tone={info.kind === "condition" ? "terracotta" : "lime"} size="lg">
                    {info.kind === "condition" ? <HeartPulse /> : <Sparkles />}
                  </IconTile>
                  {info.kind === "condition" && <FeatureBadge feature="condition_recipes" />}
                </div>
                <SheetTitle className="text-title">{info.label}</SheetTitle>
                <SheetDescription className="text-callout">Why this label?</SheetDescription>
              </SheetHeader>
              <div className="space-y-3 px-5 pb-2">
                <p className="text-body">{info.rule}</p>
                <div className="text-callout flex items-start gap-2.5 rounded-2xl bg-muted p-4">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-forest" aria-hidden />
                  <p>
                    {info.kind === "computed"
                      ? "Calculated by our nutrition engine from the ingredient weights in the food database, not written by hand or by AI."
                      : "A reviewer declared this fit, and our nutrition engine re-checked it against the rule above. Both must agree for the label to show."}
                  </p>
                </div>
                {info.kind === "condition" && <InfoNote title="General guidance, not treatment">This label doesn&apos;t replace advice from your doctor or dietitian, and it doesn&apos;t mean the recipe treats a condition.</InfoNote>}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

