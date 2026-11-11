# FARWAKE: iPhone 14 render, camera and input audit (issue #7)

> **Repo copy.** This is the audit text as written. Paths under `/workspace/` and the scratch scripts named in §5 stayed on that audit machine and are not in this repository. Acceptance criterion 7.3 item 6 means re-baseline on each host: ±15% only applies when the same box is measured again. A different machine is not expected to match.

**Author:** FARWAKE Render & Performance · **Date:** Wed 11 Nov 2026 (Europe/London)
**Baseline:** `farwake/integration` @ `37745f19670be8c82b560b5cf9af2672d27b3ac7` (short `37745f1`). I checked this in a fresh read-only clone at `/workspace/audit-render`. HEAD matched, the working tree was clean, and there were no local edits.
**Scope:** audit only. I made no repo changes, pushed nothing, opened no PRs, posted nothing to GitHub and launched no cloud agent. All scripts and artefacts are in `/workspace/render-audit-scratch/`, outside the clone.
**Build check:** I re-ran the `build.py` assembly in memory and diffed it against the committed `index.html`. They match byte for byte, so the generated file is in sync at the baseline.

> **Measurement caveat (applies to every number below).** All figures come from **headless Google Chrome 156 (Blink/V8, software raster) on an 8-core Xeon box**, driven by Playwright-core 1.65 with iPhone 14 emulation: 390×844 CSS px, DPR 3, `isMobile`, touch and an iOS Safari UA. Unless stated otherwise, CPU is throttled **4×** via CDP as a rough proxy for the phone. **This is not iPhone Safari (WebKit/JSC, Metal-backed canvas, ProMotion/Low-Power rAF policy).** Relative comparisons (before/after, scene A vs scene E) are meaningful. The absolute ms values are not iPhone numbers. GPU/compositor cost (fills, `backdrop-filter`, CSS upscaling) **cannot be measured here at all**. Under 4× throttle the headless compositor delivered rAF at about 30 Hz even when JS took only 2 ms, so I don't report fps under throttle as meaningful. Unthrottled it ran at 60 Hz.

---

## 0. Acceptance criteria (#7) and how each is met

| # | Acceptance criterion (issue #7) | Where it's met |
|---|---|---|
| AC1 | Map of the render loop and expensive paths (rAF loop, dt cap, DPR cap, offscreen caches, Performance preset) with file/line refs, and which are likely costly on iPhone 14 Safari | §1 (loop map, caches, preset table, per-path cost and iPhone-Safari risk) and §5 (measured numbers) |
| AC2 | Investigation of camera zoom instability and touch bugs: reproduction steps and suspected cause (as hypothesis) | §2 (zoom: Z1–Z6) and §3 (input: I1–I8). Each has a repro, a suspected cause and, where possible, a headless confirmation |
| AC3 | Pixel-art scaling and clarity audit (integer scaling, smoothing, DPR handling) | §4 |
| AC4 | Ranked safe optimisations, each with how it will be measured and expected effect | §6 (R1–R12 plus input fixes), each with files/lines, effect, risk, metric, scenario, before/after method and an iPhone check |
| AC5 | Proposed perf-harness task (`farwake/render/perf-harness`: `?perf=1` recorder, off by default, benchmark scenes in an isolated save slot) with exact file ownership, independent of ChatGPT Work's files | §7: exact file list, independence verdict (**YES** for the recommended Version A), the hook-based alternative (Version B, **NOT** independent), overlap notes and acceptance criteria |
| extra | Real-iPhone 14 checklist for Kyle | §8 |

---

## 1. Render loop map and expensive paths (AC1)

### 1.1 Frame pipeline (all in `src/game.html`, ChatGPT Work-owned)

| Step | Where | What it does every rAF |
|---|---|---|
| rAF loop | `src/game.html:529` `frame(now)`, started at `:540` | One `requestAnimationFrame` loop drives **simulation, presentation and UI** together |
| dt cap | `:529` `dt=Math.min(.07,(now-last)/1000)` | dt is capped at 70 ms. Below about 14 fps, game time runs slower than real time (by design). `visibilitychange` resets `last` (`:530`) |
| zoom easing | `:529` (uses `zoomRequest` from `:301-302`, `setZoom` `:303`) | Exponential ease `1-exp(-dt*17)` toward the target. Stops when within `.002` |
| simulation | `tick(dt)` `:289`, colonist loop `:290-295` | Full sim **every rAF** (survey grid, frontier, crops, needs, task search, pathfinding). Sim cost doubles at 120 Hz (not the iPhone 14, which is 60 Hz) |
| presentation | `advanceWorld(dt)` `:513-521` | Pose damping (`people.js:17`), work FX, dialogue moments, audio |
| draw | `:529` `if(prefs.preset!=='performance'||renderAccum>=1/30) draw(now)` | **Full-canvas redraw every frame** (no dirty rects). Performance preset draws at about 30 Hz |
| UI | `:529` every 0.8 s | `frontierRefreshTree`, `refreshCommandReadouts` (`command.inc.js:70`), `paintHUD` (`:361`, rebuilds `#resbar` and `#inspector` `innerHTML`), and `renderUI()` (`:363-370`, rebuilds nav and panel `innerHTML`) when the tab isn't Build and no sheet is open |
| autosave | `:529` every 12 s, plus `pagehide`/`visibilitychange` `:530` | `save()` (measured 0.6–3.4 ms at 4×, 11.3 KB JSON for a fresh colony) |

### 1.2 `draw(time)` order (`src/game.html:341-360`)

