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
- Wider contextual interaction/readability beyond the conditionally approved E3-C field HUD, captions and drawers; E3-C does not resolve all screens.

E3-A performance review: district membership still filters buildings and constructs
its signature every draw; no claim of eliminating that cost. Environmental ground
uses one 704×704 cache. Building influence is evaluated on an 8-world-pixel lattice
(7,921 samples) and interpolated, replacing the prior per-ground-sample building
scan. Cache rebuilding remains synchronous and can cause a hitch. Terrain/feature
mutation invalidation and larger-colony behaviour are not comprehensively verified
by the eight-resident visual review. SAVE-EXPORT-01 above remains open.

## E3-C integration readiness — 14 November 2026

Conditional creative approval covers the neighbourhood foundation only. These
requirements remain explicit and independent of automated pass counts:

| ID | Status / remaining acceptance |
| --- | --- |
| WEBKIT-GAP-01 | OPEN. Recorded 300 ms callback gap; previous E3-B/E3-C pair also showed 352/368 ms gaps. Twelve repeated contexts: 11 had no gap >100 ms; first live/no-video context had a 616 ms gap (613 ms outside the preceding callback) and a separate 197 ms synchronous draw outlier. Not consistently reproduced; exact cause unresolved. See readiness assessment. A scheduling hypothesis is not a fix. |
| TERRAIN-BAKE-01 | OPEN. Synchronous cold terrain bake measured up to 102 ms WebKit in the focused E3-C run. Warm frame samples do not resolve startup hitches. |
| IPHONE-PLAY-01 | OPEN / physical device not tested. Actual iPhone Safari play with existing save, drawers, text contrast, safe areas, zoom/pan, entry/exit, management and sustained interaction is required. Desktop WebKit/touch emulation is supporting evidence only. |
| COLONY-PERF-01 | OPEN. Sustained 5/20/40-resident behaviour and large-colony spikes remain unverified by the eight-resident Day-58 checkpoint. |
| SAVE-EXPORT-01 | OPEN. Obtain the actual downloaded JSON, validate it and re-import through transfer controls; verify iPhone Files delivery separately. No success from a toast or ordinary save/load test. |
| E3-VISUAL-01 | RETAINED. Roof-course/silhouette repetition and limited architectural individuality. |
| E3-VISUAL-02 | RETAINED. Environmental depth/hierarchy and atmosphere trail the approved concepts; broad ground fields and peripheral terrain blending remain visible. |
| E3-READABILITY-01 | RETAINED. Small monospace/muted field labels, dense specialist drawers and map-under-panel transparency require real-phone readability review. 44px target tests do not establish text legibility. |

No runtime or artwork change is implied by recording these issues. The next major
visual milestone awaits Kyle & Atlas's decision. Full readiness findings and their
measurement limits live in [E3_INTEGRATION_READINESS.md](E3_INTEGRATION_READINESS.md).
