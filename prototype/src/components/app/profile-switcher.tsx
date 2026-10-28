"use client"

import Link from "next/link"
import { Check, ChevronDown, Plus } from "lucide-react"
import { useApp, useActiveProfile } from "@/lib/store"
import { ageInMonths, ageInYears } from "@/lib/nutrition"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import type { Profile } from "@/lib/types"

export function ProfileAvatar({ profile, size = "md" }: { profile: Pick<Profile, "name" | "avatarColor">; size?: "sm" | "md" | "lg" }) {
  const color = { sage: "bg-sage text-forest", terracotta: "bg-[#f3e2d9] text-terracotta-text", forest: "bg-forest text-ivory" }[profile.avatarColor]
  const dims = { sm: "size-7 text-xs", md: "size-9 text-sm", lg: "size-14 text-lg" }[size]
  return <span className={cn("grid shrink-0 place-items-center rounded-full font-semibold", color, dims)}>{profile.name.slice(0, 1).toUpperCase()}</span>
}

export function profileAgeLabel(p: Profile): string {
  if (p.type === "adult") return `${ageInYears(p.dateOfBirth)} years`
  const m = ageInMonths(p.dateOfBirth)
  return m < 24 ? `${m} months` : `${Math.floor(m / 12)} years`
}

/** Header profile switcher, shown when dependent profiles exist (§5.10, §44.6). */
export function ProfileSwitcher() {
  const profiles = useApp((s) => s.profiles)
  const setActive = useApp((s) => s.setActiveProfile)
  const active = useActiveProfile()
  if (!active) return null
  if (profiles.length < 2)
    return (
      <Link href="/profile" aria-label="Profile">
        <ProfileAvatar profile={active} />
      </Link>
    )
  return (
    <Sheet>
      <SheetTrigger className="flex h-10 items-center gap-1.5 rounded-full border border-border/80 bg-card pr-2.5 pl-1.5" aria-label={`Viewing ${active.name}. Switch profile`}>
        <ProfileAvatar profile={active} size="sm" />
        <span className="max-w-20 truncate text-sm font-medium">{active.name}</span>
        <ChevronDown className="size-4 text-muted-foreground" />
      </SheetTrigger>
      <SheetContent side="bottom" className="mx-auto max-w-[440px] rounded-t-3xl pb-safe">
        <SheetHeader>
          <SheetTitle>Switch profile</SheetTitle>
        </SheetHeader>
        <ul className="space-y-2 px-4 pb-6">
          {profiles.map((p) => (
            <li key={p.id}>
              <button onClick={() => setActive(p.id)} className={cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left", p.id === active.id && "border-forest bg-sage/40")}>
                <ProfileAvatar profile={p} />
                <div className="flex-1">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.relation === "self" ? "You" : p.type === "infant" ? "Baby" : p.relation === "child" ? "Child" : "Family member"} · {profileAgeLabel(p)}
                  </p>
                </div>
                {p.id === active.id && <Check className="size-5 text-forest" />}
              </button>
            </li>
          ))}
          <li>
            <Link href="/profile/family" className="flex items-center gap-3 rounded-xl border border-dashed p-3 text-muted-foreground">
              <span className="grid size-9 place-items-center rounded-full bg-muted">
                <Plus className="size-4" />
              </span>
              Add a profile
            </Link>
          </li>
        </ul>
      </SheetContent>
    </Sheet>
  )
}
