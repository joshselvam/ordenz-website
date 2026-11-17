// Progressive enhancement: five-screen tabs on /my/pos/.
(function () {
  var root = document.getElementById("lpScreens");
  if (!root) return;
  var tabs = root.querySelectorAll('[role="tab"]');
  var panels = root.querySelectorAll('[role="tabpanel"]');
  if (!tabs.length || !panels.length) return;

  function activate(id) {
    for (var i = 0; i < tabs.length; i++) {
      var tab = tabs[i];
      var on = tab.getAttribute("data-screen") === id;
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.tabIndex = on ? 0 : -1;
    }
    for (var j = 0; j < panels.length; j++) {
      var panel = panels[j];
      var match = panel.id === "panel-" + id;
      if (match) panel.removeAttribute("hidden");
      else panel.setAttribute("hidden", "");
    }
  }

  for (var t = 0; t < tabs.length; t++) {
    tabs[t].addEventListener("click", function (e) {
      var id = e.currentTarget.getAttribute("data-screen");
      if (id) activate(id);
    });
    tabs[t].addEventListener("keydown", function (e) {
      var keys = { ArrowRight: 1, ArrowLeft: -1, Home: "home", End: "end" };
      var move = keys[e.key];
      if (!move) return;
      e.preventDefault();
      var list = Array.prototype.slice.call(tabs);
      var i = list.indexOf(e.currentTarget);
      var next = i;
      if (move === "home") next = 0;
      else if (move === "end") next = list.length - 1;
      else next = (i + move + list.length) % list.length;
      list[next].focus();
      activate(list[next].getAttribute("data-screen"));
    });
  }
})();
