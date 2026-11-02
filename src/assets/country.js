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

  function apply(code, persist) {
    if (code !== "IN" && code !== "MY") return;
    document.documentElement.dataset.country = code;
    if (persist) {
      try { localStorage.setItem(KEY, code); } catch (e) {}
    }
    var sel = document.getElementById("countrySel");
    if (sel && sel.value !== code) sel.value = code;
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
