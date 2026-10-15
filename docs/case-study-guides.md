# Integrated opening and project guides

Prepared locally on 15 October 2026. This is not a deployment receipt.

## Interaction and scope

The opening uses the existing original artwork and muted film as a full-width
background, confined to that section. A quiet paper gradient keeps the introduction
readable. Native ViewTimeline progress seeks the actual muted original movie while
the opening is visible. The browser owns decoding; no frame sequence is fetched or
warmed. The sampler is capped at 30 Hz, does not poll scroll positions or perform
layout reads each frame, and stops offscreen or while hidden. A visible pause control
stops scroll motion. Reduced motion and Save-Data retain artwork; unsupported native
timelines have an honest manual-film fallback. No audio starts automatically.

The movie is loaded only while the opening is visible and eligible. Explicit
“Play original film” remains independent of scrolling. Native progress, sought time
and actually presented media time are exposed as local diagnostic data attributes;
only browser review can establish that decoded frames really changed. The local
loopback preview supports single byte-range media responses for native seeking.

The homepage has one overview in QA → Exchange Universe → Seneschal order. Each
project has a visible case-study link, specific guide invitation, contribution and
external evidence links. `#qa-case` and `#seneschal-case` remain meaningful anchors
on their cards. CSS hover and `:focus-within` reveal matching decorative previews;
leaving restores the screenshot. Every project now previews its actual local
machine in a decorative iframe on hover or link focus.
QA uses an inspection station, Seneschal an interlocking railway, and Twin a puppet
theatre; Exchange retains its original press/drawer mechanism. Only one preview
owns playback at a time. Leaving, hiding or scrolling offscreen stops it; Save-Data
prevents loading. One Pause previews control sits above the cards, never over the
artwork. Each miniature shows a short explanation and its model-driven phase. Its
complete drawing fits without an internal scrollbar. Ordinary case-study links work
with one tap. Reduced motion preserves
a static, still-interactive guide. See project-machines.md for the later revision.

All four projects have dedicated case studies. Each starts with what the software
does and a realistic example. The two tools then explain different questions:
the architecture map shows how software responsibilities connect; the animation
shows how one example progresses. Neither is described as a frontend/backend split.
Each animation has a short project-specific key before the moving object. The
object appears before the example selector, timeline and technical references.
Existing legacy homepage dialogs remain for compatibility, not as duplicate stories.
Wider screens show the two tools side by side; phones stack the same tools.
Selecting a part seeks its relevant stage. When the user has paused, the new pose
stays held; selection never silently restarts playback. Chosen examples loop while
visible, including a brief final-state hold. Only explicit Play or Replay clears
manual Pause. Step and timeline controls are intentional holds. Hover and focus
alone do not pause. Offscreen/hidden suspension and reduced-motion stills remain.
Full-size documents retain the complete explanatory material.

## Earlier four-step diagram receipt

- Type: top-to-bottom flowchart, `fit`, four steps and three straight connectors.
- Canvas: 312×488, with a 40px content margin, 4px structural grid and bottom note.
- Accessibility: first-child title, non-empty description, namespaced IDs and
  `role="img"`; the complete workflow and all explanations exist without JavaScript.
- Interaction: native named buttons set pressed state and highlight the matching
  node and explanation. They never hide the other steps or execute project work.
- Meaning: the accent marks evidence in QA and configured permissions in Seneschal.
  This is an explanation of selected stages, not live telemetry or a runtime demo.

Project-local brand integration deliberately preserves the approved paper
`#eee9df`, pale `#f7f3ec`, ink `#142e2e`, muted `#53635d` and copper `#9b4a30`.
Website node names use the existing packaged Inter; headings use Space Grotesk
with intentional Georgia italics. No installed skill file or home profile was changed.
This is a branded website-integration exception to Diagram Design's standalone
default typography and single-file packaging. Separate `flow-static.html` variants
are self-contained and script-free, using Arial/Georgia system fallbacks.

