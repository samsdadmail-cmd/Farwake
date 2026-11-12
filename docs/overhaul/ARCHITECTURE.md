# Living Colony experience overhaul

Creative acceptance of c3657ff was rejected after Kyle's physical iPhone playtest.
Baseline c3657ff and PR #22 remain recovery references. New branch:
living-colony-experience-overhaul. No production deployment or main merge.

## Audit and design

Reuse: deterministic simulation, pathfinding/door routes, genuine attended social
sessions, bounded memories, production/freight accounting, housing, v4 recovery.
Replace: stacked historical UI styles and dashboard shell; generic leisure sprite
presentation; synchronized evening thresholds; numerical-first person inspection.
Extend: activity places, encounter phases, physical props, inhabited-home rendering,
occupancy lighting, world atmosphere and need/work animation.

The UI becomes an edge HUD over a full viewport world, a compact tool dock, and
contextual drawers. Save controls remain directly discoverable. Existing gameplay
actions keep their handlers while screens receive a coherent hierarchy.

Animation is a presentation adapter with per-person transient pose state. Simulation
chooses valid locations and advances encounter phases; rendering consumes those
facts and never awards memories. All shared rewards require actual joint attendance.
Use existing walkable perimeter tiles; props are portable mats/tools/seats, never
new invisible pathfinding obstacles. Interiors show actual occupants, not invented
visitors. No v4 semantic replacement or new root format is planned.

## Validation gates

Build equality; v3 recovery/v4 roundtrip; completed and interrupted meetings;
construction/food/economy/progression; terrain/frame-loop regressions; Chromium and
WebKit; iPhone portrait/landscape; rendered observations, including five real minutes;
5/20/40-person profiling. Creative acceptance remains Kyle's. Record actual executed
checks and limits rather than treating green tests as proof of beauty.
