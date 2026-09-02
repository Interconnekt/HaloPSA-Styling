# Portal edge Worker

Cloudflare Worker for `portal.interconnekt.com.au`. It is the delivery
mechanism for `Portal/iframe-theme.js` on the Self-Service Portal, which
HaloPSA gives us no other way to load, and it serves the stylesheet with a
one minute cache instead of GitHub Pages' ten minutes.

Background, the options that were ruled out and the decision log live in
[`../email-iframe-theming.md`](../email-iframe-theming.md). This file is
the runbook.

## What it does

Every request to the portal hostname passes through `src/index.js`:

| Request | What happens | `x-interconnekt-worker` header |
|---|---|---|
| Top-level HTML page (any route, including deep links) | Fetched from HaloPSA, one `<script src="/__interconnekt/iframe-theme.js">` appended to `<body>` with HTMLRewriter | `html-injected` |
| Anything else from HaloPSA (JSON, static chunks, redirects, WebSocket upgrades, HTML requested by an iframe, non-2xx pages) | Passed through untouched | `passthrough` |
| `/__interconnekt/self-service-portal-design.css` and `/__interconnekt/iframe-theme.js` | Fetched from GitHub Pages, cached at the edge for 60s, served with `max-age=60, stale-while-revalidate=540` and the upstream ETag (304 on revalidation) | `asset` |

The header is there so `curl -I` tells you which branch handled a request.

Only top-level documents get the script: the `content-type` must be
`text/html` and, when the browser sends `Sec-Fetch-Dest`, it must be
`document`. That keeps the shim out of HTML that HaloPSA loads into
`iframe.halo-html-renderer` by URL.

## Files

| File | Purpose |
|---|---|
| `src/index.js` | The Worker |
| `wrangler.jsonc` | Name, route (`portal.interconnekt.com.au/*` on zone `interconnekt.com.au`), compatibility date |
| `test/smoke.mjs` | Anonymous smoke test; run against `wrangler dev` or the live portal |
| `package.json` | `dev`, `deploy`, `smoke`, `smoke:prod` scripts |

## Prerequisites

- Node 20 or newer.
- Access to the `interconnekt.com.au` zone in Cloudflare. Either run
  `npx wrangler login` once (browser OAuth), or export
  `CLOUDFLARE_API_TOKEN` with these permissions: Account, Workers Scripts:
  Edit; Zone, Workers Routes: Edit; Zone, Zone: Read; all scoped to the
  `interconnekt.com.au` zone. Never paste the token into a file in this
  repo.

## Local test

```bash
cd Portal/worker && npm install && npm run dev
```

Then in a second terminal:

```bash
cd Portal/worker && npm run smoke
```

`wrangler dev` runs the Worker on `http://localhost:8787` and the Worker
talks to the real HaloPSA origin over HTTPS, so the smoke test exercises
the genuine HTML shell, the genuine JSON endpoints and the genuine GitHub
Pages assets. It needs no login. All checks passed on 2026-09-02.

## Deploy

```bash
cd Portal/worker && npm run deploy
```

Deploying is safe at any time. The route only carries traffic once the
DNS record for `portal.interconnekt.com.au` is proxied, and until then the
Worker sits idle. Deploy first, cut over second.

## Before cutover: zone settings to confirm

All in the Cloudflare dashboard for `interconnekt.com.au`.

1. **SSL/TLS mode is Full (strict).** Anything else either loops
   (Flexible sends plain HTTP to an origin that redirects to HTTPS) or
   skips certificate checks. The origin certificate is Amazon-issued for
   `portal.interconnekt.com.au` (expires 2027-03-04) and is DNS-validated,
   so proxying the record does not interfere with its renewal.
2. **Rocket Loader is off** for this hostname (Speed, Optimization). It
   rewrites script loading and breaks single-page apps.
3. **Email Address Obfuscation is off** for this hostname (Scrape Shield).
   It rewrites email addresses inside HTML, and the portal is full of
   them.
4. **Bot Fight Mode and Browser Integrity Check** are worth a look if any
   integration or the HaloPSA mobile app calls `/api` on this hostname.
   Add a WAF skip for `/api/*` rather than leaving them to guess.
5. **Workers plan.** Every request on the hostname is a Worker invocation
   (page shells, static chunks and the two `/__interconnekt/` assets).
   The portal's API calls go straight to `connekt.halopsa.com`, not through
   this hostname, so they do not count; confirmed in the browser on
   cutover day. The Free plan caps
   the account at 100,000 requests a day; check what happens at the cap
   (fail open to origin, or errors) or take the USD 5 a month Paid plan
   already costed in `email-iframe-theming.md`.
