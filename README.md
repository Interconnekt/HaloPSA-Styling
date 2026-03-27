# HaloPSA Styling — Interconnekt

CSS styling for the HaloPSA Self-Service Portal and Knowledge Base articles.

---

## Files

| File | Purpose |
|---|---|
| `self-service-portal.css` | Custom CSS for the Self-Service Portal (portal chrome + article dark mode overrides + light mode panel/status fixes) |
| `style-profile-rules.css` | Reference file for Style Profile rules — each block maps to one rule in HaloPSA |
| `dark-mode-test-checklist.md` | Test checklist for verifying all styling in both portals, both modes, and responsive breakpoints |

---

## Deployment

### Custom CSS (Self-Service Portal)

Hosted via GitHub Pages. The HaloPSA Custom CSS field contains a single import:

```css
@import url('https://interconnekt.github.io/HaloPSA-Styling/self-service-portal.css');
```

**Location in HaloPSA:** Configuration > Self Service Portal > Custom CSS

To update: edit `self-service-portal.css`, commit, push. Changes go live within ~10 minutes (GitHub Pages CDN cache).

### Style Profiles (Both Portals)

`style-profile-rules.css` is the **source of truth** but cannot be imported — HaloPSA Style Profile rules must be entered manually in the UI.

**Location in HaloPSA:** Configuration > Knowledge Base > Style Profiles

Each block in `style-profile-rules.css` maps to one Style Profile entry:
- The comment header shows the **Precedence** and **Selector** to enter
- The CSS properties below are pasted into the **Style** field

> Style Profiles auto-scope all selectors under `.kbdetails`. Do not include `.kbdetails` in the Selector field — HaloPSA adds it automatically.

---

## Why `@import` only works for Custom CSS

Style Profile rules are wrapped by HaloPSA as `.kbdetails selector { [your properties] }`. There is no way to include `@import` inside a CSS property block, and browsers ignore `@import` once any rule has been declared. Custom CSS is a raw CSS field where `@import` at the top of the file is fully supported.

---

## Architecture

```
HaloPSA Styling Layers
│
├── Style Profiles          → applies to BOTH Self-Service Portal + Agent Portal
│   ├── Light mode article styles (headings, tables, panels, status macros, images)
│   └── Source: style-profile-rules.css (manual entry in HaloPSA UI)
│
└── Custom CSS              → applies to Self-Service Portal ONLY
    ├── Portal chrome (header, search, cards, buttons, footer)
    ├── Article light mode overrides (!important to beat Confluence inline styles)
    ├── Article dark mode overrides (.theme-dark .kbdetails ...)
    ├── Responsive fixes
    └── Served via: https://interconnekt.github.io/HaloPSA-Styling/self-service-portal.css
```

## Dark Mode

HaloPSA adds `.theme-dark` to `div.app-container` (ancestor of `.kbdetails`).
Style Profile selectors cannot reference `.theme-dark` as an ancestor — all dark mode article overrides live in `self-service-portal.css` using `.theme-dark .kbdetails ...` selectors.

## Confluence Article

Full architecture documentation: https://interconnekt.atlassian.net/wiki/spaces/IN/pages/3764748294
