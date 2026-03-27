# HaloPSA Styling

Custom CSS for the HaloPSA Self-Service Portal and Knowledge Base articles, with full dark mode support and Confluence content styling.

Covers:
- Portal chrome (header, search, cards, buttons, footer)
- Knowledge Base article typography, tables, panels, status macros, and images
- Dark mode overrides for article content (Confluence panels, tables, status macros)
- Responsive layout fixes for mobile and tablet

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
| `self-service-portal.css` | Custom CSS: portal chrome, article light mode overrides, article dark mode overrides, responsive layout |
| `style-profile-rules.css` | Style Profile reference: each block maps to one HaloPSA Style Profile rule |
| `dark-mode-test-checklist.md` | Test checklist covering both portals, both modes, and responsive breakpoints |
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
│   ├── Tables (borders, rounded corners, header colours, zebra stripes)
│   ├── Confluence panels (per-type colours: info/note/warning/tip)
│   ├── Status macros (coloured pill badges)
│   ├── Images (fluid responsive, rounded corners)
│   └── Source: style-profile-rules.css → manual entry in HaloPSA UI
│
└── Custom CSS                        → Self-Service Portal ONLY
    ├── Section 1:  Font import (Montserrat via Google Fonts)
    ├── Section 2:  CSS variables (:root — light mode)
    ├── Section 3:  CSS variables (.theme-dark — dark mode)
    ├── Sections 4–8: Portal chrome (header, search, cards, buttons, footer)
    ├── Section 9:  Article light mode overrides (!important panel/status colours)
    ├── Section 10: Article dark mode overrides (.theme-dark .kbdetails ...)
    └── Section 11: Responsive layout (images, tables, mobile breakpoints)
```

---

## Dark Mode

HaloPSA adds `.theme-dark` to `div.app-container`, which is an **ancestor** of `.kbdetails`. This means Style Profile rules cannot target dark mode — a selector like `.theme-dark h1` becomes `.kbdetails .theme-dark h1` after auto-scoping, which never matches.

All dark mode article overrides are therefore in `self-service-portal.css` using `.theme-dark .kbdetails ...` selectors (Custom CSS, Self-Service Portal only).

The Agent Portal gets no dark mode article styling from this project — only HaloPSA's built-in dark rules apply there.

---

## Key Concepts

### Why `!important` is required on panel and status macro colours

Confluence exports panels and status macros with inline `style="background-color: ..."` attributes. Inline styles beat any stylesheet rule regardless of specificity. All panel background and status macro colour overrides use `!important`.

### Why `border-radius` goes on the outer wrapper

Confluence panel structure:
```
div.confluence-information-macro  ← outer wrapper (has the border-radius + overflow: hidden)
  div.confluence-information-macro-body  ← inner content (has the background-color)
```

Setting `border-radius` only on the inner element clips that element's own content but does not clip the outer wrapper's background. The outer wrapper needs `border-radius + overflow: hidden` to visually round the panel corners.

The same applies to generic `.panel` / `.panelContent` structures.

### Generic panels vs standard macro panels

- **Standard macros** (`.confluence-information-macro-information`, `-note`, `-warning`, `-tip`): have per-type colour rules in both Style Profiles and Custom CSS
- **Generic panels** (`.panel .panelContent`): keep whatever background Confluence exported. In dark mode, a `::before` overlay (50% black) darkens these while preserving the panel hue

### Why `@import` only works in Custom CSS

Style Profile rules are wrapped as `.kbdetails selector { properties }`. There is no way to insert an `@import` inside a property block, and browsers ignore `@import` after any rule has been declared. Custom CSS is a raw CSS field where `@import` at the top works normally.

---

## Adapting for Your Portal

1. Fork this repository
2. In `self-service-portal.css`, update the CSS variables in `:root` and `.theme-dark` to match your brand colours
3. In `style-profile-rules.css`, update the hardcoded colours (`#4088D4`, `#e9f2fe`, `#f0f1f2`) to your brand palette
4. Enable GitHub Pages and update the `@import` URL
5. Enter the Style Profile rules manually in HaloPSA

The font import (`Montserrat` via Google Fonts) can be swapped in Section 1 of `self-service-portal.css`. Note that the Style Profile rules also reference `'Montserrat', sans-serif` — update those too if you change fonts.
