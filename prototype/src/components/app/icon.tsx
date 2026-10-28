import {
  Apple, Baby, Banana, Carrot, Coffee, CookingPot, Drumstick, Egg, Fish, GlassWater, Salad, Soup, Sunrise, Utensils, Wheat,
  type LucideIcon,
} from "lucide-react"

const ICONS: Record<string, LucideIcon> = { Apple, Baby, Banana, Carrot, Coffee, CookingPot, Drumstick, Egg, Fish, GlassWater, Salad, Soup, Sunrise, Utensils, Wheat }

/** Resolves an icon name stored in data (recipes, habits) to a Lucide component. */
export function DataIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Utensils
  return <Icon className={className} aria-hidden />
}
