# Website ⇄ Portal Theme Mapping

Single source of truth for how the Interconnekt **website** (`Interconnekt/Website`) and **HaloPSA portal** (`Portal/self-service-portal-design.css`) share design language.

Use this when you change a token or component on the website and need to propagate it into the portal, or vice versa.

---

## File references

| System | File | Token scope |
|---|---|---|
| Website | `src/app/globals.css` (`:root`, `[data-theme="dark"]`) | `--bg`, `--fg`, `--primary`, etc. |
| Website | `tailwind.config.ts` | Semantic names that map `bg-*`, `text-*`, `border-*` classes to CSS vars |
| Portal | `Portal/self-service-portal-design.css` (`:root`, `.theme-dark`) | `--portal-*` + `--ik-*` tokens |
| Portal | `Portal/self-service-portal.css` (legacy fallback) | Same token names; mirror of design CSS for safety |

**Live portal loads:** `self-service-portal-design.css` via HaloPSA Custom CSS `@import` (GitHub Pages-hosted). Any change pushed to main is live within ~10 minutes.

---

## 1 · Typography

| Website var | Portal var | Value | Used for |
|---|---|---|---|
| `--font-display` | `--ik-font-display` | `'Montserrat', system-ui, -apple-system, 'Segoe UI', sans-serif` | Body, nav, headings, labels, buttons, tags |
| `--font-serif` | `--ik-font-serif` | `'Instrument Serif', Georgia, 'Times New Roman', serif` | `<em>` inside headings (italic emphasis), blockquotes |
| `--font-mono` | `--ik-font-mono` | `'JetBrains Mono', ui-monospace, Consolas, Menlo, monospace` | Eyebrows (`.page-subtitle`), page counters, KB tags, pagination input |

**Rule of thumb:** if the website uses `font-display` → portal uses `var(--ik-font-display)`. Tailwind class `font-mono` on website maps to `var(--ik-font-mono)` in portal.

---

## 2 · Colour tokens

### Light mode

| Website `:root` | Portal `:root` | Value | Used for |
|---|---|---|---|
| `--bg` | `--portal-bg` | `#F8F9FA` | Page background |
| `--bg-subtle` | `--portal-bg-subtle` | `#F1F3F5` | Form inputs fill, muted regions |
| `--surface` | `--portal-surface` | `#FFFFFF` | Cards, form wrappers, popovers |
| `--surface-2` | `--portal-surface-active` | `#E9ECEF` | Hover/active card tint, kb tag bg |
| — | `--portal-surface-hover` | `#F1F3F5` | Card hover (== bg-subtle) |
| `--border` | `--portal-border` | `#CED4DA` | All hairline borders |
| `--border-soft` | `--portal-border-soft` | `#DEE2E6` | Secondary dividers (form hr, filter row) |
| `--fg` | `--portal-text` / `--portal-heading` | `#212529` | Body text, headings |
| `--fg-muted` | `--portal-text-secondary` | `#495057` | Secondary text, nav inks |
| `--fg-subtle` | `--portal-text-muted` | `#6C757D` | Placeholder, meta, disabled |
| `--primary` | `--portal-accent` / `--portal-action` | `#2B5CE6` | All accent treatments, primary CTA, H1 page title |
| `--primary-hover` | `--portal-accent-hover` / `--portal-action-hover` | `#1E49C9` | Hover states |
| `--primary-subtle` | `--portal-accent-soft` / `--portal-accent-subtle` | `#DBE7FE` (soft) / `rgba(43,92,230,0.08)` (subtle) | Chip tint, hover tint, focus ring |
| `--accent` | `--portal-accent-2` | `#C026D3` | Second brand colour (plum), gradient end |
| `--highlight` | `--portal-highlight` | `#10B981` | Third brand colour (emerald), NEW status, delight moments |
| `--ok` | `--portal-ok` | `#15803D` | Semantic success |
| `--warn` | `--portal-warn` | `#C2410C` | Semantic warn, `--pill-waiting-ink` |
| `--err` | `--portal-err` | `#B91C1C` | Semantic error, `--pill-overdue-ink` |
| `--tint-cool` | `--portal-tint-cool` | `#D6E4FB` | Cool section tint |
| `--tint-warm` | `--portal-tint-warm` | `#FBE3CD` | Warm section tint |
| `--band-bg` | `--portal-band-bg` | `#CED4DA` | Social-proof strip / carousels |

### Dark mode

