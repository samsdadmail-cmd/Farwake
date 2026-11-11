# Foundations & Command Center release candidate

This candidate builds on Living World at c479104. The static game now assembles from src/game.html and six focused simulation and interface modules. Run python build.py after editing source. The committed index.html remains directly deployable.

## Construction and settlement editing

- Build contains dedicated route, path removal and rectangle designation tools. Strokes use four-connected tiles, show their combined cost and require confirmation. Retracing trims a route. Pan mode and two-finger zoom preserve camera control.
- Finished paths connect to adjacent paths with corners and intersections. Workers haul the reserved paving before constructing each tile.
- A finished structure can be dismantled or relocated. A crew member performs dismantling before a new reconstruction site appears. The crew must then rebuild it. Reserved destinations block conflicting placement.
- Cancelling an unpaid-work blueprint releases its real reserved lots and recovers delivered supplies. Completed buildings recover half their original materials, rounded down per material. Paths return all paving.
- Residents leave an address being dismantled. Store contents move into physical outdoor lots. The lander, starting cache and camp remain protected expedition infrastructure.
- Enterable structures have explicit entrance metadata. Pallets, solar arrays, gardens, paths, batteries and beacons have no interior portal. Old saves with pallet visits recover the worker and carried cargo outdoors.

## Housing and production

- Prefab homes provide three permanent beds. The camp provides five temporary bunks. Founders automatically retain or acquire valid beds, with manual assignment and household swaps in profiles.
- Permanent beds improve real indoor rest and morale. People without beds rest outdoors at a lower recovery rate. An operating clinic within eight tiles improves rest recovery by 20 percent.
- Gardens run planting, germination, tending, growth and harvest stages. Growing stages advance independently, while planting, tending and harvesting require work. The artwork shows the crop's current stage.
- Workshops consume real inputs and produce physical output lots. Basic smelting uses two ore and one salvage per alloy. Reclamation uses six salvage per alloy. Precision casting requires metallurgy and produces two alloy from three ore and one salvage.
- Facilities expose production stages, progress, throughput, assigned workers, pause and recipe controls.

## Economy and autonomy

- Each store owns an inventory account reconciled to the existing resource totals. Incoming filters and preferred destinations govern hauler selection. Construction reserves material into site-specific lots with priority delivery.
- Goods can remain outside when stores are full. Held reserves retain their release controls. Produced goods start outdoors for hauling. Interrupted deliveries retain or safely drop their actual cargo.
- Colony and personal work priorities control seven job groups. Food, alloy, timber, ore and salvage targets affect real gathering and production. Manual facility assignments constrain worker selection.
- Inspectors explain missing inputs, power deficits, paused jobs, target limits and construction deliveries. Logistics shows storage capacity, outside/carrying counts and produced/consumed totals for the current day.

## Command Center and Field Guide

- The Command Center presents population, beds, wellbeing, food, power, construction, survey progress and urgent conditions. It links directly to logistics, work, people, research, survey and the searchable guide.
- Facility management includes current workers, actual indoor occupants, production, resident capacity, storage settings and settlement-edit controls.
- The Field Guide covers implemented systems and supports category and multiword search. Facility inspectors link to relevant help.
- Charcoal, ivory and brass styling, pixel-art catalog illustrations, mobile layout, sound settings and Living World's effects remain integrated.

## Research and surveying

- Five additional technologies add longer survey range, faster crop growth, efficient alloy production, solar tracking and faster survey travel.
- Technology gates include actual surveys, harvests, manufacturing batches and required colony infrastructure. Already researched technologies remain researched on import.
- Batteries now store surplus generation and discharge into deficits. Additional objectives follow the signal beacon through landmark discovery and advanced industrial technology.
- Survey sectors direct real scout destinations. Mapped resource markers and camera focus locate finite deposits. Reachability diagnostics explain stalled surveys.
- Starter ore is recorded and restored consistently on load. Harvested IDs remain exhausted.

## Save handling

Version 3 and the existing storage key remain supported. Legacy unfinished construction is treated as already paid. Full warehouses, held reserves, cargo, household assignments, production records, filters and construction site stocks survive loading.

A real import regression was corrected. After an imported backup was written, the departing colony's pagehide handler could save over it. Import now guards that departing save, and retains the previous colony as a recovery backup. Invalid existing saves open recovery instead of silently generating and saving a new colony.

## Verified checks

The managed Chromium browser passed seven suites against the assembled candidate.

| Suite | Verified behavior |
| --- | --- |
| Editing | Touch route corner, total costs, material delivery, crew construction, path dismantling/refund, home relocation/rebuild, site cancellation, area orders |
| Housing and production | Camp/permanent capacity, manual bed swap, rest benefit, all crop stages and yield, staffed workshop inputs/output, pause, targets, reload |
| Economy | Full-store expansion, reserved physical lots, filters, preferred delivery, reserves, evacuation across reload, exact salvage and disabled work groups |
| Command | Eight management views at 375×667, 390×844, 430×932 and 844×390, live target control, multiword guide search, cache filters |
| Progression | Accomplishment gates, metallurgy unlock, survey optics, charging/discharging, solar tracking, post-beacon objectives, saved energy |
| Integration | 5/20/40 founders, work/motion/render submission, all management layouts, actual nighttime home use and indoor reload |
| Migration | Authentic Living World export/import, replaced-colony backup, full warehouse, held reserves, paid unfinished site, five world seeds, persistent depleted ore and actual frontier discovery |

The synthetic Chromium sample measured median tick, visual update and Canvas command submission at 0.80 ms for 5 founders, 1.20 ms for 20 and 1.50 ms for 40 across twenty warm samples. This is not full-frame or sustained phone performance.

To repeat, run python tests/prepare-foundations.py --directory <empty-qa-directory>, serve that directory's dist on a disposable origin, and open /foundations.html, /editor.html, /production.html, /economy.html, /command.html, /research.html and /integration.html.

## Remaining limitations

- Physical iPhone Safari audio, sustained frame rate, temperature and battery usage require device testing.
- Workshop inputs are withdrawn from the accepting stores' pooled usable inventory. Output and construction supplies are hauled physically. A separate per-workshop input-delivery system is future work.
- Relocation represents a dismantled building as its reserved reconstruction site. It does not animate packed building modules travelling between the two sites.
- Storage preferences route incoming hauling. Existing contents are not automatically rebalanced between stores solely because a preference changes.
- Directed exploration uses nine survey sectors. It does not yet offer freehand survey polygons.
- This release adds five technologies and two post-founding objectives. Diplomacy, migration, families and generational simulation remain future development.
