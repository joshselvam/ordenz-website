// Preserve Google Ads / SEO UTM params into trial and WhatsApp CTAs on /my/pos/.
// Forces Malaysia country on this dedicated landing page.
(function () {
  var KEY = "ordenz-country";
  try {
    localStorage.setItem(KEY, "MY");
    document.documentElement.dataset.country = "MY";
  } catch (e) {}

  var params;
  try {
    params = new URLSearchParams(location.search);
  } catch (e) {
    return;
  }
  var utm = {};
  ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach(function (k) {
    var v = params.get(k);
    if (v) utm[k] = String(v).slice(0, 120);
  });
  if (!Object.keys(utm).length) return;

  function withUtm(href) {
    try {
      var u = new URL(href, location.origin);
      Object.keys(utm).forEach(function (k) {
        if (!u.searchParams.has(k)) u.searchParams.set(k, utm[k]);
      });
      return u.toString();
    } catch (e) {
      return href;
    }
  }

  function withWaText(href) {
    // Keep UTM in the prefilled WhatsApp message only — wa.me ignores unknown query keys.
    try {
      var u = new URL(href, location.origin);
      var bits = [];
      if (utm.utm_campaign) bits.push("campaign " + utm.utm_campaign);
      if (utm.utm_source) bits.push("via " + utm.utm_source);
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
    a.setAttribute("href", a.hasAttribute("data-utm-wa") ? withWaText(href) : withUtm(href));
  }
})();
