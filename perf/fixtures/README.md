# Performance fixtures

This folder is where a **real long-run expedition save** can be placed so the harness can benchmark it. Nothing in `tests/` is read or modified. No fixture is shipped in the repository: a real Day 50 / Day 100 save was not available when the harness was added, and the late-colony scene is a labelled synthetic layout instead.

## Save safety

Fixtures are loaded only on the harness origin (`http://127.0.0.1:47321`, or a private LAN address on port **47321**). The game's save key is fixed (`farwake_founders_alpha03_v1`). Do not copy a save you care about onto an origin where you also play, and do not point the harness at a production or preview origin. See `perf/README.md`.

## File format

Use either:

- a FARWAKE expedition export (`{"format":"farwake-expedition-backup","save":{...}}`), produced in the game from More → Game & Save → Export Save, or
- a raw version-3 save object (the JSON stored under the save key).

Name the file with letters, numbers, `.`, `_`, or `-` only, for example `day-80.json`.

## Run

Serve the repository root on port 47321, then open:

```
http://127.0.0.1:47321/perf/harness.html?perf=1&scene=fixture&fixture=day-80.json&seconds=10
```

Add `&paused=1` for a render-only pass, or `&zoom=0.6` / `&preset=performance` to override the defaults.

The harness unwraps a backup envelope, stores the save on the harness origin, and lets the built game boot through its own `load()` / `validExpeditionSave` path (the same check the in-game import uses after the confirm dialog). If the game rejects the file, the harness stops and reports the recovery screen. It does not start a new world over the rejected file.

Headless:

```
node run-headless.mjs --scene fixture --fixture day-80.json --seconds 10 --repeat 1
```

(`--fixture` is appended to the harness URL as `fixture=`.)
