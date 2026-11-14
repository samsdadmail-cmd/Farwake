# E1 — Lamplight Lane: initial visual checkpoint

Runtime/source: `2d747e53f1f3c7f1a5ca83baf6f88d3119c58a33`.
Branch: `home-composition-checkpoint`, draft PR #25. B1's outdoor walking
foundation is approved; E1 is awaiting Kyle and Atlas's creative review.

One real address: Aya Mercer's completed Prefab Home (#7 in the review save).
Native 96×64 pixel architecture, slate roof, timber cladding, stone footing,
a bounded grass-only clearing and window-aligned light replace its presentation.
The same footprint, variant-specific entrance and real door opening remain.
Existing history-derived details are retained. No invented chimney smoke is added.
Light reads the same grid threshold/night hours as the approved home view and
uses real attendance: empty/unpowered dark, sleeping dim, awake warm.
No save, task, route, resource, production or progression fields are changed.

## Actual gameplay evidence

Desktop Chromium; the actual game runs in a 390×844 iframe. JPEG captures clip
that exact game rectangle without resizing or including the adjacent developer
controls. This is responsive-layout evidence, not physical iPhone testing.
The unmodified historical `tests/fixtures/home-composition-day58.json` was
imported through the actual import input in an isolated browser origin. Normal
simulation advancement finds the scenes; no attendance, tasks or stocks are granted.

- `before-day-390.jpg`: preserved B1 renderer, Day 58 11:42.
- `day-390.jpg`: E1, Day 59 11:40, home empty; real grid 61 supply / 51 used.
- `night-390.jpg`: E1, Day 58 20:35, Mira genuinely unwinding in the shared home;
  one `life_home` occupant, grid 52 / 51. This does not claim Aya is present.
- `home-entry-390.jpg`: actual direct entry, Day 58 21:06. The approved A2
  whole-home composition still works. Mira has no new interior art: Aya-only
  character scope is preserved. Outside returned to the same framed map.

Reproduce using `tests/overworld-review.html`: import, frame, seek evening/daylight.
These developer controls advance normal simulation and pause for capture.
The paired scenes are the same continuing colony, not identical simulation instants.

## Verification and limits

Build parity, content/survival, fixture sanity, migration/recovery, housing,
Aya identity/attendance, gait and new read-only light/address/cache checks pass.
Actual map tap → Enter home → Outside was inspected in the live browser.
`render-sample.json` records a small B1/E1 CPU draw comparison: both median 0.6 ms.
This excludes full simulation, GPU completion, sustained/device performance.
The ordinary-play remote frame sample had long intervals; smoothness is unverified.

Compared with the approved interior, this starts coordinating slate, timber and
lamplight; it does not reproduce that scene's richness. The small silhouette is
still simplified. Neighbouring structures, dense grass, the old HUD and specialist
activity rigs remain visibly inconsistent. The HUD is not accepted by this pass.
SAVE-EXPORT-01, physical iPhone usability, landscape blending, large-colony
performance and activity rig consistency remain open. Stop before district rollout.
