/**
 * Self-Service Portal — chrome JS shims
 *
 * Two independent IIFEs in this file:
 *
 * 1. iframe theming — HaloPSA renders email bodies inside
 *    `<iframe class="halo-html-renderer">`, a same-origin iframe with
 *    its own `<style>` tag that sets Segoe UI. CSS from the host
 *    document does not cross the iframe boundary, so the only way to
 *    theme that content is via JavaScript: reach into the same-origin
 *    document and inject a `<style>` of our own.
 *
 * 2. Ticket list formatting — HaloPSA renders the `Age` column as a
 *    raw float of days ("4.1446736001620375"). CSS cannot round
 *    numeric text content, so we post-process the DOM to format each
 *    Age cell to 2 decimal places. Runs on load + MutationObserver so
 *    sort/filter/pagination don't leave stale raw floats.
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


/**
 * Ticket list — format the `Age` column to 2 decimal places.
 *
 * HaloPSA renders the Age column as a raw Number that represents days
 * since the ticket was opened — e.g. "4.1446736001620375". CSS cannot
 * round text, so we post-process the DOM.
 *
 * Strategy: locate the Age column by its header text (order varies per
 * user's saved ticket view), then sweep tbody cells in that column.
 * On every react-table re-render (sort, filter, page change) the cells
 * lose our formatting and reset to raw floats, so a MutationObserver
 * on the tbody catches those and re-formats. A data-attribute marker
 * stops repeated re-formatting on the same cell, which would otherwise
 * trigger an infinite loop (each format mutates tbody, which fires the
 * observer, which formats again).
 */
(function () {
    'use strict';

    var MARKER = 'data-age-fmt';

    function findAgeColIndex(table) {
        // `.rt-th` headers are visual order, same as `.rt-td` cells in
        // each row. Text matches "Age" or "Age (days)" etc.
        var heads = table.querySelectorAll('.rt-thead.-header .rt-th');
        for (var i = 0; i < heads.length; i++) {
            var t = (heads[i].textContent || '').trim().toLowerCase();
            if (t === 'age' || /^age(\s|\()/.test(t)) return i;
        }
        return -1;
    }

    function formatCell(td) {
        if (td.getAttribute(MARKER)) return;
        var raw = (td.textContent || '').trim();
        // Only format plain positive floats with >2 decimals. Skip
        // blanks, whole numbers, and anything that's not a number (e.g.
        // "N/A", "—"). Allow leading minus for negatives.
        if (!/^-?\d+\.\d{3,}$/.test(raw)) return;
        var n = parseFloat(raw);
        if (!isFinite(n)) return;
        td.setAttribute(MARKER, '1');
        td.textContent = n.toFixed(2);
    }

    function formatTable(table) {
        var idx = findAgeColIndex(table);
        if (idx < 0) return;
        var rows = table.querySelectorAll('.rt-tbody .rt-tr');
        rows.forEach(function (row) {
            var cells = row.querySelectorAll('.rt-td');
            if (cells[idx]) formatCell(cells[idx]);
        });
    }

    function sweep() {
        document.querySelectorAll('.ReactTable, .main-table').forEach(formatTable);
    }

    function start() {
        sweep();
        if (!document.body) return;
        // Global subtree observer — the ticket list may not exist at
        // script start (SPA route change). Re-sweep on any DOM change
        // that adds .rt-tr rows. Marker on formatted cells prevents
        // re-format loops; react-table re-creates cells on render, so
        // a fresh cell has no marker and gets formatted once.
        var obs = new MutationObserver(function (muts) {
            var needsSweep = false;
            for (var i = 0; i < muts.length; i++) {
                var added = muts[i].addedNodes;
                for (var j = 0; j < added.length; j++) {
                    var node = added[j];
                    if (node.nodeType !== 1) continue;
                    if (node.matches && (node.matches('.rt-tr') || node.matches('.ReactTable'))) {
                        needsSweep = true;
                        break;
                    }
                    if (node.querySelector && node.querySelector('.rt-tr, .ReactTable')) {
                        needsSweep = true;
                        break;
                    }
                }
                if (needsSweep) break;
            }
            if (needsSweep) sweep();
        });
        obs.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
