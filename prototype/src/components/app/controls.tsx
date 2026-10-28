"use client"

/**
 * Input and choice controls (UI-SPEC §4.6): segmented control, stepper, choice card,
 * chips and form fields. The only implementations of these patterns.
 */
import { Check, ChevronDown, Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

/** Segmented control (spec §4.6): 44 px track, white active segment. */
export function Segmented<T extends string>({ options, value, onChange, label, className }: { options: { value: T; label: React.ReactNode }[]; value: T; onChange: (v: T) => void; label: string; className?: string }) {
  return (
    <div role="tablist" aria-label={label} className={cn("grid h-11 gap-1 rounded-full bg-muted p-1", className)} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "text-callout flex items-center justify-center gap-1 truncate rounded-full px-1.5 font-medium transition-colors",
            value === o.value ? "bg-card font-semibold text-charcoal shadow-card" : "text-muted-foreground hover:text-charcoal",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** – value + stepper with 40 px round buttons. */
export function Stepper({ value, onDec, onInc, decDisabled, incDisabled, label, suffix }: { value: React.ReactNode; onDec: () => void; onInc: () => void; decDisabled?: boolean; incDisabled?: boolean; label: string; suffix?: string }) {
  const btn = "grid size-10 place-items-center rounded-full border border-input bg-card text-charcoal transition-colors hover:bg-muted disabled:opacity-40"
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" className={btn} aria-label={`Fewer ${label}`} disabled={decDisabled} onClick={onDec}>
        <Minus className="size-4" />
      </button>
      <span className="tabular text-headline min-w-9 text-center">
        {value}
        {suffix && <span className="text-caption font-normal text-muted-foreground"> {suffix}</span>}
      </span>
      <button type="button" className={btn} aria-label={`More ${label}`} disabled={incDisabled} onClick={onInc}>
        <Plus className="size-4" />
      </button>
    </div>
  )
}

/** Selectable option card (UI-SPEC §4.6): lime border, tint and check when selected. */
export function ChoiceCard({
  selected,
  onSelect,
  title,
  description,
  icon,
  disabled,
  badge,
  mode = "radio",
  className,
}: {
  selected: boolean
  onSelect: () => void
  title: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  disabled?: boolean
  badge?: React.ReactNode
  /** radio inside a radiogroup (single choice); toggle for independent on/off cards */
  mode?: "radio" | "toggle"
  className?: string
}) {
  return (
    <button
      type="button"
      role={mode === "radio" ? "radio" : undefined}
      aria-checked={mode === "radio" ? selected : undefined}
      aria-pressed={mode === "toggle" ? selected : undefined}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 bg-card px-4 py-3.5 text-left shadow-card transition-colors",
        selected ? "border-lime bg-sage" : "border-transparent hover:bg-muted/50",
        disabled && "cursor-not-allowed opacity-60 hover:bg-card",
        className,
      )}
    >
      {icon && <span className={cn("grid size-10 shrink-0 place-items-center rounded-full [&_svg]:size-5", selected ? "bg-lime text-charcoal" : "bg-sage text-lime-text")}>{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="text-body flex flex-wrap items-center gap-2 font-medium">
          {title}
          {badge}
        </span>
        {description && <span className="text-caption mt-0.5 block text-muted-foreground">{description}</span>}
      </span>
      <span className={cn("grid size-[22px] shrink-0 place-items-center rounded-full border-[1.5px]", selected ? "border-forest bg-forest text-white" : "border-input")}>
        {selected && <Check className="size-3.5" strokeWidth={3} />}
      </span>
    </button>
  )
}

/** Filter / multi-select chip (36 px). */
export function Chip({ selected, onClick, children, className }: { selected: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(CHIP, "shrink-0 whitespace-nowrap [&_svg]:size-4", selected ? CHIP_ON : CHIP_OFF, className)}
    >
      {children}
    </button>
  )
}

const CHIP = "text-callout inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 font-medium transition-colors"
const CHIP_ON = "border-lime bg-lime text-charcoal"
const CHIP_OFF = "border-transparent bg-card text-charcoal shadow-card hover:bg-muted"

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
          <button key={o.value} type="button" aria-pressed={on} onClick={() => onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])} className={cn(CHIP, on ? CHIP_ON : CHIP_OFF)}>
            {on && <Check className="size-3.5" strokeWidth={2.5} />}
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
          <button key={o.value} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.value)} className={cn(CHIP, on ? CHIP_ON : CHIP_OFF)}>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/** Labelled form field: label above, 6 px gap, helper or error caption below (UI-SPEC §4.6). */
export function Field({ label, hint, htmlFor, children, error }: { label: string; hint?: React.ReactNode; htmlFor?: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-callout font-medium text-charcoal">
        {label}
      </Label>
      {children}
      {error ? <p className="text-caption font-medium text-safety">{error}</p> : hint ? <p className="text-caption text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

/** Group heading for a block of fields inside a form screen. */
export function FieldGroup({ title, description, children }: { title: string; description?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-headline">{title}</h2>
        {description && <p className="text-callout mt-0.5 text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}

export function WhyWeAsk({ children }: { children: React.ReactNode }) {
  return (
    <details className="group text-callout rounded-2xl bg-muted px-4 py-3">
      <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-forest [&::-webkit-details-marker]:hidden">
        Why we ask
        <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="mt-2 text-muted-foreground">{children}</div>
    </details>
  )
}
