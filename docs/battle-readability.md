# Crowded-battle readability review

Offline native capture uses the actual engine, map, game art, directional aiming and combat feedback. It is not a hosted holder session or a simulated wallet login. The fixture owns Ancient growth for every species and uses the permanent individual collection. It places the existing piercing formation using earned Sap, simulates the first nine Veteran Moonlit Marsh waves, then records the actual final wave. No supplies, continues or wallet transactions are used.

The final wave peaks at 23 living pests: six blight, four termites, seven beetles, five moths and one boss. Actual boss enrage occurs 40.3 seconds into the wave. The full wave finishes in 52.95 seconds with 46 health. The 24.1-second clip contains two real-time excerpts around the crowded escort and boss enrage; the battle-time counter exposes the cut. It does not fabricate boss damage, spawns or enrage. See `battle-readability/capture-report.json`.

## Fixes from visual inspection

The first full-size capture showed the newly enlarged anatomy forming a dense carpet that obscured defenders. Damaged health bars could be covered by the next enemy sprite, and their fixed offset left them disconnected from horizontally facing pests.

New enemies retain their approved anatomy and stage growth, with a battlefield footprint factor of 0.66 for ordinary pests and 0.82 for bosses. Legacy enemies without visual-tier metadata retain their earlier size. This is presentation only: health, speed, hit calculation, damage resistance, targeting distances, rewards and purchase prices do not change. The same fixture still clears at 46 health.

Health bars are a final combat layer, after enemy bodies, effects and projectiles. Their position follows the rotated silhouette bounds, with a top-edge clamp; ordinary bars are shorter to leave separation in a dense escort. Boss bars turn red during actual Veteran enrage. The separate boss HUD remains unchanged.

Native desktop-frame inspection shows clearer defenders and pest types, with visible boss enrage. The 390-pixel image is a scaled battlefield check, not phone UI acceptance. Real signed-in desktop and phone interaction, responsiveness and wallet purchase acceptance remain pending.

## Reproduce and artifacts

Run `node tools/render-battle-readability.mjs` in the primary runtime with native canvas and ffmpeg. This recreates the MP4, crowded escort frame, enrage frame, scaled battlefield and JSON report in `docs/battle-readability/`. Capture headings are review annotations outside the battlefield, not a reproduction of hosted app HTML.

The MP4 passed a complete ffmpeg decode and is 800×640 at 20 fps. Local checks: 193 passing tests, one Windows-only skip, zero failures; syntax and whitespace checks passed. A regression checks that health bars clear rotated shells/horns and stay inside the top edge. Canonical checkout-test deployment pending.
