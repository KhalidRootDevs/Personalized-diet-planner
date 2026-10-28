# 44. Visual Design System

**Source:** Nutrition App Visual Design Guide, "a warm, modern, human-centered design system for personalized nutrition."

**Design principle: calm, credible, food-first, and personal, not a generic AI dashboard.**

This section is the visual and interaction design specification. It works alongside §19 (Application Screens), §42.25 (Main App Experience) and §19.5 (Accessibility). Where it differs from those sections, §44.17 records how the difference is resolved.

---

## 44.1 Product Design Direction

The app should feel like a thoughtful nutrition companion: grounded in real food, easy to trust, and pleasant to use every day. Aim for an editorial wellness aesthetic rather than a futuristic technology aesthetic. The interface should make the next useful action obvious without making users feel judged about what they eat.

### Design goals

- **Modern but warm:** restrained colors, confident typography and generous whitespace.
- **Food-first:** use genuine, appetizing food photography where it improves recognition or motivation.
- **Practical:** prioritize meal logging, today's plan and the next action over decorative charts.
- **Trustworthy:** make estimates, uncertainty and user corrections clear, especially for photo-based nutrition (§41.3.4).
- **Inclusive across life stages:** keep one shared brand while adapting content and controls for babies, children, adults, pregnancy, older adults and relevant care contexts (§44.9).

## 44.2 Color System

Use the palette below as the core brand system. Warm Ivory is the default canvas. Forest Green anchors navigation and primary actions. Sage supports calm secondary surfaces. Terracotta adds a small amount of food-related warmth. Keep Charcoal for readable text and Muted Grey for supporting information.

| Color | Hex | Recommended use |
|---|---|---|
| Forest Green | `#244C3A` | Primary actions, navigation, active states |
| Sage | `#DCE7D8` | Soft surfaces, secondary highlights, supportive states |
| Warm Ivory | `#FAF8F2` | Main app background |
| White | `#FFFFFF` | Cards, forms, sheets |
| Terracotta | `#C8795B` | Food accents, selected highlights, small emphasis |
| Charcoal | `#292F2B` | Primary text and headings |
| Muted Grey | `#7C837D` | Secondary labels, metadata, helper text (see the contrast limits in §44.2.2) |

### 44.2.1 Color usage rules

- Use Forest Green for the primary CTA, active navigation, selected controls and key progress indicators.
- Use Sage for secondary panels, subtle status backgrounds and gentle emphasis, not for every card.
- Use Warm Ivory for the overall page background to avoid a stark clinical feel.
- Use Terracotta sparingly for food highlights, a selected tag or a small visual accent. Do not use it for every button.
- Use color alongside labels or icons. Never rely on color alone to communicate status or nutritional meaning.
- Check contrast for text and controls, including small helper text and disabled states. Use accessible contrast combinations rather than assuming every palette pairing is safe.

### 44.2.2 Measured contrast (WCAG 2.x)

Computed for the palette above. AA requires **4.5:1** for normal text and **3:1** for large text (≥ 24 px regular or ≥ 18.66 px bold) and for non-text UI such as icons, borders and focus rings.

| Foreground on background | Ratio | Normal text | Large text / UI |
|---|---:|---|---|
| Charcoal on Warm Ivory | 12.88 | Pass (AAA) | Pass |
| Charcoal on White | 13.67 | Pass (AAA) | Pass |
| Charcoal on Sage | 10.72 | Pass (AAA) | Pass |
| White on Forest Green (primary button) | 9.68 | Pass (AAA) | Pass |
| Forest Green on Warm Ivory | 9.11 | Pass (AAA) | Pass |
| Forest Green on Sage | 7.59 | Pass (AAA) | Pass |
| Charcoal on Terracotta | 4.13 | **Fail** | Pass |
| Muted Grey on White | 3.89 | **Fail** | Pass |
| Muted Grey on Warm Ivory | 3.66 | **Fail** | Pass |
| Terracotta on White | 3.31 | **Fail** | Pass |
| White on Terracotta | 3.31 | **Fail** | Pass |
| Terracotta on Warm Ivory | 3.12 | **Fail** | Pass |
| Muted Grey on Sage | 3.05 | **Fail** | Pass (barely) |

