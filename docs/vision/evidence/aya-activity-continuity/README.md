# Aya activity identity — focused correction

Runtime: `a0840f3ae7abeb8f9b0fc457220b6edca70aa0a8` on PR #25 /
`home-composition-checkpoint`. E3's conditionally approved recovery branch and all
earlier evidence remain intact. No production promotion or other-resident rollout.

[Playable preview](https://farwake-founders-q8jfjl60l-atlas-8c31.vercel.app/index.html?review=1)
· [Passing verification](https://github.com/samsdadmail-cmd/Farwake/actions/runs/43652838492)

## Cause and bounded correction

The Aya renderer explicitly returned false when stationary work, leisure or needs
took over. `FarwakePeople.draw` then selected the old procedural body. It now
retains her approved authored body in those states, layers actual progress-driven
tools and carried cargo, and reuses her existing authored rest pose at world scale.
Existing distance-driven walking, direction, pause/reduced-motion behaviour,
interior poses, simulation, work, sounds and save schema are retained. An atlas
loading delay does not temporarily impersonate Aya using the old body.

No new raster artwork was generated. Stationary specialist and social poses remain
limited: work uses an authored standing body with tool motion; this is not a new
full-body mining, kneeling, seated-conversation or activity animation collection.
That limitation is visible and retained for creative review. Other residents keep
their existing renderer. The broader recommendations are assessment only.

## Actual gameplay, separate from isolated render tests

[Uninterrupted 22.4-second recording](aya-mining-to-hauling.mp4)
· [Original uncut WebM](original-chromium.webm)
· [Mining, 390×844](chromium-aya-mining-390.png)
· [Carrying real ore, 390×844](chromium-aya-after-mining-390.png)

The mining take uses a **separate actual starting expedition**, default seed
FW-10402, Day 1. The historical Day-58 import remains covered by the isolated
renderer test and retained real walking/home browser suites; this fresh scene is
not labelled Day-58 gameplay. The test chooses Salvaging through Aya's profile,
selects an existing revealed mineral outcrop through the game's `selectTap` input
handler, then clicks its real mining designation. Only ordinary simulation is
advanced to arrival; no tasks, routes, resources, needs, occupancy or actors are
granted. The camera follows Aya for evidence.

The full uncut video contains setup and a 20.232-second uninterrupted, unchanged
1× take. Aya genuinely mines dense outcrop `frontier-ore-18-28`, produces its real
nine ore and carries it towards storage. Both engines record harvest → haul_dropoff
and ore-tool → cargo transitions while keeping her authored identity. The before/
after screenshots use actual Pause. WebKit stills and raw sampled state are retained
alongside Chromium evidence. The original source and MP4 keep native 390×844
geometry and duration; there are no internal cuts, rescaling or invented animation.

The [isolated activity matrix](chromium-isolated-activity-matrix.png) is explicitly
**not gameplay**: dummy render objects cover 15 work/need/leisure/cargo states,
including mining, research, crafting, food, rest and shared activity. It catches
the exact previous fall-through while asserting immutable state, reduced-motion
pixels, non-Aya exclusion and bounded sprite caching. Corresponding state JSON and
WebKit matrix are retained. Source/video/screenshot hashes are in [capture.json](capture.json).

## Verification and retained acceptance limits

**40/40** targeted activity/save/smoke browser checks and **78/78** broader walk,
home, resident, camera and neighbourhood checks passed across Chromium/WebKit.
Build, migration/recovery/fail-closed saves, housing, lighting, Aya gait/identity,
architecture and captions also passed. The first recording attempts exposed a
hidden legacy crew-list selector and unavailable historical ore targeting; test
setup was corrected without injecting simulation state. The original Day-58 save
and player storage were not overwritten. All checks use isolated QA contexts.

The pinned host's changed JS files were independently matched byte-for-byte to
the checked runtime. No new physical-device or frame-time pass is claimed. Kyle's
report of stable ordinary iPhone play is recorded as partial device evidence;
SAVE-EXPORT-01, sustained/higher-speed/larger-colony behaviour and intermittent
WebKit/cold-bake issues remain open. Await Kyle & Atlas's review before further
character, household, world or gameplay expansion.
