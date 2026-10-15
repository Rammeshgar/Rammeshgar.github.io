# Anatomy geometry kit provenance

Copied from the user's installed `anatomy` skill on 15 October 2026; MIT license
is preserved in LICENSE.txt. Core drawing, lathe and tube modules are unchanged.

The local audit module has a narrow translation-state extension in three places:
`offsetOf` accepts exact pure-model `state.offsets[ride]` vectors, and `keyAt` /
`orderKeys` use their dot product with the camera view vector. Scalar explode
shares retain their original behaviour. QA's specimen moves in two axes at
different rates, so representing it by one scalar explode share would be false.
This extension gives the audit the actual renderer displacement, not a stand-in.
No clearance, coverage, support, depth, geometry or failure check is disabled.

The builder settles one set of base keys over all sampled model poses. The live
controller sorts those same keys plus the current exact displacement depth, and
reorders existing SVG nodes only when their order changes. It does not rebuild
geometry or substitute independently re-rendered posed illustrations.
