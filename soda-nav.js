/**
 * Phase A4 — compact mobile navigation (max-width: 768px).
 * Desktop keeps the pill nav; this only manages the phone drawer.
 */
(function () {
  const toggle = document.querySelector(".nav-toggle");
  const shell = document.getElementById("site-nav");
  if (!toggle || !shell) return;

  const mq = window.matchMedia("(max-width: 768px)");
  let backdrop = document.querySelector(".nav-backdrop");
  if (!backdrop) {
    backdrop = document.createElement("button");
    backdrop.type = "button";
    backdrop.className = "nav-backdrop";
    backdrop.setAttribute("aria-label", "Close menu");
    backdrop.hidden = true;
    document.body.appendChild(backdrop);
  }

  function focusableInShell() {
    // Prefer getClientRects — position:fixed items often have offsetParent === null
    return Array.from(
      shell.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
    ).filter(
      (el) =>
        !el.hasAttribute("disabled") &&
        el.getClientRects().length > 0
    );
  }

  function setOpen(open) {
    const isPhone = mq.matches;
    if (!isPhone) {
      document.body.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
      backdrop.hidden = true;
      shell.removeAttribute("inert");
      return;
    }

    document.body.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    backdrop.hidden = !open;

    if (open) {
      shell.removeAttribute("inert");
      // Defer past the toggle click so focus lands on the first link
      setTimeout(() => {
        const items = focusableInShell();
        if (items[0]) items[0].focus();
      }, 30);
    } else {
      shell.setAttribute("inert", "");
    }
  }

  function syncMode() {
    if (!mq.matches) {
      setOpen(false);
      shell.removeAttribute("inert");
      backdrop.hidden = true;
      document.body.classList.remove("nav-open");
      return;
    }
    if (!document.body.classList.contains("nav-open")) {
      shell.setAttribute("inert", "");
      backdrop.hidden = true;
    }
  }

  toggle.addEventListener("click", () => {
    const open = !document.body.classList.contains("nav-open");
    setOpen(open);
    if (!open) toggle.focus();
  });

  backdrop.addEventListener("click", () => {
    setOpen(false);
    toggle.focus();
  });

  shell.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      // Defer close: applying inert during the same click can cancel navigation
      if (mq.matches) {
        setTimeout(() => setOpen(false), 0);
      }
    });
  });

  document.addEventListener("keydown", (e) => {
    if (!document.body.classList.contains("nav-open") || !mq.matches) return;

    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      toggle.focus();
      return;
    }

    if (e.key !== "Tab") return;
    const items = focusableInShell();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      toggle.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      toggle.focus();
    } else if (e.shiftKey && document.activeElement === toggle) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === toggle) {
      e.preventDefault();
      first.focus();
    }
  });

  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", syncMode);
  } else if (typeof mq.addListener === "function") {
    mq.addListener(syncMode);
  }

  syncMode();
})();
