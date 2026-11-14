# E3-B — architecture, lamplight and atmosphere: creative review

E3-A is approved as the environmental foundation by Kyle & Atlas on 14 November
2026. E3-B is implemented and technically verified in the same neighbourhood;
creative approval is pending. E3-C has not started. No protected-branch merge,
production promotion, world-wide art rollout, new biome or interface overhaul.

Runtime/source: `da6abd71bb3674ffd6ca9d8f19e30f2218e69bc7`.
[Pinned playable source preview](https://farwake-founders-p3ovxn3y9-atlas-8c31.vercel.app/)
· [Draft PR #25](https://github.com/samsdadmail-cmd/Farwake/pull/25)
· [Passing source CI](https://github.com/samsdadmail-cmd/Farwake/actions/runs/43582068613).

## Actual gameplay evidence

- [Day 390×844](day-390.png), [dusk](dusk-390.png), [awake night](night-390.png).
- [Day material close view](day-close-390.png), [night light close view](night-close-390.png).
- [Settling households](settling-390.png), [resting households](resting-390.png).
- [Refined E3-A versus E3-B day](e3-a-vs-e3-b-day.png), [same-time night comparison](e3-a-vs-e3-b-night.png).
- [Uninterrupted 1× genuine colony activity](neighbourhood-alive.mp4).
- Matching WebKit PNGs, both engines' full state/take JSON and the WebKit scheduling comparison are retained alongside these.

Every still is from running index.html after importing the original unmodified
historical Day-58 save through the actual Game and Save UI. Eight residents, 32
real structures, same 13-structure pilot. Overview camera x=825.6/y=1008/zoom=1;
close camera explicitly x=780/y=1040/zoom=1.6. Viewports are exactly 390×844.
No isolated art fixtures, generated concept images, activity/occupancy/resource
or route grants, fabricated weather or fake production outcomes are evidence.
Stills use the real Pause control; game time is advanced with normal simulation
ticks between them. The activity take uses the unmodified game loop at 1×.

Day is 11:40, dusk 18:00, settling 20:39, active night 20:48 and resting 21:19 on
Day 58. Day comparison matches E3-A's camera/time. The night comparison deliberately
uses E3-B's 20:39 settling capture to match E3-A's 20:39 capture, rather than
silently comparing different clock/attendance stages. Comparison images add only
labels and margins, retaining both original captures at 1:1.

The 10-second MP4 omits leading import/setup and trailing pause only. No internal
cuts, speed changes, resizing or invented movement. Start/middle/end frames were
inspected after encoding. Exact trim/provenance is in capture.json. The original
videos and all tests remain in artifact 14108354952. Its downloaded ZIP digest
was independently matched to:
`55a38090bcbcf849f74fe7638ce73a865d93a3256bc69999efe533937bceb922`.

To reproduce: import `tests/fixtures/home-composition-day58.json` through Game and
Save on the pinned staging host. Its browser-local storage is separate from older
hosts; `/index.html?review=1` additionally isolates the QA key. Original recovery
copies, v4 saves, v3 migration and foreign-writer protection are preserved.

## Architecture and material family

The first pilot changed only the real home, cabin and sawmill at 7b10e3f. Its
actual day/dusk/night/close captures were inspected before district extension.
The window-divider overlay and ground-light edge were corrected in the extension.

Native cached artwork now coordinates slate courses, folded industrial metal,
weathered timber, deep window recesses, fascia/gutters, bolts, entrance hoods,
steps, footings and contact shadows. Homes retain domestic windows and small roof
fixtures; the sawmill has a practical monitor, roller opening and fixed saw bench;
the communal dining building has a larger clerestory and distinct facade.
Storage retains its existing cargo silhouettes with straps attached to those
actual crate shapes. The lander, canvas tents, crop beds and power equipment keep
recognisable functional forms. No decorative inventory amounts or resource piles
are fabricated. Crops still come from drawProduction, and turbines retain the
existing minute/weather/paused/reduced-motion phase logic.

No new raster asset set was generated. Approved E3-A vegetation, paths, shore
placement, collision and resource logic are retained. One narrow E3-A cache fix
removes the late image-load stamp which could invalidate terrain already baked
from an image whose complete/naturalWidth properties proved its pixels drawable.
The immutable atlas does not change at runtime, so that second bake was redundant.
All final capture and activity contexts report one environmental bake.

## Light belongs to actual people

| Scene | Actual indoor state | Local light strength |
| --- | --- | ---: |
| 18:00 dusk | Nell Ardent researches in lander #1; both homes empty | 0.4 at lander; 0 at empty homes |
| 20:39 | Mira Solis in home #7 and Ari Vale in cabin #55 begin life_home, action <3 | 0.58, settling |
| 20:48 | Both remain inside at real home activity, action >3 | 1, awake |
| 21:19 | Both have actual rest jobs, action >1 | 0.14, sleeping |
| Empty facilities | No qualifying indoor attendance | 0 |
| Grid shortfall | Occupied but supply < demand | 0, isolated logic test |

Door openness alone cannot invent illumination. Resting residents do not dim a
mixed household containing an awake person. Power follows the existing global-grid
policy; supply covers demand in the captured scenes (52 versus 51 at night).
The unpowered and mixed-activity cases are verified in isolated read-only logic
tests; no shortage or mixed household was fabricated in the gameplay captures.

Window cores preserve dividers and curtain edges. Cached wall wash falls from the
actual panes; cached ground spill is clipped against neighbouring structures.
Doorway light requires both actual powered habitation and a real door aperture.
Daylight, dusk and cold night use real clock data, with existing rain/wind weather
rendering preserved. Local light exposure fades with actual dawn/dusk; no global
orange night overlay, fake smoke/fire, invented sky, activity or resident silhouette.

## Verification and performance limits

Source CI: **13 passed, 1 skipped**. The skipped case is the duplicate Chromium
invocation of the WebKit-specific scheduling comparison. The passing cases cover
both engines' day/dusk/settling/awake/rest/close evidence, immutable paused state,
bounded caches, genuine 1× activity, responsive controls, and actual home entry,
management/exit/camera restoration at 390×844, 844×390 and 375×667.

Build/source consistency, content reachability, migration/recovery, housing,
lamplight, district, resident identity and gait checks pass. E3-B logic tests
exercise empty/open-door, power loss, mixed rest/awake, settling, sleeping, dusk,
read-only saved state, cache reuse and all 13 selected structures. These checks do
not claim all historical 78 E2 browser cases were rerun.

| Desktop CI proxy | Chromium | WebKit |
| --- | ---: | ---: |
| Ordinary live CPU draw p95 | 1 ms | 2 ms |
| Ordinary live CPU draw maximum | 2.8 ms | 7 ms |
| Ordinary callback gap p95 | 16.9 ms | 30 ms |
| Ordinary callback gap maximum | 21.1 ms | 122 ms |
| Initial environmental bake in activity context | 55.4 ms | 84 ms |
| Unpaced night draw p95 | 0.8 ms | 1 ms |
| Unpaced night draw maximum | 69.9 ms | 1 ms |

Actual activity runs collect 848 Chromium / 599 WebKit draw regions in roughly
14 seconds of genuine ordinary-speed play. Rendering did not rebake terrain;
there are no page errors, context losses or active save-protection locks. The
night material/light cache reports 259,032 pixels (~1 MiB nominal RGBA), plus one
128×128 ambient-tone cache; this is not total process/GPU memory. Static material
plates do not rebuild as household states change. Falloff masks are cached per
layout; ambient tone is cached in five-game-minute buckets. Existing per-frame
district membership and bounded occupancy scans remain.

Cold terrain preparation still costs tens of milliseconds and can hitch. Broader
startup draw phases in health diagnostics include original landscape/texture setup
and remain larger than the warm draw regions. Chromium's unpaced batch outlier
persists without terrain rebaking; no precise cause is proven.

WebKit's first district run recorded a 140ms callback gap, while its draw CPU stayed
below 6ms. The final activity run records 122ms outside a measured draw region
(maximum draw 7ms). A further fresh 14-second comparison using the retained E3-A
neighbourhood/landscape visual scripts and the normal E3-B build measured maximum
callback gaps of 31ms in BOTH versions. It did not reproduce the activity-run gap.
That comparison begins from the original save, not the later route-search state
of the activity recording; it is a bounded spot-check, not causal attribution.
Host scheduling, simulation, DOM/compositing/GPU timing and long-session behaviour
are not controlled by these CPU-region measurements. The full callback-gap concern
therefore remains OPEN; no general performance fix or physical-phone FPS claim.

## Creative review boundary and carried issues

The neighbourhood now has one coordinated material family and truthful local
lamplight. The artwork is still native small-scale overworld art; it does not claim
full immersive-interior detail or final reference fidelity. The dining roof's
repeatable courses, periphery/landscape blend, older dialogue/drawers, specialist
activity rigs and incomplete indoor navigation remain visible limitations.

SAVE-EXPORT-01, physical iPhone performance/usability, large-colony frame-time
spikes, landscape blending, specialist rigs, indoor activity transitions and wider
UI redesign remain OPEN in `../../TECHNICAL_ISSUES.md`. Desktop Chromium/WebKit,
eight residents and a short take do not establish physical iPhone or sustained
large-colony smoothness. E3-C is not started. Stop here for Kyle & Atlas's creative
review before UI integration, wider rollout or protected-branch/production work.
