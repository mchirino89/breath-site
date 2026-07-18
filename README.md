# breath-site

Static site for [Breath](https://apps.apple.com/app/id6791719844), the one-minute
breathing app. Served by GitHub Pages from `main`.

| Path | Purpose |
|---|---|
| `/` | Redirects to the App Store listing (`id6791719844`) |
| `/privacy/` | Privacy policy — linked from the paywall (`LegalURL.privacyPolicy`) and App Store Connect |
| `/terms/` | Terms of use — linked from the paywall (`LegalURL.termsOfUse`) |

These pages previously lived in the personal blog repo (`geekingwithmauri.com/breath/*`).
Moved here 2026-07-18 so Breath stops squatting in the blog's navigation.

## Editing

Plain HTML, no build step. `.nojekyll` disables GitHub's Jekyll processing.
Push to `main` and Pages redeploys.

## Careful

`/privacy/` is the URL declared in App Store Connect. Changing this repo's name or
the page paths breaks a live App Store link — update ASC metadata
(`fastlane/metadata/*/privacy_url.txt` in the app repo) in the same change.

The app-side constants are `LegalURL` (`Breath/Subscriptions/PaywallView.swift`)
and `ShareInvite.baseURL` (`BreathCore/Sources/BreathCore/Referrals/ShareInvite.swift`).
