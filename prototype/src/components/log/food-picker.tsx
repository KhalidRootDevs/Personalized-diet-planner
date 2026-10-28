"use client"

import { useMemo, useState } from "react"
import { Check, Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { FOODS } from "@/lib/data/foods"
import { infantFlags } from "@/lib/area-b-log"
import { cn } from "@/lib/utils"
import type { Profile } from "@/lib/types"

/** Searchable list of verified foods (§8). Infant profiles see safety flags inline (§12.4). */
export function FoodSearchList({ onPick, selectedIds = [], profile, autoFocus }: { onPick: (foodId: string) => void; selectedIds?: string[]; profile?: Profile; autoFocus?: boolean }) {
  const [q, setQ] = useState("")
  const infant = profile && profile.type !== "adult"
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return FOODS.filter((f) => (infant ? true : f.id !== "breast_milk"))
      .filter((f) => !s || f.name.toLowerCase().includes(s) || f.nameBn.includes(s) || f.category.includes(s))
      .slice(0, 40)
  }, [q, infant])

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-muted-grey" aria-hidden />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search foods — rice, dal, ডিম…" className="pl-11" aria-label="Search foods" autoFocus={autoFocus} />
      </div>
      <ul className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-card shadow-card">
        {list.length === 0 && <li className="text-callout p-4 text-muted-foreground">No match in our verified food list. Try another name.</li>}
        {list.map((f) => {
          const flag = infantFlags(f.id, profile)
          const picked = selectedIds.includes(f.id)
          return (
            <li key={f.id}>
              <button onClick={() => onPick(f.id)} className="flex min-h-[60px] w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/50 active:bg-muted">
                <div className="min-w-0 flex-1">
                  <p className="text-body font-medium">
                    {f.name} <span lang="bn" className="font-normal text-muted-foreground">· {f.nameBn}</span>
                  </p>
                  <p className="text-caption mt-0.5 text-muted-foreground">
                    {f.state === "raw" || f.state === "dry" ? `${f.state} weight` : f.state} · {f.units[0]?.label}
                    {f.variant === "restaurant" && " · restaurant style"}
                  </p>
                  {flag && <p className="text-caption mt-0.5 font-medium text-safety">{flag}</p>}
                </div>
                <span className={cn("grid size-8 shrink-0 place-items-center rounded-full transition-colors", picked ? "bg-forest text-primary-foreground" : "bg-sage text-forest")}>
                  {picked ? <Check className="size-4" /> : <Plus className="size-4" />}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function FoodPickerSheet({ trigger, onPick, profile, title = "Add a food" }: { trigger: React.ReactNode; onPick: (foodId: string) => void; profile?: Profile; title?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom">
        <SheetTitle className="px-5 pt-2">{title}</SheetTitle>
        <SheetDescription className="sr-only">Search the verified food list</SheetDescription>
        <div className="px-5 pb-2">
          <FoodSearchList
            profile={profile}
            onPick={(id) => {
              onPick(id)
              setOpen(false)
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
