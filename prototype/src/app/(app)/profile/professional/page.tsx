"use client"

// Dietitian access and reports (Phase 3, §42.24). The user controls scope and can revoke any time.
import { useState } from "react"
import { FileText, ShieldCheck, Stethoscope, UserCheck } from "lucide-react"
import { toast } from "sonner"
import { useApp } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { PageBody, PageHeader, Section } from "@/components/app/page"
import { PhaseBadge, PremiumGate } from "@/components/app/badges"
import { InfoNote } from "@/components/app/alerts"
import { Field, PillGroup } from "@/components/profile/form-bits"

const SCOPES = [
  { id: "plan", label: "Meal plans" },
  { id: "journal", label: "Food journal and photos" },
  { id: "progress", label: "Progress and weight" },
  { id: "health", label: "Health information" },
]

export default function ProfessionalPage() {
  const access = useApp((s) => s.settings.professionalAccess)
  const updateSettings = useApp((s) => s.updateSettings)
  const [code, setCode] = useState("")
  const [scopes, setScopes] = useState<string[]>(["plan", "journal", "progress"])
  const [range, setRange] = useState<"7" | "30" | "90">("30")

  return (
    <>
      <PageHeader back="/profile" title="Dietitian access" />
      <PageBody>
        <div className="flex items-center gap-2">
          <PhaseBadge phase={3} />
          <span className="text-sm text-muted-foreground">Professional review and reports</span>
        </div>
        <PremiumGate feature="professional">
          <div className="space-y-6">
            <Section title="Access">
              {access ? (
                <div className="rounded-2xl border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-lg bg-sage text-forest"><UserCheck className="size-5" /></span>
                    <div className="flex-1">
                      <p className="font-medium">{access.name}</p>
                      <p className="text-sm text-muted-foreground">Since {new Date(access.grantedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm"><span className="text-muted-foreground">Can see: </span>{access.scope}</p>
                  <Button
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={() => {
                      updateSettings({ professionalAccess: null })
                      toast("Access revoked", { description: `${access.name} can no longer see your data.` })
                    }}
                  >
                    Revoke access
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 rounded-2xl border bg-card p-4">
                  <p className="flex items-center gap-2 text-sm text-muted-foreground"><Stethoscope className="size-4 text-forest" /> Ask your dietitian for their NutriPlan code.</p>
                  <Field label="Professional code" htmlFor="code">
                    <Input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. RD-4821" />
                  </Field>
                  <fieldset className="space-y-2">
                    <legend className="mb-1 text-sm font-medium">What they can see</legend>
                    {SCOPES.map((s) => (
                      <label key={s.id} className="flex items-center gap-3 text-sm">
                        <Checkbox checked={scopes.includes(s.id)} onCheckedChange={(v) => setScopes((x) => (v ? [...x, s.id] : x.filter((y) => y !== s.id)))} />
                        {s.label}
                      </label>
                    ))}
                  </fieldset>
                  <Button
                    className="w-full"
                    disabled={code.trim().length < 4 || scopes.length === 0}
                    onClick={() => {
                      updateSettings({ professionalAccess: { name: `Dietitian ${code.trim()} (verified)`, scope: SCOPES.filter((s) => scopes.includes(s.id)).map((s) => s.label).join(", "), grantedAt: new Date().toISOString() } })
                      toast.success("Access granted")
                    }}
                  >
                    Grant access
                  </Button>
                </div>
              )}
              <InfoNote>Professionals only see what you allow. A plan is marked “professionally reviewed” only after a verified professional approves it.</InfoNote>
            </Section>

            <Section title="Report for your appointment">
              <div className="space-y-4 rounded-2xl border bg-card p-4">
                <Field label="Period">
                  <PillGroup label="Period" value={range} onChange={setRange} options={[{ value: "7", label: "7 days" }, { value: "30", label: "30 days" }, { value: "90", label: "90 days" }]} />
                </Field>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-forest" />Planned vs recorded intake as ranges</li>
                  <li className="flex gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-forest" />Record completeness, so gaps aren&apos;t mistaken for low intake</li>
                  <li className="flex gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-forest" />Allergies, preferences and notes you add</li>
                </ul>
                <Button variant="outline" className="w-full" onClick={() => toast.success("Report ready", { description: `Prototype: a ${range}-day PDF would download now.` })}>
                  <FileText className="size-4" /> Export PDF
                </Button>
              </div>
            </Section>
          </div>
        </PremiumGate>
      </PageBody>
    </>
  )
}
