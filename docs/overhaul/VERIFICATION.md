# Experience overhaul — verification record

## Recovered failures

The resumed checkpoint was f69659873b63a41d84df364af09b23a75377e51d.
Its legacy economy assertion was a genuine integration defect: explicit personal
standby (all seven work lanes disabled) could acquire a new daytime idle pause.
`lifeDirectedStandby` now blocks and interrupts it. The aggregate regression page
failed because it included that same economy suite; it was not a second gameplay
fault. Failed suites now retain their full nested assertion logs.

Moving leisure to more believable perimeter positions changed deterministic
travel/production timing. The fresh progression fixture's funding deadline ended
at seven alloy while production and hauling still advanced; allowing real round
trips reaches the fabricator on Day 15. The extended player-policy driver now
pauses optional alloy consumers while retaining a construction reserve, after
making any components/panels required by the same blueprint. It resumes those
plants after construction. No stocks, research, people or completion rewards are
granted. This is an automation policy, not a free-resource workaround.

A new rendered gallery timed out awaiting a room image because its explicit draw
clock went backwards after social screenshots. Its timestamps are now monotonic,
so lazy loading starts before awaiting the image. Live preview room loading was
independently inspected.

An additional interruption audit found that Build first prevented a new leisure
choice but did not release an already attended evening. Eligible builders/haulers
now leave that optional activity at the bounded life update. The session cancels
without a reward; disabled personal work lanes remain protected.

## Visual review executed

A fresh 390×844 staging colony ran for 300.20 real seconds without menus. The
recorder sampled 601 times: harvest, research, survey, idle, pickup and dropoff;
411 frames/ticks, no recorded error or context loss. Many workers travelled beyond
the starting camera. This verifies an unattended run, not five minutes of uniformly
interesting visible action or physical iPhone speed. The cloud browser's roughly
one-Hz frame delivery makes wall-clock FPS and game-clock pace unrepresentative.

Separately inspected actual rendered scenes in the labelled evening fixture:
perimeter destinations, kneeling plant interaction, equipment handling, sky pose,
seated conversation; Aya/Ivo greeting, sharing, goodbye and reciprocal memories
only after completion. No rewards were inserted. Inspected furnished home with
Aya/Tomas actually inside, reading/unwinding and sleeping, rain, portrait and
landscape drawers, live character intention, construction catalogue and costs.
Compared the previous pinned preview: full-width bars and modal metric-heavy
profile versus edge HUD, context drawer and person-first inspection.

## Performance proxy, a444de2

Software Chromium, iPhone-sized viewport, 74 warm synchronous samples per case.
These are CPU submission times, not full-frame GPU timings or physical device FPS.
The 124-building scene and populations above five are synthetic.

| Layout | People | Tick median / p95 / max ms | Presentation + draw median / p95 / max ms |
| --- | ---: | --- | --- |
| Early, 3 buildings | 5 | 0 / 0.1 / 0.3 | 0.3 / 1.2 / 70.1 |
| Early | 20 | 0 / 0.3 / 0.6 | 0.6 / 46.9 / 53.2 |
| Early | 40 | 0 / 0.2 / 1.0 | 0.8 / 34.2 / 36.7 |
| Mature, 124 buildings | 5 | 0.7 / 1.0 / 1.3 | 1.5 / 29.6 / 30.6 |
| Mature | 20 | 4.3 / 4.7 / 36.5 | 1.5 / 28.3 / 29.0 |
| Mature | 40 | 20.1 / 22.2 / 55.0 | 1.9 / 27.2 / 28.5 |

The pathfinder reuses typed buffers and no longer allocates neighbour arrays per
expanded cell. This removes a known source of allocation pressure. These short
samples do not establish that historical synthetic late-colony 0.5–1.7-second
hitches are eliminated. Mature 40-person simulation alone exceeds a 60-FPS CPU
budget in this sample. Real Safari heat, memory pressure and sustained performance
remain Kyle's physical playtest gate.

## Scope and creative limits

The UI shell/navigation, character inspection, activity rig, social scene phases,
portable scene props, home cutaways, staggered routine thresholds, occupancy light,
construction stages and contextual production guidance are rebuilt or extended.
The existing terrain, vegetation, weather, building library, industrial effects and
audio foundation are retained and integrated rather than wholly replaced art.
Home rooms are authored cutaways, not navigable interiors. Several home types share
one authored room with state-driven inhabitants and lighting; workplaces/camp use
procedural rooms. Furniture is presentation, not a newly simulated inventory.
Friendship remains early familiarity, without romance/families or full hobby trees.
Creative acceptance belongs to Kyle and Atlas; green automation is not that verdict.

Final exact-build CI and organic-journey results are recorded in the PR handover.
