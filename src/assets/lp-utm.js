// Preserve Google Ads click IDs + UTMs into trial CTAs, the demo form, and WhatsApp (campaign/source only).
// Forces the Ads Final URL country: /in/pos/ → IN, /my/pos/ → MY. First-touch values live in sessionStorage.
(function () {
  var KEY = "ordenz-country";
  var path = location.pathname || "";
  var forceCountry = path.indexOf("/in/pos") === 0 ? "IN" : "MY";
  try {
    localStorage.setItem(KEY, forceCountry);
    document.documentElement.dataset.country = forceCountry;
  } catch (e) {}

  var STORE = "ordenz-lp-ads";
  var TRACK_KEYS = ["gclid", "gbraid", "wbraid", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
  var MAX = 120;

  function clip(v) {
    return String(v || "").slice(0, MAX);
  }

  function fromUrl() {
    var out = {};
    try {
      var params = new URLSearchParams(location.search);
      TRACK_KEYS.forEach(function (k) {
        var v = params.get(k);
        if (v) out[k] = clip(v);
      });
    } catch (e) {}
    return out;
  }

  function loadStore() {
    try {
      var raw = sessionStorage.getItem(STORE);
      if (!raw) return {};
      var o = JSON.parse(raw);
      if (!o || typeof o !== "object") return {};
      var clean = {};
      TRACK_KEYS.forEach(function (k) {
        if (o[k]) clean[k] = clip(o[k]);
      });
      return clean;
    } catch (e) {
      return {};
    }
  }

  function saveStore(obj) {
    try {
      sessionStorage.setItem(STORE, JSON.stringify(obj));
    } catch (e) {}
  }

  // First-touch: keep values already in the session; only fill keys that are still empty.
  var stored = loadStore();
  var url = fromUrl();
  var track = {};
  TRACK_KEYS.forEach(function (k) {
    if (stored[k]) track[k] = stored[k];
    else if (url[k]) track[k] = url[k];
  });
  if (Object.keys(track).length) saveStore(track);

  function withTrack(href) {
    try {
      var u = new URL(href, location.origin);
      TRACK_KEYS.forEach(function (k) {
        if (track[k] && !u.searchParams.has(k)) u.searchParams.set(k, track[k]);
      });
      return u.toString();
    } catch (e) {
      return href;
    }
  }

  function withWaText(href) {
    // Campaign/source in the prefilled message only — never gclid / gbraid / wbraid.
    try {
      var u = new URL(href, location.origin);
      var bits = [];
      if (track.utm_campaign) bits.push("campaign " + track.utm_campaign);
      if (track.utm_source) bits.push("via " + track.utm_source);
      if (!bits.length) return href;
      var extra = " (" + bits.join(", ") + ")";
      var text = u.searchParams.get("text") || "";
      if (text && text.indexOf(extra) === -1) u.searchParams.set("text", text + extra);
      return u.toString();
    } catch (e) {
      return href;
    }
  }

  var links = document.querySelectorAll("a[data-utm-pass]");
  for (var i = 0; i < links.length; i++) {
    var a = links[i];
    var href = a.getAttribute("href");
    if (!href) continue;
    a.setAttribute("href", a.hasAttribute("data-utm-wa") ? withWaText(href) : withTrack(href));
  }

  // Demo form: hidden inputs so method=GET keeps params even when the action query is dropped.
  function syncHidden(form) {
    TRACK_KEYS.forEach(function (k) {
      var existing = form.querySelector('input[type="hidden"][data-lp-track="' + k + '"]');
      if (!track[k]) {
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
        return;
      }
      if (!existing) {
        existing = document.createElement("input");
        existing.type = "hidden";
        existing.name = k;
        existing.setAttribute("data-lp-track", k);
        form.appendChild(existing);
      }
      existing.value = track[k];
    });
  }

  var forms = document.querySelectorAll("form[data-utm-pass]");
  for (var f = 0; f < forms.length; f++) {
    (function (form) {
      syncHidden(form);
      form.addEventListener("submit", function () {
        syncHidden(form);
        try {
          var action = form.getAttribute("action") || "/demo/";
          var u = new URL(action, location.origin);
          TRACK_KEYS.forEach(function (k) {
            if (track[k] && !u.searchParams.has(k)) u.searchParams.set(k, track[k]);
          });
          form.setAttribute("action", u.pathname + u.search);
        } catch (e) {}
      });
    })(forms[f]);
  }
})();
