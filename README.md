# Sadeq Rezai — The Working Studio

[Visit the portfolio](https://rammeshgar.github.io/)

An editorial, paper-cut portfolio presenting configuration, quality engineering, data products and practical AI work.

![Portfolio artwork](assets/social-preview-20260905.png)

## Experience

- Responsive ivory, forest-green and copper design with project case studies.
- Scroll-driven original hero film: 158 frames, responsive image sizes, buffered loading and single-frame rendering without crossfade ghosting.
- On-demand Three.js assistant with a paper-cut avatar, studio scene, blended gesture library, subtle torso and shoulder movement, and independent blinking.
- Text and voice interface, clear microphone invitation, speaker/mute controls and accessible focus states.
- Distinct email and copy-email actions; footer spacing accommodates the floating assistant.
- Project walkthroughs explain the purpose, contribution, design decisions and inspectable evidence for monitoring, Seneschal and Exchange Universe.
- Larger secondary text, consistent project framing and theme-aware keyboard focus; the expanded mobile assistant keeps focus inside its fullscreen view.

## Exchange Universe case study

The October 2026 update presents the rebuilt currency atlas with real desktop Explore, Convert and mobile screenshots. The walkthrough explains linked country/currency selection, R/Shiny implementation, quota-aware caching and focused regression checks. It distinguishes daily history from current indicative quotes and documents provider/hosting limits without claiming perfect performance or a complete security audit.

[Live dashboard](https://sadeq.shinyapps.io/exchange_universe/) · [Source and documentation](https://github.com/Rammeshgar/Exchange_Universe_shiny)

Screenshot examples were captured during the local review on 7 October 2026; their rates are not current quotes. Images are compressed WebP with dimensions, descriptive alternative text and lazy loading. No API keys, private configuration or personal correspondence are included.

## Running locally

Serve the repository with any static HTTP server. No frontend build is required.

The assistant uses the existing Netlify service. Its origin allowlist may reject localhost requests; live assistant testing must use the approved production origin. API secrets belong on the backend, never in this repository.

## Motion and performance

The avatar is loaded only when requested and targets 30 fps. Motion respects reduced-motion preferences. Gesture blending and breathing are implemented in `avatar/movement.mjs` and `avatar/presence.mjs`, not baked into every animation clip. The full-detail avatar is approximately 20.6 MB; performance depends on hardware and network conditions. Lip synchronization is approximate, not phoneme-perfect.

Existing legacy assets are retained for compatibility. The current entry point uses `production.css`, `production.mjs`, `hero-scroll.mjs`, `hero-frames/`, `assets/` and `avatar/`.
