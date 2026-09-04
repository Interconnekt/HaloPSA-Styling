# Handoff: cross-page and desktop-to-phone consistency pass

Written 2026-09-04 (session 6). Read `AGENTS.md` first, then section 7 of
`HANDOFF-2026-09-02.md` (the four traps), then this. The dark-mode and
mobile history is in `HANDOFF-mobile-and-dark-mode.md`; this file
supersedes its "what is actually left" list.

## 0. How this session could and could not look at the portal

- **The Chrome extension debugger is blocked on Joel's Mac.** A managed
  Chrome policy (`/Library/Managed Preferences/com.google.Chrome.plist`,
  `DeveloperToolsAvailability = 2`) makes every `chrome.debugger` attach
  fail, so the Claude in Chrome `javascript_tool`, `computer` screenshot,
  click and scroll all return "Cannot attach to this target". The
  branch-injection preview and the same-origin iframe method in the mobile
  handoff both need that debugger, so neither was available. Only Joel can
  change the policy (it is an Intune Chrome baseline); do not edit it.
- **What still works:** `read_page`, `find`, `get_page_text`, `navigate`
  and `scroll_to` (by ref) from the extension; computer-use
  `app_screenshot` of the Chrome window (read tier); AppleScript for window
  management (`make new window`, `set bounds`, `set URL of active tab`,
  `active tab index`). `execute javascript` via AppleScript is off and must
  stay off.
- **Phone width without touching Joel's window:** a second Chrome window
  430px wide, created with AppleScript, gives a genuine phone viewport
  (media queries fire, React rebuilds by width) and shares the portal
  session. Screenshot it by window id. Close it when done; Joel is often at
  the machine.
- **One correction to the mobile handoff.** At 430px in desktop Chrome
  HaloPSA renders the ticket list as the react-table LIST view, with the
  PR #21 card rules firing, not the `.main-tile-item` tile template that
  Joel's phone screenshots showed. The tile swap is therefore not a pure
  width decision (user agent or touch, most likely). Both paths need to
  stay styled.

## 1. Pages and URLs Jeremy Urbach (IDA) can open

| Page | URL | Notes |
|---|---|---|
| Home | `/portal/home` | |
| My Tickets | `/portal/tickets` (redirects to `?viewid=1`) | |
| Sales Tickets (opportunities) | `/portal/opportunities` | H1 reads "My Tickets", HaloPSA's label |
| Ticket detail | `/portal/ticket?id=358840` | five email iframes |
| Opportunity detail | `/portal/opportunity?id=358925` | four-step stepper |
| My Invoices | `/portal/invoices` | 113 invoices, Pay buttons |
| Service catalogue | `/portal/services` | Jeremy has no access to any item, `?categoryid=N` renders empty |
| New Ticket | `/portal/newticket` | |
| KB index | `/portal/kb` | |
| KB test article | `/portal/kb?btn=46&faqlist=1&id=16` | |
| Approvals | `/portal/approvals` | empty state |
| Dashboards | `/portal/dashboards` | two rows |
| Settings | `/portal/settings?tab=preferences` | theme select, marketing checkbox |
| 404 | any unknown path, e.g. `/portal/devices` | "ERROR 404" page, unstyled |

`/portal/projects`, `/portal/assets`, `/portal/quotes`, `/portal/profile`
and `/portal/myaccount` are 404s or blank. My Devices and My Projects are
reached only through the home buttons (React `history.push`), and their
routes were not discovered this session.

## 2. What was measured

Desktop, 1800px viewport, left edge of the page H1 (from the window
screenshots, about 2px accuracy):

| Surface | Left edge |
|---|---|
| Ticket list, opportunities, invoices, KB index, dashboards | 156px |
| Service catalogue | 145px |
| Home dashboard grid | 208px |
| Ticket detail, opportunity detail, approvals | 319px |
| Settings | 297px |
| New Ticket form | 412px |

Six different edges for the same role. The stylesheet had a 1240px cap for
`.container`, an 85% rule for `.container.ticket-list` and HaloPSA's own
85% `.container-large` on KB and services.

