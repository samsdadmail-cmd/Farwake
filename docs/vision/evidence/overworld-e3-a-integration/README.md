# E3-A — environmental integration refinement

Art direction approved for continued development by Kyle & Atlas; environmental
integration submitted for creative review. E3-B has not started. No world-wide
rollout, new asset categories, main merge or production promotion.

Runtime/source: `4d2a494f7a6383f8687ab52692e9857d8be61001`.
Branch: `home-composition-checkpoint`; [draft PR #25](https://github.com/samsdadmail-cmd/Farwake/pull/25).
[Pinned playable preview](https://farwake-founders-9hwki9quz-atlas-8c31.vercel.app/) · [Passing source CI](https://github.com/samsdadmail-cmd/Farwake/actions/runs/43514076150).

## Actual gameplay

- [Day 390×844](day-390.png), [night 390×844](night-390.png), [in-game 1.6× close view 390×844](close-390.png).
- [E2 versus refined E3-A day](e2-vs-refined-day.png), [night](e2-vs-refined-night.png).
- [First E3-A versus this refinement](first-e3-a-vs-refined-day.png).
- Corresponding WebKit screenshots, exact state, initial and repeated profiles are retained here.

These are captures of running index.html after actual UI import of the unmodified
historical Day-58 colony (`tests/fixtures/home-composition-day58.json`), eight real
residents and 32 structures, with the same 13-structure pilot. Chromium overview:
Day 58 at 11:40 / 20:39. WebKit starts at 11:41 / 20:39 because startup timing varies.
Overview camera x=825.6, y=1008, zoom=1 matches the retained E2 and first E3-A evidence.
Close view is a separate genuine game camera at x=820, y=1100, zoom=1.6; no image
upscaling or fabricated test scene. Comparisons add labels/margins only, retaining
all source pixels at 1:1. Stills are paused; simulation was advanced normally to
find actual night attendance, not granted occupants, tasks, production or resources.
Homes #7 and #55 are genuinely awake; grid supply 52 versus demand 51.

Original CI archive 14079972022 SHA256 was independently matched:
`7435a7c810bf173e5478075c366395e54637bf4661ce7936d27e3367ee1c72a6`. Original videos (including setup), responsive checks and movement
samples remain in that archive. No polished/truncated video is claimed here.

To play the same colony, use Game and Save → Import with the retained Day-58 fixture.
The new staging hostname has its own browser-local storage. Review mode
`/index.html?review=1` isolates the QA save from ordinary game storage.

## What changed

- Reuse the same 16 authored sprites; no new generated art. One 128×128 processed
  atlas supplies coordinated 32px cells with quieter highlights and restrained
  palette, size, mirroring and small orientation variation.
- Replace the jittered regular scatter with uneven habitat groups, sparse singles,
  differing cluster radii and negative space. Real moisture changes density and
  wet-meadow selection; shore seeds follow actual adjacent land/water cells.
- Add irregular soil/lichen contact beds and quiet root shadows. Root clearance
  protects real structures, doors, resource features and travel corridors. Sprites
  remain below functional buildings and residents in the unchanged world renderer.
- Travelled ground is a union soil field with broken edges, not bright translucent
  network strokes. Small rounded turns remain inside the original open tiles.
  Pathfinding, collision, built paths, costs, resources and movement bonuses do not change.
- Share slow terrain fields on an 8px lattice while retaining a crisp exact water
  decision at 2px ground resolution. An internally rejected first pass interpolated
  across the shore; that blur was corrected before this delivery.
- Palette preparation uses one atlas readback instead of sixteen. The final first-use
  phase still measured 39ms in WebKit despite fewer readbacks, so batching did not
  establish a cold-load speedup or prove that readbacks caused that phase. Image
  decoding/first source use remains part of that measured phase; no image processing
  occurs per frame, and offscreen pilot motion is culled.

## Tests and performance investigation

Eight Chromium/WebKit browser checks passed: read-only environment composition and
close view; repeated baseline/refined cold and normal-loop profile; paired real
night/day with touch/responsive geometry; ordinary 1× neighbourhood movement.
Build/source, content, migration/recovery, housing, lamplight, neighbourhood,
home-resident and Aya-gait checks also passed. Full state, terrain and resource
features remain unchanged by the paused rendering samples. The earlier 78-check
E2 suite was not represented as rerun by this focused source gate.

| Desktop CI CPU proxy | Chromium | WebKit |
| --- | ---: | ---: |
| First overview bake | 66.8 ms | 112 ms |
| First overview sprite preparation | 16.7 ms | 39 ms |
| Matched baseline module-cold median (3 contexts) | 48.1 ms | 67 ms |
| Refined module-cold median (3 contexts) | 51.3 ms | 64 ms |
| Largest unpaced draw (both versions) | 58.8 ms | 2 ms |
| Normal live draw region p95 | 0.9 ms | 2 ms |
| Normal live draw region maximum | 1.3 ms | 2 ms |
| Normal live callback-gap p95 | 16.9 ms | 32 ms |
| Normal live callback-gap maximum | 17.8 ms | 56 ms |
| Existing health probe startup draw-phase maximum | 166.5 ms | 153 ms |

Each normal-loop sample completes 120 actual visible game draws with the normal
simulation, presentation and UI scheduling, no manual replacement frame stream.
Save protection remains false (not bypassed), no context loss/error is reported,
and the environmental cache stays at one bake. Callback gaps include simulation,
UI, browser and compositor scheduling; CPU draw time is not full-frame/GPU time.
The existing health probe also retains startup costs from before the paced sample;
those must not be misrepresented as steady-state frame times.

The old 121ms WebKit bake is an initialization/invalidation cost, not a measured
per-frame terrain cost. The final overview still records a 112ms WebKit cold bake;
this is not presented as solved, and a different run measured 77ms on the same
functional scene before batching. Host/startup variance is substantial. It remains synchronous; a cold-load hitch is still possible.
Matched module-cold samples use three independent browser/storage contexts per
version. Assets may be browser-cache-warm; these are not uncached whole-process
startup benchmarks. Broad host variance and millisecond WebKit timer resolution
prevent claims of a general speedup from one comparison.

Chromium's ~56.8ms outlier reproduces in deliberately unpaced 60-draw batches in
both versions, with one cache bake; it is not explained by repeated terrain baking.
No >16ms draw region occurs in either 120-frame normal-loop sample. This is
consistent with batch submission/scheduling effects but does not establish the
precise cause, or prove that sustained play cannot spike. Full simulation callback
gaps and startup are reported separately above rather than hidden by draw-only data.

Earlier synthetic profiling attempts had a Chromium target crash and a WebKit
sampling timeout. The final harness uses separate browser/storage contexts so
previous imports, reloads and foreign writers cannot contaminate a later sample,
and bounds live-loop collection with health diagnostics. The final gate passes;
no claim is made that a particular renderer-crash root cause has been proven.

District membership still scans/signatures buildings per draw. Its earlier measured
small-colony cost was small; no speculative cache rewrite was added. Terrain bake
cache holds 495,616 pixels; the processed atlas holds 16,384 pixels. There are 69
placed sprites in 44 accepted habitat groups in this save, not a new gameplay system.

## Creative boundary and remaining limits

The environment is quieter and more subordinate to functional structures. Repeated
species can still be recognised; some routes retain their grid ancestry. The ground
palette remains deliberately restrained rather than promising a full reference-level
world. The peripheral old terrain/pilot blend, simpler neighbouring architecture,
character activity rigs and older contextual HUD styling remain visible.

Remaining building-detail mismatch is carried into E3-B architectural cohesion,
atmosphere and truthful household lighting. No E3-B implementation is included.
Creative integration approval is not inferred from passing tests.

SAVE-EXPORT-01, physical iPhone performance, large-colony frame-time spikes,
landscape blending, specialist character rigs, continuous indoor transitions and
wider interface redesign all remain OPEN. See `../../TECHNICAL_ISSUES.md`.
This desktop eight-resident evidence does not establish physical iPhone smoothness,
large-colony performance or sustained-session frame stability.
