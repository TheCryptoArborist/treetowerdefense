# 1990s retro cutscenes

The user rejected the replacement faces and jointed puppet arms. Cutscenes now
use the original directional guardian atlases, including their original eyes,
mouths, silhouettes and limb proportions. The rejected puppet sheet and renderer
are removed. Battlefield artwork is unchanged.

## Presentation

`story-retro.js` paints a 320×140 story stage with a 32-color palette, nearest-
neighbor scaling and a built-in 5×7 bitmap font. A forest establishing shot cuts
to a confrontation and then an original-art portrait panel. Discrete existing
three-quarter/side poses, pixel-step lunges, traveling seed bolts, timed impact
sparks and stepped enemy gait give the action a 16-bit cadence. Guardians never
use limb segmentation, newly drawn facial features, bitmap shearing or synthetic
mouth animation. Forest layers, canopy silhouettes and drifting leaves scroll
at independent speeds. Dark block wipes mark shot changes.

Narration and guardian dialogue appear in framed typewriter panels. Long text
pages without dropping words, and the full original text remains readable in
the native dialog below the canvas. Manual guardian-dialogue selection holds
the portrait shot and restarts its typewriter. The presentation clock holds on
checkout, hidden tabs and access loss; replay resets it. It never advances a
wave, spends TREE or changes game state.

Original pulse-wave melody and triangle bass use the existing opt-in audio
controls. Four-second phrases follow the scene clock, with no catch-up burst
after a clock jump. Mute, hidden state, scene close and teardown cancel scheduled
notes. Optional device narration and per-delivery voice choices are retained;
voice completion never advances a wave or changes a guardian face.

The scene toolbar is outside the pixel canvas, with original touch targets.
Reduced motion shows a deterministic portrait with complete first-page text,
no wipes, scrolling or attacks. Scene-motion overrides and accessible full text
remain available. Other game screens retain their existing artwork and styles.

## Verification and preview

291 local tests pass, zero fail, and one existing Windows-only test is skipped.
Syntax checks and protected packaging pass. The 26-second MP4 uses the production painter,
original local guardian/Tree of Life/Ironroot artwork, and an offline rendering
of the same original chip-score phrases. It shows the Palm confrontation,
Palm dialogue and Oak chapter-ending portrait. It contains music and effects,
not device narration. These are offline captures; holder/device acceptance
remains pending.

## Release status

The approved retro revision is live on checkout-test from source `193b9c2`.
Backend: `6aed441fb3d3fe7e81454d3d`; routing: `6aed44f91a94dbba3157f330`.
The package digest matches the validated local ZIP. All 43 production function
identities/configurations, five schedules and 299 static paths are retained;
only the existing checkout-test rewrite target changed. Public gate, styles and
gateway pass HTTP checks; protected source, access and payment endpoints remain
401 without a session. No database migrations or global environment changes
were made. See [release evidence](../integration/tree-arcade/retro-cutscene-release-receipt.json).
Holder hosted/phone acceptance remains pending.

The following receipt records the preceding continuous-motion build.

Live on checkout-test from source `db3151b`. Backend
`6aed2753a92c1230e052b165`; routing `6aed2875aa8b27d1ef7d53a6`. Canonical
entry includes motion controls and stage autofocus, styles/gateway match source,
and anonymous story/audio source, access and payments remain protected. One
initial access probe returned 503; the repeated full check passed with the
expected 401. All 43 production function identities/configurations, five schedules
and 299 static paths are retained; only the checkout rewrite changed.
See [release evidence](../integration/tree-arcade/continuous-cutscene-release-receipt.json).
