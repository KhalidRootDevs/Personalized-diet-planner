# NutriPlan — interactive prototype

A clickable, installable (PWA) prototype of NutriPlan, built for stakeholder review. It covers the features in [`../docs/prd/`](../docs/prd/) across all three release phases (§43). The production app will be built in **Flutter or React Native**. This prototype is a reference for flows and UI, not production code.

- **Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui (Radix), Lucide icons, zustand.
- **No backend.** All data lives in the browser's `localStorage`. Use *Profile → Prototype settings → Reset demo data* to start over.
- **Mocked:** sign-in (any email and password work), payments (bKash, Nagad and card are labelled "Prototype — no payment is taken"), photo analysis (deterministic sample results), the AI Coach (answers built from the user's own logged data), and integrations.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000 (the service worker is disabled in dev)
npm run build && npm start   # production mode, enables the PWA service worker
```

On the welcome screen, choose **Explore with demo data** to jump straight into a populated account: an adult profile, a 7‑month‑old child profile, an active 7-day plan, food journal history, habits, a pantry and notifications.

## Install as an app (PWA)

The app must be served over **HTTPS** (or `localhost`) for installation.

- **Android / Chrome / Edge:** an "Install NutriPlan" banner appears on Home, or use the browser menu → *Install app*.
- **iPhone / iPad (Safari):** tap **Share** → **Add to Home Screen**. iOS shows instructions on Home because it has no automatic install prompt.

After installation it opens full-screen, without browser chrome. Pages you've already visited keep working offline.

**Sharing with stakeholders:** deploy to any HTTPS host. For example, on Vercel run `npx vercel` from this folder; no environment variables are needed. Then share the URL.

## What to look for

- **P1 / P2 / P3 badges** mark each feature's release phase (§43). Turn them off in *Profile → Prototype settings* for a clean demo.
- **Subscription gating is a proposal.** Which tier includes which feature is an open decision (§43.7). The mapping lives in `src/lib/features.ts`, and safety features are never gated. Prices are placeholders.
- **Switch profiles** from the Home header to see the softer baby-feeding experience (§12, §44.9): no calories, milestones and textures instead.
- **Safety behavior:** allergen conflicts, infant-unsafe foods (honey before 12 months, choking hazards), emergency guidance, no compensatory restriction, and estimates shown as ranges with confidence labels.

## Known prototype limitations

- Food and nutrient values in `src/lib/data/` are **illustrative**, not from a validated food composition database. Infant recipes are marked *pending clinical review*.
- **Semantic colors** (safety, caution, success in `globals.css`) are provisional. §43.7 leaves them undecided.
- The visual style follows the references in `../design-ref/` (Lime Fresh palette, §44.2), without the parts that conflict with the PRD's safety rules (streaks, rewards, exact calorie counts).
- Bangla covers the app shell only.
- Food photos in `public/food/` are Wikimedia Commons placeholders (CC0 / CC BY / CC BY-SA), credited in `public/food/CREDITS.md` and in *Profile → App settings → Photo credits*. They don't show the exact recipes; production needs licensed photography.

## Project layout

```
src/app/(bare)/    welcome, auth, onboarding (no tab bar)
src/app/(app)/     tabbed screens: home, plan, log, recipes, profile and nested pages
src/app/(focus)/   full-screen task flows: log a meal, generate a plan, checkout, coach
src/components/app shell, navigation, page scaffolding, badges, nutrition displays, alerts, PWA
src/lib/           types, mock data, store, deterministic nutrition + planning logic, features/tiers
public/sw.js       service worker      src/app/manifest.ts   web app manifest
scripts/generate-icons.mjs   regenerates app icons (npm run icons)
```

The nutrition calculations (`src/lib/nutrition.ts`) and plan generation (`src/lib/planning.ts`) are deterministic, matching the PRD rule that AI never decides what a person eats (§18). They are simplified for the prototype and are not clinically validated.