**Consequences**

- **Muted Grey (`#7C837D`) must not be used for 12–13 px labels or helper text**, which is exactly where §44.3 places it. Use it only for large text, icons, borders and dividers.
- For small secondary text, use a darker text variant. **Proposed `#616762`** ("Muted Grey Text", the same hue darkened) measures 5.46 on Warm Ivory, 5.79 on White and 4.54 on Sage.
- **Terracotta is an accent, not a text or button color.** Never use white text on Terracotta. If Terracotta text is ever needed, the proposed darker variant **`#A26249`** measures 4.52 on Warm Ivory and 4.80 on White.
- The proposed variants need design-owner approval (§43.7).

## 44.3 Typography

Use a clean, familiar sans-serif for interface clarity. **Inter** or **Geist** work well for headings, labels, numbers and body copy. If the product needs a little editorial character, use **Newsreader** only for occasional large page titles or short inspirational headings, never for dense UI.

| Role | Suggested treatment | Guidance |
|---|---|---|
| Page title | 28–32 px, semibold | Short, human and specific |
| Section heading | 18–22 px, semibold | Creates a clear scan path |
| Body | 14–16 px, regular | Readable on mobile; avoid dense paragraphs |
| Labels / metadata | 12–13 px, medium | Use sparingly; keep contrast at ≥ 4.5:1 (§44.2.2) |
| Nutrition numbers | Large, tabular numerals | Align values for easy comparison |

**Bangla script requirement (§27.1):** Inter, Geist and Newsreader do not include Bengali glyphs. The type stack therefore needs a Bengali-capable font, for example Noto Sans Bengali or Hind Siliguri, with metrics close to the Latin font. Test line heights, since Bengali needs more vertical space, and check that tabular numerals still align when numbers are shown in Bangla digits. The choice of font is an open decision (§43.7).

## 44.4 Layout, Spacing and Component Shape

- Use a 4 px spacing base. Common gaps are 8, 16 and 24 px, with larger spacing between major sections.
- Use card corners of about 12–16 px, buttons about 12–14 px and inputs about 10–12 px.
- Prefer flat surfaces and subtle borders. Use shadows only where they clarify elevation, such as a bottom sheet or floating action.
- Align layouts to a consistent grid and don't pack every metric into the first screen.
- Use clear tap targets and comfortable spacing, especially for older adults and caregivers using one hand.
- Keep forms short and progressive: ask only for what is needed at the current step, and explain why sensitive details are requested (§5, §5.10).

## 44.5 Navigation and Information Architecture

For a mobile-first product, use a simple **five-item bottom navigation**:

- **Home:** today's plan, daily progress and the next best action.
- **Plan:** calendar, meal plans, grocery and task reminders, and schedule.
- **Food Log:** photo upload, manual entry, meal history and corrections.
- **Recipes:** search, filters, recipe detail, servings and substitutions.
- **Profile:** personal details, goals, preferences, household profiles and settings.

Use familiar outline icons (for example Lucide) with labels. Avoid ambiguous icon-only navigation. Keep the primary action, usually "Log a meal", easy to find without letting it cover the current screen.

How the sections from §42.25.1 fit into these five tabs is defined in §44.17.

## 44.6 Home Dashboard Pattern

*Refines §19.2 and §42.25.2.*

The home screen should answer three questions quickly: **What is planned today? How am I doing so far? What should I do next?** Use an editorial hierarchy, not a wall of equally weighted cards.

- **Greeting and date:** a short, low-pressure welcome such as "Good evening", plus the date.
- **Daily nutrition summary:** calories and selected nutrients, shown against personalized targets only when appropriate.
- **Progress indicators:** compact bars or rings with clear labels, units and remaining/consumed context.
- **Meal timeline:** breakfast, lunch, dinner and snacks with genuine food thumbnails when available.
- **Primary action:** a prominent "+ Log a meal" action that supports photo and manual logging.
- **Today's plan:** the next meal or a concise plan preview, with a link to the full calendar.