The original four-step variants passed the installed Diagram Design `scripts/self_check.py`.
The later machine revision adds source-linked architecture maps; the QA original
four-step export remains available separately, while the new project maps carry the
current architecture. Their concepts and exact verification scope are recorded in
project-machines.md rather than presenting the old four-step view as a full system map.
The full website pages intentionally contain local CSS/controllers, product images
and external evidence links. Focused site tests and browser review check those
integrations rather than claiming they satisfy the static-only packaging checker.

## Evidence and deliberate omissions

QA facts retain the existing portfolio baseline and public repository README,
reviewed on 15 October 2026 (README Git blob
`bd21cf0ddbb4fcc2f790dc7fcf3dc569c5b30923`): Playwright/Python/GitHub Actions,
three suites, the documented 10-minute smoke schedule, selected login/consultation
checks, parser/AI checks, failure screenshots as artifacts, dashboard history and
cooldown-aware email alerts. No checks were executed against the application as
part of this portfolio work. No patient information is included.

Seneschal facts retain the existing portfolio baseline and public repository README
reviewed on the same date: task cards as OpenCode sessions, all-selected-prerequisite
dependencies, labelled handoffs, selected access policy, configurable supervisor
review and provider-dependent cloud model use. Permissions are not presented as a
universal enforcement guarantee for every integration.

The current architecture maps show six or seven responsibilities per project.
Parallel work, individual test paths and exhaustive integration-specific policies
are omitted. The earlier four-step QA export remains as a historical standalone
artifact, not a second primary diagram. Seneschal's duplicate inline drawing was
removed; its useful workflow facts and old anchors remain below the tools.
Human review is not automatic diagnosis, repair or correctness assurance.

## Direct diagrams and full-size inspection

Every visible map box has a native button over its full area, outside the SVG's
image role. Tab, Enter and Space use the same selection controller as pointer or
touch. The selected box, brief explanation and pressed state update together.
Opening the example is a separate, explicit action. Technical descriptions and
code references remain available below or in the full-size map; the first view
does not repeat a long implementation list inside a compact frame.

Standalone maps have responsive enlarged canvases plus named Zoom in, Zoom out
and Fit map controls. Zoom changes the actual canvas dimensions in a local scroller;
Fit restores responsive sizing. The compact layout remains separate, with all
components and connections visible. Hidden layouts have no simultaneous focus
targets. QA's compact map keeps its dashed-email-branch legend in bounds.
Standalone example links preserve allowlisted part and scenario/story selections.
Source windows/origins, lifecycle stops and reduced-motion behaviour are unchanged.

## Verification and limits

`node tools/check-portfolio.mjs` checks routes, assets, anchors, accessible SVG
structure, static meaning, matched hover/focus rules, selection fixtures and
loopback preview safeguards. `node tools/check-exchange.mjs` retains the existing
origin/window validation, readiness, deep-link and source-evidence fixtures, plus
actual generated-guide transform changes across all four stories and explicit pause.
`node tools/check-motion.mjs` exercises the native progress and real-preview
lifecycle controllers. The nine focused suites currently contain 144 checks,
including executed map selection, explicit example navigation and canvas-size
fixtures. They do not substitute for browser decoding, layout or hardware-performance
verification.

This is not a measured Lighthouse improvement, complete security/accessibility
audit or live assistant/backend test. Nothing in this revision publishes private
files, changes the Shiny app or deploys the portfolio automatically.

The earlier browser review on 15 October confirmed different decoded film frames at different
scroll positions (presented media times 0.467 and 0.900 seconds), the actual machine
preview moving, Pause holding the same transforms, provider selection resuming
motion, concurrent compact tools and working standalone full-size links. The phone
layout at 390px had no horizontal overflow; both desktop panels were 634px tall.
These are local functional observations, not a measured performance score.

