# QA inspection-and-evidence station · Figure

An optical conveyor carries one illustrative selected check through a camera gate;
its result chooses a physical exit lane while a separate evidence card goes to a
review tray. Movement explains execution, not diagnosis or live monitoring.

Parts planned before geometry: 1 bedplate, 8 foot pads/risers, 2 bearing rails,
1 belt deck, 12 transverse belt slats, 2 exit supports, 2 gantry posts, 2 post caps,
1 bridge, 1 camera housing, 3 lens rings, 1 shutter slide, 2 shutter guides,
1 specimen pallet, 1 specimen face, 2 specimen locating pads, 2 diverter guides,
1 translating diverter, 4 review-tray walls/floor, 1 evidence card, 1 card clip,
1 alert base, 1 alert post, 1 alert shutter, 2 control buttons and 1 switch housing.
Purposeful screws, closed vent slots and edge-rooted scales finish the actual mounts.

World units: x conveyor travel; y alternate result lane; z up. The camera is fixed
above the belt. No exploded assembly, tubing, shader, microphone or live backend.
All moving shapes are built once; transforms derive from the pure scenario model.
Light and dark tones use the existing portfolio brand. The station is a teaching
metaphor, not the project's literal hardware or UI.

Scenarios: passing selected check; failing check retains evidence; repeated smoke
notification suppressed within documented cooldown; dashboard monitor paused.
Paused means dashboard presentation, not proof GitHub Actions has been disabled.
Smoke email eligibility is UTC hour >=4 and <16, elapsed seconds strictly >3600.
A failure stays a failure when a notification is suppressed. No invented percentages.

Source pin: Rammeshgar/PC-test-automation @ ebe41cbe080f87084eceede27b3ad91976658456.
README blob: bd21cf0ddbb4fcc2f790dc7fcf3dc569c5b30923. Schedules and failures
must be read against actual workflows, not generalised across all suites.
