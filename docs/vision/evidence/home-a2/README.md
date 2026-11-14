# Home composition A2 — creative review, 13 November 2026

Status: implemented and functionally verified; rendered views inspected; **not
creatively approved**. Resident artwork remains on hold. No production rollout.

## Recovery and exact implementation

PR #25, branch `home-composition-checkpoint`, targets the unchanged overhaul.
A1 is preserved at `988e3ac629d1b0e0e09edabd851a88c3c7570af7` and the recovery ref
`recovery/home-composition-a1`. The first A2 camera/control checkpoint is
`a7eaf9d2284cd22817aa1e0e8472a8e84c15d5fc`. It had six test-harness failures from
reading the intentionally invalidated layout before the next paint. Those guards
were recovered after interruption, not replaced with weakened game assertions.

The continuous portrait scenes and recovered verification are committed at
`621c92db55cdbc0d539a434abac10a58bac70e05`. Later evidence/documentation commits
preserve the identical runtime. No new branch or restart followed the interruption.
The accidental 16:9 request was disregarded; portrait remains primary.

## Actual gameplay evidence

- `live-whole-390.jpg` / `live-room-390.jpg`: native live-staging captures from
  the same imported colony (Day 58, 12:42 and 13:09).
- `day58-whole-home-390.png`: WebKit at 390×844, imported real Day-58 colony,
  8 residents, 32 completed structures. Uses the real import controls, no grants,
  invented occupancy or fixture-generated colony.
- `day58-room-centre-390.png`: the same home after the player chooses Look closer.
- `day58-room-left-390.png`: navigated close view.
- `day58-notes-390.png`: contextual field notes showing real occupancy/time/weather.
- `home-night-real-occupancy.png`: a separate home built from starting resources,
  saved/reloaded, then genuinely occupied by its assigned resting residents.
  Clock advancement is controlled; travel and attendance are simulated.
- `home-day-844.png`: responsive 844×390 view. Functional, not creatively accepted;
  its side-to-scene blending is still weaker than portrait.

These are unedited in-engine WebKit images from run `43425297213`, not generated
art presented as game evidence. The live staging UI was also exercised with the
unmodified Day-58 save, and native 390×844 captures were made separately. Art plates
are documented in ASSET_PROVENANCE.md and are not evidence by themselves.

## What A2 changes

Portrait is now a continuous 768×1660 sky/home/terrain composition, uniformly scaled
and full-bleed. No flat margins, repeated floorboards or oversized foreground-strip
magnification. Home view retains all roof, bunks, chairs, desk, stove, porch and
foundations. Shorter portrait ratios trim surplus sky/ground while retaining the
house. All original A1 art assets remain recoverable.

A phone cannot show a whole near-phone-width house and arbitrarily enlarge it
without a framing trade-off. The full cutaway remains the entry view. An explicit
1.7× Look closer camera allows bounded drag/arrow navigation; Whole home restores
the overview in one tap. The closer viewport intentionally shows a portion of the
house, and is never described as the complete-cutaway screenshot.

Home controls now use labelled field marks and consistent line icons, rather than
filled generic buttons. Outside/Home notes sit over sky; Look closer/Manage sit at
the lower edge. Field notes are compact and dismissible. Touch targets remain at
least 44 CSS pixels. Enter/exit/camera architecture and management access persist.

Lighting still follows actual time, physical occupants, sleeping/awake state and
grid availability. Mobile WebKit dimming uses portable compositing. Weather remains
an interim wash. No save fields or simulation outcomes were changed.

## Verification

Actions `43425297213`, code commit `621c92d`: **68/68 Chromium/WebKit checks pass**.
Includes the Day-58 UI import, 390×844 / 375×667 / 844×390, complete-house bounds,
textured margins, close-camera scale/limits, drag/keyboard navigation, whole-home
return, exact exterior camera restoration, Escape, real construction/occupancy,
rendered nighttime dimming, save/reload and recovered research/schedule regressions.
Build consistency, content, migration and housing checks pass in the same run.

No new full endurance or 5/20/40 performance acceptance is claimed. Canvas surfaces
remain capped at one million backing pixels each. Paired decoded portrait plates
now cost roughly 10 MB together; display/cache surfaces add at most about 8 MB,
excluding the rest of the game/browser. Physical iPhone performance is unverified.
Historical late-colony spikes remain tracked integration risks.

## Readability and remaining limits

Furniture is easier to inspect in the closer view; the whole-home view prioritises
composition and context. Full-house scale remains width-constrained. Future human
proportions must be assessed against this furniture, not the obsolete tiny sprite
proposal: roughly 72–96 source-pixel standing figures would map to about 37–49 CSS
pixels in the 390×844 overview and 62–83 CSS pixels when closer. This is a scale
estimate, **not a rendered/approved resident**. Do not begin resident art until
Kyle/Atlas approve this composition/camera/control direction.

Landscape is usable but its contextual side blending needs another visual pass.
Small day/night plate detail drift remains possible. Global power and whole-plate
night dimming are interim; individual fixture/occlusion/weather layers are future
refinements. The wider management/overworld UI remains unapproved.

## Open technical issue

**SAVE-EXPORT-01 remains OPEN / unverified** in docs/vision/TECHNICAL_ISSUES.md.
“Backup prepared” proves only that export was requested. The manual browser
observer timed out; no delivered JSON file was obtained/validated/re-imported by
that manual route. Existing automated save protections and successful import do
not close this issue. Kyle's iPhone Files delivery also remains to be checked.

## Safe review

Use the pinned preview in PR #25. Export the original colony first and retain the
file unchanged. Import a copy only at the new address, verify seed/day/people, and
replace only a disposable preview colony. Valid v4/supported v3 protections remain.
Use a completed Prefab Home → Enter home → Look closer / Whole home / Home notes /
Manage / Outside. Verify the previous exterior pan/zoom returns. Review at normal
phone scale; resident artwork has not started. No merge or production changes.
