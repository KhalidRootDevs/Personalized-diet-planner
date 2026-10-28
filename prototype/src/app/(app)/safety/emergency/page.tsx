import { Baby, Phone, TriangleAlert, X } from "lucide-react"
import { PageBody, PageHeader, Section } from "@/components/app/page"

const SIGNS = [
  "Trouble breathing, wheezing or a tight throat",
  "Swelling of the face, lips, tongue or eyes",
  "Hives spreading quickly, with dizziness or fainting",
  "Repeated vomiting, especially with drowsiness",
  "Chest pain, confusion or sudden weakness",
  "Very low or very high blood sugar symptoms that don't improve",
  "In a baby: unusual floppiness, blue lips, or not responding normally",
]

const DONT = [
  "Don't wait to see whether symptoms improve on their own",
  "Don't use the app's meal plan or AI coach to manage these symptoms",
  "Don't give food or drink to someone who is choking or struggling to breathe",
  "Don't drive yourself to hospital if you feel faint",
]

/** Emergency guidance (§13, §18.5). Routes users to emergency services, never to meal adjustments. */
export default function EmergencyPage() {
  return (
    <>
      <PageHeader title="Emergency help" back />
      <PageBody>
        <div className="rounded-2xl border-2 border-safety bg-safety-surface p-4" role="alert">
          <p className="flex items-center gap-2 text-lg font-semibold text-safety">
            <TriangleAlert className="size-5" /> If this is an emergency, get help now
          </p>
          <p className="mt-2 text-sm">NutriPlan cannot assess or manage medical emergencies. Call emergency services or go to the nearest hospital.</p>
          <a href="tel:999" className="mt-4 flex h-12 items-center justify-center gap-2 rounded-xl bg-safety text-base font-semibold text-white">
            <Phone className="size-5" /> Call 999
          </a>
          <p className="mt-2 text-center text-xs text-charcoal/80">National emergency number in Bangladesh</p>
        </div>

        <Section title="Get help immediately for">
          <ul className="space-y-2">
            {SIGNS.map((s) => (
              <li key={s} className="flex gap-2.5 rounded-xl border bg-card p-3 text-sm">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-safety" aria-hidden /> {s}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Infant choking">
          <div className="rounded-xl border bg-card p-4 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <Baby className="size-4 text-forest" /> If a baby can&apos;t cry, cough or breathe
            </p>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5">
              <li>Call 999, or ask someone else to call.</li>
              <li>Lay the baby face down along your forearm, head lower than the chest, supporting the jaw.</li>
              <li>Give up to 5 firm back blows between the shoulder blades.</li>
              <li>If still choking, turn the baby face up and give up to 5 chest thrusts with two fingers in the centre of the chest.</li>
              <li>Repeat until help arrives or the object comes out. Don&apos;t put your fingers in the mouth to search blindly.</li>
            </ol>
            <p className="mt-3 text-xs text-muted-foreground">If the baby is coughing strongly, let them keep coughing and watch closely. A first-aid course teaches these steps properly.</p>
          </div>
        </Section>

        <Section title="What not to do">
          <ul className="space-y-2 text-sm">
            {DONT.map((d) => (
              <li key={d} className="flex gap-2.5">
                <X className="mt-0.5 size-4 shrink-0 text-safety" aria-hidden /> {d}
              </li>
            ))}
          </ul>
        </Section>

        <p className="text-xs text-muted-foreground">
          This page gives general first-response information only and doesn&apos;t replace professional medical care. Content to be confirmed by clinical reviewers before launch.
        </p>
      </PageBody>
    </>
  )
}
