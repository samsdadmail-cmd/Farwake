# E3 integration readiness — 14 November 2026

## Decision and scope

Kyle & Atlas conditionally approve E3-C as the unified neighbourhood foundation.
Definitive overworld visual identity is not approved. The complete review checkpoint
is preserved at `f54f8b19061fc9a0e83e77e7627ee14a046f2869` on draft PR #25
and the dedicated `checkpoint/e3-c-conditionally-approved` branch.
No runtime/artwork changes, merge, production promotion or wider art rollout are
part of this assessment. The next major visual implementation awaits a separate
creative decision based on the complete living-colony experience.

## Assessment

The retained foundation is functionally suitable for the next bounded living-colony
planning decision. Performance, physical-device usability and save-file delivery
acceptance remain incomplete; there is no production or visual-expansion approval.

## Current preview and gameplay

Pinned preview: https://farwake-founders-k208fym76-atlas-8c31.vercel.app/index.html?review=1

Manual browser inspection opened the retained saved colony and reached Command,
production targets/priorities and Research, then returned to the world. This was
desktop Chrome, not a phone playtest. Independent hosted tests compare the actual
preview HTML, scripts and styles against the retained runtime, import the original
Day-58 save in fresh QA contexts, exercise touch handlers, navigation, reversible
home maintenance, entry/exit and actual saved reload. The initial exact-byte HTML check detected Vercel's appended feedback toolbar,
not a game-source change; the corrected check strips only that identified trailing
script and records its presence. Hosted results are recorded below.

The earlier E3-C source gate passed 36 save/smoke checks and 18 integrated browser
checks. Current assessment additionally exercises the retained economy, production,
command, research, industry, integration and field-interface browser suites.
Automated passes remain functional evidence, not real-device acceptance.

## WebKit gap investigation

The original 300 ms value was a gap between neighbourhood preparations, not a
measured 300 ms synchronous draw. Its nearby resource-drawer close suggests a
relationship, not a cause. The preserved pair produced 352 ms with E3-B and 368 ms
with E3-C; it did not establish an E3-C-only regression or settle the cause.

The new test repeats four conditions three times each in fresh desktop WebKit
contexts: live drawers without video; live drawers with video; live idle without
video; and paused drawers without video. Same original save, same evening and
camera, real 1× simulation or Pause, actual touch controls, no screenshots/resident
sampling inside the measured interval. Test-only transparent requestAnimationFrame
wrapping measures the entire synchronous game frame callback and the interval
outside it. Draw markers and storage-write timings provide narrower supporting
measurements. No game-loop implementation is changed.

A long callback body establishes a synchronous main-thread runtime stall during
that callback. A long outside interval establishes time outside that callback;
it may contain browser layout/paint, other tasks, encoding, GC, GPU waits or host
scheduling. It cannot honestly be called an isolated OS scheduling delay solely
from this measurement. Sequential condition order and host variation are limitations.

## Measured results

