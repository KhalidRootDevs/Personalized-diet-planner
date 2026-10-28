import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "NutriPlan — Personal Nutrition Companion",
    short_name: "NutriPlan",
    description: "Plan what to eat, understand what you actually eat, and make healthier choices in real life. Prototype.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F4F5F0",
    theme_color: "#F4F5F0",
    categories: ["health", "food", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Log a meal", short_name: "Log meal", url: "/log/new", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Today's plan", short_name: "Plan", url: "/plan", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  }
}