### Recommended dashboard hierarchy

1. **Header:** greeting, date, and a profile switcher if the household has multiple profiles (§5.10).
2. **Daily summary:** one prominent overview with a few useful values, not every nutrient at once.
3. **Meal timeline:** planned and logged meals with clear status labels (§14.6).
4. **Next step:** one helpful action, such as logging a meal or viewing the next planned recipe.
5. **Secondary details:** trends, reminders or educational content lower on the page.

## 44.7 Photo-Based Food Logging Experience

*Visual and interaction layer for §41.2 and §41.3.*

Photo logging is a central product capability. The interface must feel helpful and transparent, not magical or overconfident. Food recognition and nutrient values are presented as estimates the user can correct.

- Let users take a photo, upload an existing image, or switch to manual entry.
- After analysis, show the identified foods and estimated portions in an editable review step.
- Make it easy to correct a food match, serving size, preparation method, or ingredients such as oil, dressing or sauce.
- Show a short confidence or uncertainty message where useful. Never imply that a photo gives laboratory-grade precision.
- Calculate calories and nutrients from a maintained food-composition database and deterministic calculation logic, not free-form model guesses.
- Show the saved meal and its effect on the daily summary only after the user confirms, or clearly label it as unconfirmed.
- Support multiple foods in one image and allow separate items to be added or removed.

### Example interaction sequence

1. Tap "Log a meal" and choose camera, photo library or manual entry.
2. Review the detected foods and suggested portions.
3. Correct any mismatches, or adjust serving sizes and hidden ingredients.
4. Confirm the meal and view the updated daily summary.
5. If a meaningful adjustment would help, offer one practical, non-judgmental suggestion.

## 44.8 Meal Planning, Recipes and Calendar

- Use a calendar-first layout for day, week and month planning, and make the selected date visually clear.
- Keep meal cards compact: meal name, time, recipe thumbnail, preparation time, and a clear planned/logged state (§14.6).
- Recipe detail prioritizes ingredients, steps, serving count, substitutions and relevant nutrition information (§15.1).
- Let users swap a meal, change servings or move it to another day without rebuilding the whole plan (§15.2–§15.3, §42.11).
- Present grocery lists, prep tasks and reminders as practical extensions of the plan, not competing dashboard widgets.
- Clearly distinguish a planned meal from a meal that was actually eaten and logged.

## 44.9 Adapting the Experience to Age and Life Stage

Use one recognizable brand, but don't force every user into the same dashboard. A baby-feeding experience needs different content, safety checks and language from an adult nutrition tracker.

### Baby and young-child profiles

*Visual layer for §12, §12.8 and §42.10.*

- Use a softer, calmer presentation with Sage surfaces and clear caregiver-oriented language.
- Organize complementary feeding around age-appropriate milestones and textures, not adult calorie targets.
- Make allergen exposure, choking-risk guidance, preparation texture and caregiver notes easy to find where relevant.
- Avoid weight-loss framing, adult macro targets and gamified food scoring.
- Include clear safety messaging, and recommend professional advice for individualized medical or feeding concerns.

### Adult profiles

- Prioritize personalized meal plans, food logging, trends, preferences and practical adjustments.
- Show goals and nutrient targets only when they suit the user's profile and context.
- Use neutral language. Do not shame users for missed targets, skipped logs or food choices.

### Other life stages and health contexts

Pregnancy, older adulthood, chronic conditions, allergies and therapeutic diets may need distinct rules, disclaimers or clinician-supported workflows (§13.1). The UI must clearly separate general wellness guidance from medically tailored recommendations.

## 44.10 Charts, Progress and Nutrition Feedback

*Visual layer for §41.4, §42.19 and §17.6.*

