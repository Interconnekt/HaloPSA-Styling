/**
 * Interconnekt HaloPSA Self-Service Portal edge Worker.
 *
 * Runs on the Cloudflare route `portal.interconnekt.com.au/*` once the
 * DNS record for that hostname is proxied. Two jobs:
 *
 * 1. Script injection. HaloPSA has no Custom JavaScript field for the
 *    Self-Service Portal, so this is the only way to get
 *    `Portal/iframe-theme.js` on to every page, including deep links.
 *    For HTML page responses the Worker appends one `<script>` tag to
 *    `<body>` with HTMLRewriter (streaming, single-digit ms). Every
 *    other response (JSON, static chunks, WebSocket upgrades, redirects)
 *    is passed through untouched.
 *
 * 2. Asset delivery. `/__interconnekt/<name>` serves the stylesheet and
 *    the shim from GitHub Pages with a 60 second TTL instead of the
 *    600 second TTL GitHub Pages sets. Pointing the HaloPSA Custom CSS
 *    `@import` at this path removes the ten minute lag after a merge.
 *
 * Runbook, cutover steps and kill switch: ../README.md.
 * Background and decision log: ../../email-iframe-theming.md.
 */

const ORIGIN_HOST = 'portal.interconnekt.com.au';

/* Assets served from the portal origin. Anything not listed is a 404. */
const ASSET_PREFIX = '/__interconnekt/';
const UPSTREAM_BASE = 'https://interconnekt.github.io/HaloPSA-Styling/Portal/';
const ASSETS = {
    'self-service-portal-design.css': 'text/css; charset=utf-8',
    'iframe-theme.js': 'text/javascript; charset=utf-8'
};
const SCRIPT_PATH = ASSET_PREFIX + 'iframe-theme.js';

/* Edge cache TTL for the upstream fetch, and what browsers are told.
   A browser revalidates after 60s and may use a stale copy for a
   further 9 minutes while it does so, so a merge is visible within
   about a minute without any flash of unstyled content. */
const EDGE_TTL_SECONDS = 60;
const BROWSER_CACHE_CONTROL = 'public, max-age=60, stale-while-revalidate=540';

/* Diagnostic header so `curl -I` shows which branch handled a request:
   html-injected, passthrough or asset. */
const WORKER_HEADER = 'x-interconnekt-worker';

export default {
    async fetch(request) {
        const url = new URL(request.url);
        if (url.pathname.startsWith(ASSET_PREFIX)) {
            return serveAsset(request, url);
        }
        return proxyPortal(request, url);
    }
};

async function proxyPortal(request, url) {
    /* Rewriting scheme, host and port is a no-op in production (the
       route is on the same https hostname) and lets `wrangler dev` on
       http://localhost talk to the real origin. A subrequest to the zone's own hostname goes to
       the origin, not back through this Worker. */
    const originUrl = new URL(url);
    originUrl.protocol = 'https:';
    originUrl.hostname = ORIGIN_HOST;
    originUrl.port = '';
    const originRequest = new Request(originUrl.toString(), request);

    let response;
    try {
        response = await fetch(originRequest);
    } catch (err) {
        return new Response('Portal origin unavailable', {
            status: 502,
            headers: { 'content-type': 'text/plain; charset=utf-8', [WORKER_HEADER]: 'origin-error' }
        });
    }

    /* A WebSocket upgrade (HaloPSA uses SignalR for live updates) must
       be returned as-is; wrapping it in a new Response drops the socket. */
    if (response.status === 101) {
        return response;
    }

    if (!shouldInject(request, response)) {
        const passthrough = new Response(response.body, response);
        passthrough.headers.set(WORKER_HEADER, 'passthrough');
        return passthrough;
    }

    const rewritten = new HTMLRewriter()
        .on('body', {
            element(el) {
                el.append('<script src="' + SCRIPT_PATH + '"></script>', { html: true });
            }
        })
        .transform(response);
    const injected = new Response(rewritten.body, rewritten);
    injected.headers.set(WORKER_HEADER, 'html-injected');
    return injected;
}

/* Only HTML page shells get the script. The content-type check is the
   safety net from the runbook: token endpoints and /api/* are JSON.
   The Sec-Fetch-Dest check narrows it further to top-level documents,
   so an HTML email body loaded into `iframe.halo-html-renderer` by URL
   does not get a second copy of the shim inside the frame. Browsers
   that do not send the header fall back to the content-type test. */
function shouldInject(request, response) {
    if (response.status < 200 || response.status >= 300) return false;
    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    if (!contentType.includes('text/html')) return false;
    const dest = request.headers.get('sec-fetch-dest');
    if (dest && dest !== 'document') return false;
    return true;
}

async function serveAsset(request, url) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response('Method not allowed', {
            status: 405,
            headers: { allow: 'GET, HEAD', [WORKER_HEADER]: 'asset' }
        });
    }

    const name = url.pathname.slice(ASSET_PREFIX.length);
    const contentType = ASSETS[name];
    if (!contentType) {
        return new Response('Not found', {
            status: 404,
            headers: { 'content-type': 'text/plain; charset=utf-8', [WORKER_HEADER]: 'asset' }
        });
    }

    let upstream;
    try {
        upstream = await fetch(UPSTREAM_BASE + name, {
            cf: { cacheTtl: EDGE_TTL_SECONDS, cacheEverything: true }
        });
    } catch (err) {
        return assetError('Upstream unavailable');
    }
    if (!upstream.ok) {
        return assetError('Upstream responded ' + upstream.status);
    }

    const headers = new Headers({
        'content-type': contentType,
        'cache-control': BROWSER_CACHE_CONTROL,
        'access-control-allow-origin': '*',
        'x-content-type-options': 'nosniff',
        [WORKER_HEADER]: 'asset'
    });
    const etag = upstream.headers.get('etag');
    if (etag) headers.set('etag', etag);
    const lastModified = upstream.headers.get('last-modified');
    if (lastModified) headers.set('last-modified', lastModified);

    /* Cheap revalidation: GitHub Pages sends a strong ETag, so a browser
       that already holds the current file gets a 304 with no body. */
    if (etag && request.headers.get('if-none-match') === etag) {
        return new Response(null, { status: 304, headers });
    }

    return new Response(request.method === 'HEAD' ? null : upstream.body, {
        status: 200,
        headers
    });
}

function assetError(message) {
    return new Response(message, {
        status: 502,
        headers: {
            'content-type': 'text/plain; charset=utf-8',
            'cache-control': 'no-store',
            [WORKER_HEADER]: 'asset-error'
        }
    });
}
