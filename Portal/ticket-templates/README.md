# Ticket View Templates

Tile and Kanban card HTML templates for the HaloPSA ticket list views.
The "original" files capture what HaloPSA ships (or what was in the editor
before we touched it); the "new" files are our restructured, semantic-
HTML replacements that the `self-service-portal-design.css` rules target.

## Variable dialect gotcha

HaloPSA has **three** placeholder dialects that look similar but aren't
interchangeable:

| Where | Syntax | Example |
|-------|--------|---------|
| Email templates | `$ALLCAPS` | `$FAULTID`, `$SYMPTOM` |
| Tile / Kanban HTML templates | lowercase `$field_name` | `$id`, `$summary`, `$priority_name` |
| Button URLs | `{$FIELD}` braced | `{$PORTALURL}` |

These files use the **tile/kanban lowercase dialect** — they're pasted
into *Configuration → Tickets → Field Lists → Tile Template / Kanban
Template* in HaloPSA, not into an email template.

The authoritative variable list for this dialect is HaloPSA guide
[#2059 "Tile and Kanban HTML $ Variables"](https://usehalo.com/halopsa/guides/2059/).
If a placeholder renders as literal `$name` text instead of the value
after you paste a template, that name isn't in the dialect — check the
"Insert Variable" dropdown in the editor for the canonical list.

## File variants

Each view has up to three files:

- `original.html` — what HaloPSA had before we touched it. Table-based
  legacy WYSIWYG output, kept for diff/rollback.
- `new.html` — semantic `<div>` + BEM restructure. Prefer this one; it's
  easier to restyle with flex/grid.
- `new-table-fallback.html` — same BEM hooks + data-attrs on a `<table>`
  skeleton. Only paste this if the editor strips `class` attributes off
  divs when saving. CSS targets work identically either way.

## Verification after pasting

1. Save template in HaloPSA.
2. **Round-trip check**: re-open the template editor and look at the
   saved markup. If `class="ticket-tile__…"` attributes are gone, the
   editor sanitised them → switch to `new-table-fallback.html`.
3. Reload `/portal/tickets?btn=45&viewid=1` and switch to the view
   whose template you edited (Tile or Kanban via the 3-dot menu).
4. Scan for literal `$name` renders → those placeholders don't exist
   in this dialect; check the editor's "Insert Variable" dropdown for
   the canonical name.
5. Hard-refresh (Cmd+Shift+R) to bust the portal CSS cache so the
   matching styles in `self-service-portal-design.css` apply.