- Keep charts simple: a few labeled progress bars or a compact trend line is usually enough.
- Always label units and time periods, and distinguish consumed, planned, target and remaining values.
- Don't present every nutrient as a colorful ring. Prioritize the measures relevant to the selected profile.
- Put explanatory text alongside charts so the user doesn't have to interpret color or shape alone.
- Frame recommendations as options, such as "You could add…" or "A practical next step is…", not as commands or moral judgments.
- When estimates are uncertain, show that uncertainty in the UI and avoid false precision.
- Show whether a value is a range, a minimum or an upper limit (§41.4.2).

## 44.11 Photography, Icons and Motion

### Photography

- Prefer genuine, varied food photography with natural lighting and realistic portions.
- Keep image crops consistent within a component family, and provide fallback states when no photo is available.
- Avoid overly polished stock imagery that makes everyday meals feel unrealistic or unattainable.
- Prioritize local Bangladeshi dishes and ingredients in product imagery (§42.6).

### Icons and motion

- Use one coherent icon set, such as Lucide, with consistent stroke weight and size.
- Use brief transitions for confirmations, expanding details and calendar changes.
- Do not animate nutrition values in ways that make them feel more precise than they are.
- Respect reduced-motion preferences, and avoid confetti or reward effects around food intake.

## 44.12 What to Avoid

- Purple or blue AI gradients as the main visual identity.
- Glassmorphism on every panel, or excessive blur and glow effects.
- Too many floating cards, borders, shadows and competing primary actions.
- An AI avatar or chat-first interface that hides the core meal-planning and logging workflows. The AI Coach (§42.2) is a supporting entry point, not the home screen.
- Overloaded dashboards with too many metrics above the fold.
- Aggressive streaks, food scores, red warnings, or language that moralizes eating. This applies to habits (§42.18) and adherence (§17.3).
- Claims that photo analysis is exact, or recommendations that ignore age, life stage, allergies or medical context.

**Safety alerts are different from intake feedback.** Allergen conflicts, unsafe infant foods and emergency guidance (§12.5, §13.4, §42.21) still need a clear, prominent alert state with an icon and explicit text. The "no red warnings" rule is about judging what someone ate, not about hiding safety information.

## 44.13 Implementation Approach

For a web-based product, a practical starting stack is **Next.js, Tailwind CSS, shadcn/ui and Lucide icons**, matching §22.1. Define the color, type, spacing, radius and elevation tokens centrally so the system stays consistent across screens and can be adapted for mobile (§43 3.16).

### Design tokens to centralize

| Token group | Include |
|---|---|
| Colors | Brand primary, secondary surface, canvas, surface, text, muted text, accent, borders, semantic states |
| Typography | Font family (including the Bengali font, §44.3), scale, weights, line heights, tabular-number treatment |
| Spacing | 4 px base scale and approved spacing steps |
| Shape | Button, input, card, modal and pill radii |
| Elevation | Border-first default, a small number of shadow levels |
| Components | Buttons, form fields, meal cards, nutrition summaries, progress indicators, bottom sheets, navigation |

Suggested token mapping from §44.2:

| Token | Value |
|---|---|
| `primary` | Forest Green `#244C3A` |
| `primary-foreground` | White `#FFFFFF` |
| `secondary` (surface) | Sage `#DCE7D8` |
| `background` (canvas) | Warm Ivory `#FAF8F2` |
| `card` / `popover` (surface) | White `#FFFFFF` |
| `foreground` (text) | Charcoal `#292F2B` |
| `muted-foreground` (small text) | `#616762` (proposed, §44.2.2) |
| `muted-decorative` (large text, icons, borders) | Muted Grey `#7C837D` |
| `accent` | Terracotta `#C8795B` (decorative only) |
| Semantic states (success, info, caution, safety alert) | **Not defined by the guide.** They must be specified and contrast-checked before use (§43.7) |

## 44.14 Accessibility and Trust Checklist

*Extends §19.5.*

