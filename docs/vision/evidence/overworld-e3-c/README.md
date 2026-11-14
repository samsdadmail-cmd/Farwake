# E3-C — integrated neighbourhood: creative review

Kyle & Atlas conditionally approved E3-B's architecture and simulation-driven
lighting foundation on 14 November 2026, with the overall scene-quality gap and
performance limits retained. E3-C is implemented and technically verified here;
**conditionally approved as the unified neighbourhood foundation by Kyle & Atlas on 14 November 2026**. Definitive overworld identity remains unapproved. The same 13-structure pilot remains bounded.
No production merge, other-district art rollout or new art collection.

Runtime/source: `56063cae2cc23dbda54ab346cd62c86022a175d1`.
The later diagnostic commit `68687d1892457b08dbc7660ecdcb283076333eb3`
adds only retained baseline fixtures, a test and its workflow; runtime is identical.

[Pinned playable preview](https://farwake-founders-k208fym76-atlas-8c31.vercel.app/index.html?review=1)
· [Draft PR #25](https://github.com/samsdadmail-cmd/Farwake/pull/25)
· [18 passing integrated browser checks](https://github.com/samsdadmail-cmd/Farwake/actions/runs/43594488874)
· [Passing focused WebKit comparison](https://github.com/samsdadmail-cmd/Farwake/actions/runs/43595099131).

## Actual gameplay evidence

- Original 390×844 [day](day-390.png), [dusk](dusk-390.png), [occupied night](night-390.png).
- [Day/dusk/night sheet](day-dusk-night.png), each original retained at 1:1.
- Original [day material close view](day-close-390.png), [night close view](night-close-390.png).
- [Refined E3-A versus E3-C day](e3-a-vs-e3-c-day.png); [matching 20:39 comparison](e3-a-vs-e3-c-night.png).
- Actual [empty homes](empty-homes-video-frame-390.png), [settling](settling-390.png), [resting](resting-390.png), [unpowered](unpowered-390.png); [night-state sheet](truthful-night-states.png).
- [Uninterrupted 1× gameplay recording](neighbourhood-alive.mp4), 27.96 seconds at native 390×844. Real walking, People/resources interaction, changing household lights and witnessed resident speech.
- Settled native recording frames: [People drawer](people-settled-video-frame-390.png), [resource drawer](resources-settled-video-frame-390.png); [building context with a clear status line](context-390.png). Original People/resources PNGs are retained but caught the opening fade; use the settled frames to judge readability.
- Matching WebKit stills; 320×568, 375×667 and 844×390 control/context captures; complete state, take and timing JSON are retained alongside these.

Every view comes from running the game after importing the original unmodified
`tests/fixtures/home-composition-day58.json` through **Game and Save**. Eight
residents, 32 real structures, same 13-structure district. Overview camera
x=825.6/y=1008/zoom=1; closer camera explicitly x=780/y=1040/zoom=1.6. Actual
weather is clear; no weather, attendance, resources, paths or activities are granted.
Stills use the real Pause control. Normal simulation ticks advance time between
stills; the video uses the ordinary unchanged 1× game loop throughout its take.

Day is 11:40; dusk 18:00; settling 20:39; awake 20:48; resting 21:19 on Day 58.
Day comparison matches refined E3-A's camera/time. Night comparison uses E3-C's
**settling** capture to match E3-A's 20:39, rather than comparing different hours.
Comparison/sheet files add only labels and margins, with no rescaling or image edits.

The empty-home PNG is explicitly a native frame from the original continuous
WebM at displayed time 20:36, not a separate Playwright screenshot. Both the
recorded start and first 0.5-second sample show homes #7 and #55 empty; subsequent
samples record arrivals and lights. Video conversion trims only leading setup
and trailing material. No internal cuts, resizing, retiming or invented animation.
First/middle/end and dialogue frames were inspected after encoding. Exact trim,
source hash, screenshot hashes and video metadata are in [capture.json](capture.json).

The original integrated-test WebMs and all captures remain in CI artifact
**14113429279**. Its ZIP was independently matched to
`70bf3194ac8f18b34bf53edbbb81eb88cab1915da40c27d0523d4d59d99de197`.
The separate comparison artifact is **14113818851**, matched to
`acdac151d8debe9cc487efb94ae9ec98c16b8271bfc3403c47cb6bbb0b92229e`.

To reproduce, import the original historical fixture through Game and Save on
the pinned host. Host-local saves are separate from earlier previews; `review=1`
also isolates the QA save key. Existing recovery copies and normal saves remain
untouched. A new browser on this preview starts with a new expedition until import.

## What changed in the experience

The idle HUD is now one scene-edge instrument family: a compact objective above
the world, circular camera/time controls, slim resource readouts and a five-action
navigation rail that includes Save. Save is no longer a detached label over the
landscape. Actual witnessed resident dialogue moves from opaque overhead boxes
to a named edge caption with a small locator over its real speaker. Existing
speech generation, journals, saved memories, activity and preferences are unchanged.

Context drawers use the same field-journal typography, separators, button language
and accessible close control. The expedition drawer no longer has a tiny unlabelled
cross or internal implementation text. Save advertises its expanded state.

Status notices sit at the scene edge and clear the actual height of an open
inspector. A ResizeObserver updates the reserved height only on layout changes;
there are no per-frame layout measurements. Caption text changes only when the
actual speaker/line changes. The bounded presentation fix removes visible overlap
without touching terrain, buildings, pathfinding, residents or lighting semantics.

The first browser run exposed the old expedition close control and a narrow-screen
target below 44 px. Those were corrected. A captured inspector/status collision
was then corrected and verified. Final main-HUD targets are at least 44 CSS pixels
at all four tested viewport sizes, with centre hit testing, keyboard activation,
drawer open/close and restored camera checks. Home composition retains its approved
controls, artwork and entry/exit behaviour.

## Actual nighttime state evidence

| Time / state | Real attendance and grid | Existing light response |
| --- | --- | --- |
| 20:36, empty | Homes #7 and #55 have no inside residents; supply 52 / demand 51 | No home light |
| 20:39, settling | Mira Solis inside home #7, Ari Vale inside cabin #55; actual life_home actions 0.15 / 0 | Strength 0.58 |
| 20:48, awake | Same people/addresses; actual life_home actions 3.175 / 3.025; grid 52 / 51 | Strength 1 |
| 21:19, resting | Both actually task=rest, action >1; grid 52 / 51 | Strength 0.14 |
| 20:48, power test | Same inside people, unchanged actions/time; grid 50 / 51 | Both unpowered, strength 0 |
| Orders withdrawn | Grid restored to 52 / 51 before continuing | Awake strength 1 restored |

Power loss is a **deliberate reversible player-control test**, not a naturally
occurring outage: while paused, confirm Dismantle on actual generators #14, #86
and #144 until the existing grid calculation reports insufficient supply. The
game excludes generators with maintenance orders. Withdraw every order before
continuing; nothing is dismantled, no resources or occupants are injected, and
the original grid is restored. These controls can interrupt existing research
assignments by design; this isolated test is not a claim that player orders leave
all simulation state unchanged. The uninterrupted take is a separate fresh import.

[Chromium states](chromium-states.json), [WebKit states](webkit-states.json) and
both take JSON files retain actual tasks, action timers, attendance, exposure,
power and light modes. The recording also shows arrivals, awake light, later
resting light, and a later genuine occupied dining building. Resting light is
intentionally subdued at the overview scale; creative legibility remains reviewable.

## Tests and performance — qualified

Final integrated CI: **18/18 browser checks pass**: both engines' real saved-colony
scenes, paused-state immutability, bounded cache reuse, genuine movement and HUD
interaction; main controls at 390×844, 320×568, 375×667 and 844×390; real home
entry/manage/exit and exact camera restoration at three sizes. Build generation,
content, migration/recovery/fail-closed saves, housing, lamplight, neighbourhood,
Aya identity/gait, architecture and caption immutability/write-bounding checks pass.
The focused WebKit original/new drawer comparison also passes as a diagnostic;
its pass does **not** mean its timing is smooth.

The measured CPU region runs from neighbourhood preparation through final moments
rendering. It excludes simulation/UI before or after it and GPU completion.
Callback gaps include simulation, browser scheduling, painting, recording and
interaction overhead. Neither is a full-frame benchmark or physical-phone FPS.

| Final 30-second 1× take | Chromium | WebKit |
| --- | ---: | ---: |
| CPU draw region p95 / max | 0.9 / 1.8 ms | 2 / 8 ms |
| Steady final portion p95 / max | 0.8 / 1.3 ms | 2 / 3 ms |
| Callback-gap p95 / max, including UI | 16.8 / 25 ms | 27 / 300 ms |
| Steady callback-gap p95 / max | 16.8 / 25 ms | 27 / 67 ms |
| Initial environmental bake | 57.4 ms | 82 ms |
| Environmental bake count through take | 1 | 1 |

No screenshots occur inside the final timed take. Its final portion begins after
15 seconds, after the real drawers close. The 300 ms WebKit gap occurs near the
resources drawer closing; a later 67 ms gap occurs with no drawer. This is an
observed responsiveness limitation, not proof of a particular cause.

A focused comparison then ran the **exact preserved E3-B HTML/CSS/Moments** against
E3-C in fresh WebKit contexts, same historical save/evening/camera and matching
People/resources actions. Both record video, neither captures screenshots or
resident snapshots inside measurement. Results:

| Focused WebKit comparison | E3-B | E3-C |
| --- | ---: | ---: |
| CPU draw region p95 / max | 2 / 163 ms | 2 / 7 ms |
| Callback-gap p95 / max | 31 / 352 ms | 31 / 368 ms |
| Steady callback-gap p95 / max | 30 / 71 ms | 31 / 43 ms |
| Initial environmental bake / count | 103 ms / 1 | 102 ms / 1 |

The same class of large gap occurs with the original interface. This single pair
finds **no clear new HUD regression**; it does not establish the precise cause or
prove equality. Host variation, existing random dialogue, startup/cache warming,
video encoding and GPU completion are uncontrolled. E3-B's isolated CPU outlier
also remains unexplained. Full raw results: [WebKit drawer comparison](webkit-drawer-comparison.json).

Cold baking remains synchronous: WebKit reached 102 ms in the focused E3-C run,
near the previous approximately 112 ms concern. Startup hitches remain possible.
The still-sequence's 90 unpaced cached draws peaked at Chromium 24.2 ms / WebKit
1 ms, without rebaking. The historical 56.8 ms batch outlier is not claimed fixed.
Material/light cache in the inspected night scene remains 259,032 pixels plus
one 128×128 tone plate; environment remains one 704×704 surface with 7,921 lattice
samples. District membership/signature work still occurs per draw as previously
recorded; E3-C does not claim a renderer rewrite or eliminate that cost.

## Creative verdict and retained limits

The scene is less obstructed and now reads as one playable presentation: the
interface sits around the settlement, real voices stay attached to residents,
and household light visibly responds to actual life. This is enough to present
as a **candidate reusable foundation**, not definitive overworld-art acceptance.

Overall composition/depth still trails the approved references. Repeated roof
courses and simple silhouettes remain; broad ground fields and peripheral
landscape blending remain visible. The close view reveals material progress but
does not resolve those scene-level art limitations. No new architecture or flora
catalogue is proposed by this checkpoint.

All outstanding work remains recorded, including the authoritative
[technical issues](../../TECHNICAL_ISSUES.md): SAVE-EXPORT-01 actual JSON delivery;
physical iPhone performance/usability; large-colony spikes and sustained population
profiling; landscape blending; specialist character rigs; continuous indoor
activity/navigation transitions; and the wider interface/interaction redesign
beyond this bounded overworld presentation. **Physical iPhone performance is
unverified.** Neither export-to-Files delivery nor sustained 40-resident behaviour
is proved by these tests. Substantial WebKit callback stalls remain open.

E3-C's conditional creative review is now recorded. Stop before another major visual implementation pending Kyle & Atlas's next decision. No protected-branch merge, production
promotion, next milestone or world-wide rollout is authorised by test success.

## Recovered-session final verification — 14 November 2026

Recovered the original worktree and all uncommitted E3-C evidence at the recorded
68687d1 head. No runtime changes were needed. Independently verified all 43
original screenshot hashes and both original CI archive hashes. Inspected actual
day/dusk/night, close, inspector, drawer and native video-frame evidence.
The initial drawer PNGs caught the short opening fade; supplemental untouched
frames from the existing uninterrupted recording show the settled presentation.

[Final verification run](https://github.com/samsdadmail-cmd/Farwake/actions/runs/43598284396)
on `2974def4fbf2ebf3ea97172e25688e24fa3f903e` passed **36/36 save and smoke checks**
and **18/18 integrated browser checks**, across Chromium and WebKit. Build and
save protection checks passed. Local build, survival/content, migration, fixture,
housing, lighting, neighbourhood, resident, gait, architecture and caption checks
also passed. This adds an explicit save/smoke gate to subsequent E3-C CI runs.

The pinned preview was opened and its actual HUD controls inspected manually.
A local browser import attempt stalled at the upload flow and that browser session
reset; it supplies no additional Day-58 or export-delivery evidence. Automated
real-save import and interaction evidence remains the successful CI evidence above.
SAVE-EXPORT-01 and physical iPhone Files delivery remain OPEN. No new export
success is claimed. Existing preview-local foreign-writer protection was preserved.

Final runtime remains byte-for-byte the verified `56063ca` runtime. The final
repository handover commit adds evidence and documentation only. All earlier
checkpoints and branches remain intact; PR #25 remains draft against
`living-colony-experience-overhaul`. No main/PR #23 merge or production promotion.
