# Portal Chrome Modernisation

This doc covers the Self-Service Portal **chrome** (home page widgets, tickets list, ticket view, kanban, email iframe); distinct from the KB article styling covered by the root README and `dark-mode-test-checklist.md`.

---

## What's in this directory

| File | Purpose |
|------|---------|
| `self-service-portal.css` | Main stylesheet, portal chrome + KB article overrides. Loaded via `@import` in HaloPSA's Custom CSS field. |
| `iframe-theme.js` | JS shim that themes email-body iframes (`iframe.halo-html-renderer`) from inside the same-origin document. Loaded via `<script src="...">` in HaloPSA admin. |
| `dark-mode-test-checklist.md` | Original KB-focused test checklist (both portals, both modes, responsive, print). |
| `portal-chrome.md` | This file, portal chrome reference, iframe shim notes, light-mode checklist. |

---

## How HaloPSA CSS Injection Works

Two injection points:

1. **Custom CSS (Self-Service Portal only)**, Configuration > Self Service Portal > Custom CSS. Contains a single `@import` pointing at this repo's GitHub Pages URL:
   ```css
   @import url('https://interconnekt.github.io/HaloPSA-Styling/Portal/self-service-portal.css');
   ```
2. **Style Profiles (both portals)**, rules auto-wrapped as `.kbdetails selector { ... }`. Used for KB article content, not portal chrome.

GitHub Pages serves the org-owned repo at `interconnekt.github.io` (not a committer's personal namespace). Propagation is ~1-10 min after push.

---

## Portal Chrome Design Tokens

CSS variables live at the top of `self-service-portal-design.css` (the
live file; see AGENTS.md. `self-service-portal.css` is the legacy
fallback and does not contain the active token set).

2026 design-system lock: full reference in `website-portal-mapping.md`
§1 and §2; summary here:

- `--portal-action: #3355D8`: primary blue, Insight role (buttons, links, focus ring)
- `--portal-action-hover: #2C4AC0`: darker blue on hover
- `--portal-action-shadow`: drop shadow under action buttons, `rgba()` of the accent
- `--portal-violet: #6F43D6`: third brand triad member, Advisory/AI/People role (new token)
- `--portal-highlight: #0284C7`: jade/teal, Security BRAND role only (delight moments, live dots, gradient first stop). NOT the success semantic; `--portal-ok` is an independent true green (`#15803D` light / `#34D399` dark), unchanged by the 2026 re-palette
- `--portal-accent-2: #C026D3`: pink, reserved for the get-in-touch CTA + highlighter accent ONLY, not a general second brand colour
- `--portal-on-accent: #FFFFFF` (light) / `#161922` (dark): text colour for use on top of a solid brand-colour fill; flips to dark ink in dark mode because the brightened dark-mode brand hues don't carry white text at readable contrast (new token)
- `--portal-surface`: card/button base surface (`#FFFFFF` light / `#161A25` dark)
- `--portal-border`: 1px hairline border (`#E2E5EE` light / `rgba(255,255,255,.072)` dark, adapts to theme)
- `--portal-text`, `--portal-text-muted`, `--portal-heading`: ink `#161922` / faint `#8E93A4` (light); `#ECEEF4` / `rgba(236,238,244,.4)` (dark)
- `--portal-table-header-bg`
- `--portal-radius`: card/button corner radius. Deliberately stays at the pre-existing tighter portal scale (16/12/10/8px) rather than adopting the website's 2026 20/26/34px radius bump; see `website-portal-mapping.md` §4

`.theme-dark` overrides these for dark mode. `html body .portal` is the standard specificity prefix to beat later-loaded HaloPSA rules.

---

## Key Chrome Rules (what to grep for)

### Home page, ticket cards
- `.tile-widget-bar`, 6px leading stripe with `14px 0 0 14px` radius. Width matters: 6px is "Option A", fatter than HaloPSA's default so status colour reads clearly without a pseudo-element offset trick.
- `.sla-perc-bar`, pill-rounded 999px countdown bar, 18px tall, `overflow: hidden` clips the fill to the pill shape.
- `.sla-perc-bar > div[style*="rgb(...)"]`: per-state retint via a two-stop `linear-gradient(90deg, …)`. We preserve HaloPSA's green/amber/red state *semantics* via attribute selectors rather than flattening to one colour. 2026 lock: red/amber move to the new semantic tokens; green stays true green (`--portal-ok`); jade/teal is brand-only and is NOT used here:
  - `rgb(255, 46, 0)` (red) → `linear-gradient(90deg, #B91C1C, #F87171)`
  - `rgb(255, 191, 0)` (amber) → `linear-gradient(90deg, #C2410C, #FB923C)`
  - `rgb(0, 190, 0)` and green variants → `linear-gradient(90deg, #15803D, #34D399)` (unchanged hue family, updated shade)

### Tickets list
- `.page-counts`, "1-15 of 23" counter, 13px/500 muted
- `.buttons-container .solidbutton`, 32px circular pagination buttons with surface tokens + hover lift
- `.status-avatar.bitsmall`, Asset pill, 999px radius to match ticket pills

### Ticket view
- `.profile-extra`, subtitle ("Test ticket" under "IC:0176791"). Bumped to 18px/500.
- `.nhd-button.curve`, action buttons at 13px/500, `padding: 8px 18px` (HaloPSA default 16px/400 was too big).
- Email body iframe, themed by `iframe-theme.js`, not CSS.

### Kanban
- Uses HaloPSA's actual DOM: `.board-card-content`, `.board-card-bar`, `.board-column-title`, `.board-card-summary`, `.board-card-details` (not the `.react-kanban-column .card` classes from older docs, those don't match).

