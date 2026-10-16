# Battle reports · v0.16

Victory and defeat expose a report below the battlefield, with a direct link from the outcome card. It separates breach counts by pest, actual health damage, shield absorption, wave clears, total run kills, earned Sap, preview TREE spent, continues and newly earned roster/season rewards. A pest-specific defense tip and a permanent unlock or seasonal goal provide a next step.

Sap earned counts kill awards and wave bonuses, excluding the starting 300 Sap and planting refunds. TREE spent counts confirmed upgrades, supplies and continues in this run, including permanent species purchases. It is simulated spending, not developer revenue. No token or cash award is added. Damage counts actual health lost, so multiple continues may exceed 100 cumulative health lost. Breaches include pests absorbed by a shield. Total kills remain the existing full-run counter.

The optional version-1 runReport field is additive to v2 saves. New runs reset it; reload and continue retain it. Missing or invalid reports start partial history without discarding funds, living pests, queued waves, geometry, growth or progress. The report labels this limit explicitly and never reconstructs unrecorded breach/reward history. Newly earned unlock lists are deduplicated on restore. Core combat, prices, Sap awards, unlock criteria and stars are unchanged.

Validation: report tests exercise actual campaign battles on all three maps, Haunted Grove wave transitions, breaches with shields and health clamping, continues, saves, missing/invalid report migration, rewards and counter invariants. Browser layout, scrolling, focus and mobile interactions still require manual verification because supported browser QA is unavailable in this environment.
