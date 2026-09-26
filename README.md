# amanadhav.com

Personal portfolio of Aman Adhav. A static site: one HTML file, one stylesheet, one script, no build step.

## Structure

- `index.html`: all content. Sections are About, Work, Experience, Recognition, Skills, Education and Contact.
- `styles.css`: design tokens (light and dark), layout and component styles. Colors live in `:root` and `[data-theme="dark"]`.
- `main.js`: motion and interactions. GSAP + ScrollTrigger for reveals and scroll effects, Lenis for smooth scrolling, canvas visuals for the TraderAI and ClassQ cards. Everything degrades to a static page when JavaScript or the CDN is unavailable, and `prefers-reduced-motion` turns the motion off.
- `assets/`: optimized headshot (WebP + JPEG) and the three resume PDFs linked from the contact section.

## Updating content

Edit the text in `index.html` directly. Projects are `<article class="case">` (featured) or `<article class="mini">` (grid). Experience entries are `.xp-item` blocks. Stats that count up use `data-count`.

## Local preview

```bash
python -m http.server 8765
```

Then open http://127.0.0.1:8765/.
