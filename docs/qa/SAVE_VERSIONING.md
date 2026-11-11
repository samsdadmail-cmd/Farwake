# Save versioning

Design only. This document audits the expedition save on `farwake/integration` at `37745f1` and proposes ordered migrations plus a downgrade guard. No migration code is included. Implementation waits for Kyle's approval. Issue #4 asked QA to audit v3 migration, import, full stores, and carrying independently of the game-code owners. The fixtures and browser checks behind this audit live in `tests/fixtures/saves/` and `tests/headless/saves.spec.js`.

## Storage

The expedition is one JSON object in `localStorage` under `farwake_founders_alpha03_v1`. The constant is `SAVE` in `src/game.html`. Device preferences use a different key, `farwake_living_preferences`, and are not part of the expedition blob.

Import keeps the previous expedition under `farwake_founders_alpha03_v1_before_import_<timestamp>`. Nothing in the UI restores that key. A player can export it only by copying it out of `localStorage` or by importing a file they already have.

The schema field is `v`. `validExpeditionSave` accepts only `v === 3`. Frontier data has its own counters inside the blob (`frontier.version` and `frontier.worldVersion`, both `1` on a current save). Those counters are not the expedition schema.

## Where the blob is written

`save()` returns immediately when `S` is missing or `importedNavigation` is true. Otherwise it writes:

- a shallow copy of `S`
- each colonist with `path` cleared, `task` set to `null`, `action` set to `0`, and `indoorStay` set from `FarwakeDoors.saveVisit`
- `fog` as `0`/`1` values, length `56 * 56`
- `uid`

`visit` is not stripped. A mid-game fixture written by `save()` still contains `visit` objects for people who were inside the lander. `load()` then calls `FarwakeDoors.restore`, which deletes `visit`, and `FarwakeDoors.resume`, which rebuilds an indoor visit from `indoorStay` when the building still admits that job.

Writers:

- `initial()` at the end of a new world
- the frame loop, when accumulated frame time passes 12 seconds
- `pagehide`
- `visibilitychange` when the document becomes hidden
- explicit calls from building, research, hauling, editing, housing assignment, import/export, and frontier actions

## Where the blob is read

Startup is the only automatic reader:

```text
if (!load()) {
  if (localStorage has SAVE) show "Expedition needs recovery" and set importedNavigation
  else initial('FW-10402')
}
```

`load()` parses the key, rejects it unless `validExpeditionSave` passes, then mutates the object in memory. A failed `load()` does not write. Recovery sets `importedNavigation`, so the later `pagehide` does not replace the rejected payload with a new world. A headless check planted a `v: 4` document, reloaded, saw the recovery sheet, and read the same string back.

`importExpeditionFile` is the other reader. It parses a file, unwraps a backup envelope, validates, asks for confirmation, copies the current key to a `_before_import_` backup, writes the new payload, sets `importedNavigation`, and reloads. The flag is what stops the departing page from saving the old colony over the import. The headless import test replaces a fresh landing with the mid-game fixture and finds the fresh seed in the backup, with no finished shelter in that backup.

## Validation

`validExpeditionSave` requires:

- a non-array object with `v === 3`
- `seed` a string of length 1 to 100
- `day` a finite number at least 1
- `minute` a finite number in `[0, 1440)`
- `resources` an object
- `colonists` an array of length 1 to 100, each with finite `x`/`y` and a string `name`
- `buildings` an array of length at most 10000, each with finite `x`/`y`/`w`/`h` and a string `type`
- `fog` an array of length `56 * 56`

It does not check stock, cargo, research ids, frontier sites, or unknown extra fields. A file larger than 5 MiB is rejected before parsing. JSON that fails to parse, or a document that fails the checks above, shows a toast and does not replace the current key. The incompatible-import test covers that.

Export writes an envelope, not the raw blob:

```json
{
  "format": "farwake-expedition-backup",
  "formatVersion": 1,
  "exportedAt": "<ISO timestamp>",
  "save": { "v": 3 }
}
```

Import accepts either that envelope or a raw v3 object.

## What a current v3 save contains

These keys were present on the fixtures generated from this build. `save()` persists whatever is on `S`, so a short game can omit `freightFlow` until the first freight event.

