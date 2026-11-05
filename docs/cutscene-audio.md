# Cutscene audio

The previous story scenes were silent. The header toggle played battle tones,
but it was outside the native modal and could not be reached during a scene.
The new in-scene **Enable audio** button controls the same audio state as the
header. **Voice narration** and **Replay narration** are available inside the
dialog, alongside the complete written story. The next button says **Guardian
dialogue** so it remains truthful when narration is unavailable or muted.

## Sound and narration

- Original chapter-specific music, forest ambience, bird notes, footsteps,
  camera rustles, strike feedback and root-reconnection cues use Web Audio.
  Action cues follow the existing 12-second presentation clock. No original
  game music, external sound assets or provider keys are required.
- Optional speech uses available English device/browser voices, with restrained
  per-guardian pitch/rate choices. It is not recorded actor voiceover. Local
  voices are preferred; actual voice availability and sound vary by device.
- **Heroic announcer** is the default original delivery: lower pitch, slower
  pacing and restrained per-guardian variation. **Natural storyteller** restores
  the earlier delivery. Neither preset is a replica of a performer or character.
  The in-scene voice picker lists only available English device voices, with
  Automatic as a fallback. Changing delivery or voice auditions the current line
  when audio/narration are enabled; it never unmutes or advances the scene.
  Delivery and voice choice are remembered independently of wallet/game data.
- Sound stays opt-in. Preferences persist, while each new page requires a click
  to unlock playback. A rejected/suspended audio context does not falsely show
  playback as enabled. The status explains unavailable or blocked narration.
- Advancing dialogue, replay, mute, skip, Escape, close, access loss and hidden
  tabs cancel the relevant queued speech/effects. Old speech callbacks cannot
  change a later line. Returning to the tab resumes only quiet ambience;
  narration requires explicit replay. Music ducks while narration speaks.
- Reduced motion retains music and text/voice while omitting unseen movement
  cues. Speech completion never advances text, starts a wave, changes battle
  time, affects wallet ownership, spends TREE or changes saved progression.

## Verification

267 local tests pass, zero failures, one existing Windows-only skip on Linux.
Thirteen audio regressions cover opt-in, persisted preferences, cancellation, stale
callbacks, missing/delayed voices, silent speech startup, autoplay rejection,
hidden/ownership holds, reduced motion and manual progression. Syntax checks and
the protected function build pass.

`tools/check-audio-signal.mjs` accepts an optional development installation of
`web-audio-engine`. It renders the real graph across all four chapter/season
palettes, verifies finite non-silent unclipped output, and verifies silence after
scene close. This dependency is not part of the game or deployment.

`node tools/render-audio-check.mjs` produces isolated desktop and 390px component
checks from the real audio module, dialog markup and controls. Their scripts
parse successfully. The cloud browser's security policy blocked local-file
navigation; browser playback, physical phone layout and device narration were
not accepted by this check. It never bypasses holder access or loads gameplay.

## Published checkout test

Live at https://tree-token.xyz/play/canopy-defense/checkout-test/. Backend
`6aed02cdccaac36672b4b658`, routing `6aed035fb385f2f7869ac7f8`, source
`bc3d240`. Uploaded function digest matches the validated package. Linux,
Windows and PostgreSQL CI passed. The live entry includes all audio controls
inside the native story dialog, its stylesheet matches the source, and anonymous
source/access/payment requests remain protected.

All 43 existing production function identities/configurations, five scheduled
jobs and 299 static paths are preserved; only the checkout rewrite changed.
No wallet transaction or production database migration was initiated. Device
listening, narration and physical phone layout acceptance remain pending.
See [release evidence](../integration/tree-arcade/cutscene-audio-release-receipt.json).
