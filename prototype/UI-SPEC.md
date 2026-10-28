# NutriPlan UI specification

This is the implementation contract for the NutriPlan interface. The prototype in this folder implements it, and the production app (Flutter or React Native) must reproduce it. It refines the visual direction in [PRD §44](../docs/prd/17-visual-design-system.md) into exact values and components. If this file and §44 disagree, §44 wins and this file must be updated.

Values are in logical pixels (px = dp = pt).

## 1. Principles

1. **Fresh, colorful, photo-led.** Real food photos, lime highlights, a green primary and colorful data accents on a light canvas. Soft round white cards with gentle shadows. Visual references are in [`../design-ref/`](../design-ref/). No purple/blue AI gradients, no glass effects, and nothing that looks like an AI demo.
2. **One primary action per screen.** It is the only solid green button on the screen. Lime marks highlights (summary card, selected day, the Food Log tab button), not extra primary actions.
3. **Same pattern, same component.** A meal card, a settings row and a status chip look identical everywhere.
4. **Estimates look like estimates.** Use `~` and ranges, show what kind of target applies (range, minimum or limit), and never use red for intake. Rings show record completeness or a range, never a "goal to hit".
5. **What we don't copy from the references:** streaks, rewards, food scores, exact calorie counts, weight-loss pressure and "decoded by AI" framing (CLAUDE.md, §44.12).

## 2. Layout

### 2.1 Frame
- **Phones and the installed PWA:** full screen. Respect safe-area insets at the top (header) and the bottom (tab bar or sticky footer).
- **Desktop (≥ 1024):** a 390 × 844 device frame that scrolls internally, beside a 300-wide prototype note. Prototype only.

### 2.2 Grid and spacing (4 px base)

| Token | Value | Use |
|---|---|---|
| Screen gutter | **20** | Left and right padding of every screen (`px-gutter`) |
| Section gap | **28** | Between sections in a screen body (`space-y-7`) |
| Section header → content | 12 | |
| Card padding | 16 (dense) / 20 (hero) | |
| List row padding | 16 horizontal, 12 vertical, min height 60 | |
| Gap inside rows | 12 | Between icon, text and trailing content |
| Stack of related controls | 8–12 | |

### 2.3 Screen anatomy
```
┌ Header (sticky, translucent ivory) ┐
│ Body: gutter 20, sections 28 apart │
│ … (scrolls)                        │
└ Tab bar (tab screens) OR sticky footer (task flows) ┘
```
- **Tab-root screens** (Home, Plan, Food Log, Recipes, Profile): large header.
- **Nested screens:** compact header with a back button. The tab bar stays visible.
- **Task flows** (log a meal, generate a plan, checkout, coach, onboarding): no tab bar, a close or back control, and the primary action in a **sticky footer**.

## 3. Typography

Inter for everything; there is no serif. Noto Sans Bengali as the Bangla fallback (line height × 1.15 for `lang="bn"`). Every number uses **tabular figures**.

| Style | Size / line | Weight | Tracking | Use | Class |
|---|---|---|---|---|---|
| Display | 28 / 34 | 700 | −2.5% | Large screen titles, welcome hero | `text-display` |
| Metric | 36 / 40 | 600 | −2% | One hero number per card | `text-metric` |
| Title | 20 / 26 | 600 | −1.2% | Sheet and dialog titles, card hero titles | `text-title` |
| Headline | 17 / 24 | 600 | −0.8% | Section titles, compact header title, emphasized row titles | `text-headline` |
| Body | 15 / 22 | 400 / 500 | 0 | Default text and row titles (500) | `text-body` |
| Callout | 14 / 20 | 400 / 600 | 0 | Secondary text, links, buttons (sm) | `text-callout` |
| Caption | 13 / 18 | 400 | 0 | Meta lines, helper text, descriptions | `text-caption` |
| Overline | 12 / 16 | 600, uppercase | +6% | Group labels, eyebrow text ("NEXT STEP") | `text-overline` |
| Micro | 11 / 14 | 500–600 | 0 | Tab labels, phase badges only | |

Text colors:
- primary: Text `#141814`;
- secondary: `#5B6559` (`text-muted-foreground`), the only grey allowed for text;
- links and active: green `#15803D`.

Never use Icon grey `#8F978C`, lime `#9BD14A` or orange `#F97316` for text. They are for icons, highlights and decoration only.

## 4. Components

