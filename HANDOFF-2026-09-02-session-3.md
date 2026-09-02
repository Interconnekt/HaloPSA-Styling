# Handoff: Worker deployed, portal proxied, stylesheet on the Worker path

Written 2026-09-02 at the end of the third session of the day. It
supersedes `HANDOFF-2026-09-02-session-2.md` for status. Section 7 of
`HANDOFF-2026-09-02.md` (the four traps) is still required reading.

Read `AGENTS.md` first, then section 7 of the earliest handoff, then this.

---

## 0. What changed today, outside the repo

The whole of section 1 of the session-2 handoff is done.

| Step | Done by | When (UTC) |
|---|---|---|
| `npx wrangler login` (OAuth, on Joel's Mac) | Joel, listener started by the agent | about 11:55 |
| `npx wrangler deploy` of `halopsa-portal-edge`, version `8d5e446d` | Joel, from his terminal | about 12:00 |
| Zone checks: Rocket Loader off, Email Address Obfuscation off, Workers Paid plan | Joel, in the dashboard | about 12:05 |
| `portal` CNAME set to Proxied | Joel | 12:10 |
| HaloPSA Custom CSS `@import` moved to `https://portal.interconnekt.com.au/__interconnekt/self-service-portal-design.css` | Joel | about 12:40 |

Verified after the cutover, from the server and from a logged-in session
as the impersonated contact in Joel's Chrome:

- `npm run smoke:prod`: all 26 checks pass. `GET /portal/home` and a
  ticket deep link both carry `x-interconnekt-worker: html-injected` and
  exactly one shim tag. (`curl -I` shows `passthrough` because HaloPSA
  answers HEAD with a 404; use GET.)
- `/portal/tickets`: `Age` shows one decimal.
- Ticket 358840: all five email iframes render in Figtree with blue links
  and no horizontal overflow.
- Ticket 358431: the red On-Hold pill with the pause glyph is in the
  sidebar under the SLA. Status pills are class-stamped on home, the
  list and both tickets.
- KB Test Article (id 16): `--portal-accent-2` is `#A343BE`,
  `--portal-violet` `#7B47DE`, `--portal-tint-warm` `#F4E8F7`; the Note
  panel renders violet. That is the first time PR #16 was seen in a
  browser.
- An anonymous visit redirects to the Entra sign-in through the proxy.
- After the `@import` change, the portal's inline Custom CSS block
  imports the Worker path and the asset answers with
  `cache-control: public, max-age=60, stale-while-revalidate=540`.

Two facts learned on the day:

- **HaloPSA's API calls bypass the proxy.** The portal calls
  `connekt.halopsa.com/api/...` directly, so only page shells, static
  chunks and the two `/__interconnekt/` assets count as Worker requests.
- **The Worker is not why pages spin.** The document arrives in about
  200 ms; the spinner waits on the API calls above, which the Worker
  never sees.

Docs updated in this PR: `AGENTS.md`, `README.md` and
`Portal/worker/README.md` now describe the Worker path as the live
import and the GitHub Pages URL as the fallback.

---

## 1. Verification not done, in priority order

- **Log out and back in as the impersonated contact.** The redirect to
  Entra is proven; the return leg is not. Joel does this one; it changes
  session state.
- **One-hour token refresh.** Leave a portal tab open for an hour and
  confirm it stays signed in.
- **Scheduled and Quote Raised pills** (PR #16). No ticket in the list
  had either status, so those two colours are still unseen.
- **The get-in-touch CTA** (PR #16). Not on the KB article page; find
  the page that has it.
- **Mobile has never been rendered.** Unchanged. A real phone with the
  impersonated contact is the honest answer.
- **The Tile split pane has never been exercised.** Unchanged.

---

## 2. Operating the Worker from now on

- Wrangler is logged in on Joel's Mac (`npx wrangler whoami` in
  `Portal/worker`). That login has no DNS or zone-settings permission;
  those stay in the dashboard.
- The auto-mode permission classifier blocked `npm run deploy` for the
  agent. Joel runs deploys from his own terminal:
  `cd Portal/worker && npx wrangler deploy`.
- Stylesheet and shim changes need no deploy: merge to `main`, live in
  about a minute. Check the server before believing the browser:
  `curl -sI https://portal.interconnekt.com.au/__interconnekt/self-service-portal-design.css`
  shows the ETag.
- Kill switch, fastest first: delete the Worker route; set the record
  back to DNS only. Either one also removes the stylesheet path, so put
  the GitHub Pages URL back in the Custom CSS field at the same time.
  Runbook: `Portal/worker/README.md`.

---

## 3. Not code: two HaloPSA configuration items

Unchanged, still nobody has done them:

- The hamburger menu is empty and the side nav is gone. Lead:
  `https://usehalo.com/halopsa/guides/1862#show_user_searchbar`.
- Dates render US-format. HaloPSA locale setting, not CSS.

---

## 4. Styling debt, remaining

New today:

- **Long status labels in the ticket sidebar.** On ticket 358840 the
  "Awaiting Change Review" pill renders at 6px text stretched to 323px
  wide, because HaloPSA adds `smallestest` to `.status-avatar` for long
  labels. "Awaiting User" on 358431 is fine. Pre-existing, not a cutover
  effect. Fix is a rule for `.status-avatar.smallestest` in the sidebar
  that restores a readable size and lets the pill shrink to content.

Carried forward:

- **Report-Template** is the last PDF not on the design system. Ask
  Joel what it should be before building.
- **The 12 PDF templates are not deployed.** Each has to be pasted into
  its HaloPSA template slot by hand.
- **The 61px column gutter** on ticket and opportunity detail.

---

## 5. Outside this repo

Unchanged from the session-2 handoff: brand assets cannot be hotlinked
(Website repo); stale worktrees `kb-pdf-design-c87ce6` and
`halo-billing-table-layout-7c5c2b` hold Joel's uncommitted KB PDF
template copies (cherry-pick the intent, do not merge);
`bitlocker-recovery-key-personal-ac39ee` is safe to remove. Workstream B
in `Interconnekt/Website` is untouched.

---

## 6. Lessons from this session

- **`wrangler login` needs a listener that outlives one tool call.**
  A backgrounded Bash call was killed at two minutes. `nohup ... &`
  with `--browser=false` survives, prints the URL, and Joel opens it in
  any browser on the same Mac.
- **The wrangler OAuth token cannot read zone settings or DNS**
  (`zone:read` is not enough for `/settings/*` or `/dns_records`). Do
  not plan to verify Rocket Loader or the proxy flag by API.
- **Claude in Chrome carries Joel's portal session.** Navigating a new
  tab in the MCP group to the portal landed logged in as the
  impersonated contact. That is how the post-cutover checks were done
  without a manual walkthrough. Read-only only: no theme toggles, no
  form submissions, no "switch back to your account".
- **Wait for the spinner.** Home and ticket pages take 10 to 20 seconds
  to fill in; a check at 5 seconds reports zero of everything.
- **`echo ====` breaks in zsh** (equals expansion). Quote it.

### House rules, unchanged

No em or en dashes anywhere. Australian spelling. Use the tokens.
Merging to `main` is the deploy, now within about a minute. Push with
`git push origin HEAD:refs/heads/<branch>`. The portal login is an
impersonated customer contact: no saved-preference changes, no form
submissions, no Pay, Submit, Add Note or Time Entry.
