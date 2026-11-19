"use client"

import { useState } from "react"
import Link from "next/link"
import { Baby, House, Plus, Ruler, Stethoscope, Weight } from "lucide-react"
import { toast } from "sonner"
import { formatDay, todayISO, uid } from "@/lib/date"
import { ageInMonths } from "@/lib/nutrition"
import { useApp } from "@/lib/store"
import { useConsent } from "@/lib/consent"
import type { GrowthRecord } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { InfoNote } from "@/components/app/alerts"
import { FeatureBadge } from "@/components/app/badges"
import { EmptyState, IconTile, ListGroup, ListRow, PageBody, PageHeader, Pill, Section, StatTile, Surface } from "@/components/app/page"
import { LegendItem, LineTrend } from "@/components/progress/charts"
import { useChildProfile } from "@/components/child/use-child"

/**
 * Simplified WHO-style weight-for-age bands (kg) at selected months, 0–24 months.
 * ILLUSTRATIVE ONLY — rounded approximations for the prototype, not the WHO Child Growth Standards tables.
 * Production must load the official WHO tables (versioned, clinically reviewed, §6.6, §7).
 */
const REF_MONTHS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 18, 21, 24]
const WEIGHT_REF: Record<"male" | "female", { p3: number[]; p50: number[]; p97: number[] }> = {
  male: {
    p3: [2.5, 3.4, 4.4, 5.1, 5.6, 6.1, 6.4, 6.7, 7.0, 7.2, 7.5, 7.7, 7.8, 8.4, 8.9, 9.4, 9.9],
    p50: [3.3, 4.5, 5.6, 6.4, 7.0, 7.5, 7.9, 8.3, 8.6, 8.9, 9.2, 9.4, 9.6, 10.3, 10.9, 11.5, 12.2],
    p97: [4.3, 5.7, 7.0, 7.9, 8.6, 9.2, 9.7, 10.2, 10.5, 10.9, 11.2, 11.5, 11.8, 12.6, 13.4, 14.1, 14.8],
  },
  female: {
    p3: [2.4, 3.2, 4.0, 4.6, 5.1, 5.5, 5.8, 6.1, 6.3, 6.6, 6.8, 7.0, 7.1, 7.7, 8.2, 8.7, 9.2],
    p50: [3.2, 4.2, 5.1, 5.8, 6.4, 6.9, 7.3, 7.6, 7.9, 8.2, 8.5, 8.7, 8.9, 9.6, 10.2, 10.9, 11.5],
    p97: [4.2, 5.4, 6.5, 7.4, 8.1, 8.7, 9.2, 9.6, 10.0, 10.4, 10.7, 11.0, 11.3, 12.2, 13.0, 13.7, 14.6],
  },
}
const TABLE_MONTHS = [0, 3, 6, 9, 12, 18, 24]