1. `setTransform(dpr)` and a full-screen clear fill (`:341`), then camera `translate/scale/translate` with **unrounded** `camera.x/y/z` (`:341`).
2. Visible tile bounds with ±2 tile margin (`:342`).
3. Ground: cached 8×8-tile chunk canvases plus animated patches (`landscape.js:172-194`).
4. Paths/roads: `editorPaths` (`editor.inc.js:190-207`) runs `S.buildings.filter(...)`, a new `Set` and `FarwakeHearth.draw` **per path tile per frame**.
5. Frontier sites (`frontier.inc.js:472-482`).
6. Features: loops over **all** `features` (603 on the default seed) with an in-view test, then a shadow ellipse path plus `save/transform/drawImage` per tree (`game.html:345`, `work-fx.js:33-39`, `landscape.js:240-253`).
7. Building shadows (`:346`, `buildings.js:228-248`, `frontier-art.js:253-264`).
8. Buildings: `S.buildings.filter(...).sort(...)` **allocated every frame** (`:348`), then `renderBuilding` (`:309-324`) → plate `drawImage` plus door fills, `drawProduction` (garden: about 160 `fillRect`s per garden, `industry.inc.js:138-158`), and `FarwakeHearth.draw` (`hearth.js:141-219`: history-plate key string `join` per building per frame at `:51-52`, a lamppost radial gradient **created per frame** at `:154`, per-window `save/clip/restore` at night at `:183`).
9. Piles (`:349`, `people.js:175-186`).
10. Colonists: `[...S.colonists].sort(...)` **allocated every frame** (`:350`), then `save/globalAlpha/restore` per colonist and about 40 `fillRect`s each at **fractional** positions (`people.js:97-173`). The name label `fillText` and `measureText` run per frame when selected (`:167-171`).
11. Work FX (`work-fx.js:40-66`).
12. Editor overlay and selection (`editor.inc.js:176-188`, `game.html:327-340`).
13. **Fog of war: one `fillRect` per fogged visible tile per frame** (`game.html:356`). This is the single largest draw-call source (see §5).
14. Placement preview with `setLineDash` and `fillText` (`:357`).
15. Lighting in screen space (`landscape.js:266-319`): **full-screen linear-gradient fill every frame** (`:272-276`). At night it adds **a second full-screen fill** (`:278`) plus `globalCompositeOperation='screen'` and a **new radial gradient per light per frame** (`:279-288`). Rain adds **a third full-screen fill** and a stroke path (`:290-296`). Lightning adds a fourth (`:305-306`).
16. Speech bubble: word-wrap `measureText` per word per frame, `roundRect` and `fillText` (`moments.js:118-139`).

### 1.3 Offscreen caches (what's already good)

| Cache | Where | Notes |
|---|---|---|
| Terrain chunks 256×256 px (8×8 tiles) | `landscape.js:51-99`, baked on first sight `:184-186` | Good. **First-sight bake is synchronous**: 35.6–42.2 ms on first view vs 0.1–1.1 ms on second at 4× (§5.4). That's a hitch when panning into new areas. Full map is 7×7 = 49 chunks ≈ **12.8 MB** if all are seen (computed) |
| Feature sprites (tree/ore/scrap/bush × 5 variants) | `landscape.js:213-243` | Good |
| Glow halos (mist, firefly) | `landscape.js:117-127` | Good. Pattern to copy for the night lights (R6) |
| Building plates (legacy) | `buildings.js:21-223` (key `:22`) | Good. Scan-converted at integer pixels |
| Frontier plates | `frontier-art.js:30-230` (key `:31`: `[..].join(':')` per call **per frame**) | Cached, but the key-building allocates on every draw |
| Shadow masks | `buildings.js:231-241`, `frontier-art.js:256-261` | Good |
| History plates | `hearth.js:49-53` (key `join` per call) | Cached, key allocates every frame |
| Thumbnails | `buildings.js:288-293`, `frontier-art.js:265-271` (`toDataURL`) | UI only |

There is **no cache for fog, roads/paths, gardens, colonists, lighting or the sky gradient**. All are re-rasterised every frame.

### 1.4 DPR cap and Performance preset

| Preset | DPR cap (`game.html:298`) | Draw rate (`:529`) | Landscape budget (`landscape.js:8-11`) | Hearth density (`hearth.js:21`) |
|---|---|---|---|---|
| performance | **1** | ~30 Hz (`renderAccum>=1/30`) | patches 8, rain 22, mist 0 | 0.45 |
| balanced (default) | **2** | every rAF | 20 / 48 / 1 | 1 |
| cinematic | **2** | every rAF | 34 / 78 / 2 | 1.4 |

Observations:

- On iPhone 14 (DPR 3) **no preset renders at native resolution**. Balanced renders at 2× and the compositor upscales 1.5×. Performance renders at 1× and upscales 3×, which will look very soft (§4).
- The Performance preset halves draws but **does not slow `tick`/`advanceWorld`**, which still run every rAF. In the sim-on large-colony scene, the sim is the dominant cost (§5.2).
- `FarwakeHearth.configure(prefs.preset)` is called per building per frame (`game.html:312`). It's cheap but redundant.

### 1.5 Likely costly on iPhone 14 Safari (ranked by expected cost)

1. **Sim inside rAF scales with colony size.** `findPath` BFS (`game.html:233`) calls `walkable` → `buildingAt` (`:224`, `:167`), a **linear `S.buildings.find` per cell visited**. `harvestTaskFor` (`:217`) filters all features per idle colonist, and idle colonists retry `getTarget` **every frame** (`:291`). This produced the worst frame times measured (§5.2). JSC is a different engine but the algorithmic cost (cells × buildings) carries over.
2. **Fill-rate from full-screen passes.** There are 1–4 full-canvas alpha fills per frame for lighting and weather (`landscape.js:276,278,291,306`) on a 780×1424 backing store, plus a fog alpha fill per fogged tile. On Safari, this is GPU/compositor work that the Chromium proxy can't see.
3. **`backdrop-filter: blur(5–12px)`** on `.mission` and `.inspectcard` (`game.html:28,39,51`, inline style). These sit over a canvas that changes every frame, so WebKit must re-blur those regions every frame. This is likely expensive on iOS. I couldn't measure it here (hypothesis).
4. **Draw-call volume and state churn.** About 1,750–2,140 `fillRect`, about 2,000 `fillStyle` sets, about 245 `drawImage` and about 290 `save/restore` per frame in a grown colony at zoom 0.6 (§5.2).
5. **GC churn.** Measured 131–151 KB/frame render-only and 666–847 KB/frame with the sim on in a grown colony (§5). JSC GC pauses would show up as p99 spikes.
6. **Chunk-bake hitches** on first view of new terrain (§1.3).
7. **DOM rebuilds every 0.8 s.** These are cheap in Chromium (§5.5), but `innerHTML` replacement under blurred overlays may cost more in WebKit (hypothesis).

