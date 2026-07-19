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

## Languages

The landing and support pages ship English in the markup; `i18n.js` applies Spanish
over it at load. JS-off, a crawler, or a broken script all yield the English page
rather than a blank one.

| Browser locale | Result |
|---|---|
| anything non-`es` | English |
| `es`, `es-419`, `es-MX`, `es-CL`, … | Neutral Latin American Spanish, tuteo, "Configuración" |
| `es-AR`, `es-UY`, `es-PY` | Rioplatense voseo — `instalá`, `tocá`, `cancelás` |
| `es-ES` | Neutral tuteo, but "Ajustes" — Apple's own term in Spain |

`es-CL` deliberately takes the neutral base: Chilean voseo is informal-register and
doesn't belong in UI copy. Spain gets an overlay for essentially one word, because the
support page is step-by-step navigation through the iOS Settings app and Apple names it
differently there — wrong term, and the instructions point at a menu the user doesn't
have.

`/privacy/` and `/terms/` stay English. Two versions of a legal document raise "which
one governs?", so the Spanish support page says outright that they're in English rather
than dropping someone into a wall of it unannounced.

Add `?lang=es-AR` (or `es`, `es-ES`, `en`) to any URL to force a variant — the only way
to check all four without changing your phone's settings. There is no visible language
toggle; the landing page is five lines of text and a button, and a picker would be the
third-most prominent thing on it.

Overlays in `i18n.js` are **sparse**: a key absent from `ES_AR` means the base is
already correct, not that nobody translated it. `node --test` enforces that — including
the case that otherwise fails silently forever, an overlay key misspelled so it matches
nothing.

Voice follows the app's String Catalog: tú throughout, `alguien` rather than `tu amigo`,
and strings the app already ships (`Restaurar compras`, `Política de privacidad`,
`Términos de uso`) reused verbatim. The site naming a button differently than the app
labels it is worse than not translating at all.

Full rationale: [`docs/plans/2026-07-19-breathsite-localization-design.md`](docs/plans/2026-07-19-breathsite-localization-design.md).

## Universal Link examples

The AASA pattern is `/breath-site*`, so **every** path in this repo is a Universal
Link, not just the referral landing.

| URL | App installed | App not installed |
|---|---|---|
| `https://geekingwithmauri.com/breath-site` | Opens the app, no code redeemed | Page redirects to the App Store |
| `https://geekingwithmauri.com/breath-site?ref=ABC234` | Opens the app, `ABC234` redeemed | Page shows the code + Copy button |
| `https://geekingwithmauri.com/breath-site?ref=abc234` | Opens the app, redeemed (parser upcases) | Page shows `ABC234` |
| `https://geekingwithmauri.com/breath-site?ref=OOPS` | Opens the app, nothing redeemed | Page redirects — wrong length |
| `https://geekingwithmauri.com/breath-site?ref=ABC0I1` | Opens the app, nothing redeemed | Page redirects — `0`, `I`, `1` are not in the alphabet |
| `https://geekingwithmauri.com/breath-site/privacy/` | Opens the app, nothing redeemed | Renders the privacy policy |

The last row is the one that surprises people: the App Store privacy link is inside
the AASA scope, so on a device with Breath installed it opens the app instead of the
page. Harmless — `ShareInvite.code(fromIncoming:)` finds no `?ref=` and returns nil,
so the app just launches to home — but narrow the AASA `components` if that ever
needs to stop.

Codes are 6 chars from `ReferralCode.alphabet`, which omits `0`, `O`, `1`, `I` so a
code read aloud or off a screen can't be mistyped. Both sides validate independently:
`index.html` sanitizes before rendering, and `ReferralCode(parsing:)` re-checks in the
app. Neither trusts the other.

To test a link end to end, `curl` the AASA first (see below), then tap a real link on
a real device — the simulator won't do it:

```bash
curl -sS https://geekingwithmauri.com/.well-known/apple-app-site-association
```

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

Translations live in `i18n.js`. After touching them:

```bash
node --test        # key parity + locale resolution, no package.json, no dependencies
```

To view it as served (the pages load `i18n.js` by absolute path, so opening
`index.html` from disk won't find it):

```bash
ln -sfn "$PWD" /tmp/breath-site
python3 -m http.server 8731 --directory /tmp
# then http://localhost:8731/breath-site/?ref=ABC234&lang=es-AR
```

## Careful

Changing this repo's name or the page paths breaks three live things at once:
the App Store privacy URL, every referral link already shared, and the AASA
`components` path in the blog repo. Update in the same change:

- `fastlane/metadata/*/privacy_url.txt` (app repo)
- `ShareInvite.baseURL` (`BreathCore/Sources/BreathCore/Referrals/ShareInvite.swift`)
- `LegalURL` (`Breath/Subscriptions/PaywallView.swift`)
- `.well-known/apple-app-site-association` (blog repo)
- the `<script src="/breath-site/i18n.js">` tags and the `/breath-site/` links inside
  `i18n.js`'s `legal` string — absolute paths, so a rename silently un-localizes both
  pages rather than erroring
