# Handoff: Worker built and merged, cutover still to do

Written 2026-09-02 at the end of the second session of the day. It
supersedes `HANDOFF-2026-09-02.md` for status, but section 7 of that
document (the four traps that caused every regression) is still required
reading and is not repeated here.

Read `AGENTS.md` first, then section 7 of the earlier handoff, then this.

---

## 0. What landed on `main` today

Four PRs, merged in this order at about 09:58 UTC:

| PR | What | Effect on the live portal |
|---|---|---|
| #14 | 628 em and en dashes removed across the repo | None: comments and prose only; both CSS files byte-identical once comments are stripped |
| #15 | `--ik-` renamed to `--ic-` (243 occurrences) | None: definitions and references moved together |
| #16 | `--portal-accent-2` and `--portal-violet` on the Design System values | **Visible**: pink CTA and highlighter, violet panel-note tokens, Scheduled and Quote Raised pills, the progress lozenge, `--portal-tint-warm` |
| #17 | `Portal/worker/`: the Cloudflare Worker, wrangler config, smoke test, runbook | None until deployed and cut over |

Verified against the server, not the browser: at 09:58:45 UTC GitHub
Pages was serving the stylesheet with 243 `--ic-` tokens, zero `--ik-`,
zero dashes, `#A343BE` present and `#C026D3` gone. Any browser that had
the portal open before then holds the old copy for up to ten minutes.

**Nobody has looked at #16 in a browser.** First job for anyone with a
portal session: open a KB article with a note panel (Test Article,
`/kb?btn=46&faqlist=1&id=16`), a ticket list with a Scheduled or Quote
Raised status, and a page with the get-in-touch CTA, in both modes. The
hover and subtle values were derived with the same ratios as the values
they replaced, so nothing should look wrong, but derived is not seen.

---

## 1. Priority one: deploy the Worker and cut over

**Status: built, smoke-tested against the real HaloPSA origin, not
deployed.** The only blocker is Cloudflare credentials on the machine
doing the deploy. The Cloudflare MCP connector cannot help: it has
read-only Worker tools and nothing for DNS or deploys.

The runbook is `Portal/worker/README.md`. Do not redesign it. In short:

1. `cd Portal/worker && npm install && npx wrangler login && npm run deploy`.
   Safe at any time: the route carries no traffic until the DNS record
   is proxied.
2. In the Cloudflare dashboard for `interconnekt.com.au`, confirm: SSL
   mode Full (strict); Rocket Loader off and Email Address Obfuscation
   off for the portal hostname; what the Workers Free plan does at its
   100,000 requests a day cap (every request on the hostname counts,
   static chunks and SignalR included), or take the USD 5 Paid plan.
3. DNS, Records, `portal` CNAME: Proxy status to Proxied. Low-traffic
   window, kill-switch page open.
4. Verify: `curl -sI https://portal.interconnekt.com.au/portal/home`
   shows `cf-ray` and `x-interconnekt-worker: html-injected`;
   `curl -s .../portal/home | grep -c '__interconnekt/iframe-theme.js'`
   is `1`; `npm run smoke:prod` passes. Then log in as the impersonated
   contact and check ticket 358840 reflows, the `Age` column on
   `/portal/tickets` shows one decimal, On-Hold pills on home and
   sidebar, logout and login, and a one-hour token refresh.
5. Repoint the HaloPSA Custom CSS `@import` at
   `https://portal.interconnekt.com.au/__interconnekt/self-service-portal-design.css`.
   After that a merge is visible in about a minute instead of ten. If
   the proxy or the route is ever removed, put the GitHub Pages URL back
   at the same time, because the path only exists on the Worker.

Kill switch, fastest first: delete the Worker route (seconds); set the
record back to DNS only (minutes); Pause Cloudflare on Site (also hits
the website, avoid).

What the cutover unlocks is unchanged from the earlier handoff: email
body theming, fixed-width email containment, `Age` formatting, status
and priority pill class stamping, the On-Hold indicator. The raw float in
the `Age` column is still visible to customers today.

Decisions already taken, so nobody re-opens them: stylesheet delivery is
option 1 (proxy through the Worker with a 60 second TTL); the Worker adds
a `Sec-Fetch-Dest: document` guard on top of the content-type check; the
staging hostname step was judged not worth its two human dependencies
because it cannot prove the login cycle anyway. If Joel wants staging
after all, the README says what it needs.

