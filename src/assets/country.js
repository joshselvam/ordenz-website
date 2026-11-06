// Shared India / Malaysia choice for copy, pricing and the start-a-cafe guide.
// First visit: timezone guess. After that the header dropdown wins. Key: ordenz-country.
(function () {
  var KEY = "ordenz-country";
  var EVENT = "ordenz-country";

  function guess() {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (tz === "Asia/Kolkata" || tz === "Asia/Calcutta") return "IN";
      if (tz === "Asia/Kuala_Lumpur" || tz === "Asia/Kuching") return "MY";
    } catch (e) {}
    return "MY";
  }

  function readSaved() {
    try {
      var v = localStorage.getItem(KEY);
      if (v === "IN" || v === "MY") return v;
    } catch (e) {}
    return null;
  }

  function country() {
    return readSaved() || guess();
  }

  var HOME_TITLE = {
    IN: "Cafe POS India | self-order kiosk | OrdenZ",
    MY: "Cafe POS Malaysia | self-order kiosk | OrdenZ"
  };
  var HOME_DESC = {
    IN: "OrdenZ is a cafe POS in India for small cafes, with a self-order kiosk, a kitchen screen and GST once you add a GSTIN.",
    MY: "OrdenZ is a cafe POS in Malaysia for small cafes, with a self-order kiosk, a kitchen screen, ringgit prices, and SST only when an SST number is set."
  };

  function applyHomeSeo(code) {
    var path = location.pathname;
    if (path !== "/" && path !== "/index.html") return;
    if (!HOME_TITLE[code]) return;
    document.title = HOME_TITLE[code];
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute("content", HOME_DESC[code]);
  }

  function apply(code, persist) {
    if (code !== "IN" && code !== "MY") return;
    document.documentElement.dataset.country = code;
    if (persist) {
      try { localStorage.setItem(KEY, code); } catch (e) {}
    }
    var sel = document.getElementById("countrySel");
    if (sel && sel.value !== code) sel.value = code;
    applyHomeSeo(code);
    document.dispatchEvent(new CustomEvent(EVENT, { detail: { country: code } }));
  }

  window.OrdenzCountry = { get: country, set: function (c) { apply(c, true); }, guess: guess };

  apply(country(), !readSaved());

  function wire() {
    var sel = document.getElementById("countrySel");
    if (!sel) return;
    sel.value = country();
    sel.addEventListener("change", function () { apply(sel.value, true); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else wire();
})();
