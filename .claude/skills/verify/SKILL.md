---
name: verify
description: Drive the iSmart Club prototype in a real browser to verify a change end to end. Use when confirming a screen, flow, or store mutation actually works at runtime.
---

# Verifying the iSmart Club prototype

This is a Vite + React SPA with an **in-memory store**. There is no backend, so
verification is always: launch the dev server, drive the UI in a browser, screenshot.

## Launch

```bash
npm run dev          # vite; picks 5174+ if 5173 is taken — read the port from stdout
```

## Drive it

`playwright-core` is available transitively (via a dependency), but **ships no
browsers**. There is no `msedge` on this machine. Use the system Chrome:

```js
import { chromium } from "playwright-core"
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
})
```

The driver script **must live in the project root** (e.g. `drive.tmp.mjs`) so Node
resolves `playwright-core` from the project's `node_modules`. A script in the
scratchpad fails with `ERR_MODULE_NOT_FOUND`. Delete it when done.

## The one gotcha that will bite you

**`page.goto()` wipes the store.** State is in-memory and resets on refresh
(by design — see CLAUDE.md). Navigate *once* at the start, then drive entirely
through in-app clicks. A mid-script `goto` back to a list screen lands you on the
module's empty state, and locators for rows/buttons will time out — that looks
like a product bug but is a bug in your script.

## Seeding data fast

Most modules open on an empty state. Shortcuts to a populated screen:

- **Sponsoring**: `/sponsoring` → "Rejoindre le programme sponsors" →
  "Utiliser les offres suggérées (Or, Argent, Bronze)" → lands on `/sponsoring/offres`
  with 3 offers (22 seats total). Then "Ajouter un partenaire" on any offer card.

## Useful selectors

Screens follow shared kit patterns, so these work broadly:

- Toasts: `page.getByRole("status")` — auto-dismiss after 2.6s, assert quickly.
- Row/card overflow menus: `page.getByRole("button", { name: "Actions" })`.
- Modals: `page.getByRole("dialog")`; ConfirmDialog is also `role=dialog`.
- Account/option pickers: rows are `role=radio`.

## Checks worth running

Beyond the happy path, this codebase's store makes these cheap and revealing:
derived counts updating across screens, cascade deletes (removing a parent should
clear its children), and at-capacity/disabled states.
