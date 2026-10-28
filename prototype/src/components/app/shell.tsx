"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef } from "react"
import { CalendarDays, ChefHat, CircleUser, House, Leaf, ScanLine } from "lucide-react"
import { useApp } from "@/lib/store"
import { useT, type DictKey } from "@/lib/i18n"
import { cn } from "@/lib/utils"

/**
 * App container (UI-SPEC §2.1).
 * - Phones and the installed PWA: full screen; the document scrolls.
 * - Desktop (lg+): a 390 × 844 device frame that scrolls internally, beside a short
 *   prototype note, so stakeholders see exactly the mobile layout.
 */
export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const scroller = useRef<HTMLDivElement>(null)
  // The desktop frame is its own scroll container, so reset it on navigation.
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="min-h-dvh bg-[#e4e8dc] lg:flex lg:items-center lg:justify-center lg:gap-20 lg:px-10 lg:py-8">
      <aside className="hidden w-[300px] shrink-0 lg:block">
        <div className="flex items-center gap-2.5 text-forest">
          <span className="grid size-10 place-items-center rounded-full bg-lime text-charcoal">
            <Leaf className="size-5" />
          </span>
          <span className="text-[24px] leading-none font-bold tracking-tight">NutriPlan</span>
        </div>
        <p className="text-body mt-6 text-charcoal">Interactive prototype for stakeholder review.</p>
        <p className="text-callout mt-2 text-muted-foreground">
          Data stays in this browser. On a phone, choose <strong className="font-semibold text-charcoal">Add to Home Screen</strong> (iOS) or <strong className="font-semibold text-charcoal">Install app</strong> (Android) to use it like a native app.
        </p>
        <div className="mt-8 space-y-2.5 rounded-2xl border border-border/80 bg-card p-4">
          <p className="text-overline text-muted-foreground">Release phase badges</p>
          {[
            ["P1", "Essential MVP", "bg-sage text-forest"],
            ["P2", "Retention and convenience", "bg-amber-tint text-amber-text"],
            ["P3", "Advanced", "bg-coral-tint text-terracotta-text"],
          ].map(([b, label, cls]) => (
            <div key={b} className="text-callout flex items-center gap-2.5">
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", cls)}>{b}</span>
              {label}
            </div>
          ))}
          <p className="text-caption pt-1 text-muted-foreground">Hide them in Profile → App settings.</p>
        </div>
      </aside>
      <div
        ref={scroller}
        className="no-scrollbar relative mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-background lg:mx-0 lg:h-[min(864px,calc(100dvh-4rem))] lg:min-h-0 lg:w-[410px] lg:max-w-none lg:shrink-0 lg:overflow-y-auto lg:rounded-[48px] lg:border-[10px] lg:border-[#141814] lg:shadow-[0_40px_80px_-30px_rgba(15,26,20,0.45)]"
      >
        {children}
      </div>
    </div>
  )
}

const TABS: { href: string; key: DictKey; icon: typeof House; match: string[] }[] = [
  { href: "/home", key: "home", icon: House, match: ["/home", "/progress", "/coach", "/notifications", "/child"] },
  { href: "/plan", key: "plan", icon: CalendarDays, match: ["/plan"] },
  { href: "/log", key: "foodLog", icon: ScanLine, match: ["/log"] },
  { href: "/recipes", key: "recipes", icon: ChefHat, match: ["/recipes"] },
  { href: "/profile", key: "profile", icon: CircleUser, match: ["/profile", "/subscription", "/admin", "/safety"] },
]

/**
 * Five-tab bar with labels (§44.5, UI-SPEC §4.1). Food Log — the core action — is the
 * raised lime button in the middle. Sticky at the bottom of the scroll container, so it
 * takes layout space and never covers the last item.
 */
export function BottomNav() {
  const pathname = usePathname()
  const t = useT()
  return (
    <nav className="sticky bottom-0 z-30 mt-auto" aria-label="Main">
      <ul className="grid grid-cols-5 rounded-t-[28px] bg-card px-2 pt-2 pb-[max(0.625rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_-12px_rgba(20,24,20,0.18)]">
        {TABS.map((tab) => {
          const active = tab.match.some((m) => pathname.startsWith(m))
          const Icon = tab.icon
          const center = tab.href === "/log"
          return (
            <li key={tab.href} className="flex">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-1 flex-col items-center justify-end gap-1 text-[11px] leading-none transition-colors",
                  active ? "font-semibold text-charcoal" : "font-medium text-muted-foreground hover:text-charcoal",
                )}
              >
                {center ? (
                  <span className={cn("-mt-7 grid size-[58px] place-items-center rounded-full bg-lime text-charcoal shadow-[0_8px_20px_-6px_rgba(101,163,13,0.65)] ring-[5px] ring-card transition-transform active:scale-95", active && "ring-sage")}>
                    <Icon className="size-6" strokeWidth={2.1} />
                  </span>
                ) : (
                  <span className="relative grid h-8 w-12 place-items-center">
                    <Icon className={cn("size-[22px]", active ? "text-forest" : "text-muted-grey")} strokeWidth={active ? 2.2 : 1.8} />
                  </span>
                )}
                {t(tab.key)}
                <span className={cn("size-1 rounded-full", active && !center ? "bg-forest" : "bg-transparent")} aria-hidden />
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function Splash() {
  return (
    <div className="grid min-h-dvh flex-1 place-items-center bg-background lg:min-h-full">
      <div className="flex flex-col items-center gap-3 text-forest">
        <div className="grid size-16 place-items-center rounded-full bg-lime text-charcoal">
          <Leaf className="size-8" />
        </div>
        <span className="text-2xl font-bold tracking-tight">NutriPlan</span>
      </div>
    </div>
  )
}

/** Waits for persisted state, then enforces sign-in and onboarding. */
export function RequireUser({ children, allowNotOnboarded }: { children: React.ReactNode; allowNotOnboarded?: boolean }) {
  const hydrated = useApp((s) => s.hydrated)
  const user = useApp((s) => s.user)
  const onboarded = useApp((s) => s.onboarded)
  const router = useRouter()
  useEffect(() => {
    if (!hydrated) return
    if (!user) router.replace("/welcome")
    else if (!onboarded && !allowNotOnboarded) router.replace("/onboarding")
  }, [hydrated, user, onboarded, allowNotOnboarded, router])
  if (!hydrated || !user || (!onboarded && !allowNotOnboarded)) return <Splash />
  return <>{children}</>
}

export function useHydrated() {
  return useApp((s) => s.hydrated)
}
