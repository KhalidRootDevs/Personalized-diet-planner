import { cn } from "@/lib/utils"

const MACROS = [
  { key: "proteinG", label: "Protein", dot: "bg-protein", tint: "bg-protein/10" },
  { key: "carbsG", label: "Carbs", dot: "bg-carbs", tint: "bg-carbs/10" },
  { key: "fatG", label: "Fat", dot: "bg-fat", tint: "bg-fat/10" },
  { key: "fiberG", label: "Fiber", dot: "bg-fiber", tint: "bg-fiber/10" },
] as const

/** Four colorful macro tiles (estimates, grams). The label carries meaning; color only decorates. */
export function MacroTiles({ values, className }: { values: Record<(typeof MACROS)[number]["key"], number>; className?: string }) {
  return (
    <div className={cn("grid grid-cols-4 gap-2", className)}>
      {MACROS.map((m) => (
        <div key={m.key} className={cn("rounded-xl px-2.5 py-2.5", m.tint)}>
          <p className="text-caption flex items-center gap-1.5 text-muted-foreground">
            <span className={cn("size-2 rounded-full", m.dot)} aria-hidden />
            {m.label}
          </p>
          <p className="text-headline mt-0.5 tabular">
            ~{Math.round(values[m.key])}
            <span className="text-caption font-normal text-muted-foreground"> g</span>
          </p>
        </div>
      ))}
    </div>
  )
}
