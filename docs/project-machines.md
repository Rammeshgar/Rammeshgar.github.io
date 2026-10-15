# Distinct project machines and source-linked maps

Prepared locally on 15 October 2026. This is not a public deployment receipt.

| Project | Original Figure metaphor | Source pin | Meaning and limits |
| --- | --- | --- | --- |
| QA Suite | Optical inspection conveyor, 61 actual solids | `ebe41cbe080f87084eceede27b3ad91976658456` | A specimen represents one selected check; inspection produces a result and an evidence record. A failure needs human investigation, not automatic diagnosis or repair. |
| Seneschal | Mechanical railway interlocking, 74 actual solids | `a4ab85ebca0551b0aab5bb3de9028cec91482ec1` | Prerequisite and permission conditions control a task ticket, handoff and bounded correction. This is not the literal app UI or universal enforcement assurance. |
| Digital Twin | Miniature puppet theatre, 70 actual solids | `cc7771f05781b55bb07f43954b5b96fe687444d7` | Input, bounded professional reply, approximate speech/gesture cues and text fallback. No microphone, provider request, consciousness or phoneme-perfect claim. |

All three objects are framework-free SVG Figures, not reskinned copies of the
Exchange press. Concept/parts lists, source evidence and local controllers live in
each project directory. The architecture maps compress the source into six or seven
responsibilities; individual tests, plugin internals and exhaustive retry paths are
omitted. The source remains the reference. Historical screenshots remain below the
two tools, and the original Twin live demo remains prominently linked.

## QA source and exact model boundaries

The pinned README blob is `bd21cf0ddbb4fcc2f790dc7fcf3dc569c5b30923`;
the smoke workflow blob is `50b9f776c2ffb2744f5353df982e9fb3dbcde435`.
Both were independently read before authoring detailed claims. Exact anchors are
recorded in `qa-suite/source-evidence.json`.

The pure `qa-suite/model.mjs` is an illustrative timeline, not execution telemetry.
Passing and failing selected checks, repeated smoke email suppression and a dashboard
paused-monitor setting are separate scenarios. Paused does not imply that GitHub's
schedule has been disabled. Smoke email requires a failure, UTC hour >=4 and <16,
and strictly more than 3600 seconds since an existing timestamp. A missing timestamp
is an allowed first notification in the real workflow; the teaching examples use
explicit fictional elapsed times. That policy is not generalised to every workflow.
Failure evidence and the failed result remain even when a repeat email is suppressed.

## Interaction and performance contract

Project case studies pair both real tools near the top. Compact maps use separate
readable layouts rather than showing a large desktop graph through a narrow crop.
Full-size map/guide links open new tabs. Complete map descriptions and static
variants preserve meaning without JavaScript. Native named controls, visible focus,
44px targets, deterministic timeline/steps, genuine Pause and Replay are retained.
Animation readouts are visual, not an incessantly announcing live region.

New guides validate exact parent window and same origin before receiving
`portfolio-figure` (`open`, `theme`) or `portfolio-guide-selection` (`part`,
optional `scenario`). Maps send `portfolio-map-selection`; guides announce
`portfolio-figure-ready`. Strict per-project allowlists reject unrelated selections.
Exchange keeps its existing protocol. No receiver uses a wildcard target origin.
Embedded guides start closed, wait for visibility/readiness and stop offscreen,
when hidden or on page exit. Reduced motion gives still, selectable examples.

One shared homepage controller owns four lazy previews, with at most one active
owner. It never nests an iframe inside a case-study anchor. A shared Pause previews
control above the grid replaces the removed per-card overlay buttons; explicit pause
survives hover, focus and visibility changes until enabled again. Thumbnail-only
layout fits the entire machine, short explanation and live phase without scrolling.
Posters remain until a trusted ready message; ordinary links stay single-tap.
Save-Data disables previews honestly without disabling the case-study links.
No new dependencies, external data collection, backend requests or public services
are introduced. The existing original-film scroll controller is unchanged.

## Rebuild and focused verification

