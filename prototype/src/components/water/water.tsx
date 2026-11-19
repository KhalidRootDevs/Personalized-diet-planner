"use client"

// Hydration (§6.7, §44.6). Goal-centric but never pushy:
// - the goal is the general range from hydrationGuide (a range, not a single target);
// - people whose fluid needs are individual (kidney or heart conditions) get no counted goal;
// - babies never get a water goal (milk stays the main drink);
// - going well above the range is met with "drink to thirst", never praise. No streaks, no confetti.
import { useState } from "react"
import { toast } from "sonner"
import { useApp } from "@/lib/store"
import { hydrationGuide } from "@/lib/nutrition"
import { nowHHMM, todayISO } from "@/lib/date"
import { cn } from "@/lib/utils"
import type { Profile } from "@/lib/types"

export type WaterGuide = ReturnType<typeof hydrationGuide>

export function useWater(profile: Profile, date = todayISO()) {
  const glasses = useApp((s) => s.water?.[`${profile.id}:${date}`] ?? 0)
  const addWater = useApp((s) => s.addWater)
  const guide = hydrationGuide(profile)
  // Bumped on every add, so the drop animation replays.
  const [splash, setSplash] = useState(0)
  const add = (delta: number, opts: { toast?: boolean } = {}) => {
    if (delta < 0 && glasses === 0) return
    addWater(profile.id, date, delta)
    if (delta > 0) {
      setSplash((x) => x + 1)
      if (typeof navigator !== "undefined") navigator.vibrate?.(8)
    }
    if (opts.toast !== false && delta > 0) {
      const next = glasses + delta
      const status = waterStatus(next, guide)
      toast(`${delta === 1 ? "A glass" : `${delta} glasses`} recorded`, {
        description: status.headline,
        action: { label: "Undo", onClick: () => addWater(profile.id, date, -delta) },
      })
    }
  }
  return { glasses, guide, add, splash }
}

function minutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + (m || 0)
}

export interface WaterStatus {
  /** Fits a half-width Home tile. */
  short: string
  tone: "start" | "on_pace" | "nudge" | "in_range" | "above" | "individual"
  headline: string
  detail: string
  /** Glasses a steady pace would suggest by now (range only). */
  pace: number
}

/** Where today stands against the general range, paced across waking hours. Wording is supportive, never shaming. */
export function waterStatus(glasses: number, guide: WaterGuide, now = nowHHMM(), wake = "07:00", sleep = "23:00"): WaterStatus {
  if (guide.kind !== "range") return { short: "Care team amount", tone: "individual", headline: "Your care team sets your amount", detail: guide.note, pace: 0 }
  const frac = Math.min(1, Math.max(0, (minutes(now) - minutes(wake)) / Math.max(60, minutes(sleep) - minutes(wake))))
  const pace = Math.max(1, Math.round(guide.lowGlasses * frac))
  if (glasses >= guide.highGlasses + 4)
    return { short: "Plenty for today", tone: "above", headline: "Well above the general range", detail: "That's plenty for most people today. Drink when you're thirsty; there's no need to keep going.", pace }
  if (glasses >= guide.lowGlasses) return { short: "In your range", tone: "in_range", headline: "In your general range", detail: "Nicely done. Keep sipping when you're thirsty, a little more in heat or after activity.", pace }
  if (glasses === 0) return { short: "Start with a glass", tone: "start", headline: "Start with a glass", detail: "A glass with breakfast is an easy first step.", pace }
  if (glasses >= pace) return { short: "On a steady pace", tone: "on_pace", headline: "On a steady pace", detail: `${guide.lowGlasses - glasses} more to reach the start of your range by evening.`, pace }
  return { short: "Time for a glass", tone: "nudge", headline: "A glass now keeps you on pace", detail: `About ${pace} by this time keeps it steady. No need to catch up all at once.`, pace }
}

/**
 * Animated glass. Full = the top of the general range; a tick marks where the range starts.
 * The wave is decorative only (no animated numbers); reduced motion stops it via globals.css.
 */
