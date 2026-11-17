// Optional Google Ads tag + conversion helpers for /my/pos/ only.
// Loaded only when site.config adsTagId is set at build time. Empty config → this file is not referenced.
(function () {
  var host = document.getElementById("main") || document.documentElement;
  var tagId = (host.getAttribute("data-ads-tag") || "").trim();
  var signupLabel = (host.getAttribute("data-ads-conv-signup") || "").trim();
  var demoLabel = (host.getAttribute("data-ads-conv-demo") || "").trim();
  if (!tagId) return;

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = window.gtag || gtag;
  gtag("js", new Date());
  gtag("config", tagId);

  function send(label) {
    if (!label) return;
    try {
      window.gtag("event", "conversion", { send_to: tagId + "/" + label });
    } catch (e) {}
  }

  document.addEventListener(
    "click",
    function (e) {
      var a = e.target && e.target.closest ? e.target.closest("a[data-ads-conv='signup']") : null;
      if (a) send(signupLabel);
    },
    true
  );

  var form = document.getElementById("lpDemoForm");
  if (form) {
    form.addEventListener("submit", function () {
      send(demoLabel);
    });
  }
})();
