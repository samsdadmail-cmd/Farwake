# Living Colony experience overhaul — playtest guide

This branch extends the rejected Phase 1 candidate. PR #22 and its pinned preview
remain the fallback. Do not merge this draft or promote staging to production.

## Bring an existing colony safely

1. Open the preview where the colony currently lives. Use Game & Save → Export
   Save and keep the JSON in Files. Keep a second untouched copy.
2. If that colony migrated from v3, separately export **original v3 recovery copy**
   on the origin where migration happened. The browser-local recovery record is
   not embedded in an ordinary v4 export.
3. Open the exact overhaul preview. Its hostname has separate browser storage;
   the colony will not automatically follow you. Use Expedition · Save → Import
   Save. Export any colony already there before accepting replacement.
4. Check the seed, day, people, buildings, stocks and research. Save, reload, and
   check again before continuing the colony. Keep the originals until satisfied.
5. Continue on one tab at a time. If writer protection appears, close the other
   tab and reload; do not clear browser storage to bypass it.

Root save format remains v4. Supported v3 imports retain the verified original
recovery-copy migration. Poses, short daytime pauses, art assets and UI layout add
no new persistent format. Unfinished meetings cancel on reload without granting a
reward. Memories, companions and place attachments retain their existing bounds.
Older Beyond builds reject v4; return to those with the original v3 recovery file.
A browser storage failure or incompatible import must be resolved without deleting
or editing the original save.

## Physical iPhone session

Use Safari first, then optionally Add to Home Screen. This is physical acceptance,
not something the desktop Chromium/WebKit checks establish.

- Spend five real minutes watching a fed, functioning settlement with menus closed.
  Watch work destinations as well as homes. Pan/zoom enough to keep the people in
  view. Look for meaningful movement, tool use, carrying, different leisure poses,
  and quiet moments rather than synchronized standing.
- Observe roughly 17:30–20:30. Founders start at different times. Watch a pair walk,
  acknowledge each other, settle, interact, say goodbye and leave. Then inspect the
  memories. An interrupted or missed meeting must not earn friendship.
- Look for Tomas handling equipment, Mira kneeling by plants, Nell watching the
  sky, and companions seated together. Rain should discourage outdoor leisure.
- Tap a home in the evening. Compare empty, awake and sleeping occupancy. The room
  must show the people actually inside; it must not invent a conversation.
- Build something. Check costs, placement nudges, confirmation, material delivery,
  foundation/frame/shell stages and completion. Interrupt leisure with priority
  construction and check that hunger and cargo still take precedence.
- Open People, a profile, its responsibility disclosure, Research, Colony, stocks,
  production and Save. Repeat in portrait and landscape, including scrolling to
  the bottom of drawers. Try larger text and Reduced Motion.
- Run at 1× and 3×, pan, select terrain, mark a tree/deposit, pause, save, reload,
  and continue. Repeat with a mature colony if available. Look for heat, repeated
  hitches, stalled people, crashes or a permanently frozen frame.
- If a problem occurs, export diagnostics and the colony backup. Note orientation,
  speed, visual preset, iPhone model, Safari version, day/time and the last action.

Use Balanced first; compare Performance if a mature colony hitches. Do not infer
that lowering visual detail resolves simulation costs.

## Review fixtures

`tests/experience-review.html` runs a separate QA save namespace. Its labelled
fed/evening, reachable-home and synthetic-population controls are demonstrations
and diagnostics, not evidence of organic progression or player-device FPS.
“Advance simulation 5s” executes the actual planner, pathfinding and attendance
logic. No relationship reward is added by the control. The five-minute recorder
uses real elapsed time and reports tasks, phases, health and actual memories.
