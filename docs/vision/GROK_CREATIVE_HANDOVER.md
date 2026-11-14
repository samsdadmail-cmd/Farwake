# Grok findings and technical integration

Preservation: `grok/immersive-homes` at
`9428e60ae68b61b86ffa32bc199ad2b9c01d9dfe`, draft PR #24. Base overhaul:
`f3a09e27eea2c6f02a1484e17db64a43da075904`, draft PR #23.
The original [technical handover](../immersive-homes/HANDOVER.md) is unchanged.

## Creative findings retained

- Treat the reference as a complete composition, not disconnected objects.
- Immersion is not equivalent to filling the phone with a cropped room.
- Scale, viewpoint, furniture, light and the surrounding world tell one story.
- Infrastructure supports people creating lives, not merely thresholds.
- Home, the Unknown and Legacy guide future development; they do not authorise
  immediate social, family, exploration or progression expansion.
- Lamplight should emerge from simulation, not nightly player micromanagement.
- “Hand-built frontier” and “luxury dashboard” are incompatible directions.
- Early gameplay demonstrations and creative review precede implementation spread.

## Audit and integration choice

PR #24 adds only home-visit.js, source integration/CSS and documentation/evidence
on top of the latest PR #23 head. Continue on `home-composition-checkpoint`, based
on that preserved commit, targeting `living-colony-experience-overhaul`. Neither
source branch is overwritten or merged. This records Grok's history while auditing
and replacing the unsafe/failed portions before integration review.

Reuse: view-only architecture, door approach, veil/iris phases, continued simulation
and exact camera restore. Keep the existing inspector renderer available through
management. Do not introduce save fields or replace people/door/relationship logic.

Correct at checkpoint A:
- Aggressive focus crop and generated floor → complete authored house composition.
- Blue-pixel recolour leaving a moon in daytime → paired coherent day/night art.
- Automatic map-tap entry → compact inspection with explicit Enter home and Manage.
- Captured stale camera object after load → getter for the current camera object.
- Full DPR3 canvas and per-frame layout reads → capped backing surfaces and cached
  layout invalidated on entry/resize.
- Interior painting bypassing quality limits → existing performance draw throttle.
- Escape invoking unrelated handlers → consume only active visit Escape events.
- Old black/gold overlay → restrained field labels and small safe-area controls.

Do not draw the old geometric inspector inhabitants into the immersive view.
Checkpoint B needs authored residents and furniture occlusion after composition
approval. No fake hit targets, conversations or occupancy are acceptable.

## Recovered CI findings

At f3a09e27, 19 legacy suites passed; Chromium/WebKit reported 113 passes and six
failures. Four assertions counted 52 discovery nodes across hidden legacy markup
and the actual drawer instead of the drawer's 26. Scope those assertions to #sheet.
Two assertions expected sleeping at 20:00 despite the new awake home wind-down;
verify actual home entry while awake and sleeping after staggered bedtime instead.
Do not weaken relationship/save/resource assertions.

Historical mature 40-person CPU samples and synthetic 0.5–1.7-second spikes remain
risks, not proof of smooth iPhone performance. Do not rerun all endurance suites
for every composition adjustment. Use targeted home/camera/migration checks now,
then broad suites at approved integration checkpoint D.
