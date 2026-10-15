# Seneschal: the interlocking railway

## Current reader-facing structure

The portfolio now introduces the software purpose first: “How Seneschal connects tasks” and “Watch a task wait and continue.” A brief mapping before the animation explains carrier = task result, rear tokens = completed prerequisites, barrier = selected access policy, platform = review. The drawing precedes the playback/scenario controls. The old duplicate inline workflow SVG was removed; its four useful explanations and existing `#workflow` / `#seneschal-*` anchors remain below the main tools.

Each of the seven drawn nodes has a native full-area button overlay in both exclusive layouts. Tab/Enter/Space uses browser-native button behavior. Selection updates the nearby description and highlights only the directly incident incoming/outgoing paths and their arrowheads. Both layouts carry the same stable edge IDs and `data-from` / `data-to` endpoints. Unrelated paths dim modestly; selection never expands transitively. Example links name the actual animation. Local history shares the review example; the provider shares the access-wait example, and each link says it is shared. The optional textual component list is secondary. Full-size maps use the available desktop width inside a 1440px page rather than the previous 680px SVG cap. Zoom buttons change the actual canvas width, and Fit restores the base width and pan position. Compact maps keep their 328px layout with no local sideways scrolling. The pure model, physical geometry and security boundaries are unchanged.

The current focused suite has 25 passing checks. In addition to previous lifecycle/deep-link, node-hit, zoom, detail and copy checks, it executes exact incident-edge/arrowhead selection for every node, more than three animation cycles for every scenario, final holds, persistent Pause across every selection/lifecycle path, and physical-hit delegation. The static diagram self-check passes. Actual browser size, physical occlusion and keyboard confirmation are coordinated by the main agent. No AI Slop’s installed `eval.md` is absent; its explicit editing principles were applied to the full visible draft instead.

Anatomy Figure tier, architecture overview, fit canvas, mixed audience. A task carrier cannot leave its siding until both prerequisite signals and the illustrative access barrier clear; its result goes to review, and a correction makes one bounded return trip. This is a physical teaching metaphor, not Seneschal's interface or a real agent run.

## Parts planned before geometry

One chamfered plinth, four feet, one label plate; eight main sleepers, two main rails, two rail-end stops; four sleepers and two rails on each prerequisite siding; two prerequisite token shoes and two token cards; three signal baseplates, three signal pedestals, three recessed signal housings and three sliding shutters; two access-gate feet, two gate posts, one lintel and one vertically sliding barrier; four carrier wheel blocks, one chassis, one ticket and two ticket retaining clips; one review platform, two review guide lips and one receiving stop; four corner fasteners and two handoff receiver fasteners. The inventory is emitted from actual geometry (target 60–80 solids); line details are not counted as solids.

All solids record their real rounded plans into the Anatomy audit. Moving geometry is translated, never rebuilt as a DOM subtree. No WebGL, third-party runtime, microphone or provider requests.

## Source evidence

Pinned public repository: `Rammeshgar/seneschal`, commit `a4ab85ebca0551b0aab5bb3de9028cec91482ec1`.

| Statement | Read primary source |
|---|---|
| Cards retain OpenCode sessions; selected dependencies must complete; labelled handoffs; configurable supervisor and bounded correction | README.md, Agent Board and Session organization sections, blob e1e7229d69c9171fdb39bfc3a593fc51fb1bd97b |
| Plan is analysis-only | config/agent-plan.md, blob 69fd7102aa56ff95c0fe95a879a83b707a8fdf4e |
| Build respects selected approval boundaries | config/agent-build.md, blob ad614ce3cf9d4614fd6ba3f2fa4579ffb035a19f |
| Local binding/private data; tool scope is still consequential | SECURITY.md, blob 917633bf12c5aff8d1a6d5c9c2c544f03c6e24a6 |
| Cloud providers receive required request context | README.md, Security and privacy |

Only these verified high-level claims appear in the map. Integrations, exact internal module names, cost accounting, updater and optional dashboards are intentionally omitted. The map is not a security certification. Shipped diagrams follow the user-selected local portfolio brand exception: Inter/Space/Georgia, cream/green/copper. Installed global style profiles stay unchanged.

## Controls and integration