The portal uses a **neutral grey ramp**, not the website's navy. Intentional: HaloPSA's native chrome (react-select dropdowns, Semantic popups, froala toolbar) expects neutral bg, and the user requested dark grey.

| Website `[data-theme="dark"]` | Portal `.theme-dark` | Value (portal) | Notes |
|---|---|---|---|
| `--bg` `#0A0F1C` | `--portal-bg` | `#161719` | Neutral charcoal, not navy |
| `--bg-subtle` `#0F1626` | `--portal-bg-subtle` | `#1B1D20` | |
| `--surface` `#121929` | `--portal-surface` | `#1F2125` | |
| `--surface-2` `#161E31` | `--portal-surface-active` | `#2E3138` | |
| — | `--portal-surface-hover` | `#262930` | |
| `--border` `#1F2740` | `--portal-border` | `#343741` | Lifted for visibility on grey |
| `--border-soft` `#171F34` | `--portal-border-soft` | `#26282F` | |
| `--fg` `#EAEBEF` | `--portal-text` | `#EAEBEF` | Identical |
| `--fg-muted` `#97A0B8` | `--portal-text-secondary` | `#A4AAB7` | Slightly less blue-tinted |
| `--fg-subtle` `#6A7493` | `--portal-text-muted` | `#7A8090` | |
| `--primary` `#4A74F0` | `--portal-accent` / `--portal-action` | `#4A74F0` | Identical |
| `--accent` `#D946EF` | `--portal-accent-2` | `#D946EF` | Identical |
| `--highlight` `#4ADE80` | `--portal-highlight` | `#4ADE80` | Identical |
| `--ok` `#34D399` | `--portal-ok` | `#34D399` | Identical |
| `--warn` `#FB923C` | `--portal-warn` | `#FB923C` | Identical |
| `--err` `#F87171` | `--portal-err` | `#F87171` | Identical |

**Exception: header bar** — dark navy `#0A0F1C` in **both** modes (hardcoded in `html body .portal header`). Logo is white-on-navy; a light header would strand it.

---

## 3 · Gradients + motion

| Website | Portal | Value | Used for |
|---|---|---|---|
| `--gradient-brand` | `--ik-gradient-brand` | `linear-gradient(135deg, #2B5CE6 0%, #8B3AD9 55%, #C026D3 100%)` (light) | Featured pills, primary button hover underlay |
| `--gradient-line` | `--ik-gradient-line` | `linear-gradient(90deg, transparent, #4A74F0 30%, #D946EF 70%, transparent)` (dark) / same with `#2B5CE6`/`#C026D3` (light) | Header ::after hairline, form-card top line |
| `cubic-bezier(0.22, 1, 0.36, 1)` | `--ik-ease` | Same | Every transition timing function |
| `200ms` (`duration-200`) | `--ik-dur` | `180ms` | Transition duration |

---

## 4 · Border-radius

| Website | Portal | Value | Used for |
|---|---|---|---|
| `rounded-sm` (6px) | `--portal-radius-xs` | `8px` | Small inputs, filter row inputs |
| `rounded` (10px, default) | `--portal-radius-sm` | `10px` | Form inputs, select controls, solid buttons |
| `rounded-md` (12px) | `--portal-radius-md` | `12px` | Card surfaces (article, tile-item, dashbtn at mid size) |
| `rounded-lg` (16px) | `--portal-radius` | `16px` | Large cards, form wrapper, `.kbdetails` article reading view |
| `rounded-full` (9999px) | literal `999px` | — | All pills: status, priority, kbtags, ghost buttons, back button |

---

## 5 · Shadows

Portal uses the same 3-tier system as the website:

| Website | Portal | Usage |
|---|---|---|
| `--shadow-sm` | `--portal-shadow-sm` | Hairline card elevation |
| `--shadow-md` (`--shadow`) | `--portal-shadow` | Default card shadow + hover lift |
| `--shadow-lg` | `--portal-shadow-hover` | Deep hover + popover |

Light mode shadows tint off `rgba(33, 37, 41, …)` (Gray 9). Dark mode shadows use `rgba(0, 0, 0, …)`.

---

## 6 · Component mapping

Each row: website pattern → portal selector(s) + relevant tokens.

### Buttons

