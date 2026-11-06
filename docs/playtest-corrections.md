# November 5 playtest corrections

## Individual placement

The engine and picker previously sorted available copies from strongest to weakest. Removing an Ancient copy or starting another run could therefore silently deploy that same upgraded copy before any level-one copy. Both now share an ascending level/number order. An explicit copy choice is still respected. New copies begin at level one and TREE upgrades affect that copy only; removal and travel keep already purchased individual levels.

The deployment dock and collection portraits now depict the chosen/next available copy instead of the species' highest level. The picker explains the chosen number/level, previously upgraded copies and inherited legacy purchases. The planting notice repeats the number/level. Existing verified species-wide purchases remain grandfathered on their original twelve copies; no paid entitlement, receipt, migration, price or server inventory is rewritten. These granted copies are labeled rather than represented as newly earned upgrades. We have not inspected the reporting holder's private inventory, so the exact cause in that account is not asserted.

## Oak hand origin

Oak had two explicit ground-level launch overrides, bypassing its loaded directional atlas. It now shares the calibrated atlas socket pipeline, with fifteen fist coordinates covering three growth rows and five views, plus mirroring for all eight directions. The fallback launch point uses the same raised hand that its fallback painter draws. Damage, targeting, range, attack rate and impact timing are unchanged. The offline capture checks all 24 loaded atlas combinations; automated regressions cover fallback directions/levels and immediate impact.

## Animated wave scenes

The later [continuous action update](action-cutscenes.md) supersedes the original
12-second freeze and adds explicit scene-motion controls and a persistent stage.

`story-art.js` replaces the static landscape/portrait composition with a twelve-second in-engine sequence. Three camera shots establish the Tree of Life, bring in guardians and the approaching enemy, then frame the speaking guardian. Independent forest layers, moving enemy poses, hand-connected strikes, drifting leaves and traveling root signals provide visible action. Mini-boss warnings match actual encounter flags; final approaches use the relevant chapter/season boss. Endings show reconnection instead of another attack. Chapter lighting and guardian identity follow the existing story.

The animation clock is separate from the paused battle. It resets on replay, clears on skip and stops at its final composition. Text remains manually advanced; players can skip immediately, use Escape, disable automatic story or replay from Story. Closing a between-wave scene does not send the next wave. Reduced motion draws one deterministic final composition with no movement or flashing. Canvas descriptions and readable HTML text remain available to assistive technology. No session, ownership or payment behavior changes.

## Supplied reference inspection

The supplied `Ninja Gaiden II -  The Dark Sword of Chaos (1991).exe` is a Windows self-extracting 7-Zip package. Its embedded archive was inspected without launching its executables. It contains the DOS game plus DOSBox, seven `ACT*.BIN` files and scene resources including `PROLOG.S32`, `ACT1.S32` through `ACT6.S32`, `ACT7_1.S32`, `ACT7_2.S32` and `FINALE.S32`, plus music and other graphics. It has compiled game/scene data rather than editable game source. No original-game code, graphics or music are shipped in Canopy Defense. Playback of all DOS act scenes was not verified in this environment. The Canopy sequence is an original implementation using the existing Canopy artwork; another source-code package is not needed for this implementation.

## Validation

244 passing tests, one Windows-only skip, zero failures; syntax checks and protected function build pass. Coverage includes fresh-copy default selection across all eight defenders, explicit upgraded redeployment and reload, legacy purchase retention, every campaign/season checkpoint, safe finite canvas geometry, three shots/actor movement/strike timing, reduced motion, presentation clock resets and existing story skip/pause guards. `tools/render-cinematic-check.mjs` renders the real production painter and loaded Oak atlas into ignored offline captures; these are not authenticated browser screenshots. Holder desktop/phone gameplay acceptance remains a playtest step.

Release evidence is recorded after publication in `integration/tree-arcade/playtest-corrections-receipt.json`.

Published to the isolated checkout test: source `86ca26266c51d32b043c1e2080abd23058e250c6`, backend `6aecaab7cc70d5c4903fa917`, routing `6aecab809924c531a486d91e`. The canonical gate, origin-bound sign-in challenge, protected sources/payments and exact function ZIP digest passed. Entry/style/gateway content matches the build (entry retains the unchanged site-wide Arcade snippet). All 293 static paths were retained; only `/_redirects` changed. All 43 function identities/runtime configurations and five schedules were preserved exactly. Both CI runs passed Linux, Windows and PostgreSQL checks. No wallet transaction was initiated.
