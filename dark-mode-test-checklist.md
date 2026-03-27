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
- [ ] Body text at line-height 1.8 (not 2.5)
- [ ] Links are #4088D4 with underline offset

### Tables
- [ ] Rounded corners (12px border-radius)
- [ ] Header row: light blue bg (#e9f2fe), black text
- [ ] confluenceTh cells: light grey bg (#f0f1f2), black text
- [ ] Zebra stripes on even rows (#f9fafb)
- [ ] Cell padding comfortable (12px 16px)

### Panels (check all 6 types)
- [ ] Info Panel: blue bg (#deebff), blue left border, black text
- [ ] Note Panel: keeps original purple bg, rounded
- [ ] Error Panel: pink bg (#ffebe6), red left border, black text
- [ ] Custom Panel: keeps original cyan bg, rounded
- [ ] Success Panel: green bg (#e3fcef), green left border, black text
- [ ] Warning Panel: yellow bg (#fffae6), yellow left border, black text

### Status Macros (check all 5 colours)
- [ ] TAG BLUE: blue pill bg (#deebff), dark blue text
- [ ] TAG GREEN: green pill bg (#e3fcef), dark green text
- [ ] TAG ORANGE: yellow pill bg (#fff0b3), dark orange text
- [ ] TAG RED: pink pill bg (#ffebe6), dark red text
- [ ] TAG PURPLE: purple pill bg (#eae6ff), dark purple text

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
- [ ] Header row: light blue bg PERSISTS, text stays BLACK (readable)
- [ ] confluenceTh: light grey bg persists, text stays BLACK
- [ ] Zebra stripes darken (#3a3a3a)

### Panels (dark variants)
- [ ] Info Panel: dark blue bg (#1a2744), light text, blue border
- [ ] Note Panel: dark surface bg, light text
- [ ] Error Panel: dark red bg (#3d2020), light text, red border
- [ ] Custom Panel: dark surface bg, light text
- [ ] Success Panel: dark green bg (#1a3d2a), light text, green border
- [ ] Warning Panel: dark yellow bg (#3d3820), light text, yellow border

### Status Macros (dark variants)
- [ ] TAG BLUE: dark blue bg (#1a3366), light blue text
- [ ] TAG GREEN: dark green bg (#1a3d2a), light green text
- [ ] TAG ORANGE: dark yellow bg (#3d3820), gold text
- [ ] TAG RED: dark red bg (#3d2020), salmon text
- [ ] TAG PURPLE: dark purple bg (#2a2544), light purple text

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
- [ ] Tables: rounded, proper headers, zebra stripes
- [ ] Panels: correct per-type colours
- [ ] Status macros: coloured pills
- [ ] Images: fluid responsive, rounded

---

## Agent Portal — Dark Mode

### Articles
- [ ] Headings: readable (HaloPSA built-in #ddd)
- [ ] Table headers: BLACK text on light bg (still readable)
- [ ] Body text: inherited dark theme colour
- [ ] Panels/macros: rely on HaloPSA built-in dark rules (basic)
- [ ] Images: border may not adapt (Style Profile limitation)

---

## Responsive — Mobile (480px)

- [ ] Images scale to fit viewport, no horizontal overflow
- [ ] Tables scroll horizontally (not squished)
- [ ] Panels don't break layout
- [ ] No content overflows the viewport
- [ ] Font sizes reduce appropriately
- [ ] kbdetails has no negative margin

## Responsive — Tablet (768px)

- [ ] Images at ~90% width
- [ ] Tables readable, may scroll on narrow content
- [ ] Panels comfortable padding
- [ ] Font sizes slightly reduced

## Responsive + Dark Mode

- [ ] All above responsive checks pass in dark mode too
- [ ] Image borders adapt
- [ ] Panel backgrounds adapt
- [ ] No colour contrast issues on small screens
