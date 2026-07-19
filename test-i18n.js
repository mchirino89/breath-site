// Key-parity checks for i18n.js. Run: node --test
//
// No package.json, no dependencies, no node_modules — this repo has no build step
// and should not grow one for a test that only needs to read three files.
//
// ponytail: the dictionaries are regex-scraped out of i18n.js rather than imported,
// because the file is a browser IIFE that touches window/location on load. The scrape
// relies on each dictionary closing with "  };" at two-space indent; test_scrape below
// fails loudly if that formatting ever stops holding.

const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = __dirname;
const src = fs.readFileSync(path.join(root, "i18n.js"), "utf8");
const pages = ["index.html", "support/index.html"].map((p) => ({
  name: p,
  html: fs.readFileSync(path.join(root, p), "utf8"),
}));

function keysOf(name) {
  const open = src.indexOf(`var ${name} = {`);
  assert.ok(open !== -1, `dictionary ${name} not found in i18n.js`);
  const close = src.indexOf("\n  };", open);
  assert.ok(close !== -1, `dictionary ${name} does not close with "  };"`);
  return src
    .slice(open, close)
    .split("\n")
    .map((line) => line.match(/^ {4}([A-Za-z][\w]*):/))
    .filter(Boolean)
    .map((m) => m[1]);
}

const base = keysOf("ES");
const overlays = { ES_AR: keysOf("ES_AR"), ES_ES: keysOf("ES_ES") };

// Every key referenced by the pages, whether through markup or the t() helper.
const used = new Set();
for (const { html } of pages) {
  for (const m of html.matchAll(/data-i18n="([^"]+)"/g)) used.add(m[1]);
  for (const m of html.matchAll(/\bt\(\s*"([^"]+)"/g)) used.add(m[1]);
}

// Runs the real i18n.js against a stub DOM. Key parity above proves the dictionaries
// line up; this proves the resolution actually picks the right one, which is where
// the interesting bugs are (a region regex that matches too much or too little).
function render(tag, keys) {
  const nodes = keys.map((key) => ({ key, innerHTML: "ENGLISH", getAttribute: () => key }));
  const ctx = {
    location: { search: "?lang=" + tag },
    navigator: { language: "en-US" },
    document: { documentElement: { lang: "en" }, querySelectorAll: () => nodes },
    URLSearchParams,
  };
  ctx.window = ctx;
  vm.runInContext(src, vm.createContext(ctx));
  const out = {};
  for (const n of nodes) out[n.key] = n.innerHTML;
  return { text: out, lang: ctx.document.documentElement.lang, t: ctx.t };
}

test("English is left alone", () => {
  const r = render("en-US", ["invite"]);
  assert.equal(r.text.invite, "ENGLISH", "English page must not be rewritten");
  assert.equal(r.lang, "en");
  assert.equal(r.t("copied", "Copied ✓"), "Copied ✓", "t() must fall back to English");
});

test("neutral Spanish is tuteo and says Configuración", () => {
  for (const tag of ["es", "es-419", "es-mx", "es-ve"]) {
    const r = render(tag, ["invite", "subs"]);
    assert.match(r.text.invite, /instala Breath/, `${tag} should be tuteo`);
    assert.match(r.text.subs, /Configuración/, `${tag} should say Configuración`);
    assert.equal(r.lang, tag);
  }
});

test("Rioplatense is voseo, and still says Configuración", () => {
  for (const tag of ["es-ar", "es-uy", "es-py"]) {
    const r = render(tag, ["invite", "copyFail", "subs"]);
    assert.match(r.text.invite, /instalá Breath/, `${tag} should be voseo`);
    assert.match(r.text.copyFail, /mantené/, `${tag} should be voseo`);
    // The two axes are independent: voseo does not drag Spain's terminology along.
    assert.match(r.text.subs, /Configuración/, `${tag} is Latin America, not Spain`);
    assert.match(r.text.subs, /abrí/, `${tag} prose should be voseo around Apple's nouns`);
  }
});

test("Spain says Ajustes and stays tuteo", () => {
  const r = render("es-es", ["invite", "subs", "health", "reminders"]);
  assert.match(r.text.invite, /instala Breath/, "Spain is tuteo");
  for (const k of ["subs", "health", "reminders"]) {
    assert.match(r.text[k], /Ajustes/, `${k} should say Ajustes in Spain`);
    assert.doesNotMatch(r.text[k], /Configuración/, `${k} must not say Configuración in Spain`);
  }
});

test("Chile takes the neutral base, not voseo", () => {
  const r = render("es-cl", ["invite"]);
  assert.match(r.text.invite, /instala Breath/, "Chilean voseo is informal-register, excluded");
});

test("a non-Spanish tag starting with 'es' is not treated as Spanish", () => {
  const r = render("est", ["invite"]);
  assert.equal(r.text.invite, "ENGLISH", "'est' must not match the es( -|$) guard");
});

test("scrape found a plausible dictionary", () => {
  assert.ok(base.length > 10, `only scraped ${base.length} base keys — formatting changed?`);
  assert.ok(overlays.ES_AR.length > 0, "scraped no es-AR keys");
  assert.ok(overlays.ES_ES.length > 0, "scraped no es-ES keys");
});

test("no duplicate keys within a dictionary", () => {
  for (const [name, keys] of [["ES", base], ...Object.entries(overlays)]) {
    const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
    assert.deepEqual(dupes, [], `${name} declares these keys twice: ${dupes}`);
  }
});

test("every key the pages reference has a translation", () => {
  const missing = [...used].filter((k) => !base.includes(k));
  assert.deepEqual(missing, [], `referenced but untranslated: ${missing}`);
});

test("every translation is actually referenced", () => {
  const orphans = base.filter((k) => !used.has(k));
  assert.deepEqual(orphans, [], `translated but unused: ${orphans}`);
});

// The one that catches real bugs. An overlay key that is not in the base never
// applies to anything and never errors — it just silently stays English forever.
test("every overlay key exists in the base", () => {
  for (const [name, keys] of Object.entries(overlays)) {
    const stray = keys.filter((k) => !base.includes(k));
    assert.deepEqual(stray, [], `${name} has keys absent from ES (typo?): ${stray}`);
  }
});

// Overlays are meant to be sparse. A key whose overlay value equals the base is a
// merge that does nothing, and usually means a variant was edited in the wrong place.
test("overlay values differ from the base", () => {
  for (const name of Object.keys(overlays)) {
    const open = src.indexOf(`var ${name} = {`);
    const block = src.slice(open, src.indexOf("\n  };", open));
    for (const m of block.matchAll(/^ {4}([A-Za-z]\w*): "((?:[^"\\]|\\.)*)"/gm)) {
      const baseOpen = src.indexOf("var ES = {");
      const baseBlock = src.slice(baseOpen, src.indexOf("\n  };", baseOpen));
      const baseVal = baseBlock.match(
        new RegExp(`^ {4}${m[1]}: "((?:[^"\\\\]|\\\\.)*)"`, "m")
      );
      assert.ok(baseVal, `${name}.${m[1]} has no base value`);
      assert.notEqual(m[2], baseVal[1], `${name}.${m[1]} is identical to ES — drop it`);
    }
  }
});