| Website pattern | Portal selector | Chrome |
|---|---|---|
| `<Button variant="primary">` (filled fg-on-bg) | `.nhd-button.curve` (NOT inside `.listwidget`) | `--portal-action` bg, white ink, 36px pill |
| `<Button variant="accent">` (filled primary + gradient hover) | `.nhd-button.curve::before` | Gradient underlay, hover at `opacity: 1` |
| `<Button variant="ghost">` | `.listwidget .nhd-button.curve`, `.results-table + div > a`, `.backbtn`, `.-pagination .-btn` | Transparent bg, border, hover tints to `--portal-accent-soft` |
| "View all posts" link (blog section) | Same ghost family | Same |
| Close / dismiss icon | `.backbtn` (circular variant) | 32×32 round pill |

### Pills / chips

| Website pattern | Portal selector | Notes |
|---|---|---|
| Blog category pill (`OPINION`, `HOW-TO`) | `.status-avatar[style*="rgb(47, 53, 94)"]` (HaloPSA neutral chip) + fallback | Montserrat 10.5px / 600 / 0.08em uppercase, transparent + border |
| Topic chips (`COMPLIANCE`, `FEATURED`) | `span.kbtags`, `.kbtags` | JetBrains Mono 11.5px / 500 / 0.08em uppercase, surface-active bg |
| Status indicator (OK, Warn, Err) | `.status-avatar` (mapped by inline HaloPSA colour) | See §7 status pill mapping |
| Priority flag (website has severity badges in pricing) | `.rt-td .oneline:has(> .priority-block)` | See §8 priority mapping |
| `eyebrow-pill` (gradient hero label) | — | Not ported to portal (would compete with status pills) |

### Cards

| Website pattern | Portal selector | Chrome |
|---|---|---|
| `rounded-md border border-border bg-surface p-7` (blog card) | `.action-history-item.tile-item`, `.article`, `.card.dashbtn`, `.tile-widget`, `.details-group.card-panel` | `--portal-surface` bg, `--portal-border`, `--portal-radius-md`, translateY(-2px) hover |
| `.card-gradient-border` (rotating hover border) | — | Not ported (technique relies on `@property --angle` + conic-gradient; not implemented on portal cards) |
| `.tier-card-featured` (always-on gradient border) | `html body .portal:has(.mandatory-hint) .details-form.readeditform::before` | Fixed gradient line on top edge of form card |

### Typography patterns

| Website class | Portal selector | Notes |
|---|---|---|
| `.eyebrow` (mono tracked uppercase with leading em-dash) | `.page-subtitle`, `.ik-mono`, `.board-column-title` | Mono, 10.5–11px, 0.12–0.14em, `::before` em-dash on `.page-subtitle` |
| `.display` (Montserrat 300, tracking-display-tight) | `.portal h1`, `.page-title h1`, `.kbdetails h1` | Font 300–400, `letter-spacing: -0.02em`, line-height 1.05–1.15 |
| `.display em` (Instrument Serif italic with gradient underline) | `.portal h1 em`, `.page-title h1 em` | Serif italic, `::after` gradient line under the word |

### Header & nav

Locked spec — see §10 below.

### Forms

| Website pattern | Portal selector | Chrome |
|---|---|---|
| `.form-input` (inputs/textarea) | `.details-form input[type=text]`, `.details-form textarea` | 38px height, `--portal-bg` fill, `--portal-border` outline, focus → 3px accent ring |
| `.form-input:focus-visible` | `.details-form input:focus` | `box-shadow: 0 0 0 3px var(--portal-accent-subtle)` |
| Select (custom chevron) | `.Select__control` (react-select) | Same height + radius + focus ring |

### Blog post layout

