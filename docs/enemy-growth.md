# Visible enemy growth

Enemy health already rises with each wave and chapter; Veteran adds 2.4× health, faster movement, reinforced beetles and a half-health boss enrage. This release makes that progression visible without adding another health or armor multiplier or changing prices, rewards, targeting or route geometry.

Newly spawned pests receive a saved visual tier. Campaign progress is wave + 2 × chapter index: below 4 is Broodling, 4–7 Hardened, 8+ Elite. Seasonal progress uses twice the five-wave event index. Beetles, termites and blight grow 18% then 38% over their base silhouette. Moths grow only 6% then 14%, keeping their agile identity. Boss size grows up to 22% over its already larger base. New ridges, broad beetle plates, wing markings and blight nodules distinguish the stages. Decorative details do not add new damage resistance.

Scouting labels and portraits use the same stage helper as spawning. Veteran reinforced beetles retain their gold shell marker; enraged Veteran bosses gain red eyes and horn/body accents, including in reduced-motion mode. Their movement change remains the existing +30% below half health. Health bars move above the enlarged boss horns. Defeat silhouettes preserve their size and stage. Old saved enemies lacking tier metadata retain their original size and unchanged health; later spawns use the new appearance.

`node tools/render-enemy-growth.mjs` renders `enemy-morphology-preview.jpg` directly from the game painter. It is an artwork comparison, not a screenshot of a hosted signed-in battle. Only the final column shows the boss because it arrives in the final wave.

Validation: 192 passing tests, one Windows-only skip, zero failures; syntax and whitespace checks passed. Tests cover real health and visual growth, all campaign/event scout-to-spawn stages, save compatibility, enrage eligibility and defeat silhouettes. Existing campaign, Veteran, payment and individual-collection checks remain passing. Signed-in holder and phone visual acceptance remain pending. Live in the canonical checkout-test preview; see release details below.

## Release

Canonical URL: https://tree-token.xyz/play/canopy-defense/checkout-test/

Source `6ef7b5627a16a3725a163af744901bc2314f61b3`; backend `6ae7b88dd62e7b1f4fe7b649`; routing release `6ae7b8f36df0a5a02b5a7735`. Both CI validation runs passed (41355631913 and 41355627087). Preserved all 284 existing static entries, 41 function identities/configurations and five schedules; only `/_redirects` changed. Entry 200; anonymous source, access and payment endpoints 401. Individual defender checkout remains enabled, and no migration or purchase-price change was introduced. The regular game is unchanged. Signed-in holder and phone visual acceptance remain pending.

## Distinct later-stage anatomy

Following player feedback that the first pass mainly looked larger, Hardened and Elite forms now use a separate anatomy painter. Soldier termites have a wedge abdomen, layered dorsal shields, large curved mandibles and hooked limbs. Beetles have broad shield-like wing cases, shoulder spikes and a rhino horn that branches in elites. Moths gain torn angular wing contours, stronger wing eye markings and a narrow segmented body. Blight develops an irregular carapace, thorn rows, pale nodules and fissures. The Blight King combines a broad armored abdomen, forked crown and outer tusks. Earlier forms and saved legacy-tier enemies keep their original drawing.

These are appearance changes; health, damage resistance, speed and rewards remain unchanged. Enrage, poison and slow markers remain available. Scout portraits fit the taller horns and jaws. The updated comparison sheet equalizes drawing scale within each row so anatomy changes can be judged separately from existing game size progression. Only the final column shows the boss, as before. Hosted anatomy update pending.
