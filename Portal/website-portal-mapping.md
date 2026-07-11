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

2026 lock: four families, each with a fixed role. Pre-2026 the portal only
had a two-family system (one sans for both display and body text, one
serif for italic emphasis); `--ik-font-body` is a new token, not a rename.

| Website var | Portal var | Value | Used for |
|---|---|---|---|
| `--font-display` | `--ik-font-display` | `'Bricolage Grotesque', system-ui, -apple-system, 'Segoe UI', sans-serif` | Headings only (h1-h6, page titles, hero title, section headers), weight 700 |
| n/a | `--ik-font-body` | `'Figtree', system-ui, -apple-system, 'Segoe UI', sans-serif` | Everything else: body copy, nav, labels, buttons, tags, table cells, form fields |
| `--font-serif` | `--ik-font-serif` | `'Newsreader', Georgia, 'Times New Roman', serif` | `<em>` inside headings (italic emphasis), the one accent-word move |
| `--font-mono` | `--ik-font-mono` | `'Spline Sans Mono', ui-monospace, Consolas, Menlo, monospace` | Eyebrows (`.page-subtitle`), page counters, KB tags, pagination input |

**Rule of thumb:** if the website uses `font-display` → portal uses `var(--ik-font-display)`, and ONLY on genuine headings. Tailwind class `font-mono` on website maps to `var(--ik-font-mono)` in portal. Everything that isn't a heading, an eyebrow/mono element, or an `<em>` accent uses `var(--ik-font-body)`.

**Cascade gotcha:** the portal's global "font sweep" rule (`html body .portal *:not(...)`) has higher CSS specificity than the plain heading rule, so it must explicitly `:not(h1):not(h2)...:not(h6)` itself or it silently overrides every heading back to the body font. See the comment above the sweep rule in `self-service-portal-design.css` §2 if you're touching this again.

**A few elements keep the display font even though they read like UI chrome**, per explicit design intent documented in-file: the ticket-list table header row (`.rt-thead.-header .rt-th`, comment: "reads as part of the Interconnekt display-type family, matching card titles / section headings"), the KB tree-menu sidebar (`.tree-menu .tree-node` / `.sidebar`), and the workflow-stepper step titles (`.rc-steps-item-title`). Check for a similar comment before assuming a small/dense element should be body font.

---

## 2 · Colour tokens

### Light mode

| Website `:root` | Portal `:root` | Value | Used for |
|---|---|---|---|
| `--bg` | `--portal-bg` | `#F1F3F7` | Page background |
| `--panel` | `--portal-bg-subtle` | `#F5F7FB` | Form inputs fill, muted regions |
| `--card` | `--portal-surface` | `#FFFFFF` | Cards, form wrappers, popovers |
| `--card2` | `--portal-surface-active` | `#F0F2F7` | Hover/active card tint, kb tag bg |
| n/a | `--portal-surface-hover` | `#F5F7FB` | Card hover (same as bg-subtle / panel) |
| hairline | `--portal-border` | `#E2E5EE` | All hairline borders |
| n/a | `--portal-border-soft` | `#ECEEF4` | Secondary dividers (hairline blended toward panel) |
| `--ink` | `--portal-text` / `--portal-heading` | `#161922` | Body text, headings |
| `--muted` | `--portal-text-secondary` | `#585F76` | Secondary text, nav inks |
| `--faint` | `--portal-text-muted` | `#8E93A4` | Placeholder, meta, disabled |
| `--primary` (blue, Insight role) | `--portal-accent` / `--portal-action` | `#3761E2` | Links, primary buttons, focus, H1 page title |
| n/a | `--portal-accent-hover` / `--portal-action-hover` | `#2F52C0` | Hover states (derived: 15% darker toward black) |
| n/a | `--portal-accent-subtle` | `rgba(55,92,230,0.08)`* | Focus ring, hover tint (*see note) |
| n/a | `--portal-accent-soft` | `#E7ECFC` | Chip tint |
| `--accent` (pink, CTA-only role) | `--portal-accent-2` | `#C026D3` | Get-in-touch CTA + highlighter accent ONLY, not a general second brand colour |
| `cat-violet` (violet, Advisory/AI/People role) | `--portal-violet` | `#6F43D6` | Third triad member, new token, see §1 |
| `--highlight` (jade/teal, Security BRAND role only) | `--portal-highlight` | `#0284C7` | Delight moments, live dots, alt icon chips, gradient first stop. NOT the success semantic, see `--ok` below |
| `--ok` | `--portal-ok` | `#15803D` | Semantic success: an independent true green, deliberately DISTINCT from `--portal-highlight`'s jade/teal. (An earlier pass briefly aliased `--portal-ok` to jade; reverted per design amendment, since jade/teal is brand-only and success needed its own hue.) |
| `--warn` | `--portal-warn` | `#C2410C` | Semantic warn, unchanged by the 2026 re-palette (already brand-independent) |
| `--err` | `--portal-err` | `#B91C1C` | Semantic error, unchanged by the 2026 re-palette |
| `--tint-cool` | `--portal-tint-cool` | `#E7ECFC` | Cool section tint (blue-derived) |
| `--tint-warm` | `--portal-tint-warm` | `#F7E5FA` | Warm section tint (pink-derived) |
| n/a | `--portal-band-bg` | `#E2E5EE` | Social-proof strip / carousels, same value as hairline |
| n/a | `--portal-on-accent` | `#FFFFFF` | Text colour for use ON TOP of a solid brand-colour fill (buttons, filled badges); see dark-mode row, this is a new token |

