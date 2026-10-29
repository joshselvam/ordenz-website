// Home-page tour video and gentle scroll animations.
// - The tour plays muted and looped when the page opens (browsers only allow silent autoplay).
//   It doesn't autoplay for people who asked for less motion or to save data, and it pauses off screen.
// - "Watch with sound" restarts it with sound and controls, or opens YouTube when a video ID is set.
// - Sections fade in as they scroll into view; numbers count up. All of it is skipped with reduced motion.
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var saveData = navigator.connection && navigator.connection.saveData;

  // ---------- the tour video ----------
  var video = document.getElementById("promoVideo");
  var sound = document.getElementById("promoSound");
  if (video && sound) {
    var figure = video.closest(".promo");
    var youtube = figure && /^[A-Za-z0-9_-]{11}$/.test(figure.dataset.youtube || "") ? figure.dataset.youtube : "";
    var withSound = false;
    var tryPlay = function () { var p = video.play(); if (p && p.catch) p.catch(function () {}); };

    if (!reduce && !saveData) {
      video.autoplay = true;
      tryPlay();
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (withSound) return;
            if (e.isIntersecting) tryPlay(); else video.pause();
          });
        }, { threshold: 0.25 }).observe(video);
      }
    } else {
      sound.lastChild.textContent = " Play the 1-minute tour";
    }

    var dialog = document.getElementById("promoDialog");
    var frame = document.getElementById("promoFrame");
    sound.addEventListener("click", function () {
      if (youtube && dialog && frame && dialog.showModal) {
        video.pause();
        var iframe = document.createElement("iframe");
        iframe.src = "https://www.youtube-nocookie.com/embed/" + youtube + "?autoplay=1&rel=0&modestbranding=1";
        iframe.title = "OrdenZ tour on YouTube";
        iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
        iframe.allowFullscreen = true;
        frame.replaceChildren(iframe);
        dialog.showModal();
        return;
      }
      withSound = true;
      video.loop = false;
      video.muted = false;
      video.controls = true;
      video.currentTime = 0;
      tryPlay();
      figure.classList.add("playing");
    });
    if (dialog) {
      var close = function () { if (frame) frame.replaceChildren(); if (dialog.open) dialog.close(); };
      var btn = document.getElementById("promoClose");
      if (btn) btn.addEventListener("click", close);
      dialog.addEventListener("close", function () { if (frame) frame.replaceChildren(); });
      dialog.addEventListener("click", function (e) { if (e.target === dialog) close(); });
    }
  }

  // ---------- scroll reveals and counting numbers ----------
  if (reduce || !("IntersectionObserver" in window)) return;
  document.documentElement.classList.add("motion");
  var items = document.querySelectorAll("main section:not(.hero) .card, main .stat, main .day li, main .cta, main section:not(.hero) h2");
  items.forEach(function (el) {
    var sibs = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
    el.classList.add("reveal");
    el.style.setProperty("--d", Math.min(sibs, 6) * 70 + "ms");
  });
  var count = function (el) {
    var m = /^(\d+)(.*)$/.exec(el.textContent.trim());
    if (!m) return;
    var end = +m[1], rest = m[2], start = null;
    var step = function (ts) {
      if (start === null) start = ts;
      var k = Math.min(1, (ts - start) / 900), v = Math.round(end * (1 - Math.pow(1 - k, 3)));
      el.textContent = v + rest;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      var b = e.target.matches(".stat") && e.target.querySelector("b");
      if (b) count(b);
      io.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
  items.forEach(function (el) { io.observe(el); });
})();