/** Growth records (§6.6, §12). Measurements only — interpretation belongs to clinicians. */
export default function ChildGrowthPage() {
  const child = useChildProfile()
  const all = useApp((s) => s.growth)
  const addGrowth = useApp((s) => s.addGrowth)
  const childConsent = useConsent("child_data")
  const [open, setOpen] = useState(false)

  if (!child)
    return (
      <>
        <PageHeader title="Growth" back="/child" />
        <PageBody>
          <EmptyState icon={<Baby />} title="No child profile yet" description="Add a child profile to record growth measurements." action={<Button asChild><Link href="/profile/family">Add a child profile</Link></Button>} />
        </PageBody>
      </>
    )

  const records = all.filter((g) => g.profileId === child.id).sort((a, b) => a.date.localeCompare(b.date))
  const weights = records.filter((r) => r.weightKg !== undefined).map((r) => ({ date: r.date, value: r.weightKg!, source: r.source }))
  const lengths = records.filter((r) => r.lengthCm !== undefined).map((r) => ({ date: r.date, value: r.lengthCm!, source: r.source }))
  const latest = records[records.length - 1]
  const latestW = [...records].reverse().find((r) => r.weightKg !== undefined)
  const latestL = [...records].reverse().find((r) => r.lengthCm !== undefined)

  return (
    <>
      <PageHeader
        title="Growth"
        subtitle={`${child.name} · ${ageInMonths(child.dateOfBirth)} months`}
        back="/child"
        action={
          <Button size="sm" onClick={() => setOpen(true)} disabled={!childConsent} title={childConsent ? undefined : "Read-only: child information consent withdrawn"}>
            <Plus /> Add
          </Button>
        }
      />
      <PageBody>
        {latest && (
          <div className="grid grid-cols-2 gap-3">
            <StatTile className="bg-sky-tint" icon={<Weight />} iconTone="white" label="Latest weight" value={latestW?.weightKg ?? "–"} unit="kg" hint={latestW ? formatDay(latestW.date, { day: "numeric", month: "short" }) : undefined} />
            <StatTile className="bg-amber-tint" icon={<Ruler />} iconTone="white" label="Latest length" value={latestL?.lengthCm ?? "–"} unit="cm" hint={latestL ? formatDay(latestL.date, { day: "numeric", month: "short" }) : undefined} />
          </div>
        )}

        <InfoNote title="A measurement, not a diagnosis">
          These records help you and your clinician follow {child.name}&apos;s growth over time. Growth is assessed on WHO growth charts by a health professional. NutriPlan does not interpret these numbers.
        </InfoNote>

        <Section title="Weight-for-age reference" badge={<FeatureBadge feature="baby_module" />} description="For conversation with your clinician, not for diagnosis.">
          <WeightReference sex={child.sex} dob={child.dateOfBirth} points={weights} name={child.name} />
        </Section>

        {records.length === 0 ? (
          <EmptyState icon={<Ruler />} title="No measurements yet" description="Add weight and length from a clinic visit or a home measurement." />
        ) : (
          <>
            {weights.length > 0 && (
              <Section title="Weight" badge={<FeatureBadge feature="baby_module" />}>
                <Surface>
                  <p className="text-caption text-muted-foreground">Kilograms (kg)</p>
                  <LineTrend points={weights} unit="kg" label={`${child.name}'s weight over time`} />
                  <Legend />
                </Surface>
              </Section>
            )}
            {lengths.length > 0 && (
              <Section title="Length">
                <Surface>
                  <p className="text-caption text-muted-foreground">Centimeters (cm)</p>
                  <LineTrend points={lengths} unit="cm" label={`${child.name}'s length over time`} />
                  <Legend />
                </Surface>
              </Section>
            )}

            <Section title="All records">
              <ListGroup>
                {[...records].reverse().map((r) => (
                  <ListRow
                    key={r.id}
                    icon={r.source === "clinic" ? <Stethoscope /> : <House />}
                    iconTone={r.source === "clinic" ? "sage" : "sky"}
                    title={<span className="tabular">{formatDay(r.date, { day: "numeric", month: "short", year: "numeric" })}</span>}
                    description={
                      <span className="tabular">
                        {r.weightKg !== undefined ? `${r.weightKg} kg` : "–"} · {r.lengthCm !== undefined ? `${r.lengthCm} cm` : "–"}
                      </span>
                    }
                    trailing={<Pill tone={r.source === "clinic" ? "sage" : "neutral"}>{r.source === "clinic" ? "Clinic" : "Home"}</Pill>}
                  />
                ))}
              </ListGroup>
            </Section>
          </>
        )}
        <Surface tone="sage">
          <div className="flex gap-3">
            <IconTile tone="white">
              <Stethoscope />
            </IconTile>
            <div className="min-w-0 flex-1">
              <p className="text-body font-medium">Worried about growth or feeding?</p>
              <p className="text-callout mt-0.5 text-muted-foreground">Please speak to your clinician about {child.name}&apos;s growth, feeding or weight. Measurements never change feeding guidance on their own.</p>
            </div>
          </div>
        </Surface>
      </PageBody>

      <AddGrowthSheet
        open={open}
        onOpenChange={setOpen}
        onSave={(g) => {
          addGrowth({ ...g, id: uid("g"), profileId: child.id })
          setOpen(false)
          toast.success("Measurement saved")
        }}
      />
    </>
  )
}