| Website pattern | Portal equivalent |
|---|---|
| Post cover 16/10 aspect with gradient tile | — (KB articles don't ship cover images) |
| `post.category` pill (bottom-left, backdrop-blur) | — (hidden on `.articleRight .status-avatar`) |
| `<time>` + reading-minutes meta row | — |
| Body typography | `.kbdetails p / h1 / h2 / li` |

---

## 7 · Status pill colour mapping

HaloPSA paints status chips with inline `background-color: rgb(...)` per state. The portal intercepts each known inline colour and re-paints with brand tokens.

| State | HaloPSA inline colour(s) | Portal token | Ink | Used for |
|---|---|---|---|---|
| Open / Assigned | `rgb(66, 133, 244)`, `rgb(60, 134, 247)`, `rgb(43, 92, 230)`, `rgb(74, 116, 240)` | `--pill-open-bg` | `--pill-open-ink` = `--portal-accent` | Blue |
| In Progress | `rgb(111, 66, 193)`, `rgb(102, 16, 242)`, `rgb(153, 51, 255)`, `rgb(138, 43, 226)` | `--pill-progress-bg` | `--pill-progress-ink` = `--portal-accent-2` | Plum |
| Waiting / Awaiting User | `rgb(255, 193, 7)`, `rgb(212, 212, 216)`, `rgb(245, 158, 11)`, `rgb(194, 65, 12)` | `--pill-waiting-bg` | `--pill-waiting-ink` = `--portal-warn` | Amber |
| Resolved / Active | `rgb(40, 167, 69)`, `rgb(34, 139, 34)`, `rgb(0, 190, 0)`, `rgb(16, 185, 129)`, `rgb(187, 52, 63)` (asset "Active") | `--pill-resolved-bg` | `--pill-resolved-ink` = `--portal-highlight` | Emerald |
| Closed / Cancelled | `rgb(108, 117, 125)`, `rgb(128, 128, 128)`, `rgb(80, 80, 80)`, `rgb(119, 119, 119)` | `--pill-closed-bg` | `--pill-closed-ink` = `--portal-text-muted` | Neutral |
| Overdue / Breached | `rgb(220, 53, 69)`, `rgb(255, 46, 0)`, `rgb(185, 28, 28)`, `rgb(239, 68, 68)` | `--pill-overdue-bg` | `--pill-overdue-ink` = `--portal-err` | Red |
| Info / Pending Client | `rgb(23, 162, 184)`, `rgb(13, 202, 240)`, `rgb(8, 145, 178)` | `--pill-info-bg` | `--pill-info-ink` = `--portal-accent` | Info blue |
| New (fresh ticket) | `rgb(252, 220, 0)` | `--pill-new-bg` | `--pill-new-ink` = `--portal-highlight` | Emerald |
| Neutral / Category | `rgb(47, 53, 94)` (HaloPSA heading navy) | transparent | `--portal-text` | Outlined pill (ARTICLE chip, etc.) |
| Fallback (anything else) | * | transparent | `--portal-text-secondary` | Outlined pill |

All pills share unified typography via `.status-avatar.{fortable,small,bitsmall,smallest,fortile}`: **Montserrat / 10.5px / weight 600 / 0.06em tracking / uppercase**.

**Adding a new state:** add a new `--pill-X-bg / --pill-X-ink` pair near the existing block in the CSS, then add a selector mapping the HaloPSA inline `rgb(...)` to it AND add that rgb to the fallback `:not()` exclusion list so it doesn't fall through.

---

## 8 · Priority indicator mapping

HaloPSA renders the Priority column as `<div class="oneline">Low<div class="priority-block" style="background-color: rgb(...)"></div></div>`. Layout reversed via `flex-direction: row-reverse` so the coloured swatch sits on the LEFT of the text label. Swatch is shown as a 10×10 rounded square; its colour is remapped to a brand token keyed on HaloPSA's inline `rgb(...)`. Text label uses normal cell typography (no pill bg).

| Level | HaloPSA swatch colour(s) | Portal swatch colour | Token |
|---|---|---|---|
| Low | `rgb(0, 98, 177)`, `rgb(0, 123, 255)` | Brand blue | `--portal-accent` |
| Medium | `rgb(164, 221, 0)`, `rgb(252, 220, 0)` | Amber | `--portal-warn` |
| High | `rgb(251, 158, 0)`, `rgb(255, 152, 0)`, `rgb(255, 193, 7)` | Orange | `#F97316` (literal) |
| Critical | `rgb(220, 53, 69)`, `rgb(255, 0, 0)`, `rgb(255, 46, 0)` | Coral red | `--portal-err` |

---

## 9 · Asterisk / required-field colour

| Website | Portal | Token/value |
|---|---|---|
| Form required markers (if shipped) | `.mandatory-hint:first-letter`, `.asterisk`, `h999.asterisk` | `#F87171` pink-red |

---

## 10 · Header & nav spec (locked)

See full spec doc: header + nav styling is locked to the website's dark chrome. Key tokens:

| Element | Selector | Value |
|---|---|---|
| Bar (both modes) | `html body .portal header / .portal-header` | `background-color: #0A0F1C` |
| Gradient hairline | `html body .portal header::after` | `background: var(--ik-gradient-line); opacity: 0.5; height: 1px` |
| Nav buttons resting | `button.nhd-nav-btn` + `[style*="rgb(47, 53, 94)"]` | `color: rgba(255,255,255,0.82)`, bg transparent |
| Nav buttons hover | same + `:not(.active):hover` | `background-image: linear-gradient(rgba(255,255,255,0.08), ...)`, `color: #fff` |
| Navbar search focus | `.buttoncontainer.nav-search .Select__control--is-focused` | `bg: rgba(255,255,255,0.06); box-shadow: 0 0 0 1px rgba(255,255,255,0.14)` |
| Transition | All nav motion | `var(--ik-dur) var(--ik-ease)` = `180ms cubic-bezier(0.22,1,0.36,1)` |

**Never change** the bar colour in light mode (logo is white-on-navy) or use `background-color` for hover (HaloPSA inline style wins; use `background-image` instead).

---

## 11 · Update workflow

Use this flow when a website change needs to propagate into the portal:

### "I changed a colour on the website"

1. Identify the website token (grep `src/app/globals.css`)
2. Find its counterpart in §2 above → note the portal token name
3. Update the portal token value in `:root` (light) and/or `.theme-dark` (dark) in `self-service-portal-design.css`
4. If a hardcoded hex appears anywhere in the portal CSS (grep for the old hex): replace with the token reference
5. Commit + push → live in ~10 min

### "I changed a font"

1. Update `@import url('https://fonts.googleapis.com/css2?family=...')` at the top of `self-service-portal-design.css`
2. Update the matching `--ik-font-*` token below
3. Also update `self-service-portal.css` (legacy file) to keep fallback in sync
4. Test in iframe email bodies — `Portal/iframe-theme.js` injects Montserrat into email iframes; update the `CSS` constant there if the primary display font changes

### "I added a new button variant / component on the website"

1. Read the Tailwind classes on the website component
2. Map to portal tokens using §6 (component mapping)
3. Add a scoped rule `html body .portal <HaloPSA-selector> { ... }` in section 9 (Buttons) or relevant section
4. If the component appears across multiple HaloPSA contexts (list page, ticket view, kanban), scope tightly (`.listwidget .nhd-button.curve` vs. bare `.nhd-button.curve`) — see §6's ghost button example

### "I changed a radius or shadow"

1. Update `--portal-radius-*` or `--portal-shadow*` tokens in `:root` / `.theme-dark`
2. Every component using those tokens updates automatically — no selector changes needed

### "HaloPSA started emitting a new inline rgb() colour on a status pill"

1. Inspect the new `[style*="rgb(...)"]` value in the live portal
2. Add it to the matching `[style*="..."]` selector group in §7
3. Add it to the fallback rule's `:not()` exclusion list so it doesn't fall through to the outlined pill
4. If the semantic meaning is new (not Open/Progress/Waiting/Resolved/Closed/Overdue/Info/New), define a new `--pill-X-bg / --pill-X-ink` token pair in `:root` at the top of the pill block

---

## 12 · What's intentionally NOT shared

Not every website treatment is applied to the portal — some would fight HaloPSA's DOM or add complexity without benefit:

- **Rotating conic-gradient card border** (`.card-gradient-border`): requires `@property --angle` + manual hover wiring; portal cards use a simpler translateY + border-color transition
- **Hero `--gradient-glow`** layered radial ellipses: portal has a single radial glow behind `.portal::before`, not the website's three-layer composition
- **`.eyebrow-pill`** (filled gradient hero label): would compete with status pills visually; portal uses outlined neutral pills for the same purpose
- **Navy dark-mode bg** (`#0A0F1C`): portal uses a neutral grey ramp instead — deliberate choice, user preference
- **Marquee animation**: portal has no carousel/marquee content
- **Blog post cover tiles with category overlay**: portal hides the ARTICLE chip instead

---

## Quick token cheatsheet

```
WEBSITE TOKEN                PORTAL TOKEN                 NOTES
--bg                       → --portal-bg                  (page bg; grey ramp in dark)
--surface                  → --portal-surface             (card bg)
--surface-2                → --portal-surface-active      (active card)
--border                   → --portal-border              (hairlines)
--border-soft              → --portal-border-soft         (secondary dividers)
--fg / --fg-muted / --fg-subtle → --portal-text / -secondary / -muted
--primary                  → --portal-accent (= --portal-action)
--accent                   → --portal-accent-2            (plum)
--highlight                → --portal-highlight           (emerald, also NEW state)
--ok / --warn / --err      → --portal-ok / -warn / -err   (same values)
--font-display             → --ik-font-display            (Montserrat)
--font-serif               → --ik-font-serif              (Instrument Serif)
--font-mono                → --ik-font-mono               (JetBrains Mono)
--gradient-brand           → --ik-gradient-brand
--gradient-line            → --ik-gradient-line           (header hairline)
```
