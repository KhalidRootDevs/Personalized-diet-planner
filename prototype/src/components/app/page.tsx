"use client"

/**
 * Screen scaffolding and layout primitives (UI-SPEC §4). Every screen is composed from
 * these so spacing, type and surfaces stay identical across the app.
 */
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"

/* ───────────── Headers ───────────── */

/**
 * Sticky screen header.
 * - `large`: tab-root screens. Serif display title, optional subtitle, trailing actions.
 * - default: nested screens. Back button + 17 px title, trailing actions.
 */
export function PageHeader({
  title,
  subtitle,
  back,
  action,
  large,
  className,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  back?: string | true
  action?: React.ReactNode
  large?: boolean
  className?: string
}) {
  const router = useRouter()
  const backBtn = back && <BackButton href={typeof back === "string" ? back : undefined} onClick={typeof back === "string" ? undefined : () => router.back()} />
  if (large)
    return (
      <header className={cn("sticky top-0 z-20 bg-background/92 pt-safe backdrop-blur-md", className)}>
        <div className="px-gutter flex items-end gap-3 pt-5 pb-3">
          {backBtn && <div className="-ml-1 self-center">{backBtn}</div>}
          <div className="min-w-0 flex-1">
            <h1 className="text-display truncate">{title}</h1>
            {subtitle && <p className="text-callout mt-0.5 truncate text-muted-foreground">{subtitle}</p>}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2 pb-0.5">{action}</div>}
        </div>
      </header>
    )
  return (
    <header className={cn("sticky top-0 z-20 bg-background/92 pt-safe backdrop-blur-md", className)}>
      <div className="flex h-14 items-center gap-2 pr-[calc(var(--gutter)-4px)] pl-3">
        {backBtn ?? <span className="w-2" />}
        <div className="min-w-0 flex-1">
          <h1 className="text-headline truncate">{title}</h1>
          {subtitle && <p className="text-caption -mt-0.5 truncate text-muted-foreground">{subtitle}</p>}
        </div>
        {action && <div className="flex shrink-0 items-center gap-1.5">{action}</div>}
      </div>
    </header>
  )
}

/**
 * Header for task flows (UI-SPEC §5.2): back on the left, close on the right, title with
 * "Step x of n", and a progress bar — segmented for up to 5 steps, continuous above that.
 */
export function FlowHeader({
  title,
  step,
  total,
  onBack,
  backHref,
  closeHref,
  onClose,
}: {
  title: React.ReactNode
  step?: number
  total?: number
  onBack?: () => void
  backHref?: string
  closeHref?: string
  onClose?: () => void
}) {
  const hasSteps = !!(step && total)
  return (
    <header className="sticky top-0 z-20 bg-background/92 pt-safe backdrop-blur-md">
      <div className="flex h-14 items-center gap-2 pr-[calc(var(--gutter)-4px)] pl-3">
        {onBack || backHref ? <BackButton href={backHref} onClick={onBack} /> : <span className="w-2" aria-hidden />}
        <div className="min-w-0 flex-1">
          <h1 className="text-headline truncate">{title}</h1>
          {hasSteps && (
            <p className="tabular text-caption -mt-0.5 text-muted-foreground">
              Step {step} of {total}
            </p>
          )}
        </div>
        {(closeHref || onClose) && (
          <HeaderIconButton href={closeHref} onClick={onClose} label="Close">
            <X className="size-[18px]" />
          </HeaderIconButton>
        )}
      </div>
      {hasSteps && (
        <div className="px-gutter pb-2.5" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step} aria-label={`Step ${step} of ${total}`}>
          {total! <= 5 ? (
            <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
              {Array.from({ length: total! }, (_, i) => (
                <span key={i} className={cn("h-1 rounded-full transition-colors duration-200", i < step! ? "bg-forest" : "bg-border")} />
              ))}
            </div>
          ) : (
            <div className="h-1 overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-forest transition-[width] duration-300" style={{ width: `${(step! / total!) * 100}%` }} />
            </div>
          )}
        </div>
      )}
    </header>
  )
}

