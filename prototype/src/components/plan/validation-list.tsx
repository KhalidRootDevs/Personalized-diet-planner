"use client"

import { CircleAlert, CircleMinus, ShieldCheck, TriangleAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PlanCheck } from "@/lib/types"

/** Per-check validation results (§10.5): honest pass / note / fail / not applicable, never hard-coded. */
function CheckRow({ c }: { c: PlanCheck }) {
  const tone = { pass: "bg-sage text-forest", warn: "bg-caution-surface text-caution", fail: "bg-safety-surface text-safety", na: "bg-muted text-muted-foreground" }[c.status]
  const Icon = { pass: ShieldCheck, warn: TriangleAlert, fail: CircleAlert, na: CircleMinus }[c.status]
  const word = { pass: "Passed", warn: "Note", fail: "Failed", na: "Not applicable" }[c.status]
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <span className={cn("grid size-7 shrink-0 place-items-center rounded-full", tone)}>
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-callout font-medium">
          {c.label} <span className="text-caption font-normal text-muted-foreground">· {word}</span>
        </p>
        <p className="text-caption text-muted-foreground">{c.detail}</p>
      </div>
    </li>
  )
}

export function ValidationList({ checks }: { checks: PlanCheck[] }) {
  return (
    <ul className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-card shadow-card">
      {checks.map((c) => (
        <CheckRow key={c.id} c={c} />
      ))}
    </ul>
  )
}

