# Portal visual review — 8 September 2026

## Repository and deployment baseline

Local `main` was synced to `origin/main` at `2d7a029`. The live Worker stylesheet
matched the repository byte for byte (SHA-256
`326102953fffaafc814c49a70fae8dc6a39837ce4550798f6e0c3d4cd5de7108`).
That commit already includes the previous session's drawer, subtitle, tablet KB,
invoice wrapper, age-formatting and table-column stamping fixes.

This pass changes the live-source stylesheet and shim only. The legacy
`self-service-portal.css` and KB Style Profiles remain untouched. Merging this
branch to `main` publishes the changes; the browser checks below used temporary
CSS previews and did not deploy them.

## Findings fixed

- Status and priority stamps missed text updates inside reused elements. A label
  could change from New to Resolved or Low to Critical and retain its old colour.
  Observe character-data/replaced-label updates and clear classes for blank labels.
- The catalogue's actual H2 is an unclassed element under an `aria-live` wrapper,
  so the previous `.search-title` rule missed it. Correct its hierarchy, remove
  stock grey insets in service cards and theme the category navigation link.
- The catalogue has an extra wrapper literally carrying
  `classname="service-background"`. Include its container in the shared shell.
  At 1440px the heading now starts at 32px and four service cards fit across.
- The service detail description contains a request button inside `.page-subtitle`.
  The generic flex/uppercase subtitle treatment squeezed the text beside the
  button, which extended off the phone. Use body-copy styling and stack the action;
  remove the empty image column when the mobile artwork is hidden.
- KB/catalogue/approval search SVGs carried a near-black colour attribute. Use a
  theme token while retaining the home hero's accent-coloured search icon.
- Workflow labels ran together on phones, and the platform translated the strip
  22px upward into the card border. Give steps a minimum readable width, preserve
  horizontal scrolling, restore circle clearance and increase upcoming-label contrast.
- Approvals had another 20px title inset inside the page shell and a black refresh
  icon. Remove that inset and use theme text colours.
- Asset grids wrapped beside floated pagination controls, losing about 200px of
  available width. Clear those controls. At <=768px, rows with both asset-tag and
  asset-type column hooks become cards with identifying fields; clicking the card
  still opens the full record. Empty grids and other list families are not hidden.
- Dense three-column KB tables technically fitted phones but split short names
  into character fragments. Wrapped tables now have a 32rem minimum measure and
  scroll inside their existing `.table-wrap`; two-column tables still fit the card.
  Tables retain square edges, thin borders and no zebra stripes.

## Verification performed

The in-app session was Joel's. Jeremy's Chrome session was confirmed available,
but Chrome DevTools is blocked by organisation policy. No policy bypass was used.
Edge was also checked as a fallback: its portal session is Jacob Kino, not Jeremy.
The temporary Edge tab was closed, restoring the user's previous tab.

| Surface | Checks completed this session |
| --- | --- |
| KB article 32 | 1440px light/dark; 834px tablet columns; 390px light/dark; 320px light. Two-column table fits; dense table scrolls to its final column; no page overflow. |
| Service catalogue | Category picker and item list on phone; item list at 1440px in both themes. H2 hierarchy, dark surfaces/link, shared shell and four-card desktop row checked. |
| Service detail / onboarding | 390px light/dark and 320px light; request button entirely visible. Opening the action still reveals the form. 834px light form and 390px dark form inspected. Date picker fits in light and dark. No form submitted. |
| Change-request ticket 348093 | 1440px light/dark, 834px thread layout, 390px light/dark workflow. Final workflow step reachable by scrolling; no phone page overflow. Same-origin email frames receive Figtree and the intentional white reading surface. |
| Assets (`/assets?btn=59`) | 390px light/dark cards, 320px pagination into new rows, asset detail navigation, 834px full-width scrolling table. Phone page width stayed 320/390px. |
| Approvals | 390px light/dark empty state, corrected heading inset and refresh control. Populated approvals remain pending. |
| Dashboards | Phone listing; dashboard 1012 at phone and desktop widths. Actual saved Halo PSA Dark correctly repaints widget labels and canvas legends; no chart colour change was made. |
| Settings | Actual application theme saved to Dark for chart verification, then restored to Halo PSA Standard; Save returned disabled after restoration. |
| JavaScript | `node --check Portal/iframe-theme.js`; all ten browser regression checks in `tests/chip-updates.html` passed. |
| Patch integrity | `git diff --check` passed. No customer tickets, approvals, assets or requests were modified. |

CSS previews were applied with `CSS.setStyleSheetText` to the imported stylesheet.
Simply adding a style tag to the head can lose to Halo's later stylesheet on equal
specificity, so that is insufficient for final verification. Phone testing used
matching `innerWidth`, `outerWidth` and screen metrics; innerWidth alone does not
trigger Halo's mobile navigation consistently.

For canvas/chart testing, toggling `.theme-dark` alone is insufficient: Halo uses
its application setting when drawing chart text. A class-only preview initially
showed black legends, but the real Dark setting rendered them correctly. Do not
add a white chart background based on that false positive.

## Remaining work requiring Jeremy's session

The in-app browser still needed switching to Jeremy at the end of this pass.
Do not consider the complete cross-account sweep finished:

- Review IDA's populated approvals, projects and broader ticket/opportunity types.
- Recheck Jeremy's invoice list and payment controls at desktop, tablet and phone
  widths without invoking payment actions.
- Cover the ticket list's alternate Tile/Kanban views using Jeremy's available data.
- Recheck these fixes after merge and Worker cache expiry.

Some assets in the available source data have no tag/name. Their detail heading is
therefore blank. The responsive cards retain the type and serial number for
identification; asset data was not edited as part of a styling review.

## Running the regression fixture

Serve this repository over HTTP, then open
`/Portal/tests/chip-updates.html`. It exercises initial stamping, in-place text
updates, replaced labels, unknown/blank labels, unrelated text and new rows using
synthetic data only. All ten lines should read PASS.
