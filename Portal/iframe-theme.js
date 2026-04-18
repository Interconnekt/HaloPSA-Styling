/**
 * Self-Service Portal — chrome JS shims
 *
 * Three independent IIFEs in this file:
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
 *
 * 3. Status-chip class stamping — HaloPSA ships status pills as
 *    `.status-avatar` with the state name in textContent, but with
 *    only an inline `background-color` as a colour signal. We read
 *    the label and stamp a matching `.s-*` class so CSS can render
 *    the named-status palette (see status pill system in
 *    self-service-portal-design.css). A MutationObserver catches
 *    re-renders (sort/filter/kanban/page change).
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
        // Format any float with 2+ decimals down to a single decimal place.
        // Skip blanks, whole numbers, and non-numeric text (e.g. "N/A",
        // "—"). Allow leading minus for negatives. Threshold is `\d{2,}`
        // so a value already at one decimal ("4.2") is left alone.
        if (!/^-?\d+\.\d{2,}$/.test(raw)) return;
        var n = parseFloat(raw);
        if (!isFinite(n)) return;
        td.setAttribute(MARKER, '1');
        td.textContent = n.toFixed(1);
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


/**
 * Status-chip class stamper.
 *
 * HaloPSA renders `.status-avatar` elements with the status name as
 * textContent and only an inline `background-color` as a colour
 * signal. The portal CSS has a named-status palette keyed on
 * `.s-<slug>` classes — we read each chip's textContent and stamp
 * the matching class so CSS can render the brand tint + ink.
 *
 * Class lookup is case-insensitive and trims trailing whitespace.
 * Unknown status names get no class — they'll fall through to the
 * inline-rgb fallback rules in the CSS (which map HaloPSA's
 * default colours to the closest brand state).
 *
 * A MutationObserver catches re-renders from react-table
 * sort/filter/pagination, kanban drag, and ticket navigation.
 * `data-status-stamped` marks chips that already have their class
 * to prevent redundant DOM writes (the observer fires again when
 * we add the class; the marker breaks the loop).
 */
