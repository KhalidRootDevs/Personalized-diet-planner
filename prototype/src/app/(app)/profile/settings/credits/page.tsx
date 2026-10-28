"use client"

import { ExternalLink } from "lucide-react"
import { PageBody, PageHeader, Pill, Section } from "@/components/app/page"
import { InfoNote } from "@/components/app/alerts"
import credits from "@/lib/data/photo-credits.json"

type Credit = { file: string; title: string; author: string; license: string; url: string }

/** Attribution for food photos (CC BY / CC BY-SA require it). Source: public/food/CREDITS.md. */
export default function PhotoCreditsPage() {
  const list = credits as Credit[]
  return (
    <>
      <PageHeader back="/profile/settings" title="Photo credits" subtitle={`${list.length} photos · Wikimedia Commons`} />
      <PageBody>
        <InfoNote title="Prototype photography">
          Food photos come from Wikimedia Commons under free licenses. They were resized and their metadata removed. The production app will use licensed photos of its own recipes.
        </InfoNote>
        <Section title="Photos">
          <ul className="space-y-3">
            {list.map((c) => (
              <li key={c.file}>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3.5 rounded-2xl bg-card p-3 pr-4 shadow-card transition-colors hover:bg-muted/40"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- static prototype assets */}
                  <img src={c.file} alt="" loading="lazy" className="size-14 shrink-0 rounded-full object-cover ring-2 ring-card" />
                  <div className="min-w-0 flex-1">
                    <p className="text-callout line-clamp-2 font-semibold break-words">{c.title.replace(/\.(jpe?g|png)$/i, "")}</p>
                    <p className="text-caption mt-0.5 truncate text-muted-foreground">by {c.author || "Unknown author"}</p>
                    <Pill tone="sage" className="mt-1.5 h-[22px] px-2 text-[11px]">
                      {c.license}
                    </Pill>
                  </div>
                  <ExternalLink className="size-4 shrink-0 text-muted-grey" aria-label="Opens the original on Wikimedia Commons" />
                </a>
              </li>
            ))}
          </ul>
        </Section>
      </PageBody>
    </>
  )
}
