# design.md — DM to Store Design Brief

> Drop this file in any project root so Claude stays consistent across pages and sessions.
> In every session: "Follow design.md for all styling decisions on this project."

## Aesthetic Direction
Warm, approachable, conversion-focused. Small-business energy — not corporate SaaS, not startup-dark.
Think: vibrant Indian boutique meets clean mobile-first product page.

## Brand: DM to Store (main site `/`)
- **Voice:** Direct, friendly, encouraging. Speak to the Jodhpur seller who's never had a website.
- **Accent:** `#DE2F6B` (hot pink-red) — bold, Instagram-native energy
- **WhatsApp green:** `#1FA855` — for all primary CTAs
- **Ink / bg:** `#0d0d0d` / `#faf9f7` (off-white ground, not pure white)
- **Fonts:** `Fraunces` (display headings) + `Plus Jakarta Sans` (body)
- **No:** purple gradients, Inter-everywhere, generic AI-SaaS look

## Brand: Rangat Boutique (demo `/sample`)
- **Voice:** Aspirational, textural, editorial. A premium ethnic-wear boutique.
- **Primary:** `#2E4478` (deep navy-indigo)
- **Accent:** `#D4A762` (warm gold)
- **Fonts:** `Fraunces` (serif headings) + `DM Sans` (body)
- **No:** e-commerce generic, too-corporate navy, cold tones

## Layout Rules
- Max content width: `1140px` (`var(--maxw)`)
- Body never scrolls horizontally — wide content uses `overflow-x: auto` containers
- Border radius: `14px` for cards (`var(--radius)`), `999px` for buttons/pills
- Spacing scale: 4px base, use `rem` multiples (`.5rem`, `1rem`, `1.2rem`, etc.)
- Mobile-first: test at 375px; cards stack to 1 column below 640px

## CSS Architecture
- CSS Variables defined in `src/app/globals.css` — always use tokens, never hardcode hex in components
- Per-page styles in `.module.css` files (CSS Modules), scoped
- Dark mode via `@media (prefers-color-scheme: dark)` + `:root[data-theme="dark"]`

## What NOT to Do
- No Tailwind (project uses CSS Modules)
- No hardcoded colors in component files — use `var(--token)`
- No `position: fixed` overlays in production code without a z-index strategy
- Don't break the existing design token system in `globals.css`

## Anti-Vibe-Code Rules (applies to ALL client websites)
These signals mark a site as AI-generated slop. Never ship with any of these:

**Visual:**
- No purple gradients
- No over-the-top scroll animations (subtle fade-in is fine; parallax explosions are not)
- No cursor animations or custom cursor effects
- No emoji used as feature icons in professional/client contexts
- No AI-generated filler images — use real product photos or CSS placeholder divs

**Copy:**
- No vague hero text ("Unleash the power of...", "Transform your journey...")
- No em dashes used casually in copy — restructure the sentence instead
- No AI slop copy — write for a real Indian small-business owner reading on a phone

**Trust & Honesty:**
- No fake reviews or fabricated testimonials (illegal under Consumer Protection Act 2019)
- No fake metrics ("10,000+ happy customers!" without proof)
- No fake countdown timers or fake "X people viewing this now"
- No fake custom counters
- No "Made with AI" tag visible to end users

**Pre-launch gates — do NOT go live without:**
- Custom domain connected (not `.vercel.app`, `.netlify.app`, etc.)
- Real favicon (not the framework default)
- Privacy Policy, Terms of Service, Refund Policy pages present
- All placeholder content replaced (phone, email, Instagram, WhatsApp number)
- LAUNCH-CHECKLIST.md completed in full

See `LAUNCH-CHECKLIST.md` for the complete 80-point pre-launch checklist.

## Reference
- Main page: `/` — DM to Store landing page
- Demo page: `/sample` — Rangat boutique template shown to clients
- Original HTML prototypes: `reference/dm-to-store.html`, `reference/boutique-template.html`