---

## Email Iframe Theming (`iframe-theme.js`)

### Why JS, not CSS

HaloPSA renders email bodies inside `<iframe class="halo-html-renderer">`, a **same-origin** iframe with its own `<style>` tag setting Segoe UI. Stylesheets from the host document do not cross the iframe boundary. Same-origin means JS *can* reach `iframe.contentDocument.head` and inject a `<style>` tag.

### What the script does

1. Sweeps existing iframes on `DOMContentLoaded`
2. Re-injects on every iframe `load` event (ticket navigation re-uses the same `<iframe>` element but replaces its document, a fresh document needs a fresh style tag)
3. `MutationObserver` catches dynamically added iframes (action-history expand, pagination, ticket switch)
4. A `data-portal-font-injected` marker attribute prevents double-injection

### What the injected CSS sets

- Font: `'Figtree', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important` (2026 lock body font; was Montserrat/Poppins)
- Link colour: `#3355D8` (2026 measured role blue: Insight role, links/primary buttons/focus. Was the legacy operational blue `#3598db`, then briefly the pre-measurement `#3761E2`. `Interconnekt/Email-Templates` has since migrated to the same `#3355D8`, so the iframe shim and the email templates now agree again)
- Hover: underline on hover only

`#3355D8` reads at 6.12:1 against white (the retired `#3761E2` was 5.29:1, so this is a contrast improvement as well as a brand fix); email bodies stay white regardless of portal theme, so a single literal value works for both light and dark portal surfaces without detecting host theme.

### How to load it

In HaloPSA admin, add:
```html
<script src="https://interconnekt.github.io/HaloPSA-Styling/Portal/iframe-theme.js"></script>
```

### What it doesn't touch

Body text colour, HaloPSA re-paints the iframe content when theme switches. Our script stays out of that to avoid fighting HaloPSA.

---

## Common Gotchas

- **Stale CDN**: GitHub Pages caches. Hard-refresh (`Cmd+Shift+R`) or bump a cachebuster query param if you don't see changes.
- **Org namespace**: repo is under `Interconnekt/`, so Pages URL is `interconnekt.github.io/HaloPSA-Styling/...`, not `joelkino.github.io/...`.
- **Inline styles win**: HaloPSA paints SLA state colours via inline `style="background-color: rgb(...)"`. You *must* use `[style*="rgb(...)"]` attribute selectors with `!important` to override.
- **Font-family inheritance**: HaloPSA's Style Profile body root is now Figtree (2026 lock; was Montserrat). Most per-element `font-family` declarations are redundant, removed in commit `811c15f`. Only keep overrides for elements HaloPSA paints in a non-Figtree font (react-kanban, react-table, a specific Poppins heading).

---

## Navbar selected state, why we don't have one

HaloPSA renders every top-nav button with `class="nhd-nav-btn undefined"`, including the current page's one. The literal string `"undefined"` is a React bug (looks like `${isActive ? 'active' : undefined}` with no fallback). There is no `.active` class, no `aria-current`, no per-button inline-style differentiation. Every button is identical to HaloPSA.

**Why a JS shim doesn't fix it.** The obvious workaround is a small script (like `iframe-theme.js`) that reads `location.pathname`, finds the matching button by text, and adds `.active`. It doesn't stick: HaloPSA pins `className` to derived React state, so the next reconciliation (any state change, route update, menu toggle) strips the class back off before the paint settles. We verified live, `classList.add('active')` + `getComputedStyle` returns HaloPSA's inline navy, not our branded blue, because React has already wiped the class by the time the style system samples it. A `MutationObserver` that re-adds the class after every render would work in principle but fights HaloPSA on every keystroke, and any scroll/resize/menu toggle would flash.

**What we ship instead.** Hover darkening only, a 28% black overlay on the resting navy via `background-image: linear-gradient(...)`. It gives clear hover affordance without a new colour. The selected-state half of the original restyle was removed; see the comment block above `button.nhd-nav-btn` hover rules in `self-service-portal.css`.

---

## Pending / Not Yet Audited

- **Assets page**, not yet styled beyond whatever the tickets-list rules cascade to
- **Catalogue page**, pending
- **Profile page**, pending
- **Light mode full sweep**, see [light-mode-checklist.md](./light-mode-checklist.md)

---

## Related

- Root `README.md`: KB article styling, Style Profile setup, panel colour mapping
- `dark-mode-test-checklist.md`: KB content dark-mode coverage
- `website-portal-mapping.md`: full 2026 token reference (source of truth for the current `#3355D8` link colour)
- `Interconnekt/Email-Templates`: migrated to the 2026 palette (`#3355D8` / `#7E9CFF`); see the Email Iframe Theming section above
