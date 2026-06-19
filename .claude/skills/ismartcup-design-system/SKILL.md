# UI/UX Prototype — CLAUDE.md (reusable template)

A clickable, **design-system-driven UI prototype** with mock data. Fill in the
**Per-project** block below, drop your design-system skill in `.claude/skills/`,
your tokens in `src/styles/tokens.css`, and build. Everything else is
product-agnostic and reads from the block.

## Per-project — fill these in
- **Product:** `<name>` — `<one line: what it is + who uses it>`
- **Design-system skill:** `<your-design-system>` (in `.claude/skills/`)
- **UI language:** `<e.g. French / English / Arabic>` — set once, stay consistent.
- **Entities:** `<the collections the screens show, e.g. projects, members, invoices, events…>`
- **Real backend schema?** `<path in /docs if one exists, else "none">`

---

This is a **prototype, not a real app.** Goal: screens that look exactly like the
product, navigate between each other, **and behave like real data** — add / edit /
delete persist across screens and ripple into other views. **No backend and no
network:** all data lives in a single in-memory store, seeded on load. A designer
is delivering this to demo look-and-feel, flow, and core interactions.

## TIER 1 — Hard rules
- **Design-first.** Every screen/component uses the project's design-system skill in `.claude/skills/`. Read it before building anything. Match it exactly.
- **Prefer tokens over hex.** Use the semantic tokens from `src/styles/tokens.css` (e.g. `bg-brand-600`, `text-ink-muted`, `border-border`). Raw hex is allowed only when no token fits — leave a comment explaining why.
- **In-memory data.** A single React Context store at the app root holds all data, seeded on load from `src/mock/data.ts`. Screens read from it and mutate via add / update / remove, so create/edit/delete persist across navigation and show up in other screens. No fetch, no API, no async, no server, no runtime schemas. In memory only — resets on refresh.
- **No real business logic.** Only simple add/edit/delete plus derived display values (counts, rates, totals, "X/Y" summaries, basic sort/filter). Do NOT implement the product's real engine — no domain algorithms, scheduling, scoring, pricing, or workflow rules.
- **Everything navigates.** Buttons, tabs, cards, back arrows route to real screens. The demo must feel clickable end to end. Use placeholder screens for anything not built yet, never dead buttons.
- **Routes, not tab state.** Top-level tabs/screens are nested React Router routes (one URL each). Global data lives in the store; only in-screen UI (open modals, form inputs, filters) uses local state.
- **No over-engineering.** The store is a plain React Context + `useReducer`/`useState` — NOT a library; new-row IDs use the built-in `crypto.randomUUID()`. Don't add redundant infrastructure (Zustand, Redux, TanStack Query, Zod, MSW, react-hook-form, a component/UI kit like shadcn) unless asked. Real capability libraries (charts, drag-and-drop, canvas, etc.) are fine when a screen genuinely needs one — see Stack.

## TIER 2 — Craft: think UX & creativity on every screen
Before building any screen or component, think like a designer, not a code generator:
- **Purpose first.** Who is on this screen and what is the ONE thing they came to do? Make that primary action the most obvious element; everything else is secondary and visually quieter.
- **Make it feel alive.** Seed varied, believable content in the product's language — different names, a mix of statuses, an edge case (an error/forfeit/overdue), a long name, a near-full and an empty record. Identical rows look fake; variety looks real.
- **Design every state, not just the happy one.** Think through the empty state, the "lots of data" state, and the selected/active state. A thoughtful empty card ("Nothing here yet…") sells the prototype more than a full one. (Empty states also appear after a user deletes everything — handle that.)
- **Interactions must respond.** Hover, active tab, selected row, pressed button, and visible feedback on actions (a brief inline/toast-style confirmation). Clicking should always *feel* like something happened.
- **Hierarchy & rhythm.** Most important info biggest and first; supporting info muted (`text-ink-muted`). Keep a consistent spacing rhythm and let screens breathe.
- **Creative WITHIN the system.** The design-system skill is the ceiling for style — never invent a new palette, font, or foreign look. (A rare one-off hex per the Tier 1 rule is fine; a new color *system* is not.) Creativity means thoughtful composition, good empty-state ideas, and smart use of the existing tokens and components.
- **When the system doesn't define something,** don't guess randomly: open 2-3 of the closest existing screens/components, study their spacing, density, and feeling, and extend that. A new screen must look like it belongs to the same family. State which screens you referenced.
- **Tasteful restraint.** Polish with intent (an icon, a status dot, a progress bar) — don't over-decorate. Clean and considered beats busy.

End each screen by stating, in one line, the main UX/creative decision you made.

## Stack (keep it minimal)
- Vite + React + TypeScript.
- Tailwind v4 (tokens via `src/styles/tokens.css`) + `lucide-react` icons.
- React Router for screen navigation. React Context for the in-memory data store.

