# Polished Canopy home screen

Layout update: see [play-first-home.md](play-first-home.md) for the compact gameplay-first menu and levels 1–6. The earlier tall hero and Veteran disclosure below are historical.

Artwork correction: the two-character collage described below has been superseded by the unified Oak / Archer Watchtower forest scene. See [home-scene.md](home-scene.md) for the current asset, generation prompt and release. The other menu improvements below remain.

Tree Hero stays in the opening artwork, paired with a full-resolution Ancient Oak cropped from the actual `oak-warriors.png` game atlas. `tools/render-home-guardian.mjs` uses the game's atlas bounds to reproduce `assets/brand/oak-home.png`; no substitute character or external image service is used.

The hero has a two-line game title, concise forest-defense copy, total campaign/defender/event features and two navigation links. Enter the battlefield scrolls to the existing canvas; it does not reset a run, launch a wave or spend currency. Choose a chapter scrolls to the existing campaign controls. The forest card includes the existing rank/summary plus an accessible campaign-star progress bar updated from actual standard stars.

Chapter choices now precede Veteran mode. Veteran is a clearly labeled native disclosure with the existing start buttons and unlock rules; its summary reports locked/unlocked/active state. Harvest has its existing entry control and a labeled expandable rewards/equipment collection. All existing reward canvases, checkboxes, access rules and event progress stay. Halloween remains archived. This shortens the wall of panels without removing access to any gameplay controls.

CSS uses navy, teal, mint and restrained gold, with a framed cast scene, stronger typography, consistent spacing and explicit call-to-action links. Small-screen rules keep both characters visible, stack chapter cards and keep controls touch-sized. The existing NFTree entry gate is unchanged; the game shell remains hidden until verified access.

Validation: all 193 tests passed with one Windows-only skip; JavaScript syntax and whitespace checks passed. HTML tag nesting and unique IDs were checked, and esbuild parsed CSS for Safari 17 with zero warnings. The source-resolution Oak export was visually inspected. Signed-in browser layout, phone interaction and full rendered-page visual acceptance remain pending. The canonical checkout-test update is live.

## Release

URL: https://tree-token.xyz/play/canopy-defense/checkout-test/

Source `82ecf7c0579bd230d8c7e4ba72bc9caca95db33d`; backend `6ae7c65db1995270696e6593`; routing release `6ae7c6ca73c2c5158f3bfe33`. Both CI runs passed (41360555839 and 41360552145). The home HTML, stylesheet and Oak PNG return 200; the served PNG matches the source hash. Anonymous game source/access/payments return 401. Preserved all 284 existing static entries, 41 function identities/configurations and five schedules; only the checkout-test rewrite changed. Regular game and purchase logic are unchanged.

The review browser was observed at the NFTree sign-in screen with no wallet connected. No authentication bypass or fabricated signed-in screenshot was used. Full signed-in desktop and phone visual acceptance remains pending in a holder session.
