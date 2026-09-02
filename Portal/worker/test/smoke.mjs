/**
 * Smoke test for the portal edge Worker.
 *
 *   npm run smoke                 against `wrangler dev` on :8787
 *   npm run smoke:prod            against the live portal after cutover
 *   node test/smoke.mjs <base>    any other base URL
 *
 * Exits non-zero on the first failure. Needs no login: it only fetches
 * pages HaloPSA serves to anonymous visitors.
 */

const base = (process.argv[2] || 'http://localhost:8787').replace(/\/$/, '');
const HEADER = 'x-interconnekt-worker';
let failures = 0;

function check(label, ok, detail) {
    const mark = ok ? 'ok  ' : 'FAIL';
    console.log(mark + '  ' + label + (detail ? '  (' + detail + ')' : ''));
    if (!ok) failures++;
}

async function get(path, headers = {}, method = 'GET') {
    const res = await fetch(base + path, { method, headers, redirect: 'manual' });
    const body = method === 'HEAD' ? '' : await res.text();
    return { res, body };
}

/* 1. HTML page shell gets exactly one script tag, at the end of body. */
{
    const { res, body } = await get('/portal/home', { 'sec-fetch-dest': 'document' });
    check('page shell: 200 text/html', res.status === 200 && (res.headers.get('content-type') || '').includes('text/html'), res.status + ' ' + res.headers.get('content-type'));
    check('page shell: marked html-injected', res.headers.get(HEADER) === 'html-injected', res.headers.get(HEADER));
    const matches = body.match(/<script src="\/__interconnekt\/iframe-theme\.js"><\/script>/g) || [];
    check('page shell: one shim tag', matches.length === 1, matches.length + ' found');
    check('page shell: tag sits before </body>', /<script src="\/__interconnekt\/iframe-theme\.js"><\/script><\/body>/.test(body));
    check('page shell: HaloPSA app container intact', body.includes('id="app-container"'));
}

/* 2. Deep link is also a page shell (the SPA serves the same HTML). */
{
    const { res, body } = await get('/portal/ticket?btn=45&viewid=1&id=358840', { 'sec-fetch-dest': 'document' });
    check('deep link: html-injected', res.status === 200 && res.headers.get(HEADER) === 'html-injected', res.status + ' ' + res.headers.get(HEADER));
    check('deep link: shim tag present', body.includes('/__interconnekt/iframe-theme.js'));
}

/* 3. Same HTML requested as an iframe document is left alone. */
{
    const { res, body } = await get('/portal/home', { 'sec-fetch-dest': 'iframe' });
    check('iframe fetch: passthrough', res.headers.get(HEADER) === 'passthrough', res.headers.get(HEADER));
    check('iframe fetch: no shim tag', !body.includes('/__interconnekt/iframe-theme.js'));
}

/* 4. Non-HTML responses pass through unchanged. The token endpoint
   answers an empty POST-less GET with a JSON 400, which is enough to
   prove JSON is never rewritten. An anonymous /api/* call gets
   HaloPSA's HTML 404 page, which is non-2xx and so also untouched. */
{
    const { res, body } = await get('/auth/token');
    check('token endpoint: passthrough', res.headers.get(HEADER) === 'passthrough', res.status + ' ' + res.headers.get(HEADER));
    check('token endpoint: json, not html', (res.headers.get('content-type') || '').includes('json') && !body.includes('__interconnekt'), res.headers.get('content-type'));
}
{
    const { res, body } = await get('/api/Tickets', { 'sec-fetch-dest': 'document' });
    check('api 404 page: passthrough, no shim', res.status === 404 && res.headers.get(HEADER) === 'passthrough' && !body.includes('__interconnekt'), res.status + ' ' + res.headers.get(HEADER));
}
{
    const { res, body } = await get('/portal/static/css/font-awesome.min.css');
    check('static css: passthrough 200', res.status === 200 && res.headers.get(HEADER) === 'passthrough', res.status + ' ' + res.headers.get(HEADER));
    check('static css: body untouched', body.length > 1000 && !body.includes('__interconnekt'));
}

/* 5. Proxied assets from GitHub Pages with the short TTL. */
{
    const { res, body } = await get('/__interconnekt/self-service-portal-design.css');
    check('asset css: 200', res.status === 200, String(res.status));
    check('asset css: text/css', (res.headers.get('content-type') || '').startsWith('text/css'), res.headers.get('content-type'));
    check('asset css: 60s cache-control', res.headers.get('cache-control') === 'public, max-age=60, stale-while-revalidate=540', res.headers.get('cache-control'));
    check('asset css: marked asset', res.headers.get(HEADER) === 'asset', res.headers.get(HEADER));
    check('asset css: is our stylesheet', body.includes('--portal-'), body.length + ' bytes');
    const etag = res.headers.get('etag');
    check('asset css: has etag', !!etag, etag);
    if (etag) {
        const again = await get('/__interconnekt/self-service-portal-design.css', { 'if-none-match': etag });
        check('asset css: 304 on matching etag', again.res.status === 304, String(again.res.status));
    }
}
{
    const { res, body } = await get('/__interconnekt/iframe-theme.js');
    check('asset js: 200 text/javascript', res.status === 200 && (res.headers.get('content-type') || '').startsWith('text/javascript'), res.status + ' ' + res.headers.get('content-type'));
    check('asset js: is the shim', body.includes('halo-html-renderer'), body.length + ' bytes');
}
{
    const { res } = await get('/__interconnekt/iframe-theme.js', {}, 'HEAD');
    check('asset js: HEAD 200', res.status === 200, String(res.status));
}
{
    const { res } = await get('/__interconnekt/not-a-real-file.txt');
    check('asset unknown: 404', res.status === 404, String(res.status));
}
{
    const { res } = await get('/__interconnekt/iframe-theme.js', {}, 'POST');
    check('asset POST: 405', res.status === 405, String(res.status));
}

console.log(failures === 0 ? '\nAll checks passed' : '\n' + failures + ' check(s) failed');
process.exit(failures === 0 ? 0 : 1);
