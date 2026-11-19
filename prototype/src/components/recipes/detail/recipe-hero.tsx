"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Bookmark, BookmarkCheck, Share2 } from "lucide-react"
import { BackButton } from "@/components/app/page"
import { RecipeThumb } from "@/components/app/recipe-thumb"
import { cn } from "@/lib/utils"
import type { Recipe } from "@/lib/types"

const ROUND = "grid size-11 shrink-0 place-items-center rounded-full bg-card text-charcoal shadow-card transition-colors hover:bg-muted"

/**
 * Full-bleed photo hero (UI-SPEC §4.11, §5.3) with back, save and share. The title sits on the
 * rounded panel that overlaps the photo, so it stays readable on any image.
 */
export function RecipeHero({
  recipe,
  saved,
  onSave,
  children,
}: {
  recipe: Recipe
  /** null hides the save button (e.g. child recipes or the user's own recipe). */
  saved: boolean | null
  onSave: () => void
  children: React.ReactNode
}) {
  const router = useRouter()
  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href.split("?")[0] : ""
    try {
      if (navigator.share) {
        await navigator.share({ title: recipe.name, text: recipe.description, url })
        return
      }
      await navigator.clipboard.writeText(url)
      toast("Link copied")
    } catch {
      // Share sheet dismissed: nothing to do.
    }
  }
  return (
    <>
      <div className="relative">
        <RecipeThumb recipe={recipe} size="hero" className="h-[320px] rounded-none" />
        {/* Soft top fade so the round buttons read on bright photos (not a glass effect). */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-charcoal/25 to-transparent" aria-hidden />
        <div className="absolute inset-x-0 top-0 flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <BackButton onClick={() => router.back()} />
          <span className="flex-1" />
          {saved !== null && (
            <button type="button" className={cn(ROUND, saved && "text-forest")} onClick={onSave} aria-label={saved ? "Saved to your library" : "Save to your library"} aria-pressed={saved}>
              {saved ? <BookmarkCheck className="size-[19px]" /> : <Bookmark className="size-[19px]" />}
            </button>
          )}
          <button type="button" className={ROUND} onClick={share} aria-label="Share recipe">
            <Share2 className="size-[18px]" />
          </button>
        </div>
      </div>
      <div className="relative -mt-8 rounded-t-[28px] bg-background px-gutter pt-6">{children}</div>
    </>
  )
}