### 4.1 Tab bar
- Full-width white bar with 28 px top corners and an upward soft shadow. Sticky, so it takes layout space and never covers the last row.
- Five tabs: Home, Plan, **Food Log**, Recipes, Profile. Each has a 22 px Lucide icon over an 11 px label.
- **Food Log** is the center tab: a raised 58 px lime circle (`#9BD14A`, scan icon in Text color) lifted 28 px above the bar with a 5 px white ring and a lime glow. Its label stays below.
- **Active tab:** green icon (stroke 2.2), Text-color label at weight 600 and a 4 px green dot below. **Inactive:** Icon-grey icon, secondary label.

### 4.2 Headers
- **Large:** 20 top padding and 12 bottom. Display title, with an optional caption subtitle and trailing actions.
- **Compact:** height 56. A 44 px white round back button with a soft shadow, a Headline title, and up to two trailing actions.
- **Header icon button:** a 44 px white circle with a soft shadow and a 19 px icon. An unread dot is 8 px orange with a 2 px white ring.
- **Home header:** avatar (profile switcher, with a small chevron badge when there are other profiles) → greeting caption over the name → calendar and bell buttons.
- Headers are sticky on translucent canvas (92%) with a backdrop blur.

### 4.3 Surfaces (cards)
**One card style:** radius 24, white, no border, soft shadow (`0 1 2 rgba(20,24,20,.03), 0 4 16 −6 rgba(20,24,20,.06)`).

| Tone | Look | Use |
|---|---|---|
| default | White card | Almost everything |
| lime | Lime card `#C5E98A`, Text color | The one hero card per screen (Home daily summary, profile header) |
| sage (tint) | `#EEF8DF` | A highlighted recommendation or positive note |
| muted | `#EFF1EB` | Inner stat tiles and quiet sub-areas inside cards |
| forest (primary) | Green with white text | A promotional card (e.g. Premium upsell), at most one per screen |
| outline | Dashed border | "Add" placeholders |

### 4.4 Lists
- **Grouped list (`ListGroup` + `ListRow`)** for 2 or more settings or navigation rows: one white card with hairline dividers. A row is a 40 px **round** icon tile (vary tones: lime, sky, amber, orange, tint), a title (Body 500), an optional description (Caption), trailing content, then an 18 px chevron when it navigates. Minimum height 60.
- **Meal card** (Home, Plan): its own white card, 12 padding. A 68 px round dish photo (white ring), then the meal type (Caption 600) · time, the name (Body 600, 2 lines), and a meta row with an orange flame + `~kcal`, prep time and the status pill. The "Up next" meal gets a 2 px lime ring and a lime "Up next" chip. Cards stack with 12 px gaps.
- **Week strip** (`WeekStrip`): white card with the month title, round prev/next buttons and seven 68 px tall day pills. The selected day is a lime pill; a dot marks days with meals (orange for today if empty).

### 4.5 Buttons

| Variant | Look | Use |
|---|---|---|
| Primary | Green `#15803D` fill, white text (hover `#166534`) | **One per screen** |
| Secondary | Tint fill, green text | A positive alternative action |
| Outline | White, 1 px input border | A neutral alternative |
| Ghost | Text only, green | Tertiary actions inside cards |
| Destructive | Safety fill | Only inside confirm dialogs |

All buttons are **pill-shaped** (fully rounded). Sizes: lg 54, default 44, sm 36; text 16/15/14 at weight 600. Icon buttons are circles. Text links use Callout 600 in green.

### 4.6 Inputs and choices
- **Inputs and selects:** height 48, radius 16, white, 1 px border `#D9DDD4`, text 15, 16 px side padding. Labels above in Callout 500.
- **Segmented control:** height 44, pill-shaped muted track, 4 px padding. The active segment is a white pill with a soft shadow and Text-color 600.
- **Choice cards:** radius 24, white with a soft shadow and a 2 px transparent border. Selected: lime border, tint fill, the icon tile turns lime, and a check mark.
- **Chips:** height 36, pill. Unselected white with a soft shadow; selected lime with Text color.
- **Switch:** 48 × 28, green when on.

### 4.7 Pills (status and meta)
Height 24 (22 inside rows), radius full, text 12 at weight 500 with an optional 14 px icon. Tones:
- neutral: muted;
- sage (tint): positive or eaten;
- forest: strong;
- outline: dashed, for planned or not yet;
- caution;
- safety;
- terracotta (orange tint): P3 only;
- amber tint: "changed" states and P2.

A pill always contains text; color is never the only signal.

| Meal status | Pill |
|---|---|
| Planned | outline |
| Eaten | sage |
| Eaten, changed / Replaced | amber tint `#FEF3C7`, text `#92400E` |
| Skipped / Not recorded | neutral |

