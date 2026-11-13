# Checkpoint B — Aya Mercer: integrated visual review

A2's complete-home composition and optional reversible 1.7× camera are approved
foundations. **Aya's character integration and identity continuity await Kyle and
Atlas's creative approval. No additional residents are authorised by this pilot.**

## What is implemented

One coordinated Aya identity: short dark wavy hair, peach skin, ochre work jacket,
slate trousers and brown boots. Authored transparent pixel-art frames replace her
walking/idle exterior representation and provide standing, short approach, seated
reading/page variation and lower-bunk sleeping/breath poses inside the real home.
Other people and existing specialised exterior work/leisure rigs are unchanged.

Rendering requires Aya's exact original profile, assigned finished shelter, actual
inside attendance, matching task/building and no travel route. Reading requires
actual life_home activity; sleep requires actual rest action >1. Interruptions
remove the depiction immediately. Drawing cannot grant a task, outcome, memory
or relationship, and adds no save fields. Chair arms/table and bedding/ladder
restore original lit scene pixels over the sprite. Furniture anchors are view
coordinates, not a new persistent furniture ownership/needs system.

The approved complete-home entry remains the default. Closer view is optional and
reversible. Home controls now have stronger label contrast and 48-pixel targets;
an actual pause/resume control supports observation.

## Actual gameplay evidence

Full-size originals are 390×844. These are browser-rendered gameplay captures, not
the original atlas or a standalone room mockup. The recording is a transcode of
real browser video, without rearranged activity frames.

| State | Complete home | Optional 1.7× room camera |
| --- | --- | --- |
| Standing | [whole](aya-standing-whole-390.png) | [closer](aya-standing-room-390.png) |
| Reading | [whole](aya-seated-whole-390.png) | [closer](aya-seated-room-390.png) |
| Sleeping | [whole](aya-sleeping-whole-390.png) | [closer, panned to bunk](aya-sleeping-room-390.png) |

[Actual outdoors](aya-outdoors-390.png) · [Ordinary activity transition recording](aya-genuine-evening.mp4)

Capture source: commit `6a20bbae6f09a243b6da1f80e8078e60d7663595`,
[CI run 43438906086](https://github.com/samsdadmail-cmd/Farwake/actions/runs/43438906086),
artifact `14044897062`. The unmodified historical Day-58 save is imported through
the normal UI. Outdoors is Day 58 at about 11:40. Controlled simulation stepping
then reaches a naturally chosen Day-60 home wind-down at about 20:00. From entry
onward the video records ordinary 1× simulation, with visible pause/resume for
stills; rest starts around 21:08. No resources, tasks, occupants, memories or
relationships are injected. The 33.36-second MP4 is a complete H.264 transcode of
the Chromium browser recording, with no rearranged frames.

[Saved colony before entry](same-colony-v4.json) ·
[Chromium actual state](genuine-state-evidence.json) ·
[WebKit actual state](webkit-state-evidence.json) ·
[WebKit reading capture](webkit-seated-room-390.png)

The normal save deliberately strips transient tasks/routes and reconstructs them
on load; importing the review save does not promise an identical video frame.
The recorded live state separately proves the genuine task/attendance at capture.
These files are test-artifact exports, not proof of manual Save-to-Files delivery.
No screenshot is a physical iPhone test.

## Verification

- 70/70 selected Chromium/WebKit checks passed on the source commit above: home
  entry/exit/management and camera restoration, portrait/landscape bounds, real
  Day-58 import, night occupancy lighting, existing evening/overhaul/baseline-risk
  regressions and the new genuine Aya evening in both browsers.
- Build/source parity, frontier content reachability, v3/v4 migration/recovery,
  housing/routing and the new read-only identity/attendance/pose tests passed.
- An earlier starter-colony recording setup passed in Chromium but did not
  produce an optional home wind-down in WebKit within three simulated days
  (69 passed / 1 scene-search failure). Pausing around asset load did not resolve
  that outcome. No simulation fix was justified or made. The final review test
  uses the existing established colony instead and retains strict attendance and
  activity assertions. This is a scene-selection limitation, not evidence that
  every starter-colony evening has been creatively accepted.
- No broad new physical-device or late-colony performance claim is made. Existing
  expensive endurance suites were not rerun for presentation-only changes.


## Rendered assessment and limits

The character has been inspected against the actual room: the seated body fits
between the left chair arms with boots near floor level; the open book is in her
lap. The side-lying sleeper follows the lower bunk, with original bedding and
ladder in front. Standing is scaled against the chair and counter. These are
engineering observations, **not creative approval** of pose quality or style.

Whole-home detail remains width-limited on a 390-pixel display. Book/face detail
needs the closer camera. Exterior proportions are more compact than the interior
body and still need identity-continuity review. Existing specialised exterior rigs
remain a continuity limitation beyond walking/idle. This pilot does not include
resident tapping, a furniture reservation system, other occupants' sprites, or
a broader animation rollout.

Physical iPhone usability/performance, landscape side blending and
**SAVE-EXPORT-01** remain open. “Backup prepared” does not prove file delivery.
V4 and supported v3 migration/recovery are preserved. Keep original exports
unchanged and verify a delivered file before replacing a colony anywhere.


## Phone review route

Use the isolated pinned preview and a copy of the supplied review colony first,
leaving your personal colony at its existing address. Import does replace the
colony at the destination address after confirmation. Never rely on a notification
as proof that your own backup reached Files.

1. Find Aya outdoors via People/Follow. Compare her hair, jacket, trousers, boots
   and directional walk with the interior views. Specialised job rigs are retained.
2. Inspect her assigned Prefab Home and choose Enter. Whole home must be the
   default; Look closer is optional, draggable and reversible with Whole home.
3. Observe her genuine evening attendance. Pause/resume is the real game control.
   Judge standing scale, chair contact/book legibility, then lower-bunk fit.
4. Exit and verify camera restoration; use Manage to confirm management access.
   Check portrait, landscape, safe areas and control taps on the actual phone.

## Memory/performance scope

The two retained PNG source atlases total 1,347,991 transfer bytes and 12,584,264
bytes of nominal decoded RGBA storage (about 12 MiB), before browser/GPU overhead.
Frame cutouts are cached on demand at small gameplay sizes; the set is bounded
to 12 exterior frames and 8 interior frames across four lighting modes. Existing
A2 surface caps and performance-mode frame restriction remain in force. This is
an allocation accounting check, not a physical iPhone memory or frame-time
measurement. No new 20/40-person device-performance claim is made for this pilot.