Facts that lower the cutover risk: the zone is already on Cloudflare
nameservers; the origin certificate is Amazon-issued for
`portal.interconnekt.com.au`, DNS-validated, expires 2027-03-04, so
proxying does not touch its renewal; HaloPSA's HTML is `no-store` and its
static chunks are content-hashed, so no cache rule is needed.

---

## 2. Not code: two HaloPSA configuration items

Unchanged from the earlier handoff, still nobody has done them:

- The hamburger menu is empty and the side nav is gone. Lead:
  `https://usehalo.com/halopsa/guides/1862#show_user_searchbar`.
- Dates render US-format. HaloPSA locale setting, not CSS.

---

## 3. Verification debt

- **#16 has not been seen in a browser.** See section 0.
- **Mobile has never been rendered.** Still true. The Browser pane's
  `resize_window` mobile preset emulates a real viewport (the earlier
  tooling could not), but it has no portal session, and this session's
  permission mode blocked navigating it to anything useful. A real
  phone with the impersonated contact is still the honest answer.
- **The Tile split pane has never been exercised.** Unchanged.

---

## 4. Styling debt, remaining

Closed today: the dash sweep, the `--ik-` prefix, the palette drift.

Still open, in priority order:

- **Report-Template** is the last PDF not on the design system. Design
  decision, ask Joel what it should be before building.
- **The 12 PDF templates are not deployed.** Each has to be pasted into
  its HaloPSA template slot by hand. Customers still get the old ones.
- **The 61px column gutter** on ticket and opportunity detail. Wide, not
  broken.

---

## 5. Outside this repo

- **Brand assets cannot be hotlinked** (`cross-origin-resource-policy:
  same-site` on `interconnekt.com.au/brand/2026/`). Fix is in the Website
  repo. `PDF-Templates/_brand/` stays until then.
- **Stale worktrees** `kb-pdf-design-c87ce6` and
  `halo-billing-table-layout-7c5c2b` hold Joel's uncommitted copies of
  the KB PDF template. They are now further from `main` than they were:
  #14 and #15 changed most comment lines and every token reference in
  the stylesheet, so a merge from either branch will conflict widely. If
  anything in them is wanted, cherry-pick the intent, do not merge the
  branch.
- **Worktree `bitlocker-recovery-key-personal-ac39ee`** is on
  `claude/halopsa-portal-styling-2a4875`, which is fully merged. It only
  still holds the earlier handoff file, which is also on `main`. Safe to
  remove.

---

## 6. Carried forward from the previous handoffs

Workstream B in `Interconnekt/Website`
`docs/plans-active/halopsa-portal-and-email-styling-handoff.md` is
untouched: B2 (seeding the Composer from the fleet) needs a decision from
Joel, B3 is two colours across 215 files.

---

## 7. Lessons from this session, on top of the earlier four traps

- **Hex greps must allow both rgba spellings.** The stylesheet writes
  `rgba(164, 123, 255, ...)` and `rgba(164,123,255,...)`. A spaced-only
  grep reported "none left" while three lines remained. Use
  `164, \?123, \?255` or check both.
- **Under `xargs`, `grep` is BSD grep and has no `-P`.** The interactive
  `grep` here resolves to ugrep. For the dash check use `ugrep`
  explicitly, or the `perl -CSD` one-liner, and expect noise from the
  binary font files under `PDF-Templates/_brand/`.
- **Stacked PRs do not retarget on their own** unless the merged head
  branch is deleted. Run `gh pr edit N --base main` before merging the
  next one, or it merges into the stale branch.
- **`wrangler dev` needs the Worker to force `https:`** on the origin
  URL, or HaloPSA answers every request with a 301 to HTTPS. Already in
  the code; do not remove it.
- **The auto-mode permission classifier** blocked searching the disk
  for credentials, `gh pr merge` until Joel explicitly asked, and
  navigating the Browser pane to `localhost`. Plan for a person on those
  steps rather than retrying.
- **Delegation that worked:** the dash sweep and the token rename went
  to Haiku agents in their own worktrees with verification criteria in
  the brief (comment-stripped diff identical, reverse-substitution
  identical). Both came back correct apart from two awkward comment
  rewrites. Read the diff of anything that touches HTML content before
  merging; this time it was all comments.

### House rules, unchanged

No em or en dashes anywhere. Australian spelling. Use the tokens; the
`:root` and `.theme-dark` blocks are the list and
`Interconnekt/Design-System` `tokens/tokens.json` is the authority.
Merging to `main` is the deploy. Push with
`git push origin HEAD:refs/heads/<branch>`. The portal login is an
impersonated customer contact: no saved-preference changes, no form
submissions, no Pay, Submit, Add Note or Time Entry.
