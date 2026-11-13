// Preview-only switcher for Guest ads layouts and pictures.
// The live home page does not load this file, and still uses layout L1 with picture B.
(function () {
  "use strict";
  var root = document.querySelector("[data-ads-layouts]");
  if (!root) return;
  var lines = {
    "1": "L1. Ads on the left, bill on the right. This is the live Guest slide.",
    "2": "L2. A wide picture strip above the bill, with dots as a simple carousel.",
    "3": "L3. Stacked for a phone: compact ads on top, then the bill."
  };
  var shots = {
    a: { src: "/assets/img/showcase/option-a-counter.jpg", alt: "Cafe counter with plants and a wooden till" },
    b: { src: "/assets/img/showcase/option-b-drink.jpg", alt: "Latte with mint in a sage cup" },
    c: { src: "/assets/img/showcase/option-c-kitchen.jpg", alt: "Kitchen rail with tickets and green tiles" },
    d: { src: "/assets/img/showcase/option-d-guest.jpg", alt: "Guest tablet beside a latte" },
    e: { src: "/assets/img/showcase/option-e-pastry.jpg", alt: "Croissant and bun on a sage plate" },
    f: { src: "/assets/img/showcase/option-f-till.jpg", alt: "Forest-mint counter with a tablet till" }
  };
  var now = document.getElementById("layoutNow");
  var img = document.getElementById("adShot");
  var layoutLinks = Array.prototype.slice.call(document.querySelectorAll("[data-pick]"));
  var shotBtns = Array.prototype.slice.call(document.querySelectorAll("[data-shot]"));

  var apply = function (layout, shot, push) {
    if (!/^[123]$/.test(layout || "")) layout = "1";
    if (!shots[shot]) shot = "b";
    root.dataset.layout = layout;
    root.dataset.shot = shot;
    layoutLinks.forEach(function (link) {
      if (link.getAttribute("data-pick") === layout) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
    shotBtns.forEach(function (btn) {
      if (btn.getAttribute("data-shot") === shot) btn.setAttribute("aria-current", "true");
      else btn.removeAttribute("aria-current");
    });
    if (now) now.textContent = lines[layout];
    if (img) {
      img.src = shots[shot].src;
      img.alt = shots[shot].alt;
    }
    var url = new URL(location.href);
    if (url.searchParams.get("layout") !== layout || url.searchParams.get("shot") !== shot) {
      url.searchParams.set("layout", layout);
      url.searchParams.set("shot", shot);
      history[push ? "pushState" : "replaceState"](null, "", url);
    }
  };

  layoutLinks.forEach(function (link) {
    link.addEventListener("click", function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      apply(link.getAttribute("data-pick"), root.dataset.shot || "b", true);
    });
  });
  shotBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      apply(root.dataset.layout || "1", btn.getAttribute("data-shot"), true);
    });
  });
  window.addEventListener("popstate", function () {
    var url = new URL(location.href);
    apply(url.searchParams.get("layout") || "1", url.searchParams.get("shot") || "b", false);
  });

  var start = new URL(location.href);
  apply(start.searchParams.get("layout") || root.dataset.layout || "1", start.searchParams.get("shot") || root.dataset.shot || "b", false);
})();
