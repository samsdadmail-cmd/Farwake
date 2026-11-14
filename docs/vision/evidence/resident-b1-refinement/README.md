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

Source/capture commit: `205b8ac72a48eaef2769868c4f07fad1625aaee0`.
Pinned ready preview: https://farwake-founders-21ttntqlu-atlas-8c31.vercel.app/
[Chromium/WebKit workflow](https://github.com/samsdadmail-cmd/Farwake/actions/runs/43474466803): **74 passed** in 4.4 minutes, including both new genuine routes.

- `aya-walk-turn-stop.mp4`: **11.20 seconds**, 390×844, normal 1× simulation
  and playback, supported 2.35× camera zoom. Aya follows a naturally selected
  Day-58 `life_quiet` route near home #7, with three turns, then really stops.
  Only the first 1.40 seconds of import/search/framing setup and the last 0.44
  seconds of the 13.04-second Chromium browser recording are omitted. No
  mid-take cuts, reordered frames, overlays, time scaling or route/task grants.
- `aya-stopped-390.png`: actual authored standing pose after arrival, still in
  the genuine settling phase. Her visible thought is produced by the simulation.
- `aya-outdoor-stop-state.json`: route and per-frame presentation samples;
  destination is (22.5, 32.5), final walking=false with negligible residual speed.
- `home-direct-entry-390.png`: actual map selection card, with direct Enter home
  and separate Manage action. No management sheet is required.
- `aya-home-route-state.json`: separate genuine Day-63 home-route evidence;
  the browser test taps the real map and direct entry button. Interior attendance
  and seated reading are genuine; there is no invented indoor walk.

The original browser videos, both engines' screenshots and state samples remain
in workflow artifact `home-composition-evidence` (ID `14062681498`). Source ZIP
SHA-256: `2fc85981da3dfab78313e175b46bbc6cfb532ba0279bb35df3447353b784760c`.
All captures import the same unmodified historical Day-58 fixture through the
normal UI. Pre-take scene search advances normal simulation only. All movement,
attendance and activity after the take begins run normally at 1×.

Visual inspection of the actual captured frame sequences shows clearer alternating
contacts, continuous turns and stable idle after arrival. The cycle is still
sparse and stylised; no claim of perfect foot locking or final creative approval.
A separate live cloud-browser check imported a review copy and confirmed map tap
→ compact home card → Enter home → genuine seated Aya without opening Manage.

Local build parity, content reachability, save migration/recovery, housing,
resident identity/attendance and 30/60Hz gait/stop checks pass. The corresponding
CI build/save and browser gates pass too. Local Chromium
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
