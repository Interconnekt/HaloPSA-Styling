# Portal Chrome Modernisation

This doc covers the Self-Service Portal **chrome** (home page widgets, tickets list, ticket view, kanban, email iframe) — distinct from the KB article styling covered by the root README and `dark-mode-test-checklist.md`.

---

## What's in this directory

| File | Purpose |
|------|---------|
| `self-service-portal.css` | Main stylesheet — portal chrome + KB article overrides. Loaded via `@import` in HaloPSA's Custom CSS field. |
| `iframe-theme.js` | JS shim that themes email-body iframes (`iframe.halo-html-renderer`) from inside the same-origin document. Loaded via `<script src="...">` in HaloPSA admin. |
| `dark-mode-test-checklist.md` | Original KB-focused test checklist (both portals, both modes, responsive, print). |
| `portal-chrome.md` | This file — portal chrome reference, iframe shim notes, light-mode checklist. |

---

## How HaloPSA CSS Injection Works

Two injection points:

1. **Custom CSS (Self-Service Portal only)** — Configuration > Self Service Portal > Custom CSS. Contains a single `@import` pointing at this repo's GitHub Pages URL:
   ```css
   @import url('https://interconnekt.github.io/HaloPSA-Styling/Portal/self-service-portal.css');
   ```
2. **Style Profiles (both portals)** — rules auto-wrapped as `.kbdetails selector { ... }`. Used for KB article content, not portal chrome.

GitHub Pages serves the org-owned repo at `interconnekt.github.io` (not a committer's personal namespace). Propagation is ~1–10 min after push.

---

## Portal Chrome Design Tokens

CSS variables live at the top of `self-service-portal.css`:

- `--portal-action: #5084ee` — primary blue (buttons, links, focus ring)
- `--portal-action-hover` — darker blue on hover
- `--portal-action-shadow` — 4px drop shadow under action buttons
- `--portal-surface` — card/button base surface
- `--portal-border` — 1px hairline border (rgba alpha, adapts to theme)
- `--portal-text`, `--portal-text-muted`, `--portal-heading`
- `--portal-table-header-bg`
- `--portal-radius` — card/button corner radius

`.theme-dark` overrides these for dark mode. `html body .portal` is the standard specificity prefix to beat later-loaded HaloPSA rules.

---

## Key Chrome Rules (what to grep for)

### Home page — ticket cards
- `.tile-widget-bar` — 6px leading stripe with `14px 0 0 14px` radius. Width matters: 6px is "Option A" — fatter than HaloPSA's default so status colour reads clearly without a pseudo-element offset trick.
- `.sla-perc-bar` — pill-rounded 999px countdown bar, 18px tall, `overflow: hidden` clips the fill to the pill shape.
- `.sla-perc-bar > div[style*="rgb(...)"]` — per-state retint. We preserve HaloPSA's green/amber/red state *semantics* via attribute selectors rather than flattening to one colour:
  - `rgb(255, 46, 0)` (red) → `#d05a52`
  - `rgb(255, 191, 0)` (amber) → `#e0a84a`
  - `rgb(0, 190, 0)` and green variants → `#4fa37a`

### Tickets list
- `.page-counts` — "1-15 of 23" counter, 13px/500 muted
- `.buttons-container .solidbutton` — 32px circular pagination buttons with surface tokens + hover lift
- `.status-avatar.bitsmall` — Asset pill, 999px radius to match ticket pills

### Ticket view
- `.profile-extra` — subtitle ("Test ticket" under "IC:0176791"). Bumped to 18px/500.
- `.nhd-button.curve` — action buttons at 13px/500, `padding: 8px 18px` (HaloPSA default 16px/400 was too big).
- Email body iframe — themed by `iframe-theme.js`, not CSS.

### Kanban
- Uses HaloPSA's actual DOM: `.board-card-content`, `.board-card-bar`, `.board-column-title`, `.board-card-summary`, `.board-card-details` (not the `.react-kanban-column .card` classes from older docs — those don't match).

---

## Email Iframe Theming (`iframe-theme.js`)

### Why JS, not CSS

HaloPSA renders email bodies inside `<iframe class="halo-html-renderer">`, a **same-origin** iframe with its own `<style>` tag setting Segoe UI. Stylesheets from the host document do not cross the iframe boundary. Same-origin means JS *can* reach `iframe.contentDocument.head` and inject a `<style>` tag.

### What the script does

1. Sweeps existing iframes on `DOMContentLoaded`
2. Re-injects on every iframe `load` event (ticket navigation re-uses the same `<iframe>` element but replaces its document — a fresh document needs a fresh style tag)
3. `MutationObserver` catches dynamically added iframes (action-history expand, pagination, ticket switch)
4. A `data-portal-font-injected` marker attribute prevents double-injection

### What the injected CSS sets

- Font: `'Montserrat', 'Poppins', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif !important`
- Link colour: `#3598db` (matches `Interconnekt/Email-Templates` `_base/base-template.html`)
- Hover: underline on hover only

The blue `#3598db` is chosen to work on both white email bodies (light-mode readability) and the dark portal surface, so we don't have to detect host theme.

### How to load it

In HaloPSA admin, add:
```html
<script src="https://interconnekt.github.io/HaloPSA-Styling/Portal/iframe-theme.js"></script>
```

### What it doesn't touch

Body text colour — HaloPSA re-paints the iframe content when theme switches. Our script stays out of that to avoid fighting HaloPSA.

---

## Common Gotchas

- **Stale CDN**: GitHub Pages caches. Hard-refresh (`Cmd+Shift+R`) or bump a cachebuster query param if you don't see changes.
- **Org namespace**: repo is under `Interconnekt/`, so Pages URL is `interconnekt.github.io/HaloPSA-Styling/...` — not `joelkino.github.io/...`.
- **Inline styles win**: HaloPSA paints SLA state colours via inline `style="background-color: rgb(...)"`. You *must* use `[style*="rgb(...)"]` attribute selectors with `!important` to override.
- **Font-family inheritance**: HaloPSA's Style Profile body root is now Montserrat. Most per-element `font-family` declarations are redundant — removed in commit `811c15f`. Only keep overrides for elements HaloPSA paints in a non-Montserrat font (react-kanban, react-table, a specific Poppins heading).

---

## Pending / Not Yet Audited

- **Assets page** — not yet styled beyond whatever the tickets-list rules cascade to
- **Catalogue page** — pending
- **Profile page** — pending
- **Light mode full sweep** — see [light-mode-checklist.md](./light-mode-checklist.md)

---

## Related

- Root `README.md` — KB article styling, Style Profile setup, panel colour mapping
- `dark-mode-test-checklist.md` — KB content dark-mode coverage
- `Interconnekt/Email-Templates` — the blue `#3598db` source of truth for link colour
