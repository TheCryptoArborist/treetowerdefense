# NFTree ecosystem branding · v0.13

Requested October 14, 2026. The user clarified that the reference is **https://nftree.net/**. The current home page and stylesheet were fetched directly before implementing this update. This is a visual page update; the engine, battlefield art, seasonal objectives, prices and saved-state rules are unchanged.

## Shared palette

Values taken from `https://nftree.net/styles.css`:

| Role | Color |
| --- | --- |
| Page background | `#040810` |
| Secondary background | `#09121a` |
| Panel foundation | `#050c16` |
| Main text | `#f4fbff` |
| Muted text | `#a8bed4` |
| Teal highlight | `#00f1d2` |
| Mint green | `#7ef3a0` |
| Gold | `#ffd84b` |
| Amber | `#ffad32` |
| Danger | `#ff6b7c` |

The page uses dark navy panels, teal outlines/selection highlights, mint health feedback and gold-to-amber primary controls. Restrained cyan and warm background glows follow the reference. Native system font fallbacks match its approach without remote font dependencies. Haunted Grove retains its seasonal accent and the battlefield keeps its painterly forest palette for playability.

## Original artwork and destinations

Files are copied without pixel editing, resizing or recompression. CSS scales their display.

| Local asset | Source | Placement |
| --- | --- | --- |
| `assets/brand/tree-logo.jpg` | `https://nftree.net/assets/thickquidity-token-logo.jpg` | Header, favicon, TREE/NFTree ecosystem card |
| `assets/brand/garden-battles.jpg` | `https://nftree.net/assets/tree-arcade-garden-battles-logo.jpg` | Garden Battles card |
| `assets/brand/arboretum.jpg` | `https://nftree.net/assets/tree-arcade-arboretum-logo.jpg` | Arboretum card |
| `assets/brand/tree-force.jpg` | `https://nftree.net/assets/tree-arcade-force-89-logo.jpg` | TREE FORCE ’89 card |
| `assets/brand/tree-hero.png` | Supplied `b7a879df-3a71-4a8a-ab3b-de38e3e25ebd.png` | Introductory Tree Hero image |

Cards link to TREE home, NFTree, Arboretum, TREE Arcade and the existing Canopy Command site. The TREE Arcade destination `https://tree-token.xyz/play/` follows the actual link on NFTree.net. Links open in a separate tab with `noopener noreferrer`, so an active game remains open. Cards do not invent launch status or financial promises. The new images are served locally; playing does not depend on NFTree.net asset requests.

## Verification and limits

- All five new assets and existing HTML image references decode successfully; image paths exist and IDs remain unique.
- Existing game and launcher tests and JavaScript syntax checks pass. Launcher asset comparison now includes the branding directory and JPEGs; its existing fixture exercises a brand JPEG.
- Game engine and canvas art modules are unchanged. Local saves, purchase behavior and seasonal progression retain the same rules.
- Responsive styles adapt the intro image and ecosystem cards to narrow screens. Existing touch controls, keyboard controls, focus outlines and development-preview notices remain.
- Browser layout and interaction verification remain pending because the supported browser-preview capability is unavailable. No alternate browser path or preview server was used. Original source graphics were visually inspected.
