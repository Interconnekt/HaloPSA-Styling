/**
 * Self-Service Portal — Font Audit
 *
 * Paste this whole file into the DevTools console on any portal page to
 * enumerate every visible element whose computed `font-family` does NOT
 * start with Montserrat. Groups results by the first font in the stack so
 * you can see at a glance where Poppins / Segoe UI / Lato / system fonts
 * are still leaking through.
 *
 * Scope rules:
 *   - Skips `iframe.halo-html-renderer` ticket-note bodies (rendered from
 *     email HTML, themed via iframe-theme.js, intentionally out of scope
 *     for the host stylesheet).
 *   - Skips monospace code / pre (we ship SFMono/Consolas there on purpose).
 *   - Skips invisible / zero-size elements so hidden chrome doesn't pollute
 *     the report.
 *   - Skips elements with no text content (purely structural wrappers).
 *   - Recurses into same-origin iframes so we can verify `iframe-theme.js`
 *     did its job on email bodies we DO want themed (preview previews, etc).
 *
 * Output: `console.table` of offenders + a summary count per first-preferred
 * font, plus a Montserrat-loaded liveness check via `document.fonts.check`.
 *
 * Usage:
 *   1. Open the page to audit (home, tickets list, a ticket, kanban, KB article).
 *   2. Open DevTools → Console.
 *   3. Paste this file's contents and press Enter.
 *   4. Inspect the table. Each row has a CSS selector path you can click
 *      through with `$0 = document.querySelector(path)`.
 *
 * Re-run after any stylesheet change. Zero offenders = green.
 */
(function portalFontAudit() {
    'use strict';

    var WANT = 'montserrat';

    // Monospace stacks we deliberately keep (inline code + pre blocks).
    var MONO_HINTS = ['sfmono', 'consolas', 'menlo', 'monaco', 'courier', 'liberation mono'];

    // Selectors whose *subtree* is out of scope — ticket-note email bodies
    // live inside `iframe.halo-html-renderer` and are intentionally themed
    // (or not) by iframe-theme.js, not by the host CSS.
    var SKIP_IFRAME_SELECTORS = ['iframe.halo-html-renderer'];

    function firstFont(stack) {
        // `'Montserrat', 'Poppins', sans-serif` → `montserrat`
        if (!stack) return '(empty)';
        var first = stack.split(',')[0].trim().replace(/^['"]|['"]$/g, '').toLowerCase();
        return first || '(empty)';
    }

    function isMonospaceStack(stack) {
        var s = (stack || '').toLowerCase();
        return MONO_HINTS.some(function (h) { return s.indexOf(h) !== -1; });
    }

    function isVisible(el) {
        var r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return false;
        var cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false;
        return true;
    }

    function hasOwnText(el) {
        for (var i = 0; i < el.childNodes.length; i++) {
            var n = el.childNodes[i];
            if (n.nodeType === 3 && n.nodeValue && n.nodeValue.trim().length > 0) return true;
        }
        return false;
    }

    function selectorFor(el) {
        if (el.id) return '#' + el.id;
        var parts = [];
        var cur = el;
        for (var i = 0; i < 4 && cur && cur.nodeType === 1; i++, cur = cur.parentElement) {
            var part = cur.tagName.toLowerCase();
            if (cur.classList && cur.classList.length) {
                part += '.' + Array.prototype.slice.call(cur.classList).slice(0, 2).join('.');
            }
            parts.unshift(part);
        }
        return parts.join(' > ');
    }

    function collect(root, label, offenders, skipped) {
        var all = root.querySelectorAll('*');
        for (var i = 0; i < all.length; i++) {
            var el = all[i];

            // Skip ticket-notes iframe subtrees entirely.
            var matchedSkip = SKIP_IFRAME_SELECTORS.some(function (sel) {
                return el.closest && el.closest(sel);
            });
            if (matchedSkip) { skipped.ticketNote++; continue; }

            if (!hasOwnText(el)) continue;
            if (!isVisible(el)) continue;

            var cs = getComputedStyle(el);
            var stack = cs.fontFamily;
            if (isMonospaceStack(stack)) { skipped.mono++; continue; }

            var first = firstFont(stack);
            if (first === WANT) continue;

            offenders.push({
                scope: label,
                first: first,
                stack: stack,
                tag: el.tagName.toLowerCase(),
                text: (el.textContent || '').trim().slice(0, 40),
                selector: selectorFor(el)
            });
        }
    }

    var offenders = [];
    var skipped = { mono: 0, ticketNote: 0 };

    collect(document, 'host', offenders, skipped);

    // Recurse into same-origin iframes we DO want themed (anything that
    // isn't the ticket-notes renderer). Skip-list above already removes the
    // renderer itself from the host sweep; here we peek into its contentDoc
    // too so we can report whether iframe-theme.js injected its style tag.
    var iframeSummary = [];
    document.querySelectorAll('iframe').forEach(function (f) {
        var isNotes = f.matches('iframe.halo-html-renderer');
        var doc;
        try { doc = f.contentDocument; } catch (e) { doc = null; }
        if (!doc) {
            iframeSummary.push({ iframe: f.className || '(no class)', sameOrigin: false, injected: 'n/a', bodyFont: 'n/a' });
            return;
        }
        var injected = !!doc.querySelector('style[data-portal-font-injected]');
        var bodyFont = doc.body ? firstFont(getComputedStyle(doc.body).fontFamily) : '(no body)';
        iframeSummary.push({
            iframe: f.className || '(no class)',
            sameOrigin: true,
            isTicketNotes: isNotes,
            injected: injected,
            bodyFont: bodyFont
        });
        // Don't include ticket-notes subtree offenders in the main table —
        // they're intentionally out of scope for this audit.
        if (!isNotes) collect(doc, 'iframe:' + (f.className || ''), offenders, skipped);
    });

    // Summary: count offenders by their first-preferred font.
    var byFont = {};
    offenders.forEach(function (o) { byFont[o.first] = (byFont[o.first] || 0) + 1; });

    console.group('%cPortal Font Audit', 'font-weight:bold;font-size:14px;color:#5084ee');
    console.log('Scanned at:', new Date().toISOString(), '· URL:', location.pathname);
    console.log('Montserrat loaded & usable:', document.fonts.check('1em Montserrat'));
    console.log('Host body computed font:', firstFont(getComputedStyle(document.body).fontFamily));
    console.log('Skipped (monospace code/pre):', skipped.mono);
    console.log('Skipped (ticket-notes iframe subtree):', skipped.ticketNote);
    console.log('Offender total:', offenders.length);
    console.group('By first-preferred font');
    console.table(byFont);
    console.groupEnd();
    console.group('Iframes');
    console.table(iframeSummary);
    console.groupEnd();
    if (offenders.length) {
        console.group('Offenders (first 200)');
        console.table(offenders.slice(0, 200));
        console.groupEnd();
    } else {
        console.log('%c✓ All in-scope elements render Montserrat.', 'color:#4fa37a;font-weight:bold');
    }
    console.groupEnd();

    // Return so the caller can also grab the raw data: `var r = <paste>;`
    return { offenders: offenders, byFont: byFont, iframes: iframeSummary, skipped: skipped };
})();
