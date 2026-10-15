# Portfolio social metadata

The homepage title is **Sadeq Rezai — Software, Automation & AI Integration**.
The HTML description, Open Graph description, Twitter/X description and profile
structured-data description use the same factual summary. The Person record
retains the actual Configuration Consultant title; the portfolio title describes
the work, not a new employment claim. No keyword meta tag or unsupported ratings
were added. The existing canonical URL and PNG brand-mark favicon are retained.

`assets/social-preview-20261015.png` is the share image: 1200 × 630 pixels,
about 56 KB, cream / forest green / copper. It is deliberately fixed-palette,
not visitor-theme-dependent. The source SVG is alongside it. Artwork uses the
existing logo, legible type and a small abstract workflow motif, not fabricated
screenshots or live-status indicators.

Regenerate locally with `node tools/build-social-preview.mjs` in an environment
where the `sharp` package is available. It uses no network or paid image service.
The publishing package includes both PNG and SVG; the social tags reference the
PNG through an absolute HTTPS URL. A dated filename avoids reusing the old image
URL. Existing shared posts may retain a platform-cached preview after deployment;
this local check does not verify LinkedIn, Facebook or X crawler caches.

Validation includes PNG signature/size/dimensions, favicon existence, metadata
alignment, canonical identity, structured JSON parsing and a visual image review.
Run `node tools/check-portfolio.mjs` with the other retained source checks.
