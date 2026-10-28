# NutriPlan UI specification

This is the implementation contract for the NutriPlan interface. The prototype in this folder implements it, and the production app (Flutter or React Native) must reproduce it. It refines the visual direction in [PRD §44](../docs/prd/17-visual-design-system.md) into exact values and components. If this file and §44 disagree, §44 wins and this file must be updated.

Values are in logical pixels (px = dp = pt).

## 1. Principles

1. **Calm and editorial.** Warm Ivory canvas, white cards, Forest Green for action. No gradients, no glass effects, and nothing that looks like an AI demo.
2. **One primary action per screen.** It is the only solid Forest Green button on the screen. Everything else is secondary, outline, ghost or a text link.
3. **Group, don't stack.** Related rows sit in one card separated by hairlines (an inset grouped list). Avoid piles of separate bordered cards.
4. **Same pattern, same component.** A meal row, a settings row and a status chip look identical everywhere.
5. **Estimates look like estimates.** Use `~` and ranges, show what kind of target applies (range, minimum or limit), and never use red for intake.

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

Inter for all UI. Newsreader **only** for display titles. Noto Sans Bengali as the Bangla fallback (line height × 1.15 for `lang="bn"`). Every number uses **tabular figures**.

| Style | Size / line | Weight | Tracking | Use | Class |
|---|---|---|---|---|---|
| Display | 30 / 36, Newsreader | 500 | −1.5% | Large screen titles, welcome hero | `text-display` |
| Metric | 36 / 40 | 600 | −2% | One hero number per card | `text-metric` |
| Title | 20 / 26 | 600 | −1.2% | Sheet and dialog titles, card hero titles | `text-title` |
| Headline | 17 / 24 | 600 | −0.8% | Section titles, compact header title, emphasized row titles | `text-headline` |
| Body | 15 / 22 | 400 / 500 | 0 | Default text and row titles (500) | `text-body` |
| Callout | 14 / 20 | 400 / 600 | 0 | Secondary text, links, buttons (sm) | `text-callout` |
| Caption | 13 / 18 | 400 | 0 | Meta lines, helper text, descriptions | `text-caption` |
| Overline | 12 / 16 | 600, uppercase | +6% | Group labels, eyebrow text ("NEXT STEP") | `text-overline` |
| Micro | 11 / 14 | 500–600 | 0 | Tab labels, phase badges only | |

Text colors:
- primary: Charcoal `#292F2B`;
- secondary: `#616762` (`text-muted-foreground`), the only grey allowed for text under 18 px;
- links and active: Forest `#244C3A`.

Never use Muted Grey `#7C837D` for small text. It is for icons, chevrons and borders only.

## 4. Components

### 4.1 Tab bar
- A floating bar inset 12 from the screen sides and 12 + safe area from the bottom.
- Height 68, radius 24, white at 95% with a backdrop blur, a 1 px border and float elevation.
- Five equal tabs: Home, Plan, Food Log, Recipes, Profile. Each has a 21 px Lucide icon over an 11 px label.
- **Active tab:** the icon sits in a 56 × 32 Forest pill and is drawn in Ivory, with the label in Forest at weight 600. **Inactive tab:** the icon is Muted Grey and the label is `#616762` at weight 500.
- An ivory fade sits behind the bar so content dissolves under it.
- The bar is sticky, so it takes layout space and never covers the last row.

### 4.2 Headers
- **Large:** 20 top padding and 12 bottom. Display title, with an optional caption subtitle and trailing actions bottom-aligned.
- **Compact:** height 56. A 40 px back button (chevron-left 22, no border) and a Headline title, left-aligned. Up to two trailing actions.
- **Header icon button:** a 40 px circle, white, 1 px border, 19 px icon. An unread dot is 8 px Terracotta with a 2 px white ring.
- Both header types are sticky on translucent ivory (92%) with a backdrop blur.

### 4.3 Surfaces (cards)
**One card style:** radius 16, white, 1 px border `#E8E5DC` at 80%, **no shadow**.