\* `--portal-accent-subtle` is `rgba(55, 97, 226, 0.08)`, the RGB of `--portal-accent`.

### Dark mode

The 2026 lock unifies the portal's dark grounds with the website's. This
retires the pre-2026 "portal uses a neutral grey ramp, not navy" exception.
Both now use the same `#0C0E16 → #10131C → #161A25 → #1B2030` ladder.

| Website `[data-theme="dark"]` | Portal `.theme-dark` | Value (portal) | Notes |
|---|---|---|---|
| `--bg` `#0C0E16` | `--portal-bg` | `#0C0E16` | Identical to website |
| `--panel` `#10131C` | `--portal-bg-subtle` | `#10131C` | |
| `--card` `#161A25` | `--portal-surface` | `#161A25` | |
| `--card2` `#1B2030` | `--portal-surface-active` | `#1B2030` | |
| n/a | `--portal-surface-hover` | `#10131C` | |
| hairline `rgba(255,255,255,.072)` | `--portal-border` | `rgba(255,255,255,0.072)` | Translucent, not opaque; identical to website |
| n/a | `--portal-border-soft` | `rgba(255,255,255,0.045)` | |
| `--ink` `#ECEEF4` | `--portal-text` | `#ECEEF4` | Identical |
| `--muted` `rgba(236,238,244,.62)` | `--portal-text-secondary` | `rgba(236,238,244,0.62)` | Identical |
| `--faint` `rgba(236,238,244,.4)` | `--portal-text-muted` | `rgba(236,238,244,0.4)` | Identical |
| `--primary` `#6E90FF` | `--portal-accent` / `--portal-action` | `#6E90FF` | Identical |
| `cat-violet` `#A47BFF` | `--portal-violet` | `#A47BFF` | Identical |
| `--highlight` `#3FC6A6` | `--portal-highlight` | `#3FC6A6` | Identical. Security brand accent ONLY, not the success semantic |
| `--accent` `#EC72CF` | `--portal-accent-2` | `#EC72CF` | Identical |
| `--ok` | `--portal-ok` | `#34D399` | Independent true green, NOT the same hue as `--portal-highlight` |
| `--warn` | `--portal-warn` | `#FB923C` | Unchanged by re-palette |
| `--err` | `--portal-err` | `#F87171` | Unchanged by re-palette |
| n/a | `--portal-on-accent` | `#161922` | **Flips to dark ink in dark mode.** The brightened dark-mode brand hues (all four) measure well under 3:1 with white text; dark ink measures 5.7 to 8.2:1 against them. Any solid brand-fill button/badge must use this token for its label colour, not a hardcoded white. |

