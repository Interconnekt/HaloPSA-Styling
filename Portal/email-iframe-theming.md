# Email iframe theming, open problem

Status: **Worker built and smoke-tested on 2026-09-02; awaiting deploy and DNS cutover.** The runbook is `worker/README.md`. The agent side already loads `iframe-theme.js` through its script-injection field; this document covers the end-user portal, where that field does not exist.

---

## The problem

HaloPSA renders email bodies on the ticket view inside `<iframe class="halo-html-renderer">`, a same-origin iframe with its own `<style>` tag setting Segoe UI and default HTML link colours. Host-document CSS does not cross the iframe boundary, so no amount of `self-service-portal.css` work can theme email bodies.

The fix is `iframe-theme.js` (in this directory): a small IIFE that reaches into the iframe's document and injects a `<style>` tag with Figtree + `#3355D8` link colour, plus overflow containment so fixed-width email reflows to the card instead of being clipped. It uses a `MutationObserver` and per-iframe `load` handlers to catch ticket-switch navigation and action-history expansion.

## Why overflow containment has to live here too

Forwarded marketing email is built as fixed-width nested tables. A
monday.com newsletter on ticket 358840 measured **4407px of content
inside a 641px iframe**, so the message was clipped at the card edge
with no way to reach the rest.

That cannot be fixed from `self-service-portal-design.css`. CSS does not
cross a document boundary, even a same-origin one, so no host rule can
ever reach inside `iframe.halo-html-renderer`. The only lever is a style
element injected into the iframe's own document, which is what this shim
does, and which means the fix is inert until the Worker ships.

Verified by injecting it manually on that ticket: content width went
from 4407px to 642px, so it genuinely reflows rather than merely
becoming scrollable. `overflow-x: auto` remains as the backstop for
content that still cannot reflow, such as a wide inline image.

**The shim works**, verified by manually injecting it via DevTools on a ticket view. Email body re-renders in Figtree, links turn blue.

**The gap**: there is no obvious way to get the shim loaded automatically on the end-user Self-Service Portal. The agent application has a script-injection config field; the portal does not.

---

## What we tried / researched

### 1. Native HaloPSA admin fields

Exhaustive sweep of documented portal customisation settings. Confirmed fields:

| Field | Location | Accepts `<script>`? |
|-------|----------|---------------------|
| Custom CSS | Config → Self-Service Portal → Custom CSS | No, CSS only |
| Custom HTML Banner | Config → Self-Service Portal → Home Screen → "Display custom HTML" | Probably yes (raw HTML), **but home-page only** |
| Custom HTML Pages | `{portal}/custom?id=[ID]` | Yes, but standalone pages, not chrome |
| Google Analytics | Config → Self-Service Portal | Measurement ID only, not raw script |

