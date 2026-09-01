# Brand assets for the PDF mockups

A copy of the 2026 reversed lockup, used **only by the `mockup.html`
preview files**.

## Who uses what

| File | Logo source | Why |
|---|---|---|
| `header.html` (deployed to HaloPSA) | `$ORLOGOSRC` | HaloPSA's org logo merge field, which now serves the 2026 mark. The renderer resolves it server side, so it needs no URL and never breaks. |
| `mockup.html` (local review only) | `../_brand/Interconnekt-lockup-h-neg-800.png` | A merge field cannot resolve in a file opened directly in a browser, so the mockups need a real image. |

## Why the mockups do not link interconnekt.com.au

`docs/reference/brand-assets.md` in `Interconnekt/Website` names
`https://interconnekt.com.au/brand/2026/...` as the definitive web
reference for the logo set. A mockup cannot use those URLs, because the
site serves them with:

    cross-origin-resource-policy: same-site

CORP `same-site` tells a browser to refuse the resource when the
embedding document is on another site. A mockup opened over `file://` is
cross-site, so the image is blocked and the logo renders broken.
Verified 2026-09-01: the URL returns HTTP 200 to `curl` and is blocked in
Chrome. The same applies to email signatures, partner directories and
anything else off-domain, so it is worth fixing at the source; until
then, a local copy is the only thing that renders.

## Which file

`Interconnekt-lockup-h-neg-800.png` is the reversed lockup on a
transparent ground, for the dark header band. The `.svg` of the same
artboard sits alongside as the source of truth but is not referenced.

Do not add a padded or `ondark` variant. `lockup-h-neg-ondark` bakes in a
`#313340` tile, which would show as a mismatched rectangle on the band.

Re-download from the canonical URLs if the artwork changes; do not edit
these in place.
