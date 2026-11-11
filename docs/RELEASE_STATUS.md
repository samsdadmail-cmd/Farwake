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
