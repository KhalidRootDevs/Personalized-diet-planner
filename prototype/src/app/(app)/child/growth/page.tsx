"use client"

import { useState } from "react"
import Link from "next/link"
import { Baby, Plus, Ruler } from "lucide-react"
import { toast } from "sonner"
import { formatDay, todayISO, uid } from "@/lib/date"
import { ageInMonths } from "@/lib/nutrition"
import { useApp } from "@/lib/store"
import type { GrowthRecord } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { InfoNote } from "@/components/app/alerts"
import { FeatureBadge } from "@/components/app/badges"
import { EmptyState, ListGroup, ListRow, PageBody, PageHeader, Pill, Section, StatTile, Surface } from "@/components/app/page"
import { LegendItem, LineTrend } from "@/components/progress/charts"
import { useChildProfile } from "@/components/child/use-child"

/** Growth records (§6.6, §12). Measurements only — interpretation belongs to clinicians. */
export default function ChildGrowthPage() {
  const child = useChildProfile()
  const all = useApp((s) => s.growth)
  const addGrowth = useApp((s) => s.addGrowth)
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
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus /> Add
          </Button>
        }
      />
      <PageBody>
        {latest && (
          <div className="grid grid-cols-2 gap-2">
            <StatTile className="bg-sky-tint" label="Latest weight" value={latestW?.weightKg ?? "–"} unit="kg" hint={latestW ? formatDay(latestW.date, { day: "numeric", month: "short" }) : undefined} />
            <StatTile className="bg-amber-tint" label="Latest length" value={latestL?.lengthCm ?? "–"} unit="cm" hint={latestL ? formatDay(latestL.date, { day: "numeric", month: "short" }) : undefined} />
          </div>
        )}

        <InfoNote title="A measurement, not a diagnosis">
          These records help you and your clinician follow {child.name}&apos;s growth over time. Growth is assessed on WHO growth charts by a health professional. NutriPlan does not interpret these numbers.
        </InfoNote>

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
        <p className="text-caption px-1 text-muted-foreground">If you are worried about your child&apos;s growth, feeding or weight, please speak to your clinician. Measurements never change feeding guidance on their own.</p>
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
