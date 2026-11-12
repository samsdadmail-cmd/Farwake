# Living Colony — Phase 1: An Evening Together

Baseline: Beyond RC `7ba8ce8`. Development: `living-colony-evening`.

## Play this milestone

Continue an existing colony or begin a new expedition. From 17:30 to 20:30,
colonists who have eaten and rested choose a short personal activity after their
current job completes. No new building or technology is required. Watch near
camp, homes, grow beds and community facilities. Tap a person for their actual
intention; the profile has a small expandable people/places/memories section.
Rain encourages indoor time. After a completed evening, colonists head home
from 20:00 when their next safe task boundary is reached.

Founder traits influence choice: company, personal equipment, growing things,
quiet skies and familiar places. Accepted meetings reserve two adjacent places.
Only joint attendance advances the meeting. Completed meetings create reciprocal
familiarity and bounded memories; pleasant visits build a small place preference.
Three shared evenings make someone a familiar companion. This is an acquaintance
foundation, not a complete relationship simulation.

## Architecture and invariants

- `life.inc.js`: simulation-time choices, bounded sessions, memories, place and
  companion preferences. Uses existing planner, pathfinding, task execution and beds.
- `people.js`, `moments.js`, `doors.js`: presentation and real indoor permissions.
  Dialogue/camera/render quality never determine social outcomes.
- Meals, cargo, production, construction and work priorities retain their existing
  accounting. Carried supplies are delivered first. New breaks wait behind urgent
  construction and never cancel an active batch, harvest or building task.
- At most one completed leisure experience per person per day. Per person caps:
  8 memories, 4 favourite places, 8 companion records. No social autosave storm.
- An uncompleted shared meeting is canceled on reload and may be arranged again;
  no partial meeting reward is invented. Actual indoor home activity resumes via
  the existing door save/resume mechanism.

## Save safety

Root version 4; versions 3 and 4 can be imported. `save-migration.js` was tested
and committed before enabling the format change. An exact original v3 copy is
written and verified before upgrade. Failure or collision refuses the upgrade.
Game & Save exports this original copy on the preview where migration occurred.
Export it separately before moving a v4 colony to another preview; browser-local
recovery copies do not travel inside the colony export. Existing recovery, multi-tab and
read-before-write protections remain in place. Older Beyond builds reject v4;
use the original recovery export when returning to them.

## Verification and limits

The dedicated browser suite tests completed/failed meetings, hunger, unavailable
venues, real place choice, daily caps, repeated familiarity, indoor reloads,
untouched first-colony work, presentation independence, recovery failure and
390×844 / 844×390 / 375×667 touch interactions. Existing CI and organic journey
remain required. Exact executed results belong in the PR handover.

Physical iPhone performance and longer hands-on balance remain review gates;
software Chromium/WebKit are proxies. No romance, families, interiors, recruiting
redesign, broad schedules or new hobby progression were added in Phase 1.
Production and the Beyond preview must remain unchanged.

## Visual direction

The approved cozy-room reference guides warmth, personal objects, readable shared
moments and the contrast with the alien outdoors. Phase 1 expresses that through
real activity poses/props, facing companions, and occupancy-driven home light.
`lifeView` is a simulation-backed presentation adapter: a later cutaway renderer
can consume the same activity/companion state without creating decorative lives.
Detailed rooms and the larger atmospheric science-fiction UI remain future work.
