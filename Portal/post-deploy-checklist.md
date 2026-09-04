# Post-deploy checklist, consistency pass (2026-09-04)

Tokens and duplicate rules, phone block, desktop shell and padding scale.
Written before the merge. Merging to `main` IS the deploy: GitHub Pages
publishes and the Worker edge cache expires within 60 seconds, so this is
in front of customers about a minute after the merge.

Work top to bottom. Items 1 and 2 are the two changes with the widest blast
radius and the only ones that could justify a revert on their own.

---

## 0. Confirm the deploy actually landed

Check the server before believing the browser (trap 4).

Baseline immediately BEFORE the merge:

| File | ETag | Last modified |
|---|---|---|
| stylesheet | `W/"6a9a031f-63353"` | Thu, 03 Sep 2026 23:30:39 GMT |

```bash
curl -sI https://portal.interconnekt.com.au/__interconnekt/self-service-portal-design.css | grep -i 'etag\|last-modified'
```

- [ ] ETag is no longer `W/"6a9a031f-63353"`
- [ ] Hard-refresh the portal (Cmd+Shift+R) before judging anything visually

## 1. Desktop page shell, every page

One container measure replaces the 1240px cap, the 85% list rule and
HaloPSA's 85% `.container-large`. Before the change the page H1 sat at six
different left edges at 1800px (156, 145, 208, 319, 297 and 412px).

- [ ] Home, My Tickets, Sales Tickets, a ticket, an opportunity, My
      Invoices, Service Catalogue, Knowledge Base, a KB article, Approvals,
      My Dashboards, Settings: the back arrow, the H1 and the first card
      share one left edge, and it is the same edge on every page
- [ ] New Ticket still renders its form card centred (deliberate)
- [ ] Ticket detail: thread on the left, sidebar on the right, nothing
      clipped at the right edge, the workflow stepper spans the same width
      as the cards below it
- [ ] KB index: tree on the left, article cards on the right, no clipping
      of the card's right edge (the `.container-large` overflow trap)
- [ ] My Tickets table still fits without a horizontal scrollbar at 1440px
      and 1800px

**If any page shows a horizontally scrolling or clipped layout, revert.**

```bash
git revert -m 1 <merge-commit-sha> && git push origin HEAD:main
```

## 2. Status and priority pills, every list and every card

- [ ] Ticket list: the priority pill and the status pill in one row are the
      same height (both 10.5px text, `3px 12px`)
- [ ] Priority colours unchanged in light mode: Low green, Medium amber,
      High warm red, Critical red
- [ ] Dark mode (Settings, Application Theme, Halo PSA Dark, Save, then
      back to Halo PSA Standard when done): High reads one shade lighter
      than before (0.18 wash), everything else unchanged
- [ ] Home tiles: the On Hold pill is red-family, 600 weight, same height
      as the status pill beside it, and flips correctly in dark mode (it
      previously stayed light-mode pink)
- [ ] KB test article (`/kb?btn=46&faqlist=1&id=16`): the five status
      lozenges are blue, green, amber, red, violet in light mode; in dark
      mode they match the ticket pills' wash

## 3. Dropdowns and tables

- [ ] Any react-select dropdown (My Tickets filter, New Ticket contact,
      nav search): hovered option is accent-soft with blue ink, the selected
      option accent-subtle, not grey
- [ ] Table headers on My Tickets, Sales Tickets, My Invoices, My
      Dashboards: 1px hairline under the header, header text aligned with
      the body cells, no double separator
- [ ] Pagination Previous / Next: ghost style, does not narrow on hover

## 4. Phone width, every page (DevTools device toolbar or a real phone)

- [ ] Every page H1 is 24px, including ticket detail, invoices and forms
- [ ] My Invoices: each invoice is a card (number, date, total, status
      pill, Pay button), no horizontal scroll. If HaloPSA serves a tile
      template on a real phone instead, the cards are simply not used
- [ ] My Tickets list-view cards: 12px radius, no shadow (matches the tile)
- [ ] KB article: h3, blockquote, code block, hr and panels sized for the
      card, panels keep their icon clear of the text
- [ ] Footer padding reduced, my-account drawer padding 18px, share popup
      never wider than the screen
- [ ] Service request page: masthead artwork hidden whichever class it uses
- [ ] Impersonation banner (impersonating only): full-width strip under the
      nav with no drop shadow
- [ ] Nav logo: about 22px tall, close to the hamburger
- [ ] My Dashboards: the table fills the width, second row not truncated

## 5. Desktop regression sweep

- [ ] Home unchanged apart from the grid edge aligning with the shell
- [ ] Kanban (if any customer view uses it): cards 12px radius, no resting
      shadow, columns intact
- [ ] Service Catalogue: "Service Categories" reads as a section heading
      under the page title, search box at list-filter height
- [ ] No orphan dash under any page title (KB, services, approvals,
      tickets, invoices, dashboards)

## If something is wrong

Revert first, diagnose after; the file is in front of customers.

```bash
git revert -m 1 <merge-commit-sha> && git push origin HEAD:main
```

The revert is live within about a minute on the same cache timing.
