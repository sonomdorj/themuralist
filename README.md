# The Muralist — themuralist.art

Static site. No build step. Deploy the folder to Vercel as is ("Other" framework preset, no build command, output directory = root).

## Files
- `index.html` — all content
- `css/site.css`, `css/fonts.css` — layout and self-hosted fonts (Bitter, Sofia Sans Extra Condensed, SIL OFL)
- `js/site.js` — scroll motion, loops, index. Vanilla JS, no dependencies
- `assets/` — stills, loops, laurels, portraits, novella cover, title lettering, fonts

## Motion
- Hero still grows to full screen and starts playing on scroll.
- Loops autoplay muted and pause when out of view.
- `prefers-reduced-motion`: no video, no pinning, no builds. Poster stills and final text state are shown.
