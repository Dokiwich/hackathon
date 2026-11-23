---
applyTo: "**/*.{js,jsx,ts,tsx,css,html}"
---
# UX/UI, Anti-AI-Slop & WCAG 2.2 AA Instructions

1. **Anti-AI-Slop Discipline:**
   - Avoid purple/pink/indigo gradients, colored glow shadows, decorative emojis in headings/buttons, gratuitous `backdrop-blur` glassmorphism, nested card-in-card clutter, and generic boilerplate marketing copy.
   - Follow `60% bg-canvas` / `30% bg-surface + border-line` / `10% bg-brand` using the track's semantic tokens in `<track>/tailwind.config.js`.
   - Limit each view to **one Primary CTA** (`bg-brand`); style secondary controls as subtle outlined or ghost buttons.

2. **Vietnamese Typography & Data Clarity:**
   - Use `Be Vietnam Pro` (`font-sans`) for natural Vietnamese diacritics and `JetBrains Mono` (`font-mono`) for IDs, QR tokens, and coordinates.
   - Always apply `tabular-nums` on numbers inside tables, prices, KPIs, and timers.

3. **Mobile-First & Touch Ergonomics:**
   - Primary users (citizens outdoors, farmers on OCOP, students on mobile) operate on 360px–430px screens.
   - Ensure interactive buttons, nav tabs, and map toggles have at least `44x44px` touch target (`min-h-[44px]`) and zero horizontal overflow.

4. **Color Contrast, Semantics & Resilient States:**
   - Maintain WCAG 2.2 AA contrast (`>= 4.5:1` body, `>= 3:1` large text/UI icons) and pair status colors with text labels.
   - Use `<button type="button">`, `<NavLink>`, explicit `<label htmlFor>`, `aria-hidden="true"` on decorative Lucide icons, and clear Vietnamese **Loading / Empty / Permission Denied / Error** states.