export function WaterGlass({ glasses, guide, splash, size = "lg", className }: { glasses: number; guide: WaterGuide; splash?: number; size?: "sm" | "lg"; className?: string }) {
  const high = guide.kind === "range" ? guide.highGlasses : 8
  const low = guide.kind === "range" ? guide.lowGlasses : null
  const fill = Math.min(1, glasses / high)
  const dims = size === "lg" ? "h-48 w-32 rounded-b-[40px] rounded-t-[16px]" : "h-[76px] w-[54px] rounded-b-[18px] rounded-t-[8px]"
  return (
    <div className={cn("relative shrink-0", className)} role="img" aria-label={guide.kind === "range" ? `${glasses} of ${low}–${high} glasses` : `${glasses} glasses`}>
      {splash ? (
        <span key={splash} className={cn("animate-water-drop absolute left-1/2 z-10 -translate-x-1/2 rounded-full rounded-tl-none bg-water", size === "lg" ? "-top-2 size-4 rotate-45" : "-top-1 size-2.5 rotate-45")} aria-hidden />
      ) : null}
      <div key={`pop-${splash ?? 0}`} className={cn("relative overflow-hidden bg-sky-tint/70 ring-[3px] ring-sky-tint", dims, splash ? "animate-water-pop" : "")}>
        {/* Water body + two offset waves on its surface */}
        <div className="absolute inset-x-0 bottom-0 transition-[height] duration-700 ease-out" style={{ height: `${Math.max(fill * 100, glasses ? 6 : 0)}%` }}>
          <Wave className="animate-water-wave-slow absolute -top-[9px] left-0 h-3 w-[200%] text-water/45" />
          <Wave className="animate-water-wave absolute -top-[6px] left-0 h-3 w-[200%] text-water/80" />
          <div className="h-full w-full bg-gradient-to-b from-water/80 to-water" />
          {size === "lg" && glasses > 0 && (
            <>
              <span className="absolute bottom-[18%] left-[22%] size-2 rounded-full bg-white/50" aria-hidden />
              <span className="absolute bottom-[38%] left-[60%] size-1.5 rounded-full bg-white/45" aria-hidden />
              <span className="absolute bottom-[58%] left-[34%] size-1 rounded-full bg-white/40" aria-hidden />
            </>
          )}
        </div>
        {/* Glass shine */}
        <span className={cn("absolute top-[8%] left-[12%] rounded-full bg-white/60", size === "lg" ? "h-[62%] w-2" : "h-[58%] w-1")} aria-hidden />
        {/* Range start tick */}
        {low !== null && (
          <span className="absolute inset-x-0 border-t-2 border-dashed border-sky-text/35" style={{ bottom: `${(low / high) * 100}%` }} aria-hidden />
        )}
      </div>
    </div>
  )
}

function Wave({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 12" preserveAspectRatio="none" className={className} aria-hidden>
      <path d="M0 6 Q 12.5 0 25 6 T 50 6 T 75 6 T 100 6 T 125 6 T 150 6 T 175 6 T 200 6 V 12 H 0 Z" fill="currentColor" />
    </svg>
  )
}

/** A row of tappable glasses for the range: tap a glass to set the count to it (tap the last filled one to remove it). */
export function GlassRow({ glasses, guide, onSet }: { glasses: number; guide: WaterGuide; onSet: (n: number) => void }) {
  if (guide.kind !== "range") return null
  const slots = Math.max(guide.highGlasses, glasses)
  return (
    <ul className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(7, Math.ceil(slots / 2))}, minmax(0, 1fr))` }} aria-label="Glasses today">
      {Array.from({ length: slots }, (_, i) => {
        const n = i + 1
        const filled = n <= glasses
        const inRange = n >= guide.lowGlasses && n <= guide.highGlasses
        return (
          <li key={n}>
            <button
              type="button"
              onClick={() => onSet(filled && n === glasses ? n - 1 : n)}
              aria-label={filled && n === glasses ? `Remove glass ${n}` : `Set to ${n} glass${n === 1 ? "" : "es"}`}
              aria-pressed={filled}
              className={cn(
                "group relative flex h-14 w-full flex-col items-center justify-end overflow-hidden rounded-b-2xl rounded-t-md pb-1 transition-all active:scale-95",
                filled ? "bg-water text-white shadow-[0_6px_14px_-8px_rgba(14,165,233,0.9)]" : "bg-card text-muted-grey shadow-card hover:bg-sky-tint",
              )}
            >
              {filled && <span className="absolute inset-x-0 top-0 h-1.5 bg-white/25" aria-hidden />}
              <span className="tabular text-[11px] font-semibold">{n}</span>
              {inRange && <span className={cn("mt-0.5 h-1 w-4 rounded-full", filled ? "bg-white/70" : "bg-sky-tint")} aria-hidden />}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