---

## 2. Camera zoom instability (AC2)

Zoom code: `setZoom` (`game.html:303`), `easeZoom` (`:302`), ease in `frame` (`:529`), pinch (`:499-502`), buttons (`:495-496`), wheel (`:504`), `centerCamera` (`:431`). Zoom range is clamped to 0.6–2.35 and is continuous.

Headless check: pinch **focal anchoring is mathematically correct**. A synthetic 2-finger spread kept the world point under the midpoint fixed (drift **0 tiles**, `input.mjs`), so classic focal drift is *not* the cause. The likely causes are below.

| ID | Symptom | Repro | Suspected cause (hypothesis) | Headless evidence |
|---|---|---|---|---|
| Z1 | **Zoom suddenly jumps** mid-gesture | Put 3 fingers down (or swap fingers mid-pinch), lift the first, move slightly | `pinch.initial` distance is from the first two pointers, but after one lifts, `pts[0],pts[1]` are a *different* pair. `pinch` is only cleared when `<2` pointers remain (`:502`) and is never re-baselined | **Confirmed:** z went 1.00 → 2.06 on a 1 px move |
| Z2 | Map **flies off-screen** during pinch/two-finger pan | Pinch near a map edge and pan with two fingers outward a few times | The pinch branch (`:500`) and `setZoom` (`:303`) **don't clamp camera.x/y**. Only one-finger drag clamps to −100…VW·TS+100 (`:501`) | **Confirmed:** camera.x reached **−1080** (drag clamp is −100) |
| Z3 | Zoom never settles on a "clean" level; shimmer after zooming | Tap + three times, or − to the minimum | Ease stops within `.002` and never snaps to target (`:529`). Buttons multiply by 1.2 (`:495-496`), so z is always an arbitrary float | **Confirmed:** z ended at **1.72621** (target 1.728); zoom-out ended at **0.60184** (min 0.6) |
| Z4 | Content shimmers or "boils" while zooming/panning slowly | Pinch slowly; pan slowly at z≈1.37 | Continuous non-integer scale × DPR 2 (`:298`) and unrounded camera translate (`:341`): nearest-neighbour `drawImage` drops or duplicates source pixels and `fillRect` edges antialias differently each frame (§4) | Visual: `shot_z1.37.png` shows uneven pixel widths vs `shot_z2.png` |
| Z5 | Whole UI zooms or gets stuck zoomed | Pinch or double-tap on the HUD, resource bar, panel or sheet (not the canvas) | iOS Safari ignores `user-scalable=no`/`maximum-scale=1` (`game.html:5`) for accessibility. Only buttons get `touch-action:manipulation` (inline style `:15`) and the canvas `touch-action:none` (`:15`). There's no `gesturestart` handling. The page-level visual viewport can zoom | Can't reproduce in Chromium; **iPhone check needed** |
| Z6 | Map jumps when Safari's URL bar collapses or expands mid-gesture | In a Safari tab (not the PWA), start a pinch or drag while scrolling causes toolbar changes | `pointerdown` calls `resize()` if bounds changed (`:499`), and `ResizeObserver`/`resize` (`:505`) reallocates the canvas. `cw/ch` change shifts the screen-centre-based anchor by half the delta, and the in-flight pinch anchor uses the old geometry | Hypothesis |

---

## 3. Touch and input bugs (AC2)

Handlers: `game.html:499-505`. They use Pointer Events with `setPointerCapture`, `{passive:false}` and `preventDefault()` on down/move/wheel, plus canvas `touch-action:none`, a contextmenu block and a 7 px tap/drag threshold.

| ID | Bug | Repro | Suspected cause | Evidence |
|---|---|---|---|---|
| I1 | **Remaining finger is dead after a pinch.** Lift one finger and the other can't pan until it's lifted and re-touched | Pinch, lift one finger, drag with the other | When the second finger lands, `drag=null` (`:499`). When a finger lifts, nothing re-creates `drag` for the survivor (`:502`) | **Confirmed:** camera moved **0 px** |
| I2 | **Map lags the finger by 7 px for the whole drag** | Drag slowly | Movement before the 7 px threshold is discarded. After it, only per-event deltas apply (`:501`) | **Confirmed:** 20 px slow drag moved the camera **13 px** at z=1 |
| I3 | Zoom jump on finger swap or 3 fingers | See Z1 | `:500`, `:502` | Confirmed |
| I4 | Pinch/pan out of bounds | See Z2 | `:500` | Confirmed |
| I5 | Page zoom or double-tap zoom on non-canvas UI | See Z5 | `:5`, `:15` | iPhone check needed |
| I6 | A tap during a sheet transition or right after a pinch could select unexpectedly | Hypothesis: `wasTap` uses `!pinch` at pointerup time (`:502`), but `pinch` is already null for the last finger of a pinch whose `drag` is null, so it's safe. I found no false-tap path in code reading | — | Not reproduced |
| I7 | Canvas cleared or reallocated mid-gesture | `resize()` on `pointerdown` (`:499`) and on every preference click (`:526`) always reassigns `canvas.width/height` (`:298`), even when unchanged. That reallocates the backing store and resets context state | Code reading | Hypothesis on visual flash |
| I8 | Editor stroke and pinch interplay | `editorDown` undoes the stroke when a second finger lands (`editor.inc.js:57-59`). `editorMove` returns early only for single-pointer strokes (`:64-66`), so pinch still works in editor mode. That looks right, but it needs an iPhone check because `pointercancel` from iOS system gestures restores the undo (`:69`) | Code reading | — |

