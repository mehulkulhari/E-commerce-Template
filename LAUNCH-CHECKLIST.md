# DM to Store — Pre-Launch Checklist

Use this for every website before it goes live. No exceptions.

---

## 1. Content & Placeholders
- [ ] No placeholder text anywhere (`[PLACEHOLDER]`, "Lorem ipsum", "your name here")
- [ ] Phone number is real and clickable (`tel:+91XXXXXXXXXX`)
- [ ] Email is real and clickable (`mailto:`)
- [ ] Instagram / social links are real URLs, not `#`
- [ ] Copyright year is dynamic (auto-updates)
- [ ] Logo links to home page
- [ ] All CTA buttons describe what they actually do ("Order on WhatsApp", not "Click here")
- [ ] No "Made with AI", "Built with Vibe Code", or similar tags visible to users
- [ ] No unused nav items or dead links
- [ ] Demo banner removed (if any — e.g. "Demo template" notice)

## 2. Design anti-patterns — NEVER ship with these
- [ ] No purple gradients
- [ ] No fake reviews or fabricated testimonials
- [ ] No fake metrics ("10,000+ customers!" with no basis)
- [ ] No fake countdown timers or fake "X people are viewing this"
- [ ] No AI-generated filler images (use real product photos or leave a placeholder div)
- [ ] No AI slop copy ("Unleash the power of...", "Transform your journey...")
- [ ] No cursor animations or custom cursor effects
- [ ] No over-the-top scroll animations (subtle fade-in = fine; parallax explosions = no)
- [ ] No emoji used as feature/section icons in professional contexts
- [ ] No em dashes used casually in copy (use hyphens or restructure the sentence)

## 3. Mobile & Layout
- [ ] No horizontal scroll on any screen width (test at 375px)
- [ ] No mobile overflow (check `overflow-x` on body)
- [ ] Mobile menu works (hamburger or dock navigation)
- [ ] All buttons are tappable (min 44×44px touch target)
- [ ] Text is readable at mobile sizes (min 16px body)
- [ ] Cards stack to 1 column below 640px
- [ ] Images don't overflow their containers

## 4. Technical
- [ ] Page title is set (not "Vite App", "React App", "Next.js")
- [ ] Meta description is set (150–160 chars)
- [ ] Canonical URL is set
- [ ] Open Graph title + description + image set (1200×630px image)
- [ ] Twitter card meta set
- [ ] Favicon is custom (not the default Next.js / browser icon)
- [ ] `sitemap.xml` generated and accessible at `/sitemap.xml`
- [ ] `robots.txt` present at `/robots.txt`
- [ ] `llms.txt` present at `/llms.txt`
- [ ] Custom 404 page exists (not the framework default)
- [ ] Source maps disabled in production (`productionBrowserSourceMaps: false`)
- [ ] No console errors in browser dev tools
- [ ] Browser tab title does not say "Vite", "React", or "Next.js"

## 5. SEO
- [ ] Each page has a unique `<title>` (use `template: "%s — Brand"`)
- [ ] Each page has a unique meta description
- [ ] One clear `<h1>` per page
- [ ] Images have descriptive `alt` text (or `alt=""` if purely decorative)
- [ ] Internal links present (nav, footer, CTAs)
- [ ] LocalBusiness JSON-LD structured data on homepage
- [ ] `lang` attribute on `<html>` matches the page language (`lang="en-IN"` for India)

## 6. Performance
- [ ] Images compressed (use WebP, max 200KB for hero images)
- [ ] Fonts self-hosted via `next/font` (not `@import url()` from Google CDN)
- [ ] No unused CSS or JavaScript shipped
- [ ] Core Web Vitals: LCP < 2.5s, CLS < 0.1, FID/INP < 200ms

## 7. Security
- [ ] No API keys, secrets, or passwords in the codebase or git history
- [ ] No secrets in `.env` files committed to git (add to `.gitignore`)
- [ ] Security headers set (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS)
- [ ] HTTPS enabled on the live domain
- [ ] No admin routes exposed without authentication
- [ ] Forms validate input (type attributes, `required`, `maxLength`)
- [ ] No `dangerouslySetInnerHTML` on user-supplied content
- [ ] Debug mode is off in production
- [ ] Dependencies up to date (run `npm audit` before launch)
- [ ] No exposed file paths, directory listings, or `.env` files accessible via URL

## 8. Accessibility (WCAG 2.1 AA basics)
- [ ] All images have `alt` text
- [ ] Form inputs have associated `<label>` or `aria-label`
- [ ] Colour contrast ratio ≥ 4.5:1 for body text, ≥ 3:1 for large text
- [ ] Interactive elements (buttons, links) are keyboard accessible
- [ ] Focus styles are visible (not removed with `outline: none` without replacement)
- [ ] Semantic HTML used (`<header>`, `<main>`, `<footer>`, `<nav>`, `<article>`)
- [ ] No `role="tablist"` without `role="tab"` children (use `role="group"` for filter buttons)
- [ ] `aria-label` on icon-only buttons
- [ ] `prefers-reduced-motion` respected in animations
- [ ] `<html lang="">` correctly set

## 9. Forms (if any)
- [ ] Success state shown after submission
- [ ] Error state shown if submission fails
- [ ] Form is NOT fake (actually submits to a real service)
- [ ] Email inputs have `autocomplete="email"`
- [ ] No pre-ticked consent boxes
- [ ] Privacy notice present near any data-collection form

## 10. Legal
- [ ] Privacy Policy page live at `/legal/privacy-policy`
- [ ] Terms of Service page live at `/legal/terms`
- [ ] Refund / Cancellation Policy live at `/legal/refund` (if selling anything)
- [ ] Legal links present in footer
- [ ] All `[PLACEHOLDER]` values in legal pages filled in
- [ ] GST status clarified
- [ ] No fabricated reviews (Consumer Protection Act 2019 + ASCI guidelines)
- [ ] Business contact info (city, email or WhatsApp) present on site
- [ ] Cookie banner only needed if tracking cookies are added (not needed for current setup)

## 11. Pre-launch final check
- [ ] Custom domain connected and DNS propagated
- [ ] HTTPS certificate valid (green padlock)
- [ ] Test all WhatsApp links — correct number, correct message pre-fill
- [ ] Test on a real phone (not just browser DevTools)
- [ ] Test on both light mode and dark mode
- [ ] Test keyboard-only navigation
- [ ] Run `npm run build` — zero errors, zero warnings
- [ ] Run `npm audit` — no critical vulnerabilities
- [ ] Share with one real person to click through before calling it live

---

*This checklist was set as the standard for all DM to Store client projects on 11 September 2026.*
