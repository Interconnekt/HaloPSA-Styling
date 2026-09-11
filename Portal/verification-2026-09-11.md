# KB sidebar and live deployment verification — 11 September 2026

The fixed KB tree used viewport-relative Bootstrap sizing while the article
used 30% of the capped page container as its left margin. At a measured
1968px viewport, the tree was 490.25px wide and crossed the article column
by 53.45px. The width preview capped it at 436.80px, exactly the space
allocated to the sidebar. The cap applies only above the existing 768px
mobile breakpoint and preserves narrower laptop sizing.

The CSS correction is commit `e8dd57b`. Live delivery did not update after
GitHub Pages published it: the active Worker had used bundled `ASSETS`
since 5 September, while the repository still described a GitHub Pages
proxy. Commit `c2d7265` reconciles the Worker source and configuration with
the deployed asset behaviour, including its ETag handling, and adds an
asset-build step before dev/deploy. The current repository CSS and shim
were then deployed together.

Cloudflare version: `317bc881-8bd9-46c3-9a6e-95a1ce823ba6`.
Previous version: `93318509-ce31-412a-a60f-48c801dd7b31`.

Verification completed:

- Asset tests: source/bundle equality, GET and HEAD, strong/weak/list/wildcard
  ETag revalidation, rejected methods, unknown assets and unavailable storage.
- Worker dry run, JavaScript syntax checks and `git diff --check` passed.
- All production smoke checks passed, including exact equality of both live
  assets to repository sources, single script injection, unchanged iframe/API
  responses, cache headers and asset error responses.
- Chrome article 37: search and selected navigation rows fit beside the
  article at normal 100% zoom and at 50% zoom, which exercises a wider CSS
  viewport and the capped page shell. Zoom restored to 100% afterwards.
- This continuation did not perform a fresh phone or dark-mode visual pass.

For subsequent CSS/shim changes, merge the source, run `npm run deploy` in
`Portal/worker/`, then `npm run smoke:prod`. GitHub Pages alone updates only
the fallback copy. The smoke checks now reject a stale bundled stylesheet
or shim even when the endpoint returns HTTP 200.
