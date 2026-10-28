"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

/** Large selectable card for single-choice questions (onboarding, settings). */
export function ChoiceCard({
  selected,
  onSelect,
  title,
  description,
  icon,
  disabled,
  badge,
}: {
  selected: boolean
  onSelect: () => void
  title: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  disabled?: boolean
  badge?: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left transition-colors",
        selected ? "border-forest bg-sage/40" : "hover:bg-muted/50",
        disabled && "cursor-not-allowed opacity-60 hover:bg-card",
      )}
    >
      {icon && <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg", selected ? "bg-forest text-ivory" : "bg-sage text-forest")}>{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 font-medium">
          {title}
          {badge}
        </span>
        {description && <span className="block text-sm text-muted-foreground">{description}</span>}
      </span>
      <span className={cn("grid size-5 shrink-0 place-items-center rounded-full border", selected ? "border-forest bg-forest text-ivory" : "border-input")}>
        {selected && <Check className="size-3.5" />}
      </span>
    </button>
  )
}

/** Multi-select chip list. */
export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[]
  value: T[]
  onChange: (v: T[]) => void
  label?: string
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o.value)
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])}
            className={cn("inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors", on ? "border-forest bg-forest text-ivory" : "bg-card hover:bg-muted/60")}
          >
            {on && <Check className="size-3.5" />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/** Single-select pill row. */
export function PillGroup<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[]
  value: T | undefined
  onChange: (v: T) => void
  label?: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn("inline-flex min-h-10 items-center rounded-full border px-3.5 text-sm transition-colors", on ? "border-forest bg-forest text-ivory" : "bg-card hover:bg-muted/60")}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Field({ label, hint, htmlFor, children, error }: { label: string; hint?: React.ReactNode; htmlFor?: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </Label>
      {children}
      {error ? <p className="text-xs font-medium text-safety">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

export function WhyWeAsk({ children }: { children: React.ReactNode }) {
  return (
    <details className="rounded-xl bg-muted/60 px-3 py-2 text-sm">
      <summary className="cursor-pointer font-medium text-forest">Why we ask</summary>
      <div className="mt-1 text-muted-foreground">{children}</div>
    </details>
  )
}
