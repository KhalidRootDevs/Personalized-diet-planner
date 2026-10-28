import { Baby, Phone, Siren, TriangleAlert, X } from "lucide-react"
import { IconTile, ListGroup, ListRow, PageBody, PageHeader, Section, Surface } from "@/components/app/page"

const SIGNS = [
  "Trouble breathing, wheezing or a tight throat",
  "Swelling of the face, lips, tongue or eyes",
  "Hives spreading quickly, with dizziness or fainting",
  "Repeated vomiting, especially with drowsiness",
  "Chest pain, confusion or sudden weakness",
  "Very low or very high blood sugar symptoms that don't improve",
  "In a baby: unusual floppiness, blue lips, or not responding normally",
]

const CHOKING_STEPS = [
  "Call 999, or ask someone else to call.",
  "Lay the baby face down along your forearm, head lower than the chest, supporting the jaw.",
  "Give up to 5 firm back blows between the shoulder blades.",
  "If still choking, turn the baby face up and give up to 5 chest thrusts with two fingers in the centre of the chest.",
  "Repeat until help arrives or the object comes out. Don't put your fingers in the mouth to search blindly.",
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
        <div className="rounded-2xl border border-safety/25 bg-safety-surface p-5" role="alert">
          <IconTile tone="safety" size="lg" className="bg-card">
            <Siren />
          </IconTile>
          <p className="text-title mt-4 text-safety">If this is an emergency, get help now</p>
          <p className="text-callout mt-1.5 text-charcoal">NutriPlan cannot assess or manage medical emergencies. Call emergency services or go to the nearest hospital.</p>
          <a href="tel:999" className="mt-5 flex h-[54px] items-center justify-center gap-2 rounded-full bg-safety text-base font-semibold text-white transition-colors hover:bg-[#912018]">
            <Phone className="size-5" /> Call 999
          </a>
          <p className="text-caption mt-2 text-center text-charcoal/75">National emergency number in Bangladesh</p>
        </div>

        <Section title="Get help immediately for">
          <ListGroup>
            {SIGNS.map((s) => (
              <ListRow key={s} icon={<TriangleAlert />} iconTone="safety" title={<span className="text-callout font-medium">{s}</span>} className="min-h-14" />
            ))}
          </ListGroup>
        </Section>

        <Section title="Infant choking">
          <Surface padding="lg">
            <div className="flex items-center gap-3">
              <IconTile>
                <Baby />
              </IconTile>
              <p className="text-body font-medium">If a baby can&apos;t cry, cough or breathe</p>
            </div>
            <ol className="mt-4 space-y-3">
              {CHOKING_STEPS.map((step, i) => (
                <li key={step} className="text-callout flex gap-3">
                  <span className="tabular grid size-6 shrink-0 place-items-center rounded-full bg-lime text-xs font-semibold text-charcoal">{i + 1}</span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
            <p className="text-caption mt-4 border-t border-border/70 pt-3 text-muted-foreground">If the baby is coughing strongly, let them keep coughing and watch closely. A first-aid course teaches these steps properly.</p>
          </Surface>
        </Section>

        <Section title="What not to do">
          <ListGroup>
            {DONT.map((d) => (
              <ListRow key={d} icon={<X />} iconTone="muted" title={<span className="text-callout font-medium">{d}</span>} className="min-h-14" />
            ))}
          </ListGroup>
        </Section>

        <p className="text-caption px-1 text-muted-foreground">
          This page gives general first-response information only and doesn&apos;t replace professional medical care. Content to be confirmed by clinical reviewers before launch.
        </p>
      </PageBody>
    </>
  )
}