### 4.8 Sheets and dialogs
- **Bottom sheet:** phone width (max 440) with a 28 px top radius and a white surface. It has a 40 × 4 grab handle and a 36 px circular close button at the top right. The title uses Title style with 20 px side padding. It can be at most 92% of the viewport tall and scrolls inside. Actions go at the bottom.
- **Dialog:** max width 380 with a 24 px radius and 24 px padding. Title style, left-aligned, with the actions full width, stacked or side by side. Destructive confirmation lives only here.
- **Scrim:** Text color `#141814` at 40% with a 2 px blur.

### 4.9 Feedback
- **Safety alert** (allergen, infant safety, emergency): safety surface, radius 16, 16 padding, a shield icon and a title in the safety color. An emergency adds a solid "Emergency guidance" button. Always prominent and never dismissible while the risk applies.
- **Caution note:** caution surface. **Info note:** sage surface. Both are informative and never alarming.
- **Toasts** are top-center, white and short. They confirm actions ("Marked as eaten · Undo").
- **Empty state:** a dashed card containing a 48 px icon tile, a Headline title, a Callout description (max 272 wide) and one action.

### 4.10 Nutrition display
- **Daily summary hero (Home):** lime card with an "Eaten today · estimate" chip, the `~kcal` metric (34 bold), the day range below it, and a **ring** showing how many planned meals are recorded ("1 of 4 recorded"). Below it, two white macro tiles (protein, fiber) with round tinted icons, values with `~` and the target as a range or minimum.
- **Ring** (`Ring`): 12–13 px stroke, round caps, white or muted track. It shows record completeness or a share of a range, labeled in text. Never a calorie goal to hit.
- **Nutrient bar:** label left, `~value / target` right, above a 10 px track. Fill uses the nutrient's data color (energy green, protein `#22C55E`, carbs `#F59E0B`, fat `#3B82F6`, fiber `#84CC16`, water `#0EA5E9`). A **range** draws a tint-strong band; a **minimum** or **limit** draws a 2 px marker. Never red, never animated, always an accessible text equivalent.
- **Charts:** rounded bars; logged in lime/green, planned in tint-strong; axis labels and units always shown.
- **Confidence chips:** high (tint), moderate (muted), low (caution). Identification and quantity get separate chips.
- Every number is tabular. Show `~` on estimates. Costs are labeled "estimate" and use `৳`.

### 4.11 Food imagery
- **Photos first.** Recipes and planned meals use real dish photos (`RecipeThumb`): round in rows and cards (36 / 48 / 56 / 68–80 px, 2 px white ring), 16:10 covers on recipe cards, and a full-bleed hero on recipe detail and the welcome screen.
- When no photo exists, fall back to a colorful illustrated tile (tint color plus a Lucide icon).
- Prototype photos are Wikimedia Commons placeholders with attribution (`public/food/CREDITS.md`, Profile → App settings → Photo credits). Production uses licensed photography of the actual recipes.
- Photo callouts on the welcome hero use example estimates ("Dal · ~180 kcal").

### 4.12 Icons
Lucide only. Use 20 inside 40 px tiles, 18 for chevrons and 16 inside buttons and pills. Stroke is 1.8, or 2.1 for the active tab. Every icon-only control has an accessible label.

### 4.13 Elevation and motion
- **Soft card shadow** on white cards (see §4.3). **Float elevation** for the tab bar, the center Food Log button, sheets and dialogs.
- Transitions are 150–200 ms ease-out for color, opacity and transform. No bounce, no confetti and no counting-up numbers. Honor reduced motion.

## 5. Screen patterns

### 5.1 Home (§44.6)
Order:
1. Header: avatar / profile switcher, greeting over the name, calendar and bell buttons.
2. Daily summary: lime hero card with the ring, two macro tiles and the estimate note.
3. **+ Log a meal**, a full-width lg primary button.
4. Today's plan as meal cards with dish photos.
5. The next step: a white card with a cover photo of the meal.
6. "More for you" as a grouped list.

Child profiles replace items 2–6 with the feeding view (§12): no calories, softer tint-led and in caregiver language.

### 5.2 Task flows
Use the shared flow header: back on the left, ✕ on the right, the title with "Step 2 of 9" in caption, and a 4 px progress bar below it (segmented for up to 5 steps, continuous above that). Show one question group per screen. The primary action ("Continue", "Confirm", "Activate plan") sits in the sticky footer; a secondary action ("Skip", "Back") goes above it as an outline button or ghost text.

