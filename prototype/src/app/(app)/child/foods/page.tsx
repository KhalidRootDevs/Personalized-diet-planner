"use client"

import { useState } from "react"
import Link from "next/link"
import { Baby, Check, Clock, Plus, Sparkles, Sprout, Stethoscope, Utensils } from "lucide-react"
import { toast } from "sonner"
import { FOODS } from "@/lib/data/foods"
import { ageInMonths } from "@/lib/nutrition"
import { formatDay, todayISO, uid } from "@/lib/date"
import { useApp } from "@/lib/store"
import { useAreaD, useAreaDSync } from "@/lib/area-d-store"
import { useConsent } from "@/lib/consent"
import { track } from "@/lib/analytics"
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
import { RECIPE_PHOTO } from "@/lib/data/photos"
import { EmptyState, IconTile, ListGroup, ListRow, PageBody, PageHeader, Pill, Section, StatTile, Surface, type PillTone } from "@/components/app/page"
import { ALLERGENS_TO_INTRODUCE, feedingStage } from "@/components/child/feeding"
import { useChildProfile } from "@/components/child/use-child"
import { newFoodCandidates, type NewFoodCandidate } from "@/components/child/child-checks"

const TEXTURES = ["Smooth purée", "Smooth mash", "Mashed with soft lumps", "Finely mashed", "Soft finger food", "Chopped soft", "Family food, cut small"]
const ACCEPTED: Record<IntroducedFood["accepted"], string> = { yes: "Accepted", somewhat: "Tried a little", no: "Not yet" }
const ACCEPTED_TONE: Record<IntroducedFood["accepted"], PillTone> = { yes: "sage", somewhat: "neutral", no: "outline" }

