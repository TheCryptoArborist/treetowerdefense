# Continuous action cutscenes

The earlier presentation stopped at 12 seconds, leaving the image frozen while
players listened to narration or read the dialogue. Device reduced-motion
settings could also select a still composition without an in-scene explanation.
The bottom Continue button's autofocus could scroll the visual stage out of view.

The initial three-shot introduction now leads into a continuous confrontation
and guardian-close-up loop for as long as the scene stays open. Guardians advance,
brace and lunge using the existing grounded sprite rig; seed shots cross the
scene, enemies stride through their real walking poses, and hits produce recoil
and bark/leaf fragments. Supporting defenders and swarming insects keep the
battlefield active between strikes. Root signals, depth layers and foreground
leaves continue moving. Renewal endings keep their peaceful root-reconnection
composition rather than introducing another attack.

The canvas stays visible while story controls scroll. Native autofocus starts
at Skip scene near the stage. **Scene motion** offers **Device setting**,
**Action animation** and **Reduced motion**, with an explicit status message.
Device setting remains the default and follows live OS preference changes.
An explicit choice is remembered separately from game, wallet and audio data.
Reduced motion is one deterministic still image without camera movement,
projectiles, recoil, flashes or drifting particles. Narration, captions and
manual Next/Skip/Story behavior remain available.

The presentation never steps Game, applies damage, spends currency, or advances
story text or waves. Hidden tabs, checkout and access loss hold the scene clock;
closing clears it and replay starts the introduction again. Existing narration
voice choices and playback cancellation remain intact.

## Verification

286 local tests pass, zero fail, and one existing Windows-only test is skipped
on Linux. Motion regressions cover post-intro activity, continuing strikes and
gait, renewal endings, deterministic reduced motion, device-preference changes,
explicit overrides, storage failures, clock holds, replay and clear. All chapter
and seasonal scene painters use finite geometry and preserve game snapshots.
Syntax and protected build checks pass.

`node tools/render-cinematic-check.mjs` renders the production painter with the
real guardian, Tree of Life and Ironroot art. The 20-second silent MP4 includes
eight seconds after the former freeze point. The contact sheet samples both the
intro and late action loop. These are offline renderer captures, not an
authenticated browser/phone playtest. Physical layout and device acceptance
remain pending.