Stable part IDs are dependencies, permissions, handoff and review; visible names are Prerequisites, Access policy, Task session and Review. Scenarios are complete, blocked, approval and correction. Native buttons select a scenario or inspect an assembly; progress is a labelled native range. A running example wraps after 15.2 seconds, including a 1.2-second final hold. Embedded guides start closed and require a validated same-origin parent. Reduced motion keeps a readable still while all controls remain usable.

Choosing a part seeks its relevant stage immediately (prerequisites at 0 s, access at 3.7 s, task session at 5.3 s, review at 9.5 s or correction at 10.5 s). It plays only when the user has not paused. Map component buttons retain their explanation; the named example link sends the selection to the guide. The persistent `userPaused` flag is separate from visibility suspension. Manual Pause, Home/End, arrows and scrubbing remain held across scenario/part/map selections, tab hiding, offscreen re-entry and parent open messages. Only explicit Play or Replay clears that intent. Hover or focus alone does not halt the running example. Readouts are visual, not a frame-by-frame live region.

Meaningful existing filled solids are directly clickable: prerequisite cards/signals, gate surfaces, the carrier/ticket and review receiver. Delegation uses the actual visible `.iso-solid` ancestry and its allowlisted `data-hit-part`, so the browser’s native SVG paint order, moving transforms and foreground occlusion choose the surface. The plinth, feet and empty stage are not hit targets. No stage-wide rectangle or new solids were added. External native part buttons remain the keyboard equivalent; SVG image semantics are unchanged. Physical selection also preserves manual Pause.

Explicit part selection also follows the moving stage back into the iframe viewport with an immediate nearest-edge scroll. This prevents the browser's automatic button scroll from leaving the animation offscreen and therefore paused on a phone. Initial loading, normal drawing, Pause and scrubbing never auto-scroll. A dedicated fixture protects this distinction.

Compact architecture is a separate 328 × 344 layout, with all seven components and all eight connections visible without sideways scrolling. Full size remains 552 × 612. The full map keeps longer technical context; compact native component controls expose the same source-backed explanations. Both map and guide explicitly reset the browser’s default figure margins so the drawing uses the phone frame rather than shrinking into a narrow inset.

Messages are portfolio-figure/open/theme, portfolio-figure-ready, portfolio-guide-selection/part/scenario, portfolio-map-ready and portfolio-map-selection/part/scenario. Only same-origin messages from the actual parent or expected iframe are accepted. No wildcard target origins. Hidden/offscreen/pagehide cancels the sole frame loop.

Standalone map-to-guide links encode the selected allowlisted `part` and `scenario` in their native URL. The guide validates those query values and starts the corresponding stage, so opening the guide in a new tab does not lose the selection. Initial deep-link loading does not auto-scroll; explicit in-page part selection does. Invalid query pairs fall back to the ordinary handoff introduction.

## Verification

Build: `node tools/build-seneschal-guide.mjs --audit`, `node tools/build-seneschal-map.mjs`. Focused checks: `node tools/check-seneschal-guide.mjs`. Browser and close-up checks are coordinated by the main agent; final evidence belongs in the portfolio verification report. No live agents or providers were used to run the teaching model.

15 October geometry verification receipt: 74 actual recorded solids; the only `stand.*` names are the plinth and four feet, so the audit cannot silently ground the moving mechanisms. All four 14-second pure-model scenarios were sampled at 60 Hz, deduplicating identical poses to 668 depth states. The complete Anatomy slab audit passed with zero on all failing lines, including support, sunk pairs, true depth, motion clearance and shape coverage. The later final hold repeats the already-audited 14-second pose. Live painter order uses the same settled keys plus projected movement depth, and only reorders when the order changes. Normal and audit builds use identical pose sets and therefore identical geometry keys.

The packaged headless line checker was attempted but Chrome crashed before measurement and its temporary Crashpad dump remained locked (`EBUSY`). No line-end result or headless PNG is claimed. Main browser review is separate. The script-free map passes Diagram Design `self_check.py`; its source citations are plain repo/commit/path text to meet the self-contained export contract. Interactive/full-size maps keep clickable pinned GitHub sources because provenance is part of this user request. The portable fallback uses the disclosed Arial fallback; integrated views use the packaged Inter/Space families.
