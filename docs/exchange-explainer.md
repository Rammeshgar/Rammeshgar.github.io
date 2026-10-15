# Exchange Universe case study

Initially built on 15 October 2026 as a focused addition to the existing portfolio.
The subsequent evidence-first homepage redesign places Exchange Universe second
in the project index. The current revision opens with a concise introduction and
the actual map and animated guide together; product evidence, personal contribution
and decisions follow. The preview links to
`exchange-universe/`, with a published-app screenshot from 14 October. Conversion
and mobile evidence, public app links and source links are retained.

## Two complementary views

- **System map:** seven source-verified responsibilities, selected-component
  explanations, exact immutable GitHub file/line links, and a related-guide action.
- **Animated guide:** four existing teaching scenarios, playback, scrubbing,
  inspection and detail zoom. It loads when visible or requested by a map selection.
  Leaving the viewport, hiding the document or leaving the page stops drawing.
- Compact tools appear side by side on wider screens, stacked on phones, immediately
  after the introduction. Full-size links remain available without fullscreen APIs.
  Local scrolling keeps detailed explanations within the compact panels.
- Phones receive a compact numbered map with the same seven connections and
  named component controls. The desktop drawing is not shrunk to illegible text.
- Native named controls, visible keyboard focus, retained map/guide deep links,
  reduced-motion handling and a no-JavaScript fallback are included. The tools are
  concurrent, not exclusive tabs. Map selection moves focus to the guide without
  hiding the map; choosing another component resets only its local detail scroll.

Selecting a machine part now plays its relevant stage. The provider press visibly
moves rather than remaining at a sought peak. The request-protection gate starts
slightly before its closing stage so that closing is visible. Compare opens only the
saved-data drawer; refresh and history include the press; waiting includes the gate.
Explicit Pause freezes transforms, Replay restarts, and scrubbing/step selection may
intentionally hold a pose. Embedded instances wait for the visible parent to open them.
The homepage uses the same actual machine in a decorative, intent-loaded preview,
not a newly drawn substitute. None of these modes performs a rate request.

The request-controls and saved-data nodes are different responsibilities in
`R/store.R`, not invented independent services. The result arrow abbreviates the
parent store collecting a worker result and saving it. Provider work remains
server-side. The page is an explanation, not live traffic or a quota counter.

## Source and deliberate omissions

The map is pinned to Exchange Universe source commit
`6c3fe6778aee948a4ed8fb3cba72c56d3c0ff8d0`. Build-time `git show` reads only the
explicit public files referenced in `tools/exchange-model.mjs`; it does not read
credentials or live caches. `tools/exchange-source-evidence.json` records the
source paths, verified lines and SHA256 hashes of those Git blobs.

This is an architecture overview, not a complete import graph. Local browser
preferences, geography preprocessing, analytics, individual return messages and
hosting replicas are omitted. Chart functions and analytics are grouped; their
separate source links remain available. No GitDiagram service, token, runtime or
AI generation is needed by visitors. The map was checked directly against code.

## Rebuilding

The generated HTML is committed and needs no build step on GitHub Pages.
To edit and rebuild, first obtain a local Exchange Universe Git checkout that
contains the pinned commit, then run from this repository:

```powershell
node tools/build-exchange-map.mjs 'C:/path/to/Exchange_Universe_shiny'
node tools/build-exchange-guide.mjs
node tools/check-exchange.mjs
node tools/serve-review.mjs
```

The first command's default source location is the original author's sibling
review checkout; pass an explicit path on another machine. It reads the pinned
Git objects rather than trusting uncommitted files. The guide builder uses an
included, vendored standalone base and preserves its Anatomy MIT attribution.
Palette/font integration, compact/preview presentation, a validated local navigation
bridge and guarded playback/lifecycle repairs are added. The vendored base and
existing 78-solid figure geometry are unchanged. The builder asserts every runtime
replacement target so a changed upstream base fails rather than patching silently.

## Design receipt

The owner chose the current portfolio style. Tokens were taken from `index.html`
and its existing public assets, and kept project-local instead of overwriting an
installed shared skill's defaults:

| Role | Value |
| --- | --- |
| Paper | `#eee9df` |
| Secondary paper | `#f7f3ec` |
| Ink | `#142e2e` |
| Secondary text | `#53635d` |
| Accent | `#9b4a30` |
| Rule | `rgba(20,46,46,.22)` |
| Main headings | Existing Space Grotesk asset, weight 500 |
| Body and node names | Existing Inter asset, weights 400/600 |
| Editorial serif | Existing intentional Georgia system stack |
| Small technical arrow labels | Explicit Consolas/system-monospace fallback |

The architecture uses a `fit` 768×624 desktop canvas and a separate 312×368 compact
canvas. All seven relationships are retained. The diagram-design skill's
architecture layout, orthogonal connectors and accessibility contract informed
the map; it does not inherit a generic diagram skin. The Anatomy skill informed
the retained physical teaching metaphor and its motion boundaries.

## Verification and limitations

20 Exchange checks cover model/evidence integrity, equivalent responsive graphs,
lazy loading, concurrent panels, message origin/window checks, height limits,
guide readiness, retained map/guide deep links and offscreen/hidden stopping signals.
The actual generated guide controller is executed in a minimal DOM fixture to check
provider transforms, all four stories, Pause/Replay and reduced-motion static steps.
The portfolio and motion scripts add 20 more focused checks. Browser review remains
separate for actual decoded film frames, SVG rendering and responsive interaction.

The packaged diagram-design self-check passes for `system-map-static.html`.
The interactive map intentionally extends that static contract with GitHub source
hyperlinks, embedded existing fonts and a selection controller; those are
rejected by the static-only checker and were checked separately, not waived by
modifying the checker. This is not a complete accessibility/security audit or a
measured mobile performance certification.

The deployed portfolio and public Shiny app are not modified by running the local
preview. A separate publishing script stages only the prepared portfolio files;
publication requires the owner to run it. No unrelated project has been rebuilt.
