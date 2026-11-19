"use client"

// Shown in place of a feature whose consent was withdrawn (§29, FR-041). The user can turn it
// back on here or in Privacy and data; nothing is re-enabled silently.
import Link from "next/link"
import { ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { useApp } from "@/lib/store"
import { CONSENT_LABEL, type ConsentType } from "@/lib/consent"
import { useAreaD } from "@/lib/area-d-store"
import { track } from "@/lib/analytics"
import { Button } from "@/components/ui/button"
import { IconTile, Surface } from "@/components/app/page"

export function ConsentPrompt({ type, feature, children }: { type: ConsentType; feature: string; children?: React.ReactNode }) {
  const setConsent = useApp((s) => s.setConsent)
  const audit = useAreaD((s) => s.audit)
  return (
    <Surface tone="outline" padding="lg">
      <div className="flex gap-3">
        <IconTile tone="sky">
          <ShieldCheck />
        </IconTile>
        <div className="min-w-0 flex-1">
          <p className="text-body font-medium">{feature} needs your permission</p>
          <p className="text-callout mt-1 text-muted-foreground">
            You withdrew “{CONSENT_LABEL[type]}”. {children}
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/profile/privacy">Privacy settings</Link>
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setConsent(type, true)
            audit("Consent granted", CONSENT_LABEL[type])
            track("consent_changed", { type, granted: true })
            toast.success(`${CONSENT_LABEL[type]}: allowed`)
          }}
        >
          Allow again
        </Button>
      </div>
    </Surface>
  )
}
