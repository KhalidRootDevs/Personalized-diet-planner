import { AppFrame, BottomNav, RequireUser, ScreenTransition } from "@/components/app/shell"
import { FeedbackHost } from "@/components/progress/meal-feedback-sheet"
import { PlanSync } from "@/components/app/plan-sync"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppFrame>
      <RequireUser>
        <PlanSync />
        <main className="flex flex-1 flex-col [--tabbar-fab:1.75rem] [--tabbar-offset:calc(73px+env(safe-area-inset-bottom))]">
          <ScreenTransition>{children}</ScreenTransition>
        </main>
        <BottomNav />
        <FeedbackHost />
      </RequireUser>
    </AppFrame>
  )
}
