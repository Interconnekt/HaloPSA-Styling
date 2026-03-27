# HaloPSA Styling

Custom CSS for the HaloPSA Self-Service Portal and Knowledge Base articles, with full dark mode support and Confluence content styling.

Covers:
- Portal chrome (header, search, cards, buttons, footer)
- Knowledge Base article typography, tables, panels, status macros, code blocks, blockquotes, lists, and images
- Dark mode overrides for article content (Confluence panels, tables, status macros, code, blockquotes)
- Responsive layout fixes for mobile and tablet
- Print styles for clean article output

---

## Requirements

- HaloPSA with the Knowledge Base module enabled
- Articles sourced from Confluence (classes like `.confluenceTable`, `.confluence-information-macro-*`, `.status-macro` must be present in your article HTML)
- A GitHub account with GitHub Pages enabled on this repository (for hosting the Custom CSS)

---

## How It Works

HaloPSA has two separate CSS injection points for Knowledge Base articles. This project uses both.

### Layer 1 — Style Profiles

**Applies to:** Self-Service Portal **and** Agent Portal
**Location:** Configuration > Knowledge Base > Style Profiles
**How it works:** HaloPSA wraps every rule you enter as `.kbdetails <selector> { <properties> }` and injects it as a `<style>` block. Rules cannot be imported from an external file — they must be entered manually in the UI.

`style-profile-rules.css` is the source of truth. Each block maps to one Style Profile entry:
- The comment header gives you the **Precedence** and **Selector** to enter
- The CSS properties are pasted into the **Style** field

### Layer 2 — Custom CSS

**Applies to:** Self-Service Portal **only**
**Location:** Configuration > Self Service Portal > Custom CSS
**How it works:** This field accepts a raw CSS block. Placing an `@import` at the top loads an external stylesheet.

The Custom CSS field in HaloPSA contains a single line:

```css
@import url('https://<your-github-username>.github.io/<your-repo>/self-service-portal.css');
```

`self-service-portal.css` is served via GitHub Pages. Edit the file, commit, push — changes are live within ~10 minutes.

---

## Files

| File | Purpose |
|------|---------|
| `self-service-portal.css` | Custom CSS: portal chrome, article light/dark mode overrides, code/blockquote/hr/list styling, responsive layout, print styles |
| `style-profile-rules.css` | Style Profile reference: each block maps to one HaloPSA Style Profile rule |
| `dark-mode-test-checklist.md` | Test checklist covering both portals, both modes, responsive breakpoints, and print |
| `AGENTS.md` | Instructions for AI agents working on this codebase |

---

## Deployment

### Custom CSS — GitHub Pages

1. Fork this repository
2. Enable GitHub Pages: Settings > Pages > Deploy from branch: `main` / root
3. Update the `@import` URL in `self-service-portal.css` to point to your hosted file
4. In HaloPSA: Configuration > Self Service Portal > Custom CSS — enter:
   ```css
   @import url('https://<your-github-username>.github.io/<your-repo>/self-service-portal.css');
   ```
5. To update: edit `self-service-portal.css`, commit, push. Live within ~10 minutes.

### Style Profiles — Manual Entry

1. Open `style-profile-rules.css`
2. For each block, create a new Style Profile entry in HaloPSA:
   - **Name:** anything descriptive
   - **Knowledge Base:** your KB
   - **Precedence:** as shown in the block comment
   - **Selector:** as shown in the block comment (do **not** include `.kbdetails` — HaloPSA adds it)
   - **Style:** the CSS properties from the block (everything below the comment header)

---

## Architecture

```
HaloPSA Styling Layers
│
├── Style Profiles                    → BOTH Self-Service Portal + Agent Portal
│   ├── Headings (no hardcoded colour — inherits theme)
│   ├── Tables (clean modern: thin borders, no border-radius, no zebra stripes)
│   ├── Confluence panels (per-type colours with left border accents)
│   ├── Status macros (coloured pill badges)
│   ├── Code (inline code pills, pre blocks with dark bg)
│   ├── Blockquotes (left border accent, light bg)
│   ├── Horizontal rules (thin, muted)
│   ├── Lists (consistent spacing, Montserrat font)
│   ├── Images (fluid responsive, rounded corners)
│   └── Source: style-profile-rules.css → manual entry in HaloPSA UI
│
└── Custom CSS                        → Self-Service Portal ONLY
    ├── Section 1:  Font import (Montserrat via Google Fonts) + CSS variables
    ├── Section 2:  Global typography
    ├── Sections 3–7: Portal chrome (header, search, cards, buttons, footer)
    ├── Section 8:  Desktop full width
    ├── Section 9:  Article light mode overrides (panels, tables, status, code, blockquote, hr, lists)
    ├── Section 10: Article dark mode overrides
    ├── Section 11: Responsive layout (images, tables, code, mobile breakpoints)
    └── Section 12: Print styles
```

