# GROWV — Luxury Real Estate Landing Page

A static, hospitality-grade landing page for **Jonathan Perez / GROWV LLC**. Built to feel like the website of a five-star hotel, not a traditional real-estate site. Pure HTML + CSS + a small JS file — no build step.

---

## Run it locally

```bash
cd growv-landing
python3 -m http.server 8000
# open http://localhost:8000
```

Any static file server works (`npx serve`, `caddy file-server`, etc.). There is **no build step**.

---

## File layout

```
growv-landing/
├── index.html              ← the whole page
├── assets/
│   ├── css/styles.css      ← all styles, design tokens, breakpoints
│   ├── js/app.js           ← agent data + interactions
│   └── images/
│       ├── growv-logo-gold.png       ← brand wordmark
│       ├── growv-mark.png            ← favicon mark
│       ├── jonathan-headshot.jpg     ← agent photo (1200×1600)
│       ├── jonathan-headshot-sm.jpg  ← smaller variant
│       ├── hero-{lg,sm}.jpg          ← luxury home hero
│       ├── about-{lg,sm}.jpg         ← about section photo
│       └── prop-*.jpg                ← four featured property photos
└── README.md
```

---

## How to add or swap an agent

All agent cards are rendered from a single array at the top of `assets/js/app.js`. Edit that array; the cards re-render automatically.

```js
const AGENTS = [
  {
    name: 'Jonathan Perez',
    role: 'Broker · Owner',
    bio:  'A decade across lending, property management, and negotiation…',
    photo: 'assets/images/jonathan-headshot.jpg',  // local path or external URL
    url:   'https://mygrowv.com/?fromCms=1'        // their personal site
  },
  // …add more here
];
```

- **`photo`** — drop a portrait into `assets/images/` and reference it (`assets/images/jane-doe.jpg`). Recommended size: ~900×1125 (4:5 portrait), JPG or WebP, under ~250 KB.
- **`url`** — the agent's external personal site. External URLs automatically open in a new tab with `rel="noopener noreferrer"`.
- Cards without a `photo` automatically render an elegant gold-on-ink monogram placeholder (set `placeholder: 'AB'` for the initials).

The card grid is responsive: 1 column on phones, 2 on tablets, 3 on laptops, 4 on large displays.

---

## How to swap property photos / copy

Property cards are markup in `index.html` (search for `<!-- ===================== FEATURED PROPERTIES =====================`). Each card has:

- A `<picture>` (responsive `srcset` for sm + lg sizes)
- Location, name, bed/bath/sqft, price
- An anchor link (currently to `#contact` — point it to a listing detail page or your MLS link when ready)

To swap the image, replace `prop-*.jpg` in `assets/images/` or update the path. Keep aspect ratio 4:3.

---

## How to update Jonathan's headshot

Drop a replacement photo at `assets/images/jonathan-headshot.jpg`. Recommended dimensions: at least 1200×1600, JPG. If the new file is large (>500 KB), optimize it — for example via squoosh.app, or:

```bash
# requires Pillow: pip3 install Pillow
python3 -c "
from PIL import Image, ImageOps
img = ImageOps.exif_transpose(Image.open('new-photo.jpg'))
img.thumbnail((1200, 1600))
img.save('assets/images/jonathan-headshot.jpg', quality=82, optimize=True, progressive=True)
"
```

---

## Brand tokens (where to change colors / fonts)

Top of `assets/css/styles.css`, inside `:root`:

```css
--ink:    #0E1A14;   /* deep forest, primary dark */
--gold:   #BFA164;   /* logo gold */
--gold-2: #D9C28C;   /* highlight */
--cream:  #F5F1EA;   /* warm off-white */
```

Fonts are loaded from Google Fonts:
- **Cormorant Garamond** — display / headings (luxury serif)
- **Inter** — body / UI (clean sans)

If you change colors, re-run the WCAG check (see *Accessibility* below).

---

## Responsive breakpoints

