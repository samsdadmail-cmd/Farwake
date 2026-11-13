# Outstanding technical verification

## SAVE-EXPORT-01 — delivered file not yet verified

Status: **OPEN / unverified**, 13 November 2026. Do not infer successful delivery
from the game's “backup prepared” notification.

Actual UI export was retried on the pinned A1 build after importing the unmodified
Day-58 progression save into the isolated QA key. The notification appeared, but
the Cloud Browser download observer timed out. Its internal downloads page was
blocked by the browser URL policy; no alternate browser surface or bypass was used.

This evidence does not distinguish a browser-observer limitation from a delivery
problem. Import and automated save/load protections passed, but those do not prove
manual export file delivery. Keep the issue open until a downloaded JSON file is
obtained, validated and successfully imported through the actual transfer controls.
Physical iPhone Files delivery also needs Kyle's verification. Retain the original
export unchanged; never overwrite it for this test.


## E3-A review carry-forward — 13 November 2026

These remain OPEN; the environmental checkpoint does not resolve them:

- Physical iPhone performance and usability; desktop Chromium/WebKit are proxies.
- Large-colony frame-time spikes and sustained 5/20/40-resident profiling.
- Landscape composition blending.
- Specialist exterior character rigs and activity identity continuity.
- Continuous indoor character navigation and furniture transitions.
- Wider contextual interface redesign, including dialogue and drawers.

E3-A performance review: district membership still filters buildings and constructs
its signature every draw; no claim of eliminating that cost. Environmental ground
uses one 704×704 cache. Building influence is evaluated on an 8-world-pixel lattice
(7,921 samples) and interpolated, replacing the prior per-ground-sample building
scan. Cache rebuilding remains synchronous and can cause a hitch. Terrain/feature
mutation invalidation and larger-colony behaviour are not comprehensively verified
by the eight-resident visual review. SAVE-EXPORT-01 above remains open.
