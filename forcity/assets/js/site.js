/* Fortress City Gov. — shared behaviour: sticky scroll state, mobile menus. */

(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  function stickyState() {
    var bars = document.querySelectorAll("[data-sticky]");
    if (!bars.length) return;

    var ticking = false;

    function update() {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      for (var i = 0; i < bars.length; i++) {
        bars[i].classList.toggle("is-stuck", y > 8);
      }
      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    update();
  }

  function menus() {
    var toggles = document.querySelectorAll("[data-menu-toggle]");

    Array.prototype.forEach.call(toggles, function (btn) {
      var targetId = btn.getAttribute("data-menu-toggle");
      var host = btn.closest("[data-sticky]") || btn.parentNode;
      var panel = document.getElementById(targetId);

      function close() {
        host.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
      }

      btn.addEventListener("click", function () {
        var open = host.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });

      if (panel) {
        panel.addEventListener("click", function (e) {
          if (e.target.closest("a")) close();
        });
      }

      document.addEventListener("click", function (e) {
        if (!host.contains(e.target)) close();
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") close();
      });

      window.addEventListener("resize", function () {
        if (window.innerWidth > 900) close();
      });
    });
  }

  function reveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (reduce.matches || !("IntersectionObserver" in window)) {
      for (var i = 0; i < items.length; i++) items[i].classList.add("is-in");
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    for (var j = 0; j < items.length; j++) io.observe(items[j]);
  }

  function init() {
    stickyState();
    menus();
    reveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
