# Christmas campaign teaser

A separate illustrated section in the mode entrance announces **Christmas Chaos**, the upcoming Christmas campaign. The target opening date is **Friday, November 27, 2026**, the day after U.S. Thanksgiving. It is visibly labeled “Teaser only — not playable yet.”

The teaser uses original Oak guardian and Tree of Life artwork over the existing forest painting, with a cold blue palette and static decorative snow. It has no launch button, purchase action or gameplay handler. Campaign and Harvest keep their current navigation, unlocks and saves. On phones, the artwork stacks above the copy.

This change announces the campaign; the winter encounters, rewards and in-game timed availability are not implemented by this teaser. The separately scheduled launch-day task does not itself implement a timed unlock.

Local rendering remains unavailable because workspace Chromium and the native screenshot service were blocked in the preceding task. Holder desktop/phone visual review remains pending.

Published to checkout-test from `97646d03b31ed3c24d39c488171e8a66feaf43e9`. Backend `6aee6d91d4b0b30aa01afa02`; routing `6aee6e292c39ae987fa35641`. Both CI runs passed. Hosted markup includes the teaser/date/status and styles match source. Release checks preserve 43 functions, five schedules and 299 paths, with only `/_redirects` changed. See [release receipt](../integration/tree-arcade/christmas-teaser-release-receipt.json).

The revised Christmas preview features the original Oak guardian in a Santa hat and the face-free Tree of Life with Christmas lights and snow, composed as one dedicated transparent illustration. The date remains November 27, 2026; this artwork does not enable Christmas gameplay.

The festive teaser illustration is live with the orchard revision from `5b41029f87bbdb9e3b3d3efaabc9f6b613f7dc3b`; see [combined release receipt](../integration/tree-arcade/harvest-orchard-release-receipt.json).
