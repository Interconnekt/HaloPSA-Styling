# Handoff: dark mode and mobile

Written 2026-09-02 at the end of the fourth session. Topic-scoped, for
picking these two workstreams up fresh. For everything else in the
project read `HANDOFF-2026-09-02-session-4.md`.

Read `AGENTS.md` first, then section 7 of `HANDOFF-2026-09-02.md`
(the four traps), then this.

---

## 0. Before you touch anything

**PR #20 is open and unmerged, with six commits.** Everything below
that is described as "fixed" is fixed *on that branch*, not in front
of customers. Merging to `main` is the deploy, live in about a minute.
Do not re-verify a fix against the deployed stylesheet until it is
merged; you will be looking at the old file. This is trap 3 and trap 4
from the earliest handoff.

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

1. Merge PR #20, then re-verify the iframe fix against the deployed
   shim on a real ticket with emails (358840 has five).
2. Confirm the theme-flip observer fires in production, by toggling
   the theme with a ticket open and watching the messages repaint.
3. A genuine dark-mode load has never happened. Every dark check so
   far was DOM injection. Doing it properly needs the saved theme
   flipped on the contact, which is Joel's call, or a contact whose
   saved theme is already dark.
4. Quote Raised pill is still unseen in any mode. No ticket carries
   that status.

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
listing "Mobile (480px) and tablet (768px) responsive". Phones
currently fall into the 768px tablet rules. That is the work to do.

To confirm the list yourself, comments stripped so a commented
breakpoint does not produce a false match:

```js
const raw = await fetch('https://portal.interconnekt.com.au/__interconnekt/self-service-portal-design.css',
  {cache:'no-store'}).then(r=>r.text());
[...raw.replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/@media([^{]*)\{/g)].map(m=>m[1].trim());
```

### The blocker: mobile has never been rendered, and these tools cannot render it

`resize_window` on the Chrome extension reports success and does
change `window.outerWidth`, but the rendering viewport never moves:

| Measure | Value, unchanged across three attempts |
|---|---|
| `innerWidth` | 1800, equal to `screen.width` |
| `clientWidth` | 1793 |
| `(max-width: 480px)` matches | false |
| `(max-width: 768px)` matches | false |

So no responsive rule ever fires and every screenshot is the desktop
layout. Joel confirmed Chrome is not in fullscreen, so the cause is
unresolved. Do not repeat the three attempts; establish why first.

### What does not work, so you do not retry it

Simulating a narrow viewport by injecting the narrow-block rules and
constraining `.app-container` to 390px is **not valid**. Fixed
position chrome ignores a container constraint: `.nhd-nav` stayed
1793px wide and overhung the box by 1403px. Any layout conclusion from
that setup is wrong.

### Options for actually rendering it

1. **A real phone**, with a portal session. This has been the honest
   answer in three consecutive handoffs. It is still the surest.
2. **The in-app Browser pane** (`mcp__Claude_Browser__*`) has genuine
   device emulation, including a mobile preset with a mobile user
   agent and touch. It does not carry the portal session, so it needs
   a login first. If that login is acceptable, this is the best
   agent-driven option.
3. **Work out why `resize_window` fails.** Worth ten minutes before
   giving up: try a brand new Chrome window, check for multiple
   windows or a tiled or zoomed window state.
4. **Joel drives Chrome DevTools device toolbar** and shares
   screenshots. Fastest path to seeing the truth, needs a human.

### When you get to writing the breakpoint

Answer the design question before writing CSS: what should change at
phone widths that does not already change at 768px? The 768px block
is only about 7.1 KB, so read it in full first.

Surfaces that need checking at phone width, roughly in order of how
badly they are likely to break:

- **Ticket list.** A wide table with Summary, Client, User, Priority,
  ID, Workflow, Status, Agent, Team, Age and SLA columns. Almost
  certainly the worst offender.
- **Ticket detail.** A two column split, main thread plus the
  right sidebar, which has to stack.
- **Home**, and the Tile split pane, which has never been exercised in
  any session.
- **KB article** (`/kb?btn=46&faqlist=1&id=16`), which has tables,
  panels and code blocks.

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
