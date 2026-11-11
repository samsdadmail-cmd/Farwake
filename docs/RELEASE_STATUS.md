# Beyond the Frontier — current verification status

Updated 11 November 2026. Development branch only; no deployment or merge authorized.

| Verification | Result | Scope |
| --- | --- | --- |
| Power reserve | PASS | Focused real-function test: bank charges, nighttime deficit discharges exactly, accumulator capacity combines correctly. Prior browser research suite also passed. |
| Investigation target order | PASS | Focused real-function test: explicit investigation before standing extraction, extraction resumes afterward, stock target stops extraction. Navigation isolated. |
| Generated index.html | PASS | `python build.py --check` on recovered files. |
| Technology/material graph and assets | PASS | 26 technologies, no missing prerequisites/cycles, materials reachable, manifest parses, branch deployment hold present. |
| Building classification/housing | PASS | Node check of 33 types, indoor routing, pallet cargo migration and beds. |
| Current full organic observatory journey | UNRESOLVED | #17. Last observed run was waiting on a funded turbine around Day 31. No further long reruns without a targeted diagnosis/fix. |
| Phone interface checks | PASS | Current candidate browser UI suite completed at 375×667, 390×844, 430×932 and 844×390: catalogue/previews, research navigation, dashboard, storage filters, survey and four audio controls. Physical iPhone 14 Safari/performance remains unverified. |

The execution environment has returned and the previously uncommitted files survived. Preserve them. This checkpoint includes the original UI's final local refinements, finite field-extraction bootstrap and saved partial work, connected-route checks and clearer access diagnostics. A committed checkpoint is not release approval.

Next priorities: preserve the recovered implementation, run one bounded playable smoke, then address release-critical survival/recovery defects. Do not cycle between the two passing checks. QA & Saves owns reconciliation of shared test harnesses; no Studio branch has been merged or overwritten.

## Survival recovery fix

Hungry colonists no longer repeatedly select an empty eating action. They seek real discovered fruit or work an unpaused grow bed; when neither is available they may continue logistics and other work. A temporary food production floor applies only while nobody owns an edible ration and someone is hungry; the player's saved target is unchanged. Explicit farm pauses and worker assignments remain authoritative. The Command Center and crop inspector explain emergency recovery.

Executed: `node tests/frontier-survival.cjs` verifies actual plant/germinate/tend/grow/harvest stages, physical output accounting and eating, zero saved target, finite/unreachable/claimed forage, reserved-food exclusion, pauses, assignment rules and normal hauling fallback. Navigation and freight output placement are isolated in this bounded test. Content graph, housing/classification, generated bundle equality and inline JavaScript syntax checks also passed after the change. No new full-observatory rerun or device-performance claim.

Checkpoints pushed: `69f7bcb` (recovered implementation) and `6759042` (survival recovery). The four-viewport browser UI suite completed after both checkpoints. Full organic journey remains #17; no release-ready claim.