- [ ] Text and interactive controls have adequate contrast and stay readable at larger text sizes (§44.2.2).
- [ ] Controls have clear labels and visible focus states, and keyboard navigation works on web.
- [ ] Tap targets are comfortably sized and spaced on mobile.
- [ ] Charts include labels and meaningful text equivalents.
- [ ] Users can edit or remove logged foods and correct AI-detected errors.
- [ ] Food-photo storage and health-related data handling are explained clearly, with appropriate consent and controls (§5.10, §41.7.3).
- [ ] The interface communicates that photo-derived portions and nutrients are estimates.
- [ ] Age-specific safeguards prevent adult weight-loss or calorie guidance from being applied to infants and children.
- [ ] Recommendations account for known allergies and relevant user constraints, and avoid unsupported medical claims.
- [ ] English and Bangla text both render correctly, without clipping or misaligned numerals (§44.3).

## 44.15 MVP Screen Checklist

These are the Release Phase 1 screens (§43.2).

| Screen | Must support |
|---|---|
| Onboarding and profile | Age/life stage, preferences, activity context, goals, allergies and relevant conditions; progressive disclosure; consent (§5.10) |
| Home dashboard | Today's plan, summary, meal timeline, one prominent next action |
| Food log | Camera/upload/manual entry, detected items, editable portions, confirmation |
| Meal detail | Food items, serving sizes, nutrition estimate, correction controls |
| Plan calendar | Day/week/month view, planned meals, swaps, reminders and tasks |
| Recipe detail | Ingredients, instructions, servings, substitutions, nutrition |
| Progress | Simple trends, transparent units, profile-appropriate targets |
| Profile/settings | Preferences, privacy controls, notifications, household/profile switching |
| Shopping list | Consolidated items by category, purchased state, estimated cost (§16, §43 1.18). Reached from Plan |
| Weekly Review | Phase 1 content of §17.6. Reached from Home and a reminder |
| Child feeding view | Shown for dependent child profiles when the baby module ships (§12, §44.9) |

## 44.16 Final Design Principle

**Make the product feel like a calm, capable nutrition companion, not an AI demo.** Use warm colors, genuine food imagery, clear hierarchy, useful defaults, editable estimates and respectful language. Keep the shared brand consistent while adapting nutrition logic and interface content to each age and life stage.

---

## 44.17 Reconciliation With Earlier Sections

| Topic | Earlier spec | Resolution |
|---|---|---|
| Navigation | §19.1 lists 7 items; §42.25.1 lists 8 sections | **Mobile: the five-tab bottom navigation in §44.5.** The §42.25.1 sections become destinations inside those tabs: **Shopping List** → Plan; **Progress** → Home ("See trends") and Food Log history; **Family** (Phase 2) → Profile (household profiles); **AI Coach** (Phase 2) → an entry point on Home and in context (for example from a meal or the daily summary), never a tab that hides the core workflows (§44.12). Desktop may show all sections in a sidebar (§19.1 "can vary between mobile and desktop"). |
| Section label | "Food Journal" (§41, §42.25) vs "Food Log" (§44.5) | The feature is called **AI Food Journal**. Its navigation tab is labeled **"Food Log"**. |
| Home actions | §42.25.2 has four quick actions | **One primary action, "+ Log a meal"** (§44.6). "View today's plan", "View daily nutrition" and (Phase 2) "Ask AI Coach" are secondary, shown in the hierarchy rather than as competing primary buttons. |
| Red warnings | §44.12 avoids red warnings | Applies to intake feedback only. Safety alerts keep a distinct, prominent alert state (§44.12). |
| Streaks and scores | §42.18 Habit Builder | No streak counters, food scores or reward effects. Habit completion is shown as neutral weekly progress (§17.6). |
| Muted Grey for 12–13 px labels | §44.2, §44.3 | Fails AA. Use `#616762` for small text (§44.2.2). |
| Bangla typography | §27.1 requires Bangla; §44.3 fonts are Latin-only | Add a Bengali font to the stack (§44.3). |
