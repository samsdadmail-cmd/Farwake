# Immersive homes — handover (CP1)

Branch `grok/immersive-homes`, based on `living-colony-experience-overhaul` at `f3a09e27eea2c6f02a1484e17db64a43da075904`. Draft PR targets that branch. Do not merge to `main` or change deploy config.

## Architecture

- `home-visit.js` (`FarwakeHomeVisit`) is a view. It does not write the save or invent occupants.
- Enter: tap a finished home with beds and a door (`selectTap`), or `FARWAKE_TEST.homeEnter(id)`.
- Flow: save camera → pan/zoom to `FarwakeDoors.portalFor` → fade/iris → full-screen canvas. Exit reverses and assigns the saved `{x,y,z}` exactly.
- While the interior is up, colony chrome is hidden (`body.in-home`) and the world `draw()` is skipped. Simulation still ticks.
- Static plate, floor extension, day glass and vignette are cached. Per frame is a blit plus a small night flicker.
- Plate is `interior-home.webp` (768×432), nearest-neighbour, integer device scale (4× on a 390×844 @3x phone). Portrait crop is centred on the chairs and window (`FOCUS_X`).
- Occupancy for the info card is `FarwakeDoors.occupants`. Nobody is drawn yet. `residents()` is the CP2 hook (between plate and furniture-front stamps).

## What works (CP1)

- Entering the camp (or any finished bed building with a door) opens a full-screen interior, not the facility inspector.
- Leave and an info card (name, clock, real “inside now” list). Safe-area offsets on the controls.
- Night uses the painted window. Day recolors glass pixels and adds a sun.
- Foreground below the plate is mirrored aisle planks, not a cloned rug.
- Evidence: `docs/immersive-homes/evidence/cp1-day.png`, `cp1-night.png`, `cp1-ui.png` (390×844 @3x).

## Incomplete

- No resident sprites, poses, depth sort, or furniture occlusion (CP2).
- Enter/exit is implemented but not recorded (CP3). No Playwright enter/exit test yet.
- Full suites (`npm test`, `npm run test:suites`) have not been run on this branch.
- `build.py --check` was run after the `src/game.html` edits; re-run it before merge.

## Known issues

- Day glass can still read as a moon plus a sun. The recolor does not replace the whole night vista cleanly.
- The lower third is generated floorboards. The bunks, desk and stove are outside the portrait crop.
- All homes share one plate. Camp, shelter, cabin, dormitory and outpost use it.
- Info card is not the bed-assignment UI. That stays on the facility sheet, opened from Colony, not from the map tap.

## Merge notes

- New file `home-visit.js`, script tag in `src/game.html`, `experience.css` rules, regenerated `index.html`.
- No save-format change. `vercel.json` untouched.
- Map tap on a finished home enters the interior instead of selecting it for the inspector.

## Next

1. CP1 review from Kyle and Atlas.
2. CP2: pixel residents from `coat` / `hair` / `hue` / role, posed from the real task (`rest` sleep, `eat`, `craft` tinker, `research`/`life_home` read, otherwise sit). Stamp chair arms, table and bunk rails after the bodies.
3. CP3: recording of enter, a real shared idle moment, and exit with the camera restored. Then the Playwright test and suite counts versus `f3a09e27`.