---

## Dark Mode

HaloPSA adds `.theme-dark` to `div.app-container`, which is an **ancestor** of `.kbdetails`. This means Style Profile rules cannot target dark mode — a selector like `.theme-dark h1` becomes `.kbdetails .theme-dark h1` after auto-scoping, which never matches.

All dark mode article overrides are therefore in `self-service-portal.css` using `.theme-dark .kbdetails ...` selectors (Custom CSS, Self-Service Portal only).

The Agent Portal gets no dark mode article styling from this project — only HaloPSA's built-in dark rules apply there. Panel text uses explicit `color: #1a1d23 !important` (dark text on light panel backgrounds) to remain readable in both Agent Portal modes.

---

## Key Concepts

### Why `!important` is required on panel and status macro colours

Confluence exports panels and status macros with inline `style="background-color: ..."` attributes. Inline styles beat any stylesheet rule regardless of specificity. All panel background and status macro colour overrides use `!important`.

### Why `border-radius` goes on the outer wrapper

Confluence panel structure:
```
div.confluence-information-macro              ← outer wrapper: border-radius, overflow:hidden, border:none, border-left accent
  div.confluence-information-macro-body       ← inner content: background-color, text colour, padding
```

The outer wrapper gets `border: none !important` (kills Confluence's inline border), then per-type rules on the outer wrapper re-add just `border-left: 4px solid #xxx`. `overflow: hidden` clips the background to the `border-radius`. `padding: 0` ensures only the body has padding.

The same applies to generic `.panel` / `.panelContent` structures.

### Panel left border accents

Each panel type has a coloured left border accent (4px solid) on the **outer wrapper** (not the body):
- Info: blue (#2684ff)
- Note: amber (#ffab00)
- Warning/Error: red (#de350b)
- Tip/Success: green (#00875a)

The accent is on the outer wrapper so `overflow: hidden` doesn't clip it at rounded corners. `border: none !important` on both the base `.confluence-information-macro` and each per-type class kills Confluence's inline borders before re-adding just the left accent.

### Panel text colour

Panel body rules use `color: #1a1d23 !important` (explicit dark text) rather than `inherit`. This ensures readable text in the Agent Portal dark mode, where `inherit` resolves to an unset value (invisible text). The Self-Service Portal dark mode overrides this to `#ddd` in Custom CSS.

### Generic panels vs standard macro panels

- **Standard macros** (`.confluence-information-macro-information`, `-note`, `-warning`, `-tip`): have per-type colour rules with left border accents in both Style Profiles and Custom CSS
- **Generic panels** (`.panel .panelContent`): keep whatever background Confluence exported. In dark mode, a `::before` overlay (50% black) darkens these while preserving the panel hue

### Table design philosophy

Tables use a clean modern style: thin 1px borders, `border-collapse: collapse`, no border-radius, no alternating row colours. Header rows get a very subtle grey background (#f5f6f8) to differentiate them without visual noise. This approach follows modern design systems (Notion, Linear, GitHub).

### Why `@import` only works in Custom CSS

Style Profile rules are wrapped as `.kbdetails selector { properties }`. There is no way to insert an `@import` inside a property block, and browsers ignore `@import` after any rule has been declared. Custom CSS is a raw CSS field where `@import` at the top works normally.

---

## Adapting for Your Portal

1. Fork this repository
2. In `self-service-portal.css`, update the CSS variables in `:root` and `.theme-dark` to match your brand colours
3. In `style-profile-rules.css`, update the hardcoded colours (table header bg, panel border accents, link colour, blockquote border) to your brand palette
4. Enable GitHub Pages and update the `@import` URL
5. Enter the Style Profile rules manually in HaloPSA

The font import (`Montserrat` via Google Fonts) can be swapped in Section 1 of `self-service-portal.css`. Note that the Style Profile rules also reference `'Montserrat', sans-serif` — update those too if you change fonts.