(function () {
    'use strict';

    var STATUS_MAP = {
        'new': 's-new',
        'in progress': 's-progress',
        'action required': 's-action-required',
        'awaiting user': 's-awaiting-user',
        'awaiting supplier': 's-awaiting-supplier',
        'completed': 's-resolved',
        'resolved': 's-resolved',
        'closed': 's-closed',
        'with cab': 's-with-cab',
        'open order': 's-open-order',
        'closed order': 's-closed-order',
        'open item': 's-open-item',
        'closed item': 's-closed-item',
        'invoiced': 's-invoiced',
        'awaiting approval': 's-awaiting-approval',
        'approved': 's-approved',
        'rejected': 's-rejected',
        'action completed': 's-action-completed',
        'on hold': 's-on-hold',
        'updated': 's-updated',
        'scheduled': 's-scheduled',
        'qualified': 's-qualified',
        'awaiting change review': 's-awaiting-change-review',
        'quote raised': 's-quote-raised',
        'quote sent': 's-quote-sent',
        'scoped': 's-scoped',
        'assigned': 's-assigned',
        'billing review': 's-billing-review',
        'customer review': 's-customer-review',
        'agent - triage handoff': 's-triage-handoff',
        'dispatch review': 's-dispatch-review'
    };

    var MARKER = 'data-status-stamped';

    /* All existing .s-* classes we manage, so a chip whose label
       changes (e.g. New → Assigned after the first action) gets
       re-classed cleanly. Kept in sync with STATUS_MAP values. */
    var MANAGED_CLASSES = Object.keys(STATUS_MAP).map(function (k) {
        return STATUS_MAP[k];
    });

    function stampChip(el) {
        var key = (el.textContent || '').trim().toLowerCase();
        if (!key) return;
        var cls = STATUS_MAP[key];
        // If the chip already has the correct class and marker, skip.
        if (cls && el.classList.contains(cls) && el.getAttribute(MARKER) === key) return;
        // Remove any other managed class before adding the new one
        // (covers label-change cases).
        for (var i = 0; i < MANAGED_CLASSES.length; i++) {
            if (MANAGED_CLASSES[i] !== cls && el.classList.contains(MANAGED_CLASSES[i])) {
                el.classList.remove(MANAGED_CLASSES[i]);
            }
        }
        if (cls) el.classList.add(cls);
        el.setAttribute(MARKER, key);
    }

    function sweep(root) {
        (root || document).querySelectorAll('.status-avatar').forEach(stampChip);
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
                    if (node.matches && node.matches('.status-avatar')) {
                        stampChip(node);
                    } else if (node.querySelectorAll) {
                        sweep(node);
                    }
                }
                // Also catch textContent changes on an existing chip
                // (characterData mutations don't surface here; the
                // next added-node sweep will catch the re-render).
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
 * Priority-pill class stamper.
 *
 * HaloPSA renders priority indicators as
 *   <div class="oneline">
 *     <div class="priority-block" style="background-color: rgb(...)"></div>
 *     Medium
 *   </div>
 * The portal CSS themes this as a tonal pill via `--p-bg / --p-ink /
 * --p-dot` triplets keyed on a `.p-low / .p-medium / .p-high / .p-critical`
 * class on the `.oneline`. We stamp those classes here based on the
 * wrapper's text content (excluding the swatch element).
 *
 * Why text-content stamping (not inline-rgb selectors): HaloPSA's per-
 * tenant priority colours vary — e.g. one instance emits Low as
 * `rgb(0, 98, 177)` while another uses a custom blue. The CSS keeps a
 * legacy rgb-based fallback for chips this stamper hasn't touched yet,
 * but text-content matching is the durable path.
 *
 * MutationObserver catches re-renders from react-table sort/filter/page
 * change and from filter sidebar clicks. `data-priority-stamped` marks
 * already-classed wrappers so the observer doesn't redundantly re-write
 * the DOM (which would re-fire the observer in a loop).
 */
(function () {
    'use strict';

    var PRIORITY_MAP = {
        'low': 'p-low',
        'medium': 'p-medium',
        'normal': 'p-medium',
        'high': 'p-high',
        'critical': 'p-critical',
        'urgent': 'p-critical'
    };

    var MARKER = 'data-priority-stamped';
    var MANAGED = ['p-low', 'p-medium', 'p-high', 'p-critical'];

    function stampWrapper(wrapper, key) {
        var cls = PRIORITY_MAP[key];
        if (cls && wrapper.classList.contains(cls) && wrapper.getAttribute(MARKER) === key) return;
        for (var i = 0; i < MANAGED.length; i++) {
            if (MANAGED[i] !== cls && wrapper.classList.contains(MANAGED[i])) {
                wrapper.classList.remove(MANAGED[i]);
            }
        }
        if (cls) wrapper.classList.add(cls);
        wrapper.setAttribute(MARKER, key || '');
    }

    function readSiblingText(parent, exclude) {
        // Concatenate text from every child node except the swatch element.
        // textContent picks up nested spans (e.g. icon + label wrappers)
        // without us having to enumerate them.
        var text = '';
        for (var n = parent.firstChild; n; n = n.nextSibling) {
            if (n === exclude) continue;
            text += n.textContent || '';
        }
        return text.trim().toLowerCase();
    }

    function stampBySwatch(swatch) {
        var parent = swatch.parentElement;
        if (!parent) return;
        var key = readSiblingText(parent, swatch);
        if (!key) return;
        stampWrapper(parent, key);
    }

    function sweep(root) {
        (root || document).querySelectorAll('.priority-block').forEach(stampBySwatch);
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
                    if (node.matches && node.matches('.priority-block')) {
                        stampBySwatch(node);
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
