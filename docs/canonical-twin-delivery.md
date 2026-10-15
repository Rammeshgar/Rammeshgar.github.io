# One Digital Twin case, two explicit repository packages

The existing canonical case is `https://rammeshgar.github.io/digital-twin-demo/`,
deployed by `Rammeshgar/digital-twin-demo`. It was already a full case study, not
just a demo URL. Its original public index blob is
`e59eabb9b7c911768999cac2f962ced7be84bde3`; the captured source is under
`tools/vendor/twin-case.original.html`. The original launcher, model/runtime paths,
engineering evidence, artwork and five-stage architecture are retained.

`node tools/build-twin-case-integration.mjs` inserts the portable dual map/guide
section and contribution/limitations into that original case. It creates a separate
`../Digital-Twin-Case-Integration/source/` tree and a local review mount at
`digital-twin-demo/`. Run it before the focused checks after a fresh clone. The
portable explainers include their own CSS, bridge, self-contained figures and
Anatomy licence; they do not depend on publishing the portfolio first. Existing
public assets and backend are not copied or changed.

The local review mount references the existing public artwork/styles, strips
analytics, and blocks connections. The production index preserves the existing
analytics/runtime. These are deliberately distinct artifacts. No real demo launch,
model, microphone, provider or soundtrack was exercised in this work.

The homepage links directly to the canonical case in one click. `/digital-twin/`
redirects to the canonical `#inside` section and keeps a visible fallback link.
The auxiliary `/digital-twin/` map/guide files remain compatible; the route is no
longer a second full case. The alias is omitted from the canonical sitemap.

The portfolio's existing `Publish-Portfolio.ps1` still targets only
`Rammeshgar/Rammeshgar.github.io`. The separate `Publish-Digital-Twin.ps1` targets
only the original project repo. Both validate fingerprints and expected remote
blobs, preserve unrelated files, and stop on unexpected newer edits. No force push
is used. The explicit `Publish-Portfolio-And-Twin.ps1` coordinator verifies both
local packages and dry-runs both remote baselines before publishing Twin first.
Its `-VerifyOnly` mode is local and makes no network calls.

Publishing the two repos is not atomic. GitHub Pages deploys them independently;
check both after they finish. If the second publication fails, reconcile it rather
than trying to roll back or force-push the first. No commit, push or deployment was
performed while preparing these packages. Their manifests are the authoritative
file lists and fingerprints; local PS verification is separate from the 144 source
and controller checks.

The accepted A/theme revision adds local `explainers/portfolio-theme.js` and `.css`
to the Twin package. The canonical case and its interactive tools therefore share
the user's stored/system preference without relying on a prior portfolio deploy.
Static export palettes and the original runtime/model/backend assets are unchanged.
