# Baseline findings

Observed on `farwake/integration` at `37745f1` while adding CI, the headless smoke boot, and the v3 fixtures. Game files owned by issue #4 were not edited. `python3 build.py` produced no diff in `index.html`.

## Housing test

`node tests/housing.cjs` used to throw `ReferenceError: FRONTIER_BUILDINGS is not defined` at `housingPermanent` in `housing.inc.js`, called from `housingAllocate`.

The harness only evaluates `buildings.js`, `doors.js`, and `housing.inc.js`. `FRONTIER_BUILDINGS` is created in `frontier.inc.js`, which the page loads and this sandbox does not. On `origin/foundations-command-center`, `housingBeds` still used a shelter/camp ternary and the same file passed. The integration copy reads the frontier table for permanent beds, temporary outposts, and comfort.

The sandbox now sets `FRONTIER_BUILDINGS` to `{}`. Shelter still has 3 beds and the camp still has 5, which is what the assertions check. The file passes again. No game file was changed.

## Issue #4 risks

### Frontier door admission

`doors.js` admits a job only when the building type is in its `activities` map: shelter and camp rest, shed haul/eat, workshop craft, lander research, clinic treat. `frontier-art.js` still draws entrances for cabin, dormitory, kitchen, sawmill, smelter, fabricator, dining, recreation, warehouse, outpost, and observatory.

A Chromium probe on the live page:

- A shelter rest route is created.
- A cabin has an entrance and `FarwakeDoors.portalFor` returns a portal.
- Rest, craft, and haul routes for cabin, dormitory, kitchen, sawmill, dining, warehouse, outpost, and observatory are all empty.

`frontier-town.html` builds a cabin, upgrades it, and then fails `nighttime resident physically enters their expanded home`. The resident never reaches `visit.stage === 'inside'`. That matches the missing activity entry. Roads, the upgrade, the invite, and save/load of the cabin got further and passed. Proposed follow-up: extend `activities` in `doors.js` for those authored interiors. That file is owned by issue #4.

### Technology-tree scrolling

Issue #4 says the prior browser UI suite failed on tree-branch scrolling. On this baseline the integration suite opens Research and checks `sheet.scrollWidth` at 375×667, 390×844, 430×932, and 844×390. That suite passed, including those fit checks.

A separate Chromium measurement at 390×844, after opening Research:

- 7 branch labels
- sheet `scrollWidth` 388 and `clientWidth` 388
- `.tech-viewport` `scrollWidth` 1295 and `clientWidth` 348

The board is wider than the phone and scrolls inside the viewport. The sheet itself did not grow. WebKit ran the same script and passed the 7-branch assertion. This run did not reproduce a sheet-level overflow, and it did not drag the tree. The UI failure that does reproduce is the stores ledger, below.

### Fresh-colony progression

Not certified. The smoke boot advances 600 ticks on a fresh landing and checks for console errors. It does not play through to the listening array.

The late fixture is an unseeded crew session: day 3, goal 3, finished shelter, garden, solar array, and workshop, research `growth` and `energy`, five garden harvests, four discovered sites, a full 340-unit cache, and carried food plus alloy. It does not build the observatory or finish the signal.

`frontier-planet.html` passed, and it seeds optics, food, and fog before the surveyor moves. `frontier-tech.html` and `frontier-industry.html` also passed and they provision the colony. Those results are not a fresh-expedition certification. Physical iPhone 14 Safari was not run.

## Legacy `verify*` suites

`node tests/run-browser-suites.mjs` stages disposable copies with `tests/prepare-foundations.py` and `tests/prepare-visual-check.py`, then opens each harness in headless Chromium. Eleven suites are required in CI. Three known failures carry placeholder ids. A known suite that starts passing fails the run so the entry is removed.

| Harness | Result | Note |
| --- | ---: | --- |
| `editor.html` | pass | 0.3s |
| `production.html` | pass | Staffed workshop, crops, reload |
| `economy.html` | pass | Full-store reserves, evacuation, reload |
| `command.html` | pass | Phone widths, guide search, cache filters |
| `integration.html` | pass | Layout fit, including Research, and indoor reload |
| `foundations.html` | pass | Living World import, backup, ore, survey |
| `frontier-tech.html` | pass | Study, sawmill, cabin, v3 reload |
| `frontier-industry.html` | pass | Depot, meals, accumulator, reload |
| `frontier-planet.html` | pass | Seeded sites, rig, observatory alignment |
| `research.html` | pass | Study completion, not an instant unlock |
| `candidate.html` | pass | Catalog and ledger counts come from the live building and resource lists |
| `frontier-town.html` | fail | Upgraded cabin resident never goes inside. [#13](https://github.com/samsdadmail-cmd/Farwake/issues/13) |
| `living.html` | fail | Engineer enters the workshop; alloy does not rise. [#14](https://github.com/samsdadmail-cmd/Farwake/issues/14) |
| `check.html` | fail | Visual checks pass, then the same alloy failure. [#15](https://github.com/samsdadmail-cmd/Farwake/issues/15) |

`tests/visual-rebirth.js` checks that every founding blueprint and every `FRONTIER_BUILDINGS` id is in the catalog, and that the ledger has one row per resource key other than knowledge. Extra cards from a new founding blueprint do not fail that check. Energy research is started from the technology tree and finished with `frontierStudy`. The headless baseline probe only checks that the catalog and the branch list are non-empty, so a UI change on those screens does not fail the required Playwright job.

`production.html` passing is the stronger signal for workshop output. `living.html` is an older setup that writes `resources` directly and then waits 16 simulated seconds.

## Other gaps

- `save()` does not look at the key before writing. A live v3 page overwrites a `v: 4` blob. Details and the proposed guard are in `SAVE_VERSIONING.md`.
- Load-time `freightInit` and `frontierMigrate` rewrite a save with no backup. Import does keep a backup. There is no button that restores it.
- Research knowledge accumulates from lander study, and technologies are not purchased unless something calls `frontierBeginResearch`. The late fixture had to start `growth` and `energy` on purpose.
- Smoke and save tests disable nothing in the smoke boot. Both Chromium and WebKit loaded `index.html`, saw `window.FARWAKE_TEST`, advanced 600 ticks plus `advanceWorld`, drew periodically, and reported no console errors or page errors.

The versioning design no longer keeps the v3 storage key for v4 saves. A running v3 tab still overwrites that key. See `SAVE_VERSIONING.md`.

## Game-code follow-ups

These need an owner on the files from issue #4. They are not done here.

1. Teach `doors.js` which jobs each frontier interior admits, using the entrances already in `frontier-art.js`.
2. Issue [#16](https://github.com/samsdadmail-cmd/Farwake/issues/16) tracks the new save key, the read-before-write guard, and the newer-expedition lock in `SAVE_VERSIONING.md`. That guard is not in the game yet.
3. Decide whether `tests/living-check.js` should call `freightInit` after it pokes resources. The engineer does enter the workshop. Alloy does not rise inside that check's window. `production.html` still passes staffed alloy production.