Coordinates: pointer → canvas uses `clientX - rect.left` in CSS px. `screenToWorld` (`:300`) works in CSS px and DPR lives only in `setTransform`, so **DPR handling of input is correct**. Safe-area padding is on `.app` (`:15`), so `getBoundingClientRect` already accounts for it. I found no DPR or safe-area coordinate bug.

---

## 4. Pixel-art scaling and clarity (AC3)

| Topic | Finding | Ref |
|---|---|---|
| Backing store vs CSS vs DPR | Backing = CSS × `min(2, DPR)` (balanced/cinematic) or ×1 (performance). On the emulated iPhone 14 the canvas was **780×1424 backing for 390×712 CSS at DPR 3**, i.e. 2 backing px per CSS px. The **compositor upsamples 1.5×** to device pixels | `game.html:298`; measured |
| CSS `image-rendering` on `#world` | **Not set** (computed `auto`), so the 1.5× (or 3× in Performance) upscale is bilinear. Every frame is softened. (`pixelated` is used only on catalogue images: `field.css:20`, `frontier.css:7,9`) | `game.html:15` `#world{...}` |
| `imageSmoothingEnabled` | Set `false` after every resize (`game.html:298`) and per draw in `landscape.js:181`, `buildings.js:253`, `frontier-art.js:238`. This only affects `drawImage`. **`fillRect`/path geometry is still antialiased** at fractional transforms | as listed |
| Integer scaling | **Never integer on device.** Device scale = z × 3, with z continuous 0.6–2.35. Backing scale = z × 2. With camera translate unrounded (`:341`) and colonists at float positions (`people.js:104` `translate(v.x*tileSize, v.y*tileSize)`), sprites "crawl" and edges blend | §2 Z3/Z4 |
| Seams | **Fog of war shows a faint tile grid**. Adjacent 32×32 alpha `fillRect`s with antialiased fractional edges double-blend at tile borders. It's visible at z=0.77 in `full_z0.77.png`. Terrain chunk seams between 256 px chunks are possible at some zooms for the same reason (not observed in my captures) | `game.html:356` |
| Text | `fillText` for labels, bubbles and placement preview is drawn in world space (scaled by z) or screen space at 2× backing. It looks fine at 2× but is softened by the 1.5× upscale | `people.js:168-170`, `moments.js:125-137`, `game.html:357` |
| Memory at DPR 3 | Current 2× backing: 780×1424×4 B ≈ **4.4 MB**. Native 3× would be 1170×2136×4 B ≈ **10.0 MB**. Terrain chunks add up to ≈12.8 MB once the whole map is seen, plus small plate caches. All of this is far below WebKit's total canvas-memory ceiling (WebKit logs "Total canvas memory use exceeds the maximum limit" when hit; the exact limit for iPhone 14 is **not verified** here). Memory is not the constraint; fill-rate is | computed |

