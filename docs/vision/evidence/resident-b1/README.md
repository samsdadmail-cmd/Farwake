# Checkpoint B1 — focused Aya identity and movement refinement

Kyle and Atlas conditionally approved B's direction on 13 November 2026, with
identity, pixel density, bedding, phone readability and walking refinements
required before expansion. This is still **Aya only**, awaiting creative review.
Recovery reference: `103aef0a6f85b2dd2234a7bea14f59943a4f8a1e`; PR #25 remains draft.

## Focused changes

- One revised exterior atlas preserves the dark wavy bob, peach skin, ochre
  collared jacket, dark undershirt, slate trousers and brown boots. Its smaller
  head and longer body bring proportions towards the existing interior artwork.
  The interior atlas and approved room artwork are unchanged.
- Front/back contact poses now alternate both boots and opposing arms. An idle
  passing beat sits between opposing contacts. Existing distance-driven phase and
  damped world positions remain; no movement speed or route algorithm changed.
  A half-world-pixel rise on passing beats is omitted with Reduced Motion.
- All Aya travel, including home approaches, uses her authored exterior identity;
  a stale work/leisure blend no longer switches her to the old rig during travel.
  Stationary specialised work/leisure still uses the existing rig; that is an
  explicit continuity limitation, not an approved population-wide solution.
- Exterior frame cutouts are 28 world pixels high, nearest-neighbour sampled,
  with a stable foot baseline and no filtering. Interior standing remains 124
  scene pixels high, seated on the same scale, sleeper 104 pixels long. Both
  render through the scene's existing nearest-neighbour pipeline. The two views
  retain different levels of detail, not a newly invented character system.
- Sleeper is lower and slightly farther into the lower bunk. Original blanket
  pixels now cover her boots/lower body, with face/hand visible at the pillow and
  the original ladder restored in front. No bedding or occupancy state is added.

## Indoor navigation limitation — explicitly retained

The home view has activity anchors, not a walkable interior floor graph or
furniture approach/seat transfer simulation. The previous linear anchor glide
and almost-duplicate indoor walk frames did not establish convincing navigation.
They are removed. Genuine settling shows a standing pose, then a seated pose
when the real activity becomes active; real rest changes to the bunk pose.
**These are pose cuts, not a continuous doorway-to-chair or chair-to-bed walk.**
A convincing continuous indoor route would require a separate small approved
navigation/transition checkpoint. No fake route, task, occupant or activity is
created for the recording. No new navigation system is part of B1.

## Actual gameplay evidence

All captures use the unchanged historical Day-58 colony imported through the
normal UI, with its eight residents and Aya assigned to completed home #7.
No task/path/resource/occupancy grants. Simulation stepping finds genuine scenes;
once the take starts, movement and attendance run normally at 1×.

- `aya-outdoors-390.png`: same exterior framing as B, at 1.7× world zoom.
- `aya-outdoors-normal-390.png`: normal 1× world zoom.
- `aya-seated-whole-390.png`, `aya-seated-room-390.png`: actual reading in both cameras.
- `aya-sleeping-whole-390.png`, `aya-sleeping-room-390.png`: actual rest in both cameras.
- `same-colony-v4.json`, `genuine-state-evidence.json`: review save and live attendance.
- `aya-walk-home.mp4`: one continuous outdoor walking/turning/home-entry take,
  from Day 63 around 17:48, reached naturally from the same Day-58 import.
  Only the first 14 seconds of import/scene-search setup are trimmed from the
  original browser video; no frames are rearranged, no mid-take cuts or speedups.
  Camera follows the real presentation position, then real Enter home is used.
- `aya-walk-state.json`: naturally assigned home route, four route turns, sampled
  presentation positions/directions/frames, and final actual home attendance.

At 390×844, the exterior jacket/hair/silhouette remain identifiable; facial detail
is deliberately limited. Whole-home reading/sleeping are recognisable silhouettes;
the closer camera is still necessary for face/book detail. These are rendered
observations for Kyle's review, not a claim of physical iPhone readability.

## Verification and open work

Local Chromium evidence uses the installed headless Chromium 153 runtime because
the normal browser download was unavailable. Targeted home/camera and new movement
checks accompany build/content, migration/recovery, housing and read-only resident
checks. The branch workflow also runs the Chromium/WebKit integration gate.
Local results: six home/camera/real-colony Chromium checks passed, plus the
new genuine walking-route check. Build parity, content reachability, life migration,
housing and resident identity/attendance checks passed. CI results are linked in PR #25.

SAVE-EXPORT-01 remains OPEN. Review-save/test-artifact JSON is not proof of manual
file delivery. Physical iPhone usability/Files delivery, landscape scene blending
and large-colony performance remain open. No save-format, migration, pathfinding,
activity outcome or production change is intended. No merge or production promotion.
