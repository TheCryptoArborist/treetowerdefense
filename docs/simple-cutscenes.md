# Cutscenes that simply play

Peter requested that the cutscene settings be removed, with the screenshot's
Heroic announcer and Microsoft Mark en-US voice becoming defaults. The native
dialog now contains only Skip and Return to battlefield (chapter results for
an ending). Motion, audio, narration, delivery, device voice, replay narration
and show-story controls are removed rather than hidden in another panel.

The app uses Heroic delivery and prefers Microsoft Mark en-US for both narration
and guardian dialogue. Other devices fall back to an available English voice;
device voice availability cannot be guaranteed. Old delivery, voice, motion
and show-story preferences no longer configure this simple presentation.
System reduced motion still applies automatically. The existing global sound
toggle and a remembered explicit mute remain available outside the dialog.
Sound defaults on for a fresh player and unlocks on the existing wave/story
click, respecting browser playback requirements. Unsupported or blocked audio
leaves the captions readable.

Narration flows into guardian dialogue automatically after the introduction:
at least twelve presentation seconds, a longer reading allowance for long
captions, and no interruption of active narration. A stalled speech engine
has a bounded timeout. The clock holds on hidden tabs, access loss and checkout.
Interrupted speech restarts its current line on return to a visible scene;
stale speech callbacks cannot advance or replace the current line.

Return and Skip close the scene immediately and stop its audio. They retain
the existing opening-wave continuation only when the player already requested
that wave. Between-wave scenes and replays never start a new wave themselves.
The dialogue remains visible until the player returns. Original sprite faces,
16-bit animation, text, score, battle balance and TREE payment rules are kept.

Six new regressions cover the fixed voice defaults, mute/fallback, resumed
speech, automatic beat pacing, silent/stalled speech, and the dialog's two
controls. Existing story and audio lifecycle tests remain in place.

## Release

Live on checkout-test from source `234962801363e334c9bd26657ee775deab1b3dc1`. Backend: `6aed630d633573778e46f39b`;
routing: `6aed63aa82fdd1d950dcb5ed`. All 311 local tests pass, one Windows-only
check is skipped, and syntax/protected packaging pass. GitHub validation run
`42167552365` passed Linux, Windows and PostgreSQL 16. All 43 production
function identities/configurations, five schedules and 299 static paths are
retained; only the checkout rewrite changed. Live HTML has two cutscene buttons
and no input/select fields; private source and payment routes return 401
without a holder session. Browser gate and hidden-dialog DOM were inspected;
the subsequent holder acceptance is recorded below.
See [release evidence](../integration/tree-arcade/simple-cutscene-release-receipt.json).

## Holder acceptance

Peter accepted the simplified scene on November 6, 2026: “That looks and
functions a lot better.” Preserve this layout and playback. The device was
not specified, and the voice was not separately identified. Follow-up live
checks confirm the two-button dialog with no settings, a working entrance,
and 401 protection for private playback source, access and payment endpoints.
Real TREE purchase/recovery and phone-wallet round-trip acceptance remain
pending; this approval is not a report of a successful payment.
