---
name: ismartcup-design-system
description: >
  The iSmart Club design system — a DARK-ONLY, neon-green sports theme for the
  club-management app (staff, players, organigram, meetings, tasks, regulations,
  budget). Apply it when building or restyling any screen, component, or UI
  element in this repo. Triggers on: iSmart, club management, dark theme with
  green, Rubik, neon-green accent, budget/planning screens, members/tasks/
  meetings UI, or any request to extend or re-theme the existing UI. Read this
  BEFORE building anything. The look is calm, layered, near-black surfaces with a
  single electric green reserved for buttons and a blue accent for everything
  else interactive.
user-invocable: true
---

# iSmart Club — Design System

A **dark-only, neon-green sports** design system for the iSmart club-management
platform (staff, players, organigram, meetings, tasks, regulations, projects,
budget). The product UI is in **French**; copy and labels follow suit.

Depth comes from **surface layering, hairline borders, and the occasional green
glow** — never from gradients, images, or heavy decoration. The signature is a
single electric **neon-green** (`#00ff87`) used with restraint, on a layered
near-black canvas, set in **Rubik**.

> **Tokens live in [`src/styles/index.css`](../../../src/styles/index.css).**
> Restyle the whole system by editing tokens, not components. Tailwind v4
> utilities are bound to the tokens via the `@theme inline` block, so prefer
> utility classes (`bg-surface`, `text-ink-muted`, `border-border`,
> `text-success`, `text-info`) over raw hex. Raw hex/`var(--…)` is allowed only
> when no token fits — leave a comment why.

---

## TIER 1 — The five non-negotiable rules

These apply to **every** screen, component, and asset. They are what makes the
re-theme cohere — break one and the UI stops looking like iSmart Club.

### 1. Two surface colors only
The dark UI uses exactly **`#131313`** (`bg-background` / `--surface-subtle`, the
page) and **`#181818`** (`bg-surface` / `--surface`, any element on the page).
**Do not introduce a third structural fill.** Separate nested regions (a table
header, a sub-panel) with a **border** (`border-border`), never a new shade.
- **Nested inside a `bg-surface` card** that itself needs a fill: only two
  choices — **(a) empty + border** (transparent + `border-border`), or **(b)**
  the one allowed nested fill **`#1d1d1d`** (`bg-surface-nested`). Never the page
  `#131313` or any other shade for nested fills.
- Floating popovers (tooltip/menu) may use `#131313` + a border to read as a
  distinct chip. Hover states are **subtle white overlays** (`bg-surface-hover`,
  `rgba(255,255,255,0.05)`), not new solid layers.

### 2. Green is for buttons only
The neon green (`bg-primary` / `--green` `#00ff87`) appears on **primary buttons**
and the **brand logo mark** — and as **`--success` status** (see rule 3). It does
**NOT** appear on: input focus, colored icons, accent text, tags, badges, toggles,
tabs, active nav, links, progress bars, or decorative glows. Text on green is dark
(`text-ink-inverted` `#1e1e1e`).

### 3. One calm accent — blue — for everything else interactive
**Blue** (`text-info` / `bg-info` / `--accent` `#60a5fa`, soft `--accent-soft`) is
the single non-button accent: **tags, selected form controls, links, active
indicators, stat deltas, "+ add" inline actions.** Don't sprinkle orange/purple/
multiple greens as decoration.
- **Avatars** → neutral gray gradient (the kit `Avatar` derives a stable neutral
  tint), not a rainbow per name.
- **Tags / category chips** → saturated brand blue (`border-brand-blue-600/30
  bg-brand-blue-600/10 text-brand-blue-600`, `--brand-blue-600` `#0091ff`) by
  default; a custom hue only for a genuinely exceptional case. (The softer
  `--info` `#60a5fa` stays for links, stat deltas, and selected controls — tags
  use the brighter brand blue.)
- **Semantic status** — `text-success` green (money-in / positive balance),
  `text-danger` red (errors, overdue, money-out), `text-warning` gold
  (priority/near-limit) — is reserved for **real status**, never decoration. In
  match contexts: **your team always green (`team-home`), opponent always
  red (`team-away`)**.
- **One sanctioned exception to "no other accents": purple = AI.** `text-purple`
  / `bg-purple` (`--purple` `#7f77dd`, pressed `--purple-dim`) is reserved
  **exclusively for AI / generative actions** (an "Assistant" button, a generated
  suggestion, a smart-fill). It is NOT general decoration — outside an explicit AI
  affordance, the rule above still holds (blue or neutral, never random purple).