Phone, 430px window: every page H1 sat at 14px except Approvals (29px);
the invoices table demanded 1430px and scrolled under a sticky Pay button;
the dashboards table rendered about 335px wide in a 402px container and
truncated its second row; an orphan 18px dash rendered under every page
title whose `.page-subtitle` is empty (KB index, KB article, services,
approvals, tickets, invoices, dashboards); the nav logo rendered about
205px wide and 28px tall, 55px from the left, next to an 18px hamburger
glyph (Joel: "too big compared to the hamburger and spaced too far to the
right").

Joel's two asks during the session: "check padding and section width
consistency as well, both outside container and inner", and the nav logo
note above.

## 3. What changed

Three passes, each on its own branch, merged into
`claude/portal-ui-consistency-c2e18a` in this order. Every change is in
`Portal/self-service-portal-design.css`; nothing else on the portal moved.

### 3.1 Tokens, pills and duplicate rules (commit `b6b1313`)

- Priority pills now resolve through tokens. New `--pill-high-bg/ink/dot`
  (the amber-to-red blend that had no name); Low, Medium and Critical borrow
  `--pill-resolved-*`, `--pill-new-*` and `--pill-rejected-*` with
  `--portal-ok/warn/err` for the dot. Light mode is byte-identical; dark
  High background moves from a 0.20 wash to the 0.18 every other dark pill
  uses.
- KB status lozenges use the same `--pill-*` tokens. Light unchanged; dark
  wash 0.15 to 0.18 so a lozenge matches the ticket pill beside it.
- On Hold indicator keeps its documented red exception but takes it from
  `--pill-rejected-*`, drops the unexplained 700 weight and `5px 12px 5px
  11px` for the shared 600 and `3px 12px`, and its dark rule is now the
  ancestor form `html body .theme-dark [data-on-hold-indicator]` (the old
  compound `.portal.theme-dark` never matched, so this pill stayed pink in
  dark mode).
- Live priority pill 11px to 10.5px and `3px 12px 3px 10px`, tile status
  pill `4px 12px` to `3px 12px`, so the two pills in one row are one
  height.
- react-select dropdowns hover accent-soft with accent ink and select
  accent-subtle, declared once. A nav-search copy that out-specified it had
  put every dropdown back on grey.
- Duplicate selectors collapsed: dead 40px form-field heights (42px is the
  value), one `.workflow-steps-wrap` rule, one `.Select__menu` family,
  `-btn` removed from the primary-button hover group (pagination stays
  ghost and no longer narrows 8px on hover), one 1px hairline under every
  react-table header, header padding `12px 16px` declared once, the
  redundant `.status-avatar` typography copy, the inert `.react-kanban-*`
  rules (not in the DOM), and `.priority-avatar.p1` to `.p4` repointed at
  the priority tokens (p3 and p4 were blue and grey).
- KB tag colour cycle position 2 now uses `--pill-resolved-*`; it used
  `--pill-progress-*`, which is byte-identical to position 1, so the five
  hue cycle shipped as four.
- Two stale comments describing a 60px search box corrected (hero 64px,
  lists 40px). No heights changed.

### 3.2 Phone block (commit `4f1c351`)

Every hunk sits inside the existing `@media (max-width: 768px)` block,
which now runs to about line 8030. Desktop is untouched by this commit.

- Page H1 is 1.5rem (24px) on every surface, using the desktop rule's own
  selector list so it wins on source order alone; only the KB article had
  it before.
- Ticket-list row card (list view) is 12px radius with no resting shadow,
  matching `.main-tile-item` and every other phone card.
- Impersonation banner strip drops the desktop pill's drop shadow.
- Service masthead hides `.service-img` as well as `.service-pic`.
- Invoices become cards: gated on the Stripe ids that only exist on that
  page plus the shim-stamped `.rt-td[data-col="invoice-reference"]`. The
  1430px floor is released, the header hidden, each row shows the invoice
  number as the title then date, total, status pill and the Pay button.
  Both `:has()` guard lessons from the ticket cards are carried over. With
  no stamp, nothing fires and the page keeps its horizontal scroll.
- KB article: `h3`, `blockquote`, `pre`, `hr` and both Confluence panel
  families sized for the phone card; the panel icon reserve drops from
  46px to 40px (the icons are absolutely positioned, so they stay clear).
- Dead duplicate `.kbdetails img / pre / iframe` guard removed (the live
  copy is outside every media query).
- Footer `24px 14px 16px`; my-account drawer 18px padding, 1.125rem
  header, 44px avatar; Semantic UI popup capped at `calc(100vw - 28px)`;
  Assets empty state 140px / 18px; New Ticket date and time fields each
  take a full row; catalogue artwork 64px to 48px; Gantt card scrolls
  horizontally inside itself.
- Not done: kanban columns (the only column min-width in the file is on
  the inert `.react-kanban-column`, and no comment names the live column
  container), no 480px breakpoint.

### 3.2a Phone addendum (commit `19d19ec`)

- Nav logo at phone width: artwork 22px tall with `width: auto`, the link
  box hugs it and sits 8px from the hamburger, vertically centred in the
  60px bar. Gated on the link containing an `img` or `svg`, so if HaloPSA
  ever emits the logo as a background image the rule is inert.
- Dashboards list: react-table's inline `min-width` floor released and the
  table takes its container width, gated on the shim's
  `data-col="name"` header stamp.
- Invoices header: the two Stripe controls (Pay All, payment method) go
  full width with an 8px gap and no indent, scoped to
  `.container.ticket-list`.
- Not done: the Approvals H1 inset (no wrapper class is named anywhere).

### 3.3 Desktop shell, padding scale, page titles (commit `434e1f2`)

- One page shell. The 1240px cap and the 85% list rule are replaced by a
  single rule on the outermost `.main >` container of every route
  (`.container`, `.container-fluid`, `.container-large`, `.container-max`,
  `.searchscreen-full`): `width: 100%; max-width: 1520px; padding: 0 32px`,
  centred. Nested measures are flattened (`.container-max > .container`,
  a `.searchscreen-full` inside any shell). Result: back button, H1 and
  content share one left edge, 172px at 1800px and 32px at 1440px. Two
  documented exceptions stay centred and narrower: the New Ticket and
  service-request form (1040px) and the KB article reading measure
  (`.kbdetails` 1100px inside its column).
- Card inner padding is a documented three-step scale: compact 16/18 for
  list rows (ticket tile, KB index article, Recent Activity, search result
  row, kanban card), content 20px (sidebar panels, stepper, Next
  Appointment notice, Assets empty state), feature 28px with 32px sides
  for the New Ticket form card and the KB article card. `.kbdetails` loses
  its 32px side padding (it was insetting the card from outside); the
  article card carries `28px 32px` itself in the desktop block.
- Orphan eyebrow dash: `.page-subtitle:empty` is hidden (KB index, KB
  article, Services, Approvals, list pages).
- KB article H1 2.25rem to 1.75rem (the portal H1 ladder); KB `h2`/`h3`
  weight 500 to 600.
- Kanban card and announcements wrapper join the list-card family (12px
  radius, no resting shadow); pagination buttons `0 18px` like the rest of
  the ghost family; the 36px activity toolbar chips apply at every width.
- Section rhythm: `.page-title` bottom margin 16px, `.searchandview` bottom
  margin 16px, `.kblist` stays at 0 with the reason written down.
- Services route: the hero "Service Categories" is demoted to 1.375rem
  and its search box to the 40px list-filter height, scoped by
  `.svcatalog-item`; Home keeps its hero.
- Four comment and dead-rule fixes: the two `.portal .theme-dark
  .searchscreen` selectors rewritten to the ancestor form (they never
  matched); the panel comment that claimed `.theme-dark` sits inside
  `.portal`; section 11's header; nine duplicated header declarations on
  `.ReactTable.main-table .rt-thead .rt-th`; and the dead
  `.kbdetails > .article { padding: 0 }` rule that lost on cascade order.
- Not done: the invoices header cluster on desktop (the comments cover the
  table, not the Pay All / payment-method controls); the home grid needed
  no rule of its own.


## 4. Post-deploy checks

`Portal/post-deploy-checklist.md` is the list for this release, top to
bottom, with the ETag baseline to confirm the deploy landed. The two items
that could justify a revert on their own are the desktop shell (every page
must still render without clipping or horizontal scroll) and the pills.

## 5. Pick up here

- **The PR is waiting on Joel's merge.** Merging is the deploy. Nothing on
  this branch has been seen rendered; every rule was derived from the DOM
  facts in the stylesheet's own comments and is scoped or gated so it is
  harmless if the DOM differs. The post-deploy checklist is the visual
  pass.
- **After the merge, verify against the DEPLOYED file** (trap 3): curl the
  ETag, hard-refresh, then walk the checklist at desktop width in Joel's
  Chrome (window screenshots) and at 430px in a second AppleScript-made
  window. Section 0 above says how, given the debugger policy.
- **Things a screenshot must confirm first**, in the agents' own words:
  `.main > .container-max` is a direct child of `.main` on ticket detail
  (if a wrapper sits between, ticket detail loses its cap and goes to
  HaloPSA's 80%); the orphan dash is really gone (a whitespace-only
  subtitle would defeat `:empty`); the invoice cards fire on a phone
  (they depend on the shim stamping `invoice-reference`, and on HaloPSA
  not swapping invoices to a tile template); the nav logo actually shrank
  (the rule is gated on an `img` or `svg` inside the link); the services
  hero demotion matched on both service routes.
- **Still open after this PR:** the Approvals page H1 inset on phones (no
  wrapper class known); the invoices header cluster on desktop; the
  `.action-details` 55px avatar gutter on desktop; My Devices and My
  Projects routes; kanban columns on phones (no live column class is named
  anywhere); the Report-Template PDF and the 12 undeployed PDF templates
  from the earlier handoffs.
- **House rules, unchanged.** No em or en dashes anywhere. Australian
  spelling. Use the tokens. Merging to `main` is the deploy. Push with
  `git push origin HEAD:refs/heads/<branch>`. The portal login is a
  customer contact: no saved-preference changes, no form submissions, no
  Pay, Submit, Add Note or Time Entry. Close any extra Chrome window you
  made; Joel is usually at the machine.
