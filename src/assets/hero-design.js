// Preview hero only. Four scenes advance about every 5 seconds,
// pause while the pointer or focus is on the stage, and stay still
// when the visitor prefers less motion.
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var saveData = navigator.connection && navigator.connection.saveData;
  var caps = {
    counter: "Counter tablet. The cashier stays here.",
    guest: "A second tablet signed in as Guest. The bill in one language. After payment, a loyalty QR for their own phone. The cashier stays on the counter.",
    showcase: "Shows one language, and a food photo when one is stored. About 6 min is an estimate, not the clock.",
    token: "Shows the number. Speaks only when Speak the token is on in House. It does not read the dish names. When it speaks, it uses the device's natural voice and says Token 1 4."
  };

  var video = document.getElementById("promoVideo");
  var sound = document.getElementById("promoSound");
  var withSound = false;
  if (video && sound) {
    var figure = video.closest(".hd-promo");
    var tryPlay = function () {
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    };
    if (!reduce && !saveData) {
      video.autoplay = true;
      tryPlay();
    } else if (sound.lastChild) {
      sound.lastChild.textContent = " Play the 50-second tour";
    }
    sound.addEventListener("click", function () {
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
    });
  }

  var show = document.getElementById("heroShow");
  if (!show) return;
  // Dots sit in .hd-nav, outside the slide stack, so search the stage.
  var root = show.closest(".hd-stage") || show;
  var slides = Array.prototype.slice.call(show.querySelectorAll(".hd-slide"));
  var dots = Array.prototype.slice.call(root.querySelectorAll(".hd-dot"));
  var capEl = document.getElementById("sceneCap");
  var index = 0;
  var timer = 0;
  var hovering = false;
  var focused = false;
  if (!reduce) show.classList.add("hd-motion");

  var showSlide = function (n) {
    if (!slides.length) return;
    index = (n + slides.length) % slides.length;
    slides.forEach(function (slide, i) {
      var on = i === index;
      slide.hidden = !on;
      slide.classList.toggle("is-on", on);
    });
    dots.forEach(function (dot, i) {
      if (i === index) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
    var key = slides[index].id.replace(/^show-/, "");
    if (capEl && caps[key]) capEl.textContent = caps[key];
    if (video && !slides[index].contains(video)) {
      video.pause();
      var promo = video.closest(".hd-promo");
      if (promo) promo.classList.remove("playing");
    } else if (video && video.autoplay && video.muted && video.paused && !reduce && !saveData) {
      var play = video.play();
      if (play && play.catch) play.catch(function () {});
    }
  };

  var held = function () {
    return hovering || focused || !!show.querySelector(".hd-slide.is-on .hd-promo.playing");
  };
  var stop = function () { if (timer) { clearInterval(timer); timer = 0; } };
  var arm = function () {
    if (reduce || held() || timer || slides.length < 2) return;
    timer = setInterval(function () { if (!held()) showSlide(index + 1); }, 5000);
  };

  root.addEventListener("pointerenter", function (e) {
    if (e.pointerType === "touch") return;
    hovering = true;
    stop();
  });
  root.addEventListener("pointerleave", function (e) {
    if (e.pointerType === "touch") return;
    hovering = false;
    arm();
  });
  root.addEventListener("focusin", function (e) {
    if (e.target && e.target.closest && e.target.closest("button, a")) { focused = true; stop(); }
  });
  root.addEventListener("focusout", function () {
    setTimeout(function () {
      var active = document.activeElement;
      focused = !!(active && root.contains(active));
      if (!focused) arm();
    }, 0);
  });
  dots.forEach(function (dot, i) {
    dot.addEventListener("click", function () { showSlide(i); });
  });
  root.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    var i = dots.indexOf(e.target);
    if (i < 0) return;
    e.preventDefault();
    var next = e.key === "ArrowRight" ? (i + 1) % dots.length : (i - 1 + dots.length) % dots.length;
    showSlide(next);
    dots[next].focus();
  });
  if (video) video.addEventListener("ended", function () { withSound = false; arm(); });
  arm();
})();
