# Combat feedback · v0.6

The battlefield now shows brief hit reactions and impact rings, collapsed/fading pest silhouettes on defeat, subdued dust, and floating life-damage or shield messages at the Tree of Life. Colors follow the guardian attack type. No new artwork files or dependencies are required; these effects use the game's native canvas drawing functions.

The readout above the battlefield announces wave starts and clears. The final-wave warning appears when wave ten starts, followed by an arrival warning when the Blight King actually spawns after his escort. The boss panel shows an incoming label first, then current/max health and a native HTML progress bar while he remains on the path. It disappears when he is defeated or breaches the roots. The final victory message describes the Tree of Life surviving, so it does not incorrectly claim the boss was killed when a player survives his breach.

## Presentation boundaries

- `src/engine.js` emits hit, defeat, breach, wave, and boss-arrival events from actual battle actions. Hit damage respects the existing armor, splash, piercing, and storm calculations. Poison ticks retain their previous behavior and do not emit impact events every frame.
- `src/combat.js` keeps bounded transient presentation state: at most 80 impact rings, 32 defeat silhouettes, and 64 reactions. It copies event data and does not mutate the game or input events.
- `src/art.js` paints the effects without modifying their state. `src/app.js` advances presentation timers, consumes events, and updates accessible text and the health display.
- Effects and floating messages hold while paused, a dialog is open, or the tab is hidden. New runs, preview resets, and chapter changes clear transient feedback.
- Reduced-motion mode omits impact rings, recoil, hit tinting, collapse motion, and drifting particles/text. Health bars, notifications, and stationary fading defeat silhouettes remain.
- Effects are not saved. A restored run derives its boss health directly from the existing saved enemies or queue and resumes paused, as before.
- Guardian stats, target selection, wave composition, Sap rewards, TREE prices, rarity cosmetics, and the future structure gallery are unchanged. All ownership and payments remain simulated.

## Verification

- All 38 Node tests pass, including eight new combat/presentation tests. Existing purchase-review and save-migration tests continue to pass.
- JavaScript syntax and diff checks pass, including the new combat module.
- Deterministic simulations of all three ten-wave campaigns exactly match v0.5.1 in health, Sap, TREE, scores, enemy state, and permanent progress. Only presentation events and the corrected victory wording differ.
- Actual canvas drawing functions rendered 60 combinations of pest type, attack type, and motion preference, plus 20 defeat frames. Inputs remained unchanged; defeat frames were visually inspected.
- HTML IDs, source references, and local HTTP asset routes are checked. Non-game server routes remain blocked.
- Full desktop/mobile browser layout and interaction testing remains pending because local preview URLs were blocked by the preview browser earlier in this session. No browser verification is claimed here.

## Manual playtest

1. Start the guided Pine/Oak run. Look for brief impact reactions, dust and fading silhouettes, one Sap reward per defeat, and the wave-clear bonus notice.
2. Pause during combat. Check that reactions, defeat fades, particles, floating text, and notices hold. Repeat while a TREE purchase review is open, then cancel and resume.
3. Reach wave ten. Check the advance warning, incoming boss label, actual arrival warning, health bar updates, boss defeat/breach message, and victory outcome.
4. Reload while the boss is present. Confirm the battle restores paused and displays his saved remaining health. Start a new run or change chapters and confirm old effects are cleared.
5. Enable reduced motion in the operating system before opening/reloading the game. Check that impacts do not flash or move and the text/health readout still explains the battle.
6. Check the readout on a narrow screen and with a screen reader. Boss health changes should not continuously interrupt the wave announcements.
