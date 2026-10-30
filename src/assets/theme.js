// Light / dark theme, the same choice as the OrdenZ app. With no saved choice the page follows the system setting.
(function () {
  var btn = document.getElementById("themeBtn"); if (!btn) return;
  var root = document.documentElement, dark = window.matchMedia("(prefers-color-scheme: dark)");
  var header = document.querySelector(".top");
  function syncHeader() {
    if (header) root.style.setProperty("--header-offset", Math.ceil(header.getBoundingClientRect().height) + 12 + "px");
  }
  syncHeader();
  if (header && typeof ResizeObserver !== "undefined") new ResizeObserver(syncHeader).observe(header);
  else window.addEventListener("resize", syncHeader);
  var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  function current() { return root.dataset.theme || (dark.matches ? "dark" : "light"); }
  // The browser bar colour follows the theme too (the app's background colours)
  function syncBar() {
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i++) {
      if (root.dataset.theme) { metas[i].removeAttribute("media"); metas[i].setAttribute("content", root.dataset.theme === "dark" ? "#0B110F" : "#FFFCF5"); }
    }
  }
  function show() {
    var isDark = current() === "dark";
    syncBar();
    btn.innerHTML = (isDark ? SUN : MOON) + "<span>" + (isDark ? "Light theme" : "Dark theme") + "</span>";
    btn.setAttribute("aria-pressed", String(isDark));
  }
  btn.addEventListener("click", function () {
    var next = current() === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("ordenz.theme", next); } catch (e) {}
    show();
  });
  if (dark.addEventListener) dark.addEventListener("change", show);
  show();
})();
