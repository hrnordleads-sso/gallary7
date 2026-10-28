/**
 * Phase A6 — model-viewer posters, load state, local→CDN fallback, PNG fallback.
 * No new libraries. Include after soda-assets.js (and after soda-mv-gate.js).
 */
(function () {
  const Assets = window.SodaAssets;
  if (!Assets) return;

  function isMainCan(mv) {
    return (
      mv.classList.contains("soda-can") ||
      mv.classList.contains("main-product-3d") ||
      mv.id === "product-model"
    );
  }

  function posterFor(mv) {
    const existing = mv.getAttribute("poster");
    if (existing) return existing;
    if ((mv.id || "").includes("blue")) return Assets.bluePng;
    return Assets.greenPng;
  }

  function ensureFallback(mv) {
    if (!isMainCan(mv)) return null;
    let fail = mv.parentElement && mv.parentElement.querySelector(":scope > .mv-fallback[data-for=\"" + (mv.id || mv.className) + "\"]");
    if (fail) return fail;
    fail = document.createElement("div");
    fail.className = "mv-fallback";
    fail.dataset.for = mv.id || mv.className;
    fail.hidden = true;
    fail.innerHTML =
      '<img class="mv-fallback-img" alt=""><p class="mv-fallback-copy">3D preview unavailable</p>';
    mv.insertAdjacentElement("afterend", fail);
    return fail;
  }

  function wire(mv) {
    if (!mv || mv.tagName.toLowerCase() !== "model-viewer") return;
    if (mv.dataset.mvUx === "1") return;
    mv.dataset.mvUx = "1";

    const main = isMainCan(mv);
    const poster = posterFor(mv);
    if (main && !mv.getAttribute("poster")) {
      mv.setAttribute("poster", poster);
    }

    if (main) {
      mv.classList.add("mv-pending");
    }

    const fail = main ? ensureFallback(mv) : null;
    let usedCdn = false;

    function showLoaded() {
      mv.classList.remove("mv-pending", "mv-failed");
      mv.classList.add("mv-ready");
      if (fail) fail.hidden = true;
    }

    function showFailed() {
      mv.classList.remove("mv-pending");
      mv.classList.add("mv-failed");
      if (fail) {
        const img = fail.querySelector(".mv-fallback-img");
        if (img) {
          img.src = poster;
          img.alt = mv.getAttribute("alt") || "Soda can";
        }
        fail.hidden = false;
      } else {
        mv.style.visibility = "hidden";
      }
    }

    function tryCdnFallback() {
      if (usedCdn) {
        showFailed();
        return;
      }
      const src = mv.getAttribute("src");
      const cdn = Assets.cdnFor(src);
      if (!cdn) {
        showFailed();
        return;
      }
      usedCdn = true;
      mv.classList.add("mv-pending");
      mv.setAttribute("src", cdn);
    }

    mv.addEventListener("load", showLoaded);
    mv.addEventListener("error", tryCdnFallback);
    if (mv.loaded) showLoaded();
  }

  function boot() {
    document.querySelectorAll("model-viewer").forEach(wire);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
