# Illustrated mode entrance

The holder mode chooser uses the existing Canopy home forest painting, original Oak guardian and the face-free Tree of Life. Campaign has a green forest treatment; Harvest uses a warm autumn treatment. No character atlas or gameplay changes are included.

The saved-battle row uses a bounded grid with a flexible text column and an explicitly auto-width Continue action. This overrides the generic `dialog .primary { width:100% }` rule that stretched the previous row beyond the dialog and crushed its text. At 720px and below the action spans a separate row; at 540px and below the mode cards stack. Focus outlines, native dialog semantics, existing control IDs, saved-run protection, unlocks, prices and access guards remain intact.

Descriptions identify Campaign as the three-forest main adventure and Harvest as the separate five-wave autumn challenge. Shared permanent progress and replacement of run-only supplies remain explained.

Validation: 321 tests passed, one Windows-only test skipped; syntax checks passed. Local Chromium visual/layout verification could not run because the workspace denied its process socket. Authenticated desktop/phone visual acceptance remains pending; do not claim measured viewport or overflow results from the blocked browser attempt.

Published to the existing checkout-test URL from `4b67eae7a35c7a0202bb2c5f337823bf87adeeb3`. Backend `6aee68dbc19b3cdd6eb0a290`; routing `6aee6967c673047a3cd02e58` replaces `6aee644e07529c5e9edbbb8d`. Both CI runs passed. Hosted HTML, CSS, gateway and original art match the source; protected modules and endpoints remain unauthorized anonymously. Release verification preserved 43 functions, five schedules and 299 static paths, with only `/_redirects` changed. See [release receipt](../integration/tree-arcade/mode-entrance-polish-release-receipt.json).
