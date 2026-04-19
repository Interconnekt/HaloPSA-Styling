# Agent Instructions — HaloPSA Styling

This file provides context for AI agents working on this repository.

---

## What This Repo Does

CSS styling for a HaloPSA Self-Service Portal and Knowledge Base articles. Articles are sourced from Confluence, so the HTML contains Confluence-specific class names. The portal chrome is aligned to the Interconnekt 2026 website refresh — tokens, fonts, and component patterns are shared via `Portal/website-portal-mapping.md`.

There are **two separate CSS layers** in HaloPSA, each with different deployment mechanics and scope.

**Live CSS file:** `Portal/self-service-portal-design.css` (loaded via HaloPSA Custom CSS `@import` from GitHub Pages — confirmed via `document.styleSheets` inspection).

**`Portal/self-service-portal.css` is UNUSED** — a legacy file kept in the repo only for historical reference. HaloPSA's Custom CSS slot contains a single `@import url('https://interconnekt.github.io/HaloPSA-Styling/Portal/self-service-portal-design.css');` line; no second stylesheet is loaded. **Do not mirror changes into `self-service-portal.css`** — edits made there have zero effect on the live portal and just create drift.

**Start here when:**
- A website token/font/colour changed → read `Portal/website-portal-mapping.md`
- A HaloPSA element needs restyling → grep `self-service-portal-design.css` for the class, scope new rules under `html body .portal …`
- A new status / priority colour appeared in the live DOM → see mapping doc §7 (status pills) / §8 (priority)

---

## The Two-Layer Architecture

### Layer 1: Style Profiles

- **Scope:** Both Self-Service Portal AND Agent Portal
- **Deployment:** Manual entry in HaloPSA UI (Configuration > Knowledge Base > Style Profiles)
- **Auto-scoping:** HaloPSA wraps every rule as `.kbdetails <selector> { <properties> }`. Never include `.kbdetails` in the Selector field.
- **Source of truth:** `style-profile-rules.css` — each comment block maps to one HaloPSA UI entry
- **Cannot use:** `@import`, `@media`, multi-selector rules (HaloPSA UI has one selector per rule), ancestor selectors above `.kbdetails`

### Layer 2: Custom CSS

- **Scope:** Self-Service Portal ONLY
- **Deployment:** Edit `self-service-portal-design.css`, commit, push to GitHub → served via GitHub Pages → live in ~10 minutes
- **Not auto-scoped:** Selectors are used exactly as written
- **HaloPSA field contains:** A single `@import url('https://interconnekt.github.io/HaloPSA-Styling/Portal/self-service-portal-design.css');` line
- **Source:** `self-service-portal-design.css` (ONLY — `self-service-portal.css` is legacy and unused, see note at top)

### What Goes Where

| Concern | Style Profiles | Custom CSS |
|---------|---------------|------------|
| Light mode article styles | ✓ | Redundant overrides with `!important` for specificity |
| Dark mode article styles | ✗ Cannot (ancestor limitation) | ✓ `.theme-dark .kbdetails ...` |
| Portal chrome (header/nav/cards) | ✗ | ✓ |
| CSS variables | ✗ | ✓ `:root` / `.theme-dark` |
| Responsive `@media` | ✗ | ✓ |
| Print `@media print` | ✗ | ✓ |

---

## Critical Gotchas

### 1. `.theme-dark` is an ancestor — Style Profiles can't use it

HaloPSA places `.theme-dark` on `div.app-container`, which is a DOM ancestor of `.kbdetails`. Style Profile rules are auto-scoped under `.kbdetails`, so `.theme-dark h1` becomes `.kbdetails .theme-dark h1` — which never matches because `.theme-dark` is above, not inside, `.kbdetails`.

**Rule:** All dark mode overrides must be in `self-service-portal-design.css` using `.theme-dark .kbdetails ...` selectors. Prefer the token-flip approach (define a CSS custom property in `:root` + override in `.theme-dark`, then reference `var(--foo)` in the rule) — one rule handles both modes automatically. See the `--panel-*-bg/border/icon` tokens for an example.

### 2. Confluence exports inline styles — `!important` is mandatory

Confluence panels, status macros, and some tables are exported with inline `style="background-color: ..."` attributes. Inline styles have the highest specificity and cannot be overridden from a stylesheet without `!important`.

**Rule:** All panel background colours, border-left accents, and status macro colour rules must use `!important`. Use the full `border-left: 4px solid #xxx !important` shorthand (not just `border-left-color`). Per-type wrapper rules also need `border: none !important` before the `border-left` to kill Confluence's inline border.

### 3. `border-radius` goes on the OUTER wrapper, not the inner content div