| Field | Role |
| --- | --- |
| `v`, `seed`, `day`, `minute`, `uid` | Identity and clock. Fresh landing uses seed `FW-10402`, day 1, minute just after 07:20. |
| `resources` | Founding totals (`scrap`, `wood`, `ore`, `alloy`, `food`, `knowledge`) plus frontier goods (`boards`, `metal`, `components`, `composite`, `water`, `meals`, `relic`). `knowledge` is not warehouse stock. |
| `colonists` | Identity, needs, `home`, `carry`, `indoorStay`, and sometimes `visit`. `task` and `path` are cleared on write. |
| `buildings` | Geometry, `progress`, `finished`, `stock` on stores, `history`, and `production` once a workshop or garden has run. |
| `piles` | Ground lots: `id`, `x`, `y`, `kind`, `amount`, and optional `hold`, `site`, or similar flags. |
| `designations`, `harvested` | Field work and exhausted feature ids. |
| `events` | At most 50 log lines. |
| `research` | Completed technology ids. An in-progress study lives at `frontier.research`, not in this array. |
| `frontier` | `version`, `worldVersion`, `produced`, `sites`, `socialVisits`, `arrivals`, plus later fields such as `research`, `alignment`, `signalComplete`. Eight sites are seeded. |
| `industry` | `targets`, `weights`, `harvests`, `batches`. |
| `freightFlow` | Today's produced and consumed counts. Absent until the first flow. |
| `gridCharge` | Battery charge. `0` on a fresh landing. |
| `goal`, `weather`, `weatherClock`, `explore` | Objective step and survey progress. |
| `ruin`, `starterOre`, `oreStarterChecked` | Map landmarks and the starter-ore guarantee. |
| `fog` | 3136 explored flags. |

`frontierMigrate()` fills missing frontier resources, industry targets, and sites. It does not bump `v`. `freightInit()` runs on every successful load and again from `initial()`.

## Load-time migration that already happens

There is no migration table. Two functions rewrite a v3 blob in memory, and the next autosave persists the rewrite.

`frontierMigrate()`:

- creates `S.frontier` when it is missing (`version: 1`, empty `produced` and `sites`)
- defaults frontier resource keys to `0` and adds their industry targets
- sets `frontier.version` to `1`
- calls `frontierSeedSites()`, which returns immediately once `worldVersion` is set, otherwise places up to eight sites and sets `worldVersion` to `1`

A headless test deleted `frontier`, `industry`, `freightFlow`, `gridCharge`, and the frontier resource keys from the fresh fixture. The reload did not open recovery. After load, `frontier.version` was `1`, `worldVersion` was `1`, sites were non-empty, `resources.boards` was `0`, and the industry targets included `boards: 80` and `water: 60`.

`freightInit()`:

- treats an unfinished building with no `reservedMaterials` as already paid, copying `TYPES[type].cost` into both `reservedMaterials` and `siteStock`
- reconciles each store's `stock` to `resources`
- if the resource total is above capacity, spills the surplus into an outdoor pile and subtracts it from `resources`

A path blueprint with `progress: 1.5`, `finished: false`, and no `reservedMaterials` reloaded as still unfinished, with `reservedMaterials` and `siteStock` both `{scrap: 1}`.

`load()` also restores fog, drops designations whose features are gone, runs `guaranteeStartingOre()`, sends indoor visitors outside and then resumes `indoorStay`, and reallocates beds.

There is no backup before these mutations. The first autosave after a successful load commits them. Import is the only path that copies the previous payload first.

## Full stores and carrying

Warehouse capacity for the starting cache is 340. `stored` totals and per-store `stock` are the same goods, not two supplies. Cargo on a colonist is not part of `resources` or `stock`.

The late fixture was produced by finishing a shelter, garden, solar array, and workshop, then setting food and scrap so their sum equalled capacity and calling `freightInit()`. It reloaded with stock `{scrap: 170, food: 170}` and the other warehouse goods at `0`. Two ground food piles and two carried loads survived that reload:

- Aya Mercer, Commander, `{kind: 'food', amount: 3, dest: 2}`
- Tomas Venn, Engineer, `{kind: 'alloy', amount: 4}`

