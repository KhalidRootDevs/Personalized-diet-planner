"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Info, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { useApp } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PageBody, PageHeader, Section } from "@/components/app/page"
import { InfoNote } from "@/components/app/alerts"
import { ChoiceCard } from "@/components/profile/form-bits"
import type { Tier } from "@/lib/types"
import { cn } from "@/lib/utils"

const TIER_LABEL: Record<Tier, string> = { free: "Free", premium: "Premium", family: "Family", professional: "Professional" }

export default function SettingsPage() {
  const router = useRouter()
  const settings = useApp((s) => s.settings)
  const updateSettings = useApp((s) => s.updateSettings)
  const tier = useApp((s) => s.tier)
  const setTier = useApp((s) => s.setTier)
  const resetDemo = useApp((s) => s.resetDemo)
  const loadDemo = useApp((s) => s.loadDemo)
  const [resetOpen, setResetOpen] = useState(false)

  return (
    <>
      <PageHeader back="/profile" title="App settings" />
      <PageBody>
        <Section title="Language">
          <div role="radiogroup" className="space-y-2">
            <ChoiceCard selected={settings.language === "en"} onSelect={() => updateSettings({ language: "en" })} title="English" />
            <ChoiceCard selected={settings.language === "bn"} onSelect={() => updateSettings({ language: "bn" })} title={<span lang="bn">বাংলা</span>} description="Bangla" />
          </div>
          {settings.language === "bn" && <InfoNote>Prototype: navigation and home labels are translated; other screens stay in English for now.</InfoNote>}
        </Section>

        <Section title="Prototype options">
          <div className="divide-y rounded-2xl border bg-card">
            <label className="flex items-center gap-3 p-3">
              <span className="flex-1">
                <span className="block text-sm font-medium">Show release-phase badges</span>
                <span className="block text-xs text-muted-foreground">P1 · P2 · P3 markers from docs/prd §43</span>
              </span>
              <Switch checked={settings.showPhaseBadges} onCheckedChange={(v) => updateSettings({ showPhaseBadges: v })} />
            </label>
            <div className="p-3">
              <p className="text-sm font-medium">Simulate subscription tier</p>
              <p className="text-xs text-muted-foreground">Preview gated screens without checkout</p>
              <div className="mt-2 grid grid-cols-4 gap-1 rounded-lg bg-muted p-1">
                {(Object.keys(TIER_LABEL) as Tier[]).map((t) => (
                  <button key={t} onClick={() => setTier(t)} aria-pressed={tier === t} className={cn("h-9 rounded-md text-xs font-medium", tier === t ? "bg-card shadow-sm" : "text-muted-foreground")}>
                    {TIER_LABEL[t]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 p-3">
              <span className="flex-1">
                <span className="block text-sm font-medium">Reload demo data</span>
                <span className="block text-xs text-muted-foreground">Nadia, a 7-month-old baby, and a week of meals</span>
              </span>
              <Button size="sm" variant="outline" onClick={() => { loadDemo(); toast.success("Demo data loaded"); router.push("/home") }}>Load</Button>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={() => setResetOpen(true)}>
            <RotateCcw className="size-4" /> Reset prototype
          </Button>
        </Section>

        <Section title="About">
          <div className="space-y-2 rounded-2xl border bg-card p-4 text-sm">
            <p className="flex items-center gap-2 font-medium"><Info className="size-4 text-forest" /> NutriPlan prototype v0.1</p>
            <p className="text-muted-foreground">An interactive prototype for stakeholder review. Food data, recipes and prices are illustrative and not clinically reviewed. All data stays in this browser.</p>
            <p className="text-muted-foreground">NutriPlan supports healthy eating and doesn&apos;t diagnose, treat or replace care from a qualified professional.</p>
            <p className="text-xs text-muted-foreground">Semantic colors, pricing and tier assignments are proposals pending decisions in §43.7.</p>
          </div>
        </Section>
      </PageBody>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset the prototype?</DialogTitle>
            <DialogDescription>Clears everything on this device and returns to the welcome screen.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                resetDemo()
                router.replace("/welcome")
              }}
            >
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