**No "Custom JavaScript" field exists.** This was confirmed by (a) walking the FAQ index at [usehalo.com/faq-list/portal-customisation-self-service-portal/](https://usehalo.com/faq-list/portal-customisation-self-service-portal/), and (b) the community workaround (kbni's [HaloPSA tweaks gist](https://gist.github.com/kbni/cc7f55ed353654cc5d35a235b0ea4c5f)) being a Tampermonkey userscript, strong signal there's no server-side injection point.

The **Custom HTML Banner** is the only raw-HTML field that *might* work, but it loads only on the home page (`/`). The portal is a SPA so the script would persist in memory once loaded, but users who deep-link from email notifications straight to `/ticket?id=…` never hit home, so the script never loads for that session. Unacceptable gap for the use case (email bodies are on ticket view, which is exactly where deep-links land).

### 2. Tampermonkey / userscript

Would fix it for internal staff who install the extension. Does nothing for external customers. Rejected, doesn't solve the brand-consistency problem for end-users.

### 3. Feature request to HaloPSA

A "Custom JavaScript" admin field is a reasonable ask. No existing ideas.halopsa.com request covers it directly, would need a fresh submission. Indefinite timeline; not a near-term path.

### 4. Cloudflare Worker reverse proxy, **recommended path if/when we pursue**

See below.

---

## Recommended path: Cloudflare Worker

Implemented in [`worker/`](worker/README.md) on 2026-09-02. The sections below are the design it was built from; the README is the runbook for deploying, cutting over and rolling back.

### Architecture

```
User browser
     │
     ▼
DNS (portal.interconnekt.com.au) ──► Cloudflare edge
                                          │
                                          ▼
                                     Worker intercepts
                                     HTML responses,
                                     injects <script> tag
                                          │
                                          ▼
                                     HaloPSA origin (unchanged)
```

DNS for `portal.interconnekt.com.au` moves behind Cloudflare. A Worker sits on the edge, inspects every response, and for `text/html` responses injects a single `<script>` tag before `</body>`. Halo is untouched, from its perspective, requests still arrive over HTTPS as normal.

### Why this works where the other options don't

- Runs on **every** page load, regardless of route or deep-link, no SPA / home-page-only gap.
- Doesn't depend on any HaloPSA config field we don't have.
- Worker is easily disabled (Cloudflare dashboard toggle → 30-second rollback to direct-to-Halo DNS).
- Adds single-digit ms latency via Cloudflare's streaming `HTMLRewriter`.

### The Worker code

The live source is `worker/src/index.js`. It is the sketch below plus four things the sketch left out: a `/__interconnekt/` path that serves the stylesheet and the shim from GitHub Pages with a 60 second TTL (the "proxy the asset through the Worker" option from the 2026-09-02 handoff), a `Sec-Fetch-Dest: document` guard so HTML loaded into `iframe.halo-html-renderer` by URL is not injected a second time, a bypass for WebSocket upgrades and non-2xx pages, and an `x-interconnekt-worker` response header that says which branch handled a request. `worker/test/smoke.mjs` proves all of it against the real origin without a login.

```js
export default {
  async fetch(request, env) {
    const response = await fetch(request);
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return response;

    return new HTMLRewriter()
      .on('body', {
        element(el) {
          el.append(
            '<script src="https://interconnekt.github.io/HaloPSA-Styling/Portal/iframe-theme.js"></script>',
            { html: true }
          );
        },
      })
      .transform(response);
  },
};
```

The `content-type` check is the safety net: token endpoints, `/api/*`, and XHR responses are JSON, so the Worker short-circuits without touching them. Only HTML page shells get the injection.

### Costs

| Item | Cost |
|------|------|
| Cloudflare DNS | Free |
| Workers Free plan | $0, 100,000 req/day hard cap |
| Workers Paid plan | $5/month, 10M req/month, then $0.30/M |
| Cloudflare SSL (edge + origin cert) | Free |
| Our time, one-off | ~1-2 hours if familiar with Cloudflare; 3-4 hours first-time |
| Our time, ongoing | ~0-1 hour/year |

For an Interconnekt-sized portal (est. <500K req/month), the Free tier is plenty.

### Risk: SSO (Entra) compatibility

Entra SSO is unlikely to break because:

- OIDC/SAML flows are HTTPS redirects between Halo backend and `login.microsoftonline.com`. Cloudflare transparently proxies these; it doesn't terminate SSO, doesn't see passwords, doesn't touch the token exchange.
- Token endpoints return JSON. The Worker's `content-type` filter means they bypass the HTML rewriter entirely.
- The user-visible hostname (`portal.interconnekt.com.au`) doesn't change, so the Entra app's registered redirect URI remains valid.
- TLS remains end-to-end (origin → Cloudflare → user); `Secure` cookies and `SameSite` flags keep working.

### Pre-flight checks before cutover

1. Confirm the Entra app registration's redirect URI hostname (should be `portal.interconnekt.com.au/...`).
2. Stand up `portal-staging.interconnekt.com.au` → Halo via Cloudflare + Worker.
3. Ask HaloPSA to register the staging hostname as an additional portal URL.
4. Add staging hostname as an additional redirect URI in Entra.
5. Test a full login + 1-hour token refresh + logout cycle on staging.
6. Only then flip production DNS (weekend / low-traffic window).

### Kill switch

Cloudflare's "Pause Cloudflare on Site" toggle disables the proxy in ~30 seconds, DNS routes directly to Halo, Worker is out of the path. This is the escape hatch if anything unexpected surfaces post-cutover.

### Honest assessment

For one cosmetic script affecting email-body typography, this is **arguably overkill**. It's introducing a permanent infra layer (DNS-through-Cloudflare + a Worker) for a visual polish problem.

Worth it if **any** of:

- We foresee more script-injection needs on the portal (analytics, feature flags, tracking, further tweaks)
- External customer-facing email rendering in Segoe UI is a visible brand issue worth fixing
- We already want Cloudflare for other reasons (WAF, DDoS, caching, edge analytics)

If none of the above hold, accepting the default Segoe UI for end-user email bodies is the honest call. Revisit if priorities shift.

---

## Decision log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04 | Deferred, accept Segoe UI email bodies for end-users for now | Cosmetic-only; Cloudflare Worker infra not justified by a single script. Path documented here for future reactivation. |
| 2026-04-19 | **Reactivated, queued for completion.** Cloudflare Worker reverse-proxy is the chosen path. | Multiple `iframe-theme.js` features now live in the repo and depend on JS being injected into the SSP: On-Hold pill stamping (home tiles + ticket sidebar), status / priority class stamping, ticket-list `Age` column 2dp formatting, and email-body Montserrat injection. All shipped to the repo but inert on the SSP without a delivery mechanism. The Worker also unlocks future script-injection needs (analytics, feature flags) without a per-feature deploy story. |
| 2026-09-02 | **Built.** Worker, wrangler config, smoke test and runbook landed in `worker/`. Stylesheet delivery moves to the Worker path (option 1 of the handoff: proxy the asset, short TTL) once the Custom CSS `@import` is repointed after cutover. | DNS for `interconnekt.com.au` moved to Cloudflare, which was the only blocker. Local `wrangler dev` against the real HaloPSA origin passed every smoke check: injection on page shells and deep links, passthrough for JSON, static chunks, iframe-destined HTML and non-2xx pages, assets with ETag revalidation. Deploy and cutover need Cloudflare credentials on the machine doing it. |

---

## Implementation checklist (Cloudflare Worker)

Tracked here as the actionable task. Tick off as completed.

- [x] Worker written, with a `content-type` and `Sec-Fetch-Dest` safety net so only top-level HTML is touched (`worker/src/index.js`)
- [x] Worker bypasses non-HTML responses: proven by `worker/test/smoke.mjs` against the real origin (`/auth/token` JSON, static chunks, HaloPSA 404 page all pass through untouched)
- [x] Kill-switch procedure documented (`worker/README.md`, three levels: delete the route, unproxy the record, pause the zone)
- [x] Stylesheet delivery decision made: proxy through the Worker at `/__interconnekt/` with a 60 second TTL, switch the Custom CSS `@import` after cutover
- [ ] `npx wrangler login` (or `CLOUDFLARE_API_TOKEN`) on the deploying machine, then `npm run deploy` in `worker/`
- [ ] Confirm the zone settings listed in `worker/README.md` (SSL Full strict, Rocket Loader off, Email Obfuscation off, Workers plan cap)
- [ ] Confirm the Entra app registration redirect URI hostname is `portal.interconnekt.com.au/...` (unchanged by the cutover, but check)
- [ ] Decide whether to skip the staging hostname. `worker/README.md` explains why the smoke test covers the unauthenticated half and why the login cycle can only be proven on the real hostname
- [ ] Production cutover: set the `portal` DNS record to Proxied in a low-traffic window
- [ ] Post-cutover checks from `worker/README.md`: `curl` for `cf-ray` and `x-interconnekt-worker: html-injected`, `npm run smoke:prod`, then log in and verify email reflow on ticket 358840, the `Age` column, the On-Hold pill on home and sidebar, status and priority pills, logout and login, one-hour token refresh
- [ ] Repoint the HaloPSA Custom CSS `@import` at `https://portal.interconnekt.com.au/__interconnekt/self-service-portal-design.css`
