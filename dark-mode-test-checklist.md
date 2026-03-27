# Dark Mode & Modernisation Test Checklist

## Setup
1. Paste Style Profile rules into HaloPSA (Configuration > Knowledge Base > Style Profiles)
2. Paste Custom CSS into HaloPSA (Configuration > Self Service Portal > Custom CSS)
3. Use Test Article (id=16) which has all panel types, status macros, and various elements

---

## Self-Service Portal — Light Mode

### Typography
- [ ] Headings (h1/h2/h3) use Montserrat, correct weights
- [ ] h1 has subtle bottom border (#e2e5ea)
- [ ] Body text at line-height 1.8
- [ ] Links are #4088D4 with underline offset

### Tables
- [ ] No border-radius (square corners, clean modern look)
- [ ] No zebra striping (all rows transparent)
- [ ] Thin 1px borders (#e2e5ea) on all cells
- [ ] Header row: very light grey bg (#f5f6f8), dark text
- [ ] confluenceTh cells: same light grey bg (#f5f6f8), dark text
- [ ] Cell padding comfortable (12px 16px)
- [ ] border-collapse: collapse (no double borders)

### Panels (check all types)
- [ ] Info Panel: blue bg (#deebff), blue left border only (#2684ff), dark text, no other borders
- [ ] Note Panel: yellow bg (#fffae6), amber left border only (#ffab00), dark text, no other borders
- [ ] Warning/Error Panel: pink bg (#ffebe6), red left border only (#de350b), dark text, no other borders
- [ ] Tip/Success Panel: green bg (#e3fcef), green left border only (#00875a), dark text, no other borders
- [ ] Generic Panel (.panel): keeps Confluence bg, rounded 12px, no borders
- [ ] All panels: consistent padding (15px 25px), no stray Confluence borders

### Status Macros (check all 5 colours)
- [ ] TAG BLUE: blue pill bg (#deebff), dark blue text
- [ ] TAG GREEN: green pill bg (#e3fcef), dark green text
- [ ] TAG ORANGE: yellow pill bg (#fff0b3), dark orange text
- [ ] TAG RED: pink pill bg (#ffebe6), dark red text
- [ ] TAG PURPLE: purple pill bg (#eae6ff), dark purple text

### Code & Preformatted Text
- [ ] Inline `code`: light grey bg (#f1f3f5), pink text (#d6336c), rounded 4px pill
- [ ] `pre` blocks: dark bg (#1e1e2e), light text (#cdd6f4), 8px rounded, horizontal scroll
- [ ] `code` inside `pre`: inherits pre styling (no double background)
- [ ] Long lines in pre: horizontal scroll, no wrapping

### Blockquotes
- [ ] Blue left border (4px solid #4088D4)
- [ ] Light background (#f8f9fc)
- [ ] Italic text, secondary colour
- [ ] Rounded right corners (0 8px 8px 0)

### Horizontal Rules
- [ ] Thin 1px line (#e2e5ea)
- [ ] Generous margin (32px top/bottom)
- [ ] No visible border styles besides top

### Lists
- [ ] Consistent left padding (24px)
- [ ] Montserrat font, line-height 1.8
- [ ] UL markers coloured (#4088D4)
- [ ] OL markers secondary text colour, bold weight
- [ ] 6px spacing between items

### Images
- [ ] Fluid width, rounded corners, light border
- [ ] Desktop: max 1180px
- [ ] Centre aligned with margin

### Portal Chrome
- [ ] Search box: rounded, proper focus glow
- [ ] Cards: rounded corners, subtle shadow
- [ ] Back button: circular, blue, hover effect
- [ ] Tags: rounded pills

---

## Self-Service Portal — Dark Mode

### Typography
- [ ] Headings readable (inherit theme #ddd colour)
- [ ] h1 border adapts to dark (#555)
- [ ] Links lighten to #6ba3e0

### Tables
- [ ] Borders adapt to #555
- [ ] Header row: dark bg (#3a3a3a), light text (#ddd)
- [ ] confluenceTh: dark bg (#3a3a3a), light text (#ddd)
- [ ] No zebra stripes (transparent rows)
- [ ] Clean thin borders throughout

### Panels (dark variants)
- [ ] Info Panel: dark blue bg (#1a2744), light text, blue left border (#4c9aff)
- [ ] Note Panel: dark amber bg (#3d3820), light text, amber left border (#ffab00)
- [ ] Warning/Error Panel: dark red bg (#3d2020), light text, red left border (#ff5630)
- [ ] Tip/Success Panel: dark green bg (#1a3d2a), light text, green left border (#36b37e)
- [ ] Generic Panel: dark overlay preserves hue, light text

### Status Macros (dark variants)
- [ ] TAG BLUE: dark blue bg (#1a3366), light blue text
- [ ] TAG GREEN: dark green bg (#1a3d2a), light green text
- [ ] TAG ORANGE: dark yellow bg (#3d3820), gold text
- [ ] TAG RED: dark red bg (#3d2020), salmon text
- [ ] TAG PURPLE: dark purple bg (#2a2544), light purple text

### Code & Preformatted Text
- [ ] Inline `code`: dark bg (#2a2a3a), pink text (#f08ca1)
- [ ] `pre` blocks: dark bg (#1e1e2e), light text (#cdd6f4), darker border (#45475a)
- [ ] Readable contrast in both inline and block code

### Blockquotes
- [ ] Dark background (#3a3a4a)
- [ ] Blue left border persists (#6ba3e0)
- [ ] Readable secondary text colour

### Horizontal Rules
- [ ] Adapts to dark border (#555)

### Lists
- [ ] UL markers coloured (#6ba3e0)
- [ ] OL markers secondary text colour (#aaa)

### Images
- [ ] Border adapts to dark (#555)

### Portal Chrome
- [ ] Header bar: stays navy
- [ ] Search box: dark surface bg, light text, blue focus ring
- [ ] Cards: dark surface, dark shadow
- [ ] Announcements: dark gold bg, dark orange icon area
- [ ] Footer: adapts to surface colour

---

## Agent Portal — Light Mode

### Articles
- [ ] Headings: Montserrat, correct weights, theme colour
- [ ] Tables: clean modern style, no border-radius, no zebra stripes, thin borders
- [ ] Table headers: light grey bg (#f5f6f8)
- [ ] Panels: correct per-type colours with left border accents
- [ ] Status macros: coloured pills
- [ ] Inline code: grey bg, pink text, rounded pill
- [ ] Pre blocks: dark bg, light text, rounded
- [ ] Blockquotes: blue left border, light bg
- [ ] Horizontal rules: thin, muted
- [ ] Lists: consistent spacing, Montserrat font
- [ ] Images: fluid responsive, rounded

---

## Agent Portal — Dark Mode

### Articles
- [ ] Headings: readable (HaloPSA built-in #ddd)
- [ ] Table headers: light grey bg persists from Style Profile — BLACK text (#1a1d23) readable on light bg
- [ ] Body text: inherited dark theme colour
- [ ] Panel text: dark (#1a1d23) on light-coloured panel backgrounds — readable in both modes
- [ ] Panel left border accents: visible (Style Profile sets border-left on outer wrapper)
- [ ] Panel backgrounds: light colours persist (Style Profile can't set dark mode bg)
- [ ] Code blocks: dark bg persists (good contrast in both modes)
- [ ] Blockquotes: left border visible, bg may not adapt (Style Profile limitation)
- [ ] Images: border may not adapt (Style Profile limitation)

---

## Responsive — Mobile (480px)

- [ ] Images scale to fit viewport, no horizontal overflow
- [ ] Tables scroll horizontally (not squished)
- [ ] Panels don't break layout
- [ ] No content overflows the viewport
- [ ] Font sizes reduce to 14px minimum (not below)
- [ ] kbdetails has no negative margin
- [ ] Code blocks reduce padding, font slightly smaller
- [ ] Pre blocks scroll horizontally

## Responsive — Tablet (768px)

- [ ] Images at ~90% width
- [ ] Tables readable, may scroll on narrow content
- [ ] Panels comfortable padding
- [ ] Font sizes slightly reduced (15px body)

## Responsive + Dark Mode

- [ ] All above responsive checks pass in dark mode too
- [ ] Image borders adapt
- [ ] Panel backgrounds adapt
- [ ] No colour contrast issues on small screens
- [ ] Code block contrast maintained on small screens

---

## Print

- [ ] Portal chrome hidden (header, footer, search, buttons, tags)
- [ ] Article content prints cleanly on white background
- [ ] Tables have light grey headers, thin borders
- [ ] Panels keep coloured left border, white background
- [ ] Code blocks: light bg, dark text (readable on paper)
- [ ] Images: no decorative border, no page-break inside
- [ ] Links show URL in parentheses after text
- [ ] No page breaks inside panels or tables
