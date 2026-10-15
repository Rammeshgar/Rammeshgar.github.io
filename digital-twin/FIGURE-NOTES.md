# Digital Twin: the reply theatre

Figure tier, original SVG teaching object. A sliding cue card opens a wooden miniature theatre; a controlled reply becomes a visible transcript, while an articulated jaw and hand illustrate approximate mouth and gesture coordination. The screens close when the model is unavailable, but the text tray remains available. No microphone, audio, model or provider is contacted.

## Parts planned before geometry

Ground: four feet, deck, front apron, two edge trims, three stage-board inserts, two step risers (13). Structure: two rear posts, two front columns, four column shoes/caps, two crossbars, crown, two side brackets, four structural screw heads (17). Curtain system: two tracks, two end stops, two moving carriers, ten pleated screen slats, two bottom hems (18). Puppet: rear support, hip, torso, two legs, two shoes, neck, head, jaw slider, jaw, two eye inlays, two upper arms, two hand blocks (17). Cue station: input rail, sliding cue, context stop, output tray, transcript card, three printed rules (five solids plus printed lines). Total intended solids: 70, all drawn and recorded by their real slab geometry. No parts copied from the identity model.

## Primary evidence

Public source revision `cc7771f05781b55bb07f43954b5b96fe687444d7` in `Rammeshgar/digital-twin-demo`, reviewed 15 October 2026.

- README.md: input paths, controlled context, approximate audio/transcript mouth movement, text fallback, browser capability limits.
- ASSET_NOTES.md: authored rendering/integration, adapted animation resources, model and likeness excluded from MIT code license.
- movement.mjs: non-repeating gesture selection, interpolated quaternion tracks, blend overlap.
- mascot.js: browser input/audio/render state, Three.js imports, text chat and voice controls.
- netlify/functions/chat.js: server-side chat endpoint; source map points to this implementation rather than exposing any credential.

The theatre is a teaching analogy, not a physical implementation, live UI, lip-sync benchmark or claim that AI answers are always factual. There is no synthetic performance metric.

## Rebuild and verification

The figure builder uses the MIT-licensed Anatomy kit at build time only; no runtime dependency or remote script is loaded. Set `ANATOMY_KIT_DIR` to the local installed kit directory if it is not in the standard `.codex/skills/anatomy/kit` location. No machine-specific path is embedded in output.

```
node tools/build-twin-guide.mjs --audit
node tools/build-twin-map.mjs
node tools/check-twin-guide.mjs
```

Geometry: 70 real solids, 26 states (rest plus 25 samples of the same pure teaching model), measured depth ordering and motion clearances. Every slab has a unique owner; only the four actual feet are ground. Latest audit passed every line at zero with no allow-list exclusions (6,640 overlaps, 314 order rules). Runtime uses those measured keys plus motion depth and reorders only when necessary. The jaw rides a backing slider; the visible right hand slides along an arm end rather than lifting away. Foreground curtains close all the way to the deck, physically hiding the puppet while leaving the front transcript tray outside. Opening travels 30 world units to clear the hand without intersecting the side trim.

Runtime checks: 25 focused checks cover actual body theme selection in light/dark variants, embedded closed-at-start state, exact parent-window/origin validation, allow-listed scenarios and parts, actual geometry movement, moving-reference-only frame updates and change-only text writes, direct part selection returning the stage to view with keyboard focus, Pause/Replay, hidden-page cancellation, reduced-motion static interaction, no mic/audio/provider requests, and forged-message rejection/valid relaying through the case-study bridge. Native map hit areas, immediate explanation, explicit guide action, standalone deep links and real canvas zoom/fit are tested by executing the generated map controller in a DOM fixture. Map static light/dark/editorial variants pass the Diagram Design installed self-check; source links are retained in the interactive map (the strict script-free variants name the pinned file/revision without remote anchors).

