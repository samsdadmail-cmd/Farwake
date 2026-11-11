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
