// Switches five Cafe in motion front-page previews. Live home stays on Shift reel (v=1).
(function () {
  "use strict";
  var root = document.querySelector("[data-cafe-in-motion]");
  if (!root) return;
  var lines = {
    "1": "1. Shift reel. Brand and headline left. Large motion stage right — the live homepage direction.",
    "2": "2. Morning rush. Full-bleed cafe photo first. Tour and scene pills sit in a slim filmstrip under it.",
    "3": "3. Counter stage. Headline and tour on the left. Tall cafe photograph fills the right, uncovered.",
    "4": "4. Token moment. Amber 14 and Ready for collection are the first-fold hero.",
    "5": "5. Guest latte. Ads beside a server-trusted bill fill the first fold."
  };
  var now = document.getElementById("cimNow");
  var links = Array.prototype.slice.call(document.querySelectorAll("[data-pick]"));

  var tokenHero = root.querySelector(".cim-token-hero");
  var guestHero = root.querySelector(".cim-guest-hero");

  var apply = function (n, push) {
    if (!/^[1-5]$/.test(n || "")) n = "1";
    root.dataset.v = n;
    links.forEach(function (link) {
      if (link.getAttribute("data-pick") === n) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
    if (now) now.textContent = lines[n];
    if (tokenHero) tokenHero.setAttribute("aria-hidden", n === "4" ? "false" : "true");
    if (guestHero) guestHero.setAttribute("aria-hidden", n === "5" ? "false" : "true");
    var url = new URL(location.href);
    if (url.searchParams.get("v") !== n) {
      url.searchParams.set("v", n);
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
    apply(new URL(location.href).searchParams.get("v") || "1", false);
  });

  apply(new URL(location.href).searchParams.get("v") || root.dataset.v || "1", false);
})();
