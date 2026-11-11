# Beyond the Frontier checkpoint

Branch beyond-the-frontier-rc starts at Foundations 368c2c0.

Verified first vertical slice: a connected seven-branch, five-era technology tree; locked/available/studying/completed states; actual researcher effort; technology unlocks a sawmill; crew builds it; physically delivered timber becomes boards; boards unlock and fund cabin construction. Existing research survives migration.

The 18 new artwork plates and building definitions are present. Their full gameplay integration is ongoing. Do not describe all building definitions as finished gameplay.

Next: residential capacities, new store and power types, actual meal consumption, community routines, controlled immigration, upgrade work, persistent history, planetary site choices and the main interface redesign. Then run regression, migration and mobile checks before final review.

Second vertical slice verified in the actual browser: crews construct five processors, deliver recipe inputs, produce water/meals/boards/metal/components/panels, construct a glasshouse, cabin, lodge, freight depot and accumulator, and deliver/consume prepared meals. Housing beds, storage capacity, energy capacity and production save/load pass. Food access now includes physical outdoor piles when stores are empty. Recipe changes reject an active batch and refund pending deliveries safely.

Upgrade orders, community visits and controlled arrivals are implemented but still require their dedicated integration tests. Persistent history and Hearth rendering are being integrated; planetary discovery and the wider interface remain unfinished.

Town development tests pass: physical cabin expansion, added permanent capacity, autonomous community visits, deliberate one-settler invitation with a real home, three-tile constructed-road preview and worker construction, persistent upgrade/history state and day/night rendering. Fixed nonresidential upgrades incorrectly adding beds. Roads connect to stone paths, use composite panels and increase travel speed; upgraded clinics extend service/recovery.

History/Hearth integration verified: nighttime residents physically enter their assigned expanded homes; door occupancy reports actual resting occupants; indoor time only accumulates while inside; rainy-night save/load retains it. Rendering uses persistent age, work, occupancy, harvest and street-traffic counters for cached development details. Occupied heated homes emit chimney smoke; windows use actual occupants, rest dimming and silhouettes. Real community visits support one restrained evening break. Lanterns depend on grid availability. Existing Living World weather/audio controls remain intact; expanded building-specific audio is still pending.

Planetary vertical slice passes: deterministic reachable sites, survey discovery, actual Surveyor travel and study/recovery choice, physical finite core rewards, duplicate-reward prevention, outpost construction extending investigation reach, finite underground seam investigation/extraction, advanced observatory construction and powered staff alignment. Discoveries/extraction/project completion survive loading. Industry/planet integration tests seed research and supplies to isolate systems; they do not certify complete fresh-colony pacing.

## Recovery, 11 November 2026
Remote baseline verified at 37745f1, five implementation commits after Foundations 368c2c0. The exact later UI survived locally: compact HUD/Research navigation, illustrated catalogue/detail/chain previews, Command Center hero and facility rows, inspector artwork, research branch shortcuts and responsive layouts. Recovered new-building door admissions were also missing from the remote baseline.

Current browser UI suite passes 375×667, 390×844, 430×932 and 844×390. The prior branch-scroll failure inspected a hidden legacy research tree; assertions now scope the visible sheet and require nonzero dimensions. Current syntax check passes on the generated bundle. Other subsystem tests must be rerun after recovery.

GitHub issue #4 records implementation ownership and Studio QA requests. No specialist branches or overlapping proposals existed at inspection. No deployment authorized: branch-specific Vercel deployment suppression committed in d533431. Do not remove it without Kyle’s approval.

Next: live inspector integration, parallel-research protection, current regression suites and fresh-colony progression. The recovered UI is a priority deliverable, not deferred work.

## Recovery integration checkpoint
Recovered UI committed as ca7ac88. The twelve-suite regression runner passed legacy export/import, editing, housing/farming/workshop, full-store conservation, Command, research, integration, new technology/industry/town/planet and mobile UI against the recovery build. Current cloud Chromium 5/20/40-agent median tick/motion/canvas submissions were 0.7/1.1/1.7 ms; these are short cloud samples, not physical iPhone FPS.

A fresh expedition test grants no materials, technology, achievements or colonists. It reached component production around Day 15 after finding and fixing genuine shortages and grid lockups. New finite surface geology is generated once and persisted (frontier schema version 2 inside compatible v3 saves): sixteen nine-ore outcrops, existing harvested IDs preserved. Five seeds passed actual mining (+9 physical ore), no duplication on reload and permanent depletion. New-colony ore targets are sensible; existing targets are preserved.

Workshops can choose available unlocked inputs automatically, with an explicit manual override. Dedicated smelting also unlocks casting refined metal into alloy. Manual recipe choices survive migration. Paused production releases demand; automatic frontier grid standby prioritizes food/water facilities, prevents a new factory disabling the whole economy and resumes when power permits. Research cannot overwrite an active study; stopping study refunds only its unused knowledge. New inspectors gain live production facts and real worker assignment controls. Field Guide expanded with the implemented chains and discoveries.

The final combined regressions and extended fresh-colony/endgame balance remain in progress. No deployment or production merge performed.
