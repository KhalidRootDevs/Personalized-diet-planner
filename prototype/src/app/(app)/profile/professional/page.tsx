"use client"

// Dietitian access and reports (Phase 3, §42.24). The user controls scope and can revoke any time.
import { useState } from "react"
import Link from "next/link"
import { Eye, FileText, MessageSquareText, ShieldCheck, Stethoscope, UserCheck } from "lucide-react"
import { toast } from "sonner"
import { useApp } from "@/lib/store"
import { useAreaD, useAreaDSync } from "@/lib/area-d-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { IconTile, KeyValue, ListGroup, ListRow, PageBody, PageHeader, Section, Surface } from "@/components/app/page"
import { PhaseBadge, PremiumGate } from "@/components/app/badges"
import { InfoNote } from "@/components/app/alerts"
import { Field, PillGroup } from "@/components/app/controls"

const SCOPES = [
  { id: "plan", label: "Meal plans" },
  { id: "journal", label: "Food journal and photos" },
  { id: "progress", label: "Progress and weight" },
  { id: "health", label: "Health information" },
]

export default function ProfessionalPage() {
  useAreaDSync()
  const access = useApp((s) => s.settings.professionalAccess)
  const audit = useAreaD((s) => s.audit)
  const notes = useAreaD((s) => s.professionalNotes)
  const updateSettings = useApp((s) => s.updateSettings)
  const [code, setCode] = useState("")
  const [scopes, setScopes] = useState<string[]>(["plan", "journal", "progress"])
  const [range, setRange] = useState<"7" | "30" | "90">("30")

  return (
    <>
      <PageHeader back="/profile" title={<span className="flex items-center gap-2">Dietitian access <PhaseBadge phase={3} /></span>} subtitle="Professional review and reports" />
      <PageBody>
        <PremiumGate feature="professional">
          <div className="space-y-7">
            <Section title="Access">
              {access ? (
                <Surface>
                  <div className="flex items-center gap-3">
                    <IconTile>
                      <UserCheck />
                    </IconTile>
                    <div className="flex-1">
                      <p className="text-body font-medium">{access.name}</p>
                      <p className="text-caption text-muted-foreground">Since {new Date(access.grantedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                  </div>
                  <div className="mt-3 border-t border-border/70">
                    <KeyValue label="Can see" value={access.scope} />
                  </div>
                  <Button
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={() => {
                      updateSettings({ professionalAccess: null })
                      audit("Professional access revoked", access.name)
                      toast("Access revoked", { description: `${access.name} can no longer see your data.` })
                    }}
                  >
                    Revoke access
                  </Button>
                </Surface>
              ) : (
                <Surface padding="lg" className="space-y-5">
                  <p className="text-callout flex items-center gap-2 text-muted-foreground">
                    <Stethoscope className="size-4 shrink-0 text-forest" aria-hidden /> Ask your dietitian for their NutriPlan code.
                  </p>
                  <Field label="Professional code" htmlFor="code">
                    <Input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. RD-4821" />
                  </Field>
                  <fieldset>
                    <legend className="text-callout mb-1 font-medium">What they can see</legend>
                    {SCOPES.map((s) => (
                      <label key={s.id} className="text-body flex min-h-11 cursor-pointer items-center gap-3">
                        <Checkbox checked={scopes.includes(s.id)} onCheckedChange={(v) => setScopes((x) => (v ? [...x, s.id] : x.filter((y) => y !== s.id)))} />
                        {s.label}
                      </label>
                    ))}
                  </fieldset>
                  <Button
                    size="lg"
                    className="w-full"
                    disabled={code.trim().length < 4 || scopes.length === 0}
                    onClick={() => {
                      const scope = SCOPES.filter((s) => scopes.includes(s.id)).map((s) => s.label).join(", ")
                      updateSettings({ professionalAccess: { name: `Dietitian ${code.trim()} (verified)`, scope, grantedAt: new Date().toISOString() } })
                      audit("Professional access granted", `Dietitian ${code.trim()} · ${scope}`)
                      toast.success("Access granted")
                    }}
                  >
                    Grant access
                  </Button>
                </Surface>
              )}
              {access && (
                <ListGroup>
                  <ListRow href="/profile/professional/view" icon={<Eye />} iconTone="sky" title="See what they see" description="The dietitian's view of your shared records (prototype)" />
                </ListGroup>
              )}
              <InfoNote>Professionals only see what you allow. A plan is marked “professionally reviewed” only after a verified professional approves it.</InfoNote>
            </Section>

            {notes.length > 0 && (
              <Section title="Notes from your dietitian">
                <ListGroup>
                  {notes.map((n) => (
                    <ListRow
                      key={n.id}
                      icon={<MessageSquareText />}
                      iconTone="sky"
                      title={<span className="text-callout font-normal whitespace-pre-line">{n.text}</span>}
                      description={`${n.author} · ${new Date(n.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
                    />
                  ))}
                </ListGroup>
                <p className="text-caption px-1 text-muted-foreground">Recommendations from a professional don&apos;t change your plan automatically. Ask them to share an updated plan, or create one yourself.</p>
              </Section>
            )}

            <Section title="Report for your appointment">
              <Surface padding="lg" className="space-y-5">
                <Field label="Period">
                  <PillGroup label="Period" value={range} onChange={setRange} options={[{ value: "7", label: "7 days" }, { value: "30", label: "30 days" }, { value: "90", label: "90 days" }]} />
                </Field>
                <ul className="text-callout space-y-2 text-muted-foreground">
                  <li className="flex gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-forest" />Planned vs recorded intake as ranges</li>
                  <li className="flex gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-forest" />Record completeness, so gaps aren&apos;t mistaken for low intake</li>
                  <li className="flex gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-forest" />Allergies, preferences and notes you add</li>
                </ul>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/profile/professional/report?days=${range}`}>
                    <FileText className="size-[18px]" /> Open printable report
                  </Link>
                </Button>
              </Surface>
            </Section>
          </div>
        </PremiumGate>
      </PageBody>
    </>
  )
}