/** Food introduction tracker (§12.4, §12.8). Reactions are recorded, never auto-labelled as allergies. */
export default function ChildFoodsPage() {
  const child = useChildProfile()
  const all = useApp((s) => s.introduced)
  const addIntroduced = useApp((s) => s.addIntroduced)
  const journal = useApp((s) => s.journal)
  const checked = useAreaD((s) => s.childFoodChecks)
  const markChecked = useAreaD((s) => s.markChildFoodCheck)
  const canEdit = useConsent("child_data")
  const [open, setOpen] = useState(false)
  const [prefill, setPrefill] = useState<NewFoodCandidate | null>(null)
  useAreaDSync()

  if (!child)
    return (
      <>
        <PageHeader title="Food introduction" back="/child" />
        <PageBody>
          <EmptyState icon={<Baby />} title="No child profile yet" description="Add a child profile to start tracking first foods." action={<Button asChild><Link href="/profile/family">Add a child profile</Link></Button>} />
        </PageBody>
      </>
    )

  const months = ageInMonths(child.dateOfBirth)
  const stage = feedingStage(months)
  const foods = all.filter((f) => f.profileId === child.id).sort((a, b) => b.date.localeCompare(a.date))
  const tried = new Set(foods.map((f) => f.foodName.toLowerCase()))
  const next = stage.nextFoods.filter((n) => !tried.has(n.toLowerCase()))
  const candidates = newFoodCandidates(journal, all, child.id, checked)
  const title = stage.baby ? "Food introduction" : "Foods tried"

  return (
    <>
      <PageHeader
        title={title}
        subtitle={`${child.name} · ${months < 24 ? `${months} months` : `${Math.floor(months / 12)} years`}`}
        back="/child"
        action={
          <Button
            size="sm"
            disabled={!canEdit}
            onClick={() => {
              setPrefill(null)
              setOpen(true)
            }}
          >
            <Plus /> Add
          </Button>
        }
      />
      <PageBody>
        <div className="grid grid-cols-2 gap-3">
          <StatTile className="bg-sage" icon={<Utensils />} iconTone="white" label={<span className="flex items-center gap-1.5">{stage.baby ? "Foods introduced" : "Foods tried"} <FeatureBadge feature="baby_module" /></span>} value={foods.length} />
          <StatTile className="bg-amber-tint" icon={<Stethoscope />} iconTone="white" label="Reactions noted" value={foods.filter((f) => f.reaction && f.reaction !== "None observed").length} hint="For your clinician" />
        </div>

        {!canEdit && (
          <InfoNote title="Read-only">
            You withdrew permission to store child information. You can view these records, but adding foods is paused until you allow it again in{" "}
            <Link href="/profile/privacy" className="font-semibold text-forest underline underline-offset-2">
              Privacy and data
            </Link>
            .
          </InfoNote>
        )}

        {candidates.length > 0 && (
          <Section title="Is this a new food?" description={`Logged for ${child.name} recently but not in the tracker. Adding it keeps one record of first tries.`}>
            <div id="new-foods" className="scroll-mt-20 space-y-2.5">
              {candidates.map((c) => (
                <Surface key={c.key}>
                  <div className="flex items-center gap-3">
                    <IconTile tone="amber">
                      <Sparkles />
                    </IconTile>
                    <div className="min-w-0 flex-1">
                      <p className="text-body font-medium">{c.name}</p>
                      <p className="text-caption text-muted-foreground">Logged {formatDay(c.date, { weekday: "short", day: "numeric", month: "short" })}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" disabled={!canEdit} onClick={() => markChecked(c.key)}>
                      Not new
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={!canEdit}
                      onClick={() => {
                        setPrefill(c)
                        setOpen(true)
                      }}
                    >
                      <Check /> Yes, add it
                    </Button>
                  </div>
                </Surface>
              ))}
            </div>
          </Section>
        )}

        {foods.some((f) => f.reaction && f.reaction !== "None observed") && (
          <CautionNote title="A reaction was recorded">
            Discuss recorded reactions with your clinician before offering that food again. NutriPlan does not decide whether a reaction is an allergy.
          </CautionNote>
        )}

        <Section title="Introduced foods">
          {foods.length === 0 ? (
            <EmptyState icon={<Utensils />} title="No foods recorded yet" description="Add each new food the first time you offer it." />
          ) : (
            <ul className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-card shadow-card">
              {foods.map((f) => {
                const reacted = f.reaction && f.reaction !== "None observed"
                return (
                  <li key={f.id} className="px-4 py-3.5">
                    <div className="flex items-start gap-3">
                      {!reacted && babyFoodPhoto(f.foodName) ? (
                        // eslint-disable-next-line @next/next/no-img-element -- static prototype asset
                        <img src={babyFoodPhoto(f.foodName)} alt="" className="size-12 shrink-0 rounded-full object-cover" />
                      ) : (
                        <IconTile tone={reacted ? "caution" : "sage"} className="size-12">
                          <Utensils />
                        </IconTile>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-body font-medium">{f.foodName}</p>
                          <Pill tone={ACCEPTED_TONE[f.accepted]}>{ACCEPTED[f.accepted]}</Pill>
                        </div>
                        <p className="text-caption mt-0.5 text-muted-foreground">
                          {formatDay(f.date, { day: "numeric", month: "short" })} · {f.texture} · {f.preparation}
                        </p>
                        {reacted ? (
                          <div className="text-caption mt-2.5 rounded-xl bg-caution-surface px-3 py-2.5 text-charcoal">
                            <p className="font-semibold text-caution">Reaction noted</p>
                            <p className="mt-0.5">{f.reaction?.replace(/\s*[—-]\s*discuss with (your )?clinician\.?$/i, "")}</p>
                            <p className="mt-1.5 flex items-center gap-1.5 font-medium">
                              <Stethoscope className="size-3.5" /> Discuss with your clinician
                            </p>
                          </div>
                        ) : (
                          <p className="text-caption mt-1 text-muted-foreground">No reaction noted</p>
                        )}
                        {f.clinicianAdvisedAvoid && (
                          <Pill tone="safety" className="mt-2">
                            Clinician advised avoiding for now
                          </Pill>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Section>

        {stage.solidsPlanned && next.length > 0 && (
          <Section title="Foods you could try next" description="Introduce one new food at a time and wait a few days before the next, so you can notice any reaction.">
            <div className="flex flex-wrap gap-2">
              {next.map((n) => (
                <span key={n} className="text-callout inline-flex h-9 items-center gap-1.5 rounded-full bg-card px-3.5 shadow-card">
                  <Sprout className="size-4 text-fiber" aria-hidden />
                  {n}
                </span>
              ))}
            </div>
          </Section>
        )}

        {stage.id !== "child" && stage.id !== "milk_only" && (
        <Section title="Common allergens">
          <InfoNote title="Introducing allergenic foods">
            Many guidelines suggest offering common allergenic foods during the first year, prepared safely and one at a time. If your baby has severe eczema or a known allergy, ask your clinician first.
          </InfoNote>
          <ListGroup>
            {ALLERGENS_TO_INTRODUCE.map((a) => {
              const key = a.split(" ")[0].toLowerCase()
              const done = [...tried].some((t) => t.split(/[\s-]+/).includes(key))
              return <ListRow key={a} icon={done ? <Check /> : <Clock />} iconTone={done ? "sage" : "muted"} title={a} trailing={<Pill tone={done ? "sage" : "outline"}>{done ? "Introduced" : "Not yet"}</Pill>} />
            })}
          </ListGroup>
        </Section>
        )}

        <SafetyAlert title="Signs of a serious reaction" emergency>
          Swelling of the face or lips, trouble breathing, repeated vomiting or unusual floppiness need urgent medical help.
        </SafetyAlert>
      </PageBody>

      <AddFoodSheet
        key={prefill?.key ?? "blank"}
        open={open}
        onOpenChange={setOpen}
        months={months}
        initialName={prefill?.name}
        initialDate={prefill?.date}
        onSave={(f) => {
          if (!canEdit) return
          addIntroduced({ ...f, id: uid("intro"), profileId: child.id })
          if (prefill) markChecked(prefill.key)
          track("child_food_added", { fromJournal: !!prefill })
          setPrefill(null)
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
  initialName,
  initialDate,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  months: number
  onSave: (f: Omit<IntroducedFood, "id" | "profileId">) => void
  initialName?: string
  initialDate?: string
}) {
  const [foodName, setFoodName] = useState(initialName ?? "")
  const [date, setDate] = useState(initialDate ?? todayISO())
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
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Add a food</SheetTitle>
          <SheetDescription>{initialName ? "Add the details of this first try. Reactions are recorded, never labelled as allergies." : "Record the first time you offered a new food."}</SheetDescription>
        </SheetHeader>
        <form
          className="space-y-5 px-5 pt-2"
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
                <ToggleGroupItem key={k} value={k} className="flex-1 text-[13px]">
                  {ACCEPTED[k]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <p className="text-caption text-muted-foreground">It can take many tries before a child accepts a new food. That&apos;s normal.</p>
          </div>
          <div className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-muted">
            <div className="flex min-h-14 items-center justify-between gap-3 px-4 py-3">
              <Label htmlFor="reaction" className="text-body leading-snug font-medium">Did you notice any reaction?</Label>
              <Switch id="reaction" checked={hadReaction} onCheckedChange={setHadReaction} />
            </div>
            <div className="flex min-h-14 items-center justify-between gap-3 px-4 py-3">
              <Label htmlFor="avoid" className="text-body leading-snug font-medium">My clinician advised avoiding this food</Label>
              <Switch id="avoid" checked={clinicianAdvisedAvoid} onCheckedChange={setAvoid} />
            </div>
          </div>
          {hadReaction && (
            <div className="space-y-1.5">
              <Textarea value={reaction} onChange={(e) => setReaction(e.target.value)} placeholder="What did you notice, and when?" />
              <p className="text-caption text-muted-foreground">We&apos;ll record this and suggest discussing it with your clinician. We won&apos;t label it as an allergy.</p>
            </div>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={!foodName.trim() || tooYoung}>
            Save food
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}

/** Photo for common first foods (illustrative; matched by name). */
function babyFoodPhoto(name: string): string | undefined {
  const n = name.toLowerCase()
  if (n.includes("egg")) return RECIPE_PHOTO.r_inf_egg
  if (n.includes("banana")) return RECIPE_PHOTO.r_inf_banana
  if (n.includes("pumpkin")) return RECIPE_PHOTO.r_inf_pumpkin
  if (n.includes("khichuri")) return RECIPE_PHOTO.r_inf_khichuri
  if (n.includes("dal") || n.includes("lentil")) return RECIPE_PHOTO.r_inf_dal_puree
  return undefined
}
