# FARWAKE playtest hotfix integration notes

Branch: `playtest-hotfixes` (forked from `visual-rebirth-rc`).
Separate concurrent work: `living-world-rc` may be developing animations/audio/interaction.
Do not merge by replacing `index.html` wholesale: review and port changes with a three-way merge or selectively cherry-pick, preserving Living World's code.

## Completed on this branch
- Emergency "Move 10 out" inventory action creates physical outdoor reserve piles so full storage cannot permanently block timber delivery. Reserved piles are excluded from automatic hauling; they can be released manually.
- Added guaranteed accessible starter mineral outcrops for newly generated maps and older compatible saves without previously injected starter outcrops.
- Surveyors can target reachable fog frontier locations rather than repeated random fixed-ring goals.
- World menu displays discovered ore count, a "Locate mapped ore" camera focus action, and "Prioritize exploring" for the Surveyor.
- Manual exploration preference overrides automatic build and hauling task acquisition so the assigned Surveyor can actually survey.

## Still required for the larger construction & management update
- Drag-to-build path routes with cost previews, automatic adjacency/corners, multi-tile confirmation, deletion/edit.
- Demolish, move and cancel buildings safely; resource refund/recovery, housing and storage consequences.
- Full production policies and caps, per-material storage filters/priorities, production pause, robust overflow and resource conservation.
- Residence assignments, occupancy HUD, indoor states with real semantics.
- Production cycles with visible stages and actual workers.
- Guide/help, modern resource UI, survey overlays and persistent exploration controls.
- Expanded meaningful research and progression pacing.

## Verification requirements
- JS inline scripts were syntax-checked; Vercel preview deployed READY.
- Actual interactive browser gameplay tests for these hotfixes still required before merging.
- Test old existing saves: storage full, ore exhausted, held reserve piles across save/reload, Surveyor with no reachable frontier, and no duplication of resources.
- Preserve save schema `v:3` and the existing storage key.
- Keep production `main` unchanged until user approval.

When integrating, use the newer Living World branch as the destination. Keep Work's visual/animation changes; port the hotfix behaviors instead of overwriting its game file.