If asked for something this stack can't cleanly do (drag-and-drop, interactive
canvas, charts, virtualization, complex animations, etc.), don't get stuck on the
list — read the use case, pick the best-fit library for the job, install it, and
use it. The "minimal" rule is about avoiding bloat (UI kits, convenience libs,
redundant state managers), not about refusing real capability needs.

## Data layer (in-memory store)
- One provider, `src/data/DataProvider.tsx`, mounted at the app root (wraps the router). It loads `src/mock/data.ts` into state on first render.
- It exposes the collections plus per-entity actions: `add<Entity>` / `update<Entity>` / `remove<Entity>`, the same shape for each.
- Screens read and mutate through a `useData()` hook — never import `mock/data.ts` directly.
- New rows get `crypto.randomUUID()` ids. Existing seed rows keep readable slug ids (`entity-slug`).
- Derived values (counts, rates, "X/Y" summaries) are COMPUTED from the store in render — never stored.
- In memory only; state resets on page refresh. (If asked, persistence can later be added via `localStorage` — not by default.)

## Reference docs (/docs) — optional
- If the project has a real backend schema (Prisma, SQL, OpenAPI…), put it in `/docs` as **reference only.** Never copy it into the app. When the data needs a field, look up its real name / relationship there.
- `docs/data-plan.md` — the prototype data slice: the entities and only the fields the screens show. **The types and the seed in `src/mock/data.ts` follow this file.**

Data rules:
- Use the real field names where a schema exists. IDs are strings. Give related entities the parent id they belong to.
- Model only what the screens show. Do NOT model backend-only constructs (engine internals, join tables, derived pipelines). When a value isn't decided yet, a plain placeholder string is fine.
- Read `docs/data-plan.md` before editing `src/mock/data.ts`, the store, or any screen that shows data. Add a field only when a screen needs it, taking it from the schema.

## Structure (flat, screen-based)
```
docs/
  schema.*                  # real backend — reference only (if any)
  data-plan.md              # prototype data slice (shapes for the store + seed)
src/
  main.tsx  App.tsx         # App.tsx = <DataProvider> wrapping the router
  styles/index.css          # @import "./tokens.css"
  data/
    DataProvider.tsx        # app-root Context store, seeded from mock/data.ts; add/update/remove
    useData.ts              # useData() hook screens call to read + mutate
  mock/data.ts              # SEED data (initial values), shaped per docs/data-plan.md
  shells/
    AppShell.tsx            # sidebar + topbar (top level)
    SectionShell.tsx        # optional: back-header + tab bar for a nested section
  components/               # shared UI from the design system (Avatar, StatusBadge, Card, ProgressBar, EmptyState, DataTable, Modal, Tabs…)
  screens/
    <List>.tsx              # a top-level list screen
    <section>/              # a section that owns several sub-screens
      <ScreenA>.tsx  <ScreenB>.tsx  …
    <other top-level screens>.tsx
```

## Conventions
- UI strings in the product's language (set once; it's the product language).
- Reuse shared components from `components/` — don't re-style the same thing twice.
- Screens read and mutate data only through `useData()`. `src/mock/data.ts` is the seed and the single source of truth for initial content (the same records appear everywhere).
- Empty states where they make the demo look real (an empty card; an emptied list after deletes). No spinners faking network calls.
- Light/dark theme toggle is a nice-to-have via `data-theme` on `<html>` (if the tokens support it).

## Autonomy
- Run any terminal/bash command you need on your own — install deps, start/stop the dev server, build, typecheck, run git, move or rename files, run scripts. **Don't pause to ask for permission; just run it and keep building.** Call out only the notable ones (a new dependency added, or anything destructive).

## Commands
- `pnpm dev` · `pnpm build` · `pnpm typecheck`

## Workflow
- Build screen by screen, on-brand, wired into the router and the store as you go. Show each screen as it lands.---
name: ismartcoach-design-system
description: >
  Apply the iSmart Coach design system when building any page, component,
  section, or visual interface for the iSmart Coach platform. Triggers whenever
  the user asks to build a new page, landing section, dashboard, auth screen,
  or UI element for iSmart Coach. Also use when the user says "use the iSmart
  Coach style", "match the landing page design", "iSmart theme", or references
  the dark sports-coaching aesthetic with neon green accents. Use this skill for
  any new iSmart Coach page, even quick prototypes, to stay on-brand. Trigger
  on keywords like: iSmart, coaching app, sport platform, dark theme with green,
  landing page for coaches, match analysis, video tagging, event timeline,
  heatmap, player tracking, clip review, analyst dashboard, or any request to
  extend the existing iSmart Coach UI.
---
 
# iSmart Coach Design System
 