The final interaction review confirmed selected incoming/outgoing paths and matching
arrowheads across all four maps, meaningful filled-solid part clicks, and manual
Pause surviving map/scenario/part changes. QA was observed crossing a real loop
boundary. Exchange Request protection selected its exact gate stage while paused,
not the preceding provider step. Twin's explanation remained below the graph;
foreground theatre parts naturally occluded clicks behind them. The header had one
44px opt-in music control and one initially paused, non-autoplay audio element on
desktop and phone. No real soundtrack, microphone or backend was used for this review.
Digital Twin's original canonical case retained its launch/evidence/art/architecture
alongside the new tools; portable Back links returned to the case. Publication is
still a separate action across two guarded repositories.

The later clarity revision was reviewed at 1440px desktop and 390px phone widths.
All four maps responded to direct drawn-box activation and keyboard controls,
updated the relevant explanation, and opened the matching example only on request.
The full-size canvas widths changed under zoom: QA 620→775px, Seneschal
835→1044px, Twin 1145→1431px and Exchange 900.8→1126.25px; Fit restored the
responsive size. All four phone pages had no whole-page horizontal overflow.
QA's compact diagram, in-bounds legend, brief explanation and example action were
visible together. Seneschal's duplicate inline SVG was absent. Twin's compact
technical list was collapsed without removing its standalone or no-JS content.

## Accepted A implementation and shared theme — 15 October 2026

The selected comparison's paper/green/copper hierarchy is implemented with one
larger QA project and two supporting projects. The approved current scrolling
hero is retained, not replaced by the comparison's static framed artwork. Actual
machine previews retain their native links, lazy loading, single-owner playback,
visibility stops and persistent shared Pause. No new framework, external design
asset URL or preview-cover control was copied from the design service.

`assets/portfolio-theme.js` is the sole preference owner. It applies a remembered
light/dark choice before body paint, otherwise follows the system. It catches
storage denial, follows later system changes only without an explicit choice,
and synchronizes same-origin documents. Native 44px controls expose their state.
The related stylesheet uses paired surface/action roles rather than flipping the
old overloaded ink variable. Film, video and screenshot pixels are not filtered.

Existing case/preview senders use the current effective theme. The palette-only
frame relay accepts only the actual parent and exact same origin; it carries no
playback or selection fields. Existing source/origin allowlists, selected edges,
physical hit testing, chosen scenarios and manual Pause remain intact. Generated
interactive pages attach the local assets through a shared builder helper; their
CSP adds `self` for those script/style assets alongside the existing inline
controller. `connect-src 'none'` remains in all teaching surfaces.

Explicit fixed-palette exports (`guide-light`, `guide-dark`, script-free maps and
their light/dark/editorial variants) are intentionally not preference-driven.
They retain their portable/static contracts. Interactive print styles reset paired
colours and Anatomy tones to light; this was source-checked, not a full print/PDF
render audit. The canonical Twin package has its own copies of both theme files.

All 144 focused checks passed (the earlier 132 plus twelve theme checks). Browser
review confirmed native toggling, remembered light despite a dark OS preference,
the original 580px desktop hero and decoded film change, moving thumbnail frames,
manual preview Pause, and QA selection/Pause preserved across a theme change.
Desktop 1440px and phone 390/320px had no whole-page horizontal overflow; controls
remained inside the header. All four case families and standalone QA theme control
were reviewed without launching the real assistant, voice, audio or providers.
Named normal-text pairs meet 4.5:1 and the new theme-control border/focus pairs meet
3:1. This is a focused receipt, not a universal security/accessibility/performance
certification or proof of deployment.

### Sticky homepage navigation

The homepage header stays at the top while scrolling, with a 97% opaque
theme-coloured background and a thin border. It adds no blur, scroll listener,
layout-changing shrink or hide/reveal animation. Anchor offsets reserve room
for the header; the phone menu sits below it and can scroll on short screens.
System-first theme selection and remembered manual preferences are unchanged.
Rendered desktop review confirmed the header at y=0 after scrolling 522px,
with the selected section below its 91px bottom edge and no horizontal overflow.