function AddGrowthSheet({ open, onOpenChange, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; onSave: (g: Omit<GrowthRecord, "id" | "profileId">) => void }) {
  const [date, setDate] = useState(todayISO())
  const [weight, setWeight] = useState("")
  const [length, setLength] = useState("")
  const [source, setSource] = useState<GrowthRecord["source"]>("home")
  const w = weight ? Number(weight) : undefined
  const l = length ? Number(length) : undefined
  const invalid = (w === undefined && l === undefined) || (w !== undefined && (!(w > 0) || w > 40)) || (l !== undefined && (!(l > 30) || l > 130))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Add a measurement</SheetTitle>
          <SheetDescription>Enter weight, length or both.</SheetDescription>
        </SheetHeader>
        <form
          className="space-y-5 px-5 pt-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (invalid) return
            onSave({ date, weightKg: w, lengthCm: l, source })
            setWeight("")
            setLength("")
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="g-date">Date</Label>
            <Input id="g-date" type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="g-weight">Weight (kg)</Label>
              <Input id="g-weight" type="number" inputMode="decimal" step="0.01" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 8.1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="g-length">Length (cm)</Label>
              <Input id="g-length" type="number" inputMode="decimal" step="0.1" value={length} onChange={(e) => setLength(e.target.value)} placeholder="e.g. 69" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Where was this measured?</Label>
            <ToggleGroup type="single" variant="outline" value={source} onValueChange={(v) => v && setSource(v as GrowthRecord["source"])} className="w-full">
              <ToggleGroupItem value="home" className="flex-1">At home</ToggleGroupItem>
              <ToggleGroupItem value="clinic" className="flex-1">At a clinic</ToggleGroupItem>
            </ToggleGroup>
            <p className="text-caption text-muted-foreground">Clinic measurements are usually more accurate than home scales.</p>
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={invalid}>
            Save measurement
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function Legend() {
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-border/70 pt-3">
      <LegendItem swatch={<span className="inline-block size-2.5 rounded-full bg-forest" />}>Clinic measurement</LegendItem>
      <LegendItem swatch={<span className="inline-block size-2.5 rounded-full border-2 border-forest bg-card" />}>Home measurement</LegendItem>
    </div>
  )
}

/**
 * Child's weights plotted over an illustrative 3rd–97th band and median (§6.6). No percentile or
 * classification is computed: a clinician interprets growth on official charts. Never adult BMI.
 */
