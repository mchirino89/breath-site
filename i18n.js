// Shared by index.html and support/index.html.
//
// English lives in the markup and Spanish is applied over it, so JS-off, a crawler,
// or a broken script all yield the English page rather than a blank one.
//
// Voice follows the app's String Catalog: tú throughout, and "alguien" rather than
// "tu amigo" for the friend — the catalog already made that call in "Cuando alguien
// se une con tu enlace". Strings the app ships (Restaurar compras, Política de
// privacidad, Términos de uso) are reused verbatim: the site naming a button
// differently than the app labels it is worse than not translating at all.
(function () {
  "use strict";

  // Neutral Latin American Spanish. Apple's Settings app is "Configuración" here;
  // Spain says "Ajustes" (see ES_ES).
  var ES = {
    // -- landing --------------------------------------------------------------
    landingTitle: "Breath — Un minuto",
    tagline: "Un minuto. Eso es toda la app.",
    invite: "Alguien te envió un código de invitación: cópialo, instala Breath y pégalo al abrirla por primera vez.",
    copy: "Copiar código",
    copied: "Copiado ✓",
    copyFail: "No se pudo copiar: mantén presionado el código",
    get: "Descargar Breath",
    fallback: "Te llevamos a la App Store…<br><a href=\"https://apps.apple.com/app/id6791719844\">Abrir en la App Store</a>",
    // -- support --------------------------------------------------------------
    supportTitle: "Breath — Soporte",
    supportHeading: "Breath — Soporte",
    contactHeading: "Contacto",
    contact: "Escribe a <a href=\"mailto:m.chirino89@gmail.com\">m.chirino89@gmail.com</a>: errores, dudas, problemas de facturación o un patrón que te gustaría que existiera. Te responde una persona, no una cola de tickets.",
    subsHeading: "Gestionar tu suscripción",
    subs: "Breath Premium se cobra a través de tu Apple ID. Para verla, cambiarla o cancelarla, abre Configuración → toca tu nombre → Suscripciones en tu iPhone. Si cancelas, conservas el acceso hasta el final del período actual.",
    restore: "¿Compraste Premium antes y no aparece? Toca <strong>Restaurar compras</strong> al final de la pantalla de suscripción.",
    healthHeading: "Salud de Apple",
    health: "Breath puede guardar cada sesión completada en Salud como un minuto de conciencia plena. Solo escribe; nunca lee tus datos de Salud. Puedes revocar el acceso cuando quieras en Configuración → Salud → Acceso a datos y dispositivos.",
    remindersHeading: "Recordatorios",
    reminders: "Breath programa los recordatorios localmente, según cuándo practicas de verdad. Desactívalos en Configuración → Notificaciones → Breath.",
    legalHeading: "Legal",
    legal: "<a href=\"/breath-site/privacy/\">Política de privacidad</a> · <a href=\"/breath-site/terms/\">Términos de uso</a> — disponibles en inglés.",
    footer: "<a href=\"https://apps.apple.com/app/id6791719844\">Breath en la App Store</a>"
  };

  // Rioplatense (es-AR, es-UY, es-PY): voseo. Sparse on purpose — a key absent here
  // means the base is already correct, not that nobody translated it. Only
  // second-person verbs move; Apple's menu nouns are unaffected because iOS ships
  // tuteo in every Spanish locale.
  var ES_AR = {
    invite: "Alguien te envió un código de invitación: copialo, instalá Breath y pegalo al abrirla por primera vez.",
    copyFail: "No se pudo copiar: mantené presionado el código",
    contact: "Escribí a <a href=\"mailto:m.chirino89@gmail.com\">m.chirino89@gmail.com</a>: errores, dudas, problemas de facturación o un patrón que te gustaría que existiera. Te responde una persona, no una cola de tickets.",
    subs: "Breath Premium se cobra a través de tu Apple ID. Para verla, cambiarla o cancelarla, abrí Configuración → tocá tu nombre → Suscripciones en tu iPhone. Si cancelás, conservás el acceso hasta el final del período actual.",
    restore: "¿Compraste Premium antes y no aparece? Tocá <strong>Restaurar compras</strong> al final de la pantalla de suscripción.",
    health: "Breath puede guardar cada sesión completada en Salud como un minuto de conciencia plena. Solo escribe; nunca lee tus datos de Salud. Podés revocar el acceso cuando quieras en Configuración → Salud → Acceso a datos y dispositivos.",
    reminders: "Breath programa los recordatorios localmente, según cuándo practicás de verdad. Desactivalos en Configuración → Notificaciones → Breath."
  };

  // Spain: Apple calls the Settings app "Ajustes" here and "Configuración" in Latin
  // America. The support page is step-by-step navigation through that exact menu, so
  // the wrong term names a menu the user does not have. Nothing else differs.
  var ES_ES = {
    subs: "Breath Premium se cobra a través de tu Apple ID. Para verla, cambiarla o cancelarla, abre Ajustes → toca tu nombre → Suscripciones en tu iPhone. Si cancelas, conservas el acceso hasta el final del período actual.",
    health: "Breath puede guardar cada sesión completada en Salud como un minuto de conciencia plena. Solo escribe; nunca lee tus datos de Salud. Puedes revocar el acceso cuando quieras en Ajustes → Salud → Acceso a datos y dispositivos.",
    reminders: "Breath programa los recordatorios localmente, según cuándo practicas de verdad. Desactívalos en Ajustes → Notificaciones → Breath."
  };

  // ?lang= wins over the browser: it is the only way to test every variant without
  // changing phone settings, and it lets someone on an English-set phone read Spanish.
  var forced = new URLSearchParams(location.search).get("lang");
  var tag = (forced || navigator.language || "").toLowerCase();

  var dict = null;
  if (/^es(-|$)/.test(tag)) {
    dict = {};
    for (var k in ES) dict[k] = ES[k];
    // es-CL is deliberately absent from the voseo branch: Chilean voseo is
    // informal-register and does not belong in UI copy.
    var overlay = /^es-(ar|uy|py)/.test(tag) ? ES_AR
                : /^es-es/.test(tag) ? ES_ES
                : null;
    for (var j in overlay) dict[j] = overlay[j];
  }

  // Serves strings written at runtime (the copy-button outcomes), so a translation
  // still lives in exactly one place. Falls back to the English the caller passes.
  window.t = function (key, english) {
    return (dict && dict[key]) || english;
  };

  if (dict) {
    document.documentElement.lang = tag;
    // ponytail: innerHTML rather than textContent because several strings carry a
    // link or <strong>, and word order around them differs by language. Safe because
    // every value above is a hardcoded literal — if a translation ever interpolates
    // user input, switch that key to textContent.
    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var s = dict[nodes[i].getAttribute("data-i18n")];
      if (s) nodes[i].innerHTML = s;
    }
  }
})();