| Tone | Look | Use |
|---|---|---|
| default | White card | Almost everything |
| sage | Sage at 70%, no border | The single highlighted "next step" or recommendation per screen |
| muted | `#F2F0E9`, no border | Inner stat tiles and quiet sub-areas inside cards |
| forest | Forest with Ivory text | At most one promotional or hero card per screen (e.g. the Premium upsell) |
| outline | Dashed border | Empty states and "add" placeholders |

Never nest a bordered card inside a bordered card. Inside a card, use muted tiles or hairline dividers instead.

### 4.4 Lists
- **Grouped list (`ListGroup` + `ListRow`)** is the default for 2 or more navigable or settings rows. It is one card with hairline dividers between rows.
- A row is: an optional 40 px icon tile, a title (Body 500), an optional description (Caption, secondary), trailing content (a value, switch or pill), then an 18 px chevron when the row navigates. Minimum height 60. The pressed state is a muted background.
- An optional group label above the card uses the Overline style, indented 4 px.
- **Meal row** (timeline and plan): time column (48 wide, right-aligned, the time in Callout 600 over AM/PM in Micro), a 44 px food thumbnail, then the content: meal type (Caption) · the name (Body 500, clamped to 2 lines) · a meta row with the status pill and `~kcal`. The "Up next" row gets a sage tint at 35%.

### 4.5 Buttons

| Variant | Look | Use |
|---|---|---|
| Primary | Forest fill, white text | **One per screen** |
| Secondary | Sage fill, Forest text | A positive alternative action |
| Outline | White, 1 px input border | A neutral alternative |
| Ghost | Text only, Forest | Tertiary actions inside cards |
| Destructive | Safety fill | Only inside confirm dialogs |

| Size | Height | Radius | Text |
|---|---|---|---|
| lg | 52 | 16 | 16 / 600 |
| default | 44 | 14 | 15 / 600 |
| sm | 36 | 12 | 14 / 600 |
| icon | 44 (default), 40 (in headers) | circle | |

Full-width lg is used for the main action of a screen or flow. Text links use Callout 600 in Forest and are underlined on hover only.

### 4.6 Inputs and choices
- **Inputs and selects:** height 48, radius 12, white, 1 px border `#DCD8CD`, text 15. Labels sit above in Callout 500, with 6 px between label and field. Helper and error text is Caption.
- **Segmented control** (Tabs): height 44, `#F2F0E9` track, 4 px padding, radius 12. The active segment is white with a hairline shadow and Charcoal 500 text.
- **Choice cards** (onboarding, single or multi-select): radius 16, white, 1 px border. The selected state has a Forest border, a sage tint and a check mark.
- **Chips** (filters, multi-select): height 36, radius full. The selected state is Forest with Ivory text.
- **Switch:** 48 × 28 with a 24 px thumb, Forest when on. **Checkbox:** 20 px, radius 6.
- **Toggle group:** height 44, radius 12. The selected state has a Forest border on a sage tint.

### 4.7 Pills (status and meta)
Height 24 (22 inside rows), radius full, text 12 at weight 500 with an optional 14 px icon. Tones:
- neutral: muted;
- sage: positive or eaten;
- forest: strong;
- outline: dashed, for planned or not yet;
- caution;
- safety;
- terracotta: P3 only.

A pill always contains text; color is never the only signal.

| Meal status | Pill |
|---|---|
| Planned | outline |
| Eaten | sage |
| Eaten, changed / Replaced | `#EFE9DA` neutral-warm |
| Skipped / Not recorded | neutral |

### 4.8 Sheets and dialogs
- **Bottom sheet:** phone width (max 440) with a 28 px top radius and a white surface. It has a 40 × 4 grab handle and a 36 px circular close button at the top right. The title uses Title style with 20 px side padding. It can be at most 92% of the viewport tall and scrolls inside. Actions go at the bottom.
- **Dialog:** max width 380 with a 24 px radius and 24 px padding. Title style, left-aligned, with the actions full width, stacked or side by side. Destructive confirmation lives only here.
- **Scrim:** Charcoal at 40% with a 2 px blur.

