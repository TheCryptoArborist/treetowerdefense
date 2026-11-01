# Visible enemy growth

Enemy health already rises with each wave and chapter; Veteran adds 2.4× health, faster movement, reinforced beetles and a half-health boss enrage. This release makes that progression visible without adding another health or armor multiplier or changing prices, rewards, targeting or route geometry.

Newly spawned pests receive a saved visual tier. Campaign progress is wave + 2 × chapter index: below 4 is Broodling, 4–7 Hardened, 8+ Elite. Seasonal progress uses twice the five-wave event index. Beetles, termites and blight grow 18% then 38% over their base silhouette. Moths grow only 6% then 14%, keeping their agile identity. Boss size grows up to 22% over its already larger base. New ridges, broad beetle plates, wing markings and blight nodules distinguish the stages. Decorative details do not add new damage resistance.

Scouting labels and portraits use the same stage helper as spawning. Veteran reinforced beetles retain their gold shell marker; enraged Veteran bosses gain red eyes and horn/body accents, including in reduced-motion mode. Their movement change remains the existing +30% below half health. Health bars move above the enlarged boss horns. Defeat silhouettes preserve their size and stage. Old saved enemies lacking tier metadata retain their original size and unchanged health; later spawns use the new appearance.

`node tools/render-enemy-growth.mjs` renders `enemy-growth-preview.jpg` directly from the game painter. It is an artwork comparison, not a screenshot of a hosted signed-in battle. Only the final column shows the boss because it arrives in the final wave.

Validation: 192 passing tests, one Windows-only skip, zero failures; syntax and whitespace checks passed. Tests cover real health and visual growth, all campaign/event scout-to-spawn stages, save compatibility, enrage eligibility and defeat silhouettes. Existing campaign, Veteran, payment and individual-collection checks remain passing. Signed-in holder and phone visual acceptance remain pending. Canonical test deployment pending.
