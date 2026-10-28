import type { Metadata, Viewport } from "next"
import { Inter, Newsreader, Noto_Sans_Bengali } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { ServiceWorkerRegister } from "@/components/app/pwa"
import "./globals.css"

// Type stack (§44.3): Inter for UI, Newsreader for occasional large titles,
// Noto Sans Bengali so Bangla text renders (Inter/Newsreader have no Bengali glyphs).
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] })
const newsreader = Newsreader({ variable: "--font-newsreader", subsets: ["latin"], weight: ["400", "500"] })
const bengali = Noto_Sans_Bengali({ variable: "--font-bengali", subsets: ["bengali"], weight: ["400", "500", "600"] })

export const metadata: Metadata = {
  title: { default: "NutriPlan", template: "%s · NutriPlan" },
  description: "Your personal AI nutrition companion — plan what to eat, understand what you actually eat. Interactive prototype.",
  applicationName: "NutriPlan",
  appleWebApp: { capable: true, title: "NutriPlan", statusBarStyle: "default" },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: "#FAF8F2",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable} ${bengali.variable}`}>
      <body>
        {children}
        <Toaster position="top-center" />
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
