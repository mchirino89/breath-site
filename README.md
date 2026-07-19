# breath-site

Static site for [Breath](https://apps.apple.com/app/id6791719844), the one-minute
breathing app. Served by GitHub Pages from `main` at
`https://geekingwithmauri.com/breath-site`.

| Path | Purpose |
|---|---|
| `/` | Referral landing (`?ref=CODE`), or a redirect to the App Store without one |
| `/privacy/` | Privacy policy — linked from the paywall (`LegalURL.privacyPolicy`) and App Store Connect |
| `/terms/` | Terms of use — linked from the paywall (`LegalURL.termsOfUse`) |
| `/support/` | Support page — linked from App Store Connect |

These pages previously lived in the personal blog repo (`geekingwithmauri.com/breath/*`).
Moved here 2026-07-18 so Breath stops squatting in the blog's navigation.

## The referral flow

`index.html` is the one page every share surface in the app links to. The app builds
the URL in `ShareInvite.url(code:)` (`BreathCore/Sources/BreathCore/Referrals/`), so
a share is always `…/breath-site?ref=ABC234`.

Two audiences hit that URL, and the page has to serve both:

- **App installed** → iOS opens the app directly via Universal Link; this page never
  renders. `ShareInvite.code(fromIncoming:)` reads the `?ref=`.
- **App not installed** → the page renders: it shows the code, offers a Copy button,
  and links to the App Store. The friend installs, launches, and pastes into the
  paste card on first run.

That copy-and-paste hand-off exists because iOS has no install referrer. The
alternatives — silent pasteboard reads, fingerprinting, an attribution SDK — were all
rejected. One manual paste is the price of not doing those.

The page links here rather than straight to `apps.apple.com` for one reason: Apple
drops query params, which would erase the code and with it any attribution.

No `?ref=`, or a malformed one, and the page redirects to the App Store — the old
behaviour, unchanged. Validation is client-side and deliberate: 6 chars from
`ReferralCode.alphabet`, sanitized before it ever touches the DOM. The redirect is
JS-only; a `<meta refresh>` in `<head>` would fire before the script could cancel it
on the referral path.

## The AASA file is not in this repo

Universal Links require `apple-app-site-association` at the **domain root**
(`geekingwithmauri.com/.well-known/`). This is a GitHub Pages *project* site, so it
only ever serves from the `/breath-site` path — it cannot publish anything at the
root. The file therefore lives in the blog repo (`~/Projects/Blog`, branch `master`),
which is the user Pages site that owns the apex domain, scoped to `/breath-site*`.

Jekyll skips dot-directories, so the blog's `_config.yml` carries
`include: [".well-known"]`. After changing it, `curl` for a 200 + JSON body before
touching Xcode — iOS caches AASA hard and re-verification needs a fresh install,
which makes simulator testing useless. Maestro drives the handler through the
DEBUG-only `breath-uitest://redeem?ref=ABC234` scheme instead; AASA itself is
verified by curl plus one manual tap on a real device.

## Editing

Plain HTML, no build step. `.nojekyll` disables GitHub's Jekyll processing.
Push to `main` and Pages redeploys.

## Careful

Changing this repo's name or the page paths breaks three live things at once:
the App Store privacy URL, every referral link already shared, and the AASA
`components` path in the blog repo. Update in the same change:

- `fastlane/metadata/*/privacy_url.txt` (app repo)
- `ShareInvite.baseURL` (`BreathCore/Sources/BreathCore/Referrals/ShareInvite.swift`)
- `LegalURL` (`Breath/Subscriptions/PaywallView.swift`)
- `.well-known/apple-app-site-association` (blog repo)