Verification limitation: the installed Anatomy headless screenshot and line-end tools were attempted twice but Chrome crashed in this sandbox and cleanup reported EBUSY on a Crashpad report. No browser-line result or screenshot is claimed from those failed commands. Main-agent in-app-browser visual review covers both the mechanism and embedded layout. The only open `.iso-line` paths are three printed transcript rules, correctly marked `free` as text; structural edges are closed actual slab outlines.

## Integration contract

`guide.html?view=guide&layout=preview` hides controls for the homepage poster; `layout=compact` retains compact native controls. The case study embeds both map and guide near the top. Same-origin parent control: `portfolio-figure` with `open` and `theme`. Selection IDs: input, context, reply, voice, avatar, fallback. Scenarios: typed, speech, no-mic, no-model. Part selection starts at the relevant teaching stage, then continues unless explicitly paused. Reduced motion jumps to a meaningful still; the timeline remains operable. Maps send `portfolio-map-selection`, guides send `portfolio-guide-selection`, and both verify the exact parent/window and origin.

The architecture map groups input alternatives, server context, provider response, transcript, speech/timing, text fallback and character performance into seven components. A separately composed 312 × 400 compact map keeps the entire overview visible in the small case-study panel, with the same correct optional-output branches. The full-size map retains browser/service grouping and detail. Animation internals and deployment infrastructure are omitted; the pinned implementation links remain the detailed reference. Brand exception: current portfolio cream, green and copper are retained instead of changing global Diagram Design profiles.

## Clarity revision

The page now explains Digital Twin’s purpose before naming the theatre. A short key appears above the moving stage: the card is a question, its stop represents professional context, the puppet is the optional voice/3D layer, and the tray is the readable answer. The object and pure model are unchanged.

Both map layouts have native transparent buttons covering each drawn node. Tab, Enter and Space use normal browser button behaviour; selected/focused outlines remain visible. Clicking explains the component in a normal-flow panel below the map, brought into view without covering any nodes. Opening the corresponding animated example is a separate explicit action. The original below-diagram source/explanation list and script-free variants remain available.

The standalone map fits up to 1,280 px wide instead of the old 900 px page limit. Native Zoom in, Zoom out and Fit controls change the canvas width; the viewport pans locally at narrow sizes and the compact map keeps its existing small-screen composition. Sources, AI limitations and asset provenance remain below the initial explanation.

The compact map hides the full seven-item technical reference list and source-revision footer. Selecting a drawn box still shows its short explanation and explicit Show in guide action. Standalone and script-free views retain all component facts and source references. Asset-size and animation-count claims are intentionally omitted to avoid stale figures; this maintenance note belongs in documentation, not the public case-study copy.

## Consistent interaction contract

All six connections have stable `data-from` / `data-to` identities in both layouts. Selecting a box accents only directly incident connections and their matching arrowheads; unrelated connections dim modestly. The work profile and AI provider retain distinct graph identities even though both use the same simplified reply animation. Each action names its actual example and describes shared examples explicitly.

The chosen scene loops through its 12-second model with a 0.9-second final hold. Manual Pause is separate from offscreen/tab/page lifecycle suspension and survives scene changes, part selection, map messages and visibility changes. Scrubbing and arrow stepping also hold. Only Play or Replay clears that hold. Hover and focus never pause the scene. Reduced-motion preferences remain an independent static-mode gate.

Click/tap selection delegates only from actual painted SVG fill/top/shade paths. Native browser hit-testing follows the measured, dynamically sorted painter order and moving transforms, so foreground curtains receive a hit rather than a covered puppet. Empty stage space has no selection action. The visible part explanation is directly below the figure, before bulky controls; native external buttons remain the keyboard equivalent. Runtime fixtures test the event contract, but actual browser occlusion still requires the main-agent visual/hit review rather than a fabricated hit-test certification.

The 25-check suite executes every scene for more than three cycles, checks the final hold, exercises persistent Pause across all entry points/lifecycles, validates physical-target delegation, and checks exact incident-edge sets/arrowheads for all seven nodes in both layouts. The unchanged real geometry audit was rerun and passed all lines at zero.