### 5.3 Detail screens
Hero (thumbnail or summary) → key facts as stat tiles → content sections → the primary action in a sticky footer when the screen exists to act (e.g. "Add to plan").

### 5.4 Settings-type screens
Only grouped lists with labels, using switches as trailing controls. No free-floating cards.

### 5.5 Gated (premium) content
A dashed outline card with a 48 px icon tile, the feature name, a one-line value statement and a **See plans** button (sm). It is never shown for safety features. When a screen has several gated sections, use the **row** variant instead (a single grouped-list row reading "Included in Premium · see plans") so upsell cards never stack.

### 5.6 Release-phase badges (prototype only)
P1, P2 and P3 pills (11 px) appear next to feature titles and can be turned off in settings. Production builds omit them.

## 6. Accessibility checklist
- Touch targets are ≥ 44 × 44.
- Text contrast is ≥ 4.5 : 1. Small text uses `#5B6559`, never icon grey, lime or orange.
- Never rely on color alone: every status has text.
- Charts carry labels, units and a text equivalent.
- Focus rings are visible (green, 3 px at 50%).
- The layout supports dynamic type up to 200% without clipping primary actions: truncate secondary text, and wrap titles rather than truncating them.

## 7. Tokens (source: `src/app/globals.css`)

**Lime Fresh** palette, chosen by the product owner from `design-ref/` (PRD §44.2). Contrast for every text pairing is measured in §44.2.2.

| Token | Value | Prototype class |
|---|---|---|
| Primary | `#15803D` | `forest`, `primary` |
| Primary hover | `#166534` | `primary-hover` |
| Lime (highlight, non-text) | `#9BD14A` | `lime` |
| Lime card | `#C5E98A` | `lime-card` |
| Lime text | `#3F6212` | `lime-text` |
| Tint / tint strong | `#EEF8DF` / `#D6EFB0` | `sage` / `sage-strong` |
| Canvas | `#F4F5F0` | `ivory`, `background` |
| Card | `#FFFFFF` | `card` |
| Muted surface | `#EFF1EB` | `muted` |
| Text | `#141814` | `charcoal`, `foreground` |
| Secondary text | `#5B6559` | `muted-foreground` |
| Icon grey (icons only) | `#8F978C` | `muted-grey` |
| Border / input border | `#E8EAE4` / `#D9DDD4` | `border` / `input` |
| Accent orange (decorative) / text / tint | `#F97316` / `#C2410C` / `#FFEDD5` | `terracotta` / `terracotta-text` / `coral-tint` |
| Amber text / tint | `#92400E` / `#FEF3C7` | `amber-text` / `amber-tint` |
| Sky text / tint | `#075985` / `#E0F2FE` | `sky-text` / `sky-tint` |
| Data: protein, carbs, fat, fiber, water | `#22C55E`, `#F59E0B`, `#3B82F6`, `#84CC16`, `#0EA5E9` | `protein`, `carbs`, `fat`, `fiber`, `water` |
| Safety / surface | `#B42318` / `#FEF3F2` *(proposed, §43.7)* | `safety` / `safety-surface` |
| Caution / surface | `#B54708` / `#FFFAEB` *(proposed, §43.7)* | `caution` / `caution-surface` |

The prototype's class names `forest`, `sage`, `ivory`, `terracotta` and `charcoal` come from the first palette and now map to the tokens above; production code should use the token names in the first column.

| Radius | Value |
|---|---|
| sm | 8 |
| inputs, inner tiles | 16 |
| cards, choice cards, dialogs | 24 |
| sheets, tab bar | 28 (top corners) |
| buttons, chips, segmented, icon tiles, dish photos | full (pill / circle) |

## 8. Implementation map (prototype)

| Spec item | Component |
|---|---|
| Frame, tab bar | `components/app/shell.tsx` |
| Headers (incl. flow header), body, sections, surfaces, lists, pills, stat tiles, sticky footer, empty state | `components/app/page.tsx` |
| Segmented control, stepper, choice card, chips, form field | `components/app/controls.tsx` |
| Meal row and meal list (Home, Plan) | `components/plan/meal-row.tsx` |
| Alerts | `components/app/alerts.tsx` |
| Nutrient bar, estimate note, confidence chip | `components/app/nutrition.tsx` |
| Food tile | `components/app/recipe-thumb.tsx` |
| Phase badges, premium gate | `components/app/badges.tsx` |
| Buttons, inputs, sheets, dialogs, segmented control | `components/ui/*` (restyled shadcn) |