function WeightReference({ sex, dob, points, name }: { sex?: "female" | "male"; dob: string; points: { date: string; value: number; source: GrowthRecord["source"] }[]; name: string }) {
  if (!sex)
    return <InfoNote>Add {name}&apos;s sex in the family profile to show the matching reference. A clinician should interpret growth.</InfoNote>
  const ref = WEIGHT_REF[sex]
  const W = 320
  const H = 206
  const pad = { l: 30, r: 8, t: 20, b: 36 }
  const x = (m: number) => pad.l + (m / 24) * (W - pad.l - pad.r)
  const y = (kg: number) => H - pad.b - (kg / 16) * (H - pad.t - pad.b)
  const line = (vals: number[]) => vals.map((v, i) => `${x(REF_MONTHS[i])},${y(v)}`).join(" ")
  const band = `${line(ref.p97)} ${[...ref.p3].map((v, i) => [REF_MONTHS[i], v] as const).reverse().map(([m, v]) => `${x(m)},${y(v)}`).join(" ")}`
  const born = new Date(dob).getTime()
  const plotted = points
    .map((pt) => ({ ...pt, months: (new Date(pt.date).getTime() - born) / (30.44 * 24 * 3600 * 1000) }))
    .filter((pt) => pt.months >= 0 && pt.months <= 24)
  const ageNow = ageInMonths(dob)

  return (
    <Surface className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        <Pill tone="caution">Illustrative · not clinical</Pill>
        <Pill tone="neutral">{sex === "female" ? "Girls" : "Boys"} · 0–24 months</Pill>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${name}'s weights plotted against an illustrative weight-for-age band for ${sex === "female" ? "girls" : "boys"}, 0 to 24 months. See the table below for values.`}>
        {[0, 4, 8, 12, 16].map((kg) => (
          <g key={kg}>
            <line x1={pad.l} x2={W - pad.r} y1={y(kg)} y2={y(kg)} className="stroke-border" strokeWidth={1} />
            <text x={pad.l - 6} y={y(kg) + 4} textAnchor="end" className="fill-muted-foreground text-[10px]">
              {kg}
            </text>
          </g>
        ))}
        {[0, 6, 12, 18, 24].map((m) => (
          <text key={m} x={x(m)} y={H - pad.b + 15} textAnchor="middle" className="fill-muted-foreground text-[10px]">
            {m}
          </text>
        ))}
        <text x={pad.l + (W - pad.l - pad.r) / 2} y={H - 2} textAnchor="middle" className="fill-muted-foreground text-[10px]">
          Age (months)
        </text>
        <text x={2} y={10} className="fill-muted-foreground text-[10px]">
          Weight (kg)
        </text>
        <polygon points={band} className="fill-sage-strong" opacity={0.8} />
        <polyline points={line(ref.p50)} fill="none" className="stroke-forest" strokeWidth={1.5} strokeDasharray="4 3" />
        {plotted.map((pt) => (
          <circle key={pt.date} cx={x(pt.months)} cy={y(pt.value)} r={4} strokeWidth={2} className={pt.source === "clinic" ? "fill-charcoal stroke-charcoal" : "fill-card stroke-charcoal"} />
        ))}
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <LegendItem swatch={<span className="inline-block h-2.5 w-4 rounded-sm bg-sage-strong" />}>3rd–97th band (illustrative)</LegendItem>
        <LegendItem swatch={<span className="inline-block w-4 border-t-2 border-dashed border-forest" />}>Median (50th)</LegendItem>
        <LegendItem swatch={<span className="inline-block size-2.5 rounded-full bg-charcoal" />}>{name} · clinic</LegendItem>
        <LegendItem swatch={<span className="inline-block size-2.5 rounded-full border-2 border-charcoal bg-card" />}>{name} · home</LegendItem>
      </div>
      {ageNow > 24 && <p className="text-caption text-muted-foreground">This illustrative reference covers 0–24 months only. Older children are assessed on other age-specific charts by a clinician.</p>}
      <details className="text-callout rounded-xl bg-muted px-3 py-2">
        <summary className="cursor-pointer font-semibold text-forest">Reference table (kg)</summary>
        <table className="tabular mt-2 w-full text-right">
          <caption className="sr-only">Illustrative weight-for-age reference values in kilograms</caption>
          <thead className="text-caption text-muted-foreground">
            <tr>
              <th scope="col" className="py-1 text-left font-medium">Month</th>
              <th scope="col" className="py-1 font-medium">3rd</th>
              <th scope="col" className="py-1 font-medium">50th</th>
              <th scope="col" className="py-1 font-medium">97th</th>
            </tr>
          </thead>
          <tbody>
            {TABLE_MONTHS.map((m) => {
              const i = REF_MONTHS.indexOf(m)
              return (
                <tr key={m}>
                  <th scope="row" className="py-0.5 text-left font-normal">{m}</th>
                  <td>{ref.p3[i]}</td>
                  <td>{ref.p50[i]}</td>
                  <td>{ref.p97[i]}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {plotted.length > 0 && (
          <p className="mt-2 text-caption text-muted-foreground">
            {name}: {plotted.map((pt) => `${pt.value} kg at ~${Math.round(pt.months)} months (${pt.source})`).join("; ")}.
          </p>
        )}
      </details>
      <p className="text-caption text-muted-foreground">
        Simplified values for illustration, not the official WHO tables. NutriPlan doesn&apos;t calculate percentiles or classify growth, and never uses adult BMI for babies or children. Please ask a clinician to interpret {name}&apos;s growth, especially if a premature birth means a corrected age applies.
      </p>
    </Surface>
  )
}