6. **Caching needs nothing.** HaloPSA sends `no-store` on HTML, its static
   chunks carry content hashes, and JSON is not cached by default.

If a Configuration Rule scoped to `portal.interconnekt.com.au` is easier
than changing zone-wide settings, use that for items 2 and 3.

## Cutover

Done on 2026-09-02 at about 12:10 UTC. The Worker was deployed from
Joel's terminal, the `portal` CNAME was set to Proxied, the checks below
all passed, and the Custom CSS `@import` was moved to the Worker path the
same day. The steps stay here for a rebuild.

The runbook in `email-iframe-theming.md` asked for a staging hostname
first. That needs HaloPSA to register the hostname and Entra to accept it
as a redirect URI, both of which are human steps outside this repo, and
the login cycle can only be proven on the real hostname anyway because
the Entra redirect URIs are bound to it. The smoke test covers the
unauthenticated half. If Joel is happy with that trade, the cutover is:

1. DNS, Records, `portal` CNAME: set Proxy status to **Proxied**. Resolvers
   pick it up within the record TTL (five minutes at the default).
2. Run the checks below.
3. Log in as the impersonated customer contact and walk the post-cutover
   list.

Do it in a low-traffic window with the kill switch page already open.

## Verification

```bash
curl -sI https://portal.interconnekt.com.au/portal/home | grep -iE 'cf-ray|x-interconnekt-worker'
```

Expect a `cf-ray` header (proxied) and `x-interconnekt-worker: html-injected`.

```bash
curl -s https://portal.interconnekt.com.au/portal/home | grep -c '__interconnekt/iframe-theme.js'
```

Expect `1`.

```bash
cd Portal/worker && npm run smoke:prod
```

Then in a browser, logged in as the impersonated customer contact:

- `/portal/tickets`: the `Age` column shows one decimal place, not a raw
  float such as `154.31099186313773`.
- `/portal/ticket?btn=45&viewid=1&id=358840`: the forwarded marketing
  email reflows to the card instead of clipping at the right edge, and
  renders in Figtree with blue links.
- Home tiles and the ticket sidebar: an SLA-paused ticket shows the red
  On-Hold pill; status and priority pills use the brand palette.
- Log out and back in, and leave a tab open for an hour to see the token
  refresh survive.

## After cutover: move the stylesheet on to the Worker path

Optional but recommended. In HaloPSA, Configuration, Self-Service Portal,
Custom CSS, replace the `@import` line with:

```css
@import url('https://portal.interconnekt.com.au/__interconnekt/self-service-portal-design.css');
```

A merge to `main` is then visible to every browser within about a minute
instead of ten. Confirm with:

```bash
curl -sI https://portal.interconnekt.com.au/__interconnekt/self-service-portal-design.css | grep -iE 'cache-control|etag|x-interconnekt-worker'
```

Do this only after cutover: before it, the path does not exist and
HaloPSA returns its 404 page for it.

## Kill switch

Three levels, fastest first.

1. **Worker problem, proxy fine.** Workers & Pages, `halopsa-portal-edge`,
   Settings, Domains & Routes: delete the route. Traffic bypasses the
   Worker within seconds and Cloudflare keeps proxying.
2. **Proxy problem.** DNS, Records, `portal` CNAME: set Proxy status back
   to **DNS only**. Cloudflare is out of the path within the record TTL.
3. **Everything.** Overview, Pause Cloudflare on Site. This also affects
   the website on the same zone, so prefer 1 or 2.

If the Custom CSS `@import` has been moved to the Worker path, options 1
and 2 also take the stylesheet away, because that path exists only on the
Worker. Put the GitHub Pages URL back in the Custom CSS field at the same
time:

```css
@import url('https://interconnekt.github.io/HaloPSA-Styling/Portal/self-service-portal-design.css');
```

## Day to day

- **Changing the stylesheet or the shim** needs no Worker deploy. The
  Worker reads both from GitHub Pages on each edge-cache miss, so a merge
  to `main` is live within about a minute.
- **Changing the Worker**: edit `src/index.js`, `npm run smoke` against
  `npm run dev`, then `npm run deploy`.
- **Cost**: Workers Free covers the estimated traffic; see item 5 above
  for the cap.
