# The living frontier

The world map presents every existing campaign wave as territory to inspect:
60 waves across Levels 1–6, plus the five-wave Harvest seasonal branch. Each
region has a winding route, individual wave markers, cleared progress, current
or next wave, bosses and earned defender milestones. Standard and Veteran
territory retain their separate stars. Harvest never grants campaign stars.

Open **Explore the world map** above the battlefield, or **World map** beside
the wave controls. Region shortcuts, the region selector and **Find my wave**
support quick navigation. Every marker is a labeled native button. Locked
regions can be scouted. The briefing uses the same lineup and encounter rules
as the real battle, including legacy saved runs without mini-bosses.

Inspecting a marker never starts, skips or replays that wave. The active region
offers a return to the current battle; another unlocked region uses the existing
new-level/event flow and always begins at wave 1. Unfinished battles retain the
existing reset confirmation. Opening the atlas pauses a running battle, and
closing it leaves Resume manual. Other dialogs, pending travel and lost NFTree
access block conflicting actions. Travel is single-flight.

## Expansion and saved progress

The atlas follows the main TREE project's live website styling. Its scoped
palette comes from the `--ecosystem-*` values on https://tree-token.xyz/:
navy `#050714`, teal `#22e7d7`, green `#33f78f`, gold `#ffd84b`, amber
`#ffad32`, purple `#7041c3`, text `#f4fbff` and muted text `#aeb7cc`.
NFTree.net's related navy/teal/mint palette was also checked. Native sans-serif
type, teal route lines, green clears, amber bosses and gold selection highlights
carry the main website identity into the map. The header uses the existing
Thickquidity TREE logo and links to the project website. Original guardian,
Cannon, Watchtower and Tree of Life images appear as subdued regional artwork;
all are local assets, with no runtime requests to the project website.

`src/world-map.js` contains the region registry and derives wave nodes, routes,
briefings and progress. Layout height grows with the registry; existing battle
geometry is unchanged. The frontier explicitly marks additional territory as
unavailable. New regions need authored battle rules and unlocks before they can
be registered as playable; the map does not fabricate more battles. Keep stable
existing region IDs and wave IDs when extending the registry.

Standard progress uses existing best cleared waves and stars. The additive
optional `veteranBestWaves` array now records each Veteran clear across fresh
runs, chapter travel and reload. Old saves infer completed Veteran waves only
from existing medals and the active run. Invalid entries fall back safely.
No campaign stars, payments or entitlements derive from atlas history. This is
local game progress, and does not change verified NFTree access or paid growth.

## Validation and release state

279 local tests pass with zero failures and one existing Windows-only skip.
Twelve atlas tests cover all 65 wave forecasts, current-versus-cleared progress,
milestones, legacy encounter rules, separate progress and save migration, native
DOM controls, pausing, region focus, duplicate travel and access loss. Syntax,
whitespace and protected package builds pass.

`node tools/render-world-map.mjs` renders the real atlas scenery, wave geometry
and an example wave-10 state using offline native canvas. It produces a full
map and detail image under `.netlify/world-map-check`. These are component
illustrations, not browser screenshots or holder gameplay verification. Phone
layout, touch and authenticated gameplay acceptance remain pending.

This update is saved for review and is not published. Netlify CLI authorization
is still pending because the provider's grant permits team-wide project
management. The existing checkout-test backend and routing remain unchanged.
