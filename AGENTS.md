# Agent Instructions — HaloPSA Styling

This file provides context for AI agents working on this repository.

---

## What This Repo Does

CSS styling for a HaloPSA Self-Service Portal and Knowledge Base articles. Articles are sourced from Confluence, so the HTML contains Confluence-specific class names.

There are **two separate CSS layers** in HaloPSA, each with different deployment mechanics and scope.

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
- **Deployment:** Edit `self-service-portal.css`, commit, push to GitHub → served via GitHub Pages → live in ~10 minutes
- **Not auto-scoped:** Selectors are used exactly as written
- **HaloPSA field contains:** A single `@import url('...')` line pointing to the GitHub Pages URL
- **Source:** `self-service-portal.css`

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

**Rule:** All dark mode overrides must be in `self-service-portal.css` using `.theme-dark .kbdetails ...` selectors.

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

Confluence ADF defines 6 panel types. When exported to HaloPSA, they map to CSS classes as follows:

| ADF Panel Type | Confluence CSS Class | Background | Border-left |
|----------------|---------------------|------------|-------------|
| Info | `.confluence-information-macro-information` | #eaf2fd (blue) | #2684ff |
| Note | `.confluence-information-macro-note` | #f7eefd (purple) | #6554c0 |
| Error | `.confluence-information-macro-warning` | #fcedec (red) | #de350b |
| Success/Tip | `.confluence-information-macro-tip` | #e3fef2 (green) | #00875a |
| Warning | _(none -- uses Confluence inline styles)_ | #fdf7cd (yellow) | inline |
| Custom | _(none -- uses Confluence inline styles)_ | #ebf9fe (teal) | inline |

**Legacy naming quirk:** ADF "error" panels render with the `.confluence-information-macro-warning` class, not `-error`. This is a legacy Confluence naming convention -- the class name says "warning" but the panel is visually red/error.

**Fallback rules:** The Style Profile and Custom CSS include rules for `.confluence-information-macro-error` (red) and `.confluence-information-macro-success` (green) as fallbacks, in case Confluence ever uses these class names directly. They duplicate the error and tip colours respectively.

**ADF Warning and Custom panels:** These two panel types rely entirely on Confluence inline styles (yellow #fdf7cd and teal #ebf9fe). No Style Profile or Custom CSS override is needed for them -- they render correctly out of the box. In dark mode, the generic panel `::before` overlay handles darkening.

**Catch-all body border reset:** A rule targeting `.confluence-information-macro-body` with `border: none !important` is applied across all panel types. This kills any secondary borders Confluence adds to the inner content div, regardless of panel type. Every per-type `-body` rule also includes `border: none !important`.

- **Standard Confluence macros** (`.confluence-information-macro-information`, `-note`, `-warning`, `-tip`, plus fallbacks `-error`, `-success`) get explicit per-type colour rules on the body and left border accents on the outer wrapper. Each per-type wrapper has `border: none !important; border-left: 4px solid #xxx !important`. Each per-type body rule has `border: none !important`.
- **Generic panels** use `.panel` / `.panelContent` and carry whatever background Confluence exported inline. In dark mode, a `::before` overlay (`rgba(10,10,10,0.50)`) darkens these while preserving the hue, since there's no standard class to target for recolouring.

### 5. Agent Portal dark mode has no article styling from this project

Custom CSS applies only to the Self-Service Portal. The Agent Portal gets Style Profile rules (light mode article styles only). Dark mode in the Agent Portal relies on HaloPSA's built-in `.theme-dark` rules. Panel text uses explicit `color: #1a1d23 !important` (dark text) rather than `inherit` — this ensures readable text on the light-coloured panel backgrounds in both Agent Portal modes. The Self-Service Portal dark mode overrides this to `#ddd` in Custom CSS.

### 6. Font loading gap in Agent Portal

The Google Fonts `@import` for Montserrat is in `self-service-portal.css` (Custom CSS), which only loads in the Self-Service Portal. Style Profile rules reference `font-family: 'Montserrat', sans-serif` — in the Agent Portal this falls back to `sans-serif` unless HaloPSA's theme independently loads Montserrat.

### 7. Tables use clean modern styling — no border-radius, no zebra stripes

Tables deliberately have no `border-radius`, no `overflow: hidden`, and no alternating row colours. They use `border-collapse: collapse` with thin 1px borders. This is intentional design following modern KB systems (Notion, Linear, GitHub). Do not re-add border-radius or zebra stripes.

### 8. Code blocks use a dark theme regardless of portal mode

Both inline `code` and `pre` blocks use a dark background with light text (Catppuccin-inspired). This provides consistent code appearance and good contrast in both light and dark portal modes. The dark mode overrides adjust the inline code pill styling but leave pre blocks largely unchanged.

---

## Making Changes

### Changing Custom CSS (portal chrome, dark mode overrides)

1. Edit `self-service-portal.css`
2. Commit and push
3. GitHub Pages serves the updated file within ~10 minutes

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

`self-service-portal.css` uses CSS custom properties for all colours. Two variable sets:

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