The alloy is only in his hands. The warehouse alloy total stayed `0`, so the carried units were not folded into the full store and were not deleted. The mid fixture keeps Nell Ardent carrying `{kind: 'wood', amount: 6}` with warehouse wood still `40`. `load()` uses `p.carry ??= null`, so an existing carry is kept while a missing carry becomes `null`.

`foundations.html` also passed its older full-store, held-reserve, and carried-good checks against a staged copy of this build, including an authentic Living World export imported into the candidate.

## Why a downgrade can still destroy a newer save

Rejecting `v !== 3` at startup is a partial guard. This build will not overwrite a `v: 4` blob that is already in `localStorage` when the page opens. It will overwrite one if a running v3 page calls `save()` afterward.

A Chromium probe wrote `{v: 4, marker: 'newer-than-this-build'}` into the key while a v3 expedition was in memory, then called `FARWAKE_TEST.save()`. The stored version afterwards was `3`. `save()` does not read the key before writing. That is the cross-tab hole: tab A is an older build with a colony in memory, tab B writes a newer blob, tab A's `pagehide` or 12-second autosave replaces it.

The same hole exists for two copies that both claim `v: 3`. Frontier goods, sites, industry targets, and store accounts were added without bumping `v`. `origin/foundations-command-center` also requires `v === 3` and its `save()` also spreads `S`. It will load a current blob. If its load throws, recovery saves the payload. If its load succeeds, its next `save()` can drop or reinterpret fields it does not understand, especially store accounts and building types that did not exist then. A new field on an unchanged `v` does not protect older binaries that are already shipped.

## Proposed design

A stamp on the same key does not protect a newer save. This build, and every older build, only refuses `v !== 3` when the page is opening. QA reproduced the rest of the hole on the current binary: after a v3 page is already running, `save()`, a `visibilitychange` while hidden, `pagehide`, and the 12-second autosave each replace a `v: 4` blob that was written into `farwake_founders_alpha03_v1`. Those writers never read the key first. Shipping `v: 4` on that same key would still lose the newer expedition to any v3 tab that was already open.

v4 therefore writes a new key and does not write the old one again.

| Key | Who writes it |
| --- | --- |
| `farwake_founders_alpha03_v1` | v3 builds only. A v4 build reads it once, during migration, and then never writes it. That string stays as the automatic v3 backup. |
| `farwake_expedition_v4` | The v4 build's live expedition. Later schemas use `farwake_expedition_vN` for that build's `SAVE_VERSION`, or keep this key and rely on the read-before-write guard below. The guard is required either way. |
| `farwake_founders_alpha03_v1_migrated_<stamp>` | A second copy of the pre-migration string, made because an already-open v3 tab can still overwrite the original key. Old code does not know this name, so that tab cannot reach it. |

Preferences stay on `farwake_living_preferences`.

### Startup

Read the live key for this build (`farwake_expedition_v4` once that is the current schema).

1. Missing key, and no v3 key either: start a new expedition and write only the live key.
2. Missing live key, v3 key present: migrate that string in memory (below), write the result to the live key, and leave `farwake_founders_alpha03_v1` byte-for-byte as it was. Also copy that raw string to the `migrated_<stamp>` key before any in-memory change.
3. Live key present: classify it before any write.

Classification of a stored string:

- **Unparseable.** `JSON.parse` throws, the value is empty, or the result is not a plain object. This is corruption, not a newer save. Do not write the key. Do not call `initial()`. Show the existing recovery sheet, with the download button, and set the do-not-save flag. The raw string stays so the player can export it.
- **Parseable, `v` not a finite number, or `v` less than 3, or the document fails validation after a migration step.** Same corrupt recovery. Do not guess a version and do not overwrite.
- **Parseable, `v` a finite number greater than `SAVE_VERSION`.** Newer expedition. Do not write. Enter the lock below. This is not the corrupt-save sheet: the file is readable and belongs to a newer build.
- **Parseable, `v` equal to `SAVE_VERSION`, and validation passes.** Load it.
- **Parseable, `v` less than `SAVE_VERSION` but at least 3.** Run the ordered migrations, then write only the live key.

### Ordered migrations