Confluence panel structure:
```
div.confluence-information-macro              ← outer: border-radius, overflow:hidden, border:none, border-left accent
  div.confluence-information-macro-body       ← inner: background-color, color: #1a1d23, padding
```
```
div.panel                                     ← needs: border-radius + overflow: hidden
  div.panelContent                            ← has: content
```

Setting `border-radius` on the inner div clips that element's own background but doesn't clip the outer wrapper. The outer wrapper needs `border-radius + overflow: hidden` to visually clip the background to rounded corners.

The Style Profile has Precedence 28 rules for `.confluence-information-macro` and `.panel` to apply this at the outer wrapper level (before the Precedence 30 body/content rules).

### 4. Panel types: ADF panels, class mapping, and generic panels

Confluence ADF defines 6 panel types. They split into **two families** by export format:

**Family A — `.confluence-information-macro-*`** (ADF Info, Note, Error, Success/Tip). These export as `<div class="confluence-information-macro confluence-information-macro-{type}">` with NO inline style. Our CSS paints them via per-type `--panel-{info|note|warn|tip}-*` tokens that auto-flip in `.theme-dark`.

**Family B — `<div class="panel">`** (ADF Note-panel, Warning-panel, Custom-panel). These export as a bare `<div class="panel">` with Confluence stamping colour INLINE: `style="background-color: #HEX; border-color: #HEX"`. No per-type class to target. Our CSS re-paints known Confluence default hex values via attribute selectors, and in dark mode a `::before` scrim darkens them while preserving hue.

| ADF Type | DOM class | Inline bg | Portal light | Portal dark |
|---|---|---|---|---|
| Info | `.confluence-information-macro-information` | — | `var(--panel-info-bg)` #EAF2FD | `rgba(74,116,240,0.15)` |
| Note | `.confluence-information-macro-note` | — | `var(--panel-note-bg)` #F7EEFD | `rgba(168,86,239,0.15)` |
| Error | `.confluence-information-macro-warning` (sic) | — | `var(--panel-warn-bg)` #FCEDEC | `rgba(248,113,113,0.12)` |
| Success/Tip | `.confluence-information-macro-tip` | — | `var(--panel-tip-bg)` #E3FEF2 | `rgba(52,211,153,0.12)` |
| Note-panel | `.panel` | `#EAE6FF` | `#EAE6FF` painted via attr selector | `::before` scrim darkens |
| Warning-panel | `.panel` | `#FFFAE6` or `#FDF7CD` | yellow painted via attr selector | `::before` scrim darkens |
| Custom-panel | `.panel` | `#E6FCFF` or author-picked | cyan painted via attr selector | `::before` scrim darkens |

**Legacy naming quirk:** ADF "Error" panels render with the `.confluence-information-macro-warning` class, not `-error`. The class name says "warning" but the panel is visually red/error. Don't let the name mislead you — treat `-warning` as red, treat the yellow "Warning panel" as the Family-B `.panel` variant.

**Author-label mismatch — watch out:** In Confluence the author chooses a panel TYPE when inserting. The panel has no "label" in the exported DOM, so an article author who labels a Family-B purple Note-panel as "Warning Panel" in their body text produces markup where the visible label and the rendered colour don't agree. The CSS is rendering ADF semantics faithfully; if the author wanted yellow they should have used the Warning-panel macro type. Example: `/kb?btn=46&faqlist=1&id=16` — the "Warning Panel" row there uses `.confluence-information-macro-note` and renders purple.

**The phantom white-bg rule:** Panel wrappers are being painted white by a (0,4,2)+`!important` rule that doesn't appear in programmatic `document.styleSheets` iteration — likely a HaloPSA-platform-injected sheet that's CORS-blocked or stored outside the enumerable API. The fix across all panel rules is doubled-class specificity: `.kbdetails.kbdetails .confluence-information-macro-note.confluence-information-macro-note` or `.kbdetails.kbdetails .panel.panel[style*="#HEX"]`. Bumps specificity to (0,5,2) → wins cleanly. Browsers collapse duplicate classes at parse time, no runtime cost.

**Custom-panel colour coverage:** Family-B panels are keyed on the inline hex. We ship rules for the common Confluence defaults (`#EAE6FF`, `#FFFAE6`, `#FDF7CD`, `#E6FCFF`, `#EBF9FE`). If an author picks an uncommon hex via the Custom panel colour picker, the panel falls back to unstyled (white). Add a new attribute-selector rule matching that hex to support it.

### 5. Agent Portal dark mode has no article styling from this project

Custom CSS applies only to the Self-Service Portal. The Agent Portal gets Style Profile rules (light mode article styles only). Dark mode in the Agent Portal relies on HaloPSA's built-in `.theme-dark` rules. Panel text uses explicit `color: #1a1d23 !important` (dark text) rather than `inherit` — this ensures readable text on the light-coloured panel backgrounds in both Agent Portal modes. The Self-Service Portal dark mode overrides this to `#ddd` in Custom CSS.

