# Brand assets for the PDF templates

Copies of the 2026 lockup, committed here so the PDF templates have a
logo URL that actually loads.

## Why these are not linked from interconnekt.com.au

`docs/reference/brand-assets.md` in `Interconnekt/Website` names
`https://interconnekt.com.au/brand/2026/...` as the definitive web
reference for the logo set. Those URLs cannot be used here, because the
site serves them with:

    cross-origin-resource-policy: same-site

CORP `same-site` tells a browser to refuse the resource when the
embedding document is on another site. A HaloPSA PDF template, a local
mockup opened over `file://`, an email signature and a partner site are
all cross-site, so the image is blocked and the logo renders as a broken
image. Verified 2026-09-01: the URL returns HTTP 200 to `curl` and is
blocked in Chrome.

GitHub Pages serves this directory with `access-control-allow-origin: *`
and no CORP header, so these copies embed anywhere.

**This is a workaround, not the intended architecture.** If the Website
team drops CORP (or sets `cross-origin` for `/brand/2026/`), point the
templates back at the canonical URLs and delete this directory.

## Which file goes where

| File | Use |
|---|---|
| `Interconnekt-lockup-h-neg-800.png` | The navy `#30355b` header band. Reversed ink, transparent ground. 800px wide covers the 240px slot at print resolution. |
| `Interconnekt-lockup-h-neg.svg` | Source of truth for the same artboard. Not referenced by the templates: wkhtmltopdf's SVG support in CSS backgrounds is unreliable, so the PNG is used. Kept for future renderers. |

Do not add a padded or `ondark` variant here. `lockup-h-neg-ondark` bakes
in a `#313340` tile, which would show as a mismatched rectangle on the
`#30355b` band.

## How the templates reference them

- `header.html` (deployed to HaloPSA) uses the absolute GitHub Pages URL,
  because HaloPSA's renderer fetches it remotely.
- `mockup.html` (review only, opened as a local file) uses a relative
  path, so mockups render offline and before the branch merges.

Re-download from the canonical URLs if the artwork changes; do not edit
these in place.
