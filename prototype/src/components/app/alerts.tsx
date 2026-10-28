import Link from "next/link"
import { Info, ShieldAlert, TriangleAlert } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Safety-critical alert (allergens, infant safety, emergencies). Distinct from intake
 * feedback, which never uses alarming colors (§44.12). Colors are provisional (§43.7).
 */
export function SafetyAlert({ title, children, emergency, className }: { title: string; children?: React.ReactNode; emergency?: boolean; className?: string }) {
  return (
    <div role="alert" className={cn("text-callout flex gap-3 rounded-2xl border border-safety/20 bg-safety-surface p-4 text-charcoal", className)}>
      <ShieldAlert className="mt-0.5 size-5 shrink-0 text-safety" aria-hidden />
      <div className="min-w-0">
        <p className="font-semibold text-safety">{title}</p>
        {children && <div className="mt-0.5">{children}</div>}
        {emergency && (
          <Link href="/safety/emergency" className="mt-2 inline-flex h-9 items-center rounded-xl bg-safety px-3.5 font-semibold text-white">
            Emergency guidance
          </Link>
        )}
      </div>
    </div>
  )
}

export function CautionNote({ title, children, className }: { title: string; children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("text-callout flex gap-3 rounded-2xl bg-caution-surface p-4 text-charcoal", className)}>
      <TriangleAlert className="mt-0.5 size-5 shrink-0 text-caution" aria-hidden />
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        {children && <div className="mt-0.5 text-charcoal/90">{children}</div>}
      </div>
    </div>
  )
}

export function InfoNote({ title, children, className }: { title?: string; children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("text-callout flex gap-3 rounded-2xl bg-sage/60 p-4 text-charcoal", className)}>
      <Info className="mt-0.5 size-5 shrink-0 text-forest" aria-hidden />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && "mt-0.5")}>{children}</div>}
      </div>
    </div>
  )
}
