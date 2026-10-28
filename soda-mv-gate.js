/**
 * Phase A2/A5 — run synchronously AFTER model-viewer markup is parsed and
 * BEFORE the deferred model-viewer module upgrades elements.
 * On phone: remove desktop-only viewers so their GLBs never load.
 */
(function () {
  var isPhone = window.matchMedia("(max-width: 768px)").matches;
  window.SodaMvGate = {
    isPhone: isPhone,
    maxBerries: isPhone ? 3 : Infinity,
  };

  if (!isPhone) {
    return;
  }

  function discard(el) {
    if (!el) return;
    el.removeAttribute("src");
    el.removeAttribute("poster");
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }

  document.querySelectorAll("[data-mv-desktop-only]").forEach(discard);

  // Homepage: keep at most 3 FG berries (b1, b4, b6) if not already marked
  var kept = 0;
  var prefer = ["b1", "b4", "b6"];
  var fg = document.querySelectorAll(".berries-container model-viewer.berry");
  fg.forEach(function (el) {
    var allow = prefer.some(function (cls) {
      return el.classList.contains(cls);
    });
    if (allow && kept < 3) {
      kept += 1;
      return;
    }
    discard(el);
  });

  // Taste berry-field: keep marked berries (max 3)
  var tasteKept = 0;
  document.querySelectorAll(".berry-field model-viewer.berry-orb").forEach(function (el) {
    if (el.hasAttribute("data-mv-keep-mobile") && tasteKept < 3) {
      tasteKept += 1;
      return;
    }
    if (!el.hasAttribute("data-mv-desktop-only") && !el.hasAttribute("data-mv-keep-mobile")) {
      discard(el);
    }
  });

  // Soften remaining cans on phone (no orbit drag cost)
  [
    "product-model",
    "shop-can",
    "detail-can",
    "story-can",
    "reviews-can",
    "contact-can",
  ].forEach(function (id) {
    var can = document.getElementById(id);
    if (can) {
      can.removeAttribute("camera-controls");
    }
  });
})();
