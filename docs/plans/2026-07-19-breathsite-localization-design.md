# BreathSite localization — design

**Date:** 2026-07-19
**Status:** designed, not implemented

Breath ships English and Spanish. The site does not, so a Spanish speaker who taps a
friend's referral link lands on an English page at the exact moment they are deciding
whether to install. This closes that gap, and regionalizes rather than settling for
neutral Spanish.

## Scope

| Surface | Localized | Why |
|---|---|---|
| `/` landing | Yes | Where a referral link lands cold. Highest value, lowest cost. |
| `/support/` | Yes | Read by choice, and its instructions are unfollowable in the wrong dialect. |
| `/privacy/`, `/terms/` | No | ~2000 words of legal text, and two language versions raise "which governs?". English stays canonical; the Spanish support page says so. |

## Mechanism

Browser-side detection, one HTML file per page, English in the markup and Spanish as
an overlay applied by JS.

The decisive constraint is `ShareInvite.baseURL`. It is deliberately a single canonical
URL so referral attribution never splits. Any `/es/` variant either splits that or makes
the app choose a locale when building a share link — and the referrer's phone language
is not the recipient's. Browser-side detection leaves `ShareInvite.baseURL`, the AASA
file, and the app untouched.

Rejected: server-side content negotiation (GitHub Pages is static; this means leaving
Pages), and duplicated `/es/` pages (splits the share URL, duplicates markup that drifts).

English lives in the HTML as source text; Spanish is applied over it. JS-off, a crawler,
or a broken script therefore yield today's English page rather than a blank one.

```js
// ?lang= wins (testing, and users on a foreign-language phone), then the browser.
var forced = new URLSearchParams(location.search).get("lang");
var tag = (forced || navigator.language || "").toLowerCase();
```

No visible language toggle. `?lang=es-AR` and `?lang=en` force a variant, which is
needed to test without changing phone settings. The landing page is five lines of text
and a button; a language picker would be the third-most prominent thing on it.

## Regionalization

Two-step resolution: a neutral base, then a sparse overlay.

```js
var ES    = { copy: "Copiar código", … };                      // neutral LatAm tuteo
var ES_AR = { invite: "…copialo, instalá Breath y pegalo…" };   // voseo
var ES_ES = { settings: "Ajustes" };                            // Apple's peninsular term
```

Overlays hold **only** what differs. A key absent from an overlay is a deliberate "the
base is already correct", not an untranslated gap. Most strings — `Copiar código`,
`Copiado ✓`, `Descargar Breath` — are identical across all three; only second-person
verbs and Apple's UI nouns move. Sparseness makes the entire regional difference
readable at a glance and stops strings drifting between variants.

```js
var region = /^es-(ar|uy|py)/.test(tag) ? "AR" : /^es-es/.test(tag) ? "ES" : null;
```

`es-AR`, `es-UY`, `es-PY` get voseo. Uruguay is Rioplatense proper and Paraguay is
voseo too. `es-CL` is deliberately excluded: Chilean voseo is informal-register and
does not belong in UI copy.

### Why Spain needs an overlay at all