**Clarity recommendation (needs Kyle's taste call; see R9/R10):** for crisp pixel art on DPR 3, the backing store would need to be device-resolution and zoom quantised so that `z × DPR` is an integer (z ∈ {2/3, 1, 4/3, 5/3, 2, 7/3} → 2…7 device px per world px), with the translate rounded to device pixels. That costs about 2.25× more pixels per full-screen fill than today, which is why it's ranked after the cheap wins. A cheaper half-step is `image-rendering: pixelated` on `#world`. That gives crisp edges, but at a 1.5× ratio the pixel widths alternate 1/2 device px, so it must be judged on the phone.

---

## 5. Measurements (real numbers; headless Chromium proxy, see caveat)

Scripts: `perf.mjs`, `perf2.mjs`, `input.mjs`, `pixels.mjs`, `fog.mjs`, `bake.mjs`, `dom.mjs`, `save.mjs`. Raw outputs: `run1.jsonl` (sim on), `run2_paused.jsonl` (render-only, CPU profile), `run3_sim.jsonl` (sim on, CPU profile), `run4_1x.jsonl` (unthrottled). All are in `/workspace/render-audit-scratch/`.

"Frame JS" is the duration of each rAF callback (tick, advanceWorld, draw issue and UI). It excludes GPU raster. Allocation comes from the V8 sampling heap profiler, including objects collected by minor and major GC. Op counts are main-canvas calls during one `draw()`.

**Scenes.** Fresh = default seed `FW-10402`, day, 3 buildings and 5 colonists. **Grown = synthetic**: +60 finished buildings on a grid (14 types incl. dormitory, warehouse, lampposts, gardens, history counters set), +72 path/road tiles and +20 cloned colonists, for **124 buildings and 25 colonists**. It's a stress layout, not a real Day-100 save.

### 5.1 Render-only (sim paused), 4× CPU throttle, 5 s each

| Scene | Frame JS median / p95 / p99 / max (ms) | Alloc KB/frame | fillRect | drawImage | Notes |
|---|---|---|---|---|---|
| A fresh, z=1 | 2.4 / 4.1 / 5.1 / 5.1 | 34.6 | 290 | 54 | |
| B fresh, z=0.6 | 3.4 / 5.2 / 6.4 / 6.4 | 36.2 | 895 | 80 | **719 of 898 fillRects are fog** (§5.4) |
| C fresh, z=2.35 | 2.1 / 4.1 / 6.4 / 6.7 | 19.6 | 100 | 18 | |
| E grown, z=0.6, day | 8.9 / 14.3 / 19.1 / 19.1 | 144.4 | 1,746 | 244 | ~2,040 fillStyle sets, ~287 save |
| F grown, z=0.6, night + rain | 8.6 / 12.0 / 21.0 / 21.0 | 151.2 | 1,819 | 244 | +5 radial gradients/frame |
| G = F + Performance preset | 1.1 / 16.9 / 18.7 / 30.5 | 63.3 | 1,770 | 255 | Bimodal: draws only every other frame; backing 390×712 |

Top CPU self-time, grown render-only (E, 5 s): native `drawImage` 187 ms, `fillRect` 105 ms, `fillStyle` setter 64 ms, `save` 60 ms, **GC 56 ms**, `draw` 51 ms, `editorPaths` 29 ms, `animatePatch` 28 ms. In F, `historyPlate` (key building) also shows at 24 ms.

**Unthrottled (1×) render-only:** A median 0.7 / p95 1.1 / max 2.2 ms at **60 fps**. E median 2.1 / p95 3.6 / max 5.1 ms at **59.8 fps**.

Back-to-back `draw()` micro-benchmark (20 draws, includes GPU-process flushes, so treat it as an upper bound): at 4×, A 1.6 ms, B 25.3, C 1.1, E 32.6, F 37.9, G 21.5 ms/draw. At 1×, A 0.45 and E 8.5 ms/draw.

### 5.2 Simulation on, 4× throttle

| Scene | Frame JS median / p95 / p99 / max (ms) | Frames >16.7 ms | Frames >33 ms | Alloc KB/frame |
|---|---|---|---|---|
| A fresh z=1 (run1, 6 s) | 3.0 / 7.5 / 13.8 / 25.4 | 1 / 194 | 0 | 59.1 |
| D grown z=1 (run3, 5 s) | **27.1 / 43.4 / 67.5 / 67.5** | 68 / 69 | 19 | **846.9** |
| E grown z=0.6 (run3, 5 s) | **22.2 / 44.9 / 65.7 / 65.7** | 54 / 67 | 11 | 665.9 |

Top CPU self-time, D sim-on (5 s): **`findPath` 534 ms** (`game.html:233`), `harvestTaskFor` and its closures about 181 ms (`:217`), `drawImage` 108 ms, **GC 91 ms**, `save` 78 ms, `walkable` 75 ms (`:224`), `surveyGrid` 43 ms (`survey.inc.js:141`). Top allocators: `harvestTaskFor` closures 13.8 MB, `findPath` 12.4 MB (new `Int32Array`s and neighbour arrays per call), `surveyUnknown` 4.1 MB, `productionCandidate` 2.8 MB, `entrance()` 2.5 MB over 5 s.

**Outliers to flag, not to quote as typical:** in run1 the synthetic grown colony produced single frames of **491 ms**, **5,560 ms** and **118,813 ms** (one stall of about 2 min during scene G) with the sim on. They come from sim task/path search inside rAF on a **synthetic layout that may contain unreachable or blocked states a real colony wouldn't**. I haven't confirmed them on a real save. They show that sim work in `tick` is unbounded per frame. I recommend Systems and ChatGPT Work reproduce this from a real long-running save before anyone acts on the magnitude.

### 5.3 Heap
`performance.memory.usedJSHeapSize` after the runs was 2.8–6.5 MB (Chromium only). JSC heap isn't observable here. Allocation **rates** (above) matter more than heap size.

### 5.4 Targeted measurements (4×)
- **Fog cost:** at z=0.6, 719 of 898 `fillRect`s were fog tiles (80 %). At z=1 it was 162 of 293.
- **Chunk-bake hitch:** the first view of an unseen map corner took 37.7 / 42.2 / 37.8 / 35.6 ms vs 1.1 / 0.5 / 0.3 / 0.1 ms on the next draw.
- **save():** 3.4, 0.6, 0.8, 0.9, 0.6 ms; 11,281 bytes (fresh colony).

### 5.5 DOM/UI (CDP metrics, 8 s, 4×)
- Build tab, panel collapsed: 10 layouts, 18 ms layout and 10 ms style total; 1,062 nodes.
- Crew sheet open: 19 layouts, 32 ms layout and 14 ms style; 2,194 nodes.

This is low in Chromium. `backdrop-filter` and compositing costs can't be measured here.

### 5.6 Not measured or not measurable here
iPhone Safari frame times, GPU raster and compositing, `backdrop-filter` cost, CSS upscale cost, thermal throttling, battery, JSC GC pauses, ProMotion or Low-Power-Mode rAF behaviour, real Day-50/100 save performance (no real large save fixture available), and Home-Screen PWA vs Safari-tab differences.

---

## 6. Ranked safe optimisations (AC4)

Ranking is impact × low risk. **Ownership matters.** `src/game.html` (and therefore `index.html`) is ChatGPT Work's. The renderer modules `landscape.js`, `people.js`, `buildings.js`, `hearth.js`, `frontier-art.js`, `work-fx.js` and `moments.js` are loaded by `<script src>` (`game.html:73-80`), so **changing them needs no `build.py` run and touches no ChatGPT-owned file**. Their owner isn't named in #4; I assume Render, **pending Command's confirmation**. `editor.inc.js` sits with UI & Mobile (editor UI) and `industry/survey/logistics/housing.inc.js` with Systems. Every `.inc.js` change requires a `build.py` rebuild of `index.html`, which ChatGPT Work owns.

None of R1–R12 changes save data or the save format.

| Rank | Optimisation | Files / lines | Expected effect | Risk | How it's measured |
|---|---|---|---|---|---|
| **R1** | **Cached fog layer.** Keep a 56×56 fog canvas (1 px per tile, including the `hash>.94` speckles baked at tile scale, or a 32× per-chunk overlay). Redraw it only in `reveal()` and draw it with one `drawImage` (smoothing off) | `game.html:356` (draw), `:157` `reveal` (invalidate). **ChatGPT Work** | Removes up to ~700 `fillRect`s/frame at wide zoom (80 % of calls in scene B) and **fixes the fog grid seams** (§4) | Low: visual parity except seams disappear. Speckle positions must be preserved | Metric: fillRect count/frame, frame JS median/p95. Scenes B (fresh z=0.6) and A. Before/after: harness op counter + `perf/run-headless.mjs` 3 runs each, compare medians; screenshot diff of a fogged region. **iPhone:** fog edges look identical, no grid lines; zoomed-out pan feels smoother |
| **R2** | **Zero-allocation draw path.** Keep the sorted building/colonist arrays and the path list plus `laid` Set, rebuilt only when `S.buildings`/`S.colonists` change (version counter). Cache the `historyPlate` key and frontier `plate` key per building (on a WeakMap keyed by building, invalidated by the tier object). Make `entrance()` return frozen cached objects | `game.html:348,350` (ChatGPT); `editor.inc.js:191` (UI & Mobile + rebuild); `hearth.js:49-53`, `frontier-art.js:26-31`, `buildings.js:12-20` (renderer modules) | Render-only alloc 131–151 → much less KB/frame (target ≤ 20). Fewer GC pauses (GC was 41–79 ms per 5 s) and lower p99 | Low: draw order must stay identical (stable sort on same keys). No gameplay or save impact | Metric: sampling-heap KB/frame, GC ms per 5 s, p99 frame JS. Scenes E/F render-only. Before/after with the harness, 3 runs. **iPhone:** Safari Timelines (if a Mac is available) JS & Events lane, GC markers; otherwise subjective hitch count in a 60 s pan |
| **R3** | **Bound sim work per frame** (Systems/ChatGPT). (a) Keep a tile occupancy grid (`Int16Array` building index), updated on build/move/demolish, so `buildingAt`/`walkable` are O(1). (b) Reuse `findPath` buffers. (c) Throttle idle colonists' `getTarget` retries (e.g. stagger, ≥250 ms between retries per colonist) | `game.html:167,224,233,291,217`. **ChatGPT Work / Systems**, QA determinism review | Largest win in big colonies: `findPath` + `walkable` were 609 ms of 5 s in scene D, and frame p95 was 43 ms | **Medium:** must not change pathing results or task choice (tie-breaks), or sim outcomes diverge. Needs QA seeded-sim before/after equivalence | Metric: frame JS p95/p99, frames >33 ms, `findPath` self-time. Scenes D/E sim on, plus a **real long-run save fixture**. Before/after: harness + identical seeded tick run compared for state hash. **iPhone:** 10-minute play of a big colony at 3× speed, note stutters |
| **R4** | **Snap translation to device pixels.** Round the camera translate in backing px, and round colonist/pile draw origins to world px (`Math.round(v.x*TS)`) | `game.html:341` (ChatGPT); `people.js:104` (renderer) | Removes sub-pixel crawl and antialiased edges on sprites while panning or walking. No perf cost | Low: walking motion is quantised to 1 world px (barely visible at z≥1) | Metric: visual. Capture 60 frames of a slow pan, count frames where a static sprite's crop changes (should be 0 between whole-pixel moves). **iPhone:** slow pan over the lander and walking colonists, check shimmer |
| **R5** | **Snap ease to target and fix input bugs.** Set `camera.z=q.z` when within threshold. Re-baseline the pinch when the pointer set changes. Hand the surviving finger a drag. Apply the full offset at threshold crossing. Clamp the camera in the pinch branch and `setZoom` | `game.html:499-502,529,303` (ChatGPT; UI & Mobile should agree on gesture feel) | Fixes Z1–Z3 and I1–I4 (all confirmed headless) | Low–medium: touch feel changes slightly (should improve) | Metric: `input.mjs`-style scripted gestures. Anchor drift 0, z exact after ease, no jump on finger swap, camera within clamp, 20 px drag gives 20 px. **iPhone:** checklist §8 items 3–7 |
| **R6** | **Cheaper lighting.** Cache the night light glows as sprites (like `halo()`), drawn with `globalAlpha`. Cache the sky gradient by (w, h, evening, quantised amber). Merge the night tint into the same full-screen pass. Cache the lamppost glow sprite | `landscape.js:266-289`, `hearth.js:153-157` (renderer) | Removes per-frame gradient creation (5/frame in F) and one full-screen fill at night → lower GPU fill on iPhone | Low: slight colour banding differences; must A/B screenshot | Metric: draw-call/gradient count, Chromium trace raster time; on iPhone, fps at night in rain. Scene F. **iPhone:** night + rain with 3+ lights, compare smoothness and colour |
| **R7** | **Pre-bake terrain chunks off the critical path.** Bake neighbours a few at a time on idle frames (time-sliced `setTimeout`; `requestIdleCallback` isn't in Safari), or bake all 49 at load behind the splash | `landscape.js:172-189` (renderer) | Removes 36–42 ms (4×) first-view hitches when panning | Low: up to 12.8 MB baked up front if fully pre-baked; time-slicing avoids load delay | Metric: max frame JS during a scripted pan across the whole map. **iPhone:** fling-pan to all four corners on a fresh world, count hitches |
| **R8** | **Lighter Performance preset.** Also run `advanceWorld`/`FarwakeMoments` presentation at the draw rate. Use `renderAccum-=1/30` for even cadence. Consider DPR 1.5 rather than 1 for legibility | `game.html:298,529` (ChatGPT) | Fewer per-frame JS steps on low-power devices; less blur | Low (sim untouched) | Metric: frame JS median in G vs F. **iPhone:** Performance vs Balanced side-by-side and legibility |
| **R9** | **`image-rendering: pixelated` on `#world`** (trial) | inline style `game.html:15` (ChatGPT; UI & Mobile consulted) | Crisp edges instead of a bilinear 1.5× upscale | Medium (visual): uneven 1/2 device-px pixel widths at 1.5×. Must be judged on device | Metric: screenshots at z=1, 1.5, 2 and a Kyle A/B. **iPhone:** read the HUD-free map at three zooms |
| **R10** | **Pixel-perfect mode.** Native DPR backing plus integer device-scale zoom stops (pinch continuous, snap on release) | `game.html:298,302-303,500,529` (ChatGPT, UI & Mobile on feel) | Crisp, stable pixel art on iPhone | **Higher:** 2.25× pixels per full-screen fill (≈10 MB backing); changes zoom feel | Metric: frame JS + iPhone fps at z=0.6 grown, before/after. Only after R1/R2/R6 land. **iPhone:** clarity and smoothness A/B |
| **R11** | **Diff-based HUD/UI refresh.** Update text nodes only when values change, instead of `innerHTML` every 0.8 s | `game.html:361,363-370,375`, `command.inc.js:70`. ChatGPT / UI & Mobile | Small in Chromium (layout ≈ 2–4 ms per refresh at 4×); may matter more under `backdrop-filter` in WebKit | Low | Metric: layout/style counts per 10 s (CDP); Safari Timelines layout lane |
| **R12** | **`backdrop-filter` audit.** Test without blur (opaque backgrounds already ~0.79–0.95 alpha) | `game.html:28,39,51` (ChatGPT; UI & Mobile design call) | Possibly large GPU saving on iOS (unmeasured) | Low technically, design call | iPhone-only: compare smoothness with the inspector card open vs closed. Safari Timelines → Layers/Rendering |

Also small: guard `resize()` to skip reallocation when dimensions are unchanged (`game.html:298`), and call `FarwakeHearth.configure` once per frame instead of per building (`:312`).

---

## 7. Perf-harness task proposal (AC5): `farwake/render/perf-harness`

**Goal:** a repeatable recorder and benchmark scenes, so every optimisation above gets an objective before/after, in headless Chromium and on Kyle's iPhone.

### 7.1 Recommended: Version A, an external harness. **Independent of ChatGPT Work's files: YES.**

Cut from `farwake/integration`. **Creates only new files. Modifies no existing file.**

| File (new) | Purpose |
|---|---|
| `perf/harness.html` | Harness page. `?perf=1` enables recording; **off by default**, so without the flag the page does nothing. `&scene=<id>&zoom=&preset=&seconds=&paused=` select a scene. It fetches the built `../index.html`, injects `<base href="../">` plus `<script src="perf/recorder.js">` at the top of `<head>` **in memory**, and loads it via iframe `srcdoc`. The repo file is never modified |
| `perf/recorder.js` | rAF wrapper (callback duration and inter-frame interval), long-frame counts, median/p95/p99, optional canvas op counter (off unless `&ops=1`, because it adds overhead), `performance.memory` where available, and JSON export/download plus an on-screen summary for iPhone |
| `perf/scenes.js` | Deterministic scenes driven only through the existing `window.FARWAKE_TEST` API (`game.html:533`) and DOM ids (`#pause`, `#zoomin`): fresh seed `FW-10402`, synthetic "grown" layouts (labelled synthetic), zoom 0.6/1/2.35, night/rain, preset switch, and render-only (paused) vs sim-on |
| `perf/fixtures/README.md` | Where real long-run save JSONs go (loaded through the game's own import path inside the harness origin). Fixtures are harness-local; QA's `tests/` fixtures are not touched |
| `perf/run-headless.mjs` | Playwright-core runner: iPhone 14 emulation, CDP CPU throttle, N repeats, JSON + Markdown output to `perf/results/` (git-ignored) |
| `perf/package.json` | Pins `playwright-core` locally (no root `package.json` exists; none is created) |
| `perf/.gitignore` | `node_modules/`, `results/` (directory-local; the root is untouched) |
| `perf/README.md` | How to run it locally and on the iPhone over LAN; isolation rules |
| `docs/perf/RENDER_AUDIT.md` | This audit (the deliverable path named in #7) |
| `docs/perf/BASELINE.md` | Baseline numbers at `37745f1` from the harness |

**Isolated save slot.** The game's save key is hard-coded (`SAVE='farwake_founders_alpha03_v1'`, `game.html:84`) and it autosaves every 12 s and on hide (`:529-530`). Isolation is therefore **by origin**. The harness is always served from its own origin (e.g. `http://127.0.0.1:8766/perf/harness.html`, or the Mac's LAN IP and a dedicated port for the iPhone). That origin never hosts real play, so a benchmark can never overwrite Kyle's real save. `perf/README.md` states: never open the harness on the production or preview origin. The harness refuses to run (shows an error) if `location.port` isn't the dedicated harness port, or if a non-harness save already exists at that origin.

**Why it's independent.** It edits none of `src/game.html`, `frontier.inc.js`, `frontier.css`, `command.inc.js`, `doors.js`, `build.py` or `index.html`. It only *reads* the built `index.html` at runtime and calls the existing `FARWAKE_TEST` test API.
- **No overlap with QA & Saves:** no files in `tests/` and none in `.github/workflows/`. A later CI perf-smoke job would be QA's to add in their files, if they want one.
- **No overlap with UI & Mobile:** no CSS, preference, PWA or UI module edits.
- **No overlap with Systems:** no sim module edits.

**Tradeoffs of Version A:**
1. It **depends on the `FARWAKE_TEST` surface and DOM ids**. If ChatGPT Work renames them, the harness breaks (no merge conflict, but it needs an update). The harness feature-detects and fails loudly.
2. The `srcdoc` injection must run before the game's scripts. Wrapping `requestAnimationFrame` there is reliable, but it measures JS callback time only, not GPU. On iPhone, Safari Web Inspector Timelines (on a Mac) complements it.
3. The `?perf=1` flag lives on the harness URL, not the game URL. That's slightly different from the issue's wording, but it keeps the game untouched.
4. It adds static files that a preview deploy would serve. They're inert without `?perf=1`. Whether pushing a branch triggers a Vercel preview is still Command's open question on #4.

### 7.2 Alternative: Version B, an in-game `?perf=1` hook. **Independent: NO.**
This would add about 3 lines to `src/game.html` (load `perf/recorder.js` when `?perf=1`, plus optional draw-phase timers inside `draw()`/`frame()`) and a rebuilt `index.html`. That touches two ChatGPT Work-owned files, so it needs ChatGPT Work to agree on #4 first. Benefit: per-phase timings (tick vs draw vs UI) and the recorder available on the real game URL. Recommendation: **do A now. Propose B to ChatGPT Work later** only if phase-level timings turn out to be needed.

### 7.3 Acceptance criteria for the harness task
1. Branch `farwake/render/perf-harness` cut from `farwake/integration`. The PR targets `farwake/integration`. `git diff --name-only` lists **only** paths under `perf/` and `docs/perf/` (no existing file modified).
2. Without `?perf=1`, the harness page performs no recording, adds no listeners to the game and writes nothing.
3. With `?perf=1&scene=fresh-z1&seconds=10`, it outputs JSON with frame-JS median/p95/p99/max, interval stats, long-frame counts (>16.7 ms, >33 ms), scene metadata (commit SHA if available, UA, DPR, canvas backing size, preset, zoom) and, with `&ops=1`, canvas op counts.
4. At least these scenes: fresh z=0.6/1/2.35; grown-synthetic z=0.6 day and night+rain; Performance-preset variant; each render-only and sim-on; plus "load fixture" for a real save JSON.
5. Isolation: it only runs on the dedicated harness origin/port, refuses otherwise, and never reads or writes the real-play origin. This is verified by a test in the README procedure.
6. `node perf/run-headless.mjs --repeat 3` re-baselines §5 on the host where it is run (within ±15% median only when repeated on the same box) and writes `docs/perf/BASELINE.md`.
7. It works on iPhone 14 Safari over LAN from a Mac or other static server (`python3 -m http.server`). Results are shown on screen and downloadable as JSON.
8. QA & Saves reviews the PR. Kyle approves the merge. No deploy.

---

## 8. Real-iPhone 14 test checklist for Kyle (Safari)

**Before you start:** export your save (More → Game & Save → Export Save). Note the iOS version, whether you're in a Safari tab or the Home-Screen app, whether Low Power Mode is on, and the Visual detail preset. Use Control Centre screen recording for items 2–9 if you can. If a Mac is available, enable Settings → Safari → Advanced → Web Inspector, then use Mac Safari → Develop → [iPhone] → Timelines to record 30 s for items 2 and 8.

1. **Baseline clarity:** at default zoom, look at the lander and a colonist. Are edges crisp or soft? Zoom in fully with + and check again. Note "crisp / slightly soft / blurry".
2. **Pan smoothness:** drag slowly across the map for 10 s, then quickly. Does the map stay under your finger, or lag behind it (I2)? Any shimmer on building edges or trees (Z4)?
3. **Pinch:** pinch in and out slowly over a building. Does the building stay under your fingers (expected yes)?
4. **Lift one finger:** pinch, lift one finger, keep dragging with the other. Does the map pan (I1, expected currently **no**)?
5. **Finger swap / three fingers:** pinch with two fingers, add a third, lift the first, move slightly. Does the zoom jump (Z1)?
6. **Map edge:** pinch and two-finger drag toward a map edge repeatedly. Can you push the map fully off-screen (Z2)? Press the home (◇) button to recover.
7. **Zoom buttons:** tap + three times and − five times. Is the end state smooth, or is there any shimmer while idle afterwards?
8. **Non-canvas gestures:** pinch and double-tap on the top bar, resource bar and bottom panel. Does the whole page zoom or get stuck zoomed (Z5)? Rotate the phone and back. Is the layout OK?
9. **Safari toolbar:** in a Safari tab, start a drag while the address bar collapses or expands. Does the map jump or flash (Z6, I7)?
10. **Load and heat:** set speed to 3× and play 10 minutes in your biggest colony. Note any stutters (count them), whether the phone feels warm, and battery % before and after.
11. **Night and rain:** wait for or reach night with rain. Is it as smooth as day?
12. **New terrain:** on a new world, fling-pan to each corner. Is there a hitch on first arrival (R7)?
13. **Preset A/B:** switch Visual detail to Performance. Is it smoother? Is it noticeably blurrier?
14. **Inspector open:** tap a building so the inspector card shows, then pan. Is it smoother with the card closed (R12, backdrop blur)?

Record per item: pass/fail, a short note, and video timestamps. Send the results to FARWAKE Command for #7.

---

## 9. Couldn't verify
- Any **real iPhone Safari** number: frame times, GPU/compositor, `backdrop-filter`, CSS upscale cost, thermal and battery, JSC GC, Low Power Mode (30 Hz rAF) or ProMotion behaviour.
- Z5, Z6, I7 and I8 (Safari page zoom, toolbar resize, mid-gesture reallocation, iOS `pointercancel`) are code-reading hypotheses.
- The multi-second sim stalls (491 ms to about 119 s) were only seen with a **synthetic** grown colony. They need a real long-run save to confirm magnitude.
- WebKit's exact canvas-memory ceiling on iPhone 14.
- Terrain chunk seams (theoretically possible, not observed). Fog seams **were** observed in headless Chromium.
- Ownership of the renderer `.js` modules (`landscape.js`, `people.js`, `buildings.js`, `hearth.js`, `frontier-art.js`, `work-fx.js`, `moments.js`) isn't stated in #4. I've assumed Render pending Command's confirmation.
