import { AppFrame, BottomNav, RequireUser } from "@/components/app/shell"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppFrame>
      <RequireUser>
        <main className="flex-1">{children}</main>
        <BottomNav />
      </RequireUser>
    </AppFrame>
  )
}
