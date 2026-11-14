# E3-A — environmental composition, awaiting creative review

Runtime/source: `0db55188655ca4b6f02ae53c345ff9100671161b`.
Base preserved: `aac35525bf56b82c04d6e619f9dc3fde5f763676`.
Branch: `home-composition-checkpoint`; draft PR #25. E3-B is NOT started.

[Pinned playable preview](https://farwake-founders-3047ypz3p-atlas-8c31.vercel.app/)
[Passing source CI](https://github.com/samsdadmail-cmd/Farwake/actions/runs/43505471639)

## Actual gameplay evidence

- [Day, 390×844](day-390.png), [night, 390×844](night-390.png).
- [E2 versus E3-A, day](e2-vs-e3-a-day.png), [night](e2-vs-e3-a-night.png).
- WebKit captures and per-engine state/profile JSON are retained alongside these.

Running index.html, actual imported historical `tests/fixtures/home-composition-day58.json`,
eight real residents. Camera x=825.6, y=1008, zoom=1; same camera as E2.
Chromium Day 58 at 11:40 and 20:39. WebKit day is 11:41 due to startup timing;
night is 20:39. Night reached through normal simulation ticks, not occupancy grants.
Homes #7 and #55 are genuinely awake; supply 52 versus demand 51.
The frame is paused for still captures. No buildings, tasks, resources or attendance
were fabricated. Comparisons retain all pixels at 1:1 and add only labels/margins.
E2 baseline is committed evidence at `89edf76a200879275d249db16e5d0f5fff455072`.

Archive 14076420818 from source CI was downloaded and its SHA256 verified:
`5f306c07f5528e235629a2541663e8d2ca4a067b43450370d37f7f33d71c04fc`.
Full original browser recordings (including setup) remain in that CI artifact;
they are not represented as polished uninterrupted gameplay deliverables here.

## Visual inspection and focused correction

Recognisable shrubs, rocks, lichen and wetland reeds replace E2's tiny grass marks.
Shore edges are smoother, and clear access ground connects real reachable doors.
Footprints, collision, resources, routing and progression are unchanged.
One clear presentation defect was corrected: separately composited translucent path
segment caps produced bright knots. Each stroke width now draws the whole network
once, eliminating accumulated junction alpha without changing routes.

Observed tradeoffs for Kyle/Atlas review: flora is finer and busier than the blockier
architecture; repeated shrub/outcrop silhouettes remain recognisable in open ground.
Dressing follows a jittered sampling grid plus spatial noise, rather than unique
hand-authored planting. Shore proximity and terrain guide sprite categories; moisture
currently influences the ground palette, not a comprehensive ecological simulation.
Paths remain strongly orthogonal. Peripheral old terrain and the pilot's feathered
boundary remain visible. No claim of definitive reference fidelity or creative approval.

## Verification and rendering costs

Six browser checks passed: environment/read-only profile, paired day/night and touch
geometry, and real 1× neighbourhood movement, each in Chromium and WebKit.
Build/source consistency, content, migration/recovery, housing, lamplight,
neighbourhood, home-resident and Aya-gait checks also passed in source CI.
This focused run does not rerun all 78 historical E2 browser checks.
Local Chromium could not launch because its socket was blocked by the execution
environment; all delivered screenshots come from the successful CI browsers.

| Desktop CI proxy | Chromium | WebKit |
| --- | ---: | ---: |
| Initial terrain bake | 47.4 ms | 121 ms |
| 60 paused draws, median / p95 | 0.4 / 1.4 ms | 1 / 1 ms |
| Maximum paused draw | 56.8 ms | 2 ms |
| 300 district prepare calls, p95 | 0.1 ms | 0 ms* |
| Maximum district prepare | 0.1 ms | 1 ms |

*WebKit timing is coarse; zero means below measurement resolution, not free work.
The cache baked once and holds 495,616 pixels (~1.9 MiB RGBA), excluding the atlas.
Building influence now uses 7,921 lattice points and interpolation rather than
E2's building scan per ground sample (up to 92,416 sample points before masking).
These counts are not an equivalent full-performance benchmark across builds.
District membership still scans buildings/builds a signature each draw. Its cost was
small in this eight-resident colony, so no speculative cache rewrite was added.
Synchronous baking can hitch; Chromium's isolated draw outlier remains unexplained.
Measurements exclude full simulation/GPU completion and do not establish sustained
performance, physical iPhone smoothness or large-colony behaviour.

## Review boundary and open issues

Stop for Kyle/Atlas's E3-A creative approval or correction before E3-B.
No world-wide rollout, extra asset categories, main merge or production promotion.
SAVE-EXPORT-01, physical iPhone performance, large-colony frame-time spikes,
landscape blending, specialist character rigs, continuous indoor transitions and
wider interface redesign remain OPEN in `../../TECHNICAL_ISSUES.md`.
