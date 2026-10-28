import { AppFrame, RequireUser } from "@/components/app/shell"

/** Full-screen task flows without the bottom navigation (logging, plan generation, checkout, coach). */
export default function FocusLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppFrame>
      <RequireUser>
        <main className="flex flex-1 flex-col">{children}</main>
      </RequireUser>
    </AppFrame>
  )
}
