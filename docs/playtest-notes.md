# Guided playtest, combat feedback, and aiming · v0.9

This remains a development preview: simulated NFTree ownership and TREE balances, no wallet connection, token transfer, or financial rewards.

## Start a guided run

Choose a preview NFTree rarity. A new player gets a four-step guide: plant Pine, add Oak, send wave one, and watch the defense. The guide suggests sites 1 and 2, but accepts other guardian types and placements. The guide’s two recommended defenders clear the first chapter’s first wave at full health without spending TREE in the engine simulation.

Skip Guide hides the tips and remembers that preference. An existing save with battle or forest progress does not automatically receive the new guide. Use **Field guide → Start a guided run · included** to replay it. This starts a fresh run while preserving TREE, permanent species growth, rarity, and forest progress. Replacing an unfinished battle requires the existing new-run confirmation.

## Scout a wave

The scouting panel lists the next wave’s pest types, counts, traits, and a defense tip. It previews a future wave while the current battle is running or paused. It never spawns pests or changes progress. The forecast and actual spawn queue share one lineup function. Wave ten includes one Blight King in addition to 26 other pests.

## Command guardian targets

Select a planted guardian and use **Target priority** in its inspector. First picks the pest furthest along the route, Strongest picks the highest remaining health, and Fastest picks current speed after slows. All choices stay within the guardian's range and affect only that guardian. Changing an order is included; it does not buy growth, supplies, or a continue. See [targeting semantics and manual checks](guardian-targeting.md).

## Review a TREE purchase

Upgrades, Root Shield, Fertilizer, Leaf Storm, and continues open a review showing the effect, testing cost, current simulated balance, and balance after purchase. Cancel, close, or Escape leaves the balance unchanged. Confirmation applies the purchase once. Eligibility and funds are checked again at confirmation. Changed runs and stale upgrade prices invalidate the review.

Battle time is held while a review is open. Canceling returns to the existing battle phase. Switching tabs still pauses the battle; a Leaf Storm review becomes unavailable if the battle has paused or its pests disappeared. Close that review and resume before choosing it again.

## Automated verification

- The original 52 game tests pass, including the original access, currency, rarity, save migration, growth, and campaign checks.
- New tests cover forecast accuracy for all 30 chapter/wave combinations, the recommended Sap-only first wave, alternate tutorial placements, recovery, read-only reviews, duplicate confirmation, changed prices, insufficient funds, removed access, changed runs, supply eligibility, and preservation of a continued battle.
- Seven aiming tests verify directional poses, actual attack targeting, pause holds, final killing-shot completion, resets, and read-only facing reconstruction from paused saves. The v0.7 aiming change retained identical battle states compared with v0.6; v0.8 deliberately changes wave mixes and pacing.
- Seven wave tests cover new threat introductions, increasing combined health, early pacing, Sap-only expansion, three-chapter viability, old queued saves, and matching scouting/notices. Run `npm run balance` for all 15 defense scenarios.
- Seven targeting tests cover real attack/aim agreement for all species and modes, health/speed priorities, cooldowns, paused commands, command guards, save compatibility, growth, and continues.
- JavaScript syntax checks pass. HTTP asset checks and static DOM-reference/module-path checks pass.

These checks do not substitute for browser layout and interaction testing. The cloud browser blocks local preview URLs in this environment. Browser layout and actual keyboard/touch/dialog behavior remain pending.

## Manual checks still needed

Use a desktop browser and a phone (or a mobile viewport) to check:

1. Start a fresh preview. Follow the guide using both canvas sites and labeled build-site buttons. Clear wave one with the recommended Pine/Oak pair.
2. Skip the guide, reload, and confirm it stays hidden. Restart it from Field Guide; confirm existing permanent progress and TREE remain.
3. Compare the scouted lineup with waves two, three, and ten. Check that pest portraits and text fit narrow screens.
4. Open and cancel each purchase. Verify no charge. Confirm an upgrade and verify all guardians of its species grow for one charge. Check supply and continue effects.
5. Open a purchase during battle; verify pests and battle timers wait. Try Escape, Cancel, and confirmation. Switch tabs during a Leaf Storm review and verify it cannot spend while paused.
6. Check keyboard focus and return focus around dialogs; confirm hotkeys do not act behind a modal.
7. Follow the [combat feedback playtest](combat-feedback.md): hit/defeat effects, shield and life feedback, pause/dialog holds, wave notices, actual boss arrival, saved boss health, and reduced motion.

8. Follow the [guardian aiming checks](guardian-aiming.md#manual-playtest): watch pests approach from both sides and pass above/below a guardian, then verify its view and weapon/hand launch point. Repeat after each growth upgrade and with unlocked appearances.

9. Follow the [wave balance playtest](wave-balance.md#manual-playtest). Check that armor, speed, and blight are visibly distinct by waves 2–4, and that adding defenses with Sap handles the first chapter. Try a replay with existing permanent growth; the opening should reward those purchases, while later gaps still matter.

10. Follow the [guardian targeting playtest](guardian-targeting.md#manual-playtest). Change orders between mixed waves, confirm target/facing agreement, and verify keyboard focus after changing the native select.

The next launch milestone is verified NFTree ownership and TREE payment integration. The production recipient, finalized prices, current NFT ownership/rarity data, and authoritative payment verification must be settled before enabling real purchases. Existing browser saves remain editable preview data.
