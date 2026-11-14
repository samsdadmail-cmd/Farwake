# Experience-quality priorities after Aya continuity

**Assessment only: none of these five proposals has been implemented.** Ranking
weighs expected player impact against effort for one bounded pilot. Complexity is
engineering judgment, not an hours estimate or an approved roadmap.

My first creative choice is **one readable shared encounter**. FARWAKE already
simulates more personal life than its physical presentation communicates. More
buildings would not close that gap. The logistics economy already creates useful
tradeoffs; resource thresholds are not inherently bad design. Release gates still
override creative ranking.

| Rank / area | Concrete improvement | Existing systems and evidence | Complexity | Player-facing impact |
| --- | --- | --- | --- | --- |
| **1. Visible colonist life** | Review one genuine two-person encounter with a readable greeting, alternating speaker/listener gestures and goodbye, with captions hidden at normal phone zoom. | `lifeEncounterPhase/lifeTick` already verify attendance and interruptions; `lifeView` exposes look, progress and familiarity; `lifeSceneDraw` supplies attended props. Current speaking gestures use wall time/resident ID rather than a shared speaking turn. | **Medium:** a few coordinated poses for one reviewed pair and session-driven presentation. No new social scheduler. | **Very high:** the settlement becomes understandable and interesting to watch. |
| **2. Reliability** | Demonstrate an actual backup round trip: download JSON, validate it and import it into a separate preview/device while preserving the original. Repair only a reproduced defect. | Existing export/import controls, original recovery copies and foreign-writer protection. Save/load tests do not prove delivery; SAVE-EXPORT-01 remains open. | **Small–medium investigation; repair unknown.** | **High risk reduction:** players can preserve/move their colony. This is a release gate. |
| **3. Meaningful progression** | Give one mineral-site Study/Recover choice a persistent tradeoff: Study preserves the fuller finite seam; Recover front-loads components but sacrifices some future ore. Explain it before commitment. | Saved `site.choice`, finite `remaining` ore, extraction, knowledge and components already exist. Currently both options preserve a core and the same 180-ore seam; rewards mainly differ numerically. Many research gates count batches, stock or buildings. | **Small–medium:** reuse existing fields/UI/extraction, balance two viable choices and test old saves. | **High decision value:** an expedition affects future logistics, rather than merely advancing another threshold. It is a bounded economic improvement, not a complete mystery/story system. |
| **4. Household individuality** | Pilot one home's reading/project corner reflecting a genuinely completed routine at that address, recognisable when its occupant goes out. | Actual home/visit occupancy, building-linked memories/counts, place attachment and companion bonds. The inspected Day-58 Aya profile records eight shared evenings with Ivo and home memories. Current cutaway props are shared. | **Medium:** one visual mapping/art treatment plus an explicit persistence rule. Memories cap at eight and places at four; they are not a household archive. | **Medium–high emotional value:** the home feels inhabited by particular people. Do not infer romance, cohabitation or inventory from a companion bond. |
| **5. World coherence** | Refine one district-to-wilderness boundary: match ground treatment, contact shadows and visual density, then judge the entire phone composition. | Bounded district membership and cached ecology/architecture/light plates already exist. E3 gameplay shows broad ground fields, peripheral blending differences, repeated roof courses and simple silhouettes. | **Medium**, including cache-invalidation/cold-bake checks. One transition, no renderer restart or art catalogue. | **Medium–high visual value:** better scene hierarchy. Extra roof variants alone will not achieve it. |

## Release blockers versus tracked refinement

**Block a broader release:** demonstrated save loss, failed recovery, broken core
management/entry, reproducible normal-play freezes, or unreliable backup delivery.
File delivery is currently **unverified**, not a demonstrated corruption bug.
Validate the actual colony sizes and speeds the release promises.

**Partial device evidence:** Kyle reports ordinary physical-iPhone play felt stable
and found the activity-sprite regression. Record that positive feedback; sustained
play, higher speeds, larger colonies, complete usability and Files delivery remain
outstanding. Desktop WebKit cannot replace them.

**Retain investigation:** earlier WebKit measurements found one 197 ms synchronous
draw outlier and a separate 616 ms gap mostly outside the callback. Neither proves
an OS-only delay or a fixed game defect. Repeated freezes/poor supported-device
responsiveness would block release; isolated outliers do not justify a renderer rewrite.

**Can remain tracked for a bounded preview:** the approximately 102 ms cold bake,
roof repetition, peripheral blending, specialist-pose polish and continuous indoor
navigation. Reclassify them if real play shows repeated stalls or unusable controls.
Forty-resident support needs forty-resident evidence before making that claim.

## Evidence

Code: [routines/memories](../../life.inc.js), [people](../../people.js),
[Aya](../../home-resident.js), [home visits](../../home-visit.js),
[progression/sites](../../frontier.inc.js), [district](../../neighbourhood.js),
[transfer controls](../../src/game.html).
Gameplay: retained [E3-C captures](evidence/overworld-e3-c/README.md), current saved-
colony browser inspection and separate Aya checkpoint evidence.
Technical limits: [readiness assessment](E3_INTEGRATION_READINESS.md).

No economy, relationship, research, household or environmental implementation was
added alongside the Aya correction. Stop for Kyle & Atlas's next creative decision.