```sh
node tools/build-qa-guide.mjs
node tools/build-qa-map.mjs
node tools/build-seneschal-guide.mjs
node tools/build-seneschal-map.mjs
node tools/build-twin-guide.mjs
node tools/build-twin-map.mjs
node tools/build-twin-case-integration.mjs
node tools/check-portfolio.mjs
node tools/check-exchange.mjs
node tools/check-motion.mjs
node tools/check-preview-integration.mjs
node tools/check-qa-guide.mjs
node tools/check-seneschal-guide.mjs
node tools/check-twin-guide.mjs
node tools/check-delivery.mjs
```

The eight check scripts contain 132 focused checks. They exercise the actual guide
controllers and pure models in DOM fixtures, not live clinic or assistant services.
They cover forged messages, readiness, owner handoff, hidden/offscreen cancellation,
actual transform changes, Pause/Replay, reduced-motion static interaction, source
pins, assets and preserved evidence. Fixtures are not browser rendering certification.

The interaction-consistency revision adds exact incident-edge and arrowhead checks,
more than two complete cycles in every example, persistent manual Pause across all
selection and lifecycle paths, and direct painted-solid selection with keyboard
alternatives. QA's logical part labels now derive from actual named assemblies;
the physical geometry, audited motion groups and painter order are unchanged.
The browser separately verified foreground occlusion. No empty stage-wide hit box
was added. A selected example may seek a new held pose but does not clear Pause.
See canonical-twin-delivery.md for the original case integration and local builds.

The QA builder uses the installed Anatomy MIT kit, vendored in `tools/qa-kit` with
its license. Its recorder stores the same rounded slabs/cylinders that are drawn.
The local audit extension accepts exact pure-model translation vectors because the
specimen moves in two axes at different rates; no shape or failure check is bypassed.
See `tools/qa-kit/PROVENANCE.md`. Settle measures base keys over 228 quarter-second
poses. The live renderer sorts those same keys plus actual translation depth,
reordering existing nodes only when needed rather than holding a faulty rest order.

`node tools/build-qa-guide.mjs --audit` passes the true-shape, actual-runtime-order
depth and collision sweep: 228 states, 51,066 measured overlaps and 292 ordering
rules. Earlier independent builds of 24 scenario poses also passed support, depth,
coverage and clearance checks. These are sampled checks, not an exhaustive continuous
collision proof. `--audit --rest` omits the collision sweep and is development-only.
No alternate fake shapes or blanket clearance exemptions are used. The new machine
does not explode and has no tubes or shaders. Seneschal/Twin receipts are in their
project notes; their executors record their own audited poses and limitations.

QA `system-map-static.html` passes the installed Diagram Design self-check. Its
interactive counterpart deliberately includes pinned GitHub links and a controller;
the static-only checker is not represented as validating those extensions. Existing
cream/green/copper tokens and Inter/Georgia are a project-local brand integration
exception; the shared installed style guide is untouched. System-font labels in the
architecture exports are disclosed fallbacks, not a claim that the default Diagram
Design typography was installed.

QA also provides static `map-light.html`, `map-dark.html` and `map-editorial.html`
variants from the same complete SVG/content, all passing the static self-check.
`guide-light.html` and `guide-dark.html` set the actual body theme explicitly for
review; the default guide remains light. These are portable source artifacts, not
extra live services or screenshots.

The main reviewer approved interactive desktop/390px phone layouts, light/dark
figures, actual moving geometry, Pause, map handoffs, explicit part scrolling and
standalone part/scenario links. Four homepage previews were initially unloaded;
starting another closed the previous owner. The QA compact map fit its 322px pane
without horizontal overflow, with a 306px SVG rather than a cropped desktop graph.

Headless Anatomy browser line-end checks were attempted, but Chrome startup failed
with EBUSY in this environment. No line-end result or passing claim is available.
Interactive browser review and true-shape audits do not substitute for that check.
No Lighthouse improvement, exhaustive security/accessibility audit or clinical
correctness is claimed. Publication remains a separate owner action.
