# Email iframe theming — open problem

Status: **unresolved on the end-user portal.** Works on the agent side (where `iframe-theme.js` is already loaded). Captured here so we can revisit without re-doing the discovery.

---

## The problem

HaloPSA renders email bodies on the ticket view inside `<iframe class="halo-html-renderer">` — a same-origin iframe with its own `<style>` tag setting Segoe UI and default HTML link colours. Host-document CSS does not cross the iframe boundary, so no amount of `self-service-portal.css` work can theme email bodies.

The fix is `iframe-theme.js` (in this directory): a small IIFE that reaches into the iframe's document and injects a `<style>` tag with Montserrat + `#3598db` link colour. It uses a `MutationObserver` and per-iframe `load` handlers to catch ticket-switch navigation and action-history expansion.

**The shim works** — verified by manually injecting it via DevTools on a ticket view. Email body re-renders in Montserrat, links turn blue.

**The gap**: there is no obvious way to get the shim loaded automatically on the end-user Self-Service Portal. The agent application has a script-injection config field; the portal does not.

---

## What we tried / researched

### 1. Native HaloPSA admin fields

Exhaustive sweep of documented portal customisation settings. Confirmed fields:

| Field | Location | Accepts `<script>`? |
|-------|----------|---------------------|
| Custom CSS | Config → Self-Service Portal → Custom CSS | No — CSS only |
| Custom HTML Banner | Config → Self-Service Portal → Home Screen → "Display custom HTML" | Probably yes (raw HTML), **but home-page only** |
| Custom HTML Pages | `{portal}/custom?id=[ID]` | Yes, but standalone pages — not chrome |
| Google Analytics | Config → Self-Service Portal | Measurement ID only, not raw script |

**No "Custom JavaScript" field exists.** This was confirmed by (a) walking the FAQ index at [usehalo.com/faq-list/portal-customisation-self-service-portal/](https://usehalo.com/faq-list/portal-customisation-self-service-portal/), and (b) the community workaround (kbni's [HaloPSA tweaks gist](https://gist.github.com/kbni/cc7f55ed353654cc5d35a235b0ea4c5f)) being a Tampermonkey userscript — strong signal there's no server-side injection point.

The **Custom HTML Banner** is the only raw-HTML field that *might* work, but it loads only on the home page (`/`). The portal is a SPA so the script would persist in memory once loaded — but users who deep-link from email notifications straight to `/ticket?id=…` never hit home, so the script never loads for that session. Unacceptable gap for the use case (email bodies are on ticket view, which is exactly where deep-links land).

### 2. Tampermonkey / userscript

Would fix it for internal staff who install the extension. Does nothing for external customers. Rejected — doesn't solve the brand-consistency problem for end-users.

### 3. Feature request to HaloPSA

A "Custom JavaScript" admin field is a reasonable ask. No existing ideas.halopsa.com request covers it directly — would need a fresh submission. Indefinite timeline; not a near-term path.

### 4. Cloudflare Worker reverse proxy — **recommended path if/when we pursue**

See below.

---

## Recommended path: Cloudflare Worker

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

DNS for `portal.interconnekt.com.au` moves behind Cloudflare. A Worker sits on the edge, inspects every response, and for `text/html` responses injects a single `<script>` tag before `</body>`. Halo is untouched — from its perspective, requests still arrive over HTTPS as normal.

### Why this works where the other options don't

- Runs on **every** page load, regardless of route or deep-link — no SPA / home-page-only gap.
- Doesn't depend on any HaloPSA config field we don't have.
- Worker is easily disabled (Cloudflare dashboard toggle → 30-second rollback to direct-to-Halo DNS).
- Adds single-digit ms latency via Cloudflare's streaming `HTMLRewriter`.

### The Worker code

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
| Our time, one-off | ~1–2 hours if familiar with Cloudflare; 3–4 hours first-time |
| Our time, ongoing | ~0–1 hour/year |

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

Cloudflare's "Pause Cloudflare on Site" toggle disables the proxy in ~30 seconds — DNS routes directly to Halo, Worker is out of the path. This is the escape hatch if anything unexpected surfaces post-cutover.

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
| 2026-04 | Deferred — accept Segoe UI email bodies for end-users for now | Cosmetic-only; Cloudflare Worker infra not justified by a single script. Path documented here for future reactivation. |
| 2026-04-19 | **Reactivated — queued for completion.** Cloudflare Worker reverse-proxy is the chosen path. | Multiple `iframe-theme.js` features now live in the repo and depend on JS being injected into the SSP: On-Hold pill stamping (home tiles + ticket sidebar), status / priority class stamping, ticket-list `Age` column 2dp formatting, and email-body Montserrat injection. All shipped to the repo but inert on the SSP without a delivery mechanism. The Worker also unlocks future script-injection needs (analytics, feature flags) without a per-feature deploy story. |

---

## Implementation checklist (Cloudflare Worker)

Tracked here as the actionable task. Tick off as completed.

- [ ] Confirm Entra app registration's redirect URI hostname is `portal.interconnekt.com.au/...`
- [ ] Stand up `portal-staging.interconnekt.com.au` → Halo origin via Cloudflare + Worker
- [ ] Ask HaloPSA to register the staging hostname as an additional portal URL
- [ ] Add staging hostname as an additional redirect URI in Entra
- [ ] Test full login + 1-hour token refresh + logout cycle on staging
- [ ] Verify `iframe-theme.js` features fire on staging: email Montserrat, On-Hold pill on home `.main-tile-item`, On-Hold pill in ticket sidebar `.details-form`, Age column 2dp, status pill class stamping
- [ ] Confirm Worker bypasses non-HTML responses (`/api/*`, token endpoints) — check Cloudflare analytics for transformed-vs-passthrough split
- [ ] Production DNS cutover (weekend / low-traffic window)
- [ ] Post-cutover smoke test: log in, open a ticket with an email body, verify SLA-paused ticket shows red On-Hold pill on home + sidebar
- [ ] Document the kill-switch procedure (Cloudflare "Pause Cloudflare on Site" toggle) in this file's runbook section
