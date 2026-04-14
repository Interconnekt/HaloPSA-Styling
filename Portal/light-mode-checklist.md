# Portal Chrome — Light Mode Checklist

Scope: the portal **chrome** in light mode (HaloPSA's `.theme-dark` class absent from `div.app-container`). For KB article content in light mode, see `dark-mode-test-checklist.md` (covers both modes).

Toggle via the theme switcher in the portal header, or simulate via DevTools: remove `.theme-dark` from `div.app-container`.

---

## Global

- [ ] Body font is Montserrat (not Poppins, not system fallback)
- [ ] Background is light (not dark surface leaking through)
- [ ] Primary action colour `#5084ee` used for links, H1, active nav
- [ ] No dark-mode text leaking onto light surface (white-on-white)

## Home page

### Hero / Search
- [ ] Search box: rounded pill, light surface, focus ring visible
- [ ] Hero heading Montserrat, correct weight

### Dashbtn cards (Submit / My Tickets / KB)
- [ ] Rounded 14px corners
- [ ] Light surface with hairline border
- [ ] Icon + label readable
- [ ] Hover lift works

### Ticket widget cards
- [ ] 6px coloured leading stripe — status colour visible
- [ ] Leading stripe has `14px 0 0 14px` radius
- [ ] Card body light surface, rounded
- [ ] Ticket title readable (not dark-mode white)
- [ ] SLA pill (`.sla-perc-bar`) rounded 999px, 18px tall
- [ ] SLA countdown text (`.bar-text`) legible on coloured fill
- [ ] SLA state colours: red retint `#d05a52`, amber `#e0a84a`, green `#4fa37a`
- [ ] Ticket status pill (right side) rounded 999px, correct colour
- [ ] "View All" button: `--portal-action` blue, 13px Montserrat, shadow

### List widgets
- [ ] Title Montserrat 20px/500
- [ ] No heavy left border
- [ ] Subtle hover lift

## Tickets list (`/tickets`)

- [ ] Form cards (if present) light surface
- [ ] Table headers: light grey bg, dark text
- [ ] Row text readable
- [ ] Status pills correct colours
- [ ] Asset pill (`.status-avatar.bitsmall`) rounded 999px
- [ ] "1-15 of 23" counter: 13px/500 muted
- [ ] Prev / Next / More pagination buttons: 32px circular, surface bg, hover lift
- [ ] Sort/filter dropdowns readable (Lato-family dropdowns will still be Lato — that's HaloPSA built-in)

## Ticket view (`/ticket?id=...`)

### Header
- [ ] Ticket number H1 is `#5084ee` blue
- [ ] Ticket number H1 Montserrat, correct weight
- [ ] Subtitle (`.profile-extra`, e.g. "Test ticket") 18px/500 Montserrat — NOT 14px Poppins
- [ ] Config intro area Montserrat
- [ ] Action buttons (`.nhd-button.curve`): 13px/500, tight padding, not oversized
- [ ] Solid buttons (`.solidbutton`) consistent with action buttons

### Body
- [ ] Details form readable
- [ ] Sidebar readable, not white-on-white
- [ ] Action history items readable

### Email iframe
- [ ] Email body font is Montserrat (not Segoe UI)
- [ ] Links are `#3598db` blue
- [ ] Links underline on hover only, not by default
- [ ] Body text colour is HaloPSA's default (dark) on white — NOT white-on-white (iframe-theme.js intentionally doesn't touch text colour)
- [ ] After switching ticket, new email body is themed (MutationObserver + load handler working)

## Kanban view

- [ ] Column titles Montserrat, readable
- [ ] Card body Montserrat
- [ ] Card summary / details Montserrat
- [ ] Card leading bar visible (status colour)
- [ ] Card hover state

## New Ticket page

- [ ] _Currently pending facelift — flag any issues found for the upcoming work_

## Known limitations

- **Lato-family dropdowns**: HaloPSA paints some dropdowns (react-select variants) with inline Lato. Not overridden.
- **Froala editor**: Inline-styled, not fully themed.
- **react-kanban / react-table**: Library-level inline fonts overridden on specific classes (`.board-card-*`, `.rt-td`, `.rt-th`).
- **Theme switch repaint**: HaloPSA may briefly flash Segoe UI in email iframes during theme transitions before the load event fires.

## Regression spot-check after any portal chrome CSS change

1. Home page — ticket card stripes still coloured, SLA pill still per-state tinted
2. Tickets list — pagination buttons round, counter muted
3. A ticket — H1 blue, subtitle large, action buttons small, email body Montserrat + blue links
4. Kanban — column titles + card text Montserrat
5. Light mode + dark mode both pass on the above