A dark, premium, sports-coaching UI system for a **video analysis SaaS platform**.
Two distinct UI contexts exist:
- **Marketing / Landing pages** — deep charcoal backgrounds, neon-green (#00FF87) accent, Bebas Neue display headings, large sections, scroll reveals.
- **App / Analyst workspace** — same dark theme, but information-dense, full-width, keyboard-driven, video-first layouts.
---
 
## 1. Typography
 
### Font Stack (3 fonts, strict hierarchy)
 
| Role | Font | Weight | Use |
|---|---|---|---|
| Display / Headlines | Bebas Neue | 400 | Section titles, hero headings, pricing amounts, step numbers. Marketing only — never in dense app UI. |
| UI Labels / Buttons | Inter | 600–700 | Buttons, tags, badges, nav CTA, step tags, pillar titles, app nav labels, keyboard shortcut indicators |
| Body / Paragraphs | DM Sans | 400–500 | Paragraphs, descriptions, form inputs, muted notes, table rows, event list items, timestamps |
 
### Heading Sizes (Marketing)
 
| Element | Size | Line-height | Letter-spacing |
|---|---|---|---|
| Hero h1 | `clamp(4rem, 10vw, 9rem)` | 0.95 | 0 |
| Section h2 | `clamp(2.5rem, 5vw, 3.8rem)` | 1 | 0.02em |
| Journey h2 | `clamp(2.8rem, 6vw, 5rem)` | 0.95 | 0.02em |
| Card h3 (Bebas) | 1.5rem | 1 | 0.02em |
| Card h3 (Inter) | 1.15rem | 1.3 | 0.01em |
| Step title | `clamp(1.8rem, 2.5vw, 2.4rem)` | 1 | 0.03em |
 
### App UI Sizes
 
| Element | Font | Size | Weight |
|---|---|---|---|
| Panel section title | Inter | 0.78rem | 700 |
| Table header | Inter | 0.72rem | 700 |
| Table row / event label | DM Sans | 0.88rem | 400 |
| Timestamp | DM Sans | 0.78rem | 400 |
| Sidebar nav item | Inter | 0.82rem | 600 |
| Tag button label | Inter | 0.72rem | 700 |
| Keyboard shortcut | DM Sans | 0.68rem | 500 |
| Stat value (large) | Bebas Neue | 2.2–3rem | 400 |
| Stat label | Inter | 0.7rem | 700 |
| Tooltip | DM Sans | 0.78rem | 400 |
 
**Import snippet:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@500;600;700&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
```
 
**Rules:**
- Bebas Neue is ONLY for large display text and stat numbers — never for body, labels, or buttons.
- Inter is ONLY for interactive/UI elements — buttons, tags, badges, labels, nav items, table headers.
- DM Sans is ONLY for body text, descriptions, inputs, timestamps, table rows, and muted notes.
- Gradient text on hero `<em>`: `background: linear-gradient(135deg, #00FF87, #00a856); -webkit-background-clip: text; -webkit-text-fill-color: transparent;`
- Section labels are always: Inter 700, 0.75rem, uppercase, letter-spacing 0.12em, color `var(--green)`, with a 20px green line before the text.
- Inter has a large x-height and reads cleanly at small sizes — keep the existing tracking on uppercase labels (0.06–0.12em); do not add extra. For mixed-case UI (buttons, nav) use 0 letter-spacing.
- Inter ships tabular figures — apply `font-variant-numeric: tabular-nums;` (or `font-feature-settings: "tnum" 1;`) on any Inter element showing numbers in a column (scores, deltas, stat labels with counts) so digits stay aligned.
---
 
## 2. Color Palette
 
### CSS Custom Properties (always define these on `:root`)
 
```css
:root {
  /* ── Backgrounds ── */
  --dark:         #131313;    /* Primary background */
  --dark2:        #151515;    /* Alternating section background */
  --dark3:        #0e0e0e;    /* Deepest background — sidebars, footers */
  --card-bg:      #181818;    /* Card surfaces */
  --panel-bg:     #161616;    /* App panel / sidebar background */
  --input-bg:     rgba(255,255,255,0.04);
 
  /* ── Text ── */
  --white:        #FFFFFF;
  --light:        #F8F9FA;
  --light2:       #EFF2F6;
  --muted:        #969696;    /* Secondary text */
  --muted2:       #5a5a5a;    /* Disabled / placeholder text */
  --slate:        #1e1e1e;    /* Text on green buttons */
 
  /* ── Primary Accent ── */
  --green:        #00FF87;    /* CTAs, highlights, active states, your-team color */
  --green-dim:    #00cc6a;    /* Hover / secondary green */
  --green-glow:   rgba(0,255,135,0.15);
 
  /* ── Semantic: Data Encoding (use consistently across all charts/heatmaps) ── */
  --team-home:    #00FF87;    /* Home / your team — always green */
  --team-away:    #FF4D6D;    /* Away / opponent — always red-pink */
  --neutral:      #60A5FA;    /* Neutral events, ball possession, referee ── */
 
  /* ── Semantic: UI Status ── */
  --success:      #00FF87;    /* Same as green */
  --warning:      #E6A817;    /* Amber — also used for premium badges */
  --error:        #FF4D6D;    /* Same as away team */
  --info:         #60A5FA;    /* Blue */
 
  /* ── Heatmap Gradient Stops (use as CSS gradient or chart color scale) ── */
  --heat-0:       rgba(0,255,135,0.0);    /* No activity */
  --heat-1:       rgba(0,255,135,0.15);
  --heat-2:       rgba(230,168,23,0.4);
  --heat-3:       rgba(255,100,60,0.6);
  --heat-4:       rgba(255,40,40,0.85);   /* Maximum activity */
 
  /* ── Borders ── */
  --border:       rgba(255,255,255,0.07); /* Default border */
  --border-hover: rgba(255,255,255,0.15);
  --border-green: rgba(0,255,135,0.25);
  --border-focus: var(--green);
 
  /* ── Misc ── */
  --blue:         #3B82F6;    /* Secondary accent — sparse use */
  --amber:        #E6A817;    /* Premium/gold badges */
  --radius-sm:    6px;
  --radius-md:    8px;
  --radius-lg:    16px;
  --radius-xl:    20px;
  --radius-pill:  100px;
}
```
 
### Color Usage Rules
 
| Surface | Color |
|---|---|
| Page background (odd sections) | `var(--dark)` #131313 |
| Page background (even sections) | `var(--dark2)` #151515 |
| Card backgrounds | `var(--card-bg)` #181818 |
| App panel / sidebar | `var(--panel-bg)` #161616 |
| Primary text | `var(--white)` |
| Secondary/body text | `var(--muted)` |
| Borders | `rgba(255,255,255,0.07)` |
| Accent / CTAs / active | `var(--green)` |
| Text on green surfaces | `var(--slate)` |
| Premium badges | `var(--amber)` |
| Home team events | `var(--team-home)` — green |
| Away team events | `var(--team-away)` — red-pink |
| Neutral events | `var(--neutral)` — blue |
 
**Rules:**
- Green is ONLY for: CTAs, active states, accent text, tags, progress bars, glows, check marks, and home-team data.
- `--team-away` (#FF4D6D) is ONLY for opponent/away data — never for UI errors that could be confused with data.
- Never use green for large background fills.
- Alternating sections use `--dark` / `--dark2` for subtle depth.
---
 
## 3. Layout Contexts
 
### Marketing Layout
- Max content width: **1100px** (centered, `margin: 0 auto`)
- Horizontal padding: **5%**
- Section padding: `7rem 5%`
### App Layout (Analyst Workspace)
- Full viewport width — no max-width constraint on the shell
- **Shell structure:** fixed left sidebar + top bar + scrollable main content area
- Main content padding: `1.5rem 2rem`
- Panel internal padding: `1.25rem`
```
┌──────────────────────────────────────────────────────────────┐
│  Top Bar (48px fixed)                                        │
├──────────┬───────────────────────────────────────────────────┤
│          │  Main Content Area                                │
│  Sidebar │  ┌─────────────────────┬─────────────────────┐   │
│  (220px) │  │  Video Player       │  Tag / Event Panel  │   │
│  fixed   │  │                     │                     │   │
│          │  ├─────────────────────┴─────────────────────┤   │
│          │  │  Timeline / Scrubber                      │   │
│          │  ├───────────────────────────────────────────┤   │
│          │  │  Event List / Analytics Panel             │   │
│          │  └───────────────────────────────────────────┘   │
└──────────┴───────────────────────────────────────────────────┘
```
 
### Responsive Breakpoints
 
| Breakpoint | Key Changes |
|---|---|
| ≤ 1200px | Sidebar collapses to icon-only (48px wide). Tag panel moves below video. |
| ≤ 900px | Top bar hides secondary actions. Grids collapse to 1–2 columns. |
| ≤ 768px | Sidebar becomes bottom tab bar. Video goes full-width. |
| ≤ 600px | Timeline scrubber stacks below video. Event list becomes drawer. |
| ≤ 480px | Single-column app layout. Reduced padding. |
 
---
 
## 4. Surface Language
 
### Card Surface (Marketing)
```css
.card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 2rem;
  transition: transform .3s, border-color .3s, box-shadow .3s;
}
.card:hover {
  transform: translateY(-5px);
  border-color: var(--border-green);
  box-shadow: 0 12px 40px rgba(0,255,135,0.06);
}
```
 
### App Panel Surface
```css
.app-panel {
  background: var(--panel-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.app-panel__header {
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.app-panel__body {
  padding: 1.25rem;
}
```
 
### Glass Nav (Marketing)
```css
nav {
  background: rgba(13,17,23,0.75);
  backdrop-filter: blur(18px);
  border-bottom: 1px solid var(--border);
}
```
 
### App Top Bar
```css
.app-topbar {
  height: 48px;
  background: var(--dark3);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 1.5rem;
  gap: 1rem;
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
}
```
 
### Glows & Radials
```css
/* Section background glow */
background: radial-gradient(
  ellipse at center,
  rgba(0,255,135,0.04) 0%,
  transparent 65%
);
```
 
---
 
## 5. Noise Overlay
 
A fixed, full-screen SVG noise texture applied via `body::before` — mandatory on every page:
 
```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 9999;
  opacity: 0.4;
}
```
 
---
 
## 6. Buttons
 
### Primary CTA (Green)
```css
.btn-primary {
  background: var(--green);
  color: var(--slate);
  padding: 0.9rem 2rem;
  border-radius: var(--radius-md);
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  box-shadow: 0 0 30px rgba(0,255,135,0.2);
  transition: all 0.2s;
}
.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 40px rgba(0,255,135,0.35);
}
```
 
### Ghost / Outline
```css
.btn-ghost {
  color: var(--white);
  padding: 0.9rem 2rem;
  border-radius: var(--radius-md);
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 1rem;
  border: 1px solid var(--border);
  background: none;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-ghost:hover {
  border-color: var(--border-hover);
  background: rgba(255,255,255,0.04);
}
```
 
### App Icon Button (compact, square)
```css
.btn-icon {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: none;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.15s;
}
.btn-icon:hover {
  border-color: var(--border-hover);
  color: var(--white);
  background: rgba(255,255,255,0.04);
}
.btn-icon.active {
  border-color: var(--border-green);
  color: var(--green);
  background: rgba(0,255,135,0.06);
}
```
 
### Danger Button
```css
.btn-danger {
  background: rgba(255,77,109,0.1);
  border: 1px solid rgba(255,77,109,0.25);
  color: #FF4D6D;
  border-radius: var(--radius-md);
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 0.88rem;
  padding: 0.6rem 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-danger:hover {
  background: rgba(255,77,109,0.18);
  border-color: rgba(255,77,109,0.4);
}
```
 
**Button rules:**
- All buttons use Inter, never DM Sans or Bebas.
- Green buttons always have a green glow shadow.
- Hover = translateY(-2px to -3px) + intensified shadow. Never scale.
- Icon buttons never use translateY — just color/border shift.
---
 
## 7. Tags & Badges
 
### Section Label (Marketing)
```css
.section-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--green);
  margin-bottom: 1rem;
}
.section-label::before {
  content: '';
  display: block;
  width: 20px;
  height: 2px;
  background: var(--green);
}
```
 
### Event Type Tag (App — used in tag panel and event list)
```css
.event-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.28rem 0.65rem;
  border-radius: var(--radius-sm);
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s;
}
/* Home team events */
.event-tag.home {
  background: rgba(0,255,135,0.08);
  border: 1px solid rgba(0,255,135,0.2);
  color: var(--green);
}
/* Away team events */
.event-tag.away {
  background: rgba(255,77,109,0.08);
  border: 1px solid rgba(255,77,109,0.2);
  color: #FF4D6D;
}
/* Neutral events */
.event-tag.neutral {
  background: rgba(96,165,250,0.08);
  border: 1px solid rgba(96,165,250,0.2);
  color: #60A5FA;
}
.event-tag:hover { filter: brightness(1.2); }
.event-tag.active { filter: brightness(1.3); box-shadow: 0 0 10px currentColor; opacity: 0.4; }
```
 
### Pill Badge (Marketing)
```css
.pill-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(0,255,135,0.08);
  border: 1px solid rgba(0,255,135,0.2);
  border-radius: var(--radius-pill);
  padding: 0.4rem 1.1rem;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--green);
}
```
 
### Status Badge (App)
```css
.status-badge {
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-pill);
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.status-badge.processing { background: rgba(230,168,23,0.12); color: var(--warning); border: 1px solid rgba(230,168,23,0.25); }
.status-badge.ready      { background: rgba(0,255,135,0.08);  color: var(--green);   border: 1px solid rgba(0,255,135,0.2); }
.status-badge.failed     { background: rgba(255,77,109,0.08); color: var(--error);   border: 1px solid rgba(255,77,109,0.2); }
```
 
### Keyboard Shortcut Badge
```css
.kbd {
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.4rem;
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--border);
  border-radius: 4px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.68rem;
  color: var(--muted);
  letter-spacing: 0.02em;
}
```
 
### Pulsing Dot (live indicator)
```css
.pulse-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 8px rgba(0,255,135,0.7);
  animation: dot-pulse 2.2s ease-in-out infinite;
}
@keyframes dot-pulse {
  0%,100% { opacity: 1; transform: scale(1); }
  50%     { opacity: 0.7; transform: scale(1.35); }
}
```
 
---
 
## 8. App Core Components
 
### Sidebar Navigation
```css
.app-sidebar {
  width: 220px;
  min-height: 100vh;
  background: var(--dark3);
  border-right: 1px solid var(--border);
  position: fixed;
  top: 48px; left: 0; bottom: 0;
  display: flex;
  flex-direction: column;
  padding: 1rem 0;
  z-index: 90;
  transition: width 0.2s ease;
}
.app-sidebar.collapsed { width: 48px; }
 
.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 1rem;
  color: var(--muted);
  font-family: 'Inter', sans-serif;
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: none;
  border-left: 2px solid transparent;
  transition: all 0.15s;
  white-space: nowrap;
  overflow: hidden;
}
.nav-item:hover {
  color: var(--white);
  background: rgba(255,255,255,0.03);
}
.nav-item.active {
  color: var(--green);
  border-left-color: var(--green);
  background: rgba(0,255,135,0.04);
}
.nav-section-label {
  padding: 0.5rem 1rem 0.25rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted2);
}
```
 
### Video Player Container
```css
.video-container {
  position: relative;
  background: #000;
  border-radius: var(--radius-md);
  overflow: hidden;
  aspect-ratio: 16/9;
}
.video-container video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
/* Overlay for drawing tools / tracking display */
.video-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.video-overlay.drawing-active {
  pointer-events: all;
  cursor: crosshair;
}
/* Video controls bar */
.video-controls {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.85));
  padding: 2rem 1rem 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  opacity: 0;
  transition: opacity 0.2s;
}
.video-container:hover .video-controls { opacity: 1; }
```
 
### Timeline / Scrubber
```css
.timeline {
  background: var(--panel-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
}
/* Main scrubber track */
.scrubber-track {
  position: relative;
  height: 6px;
  background: rgba(255,255,255,0.08);
  border-radius: 3px;
  cursor: pointer;
  margin: 0.5rem 0;
}
.scrubber-progress {
  height: 100%;
  background: var(--green);
  border-radius: 3px;
  position: relative;
}
.scrubber-thumb {
  position: absolute;
  right: -7px; top: 50%;
  transform: translateY(-50%);
  width: 14px; height: 14px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 8px var(--green-glow);
}
/* Event markers on the timeline */
.timeline-marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 10px; height: 10px;
  border-radius: 50%;
  cursor: pointer;
  z-index: 2;
  transition: transform 0.15s;
}
.timeline-marker:hover { transform: translate(-50%, -50%) scale(1.4); }
.timeline-marker.home    { background: var(--team-home); box-shadow: 0 0 6px var(--team-home); }
.timeline-marker.away    { background: var(--team-away); box-shadow: 0 0 6px var(--team-away); }
.timeline-marker.neutral { background: var(--neutral);   box-shadow: 0 0 6px var(--neutral); }
 
/* Event type row labels */
.timeline-row-label {
  font-family: 'Inter', sans-serif;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
  width: 80px;
  flex-shrink: 0;
}
/* Time axis labels */
.time-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.72rem;
  color: var(--muted2);
}
```
 
### Tag Panel (Event Tagging Sidebar)
```css
.tag-panel {
  background: var(--panel-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.tag-panel__header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border);
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--muted);
}
/* Tag button grid — 2 columns */
.tag-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  padding: 0.75rem;
}
.tag-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
  padding: 0.6rem 0.75rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: rgba(255,255,255,0.025);
  cursor: pointer;
  transition: all 0.15s;
  position: relative;
}
.tag-btn:hover {
  border-color: var(--border-green);
  background: rgba(0,255,135,0.05);
}
.tag-btn:active {
  transform: scale(0.96);
  border-color: var(--green);
  background: rgba(0,255,135,0.1);
}
.tag-btn__label {
  font-family: 'Inter', sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--white);
}
/* Keyboard shortcut on tag button */
.tag-btn .kbd {
  position: absolute;
  top: 0.3rem; right: 0.3rem;
}
```
 
### Event List / Table
```css
.event-list {
  width: 100%;
  border-collapse: collapse;
}
.event-list th {
  font-family: 'Inter', sans-serif;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted2);
  padding: 0.5rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}
.event-list td {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.85rem;
  color: var(--light2);
  padding: 0.55rem 0.75rem;
  border-bottom: 1px solid rgba(255,255,255,0.03);
}
.event-list tr {
  cursor: pointer;
  transition: background 0.1s;
}
.event-list tr:hover td { background: rgba(255,255,255,0.025); }
.event-list tr.active  td { background: rgba(0,255,135,0.04); }
/* Timestamp cell */
.event-list .col-time {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.78rem;
  color: var(--green);
  font-variant-numeric: tabular-nums;
  width: 60px;
}
```
 
### Filter Chips
```css
.filter-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding: 0.5rem 0;
}
.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.75rem;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border);
  background: none;
  font-family: 'Inter', sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.filter-chip:hover {
  border-color: var(--border-hover);
  color: var(--white);
}
.filter-chip.active {
  border-color: var(--border-green);
  background: rgba(0,255,135,0.08);
  color: var(--green);
}
.filter-chip .chip-count {
  background: rgba(255,255,255,0.1);
  border-radius: 100px;
  padding: 0 0.35rem;
  font-size: 0.65rem;
}
```
 
### Stat Card (Analytics Panel)
```css
.stat-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.5rem;
}
.stat-card__value {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 2.8rem;
  line-height: 1;
  color: var(--white);
}
.stat-card__value.positive { color: var(--green); }
.stat-card__value.negative { color: var(--error); }
.stat-card__label {
  font-family: 'Inter', sans-serif;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--muted);
  margin-top: 0.25rem;
}
.stat-card__delta {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.78rem;
  color: var(--muted);
  margin-top: 0.5rem;
}
.stat-card__delta.up   { color: var(--green); }
.stat-card__delta.down { color: var(--error); }
```
 
### Heatmap Overlay (Pitch / Court)
```css
/* Applied as canvas or SVG overlay on a pitch diagram */
.heatmap-container {
  position: relative;
  /* Pitch image as background */
  background: #1a2a1a;
  border-radius: var(--radius-md);
  overflow: hidden;
}
/* Team toggle above heatmap */
.heatmap-team-toggle {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
/* Heatmap legend */
.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
.heatmap-legend__bar {
  height: 6px;
  flex: 1;
  border-radius: 3px;
  background: linear-gradient(
    to right,
    var(--heat-0),
    var(--heat-1),
    var(--heat-2),
    var(--heat-3),
    var(--heat-4)
  );
}
.heatmap-legend__label {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.68rem;
  color: var(--muted);
}
```
 
### Modal / Drawer
```css
/* Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(4px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}
/* Center Modal */
.modal {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 2rem;
  width: min(560px, 90vw);
  max-height: 85vh;
  overflow-y: auto;
  animation: slideUp 0.25s cubic-bezier(.16,1,.3,1);
}
.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}
.modal__title {
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: var(--white);
}
/* Right Drawer */
.drawer {
  position: fixed;
  top: 48px; right: 0; bottom: 0;
  width: min(400px, 90vw);
  background: var(--panel-bg);
  border-left: 1px solid var(--border);
  z-index: 150;
  animation: slideInRight 0.25s cubic-bezier(.16,1,.3,1);
  overflow-y: auto;
}
@keyframes slideUp      { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideInRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
@keyframes fadeIn       { from { opacity: 0; } to { opacity: 1; } }
```
 
### Tooltip
```css
.tooltip {
  position: absolute;
  z-index: 300;
  background: #222;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.4rem 0.65rem;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.78rem;
  color: var(--light2);
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  animation: fadeIn 0.1s ease;
}
/* Arrow */
.tooltip::after {
  content: '';
  position: absolute;
  bottom: -5px; left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: #222;
  border-bottom: none;
}
```
 
---
 
## 9. State Patterns
 
### Loading Skeleton
```css
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0.03) 25%,
    rgba(255,255,255,0.07) 50%,
    rgba(255,255,255,0.03) 75%
  );
  background-size: 200% 100%;
  border-radius: var(--radius-sm);
  animation: shimmer 1.6s infinite;
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```
 
### Empty State
```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  gap: 0.75rem;
}
.empty-state__icon  { color: var(--muted2); margin-bottom: 0.5rem; }
.empty-state__title { font-family: 'Inter', sans-serif; font-size: 0.9rem; font-weight: 700; color: var(--muted); }
.empty-state__desc  { font-family: 'DM Sans', sans-serif; font-size: 0.82rem; color: var(--muted2); max-width: 260px; line-height: 1.6; }
```
 
### Upload Drop Zone
```css
.dropzone {
  border: 2px dashed var(--border);
  border-radius: var(--radius-lg);
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(255,255,255,0.01);
}
.dropzone:hover,
.dropzone.drag-over {
  border-color: var(--green);
  background: rgba(0,255,135,0.03);
  box-shadow: 0 0 30px rgba(0,255,135,0.04);
}
.dropzone__label {
  font-family: 'Inter', sans-serif;
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--muted);
}
.dropzone__sublabel {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.78rem;
  color: var(--muted2);
  margin-top: 0.35rem;
}
```
 
### Processing / Progress Bar
```css
.progress-bar {
  height: 4px;
  background: rgba(255,255,255,0.06);
  border-radius: 2px;
  overflow: hidden;
}
.progress-bar__fill {
  height: 100%;
  background: var(--green);
  border-radius: 2px;
  transition: width 0.4s ease;
  box-shadow: 0 0 8px rgba(0,255,135,0.4);
}
.progress-bar__fill.indeterminate {
  width: 40%;
  animation: indeterminate 1.4s infinite ease-in-out;
}
@keyframes indeterminate {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(350%); }
}
```
 
---
 
## 10. Forms
 
```css
.form-input {
  width: 100%;
  padding: 0.8rem 1rem;
  background: var(--input-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--white);
  font-family: 'DM Sans', sans-serif;
  font-size: 0.92rem;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.form-input::placeholder { color: var(--muted2); }
.form-input:focus {
  border-color: var(--green);
  box-shadow: 0 0 0 3px rgba(0,255,135,0.08);
}
```
 
**Form label:** Inter 600, 0.78rem, uppercase, letter-spacing 0.06em, color `var(--muted)`. On focus, shift to `var(--green)`.
 
---
 
## 11. Keyboard Accessibility
 
Focus ring — applies on all interactive elements for keyboard navigation:
```css
*:focus-visible {
  outline: 2px solid var(--green);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```
 
### Core Analyst Keyboard Shortcuts (document and implement consistently)
| Key | Action |
|---|---|
| `Space` | Play / Pause video |
| `←` / `→` | Step back / forward 5 seconds |
| `Shift + ←/→` | Step back / forward 1 second |
| `[` / `]` | Previous / next tagged event |
| `1`–`9` | Quick-tag event types (customizable per sport) |
| `T` | Add tag at current timestamp |
| `D` | Toggle drawing mode |
| `Esc` | Close modal / cancel action |
| `Ctrl/Cmd + Z` | Undo last tag |
| `F` | Toggle fullscreen |
 
---
 
## 12. Motion & Animation
 
### Marketing (Scroll / Entrance)
```css
.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}
.reveal.visible { opacity: 1; transform: translateY(0); }
 
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}
```
 
### App Micro-interactions
```css
/* Tag snap — fast confirmation feedback */
@keyframes tagSnap {
  0%   { transform: scale(1); }
  40%  { transform: scale(0.92); }
  100% { transform: scale(1); }
}
.tag-btn:active { animation: tagSnap 0.15s ease; }
 
/* Timeline marker appear */
@keyframes markerPop {
  0%   { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  70%  { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1); }
}
.timeline-marker.new { animation: markerPop 0.25s cubic-bezier(.16,1,.3,1); }
```
 
**App Motion Rules:**
- Card hovers: translateY only, never scale.
- Tag buttons: scale down on `:active` (0.94–0.96), never up.
- Modals / drawers: slide in from direction of origin (bottom for modal, right for drawer).
- Loading states: shimmer skeleton before content arrives, never a full spinner blocking content.
- Timeline markers: `markerPop` on creation for physical feedback.
- Duration: micro-interactions 100–200ms; panels/modals 200–300ms; marketing reveals 600–800ms.
- Easing: `cubic-bezier(.16,1,.3,1)` for entrances, `ease` for reveals, `ease-in` for exits.
---
 
## 13. Pricing Cards (Marketing)
 
### Standard Plan Card
Same as base card surface with `border-radius: var(--radius-lg)`, `text-align: left`, flex column layout.
 
### Featured / Recommended Card
```css
.pricing-card.featured {
  border-color: var(--green);
  background: linear-gradient(160deg, rgba(0,255,135,0.05), var(--card-bg));
  box-shadow: 0 0 50px rgba(0,255,135,0.1);
  position: relative;
}
```
 
### Feature List
- Check icon: `✓` in `var(--green)` for included
- Cross icon: `✗` in `rgba(255,100,100,0.7)` for excluded
- Text: `#CBD5E1` for included, `var(--muted)` for disabled
---
 
## 14. Sticky Bottom CTA (Marketing)
```css
.sticky-cta {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 150;
  background: rgba(13,13,13,0.92);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(0,255,135,0.15);
  transform: translateY(100%);
  opacity: 0;
  transition: transform 0.4s cubic-bezier(.16,1,.3,1), opacity 0.4s ease;
}
.sticky-cta--visible { transform: translateY(0); opacity: 1; }
```
 
---
 
## 15. Footer
Minimal footer: `background: #0e0e0e`, `border-top: 1px solid var(--border)`.
Copyright text: DM Sans 0.8rem, muted. Social icons: 36×36px rounded-square buttons, subtle border.
 
---
 
## 16. Icon Style
- **Source:** Custom inline SVGs (no icon library dependency)
- **Style:** Outline/stroke only, never filled
- **Stroke width:** 1.5–2px
- **Size:** 24–28px (cards), 16–18px (app nav), 13–15px (inline/tags), 18–20px (footer)
- **Color:** `currentColor` — transitions to `var(--green)` on active states
- **viewBox:** Always `0 0 24 24`
---
 
## 17. Visual DNA Summary
 
| Trait | Decision |
|---|---|
| Background | Deep charcoal (#131313/#151515/#0e0e0e) with noise overlay |
| Accent | Neon green #00FF87 — CTAs, active states, home-team data |
| Opponent color | #FF4D6D — away team, errors, negative deltas |
| Neutral color | #60A5FA — ball events, info, neutral data |
| Heatmap | Green→amber→red gradient scale (4 stops) |
| Typography | 3-font: Bebas Neue (display/stats) + Inter (UI) + DM Sans (body) |
| Surfaces | Dark cards (#181818), panels (#161616), app shell (#0e0e0e) |
| Borders | `rgba(255,255,255,0.07)` default, green-tinted on hover/active |
| Shadows | Green-tinted glows for active/hover, deep black for depth |
| Radius | 6px (inputs/icon btns), 8px (buttons), 16px (cards), 20px (modals), 100px (pills) |
| Motion (app) | Scale-down on tap, markerPop on tag creation, slide-in for panels |
| Motion (marketing) | translateY hover, scroll reveal, staggered hero entrance |
| Texture | Full-screen SVG noise at 40% opacity, always present |
| Max-width | 1100px (marketing), full-width (app) |
| App layout | Fixed sidebar 220px + 48px top bar + scrollable main |
| Keyboard | Full keyboard-shortcut system for analyst workflow |