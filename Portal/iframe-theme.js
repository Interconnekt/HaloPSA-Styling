/**
 * Self-Service Portal — iframe theming shim
 *
 * HaloPSA renders email bodies inside `<iframe class="halo-html-renderer">`,
 * a same-origin iframe with its own `<style>` tag that sets Segoe UI.
 * CSS from the host document does not cross the iframe boundary, so the
 * only way to theme that content is via JavaScript: reach into the
 * same-origin document and inject a `<style>` tag of our own.
 *
 * This script sweeps on load, re-themes on each iframe `load` event
 * (ticket navigation re-populates existing iframes), and uses a
 * MutationObserver to catch dynamically inserted iframes (action-history
 * expand, pagination, ticket switch).
 *
 * Colours are chosen to work in BOTH dark and light portal modes — the
 * link blue #3598db (matching Interconnekt/Email-Templates) is legible
 * on white email bodies AND on the dark portal surface, so we don't
 * need to detect the host theme.
 */
(function () {
    'use strict';

    var CSS = [
        'html, body, body * {',
        '    font-family: \'Montserrat\', \'Poppins\', \'Segoe UI\', -apple-system, BlinkMacSystemFont, sans-serif !important;',
        '}',
        /* Matches Interconnekt/Email-Templates _base/base-template.html */
        'a, a:visited {',
        '    color: #3598db !important;',
        '    text-decoration: none;',
        '}',
        'a:hover {',
        '    color: #3598db !important;',
        '    text-decoration: underline;',
        '}'
    ].join('\n');

    var MARKER = 'data-portal-font-injected';

    function inject(iframe) {
        try {
            var doc = iframe.contentDocument;
            if (!doc || !doc.head) return;
            if (doc.querySelector('style[' + MARKER + ']')) return;
            var style = doc.createElement('style');
            style.setAttribute(MARKER, '1');
            style.textContent = CSS;
            doc.head.appendChild(style);
        } catch (e) { /* cross-origin or detached — ignore */ }
    }

    function theme(iframe) {
        // Re-inject every time the iframe navigates (ticket switch re-uses the
        // same <iframe> element but replaces its document).
        iframe.addEventListener('load', function () { inject(iframe); });
        inject(iframe);
    }

    function sweep(root) {
        (root || document).querySelectorAll('iframe.halo-html-renderer').forEach(theme);
    }

    function start() {
        sweep();
        if (!document.body) return;
        var obs = new MutationObserver(function (muts) {
            for (var i = 0; i < muts.length; i++) {
                var added = muts[i].addedNodes;
                for (var j = 0; j < added.length; j++) {
                    var node = added[j];
                    if (node.nodeType !== 1) continue;
                    if (node.matches && node.matches('iframe.halo-html-renderer')) {
                        theme(node);
                    } else if (node.querySelectorAll) {
                        sweep(node);
                    }
                }
            }
        });
        obs.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
