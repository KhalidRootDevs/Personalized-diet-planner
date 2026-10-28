"use client"

// Consent management, export and deletion (§5.10, §21.4, §29, §41.10).
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Camera, Download, FileLock2, HeartPulse, Baby, Sparkles, BarChart3, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useApp } from "@/lib/store"
import type { ConsentRecord } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { IconTile, ListGroup, ListRow, PageBody, PageHeader, Section, Surface } from "@/components/app/page"
import { CautionNote, InfoNote } from "@/components/app/alerts"

const CONSENTS: { type: ConsentRecord["type"]; icon: typeof Camera; title: string; text: string; off: string }[] = [
  { type: "health_data", icon: HeartPulse, title: "Health information", text: "Allergies and conditions used to filter unsafe foods.", off: "Without it, allergies can't be checked and new plans can't be generated." },
  { type: "food_photos", icon: Camera, title: "Food photos", text: "Private storage, no public links, location data removed.", off: "Photo logging is turned off. Manual and text logging still work." },
  { type: "child_data", icon: Baby, title: "Child information", text: "Feeding, growth and food introductions for children you manage.", off: "Child profiles become read-only until you allow this again." },
  { type: "ai_processing", icon: Sparkles, title: "AI processing", text: "De-identified photos and text sent to our AI provider for food suggestions.", off: "Photos won't be analyzed. You can still log meals manually." },
  { type: "analytics", icon: BarChart3, title: "Product analytics", text: "Anonymous usage data to improve the app.", off: "" },
]

export default function PrivacyPage() {
  const router = useRouter()
  const consents = useApp((s) => s.consents)
  const setConsent = useApp((s) => s.setConsent)
  const resetDemo = useApp((s) => s.resetDemo)
  const journal = useApp((s) => s.journal)
  const updateEntry = useApp((s) => s.updateEntry)
  const deleteEntry = useApp((s) => s.deleteEntry)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [photosOpen, setPhotosOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [keepNutrition, setKeepNutrition] = useState(true)
  const photoEntries = journal.filter((e) => e.hasPhoto)
  const photoCount = photoEntries.length

  const get = (t: ConsentRecord["type"]) => consents.find((c) => c.type === t)

  return (
    <>
      <PageHeader back="/profile" title="Privacy and data" />
      <PageBody>
        <Section title="Permissions">
          <div className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/80 bg-card">
            {CONSENTS.map(({ type, icon: Icon, title, text, off }) => {
              const c = get(type)
              const granted = c?.granted ?? false
              return (
                <div key={type} className="px-4 py-3.5">
                  <label className="flex cursor-pointer items-start gap-3">
                    <IconTile>
                      <Icon aria-hidden />
                    </IconTile>
                    <span className="min-w-0 flex-1">
                      <span className="text-body block font-medium">{title}</span>
                      <span className="text-caption block text-muted-foreground">{text}</span>
                      {c && <span className="tabular mt-1 block text-[11px] text-muted-foreground">v{c.version} · {granted ? "granted" : "withdrawn"} {new Date(c.at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>}
                    </span>
                    <Switch
                      className="mt-1.5"
                      aria-label={title}
                      checked={granted}
                      onCheckedChange={(v) => {
                        setConsent(type, v)
                        toast(v ? `${title}: allowed` : `${title}: withdrawn`)
                      }}
                    />
                  </label>
                  {!granted && off && <p className="text-caption mt-2.5 ml-[52px] rounded-lg bg-caution-surface px-3 py-2 text-caution">{off}</p>}
                </div>
              )
            })}
          </div>
        </Section>

        <Section title="Your data">
          <ListGroup>
            <ListRow
              onClick={() => toast.success("Export requested", { description: "Prototype: you'd receive a download link by email within 48 hours." })}
              icon={<Download />}
              title="Export my data"
              description="Profile, plans, journal and consents (JSON + PDF)"
            />
            <ListRow
              onClick={() => setPhotosOpen(true)}
              icon={<Camera />}
              title="Delete food photos"
              description={`${photoCount} photo ${photoCount === 1 ? "entry" : "entries"} · nutrition history can be kept`}
            />
          </ListGroup>
          <InfoNote title="How we protect you">
            Health data is stored separately from your general profile and encrypted. Support staff can&apos;t see your medical details. Calendar events never include health information. Photos are kept for 12 months unless you delete them sooner.
          </InfoNote>
        </Section>

        <Section title="Delete account">
          <Surface>
            <div className="flex items-start gap-3">
              <IconTile tone="safety">
                <FileLock2 aria-hidden />
              </IconTile>
              <div>
                <p className="text-body font-semibold">Permanently delete everything</p>
                <p className="text-caption mt-0.5 text-muted-foreground">Your profile, child profiles, plans, journal, photos and consents. Some records may be kept where the law requires.</p>
              </div>
            </div>
            <Button variant="outline" className="mt-4 w-full border-safety/30 text-safety hover:bg-safety-surface hover:text-safety" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="size-[18px]" /> Delete my account
            </Button>
          </Surface>
        </Section>
      </PageBody>

      <Dialog open={photosOpen} onOpenChange={setPhotosOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete food photos?</DialogTitle>
            <DialogDescription>Photos are removed from storage. Choose whether to keep what you confirmed you ate.</DialogDescription>
          </DialogHeader>
          <label className="text-body flex min-h-12 items-center justify-between gap-3 rounded-xl bg-muted px-4">
            Keep my nutrition history
            <Switch checked={keepNutrition} onCheckedChange={setKeepNutrition} />
          </label>
          {!keepNutrition && <CautionNote title="Journal entries will be deleted too">Your daily totals and planned-vs-actual history for those meals will be lost.</CautionNote>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPhotosOpen(false)}>Cancel</Button>
            <Button
              disabled={photoCount === 0}
              onClick={() => {
                // §41.10: deleting a photo keeps nutrition history unless the user explicitly chooses otherwise.
                photoEntries.forEach((e) => (keepNutrition ? updateEntry({ ...e, hasPhoto: false }) : deleteEntry(e.id)))
                setPhotosOpen(false)
                toast.success(keepNutrition ? "Photos deleted. Nutrition history kept." : "Photos and their entries deleted.")
              }}
            >
              Delete photos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={(o) => { setDeleteOpen(o); setConfirmText("") }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>This removes all your data from this device and can&apos;t be undone. Type DELETE to confirm.</DialogDescription>
          </DialogHeader>
          <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" aria-label="Type DELETE to confirm" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={confirmText.trim().toUpperCase() !== "DELETE"}
              onClick={() => {
                resetDemo()
                router.replace("/welcome")
                toast("Account deleted")
              }}
            >
              Delete account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
