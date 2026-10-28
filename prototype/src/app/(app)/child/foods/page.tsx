"use client"

import { useState } from "react"
import Link from "next/link"
import { Baby, Check, Plus, Stethoscope } from "lucide-react"
import { toast } from "sonner"
import { FOODS } from "@/lib/data/foods"
import { ageInMonths } from "@/lib/nutrition"
import { formatDay, todayISO, uid } from "@/lib/date"
import { useApp } from "@/lib/store"
import { cn } from "@/lib/utils"
import type { IntroducedFood } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { FeatureBadge } from "@/components/app/badges"
import { CautionNote, InfoNote, SafetyAlert } from "@/components/app/alerts"
import { EmptyState, PageBody, PageHeader, Section } from "@/components/app/page"
import { ALLERGENS_TO_INTRODUCE, feedingStage } from "@/components/child/feeding"
import { useChildProfile } from "@/components/child/use-child"

const TEXTURES = ["Smooth purée", "Smooth mash", "Mashed with soft lumps", "Finely mashed", "Soft finger food", "Chopped soft"]
const ACCEPTED: Record<IntroducedFood["accepted"], string> = { yes: "Accepted", somewhat: "Tried a little", no: "Not yet" }

/** Food introduction tracker (§12.4, §12.8). Reactions are recorded, never auto-labelled as allergies. */
export default function ChildFoodsPage() {
  const child = useChildProfile()
  const all = useApp((s) => s.introduced)
  const addIntroduced = useApp((s) => s.addIntroduced)
  const [open, setOpen] = useState(false)

  if (!child)
    return (
      <>
        <PageHeader title="Food introduction" back="/child" />
        <PageBody>
          <EmptyState icon={<Baby className="size-6" />} title="No child profile yet" description="Add a child profile to start tracking first foods." action={<Button asChild><Link href="/profile/family">Add a child profile</Link></Button>} />
        </PageBody>
      </>
    )

  const months = ageInMonths(child.dateOfBirth)
  const stage = feedingStage(months)
  const foods = all.filter((f) => f.profileId === child.id).sort((a, b) => b.date.localeCompare(a.date))
  const tried = new Set(foods.map((f) => f.foodName.toLowerCase()))
  const next = stage.nextFoods.filter((n) => !tried.has(n.toLowerCase()))

  return (
    <>
      <PageHeader
        title="Food introduction"
        subtitle={`${child.name} · ${months} months`}
        back="/child"
        action={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus /> Add
          </Button>
        }
      />
      <PageBody>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FeatureBadge feature="baby_module" /> {foods.length} foods introduced so far
        </div>

        {foods.some((f) => f.reaction && f.reaction !== "None observed") && (
          <CautionNote title="A reaction was recorded">
            Discuss recorded reactions with your clinician before offering that food again. NutriPlan does not decide whether a reaction is an allergy.
          </CautionNote>
        )}

        <Section title="Introduced foods">
          {foods.length === 0 ? (
            <InfoNote>No foods recorded yet. Add each new food the first time you offer it.</InfoNote>
          ) : (
            <ul className="space-y-2">
              {foods.map((f) => {
                const reacted = f.reaction && f.reaction !== "None observed"
                return (
                  <li key={f.id} className={cn("rounded-xl border bg-card p-3", reacted && "border-caution/40")}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium">{f.foodName}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDay(f.date)} · {f.texture}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-sage px-2 py-0.5 text-xs font-medium text-forest">{ACCEPTED[f.accepted]}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{f.preparation}</p>
                    {reacted ? (
                      <div className="mt-2 rounded-lg bg-caution-surface p-2.5 text-sm">
                        <p className="font-medium text-caution">Reaction noted</p>
                        <p>{f.reaction}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-charcoal/90">
                          <Stethoscope className="size-4" /> Discuss with your clinician
                        </p>
                      </div>
                    ) : (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Check className="size-4 text-forest" /> No reaction noted
                      </p>
                    )}
                    {f.clinicianAdvisedAvoid && <p className="mt-2 text-sm font-medium text-safety">Your clinician advised avoiding this food for now.</p>}
                  </li>
                )
              })}
            </ul>
          )}
        </Section>

        {stage.solidsPlanned && next.length > 0 && (
          <Section title="Foods you could try next">
            <div className="flex flex-wrap gap-2">
              {next.map((n) => (
                <span key={n} className="rounded-full border bg-card px-3 py-1.5 text-sm">
                  {n}
                </span>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">Introduce one new food at a time and wait a few days before the next, so you can notice any reaction.</p>
          </Section>
        )}

        <Section title="Common allergens">
          <InfoNote title="Introducing allergenic foods">
            Many guidelines suggest offering common allergenic foods during the first year, prepared safely and one at a time. If your baby has severe eczema or a known allergy, ask your clinician first.
          </InfoNote>
          <ul className="space-y-1.5 text-sm">
            {ALLERGENS_TO_INTRODUCE.map((a) => (
              <li key={a} className="flex items-center gap-2">
                <span className={cn("size-1.5 rounded-full", tried.has(a.split(" ")[0].toLowerCase()) ? "bg-forest" : "bg-muted-grey")} /> {a}
              </li>
            ))}
          </ul>
        </Section>

        <SafetyAlert title="Signs of a serious reaction" emergency>
          Swelling of the face or lips, trouble breathing, repeated vomiting or unusual floppiness need urgent medical help.
        </SafetyAlert>
      </PageBody>

      <AddFoodSheet
        open={open}
        onOpenChange={setOpen}
        months={months}
        onSave={(f) => {
          addIntroduced({ ...f, id: uid("intro"), profileId: child.id })
          setOpen(false)
          toast.success(`${f.foodName} added to the tracker`)
        }}
      />
    </>
  )
}

function AddFoodSheet({
  open,
  onOpenChange,
  months,
  onSave,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  months: number
  onSave: (f: Omit<IntroducedFood, "id" | "profileId">) => void
}) {
  const [foodName, setFoodName] = useState("")
  const [date, setDate] = useState(todayISO())
  const [preparation, setPreparation] = useState("")
  const [texture, setTexture] = useState(TEXTURES[0])
  const [accepted, setAccepted] = useState<IntroducedFood["accepted"]>("yes")
  const [hadReaction, setHadReaction] = useState(false)
  const [reaction, setReaction] = useState("")
  const [clinicianAdvisedAvoid, setAvoid] = useState(false)

  // Deterministic age/safety check against the food database (§12.5, §13).
  const q = foodName.trim().toLowerCase()
  const match = q.length >= 3 ? FOODS.find((f) => f.name.toLowerCase().includes(q) || q.includes(f.name.toLowerCase().split(" ")[0])) : undefined
  const tooYoung = match?.infantSafeFromMonths !== undefined && months < match.infantSafeFromMonths
  const choking = !!match?.chokingRisk

  const reset = () => {
    setFoodName("")
    setDate(todayISO())
    setPreparation("")
    setTexture(TEXTURES[0])
    setAccepted("yes")
    setHadReaction(false)
    setReaction("")
    setAvoid(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) reset()
      }}
    >
      <SheetContent side="bottom" className="mx-auto max-h-[90dvh] max-w-[440px] overflow-y-auto rounded-t-3xl pb-safe">
        <SheetHeader>
          <SheetTitle>Add a food</SheetTitle>
          <SheetDescription>Record the first time you offered a new food.</SheetDescription>
        </SheetHeader>
        <form
          className="space-y-4 px-4 pb-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!foodName.trim() || tooYoung) return
            onSave({
              foodName: foodName.trim(),
              date,
              preparation: preparation.trim() || "Not recorded",
              texture,
              accepted,
              reaction: hadReaction && reaction.trim() ? `${reaction.trim()} — discuss with clinician` : "None observed",
              clinicianAdvisedAvoid,
            })
            reset()
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="food">Food</Label>
            <Input id="food" value={foodName} onChange={(e) => setFoodName(e.target.value)} placeholder="e.g. Mashed carrot" required />
          </div>
          {tooYoung && (
            <SafetyAlert title={`${match?.name} is not safe before ${match?.infantSafeFromMonths} months`}>
              {match?.id === "honey" ? "Honey can cause infant botulism, even when cooked. " : ""}Please don&apos;t offer this food yet.
            </SafetyAlert>
          )}
          {!tooYoung && choking && (
            <CautionNote title="Choking hazard in its usual form">
              Never offer {match?.name.toLowerCase()} whole. Ask your clinician about a safe form, such as a smooth paste thinned with water or milk.
            </CautionNote>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Texture</Label>
              <Select value={texture} onValueChange={setTexture}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEXTURES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prep">How it was prepared</Label>
            <Input id="prep" value={preparation} onChange={(e) => setPreparation(e.target.value)} placeholder="e.g. Steamed and mashed" />
          </div>
          <div className="space-y-1.5">
            <Label>How did it go?</Label>
            <ToggleGroup type="single" variant="outline" value={accepted} onValueChange={(v) => v && setAccepted(v as IntroducedFood["accepted"])} className="w-full">
              {(Object.keys(ACCEPTED) as IntroducedFood["accepted"][]).map((k) => (
                <ToggleGroupItem key={k} value={k} className="flex-1 text-xs">
                  {ACCEPTED[k]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <p className="text-xs text-muted-foreground">It can take many tries before a baby accepts a new food. That&apos;s normal.</p>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3">
            <Label htmlFor="reaction">Did you notice any reaction?</Label>
            <Switch id="reaction" checked={hadReaction} onCheckedChange={setHadReaction} />
          </div>
          {hadReaction && (
            <div className="space-y-1.5">
              <Textarea value={reaction} onChange={(e) => setReaction(e.target.value)} placeholder="What did you notice, and when?" />
              <p className="text-xs text-muted-foreground">We&apos;ll record this and suggest discussing it with your clinician. We won&apos;t label it as an allergy.</p>
            </div>
          )}
          <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3">
            <Label htmlFor="avoid">My clinician advised avoiding this food</Label>
            <Switch id="avoid" checked={clinicianAdvisedAvoid} onCheckedChange={setAvoid} />
          </div>
          <Button type="submit" className="w-full" disabled={!foodName.trim() || tooYoung}>
            Save food
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