**Exception: header + footer bar.** Hardcoded `#0C0E16` in **both** modes (`html body .portal header` / `.portal-header` / `.nhd-nav` / `footer`). This is no longer a *different* colour from the dark-mode bg (pre-2026 it was a distinct saturated navy `#0A0F1C` chosen independently); it now happens to equal `--portal-bg`'s dark value. The exception is still real, though: these elements ignore the portal's own light/dark toggle and stay dark always, because the logo is white-on-dark and a light header would strand it.

---

## 3 · Gradients + motion

| Website | Portal | Value | Used for |
|---|---|---|---|
| `--gradient-brand` | `--ik-gradient-brand` | `linear-gradient(115deg, #0284C7 0%, #3761E2 52%, #6F43D6 100%)` (light) / `linear-gradient(115deg, #3FC6A6 0%, #6E90FF 52%, #A47BFF 100%)` (dark) | Featured pills, primary button hover underlay. ONE brand gradient, reserved for featured/hero moments only, not a general decoration |
| `--gradient-line` | `--ik-gradient-line` | `linear-gradient(90deg, transparent, #0284C7 30%, #6F43D6 70%, transparent)` (light) / same with `#3FC6A6`/`#A47BFF` (dark) | Header `::after` hairline, form-card top line |
| `cubic-bezier(0.22, 1, 0.36, 1)` | `--ik-ease` | Same | Every transition timing function |
| `200ms` (`duration-200`) | `--ik-dur` | `180ms` | Transition duration |

The gradient direction changed from 135deg to 115deg and the colour stops moved from a two-tone blue to plum sweep to the full jade to blue to violet triad, with the mid stop pinned at 52%. Match the website's `--gradient-brand` exactly rather than re-deriving it if it changes again.

---

## 4 · Border-radius

The website's 2026 lock moved to a bigger, rounder scale (`sm` 20px / `base` 26px / `lg` 34px / pills 999px, "nothing square"). **The portal deliberately does NOT follow this scale**; it keeps its pre-existing tighter radii for density, a call made explicitly (not an oversight) because HaloPSA's dense list/table UI reads better with smaller corner radii than the website's spacious card layouts. Buttons are pills (999px) in both systems.

| Website (2026) | Portal | Value | Used for |
|---|---|---|---|
| `sm` `20px` | `--portal-radius-xs` | `8px` | Small inputs, filter row inputs |
| n/a | `--portal-radius-sm` | `10px` | Form inputs, select controls, solid buttons |
| n/a | `--portal-radius-md` | `12px` | Card surfaces (article, tile-item, dashbtn at mid size) |
| `base` `26px` | `--portal-radius` | `16px` | Large cards, form wrapper, `.kbdetails` article reading view |
| `lg` `34px` | n/a | n/a | Not used in the portal; no element needs a radius that large at portal density |
| pills `999px` | literal `999px` | n/a | All pills: status, priority, kbtags, ghost buttons, back button |

If a future pass decides the portal should track the website's radius scale more closely, treat that as a deliberate density-vs-consistency trade-off to make explicitly, not a drive-by fix.

---

## 5 · Shadows

Portal uses the same 3-tier system as the website:

| Website | Portal | Usage |
|---|---|---|
| `--shadow-sm` | `--portal-shadow-sm` | Hairline card elevation |
| `--shadow-md` (`--shadow`) | `--portal-shadow` | Default card shadow + hover lift |
| `--shadow-lg` | `--portal-shadow-hover` | Deep hover + popover |

Light mode shadows tint off `rgba(22, 25, 34, …)` (the 2026 `--ink` value; was `rgba(33, 37, 41, …)` / Gray 9 pre-2026). Dark mode shadows use `rgba(0, 0, 0, …)`, unchanged.

---

## 6 · Component mapping

Each row: website pattern → portal selector(s) + relevant tokens.

### Buttons

