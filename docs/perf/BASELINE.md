# FARWAKE performance baseline

**Game under test:** committed `index.html` at `37745f19670be8c82b560b5cf9af2672d27b3ac7` (`37745f1` on `farwake/integration`). This follow-up did not rebuild it.
**Measured:** 11 Nov 2026, headless Google Chrome 157.0.8103.50 via Playwright-core 1.65.0
**Harness:** `cd perf && npm ci && node run-headless.mjs` on `http://127.0.0.1:47321` with a fresh browser profile per measurement

> **These are not iPhone frame times.** The runner emulates an iPhone 14 screen (390×844 CSS px, devicePixelRatio 3, iPhone Safari user agent, touch) and asks Chromium for a **4× CPU throttle**. That is Blink/V8 with software raster. It is not iPhone Safari (WebKit/JavaScriptCore, Metal-backed canvas, ProMotion or Low Power Mode). GPU fill, compositing, and `backdrop-filter` are invisible here. Use the numbers to compare scenes, and later to compare an optimisation against this commit, on the same host. Do not quote them as phone milliseconds. A different machine will not match them within 15%.

Frame time is the JavaScript duration of the `requestAnimationFrame` callback (simulation, presentation, draw, and the 0.8 s UI refresh when it lands). It does not include GPU time. Percentiles use linear interpolation on the sorted sample. A long frame is a callback longer than 16.7 ms or 33.3 ms. **That count belongs to the recording window.** A longer window catches more spikes, so compare long frames per minute, not the raw count, across windows of different lengths.

Allocation is Chromium's sampling heap profiler (32,768-byte interval, including objects collected by minor and major GC). KB/frame is `sampleCount × interval / frames / 1024`. KB/s is the same estimate divided by the measured window, because KB/frame moves when the frame rate does. The sampler runs during the window and adds some overhead. `performance.memory` was available. The used-heap delta across a window is not the allocation rate: GC runs during the sample.

Playwright 1.65's built-in iPhone 14 viewport is 390×664 because it subtracts Safari toolbars. The runner pins **390×844**. The game's own header and nav then leave a **390×712** CSS canvas.

Day 2 and idle record 5 s after 1.5 s of warmup. Sim-on late colonies record **15 s**, so the gather spike below is not a single sample. The first-sight terrain bake stays in the warmup. Raw JSON is regenerated into `perf/results/` (git-ignored).

## Default scenes (3 repeats)

| Scene | Window | Median ms | p95 | p99 | Max | >16.7 ms | >33 ms | >33 / min | Alloc KB/frame | Heap used at end |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **Day 2 early game** — seed `FW-10402`, clock set to Day 2 07:20, 3 buildings, 5 colonists, zoom 1, balanced, simulation on | 5 s | 2.0 / 2.0 / 2.0 | 3.3 / 3.1 / 3.4 | 5.8 / 4.8 / 8.1 | 8.1 / 7.0 / 11.4 | 0 / 0 / 0 | 0 | 0 | 56 / 53 / 59 | 10.1 / 9.9 / 9.6 MB |
| **Late colony (synthetic)** — Day 80, 124 buildings, 25 colonists, zoom 0.6, balanced, simulation on | 15 s | 14.2 / 17.5 / 13.5 | 32.8 / 28.7 / 31.1 | 40.5 / 44.1 / 41.7 | 178 / 183 / 173 | 105 / 117 / 109 | 12 / 7 / 12 | 48 / 28 / 48 | 829 / 818 / 811 | 8.8 / 9.1 / 7.5 MB |
| **Idle paused** — the Day 2 layout, simulation paused with `#pause`, zoom 1 | 5 s | 1.7 / 1.9 / 2.4 | 2.5 / 3.3 / 4.2 | 3.2 / 5.1 / 6.2 | 5.6 / 7.4 / 9.2 | 0 / 0 / 0 | 0 | 0 | 34 / 30 / 33 | 10.4 / 10.1 / 10.2 MB |

Median of the three medians: Day 2 **2.0 ms**, late colony **14.2 ms**, idle **1.9 ms**.