Mobile-first, with explicit tweaks at every realistic device size:

| Range            | Device                                |
| ---------------- | ------------------------------------- |
| ≤ 374 px         | Small phones (iPhone SE, Galaxy Fold) |
| 375 – 413 px     | Standard smartphones                  |
| 414 – 599 px     | Large phones (Pro Max, Ultra)         |
| 600 – 767 px     | Phone landscape / small tablets       |
| 768 – 1023 px    | iPad portrait                         |
| 1024 – 1279 px   | iPad landscape / small laptops        |
| 1280 – 1439 px   | Laptops with scaling                  |
| 1440 – 1679 px   | Standard desktops                     |
| 1680 – 1919 px   | Larger desktops / scaled HiDPI        |
| ≥ 1920 px        | Big monitors                          |
| ≥ 2400 px        | Ultra-wide / 4K                       |

Also handles short landscape phone viewports and print.

---

## Accessibility (WCAG 2.1 AA)

Verified with `axe-core` — **zero violations**, 39 passes. The page implements:

- Skip-to-content link as first focusable element
- Single `<h1>`, logical heading order
- All images have `alt` text (decorative ones use `alt=""`)
- Semantic landmarks: `<header>`, `<main>`, `<nav>`, `<footer>`
- Visible keyboard focus ring (`:focus-visible`) on every interactive element
- Mobile nav has ARIA `expanded`/`controls`, traps focus, closes on `Esc`
- Color contrast verified ≥ 4.5:1 for body text, ≥ 3:1 for large text
- Respects `prefers-reduced-motion` (disables scroll reveals + smooth scroll)
- Honors `forced-colors: active` (Windows High Contrast Mode)
- Phone/email/external links are real `tel:`/`mailto:`/`target="_blank"` with `rel="noopener noreferrer"`
- Print styles

If you change colors, paste both into a contrast checker (e.g. webaim.org/resources/contrastchecker) — body text needs 4.5:1, headings need 3:1.

---

## Deployment

Static hosting — drop the entire `growv-landing/` folder anywhere:

- **Netlify**: `netlify deploy --dir=growv-landing` (then `--prod`)
- **Vercel**: `vercel growv-landing`
- **Cloudflare Pages**: drag the folder into the dashboard
- **Replace existing Lofty site**: upload the files via Lofty's static file hosting, or point `mygrowv.com` at the new host and update DNS

No environment variables, no API keys, no server-side code required.

---

## Performance notes

- Total page weight (HTML + CSS + JS + all images): **~4 MB**
- Hero image is `preload`ed with `fetchpriority="high"`; below-fold images use `loading="lazy"`
- Google Fonts are loaded via `<link>` with `display=swap` (no FOIT)
- Fully responsive `srcset` so phones download phone-sized images
- All animations are GPU-accelerated transforms

For further optimization, convert the JPGs to AVIF/WebP (saves ~40%) — the markup is `<picture>`-ready.

---

## What was used to source the existing brand

- **Logo, mark, headshot**: pulled from the existing live site at `mygrowv.com` (Lofty/Chime CDN). The brand was also visible on the business card and standalone logo file provided.
- **Brand palette**: deep forest green + gold + cream — sampled from the GROWV business card and confirmed against the Lofty `styleAndTheme.css`.
- **Copy**: "Discover a place you'll love to live", "Why work with me?" paragraph, and the mission statement were all carried over from the existing live site, then expanded into the hospitality voice. Edit `index.html` to tune.

---

## License & rights

- **GROWV brand assets** (logo, headshot): © GROWV LLC.
- **Stock photography** (hero + properties + about): pulled from Unsplash under the [Unsplash License](https://unsplash.com/license) (free to use commercially, no attribution required). If GROWV captures original photography of represented homes, swap them in by replacing `prop-*.jpg`.

---

Built with care. — *To be replaced by real listings, real photography, and the real bench of GROWV brokers.*
# grovw