| Website pattern | Portal selector | Chrome |
|---|---|---|
| `<Button variant="primary">` (filled fg-on-bg) | `.nhd-button.curve` (NOT inside `.listwidget`) | `--portal-action` bg, `--portal-on-accent` ink, 36px pill |
| `<Button variant="accent">` (filled primary + gradient hover) | `.nhd-button.curve::before` | Gradient underlay, hover at `opacity: 1` |
| `<Button variant="ghost">` | `.listwidget .nhd-button.curve`, `.results-table + div > a`, `.backbtn`, `.-pagination .-btn` | Transparent bg, border, hover tints to `--portal-accent-soft` |
| "View all posts" link (blog section) | Same ghost family | Same |
| Close / dismiss icon | `.backbtn` (circular variant) | 32×32 round pill |

**Text-on-fill token:** every solid brand-colour button/badge must use `color: var(--portal-on-accent)`, not a hardcoded `#fff`. See §2's dark-mode contrast note; this was audited and fixed across the file as part of the 2026 re-palette (the `.nhd-button.curve` / `.solidbutton` primary pill, the workflow-stepper finish/process icons, the `.react-calendar-timeline` item bars, the entity-selection active pill, the toggle-switch active state, and the announcement image-enhanced badge all previously hardcoded white).

### Pills / chips

| Website pattern | Portal selector | Notes |
|---|---|---|
| Blog category pill (`OPINION`, `HOW-TO`) | `.status-avatar[style*="rgb(47, 53, 94)"]` (HaloPSA neutral chip) + fallback | Figtree 10.5px / 600 / 0.08em uppercase, transparent + border |
| Topic chips (`COMPLIANCE`, `FEATURED`) | `span.kbtags`, `.kbtags` | Spline Sans Mono 11.5px / 500 / 0.08em uppercase, surface-active bg |
| Status indicator (OK, Warn, Err) | `.status-avatar` (mapped by inline HaloPSA colour) | See §7 status pill mapping |
| Priority flag (website has severity badges in pricing) | `.rt-td .oneline:has(> .priority-block)` | See §8 priority mapping |
| `eyebrow-pill` (gradient hero label) | n/a | Not ported to portal (would compete with status pills) |

### Cards

| Website pattern | Portal selector | Chrome |
|---|---|---|
| `rounded-md border border-border bg-surface p-7` (blog card) | `.action-history-item.tile-item`, `.article`, `.card.dashbtn`, `.tile-widget`, `.details-group.card-panel` | `--portal-surface` bg, `--portal-border`, `--portal-radius-md`, translateY(-2px) hover |
| `.card-gradient-border` (rotating hover border) | n/a | Not ported (technique relies on `@property --angle` + conic-gradient; not implemented on portal cards) |
| `.tier-card-featured` (always-on gradient border) | `html body .portal:has(.mandatory-hint) .details-form.readeditform::before` | Fixed gradient line on top edge of form card |

### Typography patterns

| Website class | Portal selector | Notes |
|---|---|---|
| `.eyebrow` (mono tracked uppercase with leading em-dash) | `.page-subtitle`, `.ik-mono`, `.board-column-title` | Mono, 10.5 to 11px, 0.12 to 0.14em tracking, `::before` em-dash glyph on `.page-subtitle` |
| `.display` (Bricolage Grotesque 700, tracking-display-tight) | `.portal h1`, `.page-title h1`, `.kbdetails h1` | Weight 700, `letter-spacing: -0.02em`, line-height 1.05 to 1.15 |
| `.display em` (Newsreader italic with gradient underline) | `.portal h1 em`, `.page-title h1 em` | Serif italic, `::after` gradient line under the word |

### Header & nav

Locked spec, see §10 below.

### Forms

| Website pattern | Portal selector | Chrome |
|---|---|---|
| `.form-input` (inputs/textarea) | `.details-form input[type=text]`, `.details-form textarea` | 38px height, `--portal-bg` fill, `--portal-border` outline, focus → 3px accent ring |
| `.form-input:focus-visible` | `.details-form input:focus` | `box-shadow: 0 0 0 3px var(--portal-accent-subtle)` |
| Select (custom chevron) | `.Select__control` (react-select) | Same height + radius + focus ring |

### Blog post layout

