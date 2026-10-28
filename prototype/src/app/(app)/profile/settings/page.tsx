"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Database, Flag, Images, Info, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { useApp } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ListGroup, ListRow, PageBody, PageHeader, Section, Surface } from "@/components/app/page"
import { InfoNote } from "@/components/app/alerts"
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
          <ListGroup>
            {(
              [
                ["en", "English", undefined],
                ["bn", <span key="bn" lang="bn">বাংলা</span>, "Bangla"],
              ] as const
            ).map(([value, title, desc]) => (
              <ListRow
                key={value}
                onClick={() => updateSettings({ language: value })}
                title={title}
                description={desc}
                chevron={false}
                trailing={settings.language === value ? <Check className="size-5 text-forest" aria-label="Selected" /> : null}
              />
            ))}
          </ListGroup>
          {settings.language === "bn" && <InfoNote>Prototype: navigation and home labels are translated; other screens stay in English for now.</InfoNote>}
        </Section>

        <Section title="Prototype options">
          <ListGroup>
            <ListRow
              icon={<Flag />}
              iconTone="amber"
              title="Release-phase badges"
              description="P1 · P2 · P3 markers from docs/prd §43"
              trailing={<Switch checked={settings.showPhaseBadges} onCheckedChange={(v) => updateSettings({ showPhaseBadges: v })} aria-label="Show release-phase badges" />}
            />
            <div className="px-4 py-3.5">
              <p className="text-body font-medium">Simulate subscription tier</p>
              <p className="text-caption mt-0.5 text-muted-foreground">Preview gated screens without checkout</p>
              <div className="mt-3 grid h-11 grid-cols-4 gap-1 rounded-full bg-muted p-1" role="radiogroup" aria-label="Subscription tier">
                {(Object.keys(TIER_LABEL) as Tier[]).map((t) => (
                  <button
                    key={t}
                    role="radio"
                    aria-checked={tier === t}
                    onClick={() => setTier(t)}
                    className={cn("rounded-full text-xs font-medium transition-colors", tier === t ? "bg-lime text-charcoal" : "text-muted-foreground hover:text-charcoal")}
                  >
                    {TIER_LABEL[t]}
                  </button>
                ))}
              </div>
            </div>
            <ListRow
              icon={<Database />}
              iconTone="lime"
              title="Reload demo data"
              description="Nadia, a 7-month-old baby and a week of meals"
              trailing={
                <Button size="sm" variant="outline" onClick={() => { loadDemo(); toast.success("Demo data loaded"); router.push("/home") }}>
                  Load
                </Button>
              }
            />
            <ListRow onClick={() => setResetOpen(true)} icon={<RotateCcw />} iconTone="muted" title="Reset prototype" description="Clear everything on this device" />
          </ListGroup>
        </Section>

        <Section title="About">
          <ListGroup>
            <ListRow href="/profile/settings/credits" icon={<Images />} iconTone="sky" title="Photo credits" description="Authors and licenses of the food photos" />
          </ListGroup>
          <Surface className="text-callout space-y-2">
            <p className="text-body flex items-center gap-2 font-semibold">
              <Info className="size-4 text-forest" aria-hidden /> NutriPlan prototype v0.1
            </p>
            <p className="text-muted-foreground">An interactive prototype for stakeholder review. Food data, recipes and prices are illustrative and not clinically reviewed. All data stays in this browser.</p>
            <p className="text-muted-foreground">NutriPlan supports healthy eating and doesn&apos;t diagnose, treat or replace care from a qualified professional.</p>
            <p className="text-caption text-muted-foreground">Semantic colors, pricing and tier assignments are proposals pending decisions in §43.7.</p>
          </Surface>
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