[Repeated-attribution and management run](https://github.com/samsdadmail-cmd/Farwake/actions/runs/43601896472)
on `0b9592e11708bc70ef25e211eed945b9da593976`:

| Condition, three fresh contexts each | Maximum callback gap per repeat | Maximum synchronous callback body per repeat |
| --- | --- | --- |
| Live drawers, no video | 616 / 97 / 69 ms | 197 / 6 / 6 ms |
| Live drawers, with video | 74 / 71 / 74 ms | 7 / 12 / 7 ms |
| Live idle, no video | 36 / 36 / 36 ms | 5 / 9 / 7 ms |
| Paused drawers, no video | 70 / 71 / 68 ms | 6 / 6 / 6 ms |

All four diagnostic tests passed their functional collection assertions. Eleven
of twelve contexts had no callback gap over 100 ms. The first no-video/live-drawer
context had three gaps over 250 ms; its largest 616 ms interval contained **613 ms
outside** the preceding synchronous game callback. Separately, that context had
one **197 ms synchronous draw-region/callback outlier** near 0.94 seconds. That
is a genuine observed main-thread runtime stall; it is not erased by the later
warm repeats. No environmental rebake occurred during any measured take. There
were no page errors, save-protection activations or visibility transitions.

The original 300 ms symptom is **intermittent, not consistently reproduced** by
repeating the same UI sequence. Recording is not required for a large gap, and
these results do not identify recording as its cause. Idle and paused conditions
had no >100 ms stalls in these short samples. That narrows the evidence but does
not prove live simulation, UI, GC, JIT, layout, GPU or host scheduling causality.
The 613 ms outside interval must not be presented as a 613 ms game-tick or draw
cost, nor dismissed as a harmless isolated OS delay. Both WEBKIT-GAP-01 and the
one-off synchronous draw outlier remain open; sustained/physical testing is needed.

[Exact per-repeat timing/event summaries](evidence/overworld-e3-c/readiness-callback-summary.json)
are committed directly from the exact CI log. Complete per-frame JSON/video from
this first run were not retained: later regression invocations cleaned the shared
output directory before artifact upload. This limitation is recorded rather than
claiming a nonexistent artifact. Future readiness output uses a separate directory.
Sequential order and probe/host effects remain uncontrolled. The local diagnostic
server does not include Vercel's appended toolbar; hosted performance can differ.

The same run passed **36/36 save/smoke checks** and **7/7 existing browser suites**:
production, economy, command, research, integration, frontier industry and field UI.
The initial run is correctly marked failed overall because its two hosted-source
checks rejected the toolbar addition before reaching gameplay; no hosted-playability
pass is inferred from that failed attempt.

[Broader retained home/colony regression](https://github.com/samsdadmail-cmd/Farwake/actions/runs/43601896448)
passed **78/78 browser checks** on the same source, covering homes, camera, living
routines, resident/gait and neighbourhood interactions. These are software-browser
functional checks, not physical iPhone acceptance.

## Final hosted check

[Corrected hosted verification](https://github.com/samsdadmail-cmd/Farwake/actions/runs/43602756013)
on `20b173a31d384c3cfd00966c1b97b3575d9c4ee1` passed **2/2**, Chromium and WebKit.
The pinned host's HTML/scripts/styles match the retained game source after removing
only the explicitly identified appended Vercel feedback script; its presence is
recorded, not silently treated as game source. Both engines imported the real
Day-58 colony (eight people / 32 structures), opened all primary drawers through
touch handlers, selected the actual home on the canvas, issued and withdrew a
real maintenance order while paused, entered/exited home, saved and reloaded the
same colony IDs without page errors or save protection. Fresh isolated QA contexts
leave existing player saves and recovery copies untouched. Maintenance can alter
assignments by design; this does not claim all simulation fields remain identical.

Two test-harness assumptions were corrected before this pass: maintenance actions
close the management sheet and require reopening it; API availability must be
checked safely during import reload. No game-code change was required. Only the
hosted test was rerun after these corrections; the twelve diagnostic takes above
were not repeated or reinterpreted as performance passes.

## Outstanding acceptance gates

- **WEBKIT-GAP-01:** retain observed callback stalls until sufficiently explained
  and judged on actual hardware; a successful diagnostic run is not a smoothness pass.
- **TERRAIN-BAKE-01:** synchronous cold terrain bake, previously reaching 102 ms
  WebKit. Warm callback measurements do not resolve startup hitches.
- **IPHONE-PLAY-01:** actual iPhone Safari cold load and sustained normal play,
  with an existing save; assess responsiveness, readable field text/dense drawers,
  safe areas, zoom/pan, home entry/exit and management. No physical-device result
  was obtained in this session. Kyle's device playtest remains required.
- **COLONY-PERF-01:** sustained real 5/20/40-resident sessions and large-colony
  frame-time spikes. The eight-resident evidence does not close this requirement.
- **SAVE-EXPORT-01:** actual downloaded JSON delivery, validation and transfer-control
  re-import; iPhone Files delivery is a separate outstanding check. Not retested or
  closed by ordinary save/reload, import success or the backup notification.

## Retained creative/readability limitations

Roof courses and simple silhouettes repeat; homes lack enough architectural
individuality. Environmental hierarchy, depth and atmosphere still trail the
approved concepts. Broad ground fields and peripheral terrain blending remain
visible. Small/muted monospace readouts, dense specialist screens and map showing
through panels need real-phone readability judgment. Target hit boxes passing
at 44 CSS pixels does not establish readable text or comfortable device use.

The unified field instruments, cohesive materials and truthful household light
are accepted foundations. No isolated-asset polishing programme is authorised.
Readiness permits informed review of the next milestone, not production release.
