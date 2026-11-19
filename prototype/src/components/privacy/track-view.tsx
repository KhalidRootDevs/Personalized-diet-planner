"use client"

import { useEffect } from "react"
import { track, type EventName } from "@/lib/analytics"

/** Records a screen view event (no props, no PII). Usable from server components. */
export function TrackView({ name }: { name: EventName }) {
  useEffect(() => {
    track(name)
  }, [name])
  return null
}