### 6. Font loading gap in Agent Portal

The Google Fonts `@import` for Montserrat is in `self-service-portal-design.css` (Custom CSS), which only loads in the Self-Service Portal. Style Profile rules reference `font-family: 'Montserrat', sans-serif` — in the Agent Portal this falls back to `sans-serif` unless HaloPSA's theme independently loads Montserrat.

### 7. Tables use clean modern styling — no border-radius, no zebra stripes

Tables deliberately have no `border-radius`, no `overflow: hidden`, and no alternating row colours. They use `border-collapse: collapse` with thin 1px borders. This is intentional design following modern KB systems (Notion, Linear, GitHub). Do not re-add border-radius or zebra stripes.

### 8. Code blocks use a dark theme regardless of portal mode

Both inline `code` and `pre` blocks use a dark background with light text (Catppuccin-inspired). This provides consistent code appearance and good contrast in both light and dark portal modes. The dark mode overrides adjust the inline code pill styling but leave pre blocks largely unchanged.

---

## Making Changes

### Changing Custom CSS (portal chrome, dark mode overrides)

1. Edit `self-service-portal-design.css` (the live file — only file the portal actually loads)
2. Commit and push
3. GitHub Pages serves the updated file within ~10 minutes. Hard-refresh the portal (Cmd+Shift+R) to bust the browser CSS cache

**Do NOT edit `self-service-portal.css`.** It's legacy, unused, and changes there don't propagate to the portal. If you find yourself about to "mirror" a change into it, stop — you're doubling the maintenance burden for zero runtime benefit.

### Token governance

- Token source of truth: `:root` + `.theme-dark` blocks at the top of `self-service-portal-design.css`
- Website → portal mapping: `Portal/website-portal-mapping.md` — every `--portal-*` token has a website counterpart listed there
- **Never hardcode a hex** that has a token (run `grep -n '#[0-9A-Fa-f]' Portal/self-service-portal-design.css` periodically to catch drift)
- HaloPSA's inline `rgb(...)` status/priority colours go through the pill colour system — don't style individual pills with hardcoded hex; add a new mapping entry referencing brand tokens (see mapping doc §7)

### Changing Style Profile rules

1. Edit `style-profile-rules.css` (keep it as the source of truth)
2. Commit and push (documents the change)
3. **Also manually update the corresponding rule in HaloPSA UI** — there is no automated sync. Configuration > Knowledge Base > Style Profiles.

If you add a new Style Profile rule, document it in `style-profile-rules.css` with the matching comment block format:
```css
/* ═══════════════════════════════════════
   Precedence: XX | Selector: <selector>
   ═══════════════════════════════════════ */
<css properties>
```

### Updating the Confluence article

This project has a companion Confluence article (internal, not linked here) that documents the full architecture and Style Profile rule table. When making significant changes, update:
- `style-profile-rules.css` (source of truth)
- The Confluence article's Style Profile table
- `dark-mode-test-checklist.md` if new testable elements are added

---

## CSS Variable Structure

`self-service-portal-design.css` uses CSS custom properties for all colours. Two variable sets:

```css
:root { ... }          /* Light mode — portal bg, surface, text, accent, border, shadow, code, blockquote */
.theme-dark { ... }    /* Dark mode overrides — same variable names, darker values */
```

All portal chrome rules reference `var(--portal-xxx)` tokens. Article overrides in sections 9/10 use a mix of variables and hardcoded values where Confluence's specificity requires it.

---

## Testing

Use the internal Test Article (KB id=16) which contains all panel types, status macros, tables, headings, code blocks, blockquotes, lists, and images.

See `dark-mode-test-checklist.md` for the full verification checklist covering:
- Self-Service Portal light mode
- Self-Service Portal dark mode
- Agent Portal light mode
- Agent Portal dark mode
- Mobile (480px) and tablet (768px) responsive
- Print output

---

## Precedence Order Reference

Style Profile rules are applied in precedence order (lower = applied first, higher = wins conflicts):

| Range | Purpose |
|-------|---------|
| 10–12 | Headings (h1, h2, h3) |
| 20 | Body text, links, lists, code, pre, blockquote, hr, table header colours (unified `.confluenceTable th` with !important on all properties) |
| 22 | pre code (reset inline code styles inside pre blocks) |
| 25 | Status macro (lozenge) styles |
| 28 | Panel outer wrapper (border-radius + overflow) |
| 30 | Panel body colours, text colour, padding |
| 50 | Table structure (.confluenceTable, .confluenceTable td), images |
