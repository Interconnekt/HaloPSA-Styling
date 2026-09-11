import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import worker from '../src/index.js';

const base = 'https://portal.interconnekt.com.au/__interconnekt/';
let reads = 0;
const env = { ASSETS: { async fetch(request) {
    reads++;
    assert.equal(request.method, 'GET');
    const name = new URL(request.url).pathname.split('/').pop();
    const body = await readFile(new URL('../.assets/__interconnekt/' + name, import.meta.url));
    return new Response(body, { headers: { etag: '"test-version"' } });
} } };

for (const name of ['self-service-portal-design.css', 'iframe-theme.js']) {
    const response = await worker.fetch(new Request(base + name), env);
    assert.equal(response.status, 200);
    assert.equal(await response.text(), await readFile(new URL('../../' + name, import.meta.url), 'utf8'));
    const head = await worker.fetch(new Request(base + name, { method: 'HEAD' }), env);
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');
}
for (const etag of ['"test-version"', 'W/"test-version"', '"old", W/"test-version"', '*']) {
    const response = await worker.fetch(new Request(base + 'iframe-theme.js', { headers: { 'if-none-match': etag } }), env);
    assert.equal(response.status, 304);
}
const before = reads;
assert.equal((await worker.fetch(new Request(base + 'missing.txt'), env)).status, 404);
assert.equal((await worker.fetch(new Request(base + 'iframe-theme.js', { method: 'POST' }), env)).status, 405);
assert.equal(reads, before, 'Rejected requests must not reach the asset store');
const unavailable = { ASSETS: { fetch() { throw new Error('Unavailable'); } } };
assert.equal((await worker.fetch(new Request(base + 'iframe-theme.js'), unavailable)).status, 502);
console.log('Asset integrity, GET/HEAD, ETag revalidation, method restrictions and failure handling passed.');
