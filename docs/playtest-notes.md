# Guided playtest and combat feedback · v0.6

This remains a development preview: simulated NFTree ownership and TREE balances, no wallet connection, token transfer, or financial rewards.

## Start a guided run

Choose a preview NFTree rarity. A new player gets a four-step guide: plant Pine, add Oak, send wave one, and watch the defense. The guide suggests sites 1 and 2, but accepts other guardian types and placements. The guide’s two recommended defenders clear the first chapter’s first wave at full health without spending TREE in the engine simulation.

Skip Guide hides the tips and remembers that preference. An existing save with battle or forest progress does not automatically receive the new guide. Use **Field guide → Start a guided run · included** to replay it. This starts a fresh run while preserving TREE, permanent species growth, rarity, and forest progress. Replacing an unfinished battle requires the existing new-run confirmation.

## Scout a wave

The scouting panel lists the next wave’s pest types, counts, traits, and a defense tip. It previews a future wave while the current battle is running or paused. It never spawns pests or changes progress. The forecast and actual spawn queue share one lineup function. Wave ten includes one Blight King in addition to 26 other pests.

## Review a TREE purchase

Upgrades, Root Shield, Fertilizer, Leaf Storm, and continues open a review showing the effect, testing cost, current simulated balance, and balance after purchase. Cancel, close, or Escape leaves the balance unchanged. Confirmation applies the purchase once. Eligibility and funds are checked again at confirmation. Changed runs and stale upgrade prices invalidate the review.

Battle time is held while a review is open. Canceling returns to the existing battle phase. Switching tabs still pauses the battle; a Leaf Storm review becomes unavailable if the battle has paused or its pests disappeared. Close that review and resume before choosing it again.

## Automated verification

- All 38 Node tests pass, including the original access, currency, rarity, save migration, growth, and campaign checks.
- New tests cover forecast accuracy for all 30 chapter/wave combinations, the recommended Sap-only first wave, alternate tutorial placements, recovery, read-only reviews, duplicate confirmation, changed prices, insufficient funds, removed access, changed runs, supply eligibility, and preservation of a continued battle.
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

The next launch milestone is verified NFTree ownership and TREE payment integration. The production recipient, finalized prices, current NFT ownership/rarity data, and authoritative payment verification must be settled before enabling real purchases. Existing browser saves remain editable preview data.