Every balanced run used the same canvas: **390×712 CSS**, backing store **780×1424**, `devicePixelRatio` **3**. Balanced caps the backing store at 2×, so a DPR 3 screen is upscaled by the compositor.

The Day 2 clock is set on the fresh expedition. Day 1 is not simulated. Colonist needs and positions are pinned. The late colony is a stress layout, not a played save: 49 finished structures (2 dormitory, 2 warehouse, 5 shelter, 3 cabin, 7 garden, 2 greenhouse, 2 workshop, 2 smelter, 2 kitchen, 2 shed, 2 clinic, 6 solar, 4 wind, 8 lamppost) plus 36 paths and 36 roads, history counters set, and fog revealed within 18 tiles of the landing.

### The long frame is `advanceGatherTargets`, and the count follows the window

The frames of about **150–180 ms** are `tick` → `advanceGatherTargets` (`industry.inc.js:120-136`). That function re-arms every **5 seconds of simulation time** (`nextAutoGather = 5` at line 122) and then path-searches up to four resource kinds, 18 candidates each, while `buildingAt` is still a linear scan of `S.buildings`.

A **5 second** recording therefore tends to contain about one of those spikes. The earlier baseline's "exactly one frame over 33 ms" was that window length, not a property of the colony. The same scene recorded for **15 seconds** produced **7, 12 and 12** frames over 33 ms (about **28–48 per minute**). Median and p95 rose with them (13.5–17.5 ms and 28.7–32.8 ms), because several spikes now sit inside the percentile, not only in the max.

Frames over 16.7 ms are a different number. On the late colony the typical callback is already near that line (median 14–17 ms), so a hundred frames over 16.7 ms in 15 seconds is the steady cost, not a hundred gather scans. Use the over-33 ms column, per minute, for the spike.

On this small colony the simulation adds little frame JS (2.0 ms vs 1.9 ms paused) and lifts allocation from about 30 KB/frame to about 55. On the late colony the simulation dominates allocation (about 820 KB/frame).

## Audit scenes

Paused rows below are the 5 second windows from the same host and the same Chrome earlier on 11 Nov. The game file did not change. Sim-on late rows were re-recorded at 15 seconds with this follow-up. Absolute milliseconds are lower than the 11 Nov audit (Chrome 156 on a different box). Allocation rates and scene order still line up. Canvas geometry matches that audit: 780×1424 balanced, and 390×712 for the Performance preset.

| Scene | Window | Median / p95 / p99 / max (ms) | >16.7 / >33 | >33 / min | Alloc KB/frame | Notes |
|---|---:|---:|---:|---:|---:|---|
| Fresh z=0.6, paused | 5 s | 2.1 / 2.8 / 3.5 / 7.0 | 0 / 0 | 0 | 35 | Audit B was 3.4 / 5.2 and 36 KB/frame |
| Fresh z=1, paused | 5 s | 1.6 / 2.4 / 3.4 / 5.6 | 0 / 0 | 0 | 29 | Audit A render-only was 2.4 / 4.1 and 35 KB/frame |
| Fresh z=2.35, paused | 5 s | 1.2 / 2.0 / 3.2 / 6.6 | 0 / 0 | 0 | 24 | Audit C was 2.1 / 4.1 and 20 KB/frame |
| Fresh z=1, simulation | 5 s | 2.0 / 3.1 / 6.1 / 9.6 | 0 / 0 | 0 | 57 | Audit A sim-on was 3.0 / 7.5 and 59 KB/frame |
| Grown z=0.6 day, paused | 5 s | 6.6 / 10.5 / 16.7 / 24.5 | 2 / 0 | 0 | 168 | Audit E paused was 8.9 / 14.3 and 144 KB/frame |
| Grown z=0.6 night+rain, paused | 5 s | 6.8 / 10.0 / 14.7 / 16.8 | 1 / 0 | 0 | 175 | Audit F was 8.6 / 12.0 and 151 KB/frame |
| Grown night+rain, Performance preset, paused | 5 s | 0.1 / 6.7 / 8.0 / 9.1 | 0 / 0 | 0 | 69 | Backing **390×712**. Median is the skipped-draw frames; p95 is the frames that draw. Audit G was bimodal, backing 390×712 |
| Grown z=0.6, simulation | 15 s | 12.7 / 29.4 / 36.2 / 152 | 101 / 6 | 24 | 821 | Same layout as the late colony. Six frames over 33 ms, not one |
| Grown z=1, simulation | 15 s | 12.6 / 28.1 / 37.1 / 172 | 101 / 4 | 16 | 794 | Four frames over 33 ms in 15 s |

