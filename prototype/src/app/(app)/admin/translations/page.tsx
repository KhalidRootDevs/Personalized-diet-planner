"use client"

// Bangla translation review (§27.1, §28). Strings from the shared dictionary; approval is tracked per key.
import { useState } from "react"
import { Check } from "lucide-react"
import { DICT, type DictKey } from "@/lib/i18n"
import { useApp } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { ListGroup, PageBody, PageHeader, Pill } from "@/components/app/page"
import { Segmented } from "@/components/app/controls"
import { InfoNote } from "@/components/app/alerts"

export default function TranslationsPage() {
  const status = useApp((s) => s.admin?.translationStatus ?? {})
  const updateAdmin = useApp((s) => s.updateAdmin)
  const [filter, setFilter] = useState<"needs_review" | "approved" | "all">("needs_review")
  const keys = (Object.keys(DICT) as DictKey[]).filter((k) => filter === "all" || (status[k] ?? "needs_review") === filter)
  const set = (k: string, v: "approved" | "needs_review") => updateAdmin({ translationStatus: { ...status, [k]: v } })

  return (
    <>
      <PageHeader back="/admin" title="Translations" subtitle={`${Object.keys(DICT).length} shared strings · English → Bangla`} />
      <PageBody>
        <InfoNote>Prototype translations need review by a native-speaking editor. Safety messages need clinical sign-off as well as language review.</InfoNote>
        <Segmented label="Filter" value={filter} onChange={setFilter} options={[{ value: "needs_review", label: "Needs review" }, { value: "approved", label: "Approved" }, { value: "all", label: "All" }]} />
        <ListGroup>
          {keys.length === 0 && <p className="text-callout px-4 py-5 text-muted-foreground">Nothing here.</p>}
          {keys.map((k) => {
            const approved = status[k] === "approved"
            return (
              <div key={k} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-caption text-muted-foreground">{k}</p>
                  <p className="text-body font-medium">{DICT[k].en}</p>
                  <p className="text-body" lang="bn">
                    {DICT[k].bn}
                  </p>
                </div>
                {approved ? (
                  <button type="button" onClick={() => set(k, "needs_review")} className="shrink-0" aria-label={`Mark ${k} as needing review`}>
                    <Pill tone="sage" icon={<Check />}>
                      Approved
                    </Pill>
                  </button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => set(k, "approved")}>
                    Approve
                  </Button>
                )}
              </div>
            )
          })}
        </ListGroup>
      </PageBody>
    </>
  )
}
