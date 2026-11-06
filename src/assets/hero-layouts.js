// Switches the six hero previews. Slideshow timing stays in motion.js:
// about every 5 seconds, paused on hover or focus, and still when the visitor prefers less motion.
(function () {
  "use strict";
  var root = document.querySelector("[data-hero-layouts]");
  if (!root) return;
  var lines = {
    "1": "1. Side by side. Headline on the left. Cafe photo and slideshow are two equal columns.",
    "2": "2. Photo first, filmstrip. The photo is large. Under it, a short row of the four scenes, then a slim player.",
    "3": "3. Docked card. The photo is the full hero. A smaller slideshow hangs below and overlaps only the bottom rim.",
    "4": "4. Demo left, photo right. The slideshow sits under the headline. A tall cafe photo fills the right.",
    "5": "5. Photo dominant. The photo is twice the height of the slideshow, with a clear gap between them.",
    "6": "6. Picture in picture. The photo is full width. Scene buttons and the caption sit under it. The tour plays in a small window at the lower right."
  };
  var caps = {
    counter: "Counter tablet. The cashier stays here.",
    guest: "A second tablet signed in as Guest. The bill in one language. After payment, a loyalty QR for their own phone. The cashier stays on the counter.",
    showcase: "Shows one language, and a food photo when one is stored. About 6 min is an estimate, not the clock.",
    token: "Shows the number. Speaks only when Speak the token is on in House. It does not read the dish names."
  };
  var now = document.getElementById("layoutNow");
  var capEl = document.getElementById("sceneCap");
  var show = document.getElementById("heroShow");
  var links = Array.prototype.slice.call(document.querySelectorAll("[data-pick]"));

  var syncCap = function () {
    if (!show || !capEl) return;
    var on = show.querySelector(".show-slide.is-on");
    var key = on && on.id ? on.id.replace(/^show-/, "") : "";
    if (caps[key]) capEl.textContent = caps[key];
  };
  if (show && window.MutationObserver) {
    new MutationObserver(syncCap).observe(show, { subtree: true, attributes: true, attributeFilter: ["class", "hidden"] });
  }

  var apply = function (n, push) {
    if (!/^[1-6]$/.test(n || "")) n = "1";
    root.dataset.layout = n;
    links.forEach(function (link) {
      if (link.getAttribute("data-pick") === n) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
    if (now) now.textContent = lines[n];
    var url = new URL(location.href);
    if (url.searchParams.get("layout") !== n) {
      url.searchParams.set("layout", n);
      history[push ? "pushState" : "replaceState"](null, "", url);
    }
  };

  links.forEach(function (link) {
    link.addEventListener("click", function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      apply(link.getAttribute("data-pick"), true);
    });
  });
  window.addEventListener("popstate", function () {
    apply(new URL(location.href).searchParams.get("layout") || "1", false);
  });

  apply(new URL(location.href).searchParams.get("layout") || root.dataset.layout || "1", false);
  syncCap();
})();
