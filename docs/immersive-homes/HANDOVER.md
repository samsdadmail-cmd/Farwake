# Immersive homes — handover

Draft PR: https://github.com/samsdadmail-cmd/Farwake/pull/24
Branch: `grok/immersive-homes`
Base: `living-colony-experience-overhaul` at `f3a09e27eea2c6f02a1484e17db64a43da075904`
Code and CP1 screenshots: `991ec2276f5c664bb18b001274b744ec2c5869d1`
This handover is the commit after that. After it is pushed, PR #24’s head is the preservation SHA. Do not merge. Do not touch `living-colony-experience-overhaul` directly, `main`, or `vercel.json`.

Preview (Vercel built this branch on its own): https://farwake-founders-git-grok-immersive-homes-atlas-8c31.vercel.app

Evidence, already committed:

- `docs/immersive-homes/evidence/cp1-day.png`
- `docs/immersive-homes/evidence/cp1-night.png`
- `docs/immersive-homes/evidence/cp1-ui.png`

Captured at 390×844, device scale 3. No full test suite has been run on this branch.

## Architecture

The interior is a view. It does not change the save format or invent people.

### Files

- `home-visit.js` — `window.FarwakeHomeVisit`. Loaded from `src/game.html` before the game script. Not inlined by `build.py`.
- `src/game.html` — overlay markup, tap-to-enter, camera lock while the visit owns the camera, skip world `draw()` while inside, `FarwakeHomeVisit.bind(...)`, and `FARWAKE_TEST.homeEnter` / `homeExit` / `homePhase` / `homeSavedCamera`.
- `index.html` — `build.py` output of `src/game.html` plus the `.inc.js` modules. Regenerate with `python3 build.py` and check with `python3 build.py --check`.
- `experience.css` — `body.in-home` hides colony chrome. `.homevisit`, Leave, info, and the card.
- `interior-home.webp` — existing 768×432 plate. Unchanged.
- `interiors.js` — old inspector cutaway. Still used by `showBuilding`. Not the enter-home view.
- `doors.js` — `FarwakeDoors.occupants` and `portalFor`. Unchanged. Occupancy is still `visit.stage === 'inside'` and `task.type === visit.job`.

### Render layers

Cached together when size, crop, day/night, weather, or awake-occupancy changes. Each frame blits that cache. At night a small lamp flicker is drawn on top. `imageSmoothingEnabled` is false. On a 390×844 @3x phone the scale is 4 device pixels per source pixel, so the visible window is about 292 source pixels wide. `FOCUS_X` (368) centres that window on the chairs.

1. Flat wood fill.
2. Plate cropped to y 8–422 (drops the black border).
3. A few rows of ceiling sampled from the beams.
4. Generated aisle planks from y 422 to the bottom of the phone (mirrored 72×44 swatch at source 688,374). This is the floor Kyle and Atlas rejected.
5. Day only: `dayGlass` recolors blue glass pixels and paints a sun. Night keeps the original window.
6. Night dim wash, then warm radial glows. Day gets a cool window glow.
7. Vignette in device pixels.
8. Residents are not drawn. `paint` leaves an empty hook and `residents()` returns placeholder hits. Furniture-front stamps are not implemented.

HTML sits above the canvas: Leave, the “i” button, `#homecard`.

### Enter / exit and camera restore

`enter(id)` refuses unless the phase is `idle` and the building is finished and has `portalFor`.

1. Copy `{x, y, z}` into `saved`.
2. `approach`: ease the exterior camera to the door, `(portal.x * 32, (portal.y - 0.05) * 32)`, zoom `2.05`. Map pan and pinch are ignored while `ownsCamera()` is true.
3. `cover`: show the overlay, fade to black.
4. `reveal`: iris opens. `body.in-home` hides the top bar, nav, save button, inspector, and sheet. World `draw()` is skipped. `tick` still runs.
5. `inside`.

`exit()`:

1. `close`: iris shuts.
2. `restore`: hide the overlay, ease the camera from the door back toward `saved`.
3. On the last frame, assign `camera.x/y/z` from `saved` exactly.

Escape and Leave both call `exit()`. A map tap enters only when `b.finished && housingBeds(b) && FarwakeBuildings.entrance(b)`. That skips the inspector. The Colony facility sheet still calls `showBuilding`.

