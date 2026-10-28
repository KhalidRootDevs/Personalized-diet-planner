"use client"

// Demo checkout. No payment details are collected and nothing is charged.
import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { CircleCheck, CreditCard, Smartphone, Wallet } from "lucide-react"
import { useApp } from "@/lib/store"
import { TIERS } from "@/lib/features"
import { fmt } from "@/lib/nutrition"
import { addDays, formatDay, todayISO } from "@/lib/date"
import { Button } from "@/components/ui/button"
import { PageBody, PageHeader } from "@/components/app/page"
import { CautionNote } from "@/components/app/alerts"
import { ChoiceCard } from "@/components/profile/form-bits"

const METHODS = [
  { id: "bkash", label: "bKash", description: "Pay from your bKash wallet", icon: Smartphone },
  { id: "nagad", label: "Nagad", description: "Pay from your Nagad wallet", icon: Wallet },
  { id: "card", label: "Debit or credit card", description: "Visa, Mastercard, Amex", icon: CreditCard },
]

export default function CheckoutPage() {
  return (
    <Suspense>
      <Checkout />
    </Suspense>
  )
}

function Checkout() {
  const router = useRouter()
  const params = useSearchParams()
  const setTier = useApp((s) => s.setTier)
  const currentTier = useApp((s) => s.tier)
  const plan = TIERS.find((t) => t.id === params.get("tier") && t.id !== "free") ?? TIERS[1]
  const cycle = params.get("cycle") === "yearly" ? "yearly" : "monthly"
  const price = cycle === "monthly" ? plan.monthly : plan.yearly
  const trial = currentTier === "free"
  const [method, setMethod] = useState("bkash")
  const [state, setState] = useState<"form" | "processing" | "done">("form")
  const chargeDate = trial ? addDays(todayISO(), 7) : todayISO()

  if (state === "done") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 pt-safe text-center">
        <span className="grid size-16 place-items-center rounded-full bg-sage text-forest">
          <CircleCheck className="size-8" aria-hidden />
        </span>
        <h1 className="mt-5 font-serif text-[28px] leading-tight">You&apos;re on {plan.name}</h1>
        <p className="mt-2 max-w-xs text-muted-foreground">
          {trial ? `Your 7-day free trial has started. We'll remind you 2 days before it ends on ${formatDay(chargeDate)}.` : "Your new plan is active now."}
        </p>
        <ul className="mt-6 w-full max-w-xs space-y-1.5 text-left text-sm">
          {plan.features.slice(0, 4).map((f) => (
            <li key={f} className="flex gap-2"><CircleCheck className="mt-0.5 size-4 shrink-0 text-forest" />{f}</li>
          ))}
        </ul>
        <div className="mt-8 w-full max-w-xs space-y-2 pb-8">
          <Button size="lg" className="w-full" onClick={() => router.replace("/home")}>Go to Home</Button>
          <Button asChild variant="ghost" className="w-full"><Link href="/profile">Back to profile</Link></Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <PageHeader back="/subscription" title="Checkout" />
      <PageBody className="flex-1">
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-lg font-semibold">{plan.name}</p>
            <p className="tabular font-semibold">{fmt.bdt(price)}<span className="text-sm font-normal text-muted-foreground">/{cycle === "monthly" ? "month" : "year"}</span></p>
          </div>
          <p className="text-sm text-muted-foreground">{plan.tagline}</p>
          <dl className="mt-3 space-y-1 border-t pt-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Due today</dt><dd className="tabular font-medium">{trial ? "৳0" : fmt.bdt(price)}</dd></div>
            {trial && <div className="flex justify-between"><dt className="text-muted-foreground">First charge</dt><dd className="tabular">{formatDay(chargeDate)}</dd></div>}
            <div className="flex justify-between"><dt className="text-muted-foreground">Renews</dt><dd>{cycle === "monthly" ? "Monthly" : "Yearly"}, cancel any time</dd></div>
          </dl>
        </div>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Payment method</h2>
          <div role="radiogroup" className="space-y-2">
            {METHODS.map((m) => (
              <ChoiceCard key={m.id} selected={method === m.id} onSelect={() => setMethod(m.id)} icon={<m.icon className="size-5" />} title={m.label} description={m.description} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">In the real app you&apos;d be sent to {METHODS.find((m) => m.id === method)?.label}&apos;s secure page. NutriPlan never stores card numbers or wallet PINs.</p>
        </section>

        <CautionNote title="Prototype — no payment is taken">Tapping the button only changes your plan on this device so you can explore gated features.</CautionNote>
      </PageBody>
      <div className="sticky bottom-0 border-t bg-background/95 px-4 pt-3 pb-safe backdrop-blur-sm">
        <div className="pb-4">
          <Button
            size="lg"
            className="w-full"
            disabled={state === "processing"}
            onClick={() => {
              setState("processing")
              window.setTimeout(() => {
                setTier(plan.id, cycle)
                setState("done")
              }, 900)
            }}
          >
            {state === "processing" ? "Confirming…" : trial ? "Start free trial" : `Pay ${fmt.bdt(price)}`}
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">By continuing you agree to the subscription terms. Cancel before the trial ends to avoid being charged.</p>
        </div>
      </div>
    </>
  )
}
