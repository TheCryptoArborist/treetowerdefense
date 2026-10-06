# Seasons and long-term progression

Design direction accepted October 6, 2026. Seasonal themes are planned content, not implemented in the v0.10 preview. Event names, objectives, and rollout below are proposed first designs; no release dates or final prices are promised.

## Core loop

Defend the Tree of Life → earn campaign progress → unlock defenders → grow the roster → tackle new maps and challenges.

Keep the original fixed-route tower-defense format. Insect waves, placement, targeting and defender combinations remain the central decisions. Multiplayer raids and editable attackable bases are outside the current plan.

Permanent campaign progress gives players lasting goals. Seasonal events add fresh battle conditions and collectible appearances without erasing that progress. Every reward should have a visible requirement, progress indicator and preview.

## Progress that carries forward

- Preserve earned defenders, permanent species growth, best campaign stars and landmarks across seasons.
- Keep the existing eight defender unlock requirements. New combat roles should join the permanent campaign through earned milestones, so missing a holiday does not permanently deny a useful defender.
- Seasonal objectives award cosmetics and commemorative badges. These are game collectibles, not token rewards or financial prizes.
- An earned seasonal cosmetic stays in the collection after its event ends. Its use still requires game access. NFT rarity appearance privileges remain separate, cumulative and cosmetic only.
- Starting a new run remains included with NFTree ownership. Sap plants defenders; TREE pays for supplies, species upgrades and continues. Seasonal access is included; there is no additional season-pass fee.
- Do not require a TREE purchase to complete an event objective. Optional purchases follow the existing review and confirmation flow.

## Reusable event format

Build a small event chapter beside the permanent campaign. Start with one themed battlefield, five authored waves and one boss encounter. Use a fixed route and the existing placement controls; later campaign maps can introduce new routes and placements.

Each event has three goals: finish the chapter, achieve a mastery condition, and replay with a different strategy. Rewards unlock once. Avoid objectives that require paid upgrades, specific NFT rarity, repeated spending or consecutive daily attendance.

An event panel shows the theme, exact availability when scheduled, objectives, progress and reward previews. Expiry stops new event runs; a saved run may finish under its original rules. Returning players keep earned rewards. Historical challenge content can return in an archive or repeat event; scheduling and archival policy must be chosen before public launch.

Changes in theme must preserve readable pests, build sites, range indicators, target direction and projectile origins. Mature painterly fantasy art remains the standard. Decorations must not cover the route or create misleading combat effects.

## First theme concepts

| Event | Battlefield and enemies | Tactical challenge | Earned appearance ideas |
| --- | --- | --- | --- |
| Halloween: Haunted Grove | Moonlit roots, amber lanterns, webbed ruins; dusk moths and spectral-looking insect shells | Alternate fast groups and armored escorts; scout and change targeting to intercept threats | Lantern Oak, web-carved Watchtower, Haunted Grove badge |
| Thanksgiving: Harvest Hollow | Copper leaves, harvest baskets, weathered timber; leaf beetles and grain-weevil swarms | Separate bulky escorts from clustered swarms so rapid fire and splash each have a purpose | Harvest Pine, copper-leaf Cannon trim, Harvest Defender badge |
| Christmas: Winter Canopy | Snow-dusted bark, evergreen garlands, restrained warm lights; frost beetles and winter moths | Alternating armor and speed pressure with gaps that reward thoughtful coverage | Evergreen Willow, frost-etched tower foundations, Winter Guardian badge |

Seasonal insect names and appearances do not automatically confer new mechanics. Any special behavior must have an explicit rule, scouting explanation and test. Keep the Tree of Life face-free and preserve the NFTree stump-warrior identity.

## Halloween first event specification

Suggested access: complete Emerald Crossing. This uses an existing campaign milestone and gives players six available defenders, including the Watchtower. Design the standard event to be completable with Sapling defenders and earned Sap alone.

| Wave | Purpose | Proposed composition |
| --- | --- | --- |
| 1 | Establish the themed battlefield | Termite groups with a small moth flank along the fixed route |
| 2 | Test armor response | Beetles spaced between ordinary pests |
| 3 | Test crowd control | Dense termite groups followed by fast moths |
| 4 | Test target selection | Armored escorts mixed with blight and moths |
| 5 | Resolve the chapter | A themed boss with escort groups; clear arrival warning and visible health |

Use existing pest rules first. Counts, health, speed, spawn timing, planting budget and boss stats require a balance pass before implementation is considered complete. Seasonal difficulty should be authored explicitly rather than inheriting a sudden late-wave multiplier.

Proposed once-only goals:

1. Finish all five waves: Haunted Grove badge.
2. Finish with at least 80 Tree of Life health: Lantern Oak appearance.
3. Finish a run containing at least three distinct defender types: web-carved Watchtower appearance. Optional unlocked types are allowed, never required.

Measure the third goal from defenders actually planted during that event run. Goals may complete together. A retry costs no admission fee; continues remain optional TREE purchases. Cosmetic rewards never modify damage, range, speed, Sap income or growth costs.

## Implementation sequence

1. Strengthen permanent enemy variety and wave challenges so each existing defender has a useful role. Explain counterplay in scouting and retain an achievable Sap-only campaign.
2. Add a separate event identifier and data-driven event definitions: route/placements, wave rules, theme assets, access milestone and objectives. Keep permanent campaign stars and existing chapter IDs stable.
3. Add event progression and cosmetic collection fields with defaults for older saves. Save the event ID and rules version with an active event run; do not replace its queued enemies on reload or a theme change.
4. Build the five-wave Halloween preview and an event panel. Reuse targeting, pause, purchases, touch controls and labeled build-site buttons.
5. Balance and verify Halloween before creating Harvest Hollow and Winter Canopy from the same event format.

## Completion checks for an event implementation

- An old v1/v2 save retains funds, growth, roster, stars and its active battle.
- A new event does not reset campaign progress or previously collected cosmetics.
- All allowed rarity tiers face the same battle rules and objective requirements.
- Standard event completion is demonstrated with starter growth and Sap only; objectives are reachable with the stated access milestone's roster.
- Rewards are awarded once, survive reload and new runs, and confer no combat benefit.
- Scouting uses the exact event lineup; attacks still face their targets and originate at weapon sockets.
- Pause, reload, defeat/continue and expiry preserve the active event's rules and queue.
- Mobile and keyboard flows expose event goals, locked requirements, purchase cancellation and reward previews clearly.

The current preview uses editable local saves and simulated access/payments. Production ownership, payment verification and durable player progress remain separate implementation milestones. This design introduces no treasury sales, burns, reward splits or cash payouts.
