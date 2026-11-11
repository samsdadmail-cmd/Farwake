# FARWAKE performance harness

External recorder and benchmark scenes for FARWAKE. It loads the **built** `index.html` and measures it. It does not modify the game, the save format, or any file outside `perf/` and `docs/perf/`.

> **Save safety — read this first.** The game's save key is fixed: `farwake_founders_alpha03_v1`. Whatever origin loads the game can overwrite the expedition stored for that origin. This harness **only** runs on the dedicated local port **47321**.
>
> **`/` on port 47321 is the real game.** `http://127.0.0.1:47321/` and `http://<lan-ip>:47321/` serve `index.html`. Do not play a colony there. Do not open that URL to "just look". A colony saved on that origin is a real save for that origin.
>
> - Automated runs bind **`http://127.0.0.1:47321`** and use a **fresh browser profile** for every measurement. They never open a production origin, a preview origin, or a profile that has been used for real play.
> - An iPhone check uses a **private LAN address on that same port** (a different origin from `127.0.0.1`, and not a player's preview host). Open only `perf/harness.html?perf=1`.
> - After each report the harness removes the game frame (so the game's `pagehide` save runs) and then deletes the save, the harness marker, and the save fingerprint. The origin is left empty.
> - If a save is already there and it was not written by this harness, the page **refuses to load the game** and does not modify it. A marker left behind by an earlier run is not enough: the save must still match the fingerprint of the last harness-written colony. A colony played on this port after a benchmark is protected.
> - Without `?perf=1` the page does not load the game, does not record, and does not touch storage.
>
> Never open `perf/harness.html` on the production or preview origin. Never serve it on another port. The headless runner will not fall back to a different port if 47321 is taken.

Headless Chromium with iPhone 14 emulation is **only a proxy for iPhone Safari**. It is Blink/V8 with software raster, not WebKit/JavaScriptCore and not a Metal-backed canvas. Use it to compare scenes and future optimisations. Do not treat the milliseconds as iPhone frame times. GPU cost, `backdrop-filter`, and Low Power Mode are not visible here.

## What it measures

Each scene records:

- frame JS time: median, p95, p99, max (duration of the `requestAnimationFrame` callback)
- interval between callbacks (not a meaningful fps number under CPU throttle)
- long frames: callback longer than 16.7 ms and longer than 33 ms
- JS heap, where Chromium exposes `performance.memory`
- allocation, where Chromium's sampling heap profiler is available (headless runner)
- canvas CSS size, backing-store size, and `devicePixelRatio`

`&ops=1` also counts canvas calls. Leave it off for timing runs; the wrappers add overhead.

## Scenes

| id | What it is |
|---|---|
| `day2` | Day 2 early game. Fresh seed `FW-10402`, clock set to Day 2 07:20, 3 buildings, 5 colonists, simulation on, zoom 1. Day 1 is not simulated; `tick()` reads `performance.now()`, so a fast-forward would not be reproducible. |
| `late` | Synthetic late colony. 14 building types (dormitory, warehouse, lamppost, garden, and the rest), paths and roads, history counters, 25 colonists, Day 80, simulation on, zoom 0.6. Not a played save. |
| `idle` | The Day 2 layout with simulation paused via `#pause`. Drawing and presentation still run. |
| `fresh-z06`, `fresh-z1`, `fresh-z235`, `fresh-z1-sim` | Fresh seed at the audit zooms, paused or simulating. |
| `grown-day`, `grown-night`, `grown-performance`, `grown-sim`, `grown-sim-z1` | The same synthetic colony as `late`, with day / night+rain / Performance preset / simulation variants. |
| `fixture` | A real save JSON from `perf/fixtures/`. See `perf/fixtures/README.md`. |

URL overrides: `zoom`, `preset` (`performance`, `balanced`, `cinematic`), `paused=0|1`, `seconds` (1–60), `warmup` (milliseconds).

## Prerequisites

- **Node.js 20 or later** (`node -v`). `playwright-core` does not support older Node.
- **Google Chrome stable**, installed and on the default Chrome channel. The runner launches `channel: 'chrome'` and does not download a browser. If Chrome lives somewhere else, set `CHROME_PATH` or pass `--executable /path/to/chrome`.
- Install from the committed lockfile:

```bash
cd perf
npm ci
```

Use `npm ci`, not `npm install`, so the Playwright version stays on the lockfile.

## Headless (Chromium, iPhone 14)

```bash
cd perf
npm ci
node run-headless.mjs
```

That is the default suite (`day2`, `late`, `idle`), three repeats, iPhone 14 screen **390×844**, device scale **3**, **4× CPU throttle**, fresh profile per repeat. Day 2 and idle record **5 s**. The late colony records **15 s**, because its gather spike is on a 5 s simulation cadence and a 5 s window only catches about one of them. Pass `--seconds` to override every scene. Playwright’s built-in iPhone 14 viewport is 390×664 (it subtracts Safari’s toolbars); the runner pins 390×844 so the page matches the full screen the audit measured. JSON and Markdown land in `perf/results/` (git-ignored).

```bash
node run-headless.mjs --suite audit --repeat 1
node run-headless.mjs --scene day2 --seconds 10 --repeat 1
node run-headless.mjs --check-only
node run-headless.mjs --ops --scene idle --seconds 3 --repeat 1
```

`--check-only` confirms: no `?perf=1` writes nothing and does not load the game; port 47322 is refused; a pre-seeded non-harness save is left byte-for-byte untouched; a marker plus a player save (no fingerprint, and a fingerprint of a different colony) is also left byte-for-byte untouched and the game is not loaded.

The runner refuses to start if port 47321 (or the check port 47322) is already in use. It does not pick another port. `--no-sandbox` is not applied unless you pass that flag or set `FARWAKE_PERF_NO_SANDBOX=1`.

## On an iPhone, over the LAN

Serve the **repository root** (so `index.html` and the game scripts resolve) on port 47321, bound to the computer’s LAN address, not to every interface:

```bash
# macOS Wi-Fi address, for example
ipconfig getifaddr en0
python3 -m http.server 47321 --bind 192.168.1.20
```

Use the address `ipconfig` printed. **Do not pass `--bind 0.0.0.0`.** That publishes the server on every interface. Anyone on the LAN could then read the whole repository, including `.git`.

Binding to the LAN address exposes **every file under the repository root** to devices that can reach that IP on port 47321: the game, `perf/`, docs, and `.git` if it is inside the tree. It does not expose the rest of the disk. It is still not a player origin. Stop the server when you are done.

On the phone, open only:

```
http://192.168.1.20:47321/perf/harness.html?perf=1&scene=day2&seconds=10
```

Do not open `http://192.168.1.20:47321/` or `index.html`. That is the game, and playing it writes a real colony onto this origin.

The summary stays on screen. **Download JSON** saves the report. Safari does not expose `performance.memory` or the sampling heap profiler; frame times and canvas size still record. A phone result is the real Safari measurement. The Chromium numbers are not a substitute for it.

Stop the headless runner before using that port.

## What is being measured

The harness fetches the **committed** `index.html`. Edits to `src/game.html` or to a `*.inc.js` module are not in that file until it is rebuilt with `build.py`, which ChatGPT Work owns. Edits to renderer modules loaded with `<script src>` (`landscape.js`, `people.js`, `buildings.js`, `hearth.js`, `frontier-art.js`, `work-fx.js`, `moments.js`) are picked up on the next load without a rebuild. A before/after that skips the rebuild is measuring the old game.

## How injection works

`harness.html?perf=1` fetches `../index.html`, and in memory inserts `<base href="…">` (the repository root, which is what `../` means from this page) plus `recorder.js` at the start of `<head>`. The document is loaded with an iframe `srcdoc`. The file on disk is never modified. `recorder.js` wraps `requestAnimationFrame` before the game starts. Scenes then call `FARWAKE_TEST` (`setZoom`, `centerCamera`, `save`, `load`, `state`, `clearFootprint`, `renderUI`) and click `#pause`. If those hooks disappear, the harness fails loudly instead of guessing.

Phase-level timings (tick vs draw vs UI) need a few lines inside the game loop. That change is **not** made here. It is written up as a proposal in `docs/perf/BASELINE.md`. Headless Chromium emulation remains only a proxy for iPhone Safari.
