"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { ArrowUp, Leaf, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FeatureBadge, PremiumGate, useFeature } from "@/components/app/badges"
import { SafetyAlert } from "@/components/app/alerts"
import { HeaderIconButton, IconTile, PageHeader, Pill } from "@/components/app/page"
import { useApp, useActivePlan, useSelfProfile } from "@/lib/store"
import { adultTargets } from "@/lib/nutrition"
import { nowHHMM, todayISO, uid } from "@/lib/date"
import { coachReply, EMERGENCY_SOURCE, REFERRAL_SOURCE, STARTERS } from "@/lib/coach"
import { dayRange, entriesFor, remainingMeals } from "@/lib/area-b-log"
import { useRecipeLookup } from "@/lib/area-c-utils"
import { cn } from "@/lib/utils"

/** AI Nutrition Coach (§42.2, Phase 2): a contextual helper, not a chat-first tab (§44.17). */
export default function CoachPage() {
  const coach = useApp((s) => s.coach)
  const clear = useApp((s) => s.clearCoach)
  const { allowed } = useFeature("coach")
  return (
    <div className="flex min-h-dvh flex-1 flex-col lg:min-h-full">
      <PageHeader
        back
        title={
          <span className="flex items-center gap-2">
            Nutrition coach <FeatureBadge feature="coach" />
          </span>
        }
        subtitle="Answers from your plan and food log"
        action={
          coach.length > 0 && (
            <HeaderIconButton label="Clear conversation" onClick={clear}>
              <RotateCcw className="size-[18px]" />
            </HeaderIconButton>
          )
        }
      />
      {allowed ? (
        <Chat />
      ) : (
        <div className="px-gutter pt-2">
          <PremiumGate feature="coach">{null}</PremiumGate>
        </div>
      )}
    </div>
  )
}

function Chat() {
  const self = useSelfProfile()
  const plan = useActivePlan()
  const journal = useApp((s) => s.journal)
  const messages = useApp((s) => s.coach)
  const addMessage = useApp((s) => s.addCoachMessage)
  const lookup = useRecipeLookup()
  const [text, setText] = useState("")
  const [typing, setTyping] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages.length, typing])

  if (!self) return null

  const send = (q: string) => {
    const question = q.trim()
    if (!question || typing) return
    addMessage({ id: uid("msg"), role: "user", text: question, createdAt: new Date().toISOString() })
    setText("")
    setTyping(true)
    const today = todayISO()
    const entries = entriesFor(journal, self.id, today)
    const reply = coachReply(question, {
      profile: self,
      targets: adultTargets(self),
      totals: dayRange(entries).mid,
      loggedCount: entries.filter((e) => e.analysisStatus === "confirmed").length,
      remaining: remainingMeals((plan?.meals ?? []).filter((m) => m.date === today), nowHHMM()),
      lookup,
    })
    window.setTimeout(() => {
      addMessage({ id: uid("msg"), role: "coach", text: reply.text, createdAt: new Date().toISOString(), sources: reply.sources })
      setTyping(false)
    }, 700)
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-gutter flex-1 space-y-4 pt-2 pb-4" aria-live="polite">
        <div className="flex gap-3 rounded-2xl bg-sage/70 p-4">
          <IconTile tone="white" size="sm">
            <Leaf />
          </IconTile>
          <div className="min-w-0">
            <p className="text-callout font-semibold text-forest">Hi {self.name.split(" ")[0]}</p>
            <p className="text-callout mt-0.5 text-charcoal/80">
              I answer from your plan, your food log and our verified food data. I can&apos;t diagnose conditions or advise on medicines. In an emergency, call 999.
            </p>
          </div>
        </div>

        {messages.map((m) => {
          if (m.role === "user")
            return (
              <div key={m.id} className="flex justify-end">
                <p className="text-body max-w-[82%] rounded-[18px] rounded-br-md bg-forest px-4 py-2.5 whitespace-pre-line text-primary-foreground">{m.text}</p>
              </div>
            )
          if (m.sources?.includes(EMERGENCY_SOURCE))
            return (
              <SafetyAlert key={m.id} title="Get help now" emergency>
                {m.text}
              </SafetyAlert>
            )
          return (
            <div key={m.id} className="max-w-[88%] space-y-2">
              <p className={cn("text-body rounded-[18px] rounded-bl-md border border-border/80 bg-card px-4 py-3 whitespace-pre-line", m.sources?.includes(REFERRAL_SOURCE) && "border-forest/30")}>{m.text}</p>
              {m.sources && (
                <div className="flex flex-wrap items-center gap-1.5 pl-1">
                  <span className="text-caption text-muted-foreground">Based on</span>
                  {m.sources.map((s) => (
                    <Pill key={s} tone="neutral" className="h-[22px] px-2 text-[11px]">
                      {s}
                    </Pill>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {typing && (
          <div className="inline-flex items-center gap-1.5 rounded-[18px] rounded-bl-md border border-border/80 bg-card px-4 py-3" role="status" aria-label="Checking your plan">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-1.5 animate-pulse rounded-full bg-muted-grey" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-0 z-10 border-t border-border/70 bg-background/95 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md">
        {messages.length === 0 && (
          <div className="no-scrollbar px-gutter flex gap-2 overflow-x-auto pt-3" aria-label="Suggested questions">
            {STARTERS.map((s) => (
              <button key={s} onClick={() => send(s)} className="text-callout h-9 shrink-0 rounded-full border border-border/80 bg-card px-3.5 whitespace-nowrap transition-colors hover:bg-muted">
                {s}
              </button>
            ))}
          </div>
        )}
        <form
          className="px-gutter flex items-center gap-2 pt-3"
          onSubmit={(e) => {
            e.preventDefault()
            send(text)
          }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask about your meals…"
            aria-label="Message"
            className="h-12 min-w-0 flex-1 rounded-full border border-input bg-card px-5 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          <Button type="submit" size="icon" className="size-12 rounded-full" aria-label="Send" disabled={!text.trim() || typing}>
            <ArrowUp className="size-5" />
          </Button>
        </form>
        <p className="px-gutter text-caption pt-2 text-center text-muted-foreground">
          General guidance, not medical advice ·{" "}
          <Link href="/safety/emergency" className="font-medium text-forest underline-offset-2 hover:underline">
            Emergency help
          </Link>
        </p>
      </div>
    </div>
  )
}
