// Home-page tour video, hero slideshow and gentle scroll animations.
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
    var compactTour = !!(figure && figure.classList.contains("promo--tour"));
    // YouTube tour per country: data-youtube is Malaysia (and the default), data-youtube-in is India
    var ytOf = function (id) { return /^[A-Za-z0-9_-]{11}$/.test(id || "") ? id : ""; };
    var youtubeMy = figure ? ytOf(figure.dataset.youtube) : "";
    var youtubeIn = figure ? ytOf(figure.dataset.youtubeIn) : "";
    var youtube = youtubeMy;
    var withSound = false;
    var tryPlay = function () { var p = video.play(); if (p && p.catch) p.catch(function () {}); };
    // India and Malaysia each get their own narrated tour: same names, "-in" for India.
    var pickTour = function (code) {
      var suffix = code === "IN" ? "-in" : "";
      youtube = code === "IN" ? (youtubeIn || youtubeMy) : youtubeMy;
      var swap = function (url) { return url ? url.replace(/ordenz-one-day-v3(?:-in)?\./, "ordenz-one-day-v3" + suffix + ".") : url; };
      var changed = false;
      Array.prototype.forEach.call(video.querySelectorAll("source"), function (s) {
        var next = swap(s.getAttribute("src")); if (next !== s.getAttribute("src")) { s.setAttribute("src", next); changed = true; }
      });
      var poster = swap(video.getAttribute("poster")); if (poster !== video.getAttribute("poster")) video.setAttribute("poster", poster);
      if (changed) { var playing = !video.paused; video.load(); if (playing) tryPlay(); }
    };
    if (window.OrdenzCountry) pickTour(window.OrdenzCountry.get());
    document.addEventListener("ordenz-country", function (e) { pickTour(e.detail && e.detail.country); });

    // Compact pass-strip tour: do not autoplay a hidden MP4 beside the live iframe.
    if (!compactTour && !reduce && !saveData) {
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
    } else if (reduce || saveData || compactTour) {
      sound.lastChild.textContent = " Play the 45-second tour";
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
      if (figure) figure.classList.add("playing");
    });
    video.addEventListener("ended", function () {
      if (figure) figure.classList.remove("playing");
      withSound = false;
    });
    if (dialog) {
      var close = function () { if (frame) frame.replaceChildren(); if (dialog.open) dialog.close(); };
      var btn = document.getElementById("promoClose");
      if (btn) btn.addEventListener("click", close);
      dialog.addEventListener("close", function () { if (frame) frame.replaceChildren(); });
      dialog.addEventListener("click", function (e) { if (e.target === dialog) close(); });
    }
  }

  // ---------- hero slideshow ----------
  // Four scenes. Advances about every 5 seconds unless the visitor asked for less motion,
  // is pointing at the slideshow, or is focused on a control.
  var show = document.getElementById("heroShow");
  if (show) {
    var slides = Array.prototype.slice.call(show.querySelectorAll(".show-slide"));
    var dots = Array.prototype.slice.call(show.querySelectorAll(".show-dot"));
    var index = 0;
    var timer = 0;
    var hovering = false;
    var focused = false;
    if (!reduce) show.classList.add("show-motion");
    var showSlide = function (n) {
      if (!slides.length) return;
      index = (n + slides.length) % slides.length;
      var clip = document.getElementById("promoVideo");
      var preview = show.querySelector(".hero-preview-frame");
      slides.forEach(function (slide, i) {
        var on = i === index;
        slide.hidden = !on;
        slide.classList.toggle("is-on", on);
      });
      dots.forEach(function (dot, i) {
        if (i === index) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
      if (preview) {
        var onCounter = slides[index].id === "show-counter";
        var live = preview.getAttribute("data-preview-src") || "/demo/preview/#kiosk";
        if (onCounter) {
          if (!preview.getAttribute("src")) preview.setAttribute("src", live);
        } else if (preview.getAttribute("src")) {
          preview.setAttribute("src", "");
        }
      }
      if (clip && !slides[index].contains(clip)) {
        clip.pause();
        var promo = clip.closest(".promo");
        if (promo) promo.classList.remove("playing");
      } else if (clip && clip.autoplay && clip.muted && clip.paused) {
        var play = clip.play();
        if (play && play.catch) play.catch(function () {});
      }
    };
    var held = function () {
      var dialog = document.getElementById("promoDialog");
      var active = document.activeElement;
      return hovering || focused || !!show.querySelector(".show-slide.is-on .promo.playing") || !!(dialog && dialog.open) || !!(active && show.contains(active) && active.closest("button"));
    };
    var stop = function () { if (timer) { clearInterval(timer); timer = 0; } };
    var arm = function () {
      if (reduce || held() || timer || slides.length < 2) return;
      timer = setInterval(function () { if (!held()) showSlide(index + 1); }, 5000);
    };
    show.addEventListener("pointerenter", function (e) {
      if (e.pointerType === "touch") return;
      hovering = true;
      stop();
    });
    show.addEventListener("pointerleave", function (e) {
      if (e.pointerType === "touch") return;
      hovering = false;
      arm();
    });
    show.addEventListener("focusin", function (e) {
      if (e.target && e.target.closest && e.target.closest("button")) { focused = true; stop(); }
    });
    show.addEventListener("focusout", function () {
      setTimeout(function () {
        var active = document.activeElement;
        focused = !!(active && show.contains(active) && active.closest && active.closest("button"));
        arm();
      }, 0);
    });
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () { showSlide(i); });
    });
    show.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      var i = dots.indexOf(e.target);
      if (i < 0) return;
      e.preventDefault();
      var next = e.key === "ArrowRight" ? (i + 1) % dots.length : (i - 1 + dots.length) % dots.length;
      showSlide(next);
      dots[next].focus();
    });
    var dialogEl = document.getElementById("promoDialog");
    if (dialogEl) dialogEl.addEventListener("close", arm);
    var tour = document.getElementById("promoVideo");
    if (tour) tour.addEventListener("ended", arm);
    arm();
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