```text
const MIGRATIONS = [
  { from: 3, to: 4, run(save) { /* pure: return the next document */ } }
];
```

Rules:

1. Each step reads `from` and returns `to === from + 1`. Steps run in that order until `save.v` equals the build's `SAVE_VERSION`.
2. A step is a pure function. It must not write `localStorage`, and it must not close over live game globals that change between calls.
3. Unknown fields are copied through. A migration may rename or default a field. It may not drop a key it does not recognize.
4. `frontierMigrate` and the "unfinished blueprint counts as paid" rule become explicit steps, or stay as idempotent load normalization that does not change totals. `freightInit` spilling surplus out of a store is a behavior change and has to be a numbered step the first time it ships, with the pre-step blob backed up.
5. Seeding sites stays inside the step that introduced them, and it must keep the current `worldVersion` guard so a second load does not move sites.
6. The v3 to v4 step copies the current fields and sets `v` to 4. That stamp is not what stops old builds. The new key is what stops them. Old builds never look at `farwake_expedition_v4`.

If a step throws, do not write the live key. The v3 key and the `migrated_<stamp>` copy are already the pre-step text. Set the do-not-save flag and show recovery. Do not autosave a half-migrated object.

### Read-before-write guard, v4 and later

This guard applies to the live key only. v4 code has no writer for `farwake_founders_alpha03_v1`.

After a successful load, remember `loadedStamp`. Every attempt to save, including `pagehide`, hidden `visibilitychange`, and the 12-second autosave, does this first:

1. Read the live key.
2. Unparseable, empty, or not a plain object: do not write. Enter the corrupt recovery lock.
3. `stored.v` is a finite number greater than `SAVE_VERSION`: do not write. Enter the newer-expedition lock.
4. `stored.stamp` is present and is neither `loadedStamp` nor the stamp this page last wrote: another tab owns the key. Do not write. Enter the newer-expedition lock. The other document may be the same version; the player still has progress that this tab must not discard.
5. Otherwise write the live key with `v: SAVE_VERSION` and a new `stamp`.

### Newer-expedition lock

The lock is a sheet titled "Newer expedition", separate from "Expedition needs recovery". It names the stored version and this build's version, offers the download button for the stored string, and has no "start a new world" action.

Entering the lock:

- Sets the do-not-save flag checked by `save()`, `pagehide`, `visibilitychange`, and the frame autosave.
- Stops the frame loop. The colony on screen is paused. Further ticks do not run, because those ticks would be progress the game can no longer keep.
- Leaves both keys unchanged.

`window` listens for `storage`. That event fires in the other tabs when one tab writes `localStorage`. If `event.key` is the live key, or the v3 key while a migration is in progress, the listener re-reads that string and runs the same classification. A newer version, a foreign stamp, or an unparseable write enters the matching lock immediately. The tab does not wait for the next autosave and then drop the player's work on the floor.

The same listener is how a v4 tab notices a second v4 tab. It is not how a v3 tab is stopped. A v3 tab has no listener and no new-key writer. Its saves can still replace `farwake_founders_alpha03_v1`. They cannot replace `farwake_expedition_v4` or the `migrated_<stamp>` copy.

### What this design does not do

It does not change builds that are already installed. Those builds keep writing the v3 key only. A v3 tab that is open during migration can still overwrite that one key. The live expedition and the `migrated_<stamp>` copy are the records it cannot reach.

It does not add a one-click restore. The player re-imports a downloaded backup. The keys have to exist first.

It does not change `farwake_living_preferences`.

## Suggested tests once Kyle approves an implementation

- A v3 fixture is migrated onto `farwake_expedition_v4`, and `farwake_founders_alpha03_v1` is byte-for-byte unchanged. A second load does not move sites or change stock totals.
- An unparseable live key opens corrupt recovery, and `pagehide` leaves the raw string in place.
- A live key with `v` above this build opens the newer-expedition sheet, the frame loop is stopped, and `save()`, hidden `visibilitychange`, and `pagehide` leave the string in place.
- A `storage` event for the live key with a higher `v` enters that same lock without a reload.
- A thrown migration does not write the live key.
- The full-store and carried-alloy fixtures in `tests/fixtures/saves/` still reload without recovery.