### 4. Inputs & non-primary buttons are empty + bordered
Text inputs, selects, and secondary/ghost buttons have a **transparent background**
with a **`border-strong` `#404040`** edge — they inherit whichever of the two
surfaces sits behind them. Solid fills are reserved for the **primary green button**
(and the destructive red button). Hover adds only a faint overlay, not a new fill.

### 5. Focus is neutral — never green or blue
**Inputs / selects / textareas:** empty (transparent) fill, default edge
`--input-border` `#252525`. On focus **only the border color changes** to
`border-focus` `#5a5a5a` — **no ring, no shadow, no fill.** Same border, lighter
color. Other focusable controls (buttons, links) may still show the faint white
ring (`--ring` `rgba(255,255,255,0.08)` via `ring-ring`). Never a green/blue
focus.

### 6. Go light on weight
Default text weight is **regular (400)**. Emphasis comes from **size, color, and
spacing — not bold.** Reserve **semibold (600)** for big page titles, large stat
numbers, and the logo. A **medium (500)** "low bold" is allowed on **sub-titles**
(section headers, card titles, `h2`/`h3`). Body, labels, buttons, nav, table
cells, badges, and tags stay 400. **Avoid `font-bold` (700).**

---

## Visual foundations

**Color.** Dark-only, two surfaces (`#131313` page, `#181818` element) +
`#1d1d1d` nested fill. Two accents, strict jobs: **green** (`--primary`, hover
`--green-dim` `#00cc6a`) = primary buttons; **blue** (`--accent` `#60a5fa`) =
every other interactive cue. Status: `--danger` `#e5484d`, `--warning` `#e6a817`,
`--success` `#00ff87`, all for genuine status only.
- **Blue brand scale (additive).** A richer, saturated blue ramp is available for
  brand marks, links, and stronger accents: `--brand-blue-600` `#0091ff` (lead,
  `bg-brand-blue-600`), hover `--brand-blue-700` `#369eff`, deep `--brand-blue-500`
  `#0954a5`, tint `--brand-blue-50` `#10243e`. It complements — does not replace —
  the lighter `--info`/`--accent` `#60a5fa`. Green is **still** the only button fill.
- **Softer status variants (additive).** Calmer alternatives to the neon status
  set, for places the neon reads too hot: `--success-600` `#46a758`, `--error-600`
  `#e5484d`, `--warning-600` `#68ddfd` (a cyan), plus `--green-button` `#4eaf60`
  (a softer confirm-green). The original neon `--success`/`--danger`/`--warning`
  stay valid; pick per context.

**One neutral scale — `--neutral-0…950` — drives every gray (TRUE neutral,
R = G = B; never warm, never cool/slate/blue).** Dark steps are surfaces/borders,
light steps are text. The `text-ink-*` tokens are just chosen steps of it:
`text-ink` = `neutral-900` `#fafafa` (titles) → `text-ink-subtle` = `neutral-600`
`#d4d4d4` (secondary emphasis) → `text-ink-muted` = `neutral-500` `#a3a3a3`
(most-used body/secondary) → `text-ink-disabled` = `neutral-300` `#525252`.
`neutral-950` `#ffffff` is reserved for max-emphasis. Use the `text-ink-*`
aliases for text; reach for a raw `text-neutral-NNN` only when no alias fits.
Never use a warm, slate, zinc, or otherwise tinted gray for text.

**Type — Rubik for everything.** UI, headings, body, and large stat numbers all
use Rubik (`font-ui` / `font-body` / `font-display` all resolve to Rubik). Mono
(`font-mono`) only for phone/ID values. Scale: caption 12/16 · body 14/20 · h3
16/20 · h2 20/24 · h1 30/36, tracking 0 throughout. Weight mostly 400 (rule 6).
*(Bebas Neue / Inter / DM Sans are retired — do not reintroduce them.)*

**Spacing & layout.** 4px base grid. Page content in a max-1400px column, ~28–32px
padding. Sidebar fixed 256px. Cards 16–20px internal padding; 16px gaps between
cards/stat tiles, 12px between toolbar controls. Use grid/flex `gap`, not ad-hoc
margins.

**Borders.** Three-style **solid-gray** system: `border-border` `#252525` (Neutral
— the default edge on every surface and table row), `border-border-second`
`#303030` (mid-weight separators), `border-border-strong` `#404040` (inputs,
hover, emphasis). Green-tinted emphasis only via `--border-green` for genuinely
brand moments.