Apple's own Spanish splits on the Settings app: their Latin America support docs say
**Configuración**, their Spain docs say **Ajustes**
([es-lamr](https://support.apple.com/es-lamr/109358),
[Configuración (Apple)](https://es.wikipedia.org/wiki/Configuraci%C3%B3n_(Apple))).
The support page is step-by-step navigation through iOS Settings. Wrong term, and the
instructions name a menu that does not exist on the user's phone. Worth confirming on
one real device in each region before shipping.

The `es-ES` overlay is otherwise empty — nothing on the landing page differs in Spain.

### Voseo does not collide with iOS

iOS ships tuteo in every Spanish locale, so Apple's menu names are unaffected by our
choice. The menu items are nouns (`Suscripciones`, `Notificaciones`, `Salud`); only our
verbs around them change. `Abrí Configuración → tocá tu nombre → Suscripciones` reads
natively in Buenos Aires with Apple's labels untouched.

## Copy

Voice follows the app's String Catalog: **tú** throughout (zero `usted` forms), and
`alguien` rather than `tu amigo` for the friend — the catalog already made that call in
`Cuando alguien se une con tu enlace`. `Friend's code → Código de tu amigo` is the one
place the app slipped; the site does not inherit the slip.

Strings the app already ships are reused **verbatim** — `Restaurar compras`,
`Política de privacidad`, `Términos de uso`. The site naming a button differently than
the app labels it is worse than not translating at all.

### Landing

| Key | English (in HTML) | Neutral `es` | `es-AR` |
|---|---|---|---|
| `title` | Breath — One Minute | Breath — Un minuto | — |
| `tagline` | One minute. That's the whole app. | Un minuto. Eso es toda la app. | — |
| `invite` | Your friend sent you an invite code — copy it, install Breath, and paste it on first launch. | Alguien te envió un código de invitación: cópialo, instala Breath y pégalo al abrirla por primera vez. | …copialo, instalá Breath y pegalo… |
| `copy` | Copy code | Copiar código | — |
| `copied` | Copied ✓ | Copiado ✓ | — |
| `copyFail` | Copy failed — long-press the code instead | No se pudo copiar: mantén presionado el código | …mantené presionado… |
| `get` | Get Breath | Descargar Breath | — |
| `redirect` | Taking you to the App Store… | Te llevamos a la App Store… | — |
| `openStore` | Open in the App Store | Abrir en la App Store | — |

The English em-dash becomes a colon in Spanish: same "here's what to do" beat, without
looking like a typo.

### Support

| Key | Neutral `es` | `es-AR` | `es-ES` |
|---|---|---|---|
| `contact` | Escribe a …: errores, dudas, problemas de facturación o un patrón que te gustaría que existiera. Te responde una persona, no una cola de tickets. | Escribí a … | — |
| `subs` | …abre **Configuración** → toca tu nombre → Suscripciones. Si cancelas, conservas el acceso hasta el final del período actual. | …abrí Configuración → tocá tu nombre… Si cancelás, conservás… | …abre **Ajustes** → toca… |
| `restore` | ¿Compraste Premium antes y no aparece? Toca Restaurar compras… | Tocá Restaurar compras… | — |
| `health` | …Puedes revocar el acceso en **Configuración** → Salud → Acceso a datos y dispositivos. | …Podés revocar… | …**Ajustes** → Salud… |
| `reminders` | …según cuándo practicas de verdad. Desactívalos en **Configuración** → Notificaciones → Breath. | …practicás… Desactivalos en… | …**Ajustes**… |
| `legal` | Política de privacidad · Términos de uso — disponibles en inglés. | — | — |

`legal` is the honest cell: the legal pages stay English, so the Spanish page says so
rather than linking a Spanish speaker into a wall of English unannounced.

## Files

| File | Change |
|---|---|
| `i18n.js` | New, ~40 lines. Dictionaries + resolve/apply. Loaded synchronously in `<head>`. |
| `index.html` | `data-i18n` attributes; existing script calls the swap before revealing the referral card. |
| `support/index.html` | `data-i18n` attributes. |
| `test-i18n.js` | New. `node --test`, no `package.json`, no dependencies. |

One shared `i18n.js` rather than dictionaries inlined per page: both pages share strings
(the tagline), and a single source means they cannot drift. Loading it synchronously
costs one cached request and buys a swap that lands before first paint.

Three strings are not in the DOM at load — the `<title>` and the two copy-button
outcomes, which the existing script writes at click time. They read from the same
dictionary through a `t(key)` helper, so a translation lives in exactly one place.

On the landing page the swap runs **before** the referral card is revealed, inside the
existing script rather than after it. Otherwise a Spanish speaker watches English
repaint — worst on the slowest phones, which is where referral traffic actually lands.

## Testing

`test-i18n.js` asserts:

1. Every `data-i18n` key in the HTML has a base entry.
2. Every base entry is used by some page — no orphans.
3. Every overlay key exists in the base. This is the one that catches real bugs: a
   typo'd overlay key fails silently and forever.

Manually, once: `?lang=es`, `?lang=es-AR`, `?lang=es-ES`, `?lang=en` on both pages, plus
one real device per region to confirm Apple's Settings terminology.

## Out of scope, worth doing later

Found in the app's String Catalog while matching voice — app-side, not site:

- `Get comfortable → Ponte cómodo` misgenders every female user. `Busca una postura cómoda` is neutral.
- `%@, locked → %@, bloqueado` disagrees in gender with `Cuadrada`, rendering "Cuadrada, bloqueado" in the accessibility label.
- `Friend's code → Código de tu amigo` is the gendered slip described above.
- The app has no regionalization at all — same voseo gap, larger surface.