Zoom 0.6 is slower than zoom 1, which is slower than zoom 2.35, on the fresh map. That matches the audit: a wide view draws more fog.

A separate 3 s check with `&ops=1` (counter on, so those frame times are not in the tables) counted about **309 `fillRect`**, **54 `drawImage`**, **345 `fillStyle`**, and **1 linear gradient** per frame on the paused Day 2 view at zoom 1. The audit's fresh zoom-1 frame was 290 `fillRect` and 54 `drawImage`. The counter wraps every 2D context, including an occasional offscreen rebuild.

## Proposals (not implemented)

Nothing in this branch changes the renderer, the camera, input, or the UI. The ranked list from the render audit is the proposal set. Full file and line references are in `docs/perf/RENDER_AUDIT.md` §6.

1. **Cached fog layer.** One `drawImage` instead of a `fillRect` per fogged tile. Largest draw-call cut at zoom 0.6. Measure on `fresh-z06` and `day2`.
2. **Zero-allocation draw path.** Keep sorted building and colonist lists, and stop rebuilding plate keys every frame. Target the paused grown allocation (about 170 KB/frame).
3. **Bound simulation work per frame.** An occupancy grid for `buildingAt`, reused path buffers, and a cheaper `advanceGatherTargets` than a full candidate search every 5 sim-seconds. This is the late-colony spike (about 150–180 ms, several times a minute) and the ~820 KB/frame allocation. It can change pathing and task choice, so it needs a determinism check. Do not treat these spikes as the multi-second stalls from the audit: those came from a layout that ignored terrain and left targets unreachable. This layout did not reproduce them.
4. **Snap the camera translation to device pixels**, and colonist draw origins to whole world pixels.
5. **Snap zoom easing to the target, and fix the confirmed pinch bugs.** Gesture feel, owned with UI & Mobile.
6. **Cache night-light and sky gradients.** Compare `grown-night`, and on a phone, night rain.
7. **Bake terrain chunks off the first frame that sees them.** The warmup currently hides that hitch.
8. **Lighten the Performance preset** so presentation runs at the draw cadence, and consider a 1.5× backing store instead of 1×. `grown-performance` already shows the bimodal skip and the soft 1× backing store.
9. **Try `image-rendering: pixelated` on `#world`.** Kyle has to judge the 1.5× upscale on the phone.
10. **Pixel-perfect mode** (native DPR and integer device-scale zoom) only after the cheap cuts.
11. **Diff the HUD** instead of rewriting `innerHTML` every 0.8 s.
12. **`backdrop-filter` trial** with the inspector card open. iPhone-only. This harness cannot see it.

Also proposed, and **not done**, because it edits game files this branch does not own: a few lines in `src/game.html` (and a rebuilt `index.html`) so `?perf=1` can time `tick`, `advanceWorld`, and `draw` separately. The external harness can only time the whole callback.

No real Day 50 / Day 100 save was available. `perf/fixtures/README.md` is where one goes. The `fixture` scene loads it through the game's own `load()` validator.

## What this baseline cannot answer

- iPhone Safari frame time, GPU cost, `backdrop-filter`, thermal throttling, battery, JavaScriptCore GC, or Low Power Mode.
- Whether a real long-running colony hits the multi-second simulation stalls from the audit. This synthetic colony did not. Its repeated spike is `advanceGatherTargets`, and how many of those spikes you count depends on how long you record.
- WebKit's canvas-memory ceiling on iPhone 14.
