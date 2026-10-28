"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { ChevronLeft, Leaf, RotateCcw, SendHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FeatureBadge, PremiumGate } from "@/components/app/badges"
import { SafetyAlert } from "@/components/app/alerts"
import { useApp, useActivePlan, useSelfProfile } from "@/lib/store"
import { adultTargets } from "@/lib/nutrition"
import { nowHHMM, todayISO, uid } from "@/lib/date"
import { coachReply, EMERGENCY_SOURCE, REFERRAL_SOURCE, STARTERS } from "@/lib/coach"
import { dayRange, entriesFor, remainingMeals } from "@/lib/area-b-log"
import { useRecipeLookup } from "@/lib/area-c-utils"
import { cn } from "@/lib/utils"

/** AI Nutrition Coach (§42.2, Phase 2): a contextual helper, not a chat-first tab (§44.17). */
export default function CoachPage() {
  const router = useRouter()
  const coach = useApp((s) => s.coach)
  const clear = useApp((s) => s.clearCoach)
  return (
    <div className="flex min-h-dvh flex-1 flex-col lg:min-h-0">
      <header className="sticky top-0 z-20 border-b bg-background/95 pt-safe backdrop-blur-sm">
        <div className="flex h-14 items-center gap-2 px-2">
          <button onClick={() => router.back()} className="grid size-11 place-items-center rounded-full hover:bg-muted" aria-label="Back">
            <ChevronLeft className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 text-lg font-semibold">
              Nutrition coach <FeatureBadge feature="coach" />
            </h1>
          </div>
          {coach.length > 0 && (
            <Button variant="ghost" size="icon" aria-label="Clear conversation" onClick={clear}>
              <RotateCcw />
            </Button>
          )}
        </div>
      </header>
      <PremiumGate feature="coach">
        <Chat />
      </PremiumGate>
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

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), [messages.length, typing])

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
      <div className="flex-1 space-y-4 px-4 py-4" aria-live="polite">
        <div className="rounded-2xl bg-sage p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold text-forest">
            <Leaf className="size-4" /> Hi {self.name.split(" ")[0]}
          </p>
          <p className="mt-1 text-charcoal/80">
            I answer from your plan, your food log and our verified food data. I can&apos;t diagnose conditions or advise on medicines. In an emergency, call 999.
          </p>
        </div>

        {messages.map((m) => {
          if (m.role === "user")
            return (
              <div key={m.id} className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-md bg-forest px-4 py-2.5 text-sm whitespace-pre-line text-primary-foreground">{m.text}</p>
              </div>
            )
          if (m.sources?.includes(EMERGENCY_SOURCE))
            return (
              <SafetyAlert key={m.id} title="Get help now" emergency>
                {m.text}
              </SafetyAlert>
            )
          return (
            <div key={m.id} className="max-w-[90%] space-y-2">
              <p className={cn("rounded-2xl rounded-bl-md border bg-card px-4 py-2.5 text-sm whitespace-pre-line", m.sources?.includes(REFERRAL_SOURCE) && "border-forest/30")}>{m.text}</p>
              {m.sources && (
                <div className="flex flex-wrap gap-1.5">
                  {m.sources.map((s) => (
                    <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {typing && <p className="text-sm text-muted-foreground">Checking your plan…</p>}

        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Try asking</p>
            <div className="flex flex-wrap gap-2">
              {STARTERS.map((s) => (
                <button key={s} onClick={() => send(s)} className="min-h-10 rounded-full border bg-card px-3.5 text-left text-sm hover:bg-muted/50">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        className="sticky bottom-0 flex items-center gap-2 border-t bg-background/95 px-4 pt-3 pb-safe backdrop-blur-sm"
        onSubmit={(e) => {
          e.preventDefault()
          send(text)
        }}
      >
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask about your meals…" aria-label="Message" className="mb-3 flex-1" />
        <Button type="submit" size="icon" className="mb-3" aria-label="Send" disabled={!text.trim() || typing}>
          <SendHorizontal />
        </Button>
      </form>
      <p className="px-4 pb-3 text-center text-[11px] text-muted-foreground">
        General guidance, not medical advice. <Link href="/safety/emergency" className="underline underline-offset-2">Emergency help</Link>
      </p>
    </div>
  )
}