| Website pattern | Portal equivalent |
|---|---|
| Post cover 16/10 aspect with gradient tile | n/a (KB articles don't ship cover images) |
| `post.category` pill (bottom-left, backdrop-blur) | n/a (hidden on `.articleRight .status-avatar`) |
| `<time>` + reading-minutes meta row | n/a |
| Body typography | `.kbdetails p / h1 / h2 / li` |

---

## 7 · Status pill colour system

**2026 lock: six semantic buckets, not a per-status rainbow.** Pre-2026 every
named workflow status got its own bespoke seed hue (23 distinct colours).
The 2026 design system collapses that onto six shared hues, a deliberate
trade-off (see "What changed" below).

### How it works

1. Portal CSS defines token pairs for every named state (`--pill-new-bg / -ink`, `--pill-assigned-bg / -ink`, etc., full list below). Many now share identical VALUES because they share a bucket; the per-status token NAMES are kept (not collapsed into six shared variables) so a status can be re-bucketed later without a selector-level refactor.
2. Portal CSS has a `.status-avatar.s-<slug>` rule per state that paints via `background-image: linear-gradient(var(--bg), var(--bg))`. `background-image` is a different property than HaloPSA's inline `background-color`, so the wash sits on top without needing `!important` on the inline side.
3. `Portal/iframe-theme.js` reads each `.status-avatar` textContent and stamps the matching `.s-*` class, keyed via a `STATUS_MAP` dict. A MutationObserver catches re-renders.
4. Inline-rgb attribute selectors (`[style*="rgb(…)"]`) remain as a **fallback**; they fire for pills that render before the JS stamps a class, and for status names the map doesn't know yet. Class selectors win via specificity when both match.

### What changed

The old rainbow gave each status a unique, at-a-glance-distinct hue (New =
signal yellow, Awaiting User = pink, Triage Handoff = teal, On Hold = dusty
rose, Quote Sent = navy, and so on). The 2026 lock trades that
distinctiveness for a small, memorable, disciplined palette; most "waiting
on someone" states (11 of 23) now render in the same amber. This is
intentional per the design-system brief, not an oversight: judge it against
the goal of a consistent brand system, not against the old rainbow's
per-status legibility. If a specific workflow genuinely needs finer-grained
visual distinction back (e.g. an agent-facing queue view where telling
"Awaiting Supplier" from "Awaiting User" at a glance matters), that's a
deliberate follow-up conversation, not a default to restore silently.

### Bucket assignment

| Bucket | Statuses |
|---|---|
| **green** (Active/Paid/Approved/Complete; true green, NOT jade/teal. Jade/teal is the Security brand accent only, it has no status-pill role) | Resolved, Approved, Action Completed, Qualified |
| **blue** (In progress) | In Progress, Assigned |
| **violet** (Scheduled) | Scheduled, Quote Raised/Scoped (kept distinct from ticket-workflow blue as a "pre-sales family" signal) |
| **amber** (Pending/In review/Awaiting) | New, Agent - Triage Handoff, Action Required, Awaiting User, Awaiting Supplier, Awaiting Approval/Customer Review, On Hold, Updated, Awaiting Change Review/Billing Review, Dispatch Review, Quote Sent |
| **red** (Overdue/Blocked/Failed) | Rejected |
| **grey** (Draft/Not started / terminal) | Closed, With CAB/Open Order/Open Item/Invoiced ("system neutral", unchanged grouping from pre-2026), Closed Order/Closed Item |

### Palette

| Bucket | Light bg / ink | Dark bg / ink | Derivation |
|---|---|---|---|
| green | `#E3F0E8` / `#093A1B` | `rgba(52,211,153,0.18)` / `#61DDAF` | Light: mix `--portal-ok` toward white 88% (bg) / toward black 55% (ink). Dark: rgba of dark `--portal-ok` at 18% / lighten 22%. Independent true green, see the §2 amendment note; do not derive this from `--portal-highlight` (jade/teal) |
| blue | `#E7ECFC` / `#192C66` | `rgba(110,144,255,0.18)` / `#8EA8FF` | Same formula off `--portal-accent` |
| violet | `#EEE8FA` / `#321E60` | `rgba(164,123,255,0.18)` / `#B898FF` | Same formula off `--portal-violet` |
| amber | `#F8E8E2` / `#882E08` | `rgba(251,146,60,0.18)` / `#FCA259` | Same formula off `--portal-warn` (kept from the existing warn family per the design brief) |
| red | `#F7E4E4` / `#9D1818` | `rgba(248,113,113,0.18)` / `#F97F7F` | Same formula off `--portal-err` |
| grey | `#F0F2F7` / `#585F76` | `rgba(255,255,255,0.08)` / `rgba(236,238,244,0.4)` | `--portal-surface-active` / `--portal-text-secondary` (light); existing dark neutral tokens |

Every `--pill-<slug>-bg / -ink` token in `self-service-portal-design.css` maps to one of the six rows above per the bucket table. See the CSS comments directly above the token block (`:root` / `.theme-dark`, "Status pill COLOUR SYSTEM" header) for the per-status rationale.

**Exception: home-tile "On Hold" indicator.** The generic `On Hold` STATUS PILL is amber (a paused/administrative wait). But the SEPARATE `[data-on-hold-indicator]` element, which HaloPSA substitutes for the SLA countdown bar itself on home-page ticket tiles, deliberately stays in the RED family, because "the clock isn't running" reads closer to the overdue/blocked semantic than a plain awaiting-state when it's replacing an SLA bar specifically. Two different UI moments, same status name, different bucket, by design.

**Shared typography** for every `.status-avatar.{fortable,small,bitsmall,smallest,fortile}`: Figtree / 10.5px / weight 600 / 0.06em tracking / uppercase. Exception: the redundant KB-article Custom-CSS override and the ticket-list table header both intentionally use the DISPLAY font, see §1's cascade note.

### Adding a new status

1. Decide which of the six buckets the status semantically belongs to (see the bucket table above; don't invent a seventh hue, pink is reserved for the CTA/highlighter role only and is never a status colour).
2. Add `--pill-<slug>-bg / -ink` token pairs to both `:root` and `.theme-dark` in `self-service-portal-design.css`, copying the chosen bucket's exact values.
3. Add a `html body .portal .status-avatar.s-<slug>` rule using the `background-image: linear-gradient(var(--pill-<slug>-bg), var(--pill-<slug>-bg))` pattern.
4. Add the textContent → class mapping to `STATUS_MAP` in `Portal/iframe-theme.js`.
5. If HaloPSA emits a distinct inline `rgb()` for this state, add it to the relevant `[style*=]` fallback selector in the CSS.

---

## 8 · Priority indicator mapping

HaloPSA renders the Priority column as `<div class="oneline">Low<div class="priority-block" style="background-color: rgb(...)"></div></div>`. Layout reversed via `flex-direction: row-reverse` so the coloured swatch sits on the LEFT of the text label. Two parallel systems exist in the CSS: the tonal `.oneline.p-<level>` pill (primary; `--p-bg / --p-ink / --p-dot`, JS-stamped) and a legacy inline-rgb-keyed swatch-only fallback. Both follow the same 2026 bucket mapping.

2026 lock: **Low = true green/neutral (NOT jade/teal), Medium = amber, High = red-leaning (distinct from Critical), Critical = red.**

| Level | HaloPSA swatch colour(s) | Bucket | Light bg / ink / dot | Dark bg / ink / dot |
|---|---|---|---|---|
| Low | `rgb(0, 98, 177)`, `rgb(0, 123, 255)`, etc. | green | `#E3F0E8` / `#093A1B` / `#15803D` | `rgba(52,211,153,0.18)` / `#61DDAF` / `#34D399` |
| Medium | `rgb(164, 221, 0)`, `rgb(252, 220, 0)` | amber | `#F8E8E2` / `#882E08` / `#C2410C` | `rgba(251,146,60,0.18)` / `#FCA259` / `#FB923C` |
| High | `rgb(251, 158, 0)`, `rgb(255, 152, 0)`, `rgb(255, 193, 7)` | red-leaning (blend of amber + red, kept distinct from Critical) | `#F7E6E3` / `#8E220F` / `#BE2E14` | `rgba(250,130,86,0.20)` / `#FA8C64` / `#FA8256` |
| Critical | `rgb(220, 53, 69)`, `rgb(255, 0, 0)`, `rgb(255, 46, 0)` | red | `#F7E4E4` / `#9D1818` / `#B91C1C` | `rgba(248,113,113,0.18)` / `#F97F7F` / `#F87171` |

Pre-2026, Low mapped to `--portal-accent` (plain brand blue) and High was a literal orange (`#F97316`) unrelated to any token family. Both are retired in favour of the bucket system above so priority and status pills read as one consistent language.

---

## 9 · Asterisk / required-field colour

| Website | Portal | Token/value |
|---|---|---|
| Form required markers (if shipped) | `.mandatory-hint:first-letter`, `.asterisk`, `h999.asterisk` | `var(--portal-err)`, **token, not a literal.** Pre-2026 this was a hardcoded `#F87171` (the dark-mode red shade) used unconditionally in both themes, which measured only 2.77:1 against a light-mode white card, under the 4.5:1 body-text floor. Fixed as part of the 2026 pass to reference the token so it resolves to `#B91C1C` (6.47:1) in light mode and `#F87171` in dark mode. |

---

## 10 · Header & nav spec (locked)

See full spec doc: header + nav styling is locked to the website's dark chrome. Key tokens:

| Element | Selector | Value |
|---|---|---|
| Bar (both modes) | `html body .portal header / .portal-header / .nhd-nav / footer` | `background-color: #0C0E16` (2026: same hex as the dark-mode `--portal-bg`; pre-2026 this was an independently-chosen navy `#0A0F1C`) |
| Gradient hairline | `html body .portal header::after` | `background: var(--ik-gradient-line); opacity: 0.5; height: 1px` |
| Nav buttons resting | `button.nhd-nav-btn` + `[style*="rgb(47, 53, 94)"]` | `color: rgba(255,255,255,0.82)`, bg transparent |
| Nav buttons hover | same + `:not(.active):hover` | `background-image: linear-gradient(rgba(255,255,255,0.08), ...)`, `color: #fff` |
| Navbar search focus | `.buttoncontainer.nav-search .Select__control--is-focused` | `bg: rgba(255,255,255,0.06); box-shadow: 0 0 0 1px rgba(255,255,255,0.14)` |
| Transition | All nav motion | `var(--ik-dur) var(--ik-ease)` = `180ms cubic-bezier(0.22,1,0.36,1)` |

**Never change** the bar colour in light mode (logo is white-on-dark) or use `background-color` for hover (HaloPSA inline style wins; use `background-image` instead). The header/nav/footer's white text and `rgba(255,255,255,…)` overlays stay literal (not `var(--portal-on-accent)`) because that bar is hardcoded dark in both modes; it never sees the bright dark-mode brand hue that makes `--portal-on-accent` necessary elsewhere.

---

## 11 · Update workflow

Use this flow when a website change needs to propagate into the portal:

### "I changed a colour on the website"

1. Identify the website token (grep `src/app/globals.css`)
2. Find its counterpart in §2 above → note the portal token name
3. Update the portal token value in `:root` (light) and/or `.theme-dark` (dark) in `self-service-portal-design.css`
4. If a hardcoded hex appears anywhere in the portal CSS (grep for the old hex): replace with the token reference
5. If the changed colour is one of the four brand triad hues, re-check §7/§8's bucket palette and the `--portal-on-accent` contrast note in §2; derived tints/pill buckets/on-accent text choice may need recomputing, not just the base token
6. Commit + push → live in ~10 min

### "I changed a font"

1. Update `@import url('https://fonts.googleapis.com/css2?family=...')` at the top of `self-service-portal-design.css`
2. Update the matching `--ik-font-*` token below
3. Also update `self-service-portal.css` (legacy file) to keep fallback in sync
4. Test in iframe email bodies: `Portal/iframe-theme.js` injects the body font into email iframes; update the `CSS` constant there if the primary body font changes (NOT the display font; email bodies use the body/UI font, not the display face)
5. If the display/body split itself changes (e.g. a font is promoted from body to display or vice versa), re-check the font-sweep cascade note in §1; the sweep's `:not()` exclusion list must keep excluding every element that should keep the display font

### "I added a new button variant / component on the website"

1. Read the Tailwind classes on the website component
2. Map to portal tokens using §6 (component mapping)
3. Add a scoped rule `html body .portal <HaloPSA-selector> { ... }` in section 9 (Buttons) or relevant section
4. If the component is a SOLID brand-colour fill, use `color: var(--portal-on-accent)` for the label, never hardcode white (see §2 dark-mode contrast note)
5. If the component appears across multiple HaloPSA contexts (list page, ticket view, kanban), scope tightly (`.listwidget .nhd-button.curve` vs. bare `.nhd-button.curve`), see §6's ghost button example

### "I changed a radius or shadow"

1. Update `--portal-radius-*` or `--portal-shadow*` tokens in `:root` / `.theme-dark`
2. Every component using those tokens updates automatically, no selector changes needed
3. Remember §4: the portal's radius scale is deliberately decoupled from the website's; don't blindly copy a website radius change over

### "HaloPSA started emitting a new inline rgb() colour on a status pill"

1. Inspect the new `[style*="rgb(...)"]` value in the live portal
2. Add it to the matching `[style*="..."]` selector group in §7
3. Add it to the fallback rule's `:not()` exclusion list so it doesn't fall through to the outlined pill
4. If the semantic meaning is new, decide which of the SIX buckets (§7) it belongs to; do not invent a new hue

---

## 12 · What's intentionally NOT shared

Not every website treatment is applied to the portal; some would fight HaloPSA's DOM or add complexity without benefit:

- **Rotating conic-gradient card border** (`.card-gradient-border`): requires `@property --angle` + manual hover wiring; portal cards use a simpler translateY + border-color transition
- **Hero `--gradient-glow`** layered radial ellipses: portal has a single radial glow behind `.portal::before`, not the website's three-layer composition
- **`.eyebrow-pill`** (filled gradient hero label): would compete with status pills visually; portal uses outlined neutral pills for the same purpose
- **Portal radius scale**: deliberately stays tighter than the website's 2026 20/26/34 scale, see §4
- **Marquee animation**: portal has no carousel/marquee content
- **Blog post cover tiles with category overlay**: portal hides the ARTICLE chip instead

---

## Quick token cheatsheet

```
WEBSITE TOKEN                PORTAL TOKEN                 NOTES
--bg                       → --portal-bg                  (page bg, #F1F3F7 / #0C0E16)
--panel                    → --portal-bg-subtle            (#F5F7FB / #10131C)
--card                     → --portal-surface              (#FFFFFF / #161A25)
--card2                    → --portal-surface-active       (#F0F2F7 / #1B2030)
hairline                   → --portal-border               (#E2E5EE / rgba(255,255,255,.072))
--ink / --muted / --faint  → --portal-text / -secondary / -muted
--primary (blue)           → --portal-accent (= --portal-action)   (#3761E2 / #6E90FF)
cat-violet                 → --portal-violet               (#6F43D6 / #A47BFF, new token)
--highlight (jade/teal)    → --portal-highlight             (Security BRAND accent ONLY, #0284C7 / #3FC6A6, NOT --portal-ok)
--ok (true green)          → --portal-ok                   (semantic success, independent hue, #15803D / #34D399)
--accent (pink)            → --portal-accent-2             (CTA + highlighter ONLY, #C026D3 / #EC72CF)
--font-display              → --ik-font-display            (Bricolage Grotesque, headings only, weight 700)
(new token)                 → --ik-font-body               (Figtree, everything else)
--font-serif                → --ik-font-serif               (Newsreader italic accent)
--font-mono                 → --ik-font-mono                (Spline Sans Mono)
--gradient-brand            → --ik-gradient-brand           (115deg, jade to blue to violet, 52% mid stop)
--gradient-line              → --ik-gradient-line           (header hairline)
(new token)                 → --portal-on-accent            (white light / dark-ink dark, for text on solid brand fills)
```