### 4.9 Feedback
- **Safety alert** (allergen, infant safety, emergency): safety surface, radius 16, 16 padding, a shield icon and a title in the safety color. An emergency adds a solid "Emergency guidance" button. Always prominent and never dismissible while the risk applies.
- **Caution note:** caution surface. **Info note:** sage surface. Both are informative and never alarming.
- **Toasts** are top-center, white and short. They confirm actions ("Marked as eaten · Undo").
- **Empty state:** a dashed card containing a 48 px icon tile, a Headline title, a Callout description (max 272 wide) and one action.

### 4.10 Nutrition display
- **Hero metric:** `~498 kcal` in Metric style with a caption range below it ("Likely 423–572 kcal").
- **Nutrient bar:** the label (Callout 500) on the left and `~value / target` on the right, above an 8 px track. A **range** draws a sage band with the Forest fill. A **minimum** or **limit** draws a 2 px marker. Never use red, never animate the count, and give each bar an accessible text equivalent.
- **Inner stat tiles:** muted, radius 12, with a caption label over a Headline value and a Caption unit.
- **Confidence chips:** high (sage), moderate (warm), low (caution). Identification and quantity get separate chips.
- Every number is tabular. Show `~` on estimates. Costs are labeled "estimate" and use `৳`.

### 4.11 Food imagery
Until photography exists, use **illustrated tiles**: a swatch color plus a Lucide icon at 80% opacity. Sizes are 44 (rows), 56 (cards), 80 (featured) and 176 high (recipe hero, radius 16).

### 4.12 Icons
Lucide only. Use 20 inside 40 px tiles, 18 for chevrons and 16 inside buttons and pills. Stroke is 1.8, or 2.1 for the active tab. Every icon-only control has an accessible label.

### 4.13 Elevation and motion
- **Flat** is the default. **Float elevation** (`0 10 30 −10 rgba(41,47,43,.22)`) is used only for the tab bar, sheets and dialogs.
- Transitions are 150–200 ms ease-out for color and opacity only. Sheets slide in. No bounce, no confetti and no counting-up numbers. Honor reduced motion.

## 5. Screen patterns

### 5.1 Home (§44.6)
Order:
1. Header: the date overline with the bell and profile switcher on one row, and the Display greeting on its own row below.
2. Daily summary hero card: a "Eaten so far · estimate" caption, the metric, the likely range, an "x of y meals recorded" pill, three nutrient bars and the estimate note.
3. **+ Log a meal**, a full-width lg primary button.
4. Today's plan as a grouped meal list.
5. The next step as a sage card.
6. "More for you" as a grouped list.

Child profiles replace items 2–6 with the feeding view (§12): no calories, sage-led and in caregiver language.

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
- Text contrast is ≥ 4.5 : 1. Small text uses `#616762`, never `#7C837D` or Terracotta.
- Never rely on color alone: every status has text.
- Charts carry labels, units and a text equivalent.
- Focus rings are visible (Forest, 3 px at 50%).
- The layout supports dynamic type up to 200% without clipping primary actions: truncate secondary text, and wrap titles rather than truncating them.

## 7. Tokens (source: `src/app/globals.css`)

| Token | Value |
|---|---|
| forest | `#244C3A` |
| sage | `#DCE7D8` |
| ivory (canvas) | `#FAF8F2` |
| card | `#FFFFFF` |
| terracotta (decorative) | `#C8795B` |
| terracotta-text | `#A26249` *(proposed)* |
| charcoal | `#292F2B` |
| muted-grey (icons, borders) | `#7C837D` |
| muted-foreground (text) | `#616762` *(proposed)* |
| muted surface | `#F2F0E9` |
| border | `#E8E5DC` |
| input border | `#DCD8CD` |
| safety / surface | `#8F2D24` / `#F8E7E3` *(provisional, §43.7)* |
| caution / surface | `#7A5A12` / `#F6EED8` *(provisional, §43.7)* |

| Radius | Value |
|---|---|
| sm | 8 |
| md (pill tiles) | 12 |
| inputs | 12 |
| buttons | 14 |
| cards | 16 |
| dialogs | 24 |
| tab bar | 24 |
| sheets | 28 (top corners) |

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
