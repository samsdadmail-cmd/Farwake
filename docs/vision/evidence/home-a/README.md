# Home checkpoint A — review evidence, 13 November 2026

This is a composition review, not a completed immersive-home release or creative
approval. Stop before resident artwork and wider rollout until Kyle/Atlas review.

## Exact implementation and recovery

Code checkpoint: `1a8163ef821b820eb615dff9bf3cfc649c758a36`.
Continuation: `home-composition-checkpoint`, draft PR #25, targeting the existing
Experience Overhaul branch. Its ancestry retains Grok's three commits and unchanged
technical handover. PRs #23/#24/#22/#18 and their pinned deployments are untouched.
The commit containing this evidence changes documentation/images only.

Authoritative direction starts at `docs/vision/README.md`. The Covenant, Doctrine,
Visual Acceptance, Art Direction, Grok findings/integration audit and Roadmap are
committed. The complete supplied acceptance standard is preserved; no separate
original standard file was found on the Grok branch.

## Gameplay screenshots

- `day-portrait.png`: WebKit, 390×844, a home built from the real starting economy,
  saved and reloaded before entry. No stock/research/resident grants.
- `day-landscape.png`: the same construction/save/load procedure at 844×390.
- `night-sleeping.png`: WebKit, actual assigned residents physically routed inside
  the constructed home. Clock advancement is controlled; attendance is not faked.
  Residents are deliberately not drawn at composition checkpoint A.

These are unedited in-engine browser screenshots from Actions run `43412933844`
on the exact code checkpoint, not standalone art mockups or leisure fixtures.
The corresponding Chromium captures remain in that run's evidence artifact.

Separately, live staging was inspected through the UI using the unmodified
historical organic-journey export (the file is Day 58, not Day 62). It imported into
the isolated QA save key, displayed 8 residents/32 structures and continued into
Day 59. Entry, Home notes and return to management were exercised. At 23:37 the
selected home had no physical occupants and correctly stayed dark; later its
management readout showed Tomas inside. No residents/events were injected.
Cloud-browser updates were delayed; this is not a physical-device FPS measurement.
An export action reported success, but the browser download observer timed out;
that manual export byte-transfer round trip is not claimed as verified.

## What changed

Whole-house cutaway and alien surroundings replace cropped room/floor repetition.
The original furnished room asset remains intact. Day/night plates preserve room
layout; daylight has no leftover moon. Night lamplight depends on physical indoor
occupants, awake/rest state and actual grid supply versus demand. Empty/unpowered
rooms use an unlit plate. A portable composited wash dims resting/empty rooms;
WebKit can ignore canvas filters, so rendered pixels now have regression coverage.
Weather uses actual state for a restrained colour wash.

Map taps inspect; Enter and Manage are separate actions. Inside, only Outside,
Home notes and Manage remain. Management opens after exit. Camera restoration is
exact, including after save/load replaces the camera object. Escape and gestures
are isolated from the underlying UI. Canvas density/cache are bounded and layout
is measured on entry/resize. No save fields or simulation outcomes were added.

## Verification and limits

- Actions `43412933844`: **66/66 Chromium/WebKit tests pass**, including the new
  pixel assertion, entry/exit, exact camera restoration, 390×844/844×390/375×667,
  real construction/save/reload, home occupancy and recovered research/schedule
  assertions. Build consistency, technology/content, migration and housing pass.
- Historical `f3a09e2` run: 19 legacy suites passed; 113 browser checks passed,
  six failed from three outdated assertions duplicated across engines. Current
  targeted runs correct and cover those assertions. No claim that every broad
  suite was rerun on this checkpoint.
- No physical iPhone test performed. Two one-million-pixel RGBA surfaces cap the
  canvas backing storage near 8 MB (excluding decoded art, engine and browser).
  Balanced density ≤1.5, performance density 1, existing 30 Hz draw cap retained.
  Historical 40-person/synthetic late-colony spikes remain unresolved integration
  risks; no new 5/20/40 performance acceptance is claimed at checkpoint A.

## Candid visual review

Improved: complete roof, bunks, desk, stove, chairs, porch and foundations remain
legible; environment has scale; controls no longer dominate the home.

Still weak: portrait top/bottom and landscape side margins visibly meet the art;
they need better compositional integration. The landscape room remains fairly
central/small. The room has no resident sprites. It is a proposed art direction,
not a literal reproduction of the attached multi-storey/industrial references.
Day/night plates have small asset differences; future weather treatment needs
cloud/window layering rather than only a wash. Global grid availability is used,
not per-fixture energy allocation. Whole-plate dimming is an interim light model.
The wider overworld/management UI remains unapproved and retains old dashboard
traits. These are not disguised as finished features.

## Review and safe playtest

Open the pinned preview listed in PR #25. Export your original colony through
Game and Save → Export Save first; retain that file unchanged. At the new preview,
use Import Save, verify seed/day/people, and confirm only if replacing a disposable
colony at that new address. Never clear browser data or overwrite your original
export. Valid v4 and supported v3 migration/recovery protections are unchanged.
Do not move a newer save backwards to older builds as a recovery method.

Use a completed **Prefab Home** for this single-room checkpoint. Tap it → Enter
home; check the complete house in portrait/landscape, Home notes, Outside and
Manage. Pan/zoom before entering and check the return view. Observe day/night and
actual occupancy. No residents are drawn yet. Other home types keep their existing
presentation; this direction has not been rolled out across them.

Review request: is the complete-house scale/perspective, room arrangement and
restrained control direction correct? Correct composition/margins before approving
checkpoint A. Only after approval implement one coherent resident with standing,
seated/reading and sleeping poses, then obtain checkpoint B review.