export function BackButton({ href, onClick, label = "Back" }: { href?: string; onClick?: () => void; label?: string }) {
  const cls = "grid size-10 shrink-0 place-items-center rounded-full text-charcoal transition-colors hover:bg-muted active:bg-border/60"
  return href ? (
    <Link href={href} className={cls} aria-label={label}>
      <ChevronLeft className="size-[22px]" />
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls} aria-label={label}>
      <ChevronLeft className="size-[22px]" />
    </button>
  )
}

/** Round icon button used in header action slots (40 px visual, 44 px with spacing). */
export function HeaderIconButton({ href, onClick, label, children, className }: { href?: string; onClick?: () => void; label: string; children: React.ReactNode; className?: string }) {
  const cls = cn("relative grid size-10 shrink-0 place-items-center rounded-full border border-border/80 bg-card text-charcoal transition-colors hover:bg-muted", className)
  return href ? (
    <Link href={href} className={cls} aria-label={label}>
      {children}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls} aria-label={label}>
      {children}
    </button>
  )
}

/* ───────────── Body & sections ───────────── */

/** Screen body: 20 px gutters, 28 px between sections. */
export function PageBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("px-gutter space-y-7 pt-2 pb-8", className)}>{children}</div>
}

export function Section({ title, action, children, className, badge, description }: { title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string; badge?: React.ReactNode; description?: React.ReactNode }) {
  return (
    <section className={cn("space-y-3", className)}>
      {(title || action) && (
        <div>
          <div className="flex min-h-7 items-center justify-between gap-3">
            {title && (
              <h2 className="text-headline flex items-center gap-2">
                {title}
                {badge}
              </h2>
            )}
            {action}
          </div>
          {description && <p className="text-callout mt-0.5 text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </section>
  )
}

/** Text link in a section header ("See all", "Edit"). */
export function SectionLink({ href, children, onClick }: { href?: string; children: React.ReactNode; onClick?: () => void }) {
  const cls = "text-callout -mr-1 rounded-lg px-1 py-0.5 font-semibold text-forest hover:underline underline-offset-4"
  return href ? (
    <Link href={href} className={cls}>
      {children}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  )
}

/* ───────────── Surfaces ───────────── */

type Tone = "default" | "sage" | "muted" | "forest" | "outline"
const SURFACE: Record<Tone, string> = {
  default: "border border-border/80 bg-card",
  sage: "bg-sage/70 text-charcoal",
  muted: "bg-muted",
  forest: "bg-forest text-ivory",
  outline: "border border-dashed border-input bg-card",
}

/** The one card style (radius 16). `tone` changes the surface, `padding` the inset. */
export function Surface({ tone = "default", padding = "md", className, children, ...props }: { tone?: Tone; padding?: "none" | "sm" | "md" | "lg"; className?: string; children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  const pad = { none: "", sm: "p-3", md: "p-4", lg: "p-5" }[padding]
  return (
    <div className={cn("rounded-2xl", SURFACE[tone], pad, className)} {...props}>
      {children}
    </div>
  )
}

/* ───────────── Lists ───────────── */

/** Inset grouped list: one card, rows separated by hairlines (UI-SPEC §4.4). */
export function ListGroup({ children, className, label }: { children: React.ReactNode; className?: string; label?: React.ReactNode }) {
  return (
    <div className={className}>
      {label && <p className="text-overline mb-2 px-1 text-muted-foreground">{label}</p>}
      <div className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/80 bg-card">{children}</div>
    </div>
  )
}

/** A row inside a ListGroup. Link, button or static. */
export function ListRow({
  href,
  onClick,
  icon,
  iconTone = "sage",
  title,
  description,
  trailing,
  chevron,
  className,
}: {
  href?: string
  onClick?: () => void
  icon?: React.ReactNode
  iconTone?: IconTone
  title: React.ReactNode
  description?: React.ReactNode
  trailing?: React.ReactNode
  chevron?: boolean
  className?: string
}) {
  const interactive = !!(href || onClick)
  const showChevron = chevron ?? interactive
  const inner = (
    <>
      {icon && <IconTile tone={iconTone}>{icon}</IconTile>}
      <div className="min-w-0 flex-1">
        <div className="text-body flex items-center gap-2 font-medium">{title}</div>
        {description && <div className="text-caption mt-0.5 text-muted-foreground">{description}</div>}
      </div>
      {trailing}
      {showChevron && <ChevronRight className="size-[18px] shrink-0 text-muted-grey" aria-hidden />}
    </>
  )
  const cls = cn("flex min-h-[60px] w-full items-center gap-3 px-4 py-3 text-left", interactive && "transition-colors hover:bg-muted/50 active:bg-muted", className)
  if (href)
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    )
  if (onClick)
    return (
      <button type="button" onClick={onClick} className={cls}>
        {inner}
      </button>
    )
  return <div className={cls}>{inner}</div>
}

/** Standalone navigation row (its own card). Prefer ListGroup + ListRow for 2+ rows. */
export function ListLink({ href, icon, title, description, trailing, className }: { href: string; icon?: React.ReactNode; title: React.ReactNode; description?: React.ReactNode; trailing?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border/80 bg-card", className)}>
      <ListRow href={href} icon={icon} title={title} description={description} trailing={trailing} />
    </div>
  )
}

/* ───────────── Small pieces ───────────── */

export type IconTone = "sage" | "forest" | "terracotta" | "muted" | "caution" | "safety" | "white"
const ICON_TONE: Record<IconTone, string> = {
  sage: "bg-sage text-forest",
  forest: "bg-forest text-ivory",
  terracotta: "bg-[#f3e2d9] text-terracotta-text",
  muted: "bg-muted text-charcoal",
  caution: "bg-caution-surface text-caution",
  safety: "bg-safety-surface text-safety",
  white: "bg-card text-forest",
}

/** Rounded-square icon container. sm 32 · md 40 · lg 48. */
export function IconTile({ children, tone = "sage", size = "md", className }: { children: React.ReactNode; tone?: IconTone; size?: "sm" | "md" | "lg"; className?: string }) {
  const dims = { sm: "size-8 rounded-[10px] [&_svg]:size-4", md: "size-10 rounded-xl [&_svg]:size-5", lg: "size-12 rounded-[14px] [&_svg]:size-6" }[size]
  return <span className={cn("grid shrink-0 place-items-center", ICON_TONE[tone], dims, className)}>{children}</span>
}

export type PillTone = "neutral" | "sage" | "forest" | "outline" | "caution" | "safety" | "terracotta"
const PILL_TONE: Record<PillTone, string> = {
  neutral: "bg-muted text-charcoal",
  sage: "bg-sage text-forest",
  forest: "bg-forest text-ivory",
  outline: "border border-dashed border-input text-muted-foreground",
  caution: "bg-caution-surface text-caution",
  safety: "bg-safety-surface text-safety",
  terracotta: "bg-[#f3e2d9] text-terracotta-text",
}

/** Status / meta chip (24 px tall). Never the only carrier of meaning — always has text. */
export function Pill({ children, tone = "neutral", icon, className }: { children: React.ReactNode; tone?: PillTone; icon?: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-medium whitespace-nowrap [&_svg]:size-3.5", PILL_TONE[tone], className)}>
      {icon}
      {children}
    </span>
  )
}

/** Compact metric (label, value, unit). */
export function StatTile({ label, value, unit, hint, className }: { label: React.ReactNode; value: React.ReactNode; unit?: string; hint?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl bg-muted/70 px-3 py-2.5", className)}>
      <p className="text-caption text-muted-foreground">{label}</p>
      <p className="tabular text-headline mt-0.5">
        {value}
        {unit && <span className="text-caption font-normal text-muted-foreground"> {unit}</span>}
      </p>
      {hint && <p className="text-caption text-muted-foreground">{hint}</p>}
    </div>
  )
}

/** Label/value line for detail lists. */
export function KeyValue({ label, value, className }: { label: React.ReactNode; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn("text-callout flex items-baseline justify-between gap-4 py-2", className)}>
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular text-right font-medium">{value}</span>
    </div>
  )
}

/** Bottom action bar for focus flows and forms (one primary action, optional secondary). */
export function StickyFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("px-gutter sticky bottom-0 z-20 mt-auto border-t border-border/70 bg-background/95 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md", className)}>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}

export function EmptyState({ icon, title, description, action }: { icon: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-input bg-card px-6 py-10 text-center">
      <IconTile size="lg" className="mx-auto mb-4">
        {icon}
      </IconTile>
      <p className="text-headline">{title}</p>
      {description && <p className="text-callout mx-auto mt-1 max-w-[17rem] text-muted-foreground">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}