**Radii.** `rounded-sm` 4 (inputs, icon buttons) · `rounded-md` 8 (buttons) ·
`rounded-lg` 12 (cards) · `rounded-xl` 20 (modals) · `rounded-pill` 100 /
`rounded-full` 9999 (badges, avatars, switches). Cards are still rounder than the
buttons inside them, just a touch tighter than before (2026 refresh: sm 6→4,
lg 16→12).

**Backgrounds.** Flat near-black fills. **No gradients, no images, no textures**
on chrome. The only "background effect" is the signature green **glow shadow**
(`shadow-glow`) on a few key raised surfaces, and 15%-opacity status tints. A
heatmap gradient (`--heat-0..4`, green→amber→orange→red) exists **for sports data
viz only.**

**Shadows / glow.** `shadow-glow` (`0 0 40px rgba(0,255,135,0.10)`) is the brand
signature — a soft green halo on select raised surfaces, used sparingly.
`shadow-card` adds a faint green-tinted lift; `shadow-deep` (black) is for
dialogs/toasts/popovers. Most in-flow surfaces carry no shadow and rely on
border + surface contrast.

**Card anatomy.** A card = 1px `border-border` + `rounded-lg`, in one of two
resting fills depending on whether it's static or navigable. No
left-accent-border cards, no colored card fills, no gradient fills.
- **Static card** (a panel that just displays content — stat tiles, form
  sections, tables): **no fill — transparent over the page (`#131313`)**, defined
  by its 1px `border-border` + `rounded-lg` alone (table headers are transparent
  too; only the row borders separate them). On hover — if it's interactive at
  all — it only brightens its border (`border-border-strong`) and may gain a
  green glow; **no background swap.** (Overlay surfaces that float above content
  — toasts, modals, drawers/sheets, dropdown menus — still take `bg-surface` so
  they read against what's behind them.)
- **Navigable card** (a whole card that routes somewhere — a document tile, a
  member card, anything you click to open a screen): rests flush with the page at
  `bg-background` (`#131313`) and **reveals `bg-surface` on hover via a fluid
  vertical fill** — a `bg-surface` overlay that grows from the top
  (`origin-top scale-y-0` → `group-hover:scale-y-100`, 260ms,
  `cubic-bezier(0.4,0,0.2,1)`), border brightening to `border-border-strong` and
  title/icon shifting to `text-brand-blue-600` in step. This is the one
  sanctioned background swap, and it moves a *fill*, never the card itself. The
  reference implementation is the Documents grid
  (`src/features/documents/DocumentsScreen.tsx`):
  ```jsx
  <div className="group relative flex flex-col overflow-hidden rounded-lg
                  border border-border bg-background transition-colors
                  hover:border-border-strong">
    {/* fluid fill: surface (#181818) descends top→bottom on hover */}
    <span aria-hidden className="pointer-events-none absolute inset-0 origin-top
      scale-y-0 bg-surface transition-transform duration-[260ms]
      ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-y-100" />
    {/* all real content sits at relative z-10 above the fill */}
  </div>
  ```
- **Nested regions inside either card** still follow Rule 1: transparent +
  `border-border`, or the single nested fill `bg-surface-nested` (`#1d1d1d`) —
  e.g. the icon tile on a navigable card is a `bg-surface-nested` square. A
  footer/secondary row is split off with `border-t border-border`. Never a third
  structural shade.

**Motion.** Quick and flat: 120–260ms, `cubic-bezier(0.4,0,0.2,1)`, animating
opacity/background/border/box-shadow — plus the **fluid-fill `scale-y` reveal**
on navigable cards (a fill growing from `origin-top`, ~260ms; see Card anatomy).
That directional fill is the *one* sanctioned scale — otherwise **no bounce, no
scale-pop, no spring, and no `translate`/`-translate-y` hover lifts** (the card
never moves; only the fill does). Hover lightens (ghost/secondary →
`bg-surface-hover`), reveals the fluid fill, or brightens the glow; primary
green → `--primary-hover`. Disabled = ~45% opacity, `cursor-not-allowed`.

---

## Content fundamentals

**Language.** French-first (`Planification`, `Joueurs`, `Réunions`, `Gestion des
tâches`, `Reglements`, `Fiche de poste`, `Budget`). Keep copy short and functional.

**Tone.** Operational and direct — an internal back-office / coaching tool, not
marketing. Labels are nouns or short imperatives: *Ajouter*, *Nouvelle tâche*,
*Enregistrer*, *Fermer*. No exclamation, no marketing voice, no first person.

**Casing.** Sentence case for descriptions/helper text. Short button labels in
title-ish case. UPPERCASE only for small overlines and metric labels (wide
tracking ~0.06–0.1em).

**Numbers & data.** IDs/phones in mono; big hero stats in Rubik semibold, white.
Counts are bare integers ("8 membres"). Status is a single word in a pill
(*Active / Confirmée / À confirmer*). Money-in / positive balances → `text-success`
green; money-out / negative → `text-danger`.

**Emoji.** Not used. Use a lucide icon instead.

---

## Iconography

- **Library:** [lucide](https://lucide.dev) via `lucide-react`. Stroke icons, 2px
  stroke, 16px default (14 in dense rows/sm buttons, 18–20 for emphasis).
- **Color:** icons inherit `currentColor` — `text-ink-muted` idle, white when
  active, dark (`text-ink-inverted`) on filled green buttons, semantic color for
  status icons. **Do not** tint decorative icons green.
- **Usage:** one icon per action; pair with a text label except in icon buttons
  (which need an `aria-label`). Common glyphs: `Calendar`, `Users`, `User`,
  `Shield`, `Network`, `Layers`, `Target`, `ListChecks`, `ClipboardList`,
  `FileText`, `Bell`, `Settings`, `Plus`, `Filter`, `Search`.
- **Logo:** an `iS` monogram in a rounded **neon-green** tile (dark text), weight
  700, next to "iSMART". The one place green + bold is intentional.

---

## Component cheat-sheet (this repo)

Reuse the kit in `src/components/` — don't re-style the same thing twice.

| Need | Use | On-rule styling |
|---|---|---|
| Primary action | `ui/button` `variant="default"` | `bg-primary text-ink-inverted`, hover `bg-primary/90` — **no** translate lift |
| Secondary / ghost | `ui/button` `outline`/`ghost` | transparent + `border-strong`; hover `bg-surface-hover` |
| Destructive | `ui/button` `destructive` | `bg-destructive` red |
| AI / generative action | `ui/button` + purple | `bg-purple text-white` (`--purple` `#7f77dd`), hover `bg-purple/90` — **AI affordances only**, never decoration |
| Static card / panel | `div` | **no fill (transparent over `#131313`)** + `border-border` + `rounded-lg`; hover (if any) brightens border only — no fill swap. Overlay surfaces (toast/modal/drawer/menu) keep `bg-surface` |
| Navigable / link card | `div` (see `documents/DocumentsScreen`) | rests at `bg-background`; `bg-surface` fluid fill reveals on hover (`origin-top scale-y-0`→`scale-y-100`, 260ms), border → `border-border-strong`, title/icon → `text-brand-blue-600`; content at `relative z-10` |
| Return / back | `kit/BackButton` | **icon-only** (`ArrowLeft`), no label; square `size-9`, empty fill + `border-border`, hover brightens; **top-left, above the page header.** Destination name goes in `aria-label`/`title` (hover tooltip), never as visible text |
| Text input / select | `ui/input`, screen `field` | transparent fill + `border-input` `#252525`; focus = `border-focus` `#5a5a5a` **color only, no ring** |
| Status / category pill | `kit/Badge` | `info` = blue (default accent); `success`/`danger`/`warning` for real status; **avoid `brand`** |
| Tag / chip | brand blue | `border-brand-blue-600/30 bg-brand-blue-600/10 text-brand-blue-600` (`#0091ff`) — softer `info` is for links/deltas/selections |
| Tabs / segmented | `budget/ui` `Segmented` | active = `bg-surface-nested border-border-second text-ink` (neutral), **not** green |
| Sidebar nav active | `AppSidebar` | `bg-surface-hover text-ink` (white), **not** green |
| Stat tile | `budget/ui` `Stat` | value white; positive/negative via `text-success`/`text-danger`; delta blue |
| Progress / consumption bar | `budget/ui` `Bar` | `bg-info` normal, `bg-warning` near-limit — **not** green |
| Inline "+ add" link | `budget/ui` `LinkBtn` | `text-info` blue, uppercase, light tracking |

**Decision rule when a color is ambiguous:** is it a *primary button*? → green.
Is it *genuine pass/fail/positive-negative status*? → `success`/`danger`/`warning`.
Otherwise it's interactive chrome → **blue** (`info`) or **neutral**. When in
doubt, neutral.

---

## When the system doesn't define something

Don't guess. Open 2–3 of the closest existing screens (the `budget/` feature is
the richest reference) and the kit components, study their spacing, density, and
the green/blue/neutral split, and extend that. A new screen must look like it
belongs to the same family. State which screens you referenced, and end each
screen with one line on the main UX/creative decision you made.
