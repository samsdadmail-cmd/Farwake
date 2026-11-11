# Beyond the Frontier — combined release candidate

11 November 2026. Branch `farwake/combined/rc1`, draft PR #18. No production merge or deployment.

## Integrated changes

- `365cd22`: merge #20 once, including its #19 ancestor. Access-blocked blueprints no longer monopolize builders/haulers; reserved materials remain recoverable. Newer/corrupt/foreign-writer saves are protected. Auto-deployment is held on the combined branch.
- `c201aa6`: whole-batch stock targets fix the 48/50-metal deadlock. Real smelting now consumes four delivered ore and yields five metal, crossing 50 before stopping. Building/recipe costs are unchanged. The inspector explains full-batch targets.
- Workshop failures #14–15 were stale stored-only assertions. Tests now reconcile the fixture ledger and verify production plus physical alloy in stores, piles and cargo. Both are required tests; #16 also has no expected-failure escape hatch.
- The full organic journey is now required. It retains its complete log and save/live checkpoint under ignored `test-results/` for diagnosis rather than silent repeated reruns.

## Executed verification

| Check | Result |
| --- | --- |
| `python build.py --check`, `git diff --check` | PASS |
| Node housing, fixture sanity, frontier content, survival | PASS |
| Chromium headless suite | 22 PASS; includes strict old-save round trips/imports, v3 migration, newer/corrupt protection, 600-tick smoke and delivered-ore batch-boundary regression |
| Legacy browser suite | 19 PASS, 0 FAIL; no known failures suppressed |
| Organic expedition | Required suite completes Observatory/alignment and saves/loads eight housed residents without resource or research grants |
| Systems save guard | 10/10 assertions PASS |
| Systems access recovery | 14/14 assertions PASS; reachable shelter finishes on Day 2, blocked turbine retains reserves, 64 save-key/writer-key writes and zero runaway lot IDs |
| iPhone-sized UI | Catalogue/research/inspectors/dashboard/survey/audio checks pass at 375×667, 390×844, 430×932 and 844×390 in Chromium |

## Performance and limits

Same-host sequential late-colony benchmarks, Chromium 153, 390×844/DPR3, 4× CPU throttle, one 15-second run each: #18 baseline median 21.5 ms / p95 918.2 ms / max 1343.4 ms; candidate 22.9 / 926.3 / 1258.0 ms. No material new regression is established by this small sample. Both exhibit severe existing synthetic large-colony hitches; this is not a 60-FPS claim. See `docs/perf/RC_COMPARISON.json` for raw reports. Small-colony candidate measurements were median 2.7 ms (day) and 2.8 ms (paused).

WebKit could not launch: its binary is unavailable in this environment (download attempts returned invalid/truncated archives). Physical iPhone Safari, GPU/memory/thermal behavior and long-term all-seed balance remain unverified. Earlier organic execution stalled on an extra wind-turbine build after Observatory construction; two subsequent organic executions completed. That intermittent late construction delay is not isolated or claimed fixed; the required journey gate and saved diagnostics expose recurrence.

The root save remains v3 and the existing key is retained. No v4 migration was introduced. Old pages without the new guard cannot retroactively be made safe; export a backup before switching builds. Preview is for review only, never approval to replace production.

## CI follow-up: run 43101777899

Atlas independently found the required journey failing after the warehouse: supply 34 / demand 32, metal 2 / ore 3. The scripted director requested another 10-metal turbine for three spare power before ordering finite-seam extraction. Faster CI and random founder needs changed which reserves were left at that point. The journey now investigates/works the seam and establishes the actual rig before further population/logistics expansion. Existing surface metal can legitimately fund the rig; hand-extraction depletion is required when that bootstrap is needed, and actual powered rig depletion remains mandatory in every journey.

Founder starting needs now use the expedition seed; existing saved needs are untouched. Field dispatch and survey retry cadence use simulation time instead of host wall time. A regression compares 6,000 identical ticks under opposite random sources and different wall clocks and requires equal mechanical state.

The runner also had a false-success window: the fresh phase reports COMPLETE while the full journey is still running. Journey completion now requires the exact COMPLETE ORGANIC JOURNEY marker, with FAILED still terminating immediately. The required journey is not skipped or marked known-failing. CI uploads its log and save/live checkpoint even on failure.

Executed locally after this fix: 23 Chromium headless tests; source/build equality, housing, fixture sanity, content and survival checks passed. The focused full journey reached the actual listening-array objective on Day 57 with save/load. Remote CI results are recorded in PR #18 after the new commit runs; earlier c1cfb6d local results were not sufficient to establish CI success.

## P0 #21 investigation — unresolved

The physical iPhone permanent early-colony freeze is not reproduced or explained yet. Do not approve release. A real requestAnimationFrame-loop QA test now runs an unattended six-minute virtual session at the normal speed control's 3x setting through two nights, crops/construction, periodic UI, audio and autosaves, then reloads the same isolated save. Chromium completed with continuing frame/tick heartbeats, bounded writes/canvas creation and no exceptions. This is not proof of physical iPhone safety.

Freeze instrumentation records frame phase (tick/presentation/draw/UI/save), heartbeat counts, save count, maximum phase times, canvas backing dimensions, optional Chromium heap, audio/visibility and deliberate save-protection pauses. Unhandled errors are retained in a separate diagnostic key across restart. `?diagnostics=1` adds one local heartbeat write per ten seconds; ordinary healthy play adds no diagnostic storage writes. Game & Save -> Export diagnostics downloads the current/previous fault record. No automatic reload, swallowed exception, changed task system or save-schema migration is introduced. CI retains unattended test artifacts on success/failure.

Next: inspect WebKit CI endurance results, then reproduce on the actual affected iPhone/browser/preview origin and capture the exported diagnostic record. Infinite loop, WebKit process/memory loss, frame exception and deliberate cross-tab save protection remain competing explanations. No speculative root-cause fix is claimed.
