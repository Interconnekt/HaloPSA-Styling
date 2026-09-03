# Handoff: dark mode and mobile

Written 2026-09-02 at the end of the fourth session. Topic-scoped, for
picking these two workstreams up fresh. For everything else in the
project read `HANDOFF-2026-09-02-session-4.md`.

Read `AGENTS.md` first, then section 7 of `HANDOFF-2026-09-02.md`
(the four traps), then this.

---

## Pick up here (written 2026-09-03, session 5)

**One decision is waiting on Joel: whether to merge PR #21.**

[PR #21](https://github.com/Interconnekt/HaloPSA-Styling/pull/21) has
six commits and is green. Joel asked to "merge to staging so I can
review live". **There is no staging.** The staging hostname was judged
not worth its two human dependencies back in session 2 and never built;
`Portal/worker/wrangler.jsonc` sets `workers_dev: false` and
`preview_urls: false` with a single production route, and GitHub Pages
serves `main`. So merging IS the customer deploy, live in about a
minute. Do not merge it as a "staging" step; it is the real thing.

**The substitute that worked.** A live review with zero customer
exposure, by injecting the branch CSS into a real portal tab. Paste
into the console on any portal page (it survives in-app navigation but
not a hard reload; `window.__ikPreviewOff()` removes it):

```js
const B = 'claude/dark-mode-mobile-handoff-e1a0a7';
const css = await fetch('https://raw.githubusercontent.com/Interconnekt/HaloPSA-Styling/' + B +
  '/Portal/self-service-portal-design.css', {cache:'no-store'}).then(r => r.text());
window.__ikPreviewOff?.();
const style = document.createElement('style'); style.id = '__ikPreviewCss';
style.textContent = css; document.body.appendChild(style);
const slug = t => (t||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
function apply() {
  if (!document.getElementById('__ikPreviewCss')) document.body.appendChild(style);
  document.querySelectorAll('.ReactTable, .main-table').forEach(t => {
    const h = t.querySelectorAll('.rt-thead.-header .rt-th'); if (!h.length) return;
    const s = [...h].map(x => slug(x.textContent));
    h.forEach((x,i) => { if (s[i] && x.getAttribute('data-col') !== s[i]) x.setAttribute('data-col', s[i]); });
    t.querySelectorAll('.rt-tbody .rt-tr').forEach(r => { const c = r.querySelectorAll('.rt-td');
      for (let i = 0; i < c.length; i++) if (s[i] && c[i].getAttribute('data-col') !== s[i]) c[i].setAttribute('data-col', s[i]); }); });
  document.querySelectorAll('.status-avatar[data-status-stamped=""]').forEach(e => e.removeAttribute('data-status-stamped'));
}
apply();
const obs = new MutationObserver(() => { clearTimeout(window.__ikT); window.__ikT = setTimeout(apply, 120); });
obs.observe(document.body, {childList: true, subtree: true});
window.__ikPreviewOff = () => { obs.disconnect(); document.getElementById('__ikPreviewCss')?.remove(); delete window.__ikPreviewOff; };
```

Confirmed working: the Quote Raised pill went violet on the live page,
and cloning that tab into the 390px iframe showed the ticket list cards
in dark mode, all without a deploy. Desktop is untouched because every
mobile rule sits inside the existing `max-width: 768px` block.

**State the session was left in.** Chrome is Joel's own agent profile
(not impersonating). His Application Theme was switched to Halo PSA
Dark for testing and **switched back to Halo PSA Standard**; the preview
injection and the mobile iframe were both removed. Nothing else on his
account was changed, and the marketing-emails checkbox was left alone.

**What is actually left.**

1. Joel's call on merging PR #21, knowing it goes straight to
   customers.
2. After any merge, re-verify against the DEPLOYED stylesheet, not the
   branch. Trap 3. Deployed ETag before this PR is `W/"6a98bb9a-5cc18"`.
3. Nothing else is outstanding. All four dark-mode items and all four
   mobile surfaces are closed.

---

## 0. Before you touch anything

~~**PR #20 is open and unmerged, with six commits.**~~ **Merged
2026-09-03** as `325333a`, so everything it contained, including the
dark-mode email fix, is live. Deployed ETag is now
`W/"6a98bb9a-5cc18"`.

The rule that produced that warning still stands for the next person:
anything described here as "fixed" is fixed on a branch, not in front
of customers, until it is merged. Merging to `main` is the deploy, live
in about a minute. Do not re-verify a fix against the deployed
stylesheet before it is merged; you will be looking at the old file.
This is trap 3 and trap 4 from the earliest handoff. **The KB mobile
fix in `dde4b62` is in exactly that state now: committed, pushed, not
merged, not live.**

**Getting a portal session at all.** Impersonating a user from the
agent app can fail with a full-page "Incorrect token for agent". Cause
and fix are in `HANDOFF-2026-09-02-session-4.md` section 1. Short
version: clear the `portal.interconnekt.com.au` cookies, quit and
reopen the browser, then impersonate. It is not the Cloudflare Worker.

**Whose session you are in matters.** Check before trusting any
result:

```js
JSON.stringify({user: localStorage.getItem('P_username'),
                client: localStorage.getItem('P_client_name'),
                theme: localStorage.getItem('P_theme')})
```

This session ran as Jeremy Urbach (IDA), saved theme `theme-light`.

**House rules.** No em or en dashes anywhere. Australian spelling. Use
the tokens. The portal login is a customer contact: no saved
preference changes, no form submissions, no Pay, Submit, Add Note or
Time Entry.

---

## 1. Dark mode

### Status

Chrome is verified. One real bug was found and fixed on the PR branch.
A genuine dark-mode page load has still never been done.

### What is verified

The Scheduled pill flips to exactly the documented dark tokens,
`rgba(155,123,245,0.18)` on `#B898FF`. Page, cards, text, the red
On Hold pill and blue links all render correctly.

### The bug that was found, and why it was missed

`Portal/iframe-theme.js` injected font-family, link colour and
overflow rules into `iframe.halo-html-renderer`, but never a text or
background colour. The iframe body therefore kept `color: #000` over a
transparent background. In dark mode that is black text on the dark
card, for every email on every ticket.

Session 3 checked the email iframes and passed them, because it
checked fonts, links and overflow. Nobody checked contrast. If you
are verifying a surface, check the thing that would actually be
broken, not the thing that was last changed.

Fixed in commit `d2a8788`:

- The shim injects a second style element in dark mode painting the
  iframe document white, with `#161922` text.
- A `MutationObserver` on the theme class calls `retheme()`, so a
  theme flip repaints already-open messages instead of leaving them
  on the theme they loaded under.
- The stylesheet dresses the iframe element to match (white, radius,
  padding) so there is no dark flash before injection and the paper
  does not read as a bare rectangle. New token
  `--portal-email-paper`, deliberately not flipped in `.theme-dark`.

**Why white paper and not recoloured text.** Email HTML inlines
`color` on nearly every cell, and an inline declaration outranks a
stylesheet one. Repainting the text would win on some elements and
lose on others, leaving half the message unreadable. Stripping the
inline colours, the way the shim already strips `font-family`, would
also strip the sender's brand colours and wreck the design. Rendering
on the surface the message was authored for keeps every inline colour
valid. This is what mainstream mail clients do. Do not "improve" this
into a text recolour without reading that reasoning first.

### How to test dark mode without changing a customer preference

Add the theme class in the DOM, measure, then remove it:

```js
document.querySelector('.app-container').classList.add('theme-dark');
// measure
document.querySelector('.app-container').classList.remove('theme-dark');
```

`.theme-dark` sits on `div.app-container`. Note that `.portal` and
`.theme-dark` are not always on the same element, so prefer
`.theme-dark` as an *ancestor* in selectors over a `.portal.theme-dark`
compound. There is a comment in the stylesheet about this.

Before `d2a8788`, this method could not test the email iframes,
because the shim only injected at iframe load. After `d2a8788` ships,
the theme observer makes the method valid end to end. That is the
first thing to confirm once PR #20 merges.

### Still to do

1. ~~Merge PR #20, then re-verify the iframe fix against the deployed
   shim on a real ticket with emails.~~ **Done 2026-09-03.** PR #20 is
   merged; the deployed CSS and shim both carry the fix (ETag
   `W/"6a98bb9a-5cc18"`, last modified 2026-09-03 00:13 GMT). Verified
   on 358840 against the deployed files, not an injected copy: all five
   frames went from `color: rgb(0,0,0)` on a transparent background to
   `#161922` on `#FFFFFF`, and the iframe element picked up the white
   paper, 8px radius and 12px padding.
2. ~~Confirm the theme-flip observer fires in production.~~ **Done
   2026-09-03.** Adding `.theme-dark` to `.app-container` with the
   ticket already open repainted all five already-loaded messages
   within 600ms. The DOM-injection test method is now valid end to end,
   as predicted.
3. ~~A genuine dark-mode page load has still never happened.~~ **Done
   2026-09-03.** Chrome was signed in as Joel's own agent profile, so
   the saved theme could be changed: Settings and Preferences,
   Application Theme, "Halo PSA Dark", Save. Verified as a real load,
   not injection: `themeDarkOnLoad` true straight out of the reload.
   Surfaces measured correct against the tokens, nav `#0C0E16`, cards
   `#161A25`, headings `#ECEEF4`.

   **Two things a genuine load taught us that injection could not.**
   First, `localStorage.P_theme` is a MIRROR, not the source: setting
   it and reloading is overwritten by the server value, so the only way
   in is the settings form. Second, in a real dark load there are TWO
   `.app-container` divs and `.theme-dark` lands on the one WITHOUT
   `.portal`; `document.querySelector('.app-container')` returns the
   other one. This vindicates the existing rule of using `.theme-dark`
   as an ancestor rather than compounding it with `.portal`. Any new
   selector written as `.portal.theme-dark` will silently never match.

4. ~~Quote Raised pill is still unseen in any mode.~~ **Done 2026-09-03**
   on ticket 358933, and it was broken. It rendered transparent with
   muted inherited text.

   The cause was not that status. The last-resort fallback that paints
   unmapped chips as a neutral outlined pill excludes known chips by
   inline `rgb()` and by a hand written `:not([title=...])` list, but
   never by the `s-*` class the shim applies, and its 2133 character
   selector far outranks the `.s-*` colour rules. **Eight of the
   thirty-one mapped statuses were affected**: Open Order, Closed
   Order, Open Item, Closed Item, Invoiced, Quote Raised, Quote Sent,
   Scoped. Fixed in `9966a88` at the root: `data-status-stamped` now
   means "has a mapped colour class" and the fallback carries
   `:not([data-status-stamped])`. Adding a status to STATUS_MAP is now
   enough; the title list no longer needs syncing.

   The earlier note here that the mapping is keyed on the inline
   `rgb(...)` was only half right. There are three paths, class, title
   and inline rgb, and the class path is the one the shim drives.

---

## 2. Mobile

### The real finding

**There is no phone breakpoint, and Joel has confirmed that is not
intended.** Reading the deployed stylesheet, the only narrow blocks
are:

| Media query | Purpose |
|---|---|
| `(max-width: 900px)` | small desktop / large tablet |
| `(max-width: 768px)` | tablet, about 7.1 KB of rules |

There is no `480px` block, despite `dark-mode-test-checklist.md`
listing "Mobile (480px) and tablet (768px) responsive".

**Superseded 2026-09-03, read the audit section below before acting on
this.** The conclusion drawn here, that phones fall into tablet rules
and a 480px block is the work to do, did not survive contact with an
actual phone-width render. The 768px block was authored as the phone
block: its comments cite tuning at vw=390, 412, 428 and 454. Adding a
480px breakpoint is not what is needed. Repairing rules inside the
768px block that HaloPSA's runtime inline styles defeat is.

To confirm the list yourself, comments stripped so a commented
breakpoint does not produce a false match:

```js
const raw = await fetch('https://portal.interconnekt.com.au/__interconnekt/self-service-portal-design.css',
  {cache:'no-store'}).then(r=>r.text());
[...raw.replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/@media([^{]*)\{/g)].map(m=>m[1].trim());
```

### SOLVED 2026-09-03: how to render the portal at phone width

Three handoffs said mobile had never been rendered. It has now. The
method is a **same-origin iframe**, and it needs no phone, no second
login and no human.

An iframe gets its **own** viewport. Size it to 390px and everything
inside resolves against 390px: media queries fire, percentage widths
resolve, and `position: fixed` pins to the iframe, not the desktop
window. That last point is exactly what made the old
constrain-a-container trick invalid, and it is why this one is not.

Run this in the authenticated Chrome tab, on the page you want to see:

```js
// Wait for the real page to finish rendering FIRST. Cloning too early
// captures the app shell and you get a blank iframe.
for (let i = 0; i < 30; i++) {
  if (document.querySelector('.kbdetails .article')) break;   // per-page probe
  await new Promise(r => setTimeout(r, 1000));
}
const clone = document.documentElement.cloneNode(true);
clone.querySelectorAll('script, noscript, #__mobe').forEach(n => n.remove());
const head = clone.querySelector('head');
const b = document.createElement('base');
b.href = 'https://portal.interconnekt.com.au/';
head.insertBefore(b, head.firstChild);
document.getElementById('__mobe')?.remove();
const f = document.createElement('iframe');
f.id = '__mobe';
f.style.cssText = 'position:fixed;top:0;left:0;width:390px;height:' +
  (innerHeight - 4) + 'px;z-index:2147483647;border:2px solid #FF2D55;background:#fff;';
document.body.appendChild(f);
const d = f.contentDocument;
d.open(); d.write('<!DOCTYPE html>' + clone.outerHTML); d.close();
```

Then screenshot with `computer` action `zoom`, region `[0,0,332,800]`
(the 1512-wide screenshot frame maps 1800 CSS px, so 390 CSS px is
about 332). Measure inside with `f.contentDocument` /
`f.contentWindow`. Remove the iframe when you are done.

What you get: the real rendered DOM, the real deployed stylesheet, a
genuine 386px viewport with `(max-width: 480px)` matching true.

What you do not get: React and the Worker shim do not run in the
clone, and iframe documents do not survive `cloneNode`, so email
bodies inside a ticket render as empty white boxes. That is a clone
artefact, not a bug. For anything JS-driven, still use a real phone.

**The one trap in this method, found 2026-09-04.** The clone freezes
whatever React had ALREADY rendered at the parent tab's width. Where
HaloPSA changes its component tree by width rather than by CSS, the
iframe shows you the desktop tree at a phone width, which is a layout
that never actually occurs.

The ticket list is exactly that case. **At phone width HaloPSA renders
the TILE template, not the react-table**, and it is a React decision
with no user-facing toggle: the same URL and account shows 15
`.rt-tbody .rt-tr` rows at 1800px and `.main-tile-item` tiles on a
phone. Joel's phone screenshots are what proved it; every clone in this
repo had shown the table.

Two consequences worth knowing:

1. The ticket-list card rules added in PR #21 target the react-table,
   so on a real phone they are **dormant**. They are gated on a stamped
   `summary` cell, so they are harmless, and they still fire for anyone
   who meets the table at a narrow width (a tablet, or a resized
   desktop window). But the phone ticket list is styled by the
   `.main-tile-item` rules, not by those.
2. To work on the tile, reconstruct its markup rather than trusting a
   clone. The template is a two column table and this reproduction
   behaved identically to Joel's screenshots:

```html
<div class="inlinetile"><div class="main-tile-item table-tr"><table><tbody>
<tr><td><span>Contact Name (Client)</span></td>
    <td style="width:135px; text-align: right;"><span>ID:0252741-C</span></td></tr>
<tr><td><span>Project Task</span></td>
    <td style="text-align: right;"><span style="color: rgb(119, 119, 119);">8/24/2026 14:50</span></td></tr>
<tr><td><span style="color: rgb(119, 119, 119);">Long summary text</span></td>
    <td style="text-align: right;"><div style="margin-right:20px"><span
      class="status-avatar fortile small" title="In Progress"
      style="background-color: rgb(0, 165, 255); max-width: 90px;">In Progress</span></div></td></tr>
</tbody></table></div></div>
```

Before trusting any clone-based finding, ask whether the surface could
be one HaloPSA rebuilds by width. Ticket list: yes. Ticket detail, KB,
Home, services, forms: no, all verified to render the same tree at both
widths.

**Why the obvious routes fail, so nobody re-tries them:**

- `resize_window` on the Chrome extension cannot work here. The tab's
  renderer is decoupled from its OS window: `innerWidth` is pinned to
  `screen.width` (1800) while `outerWidth` reads 416x220, i.e. the
  frame is smaller than its own viewport. A resize call returns
  success and `outerWidth` does not even change. Not a fullscreen
  state; do not spend more time on it.
- The in-app Browser pane (`mcp__Claude_Browser__*`) does have real
  device emulation, but it carries no portal session and redirects to
  Microsoft SSO. Logging in there is not something an agent should do.
- Framing the live portal URL instead of a DOM clone does not work
  either: the app boots but hangs on its loading spinner, and the
  HaloPSA Custom CSS (which carries the `@import`) is injected by
  React at runtime, so our stylesheet never loads.
- A page-side `fetch()` to a localhost capture server never leaves the
  browser, even with `Access-Control-Allow-Private-Network`. The
  request hangs rather than failing.

### What the first real mobile audit found

Rendered at 386px as Jeremy Urbach (IDA) on 2026-09-03.

**The framing in this document was wrong, and worth correcting.** The
768px block is not a tablet block that phones happen to fall into. Its
own comments cite tuning at vw=390, 412, 428 and 454 and repeated
review passes by Joel, so it *is* the phone block. A 480px breakpoint
is not the missing piece. What was missing is that a few rules inside
the existing block are defeated by HaloPSA React-runtime inline styles.
Fix those before adding any new breakpoint.

| Surface | Verdict at 386px |
|---|---|
| **Home** | Clean. Cards stack full width, headline wraps, no overflow. |
| **Ticket detail** | Sound. Sidebar stacks below the thread at full width, subject wraps (including Japanese), action buttons stack. |
| **KB article** | **Was badly broken. Fixed in `dde4b62`.** |
| **Ticket list** | **Worst offender, as predicted. Fixed in `dd9e7d8`.** |

**KB article, fixed.** Two runtime inline styles were unopposed below
769px. The article column kept `margin-left: 30%; width: 70%`, so it
rendered 246px wide with 105px of dead space on the left and
`.kbdetails` at 213px. The tree menu kept `position: fixed; top: 240px;
bottom: 0`, so the existing `order: -1` and `max-height` rules could
never stack it: it painted over the article from y=240 down, tree links
interleaved with article text, both unreadable. After the fix the
column is 351px, the tree is static and below the article, and nothing
overflows.

**Ticket list, fixed in `dd9e7d8`.** In list view the table measured
**2828px wide inside a 351px container, 25 columns**. It scrolled
horizontally on `div.split` (`overflow-x: auto`), so the existing rule
setting `.rt-table { overflow: visible }` to kill a scrollbar did not
help; the scroll simply moved up one ancestor. Note the mobile block's
tile-card rules assume the **tile** view, but this contact's saved view
is the **list** view. Each row is now a card with summary, ID, status
and age. `.split` scrollWidth went from 2825 to 351.

**Read this before touching the ticket list again.** The card rules
depend on a `data-col` attribute that `Portal/iframe-theme.js` now
stamps on every `.rt-th` and `.rt-td` from that column's header text.
That indirection is not decoration. `.rt-th` and `.rt-td` carry no
per-column class, and the Summary, ID and Age cells hold bare text with
no child element to hook, which leaves `:nth-child()`. Column order
varies per saved ticket view, which the shim's own `findAgeColIndex`
already documents, so an index meaning "Status" in one view means
something else in the next.

Three things about that block are load bearing and easy to break:

1. **Every rule is gated on `:has(.rt-td[data-col="summary"])`.** The
   tile view renders `.main-tile-item` inside this same ReactTable, so
   an ungated "hide every cell" blanks the tile list. The guard is also
   the shim fallback: no stamp means no hide, so the list degrades to
   horizontal scroll rather than vanishing. Verified both ways.
2. **The guard must sit on the hide rule and the show rules equally.**
   `:has()` contributes its argument's specificity. Guarding only the
   hide rule lifted it to (0,8,2) against the show rules' (0,6,2) and
   every cell in every card disappeared, silently.
3. **The summary cell needs `flex: 1 0 100%`, guard included.** With
   shrink enabled, or at lower specificity than the `flex: 0 0 auto` in
   the show rule, short titles collapse to their text width and the ID
   rides up onto the title line.

**Impersonation banner, fixed in `9966a88`.** `.app-notice` overlapped
the page title at phone width on every page (banner y 72 to 136, H1
from y 120). Worth knowing: the `position: fixed; top: 72px; left: 50%;
min-width: 320px` centred pill is OUR rule near the top of the
stylesheet, not HaloPSA's, whose own `.app-notice` sets only
`padding: 5px`. It is now a full width sticky strip under the nav at
phone width, which takes flow space (so no clearance constant has to
track a banner whose height depends on the impersonated name) and stays
pinned while scrolling.

If you need to work on this banner and are not impersonating, it is not
in the DOM. Rebuild it faithfully inside the mobile iframe with
`class="app-notice clickable"` and
`style="background-color: rgb(47, 53, 94); position: absolute;"`, as a
child of `.app-container.portal` before `.main`. That reproduced the
original overlap numbers exactly, which is what makes it a valid test
bed.

**Ticket detail sidebar, fixed in `dd9e7d8`.** The layout was correct
but the sidebar landed 5,714px down the page, so a phone user scrolled
past the entire conversation to reach Status, SLA, category and dates.
It now sits above the thread, at 448px.

Two things to know if you revisit it. The sidebar's parent is
`.content`, a plain `display: block` div and **not** a Bootstrap
`.row`, so `order` on its own is inert; the parent has to be flexed
first. And the thread is pushed down with `order: 1` rather than the
sidebar being pulled up with `order: -1`, because `.content` also holds
the workflow stepper as an unclassed first child, and a negative order
on the sidebar would jump it above the stepper too.

Watch for the pill work from PR #20 while you are there: HaloPSA
sizes status pills by label length across six variants, and narrow
columns will push labels into the smaller variants.

---

## 3. Quick reference

| Thing | Value |
|---|---|
| Portal | `https://portal.interconnekt.com.au` |
| Ticket with five email iframes | `/portal/ticket?id=358840`, IDA, Scheduled |
| KB test article | `/kb?btn=46&faqlist=1&id=16` |
| Stylesheet on the Worker path | `/__interconnekt/self-service-portal-design.css` |
| Deployed ETag before PR #20 | `W/"6a9817b3-5bd8e"` |
| Theme class location | `div.app-container` |

Check the server before believing the browser:

```bash
curl -sI https://portal.interconnekt.com.au/__interconnekt/self-service-portal-design.css
```

Note for agents: the auto mode classifier blocked `gh pr merge`,
`git fetch`, `gh pr view`, and clearing browser storage. Commit, push
with `git push origin HEAD:refs/heads/<branch>`, `gh pr create` and
`gh pr comment` all worked. Leave merges to Joel and say so.
