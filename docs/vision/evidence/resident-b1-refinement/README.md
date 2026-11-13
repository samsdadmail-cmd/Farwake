# Checkpoint B1 — grounded walking refinement, awaiting creative review

Kyle and Atlas reviewed the previous uninterrupted take and accepted the identity
improvement, but did not grant final walking approval. This is a focused Aya-only
refinement on `home-composition-checkpoint`; original B/B1 assets and evidence
remain unchanged. No other resident rollout, save-format or navigation change.

## Changes to assess in actual gameplay

- Keep the authored atlas and interior artwork. Register exterior frames at their
  source pelvis rather than silhouette-box centre, removing arm/boot-driven body
  shifts between frames.
- Reduce Aya's cadence to 75% of the previous rate for a given travelled distance.
  Contact poses occupy 36% each of a full cycle, passing poses 14% each, instead
  of spending half the cycle in the standing/passing sprite. The unladen step
  covers about 16.75 world pixels; one map tile is 32 world pixels.
- Read measured damped presentation speed to end walking during actual stops;
  do not keep stepping solely because the walk-strength blend is decaying.
  Decorative half-pixel body lift fades with speed; Reduced Motion omits it.
- Preserve support-leg phase through direction changes and match footstep-sound
  cadence. Existing simulation positions, speeds, routes and outcomes are intact.
- Actual outdoor settling/finishing can show the authored standing pose. Active
  specialised work/leisure still uses the older rigs and remains a known limit.

## Home entry

The old inspector was intentionally opened by the previous capture's
`showBuilding` call: it is the management view, not a compulsory home-entry step.
The player's shorter route already exists: tap a completed prefab home on the
map, then **Enter home** on its compact selection card. Manage is optional.
This refinement gives that home card a separate action row with 48px minimum
button heights and makes Enter home the primary action. The gameplay test now
uses a real map tap and this direct button, and rejects an intervening management
sheet. Other building inspectors and facility management remain available.

## Evidence and verification

Pending the branch's Chromium/WebKit workflow capture. The main additional take
must show a naturally selected outdoor route, turns, arrival and an actual stop
at ordinary 1x, with the supported 2.35x camera zoom. Search may advance normal
simulation before capture; never grant tasks, routes, stock, attendance or rewards.
A separate home-route take verifies map selection and direct entry.

Local build parity, content reachability, save migration/recovery, housing,
resident identity/attendance and 30/60Hz gait/stop checks pass. Local Chromium
cannot launch because the execution environment blocks Unix-domain sockets;
use CI browser results rather than claiming a local visual pass.

## Limits and preserved open work

The atlas still has two contact drawings and one shared passing/idle drawing per
direction. Timing and registration refinement cannot create the nuance of a
larger authored walking sequence; do not claim perfect planted-foot motion or
creative approval from test results alone. Direction artwork changes in discrete
quarter turns. Continuous indoor walk-to-chair/bed navigation still does not
exist; genuine activity changes use explicit pose cuts.

The exterior terrain/buildings and richer interior scene have an environmental
style mismatch. Record this as a future **exterior/interior environmental
coherence** milestone; no overworld overhaul is authorised by this checkpoint.

SAVE-EXPORT-01, physical iPhone usability/Files delivery, landscape blending and
large-colony performance remain OPEN. PR #25 remains draft. No merge into #23,
#24 or main, no production promotion. Stop for Kyle and Atlas's creative review
before spreading the character presentation to other residents.
