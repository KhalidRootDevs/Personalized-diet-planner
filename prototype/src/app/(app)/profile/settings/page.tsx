"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Crown, Database, Flag, Images, Languages, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { useApp } from "@/lib/store"
import { useTx } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { IconTile, ListGroup, ListRow, PageBody, PageHeader, Section } from "@/components/app/page"
import { PillGroup } from "@/components/app/controls"
import { InfoNote } from "@/components/app/alerts"
import type { Tier } from "@/lib/types"

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
  const tx = useTx()

  return (
    <>
      <PageHeader back="/profile" title={tx("App settings", "অ্যাপ সেটিংস")} />
      <PageBody>
        <Section title={tx("Language", "ভাষা")}>
          <ListGroup>
            {(
              [
                ["en", "English", "Default"],
                ["bn", <span key="bn" lang="bn">বাংলা</span>, "Bangla"],
              ] as const
            ).map(([value, title, desc]) => (
              <ListRow
                key={value}
                onClick={() => updateSettings({ language: value })}
                icon={value === "en" ? <Languages /> : <span lang="bn" className="text-callout font-semibold">অ</span>}
                iconTone={value === "en" ? "sky" : "amber"}
                title={title}
                description={desc}
                chevron={false}
                trailing={settings.language === value ? <Check className="size-5 text-forest" aria-label="Selected" /> : null}
              />
            ))}
          </ListGroup>
          {settings.language === "bn" && <InfoNote>প্রোটোটাইপ: ন্যাভিগেশন, হোম, লগইন, প্রোফাইল তৈরি ও সেটিংস অনুবাদ করা হয়েছে; কিছু স্ক্রিন এখনো ইংরেজিতে। অনুবাদ পর্যালোচনার অপেক্ষায়।</InfoNote>}
        </Section>

        <Section title={tx("Prototype options", "প্রোটোটাইপ অপশন")}>
          <ListGroup>
            <ListRow
              icon={<Flag />}
              iconTone="amber"
              title={tx("Release-phase badges", "রিলিজ-পর্যায় ব্যাজ")}
              description="Show P1, P2 and P3 markers from the release plan (§43)"
              trailing={<Switch checked={settings.showPhaseBadges} onCheckedChange={(v) => updateSettings({ showPhaseBadges: v })} aria-label="Show release-phase badges" />}
            />
            <div className="px-4 py-3.5">
              <div className="flex items-center gap-3">
                <IconTile tone="sky">
                  <Crown />
                </IconTile>
                <div className="min-w-0 flex-1">
                  <p className="text-body font-medium">{tx("Simulate subscription tier", "সাবস্ক্রিপশন স্তর অনুকরণ")}</p>
                  <p className="text-caption mt-0.5 text-muted-foreground">Preview gated screens without checkout</p>
                </div>
              </div>
              <div className="mt-3">
                <PillGroup label="Subscription tier" options={(Object.keys(TIER_LABEL) as Tier[]).map((t) => ({ value: t, label: TIER_LABEL[t] }))} value={tier} onChange={setTier} />
              </div>
            </div>
            <ListRow
              icon={<Database />}
              iconTone="lime"
              title={tx("Reload demo data", "ডেমো তথ্য আবার লোড করুন")}
              description="Nadia, a 7-month-old baby and a week of meals"
              trailing={
                <Button size="sm" variant="outline" onClick={() => { loadDemo(); toast.success("Demo data loaded"); router.push("/home") }}>
                  {tx("Load", "লোড")}
                </Button>
              }
            />
            <ListRow onClick={() => setResetOpen(true)} icon={<RotateCcw />} iconTone="muted" title={tx("Reset prototype", "প্রোটোটাইপ রিসেট")} description={tx("Clear everything on this device", "এই ডিভাইসের সব মুছে ফেলুন")} />
          </ListGroup>
        </Section>

        <Section title={tx("About", "সম্পর্কে")}>
          <ListGroup>
            <ListRow href="/profile/settings/credits" icon={<Images />} iconTone="sky" title={tx("Photo credits", "ছবির কৃতজ্ঞতা")} description="Authors and licenses of the food photos" />
          </ListGroup>
          <InfoNote title="NutriPlan prototype v0.1">
            <div className="space-y-2">
              <p>An interactive prototype for stakeholder review. Food data, recipes and prices are illustrative and not clinically reviewed. All data stays in this browser.</p>
              <p>NutriPlan supports healthy eating and doesn&apos;t diagnose, treat or replace care from a qualified professional.</p>
              <p className="text-caption text-muted-foreground">Semantic colors, pricing and tier assignments are proposals pending decisions in §43.7.</p>
            </div>
          </InfoNote>
        </Section>
      </PageBody>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tx("Reset the prototype?", "প্রোটোটাইপ রিসেট করবেন?")}</DialogTitle>
            <DialogDescription>{tx("Clears everything on this device and returns to the welcome screen.", "এই ডিভাইসের সব মুছে স্বাগতম স্ক্রিনে ফিরে যাবে।")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>{tx("Cancel", "বাতিল")}</Button>
            <Button
              onClick={() => {
                resetDemo()
                router.replace("/welcome")
              }}
            >
              {tx("Reset", "রিসেট")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