### State-to-pose plan (not built)

Draw only `FarwakeDoors.occupants` for this building. Use the same `coat`, `hair`, `hue`, and role marks as `people.js` (Engineer brass cap, Surveyor brim, Medic band, Biologist lock). No extra people.

| Real state | Pose |
| --- | --- |
| `task.type === 'rest'` | Sleep on a bunk, then a bedroll if the bunks are full. Blanket and a small z. |
| `eat` | Sit, bowl, hand toward the mouth. |
| `craft`, or `life_quiet` with `p.life.interest === 'tinkering'` | Sit at the stool, tool motion. |
| `research`, `align`, `investigate`, `life_home` | Sit and read. Page turn. |
| `haul_dropoff` | Stand. |
| Anything else indoors | Sit. |
| Two awake occupants, both in sit or read, neither working a job | Same two chairs, a small lean toward each other. |

Draw back-to-front by anchor y. After each body, stamp the source-image pixels that should cover it: chair arms and seat front, table top, bunk rail or blanket, desk lip. Cache those stamps. Idle motion is breathing, a page, a hand, or the blanket. Skip it when `FieldPreferences.reduced` is set.

## Current functionality

- Enter a finished home from a map tap or `FARWAKE_TEST.homeEnter(id)`.
- Full-screen canvas, colony UI hidden, Leave and an info card. The card uses the real clock and the real occupant list. An empty home says nobody is home.
- Night shows the painted moon window and warm light. Day attempts a sun.
- Exit returns the previous camera exactly.
- CP1 screenshots are in `docs/immersive-homes/evidence/`.

## Known bugs

- The portrait crop plus the plank fill does not show the original cutaway. Bunks, desk, and stove are outside the frame. The bottom of the phone is generated boards.
- Day and night are wrong together: the moon survives the recolor and a sun is added beside it (`cp1-day.png`).
- Leave / “i” / the card read as a temporary overlay, not a finished interior UI.
- No residents, so the room cannot show sitting, standing, reading, tinkering, or sleeping.
- One plate is used for camp, shelter, cabin, dormitory, and outpost.
- `npm test` and `npm run test:suites` were not run. `build.py --check` passed when `index.html` was regenerated for the game.html edits. `home-visit.js` is a separate script, so later edits there do not require a rebuild unless `src/game.html` changes.

## Unfinished work

- CP1 fixes below. Do these before any new feature.
- Checkpoint 2 residents, poses, and occlusion.
- Checkpoint 3: a short recording of enter, a real shared moment, and exit, plus a Playwright test that enters, sees the interior, exits, and checks the camera. Then suite counts against `f3a09e27`.
- No save migration. Do not add required save fields.

## Outstanding requirements (Kyle and Atlas, CP1)

1. Restore the original cutaway-room composition.
2. Remove the excessive generated floorboards.
3. Redesign the outdated interior UI.
4. Fix the day/night sky. By day there must not be a moon beside the sun.
5. Checkpoint 2: convincing pixel-art residents that match their exterior identities, with real-state sitting, standing, reading, tinkering, and sleeping, and furniture occlusion.

## Next agent

1. Stay on `grok/immersive-homes`. Do not push `living-colony-experience-overhaul` or `main`. Do not edit `vercel.json`. Do not merge.
2. Read this file and the three CP1 images. Open the preview above on a 390×844 viewport.
3. In `home-visit.js` `measure()` and `compose()`, frame the 768×432 plate so the whole cutaway reads (bunks, window, chairs, desk). Delete `fillFloor`’s tall plank field. A few pixels of matching floor are enough if the plate does not cover the screen. Do not letterbox it inside the old inspector.
4. Replace `dayGlass` so daytime glass has no moon. Night should keep the painted night window and warm lamps only.
5. Restyle Leave and the info affordance in `experience.css` so they are not the current gold-on-black chips. Keep them minimal, 44px targets, and inside the safe area.
6. Only after those four are visible in new screenshots, draw residents in the hook inside `paint`, using the pose table above and image stamps for occlusion.
7. If `src/game.html` changes, run `python3 build.py` and `python3 build.py --check`.
8. Commit and push to `grok/immersive-homes` only. Update PR #24. Leave it a draft until Kyle says otherwise.
