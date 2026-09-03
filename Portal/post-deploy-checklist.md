# Post-deploy checklist, PR #21

Mobile card layout, KB article fix, sidebar reorder, status pill fix,
impersonation banner. Written 2026-09-04, before the merge.

Merging to `main` IS the deploy. GitHub Pages publishes and the Worker
edge cache expires within 60 seconds, so this is in front of customers
about a minute after the merge.

Work top to bottom. Item 1 is the one genuine unknown and the only one
that could justify a revert on its own.

---

## 0. Confirm the deploy actually landed

Check the server before believing the browser. This is trap 4 from the
earliest handoff, and it has produced several false "still broken"
reports.

Baseline immediately BEFORE the merge:

| File | ETag | Last modified |
|---|---|---|
| stylesheet | `W/"6a98bb9a-5cc18"` | Thu, 03 Sep 2026 00:13:14 GMT |

```bash
curl -sI https://portal.interconnekt.com.au/__interconnekt/self-service-portal-design.css | grep -i 'etag\|last-modified'
```

- [ ] ETag is no longer `W/"6a98bb9a-5cc18"`
- [ ] The shim now carries the new column stamper (this returned `0`
      before the merge, expect a non-zero count):

```bash
curl -s "https://portal.interconnekt.com.au/__interconnekt/iframe-theme.js?cb=$RANDOM" | grep -c 'data-col'
```

- [ ] Hard-refresh the portal (Cmd+Shift+R) before judging anything
      visually

---

## 1. Tile view at phone width, THE UNTESTED ONE

**Do this one first.** Every other item on this list was verified at a
real 386px viewport. This one was not, because the test contact's saved
ticket view was the LIST view throughout, so the tile view was never
rendered at any width.

Why it matters: the stylesheet's own notes say the tile view renders
`.main-tile-item` **inside the same ReactTable** that the new card rules
target. Those rules hide every cell in a row. They are deliberately
gated on the row carrying a shim-stamped `summary` cell, specifically so
the tile view cannot be caught by that hide, and the fallback was
verified (with no stamp, all 25 cells stay visible). But the guard was
proven against an unstamped LIST table, not against a real tile table.

- [ ] Switch the ticket list to **tile** view
- [ ] View it at phone width (DevTools device toolbar, iPhone 12 Pro or
      any width at or below 768px)
- [ ] Tiles still render as tiles, with visible content

**If the tile list renders blank or empty, stop and revert.** That is
the guard failing, and it is the one failure mode in this release that
loses information rather than merely looking wrong.

```bash
git revert -m 1 <merge-commit-sha> && git push origin HEAD:main
```

---

## 2. Ticket list, LIST view, phone width

Measured before the fix: a 2828px wide, 25 column table inside a 351px
container, everything past the second column off screen.

- [ ] Each row is a card, not a wide scrolling table
- [ ] No horizontal scrolling anywhere on the page
- [ ] Each card shows: summary on its own line, then ID, status pill and
      age on one line below
- [ ] Age reads e.g. `156.0 days`, with the unit, not a bare number
- [ ] Long summaries wrap onto two lines and the ID stays below, never
      beside the title
- [ ] Tapping a card still opens the ticket (the click handler is on the
      row group, and the expander column is now hidden)

## 3. Status pills, every width, this is the widest blast radius

The pill fix is the only change in this release that is **not** confined
to the mobile breakpoint, so it affects desktop too.

Eight of the thirty-one mapped statuses previously rendered as a
transparent chip with muted grey text:

Open Order, Closed Order, Open Item, Closed Item, Invoiced,
Quote Raised, Quote Sent, Scoped.

- [ ] Ticket 358933 (Quote Raised) shows a filled violet pill, not a
      ghost chip. Light mode and dark mode
- [ ] Spot check a few other statuses from that list if you have tickets
      carrying them
- [ ] **Regression check that matters most here:** a status that is NOT
      in `STATUS_MAP` still renders as the neutral **outlined** pill, a
      visible border with readable text. The marker semantics changed,
      so this is the path most likely to have broken
- [ ] Common statuses are unchanged: New, In Progress, On Hold,
      Scheduled, Resolved, Closed, Assigned

## 4. KB article, phone width

Before the fix the article column rendered 246px wide on a 386px screen
with 105px of dead space, and the tree menu was `position: fixed` and
painted over the article body.

- [ ] `/kb?btn=46&faqlist=1&id=16` at phone width
- [ ] Article card fills the width, no large empty left margin
- [ ] Tree menu sits BELOW the article, in the flow, and does not
      overlay the text
- [ ] No horizontal scrolling
- [ ] Tables, panels and code blocks stay inside the card

## 5. Ticket detail, phone width

- [ ] Sidebar (status, SLA, dates, category) appears ABOVE the message
      thread
- [ ] The workflow stepper is still the first thing under the title, the
      sidebar comes after it, not before
- [ ] Subject wraps rather than overflowing
- [ ] On a ticket with emails, message bodies render as white paper
      cards and are readable in dark mode

## 6. Dark mode

Settings and Preferences, Application Theme, Halo PSA Dark, Save. Note
that `localStorage.P_theme` is only a mirror; the settings form is the
only way to change it.

- [ ] Ticket list, ticket detail, KB article and Home all readable
- [ ] Status pills readable, no black-on-dark or invisible text
- [ ] Email iframes render as white paper with dark text
- [ ] Switch the theme with a ticket open: already-open messages repaint
      rather than staying on the old theme
- [ ] Set the theme back to Halo PSA Standard when finished

## 7. Impersonation banner, phone width

Only visible while impersonating, so no customer ever sees it.

- [ ] Impersonate a contact, open any page at phone width
- [ ] Banner is a full width strip directly under the nav, not a
      floating centred pill sitting on the page title
- [ ] The page title is fully visible
- [ ] The banner stays pinned under the nav while scrolling

## 8. Desktop regression sweep

Every mobile change sits inside the existing `max-width: 768px` block,
so desktop should be untouched apart from the status pills in item 3.
This was verified at 1800px before the merge, so treat it as a quick
confirmation rather than a hunt.

- [ ] Ticket list still renders as a normal table with all columns
- [ ] Ticket detail still has the sidebar on the right, beside the
      thread, not above it
- [ ] KB article still shows the tree and article side by side
- [ ] Home unchanged

---

## If something is wrong

Revert first, diagnose after; the file is in front of customers.

```bash
git revert -m 1 <merge-commit-sha> && git push origin HEAD:main
```

The revert is live within about a minute on the same cache timing.

To review a fix WITHOUT deploying it, use the branch-injection snippet
at the top of `HANDOFF-mobile-and-dark-mode.md`, and the same-origin
iframe method in that file to see any page at a real 390px viewport.
