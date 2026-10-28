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
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-grey" aria-hidden />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search foods — rice, dal, ডিম…" className="pl-9" aria-label="Search foods" autoFocus={autoFocus} />
      </div>
      <ul className="divide-y rounded-xl border bg-card">
        {list.length === 0 && <li className="p-4 text-sm text-muted-foreground">No match in our verified food list. Try another name.</li>}
        {list.map((f) => {
          const flag = infantFlags(f.id, profile)
          const picked = selectedIds.includes(f.id)
          return (
            <li key={f.id}>
              <button onClick={() => onPick(f.id)} className="flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted/50">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {f.name} <span lang="bn" className="font-normal text-muted-foreground">· {f.nameBn}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {f.state === "raw" || f.state === "dry" ? `${f.state} weight` : f.state} · {f.units[0]?.label}
                    {f.variant === "restaurant" && " · restaurant style"}
                  </p>
                  {flag && <p className="text-xs font-medium text-safety">{flag}</p>}
                </div>
                <span className={cn("grid size-8 shrink-0 place-items-center rounded-full", picked ? "bg-forest text-primary-foreground" : "bg-sage text-forest")}>
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
      <SheetContent side="bottom" className="mx-auto max-h-[85dvh] max-w-[440px] overflow-y-auto rounded-t-3xl px-4 pt-5 pb-safe">
        <SheetTitle>{title}</SheetTitle>
        <SheetDescription className="sr-only">Search the verified food list</SheetDescription>
        <div className="pb-6">
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
