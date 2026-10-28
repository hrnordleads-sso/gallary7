(function (global) {
  const Assets = global.SodaAssets;
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const state = {
    textures: { green: null, blue: null },
    flavor: "classic",
    switchSpin: 0,
    isSwitching: false,
    rafIds: new Set(),
    intervals: new Set(),
    cleanups: [],
  };

  function prefersReducedMotion() {
    return reduced;
  }

  function onCleanup(fn) {
    state.cleanups.push(fn);
  }

  function destroy() {
    state.rafIds.forEach((id) => cancelAnimationFrame(id));
    state.rafIds.clear();
    state.intervals.forEach((id) => clearInterval(id));
    state.intervals.clear();
    while (state.cleanups.length) {
      const fn = state.cleanups.pop();
      try {
        fn();
      } catch (err) {
        console.error("SodaSite cleanup failed", err);
      }
    }
  }

  function setTheme(flavor, { animate = true } = {}) {
    const theme = Assets.themes[flavor] || Assets.themes.classic;
    state.flavor = flavor === "blue" ? "blue" : "classic";
    document.body.classList.toggle("blue-theme", state.flavor === "blue");

    if (!global.gsap || !animate || reduced) {
      document.body.style.setProperty("--bg-inner", theme.inner);
      document.body.style.setProperty("--bg-mid", theme.mid);
      document.body.style.setProperty("--bg-outer", theme.outer);
      return;
    }

    global.gsap.to(document.body, {
      "--bg-inner": theme.inner,
      "--bg-mid": theme.mid,
      "--bg-outer": theme.outer,
      duration: 1.5,
      ease: "power2.inOut",
    });
  }

  async function preloadTextures(modelViewer) {
    if (!modelViewer || typeof modelViewer.createTexture !== "function") return state.textures;
    try {
      if (!state.textures.blue) {
        state.textures.blue = await modelViewer.createTexture(Assets.blueTexture);
      }
      if (!state.textures.green) {
        state.textures.green = await modelViewer.createTexture(Assets.greenTexture);
      }
    } catch (err) {
      console.error("Texture preload failed", err);
    }
    return state.textures;
  }

  function applyCanTexture(modelViewer, flavor) {
    if (!modelViewer || !modelViewer.model) return;
    const tex = flavor === "blue" ? state.textures.blue : state.textures.green;
    if (!tex) return;
    modelViewer.model.materials.forEach((material) => {
      if (material.pbrMetallicRoughness && material.pbrMetallicRoughness.baseColorTexture) {
        material.pbrMetallicRoughness.baseColorTexture.setTexture(tex);
      }
    });
  }

  function bindPointerTilt(modelViewer, options = {}) {
    if (!modelViewer || reduced) return () => {};

    const yawAmp = options.yawAmp ?? 40;
    const pitchAmp = options.pitchAmp ?? 20;
    const basePitch = options.basePitch ?? 90;
    const distance = options.distance ?? "380%";
    const lerp = options.lerp ?? 0.05;
    const getExtraYaw = options.getExtraYaw || (() => 0);

    const mouse = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let running = true;

    function onMove(e) {
      const point = e.touches && e.touches[0] ? e.touches[0] : e;
      mouse.x = point.clientX / window.innerWidth - 0.5;
      mouse.y = point.clientY / window.innerHeight - 0.5;
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });

    let raf = 0;
    function tick() {
      if (!running) return;
      current.x += (mouse.x - current.x) * lerp;
      current.y += (mouse.y - current.y) * lerp;
      const yaw = current.x * yawAmp + getExtraYaw();
      const pitch = basePitch + current.y * pitchAmp;
      modelViewer.cameraOrbit = `${yaw}deg ${pitch}deg ${distance}`;
      raf = requestAnimationFrame(tick);
      state.rafIds.add(raf);
    }
    tick();
    onCleanup(() => {
      running = false;
      cancelAnimationFrame(raf);
    });

    const cleanup = () => {
      running = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
    };
    onCleanup(cleanup);
    return cleanup;
  }

  async function spinSwapFlavor(modelViewer, flavor, berryNodes = []) {
    if (!modelViewer || state.isSwitching) return;
    if (flavor === state.flavor) return;
    state.isSwitching = true;
    await preloadTextures(modelViewer);

    const next = flavor === "blue" ? "blue" : "classic";
    const theme = Assets.themes[next];
    setTheme(next, { animate: true });

    if (reduced || !global.gsap) {
      applyCanTexture(modelViewer, next);
      berryNodes.forEach((berry) => {
        berry.src = theme.berry;
      });
      state.isSwitching = false;
      return;
    }

    const spinObj = { val: state.switchSpin, blur: 0 };
    await new Promise((resolve) => {
      global.gsap.to(spinObj, {
        val: state.switchSpin + 360,
        blur: 15,
        duration: 0.6,
        ease: "power2.in",
        onUpdate: () => {
          state.switchSpin = spinObj.val;
          modelViewer.style.filter = `blur(${spinObj.blur}px)`;
        },
        onComplete: async () => {
          applyCanTexture(modelViewer, next);
          berryNodes.forEach((berry) => {
            berry.src = theme.berry;
          });
          global.gsap.to(spinObj, {
            val: state.switchSpin + 360,
            blur: 0,
            duration: 1.5,
            ease: "back.out(0.7)",
            onUpdate: () => {
              state.switchSpin = spinObj.val;
              modelViewer.style.filter = `blur(${spinObj.blur}px)`;
            },
            onComplete: () => {
              modelViewer.style.filter = "none";
              resolve();
            },
          });
        },
      });
    });

    state.isSwitching = false;
  }

  function startBubbles(container, options = {}) {
    if (!container) return () => {};
    const intervalMs = reduced ? 1200 : options.intervalMs ?? 400;
    const maxConcurrent = options.maxConcurrent ?? (window.innerWidth < 768 ? 8 : 16);

    function createBubble() {
      if (container.childElementCount >= maxConcurrent) return;
      const bubble = document.createElement("img");
      bubble.src = Assets.bubble;
      bubble.className = "bubble-img";
      bubble.alt = "";
      const size = Math.random() * 20 + 10 + "px";
      bubble.style.width = size;
      bubble.style.height = "auto";
      bubble.style.left = Math.random() * 100 + "%";
      bubble.style.bottom = "-50px";
      bubble.style.opacity = String(Math.random() * 0.4 + 0.2);
      const duration = Math.random() * 6 + 4;
      bubble.style.animation = `floatUpImg ${duration}s linear forwards`;
      container.appendChild(bubble);
      setTimeout(() => bubble.remove(), duration * 1000);
    }

    const id = setInterval(createBubble, intervalMs);
    state.intervals.add(id);
    const cleanup = () => clearInterval(id);
    onCleanup(cleanup);
    return cleanup;
  }

  function initPageTransition() {
    document.documentElement.classList.add("soda-ready");
    document.body.classList.add("page-enter");

    if (reduced) {
      document.body.classList.add("page-enter-done");
      return;
    }

    requestAnimationFrame(() => {
      document.body.classList.add("page-enter-active");
      setTimeout(() => document.body.classList.add("page-enter-done"), 700);
    });

    function onNavClick(e) {
      const link = e.target.closest("a[href]");
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("http")) return;
      if (link.target === "_blank") return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      e.preventDefault();
      document.body.classList.add("page-leave");
      setTimeout(() => {
        window.location.href = href;
      }, 380);
    }

    document.addEventListener("click", onNavClick);
    onCleanup(() => document.removeEventListener("click", onNavClick));
  }

  function revealOnScroll(selector, options = {}) {
    const nodes = Array.from(document.querySelectorAll(selector));
    if (!nodes.length) return () => {};

    if (reduced || !global.gsap || !global.ScrollTrigger) {
      nodes.forEach((n) => n.classList.add("is-inview"));
      return () => {};
    }

    global.gsap.registerPlugin(global.ScrollTrigger);
    const tweens = nodes.map((node) =>
      global.gsap.fromTo(
        node,
        { autoAlpha: 0, y: options.y ?? 48 },
        {
          autoAlpha: 1,
          y: 0,
          duration: options.duration ?? 1,
          ease: options.ease ?? "power3.out",
          scrollTrigger: {
            trigger: node,
            start: options.start ?? "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      )
    );

    const cleanup = () => {
      tweens.forEach((t) => {
        if (t.scrollTrigger) t.scrollTrigger.kill();
        t.kill();
      });
    };
    onCleanup(cleanup);
    return cleanup;
  }

  function bindScrollOrbit(modelViewer, options = {}) {
    if (!modelViewer) return () => {};
    if (reduced || !global.gsap || !global.ScrollTrigger) {
      modelViewer.cameraOrbit = options.idleOrbit || "25deg 80deg 320%";
      return () => {};
    }

    global.gsap.registerPlugin(global.ScrollTrigger);
    const proxy = { yaw: options.fromYaw ?? -20, pitch: options.fromPitch ?? 78, dist: options.fromDist ?? 340 };
    const tween = global.gsap.to(proxy, {
      yaw: options.toYaw ?? 40,
      pitch: options.toPitch ?? 95,
      dist: options.toDist ?? 280,
      ease: "none",
      scrollTrigger: {
        trigger: options.trigger || document.body,
        start: options.start || "top top",
        end: options.end || "bottom bottom",
        scrub: options.scrub ?? 1.1,
      },
      onUpdate: () => {
        modelViewer.cameraOrbit = `${proxy.yaw}deg ${proxy.pitch}deg ${proxy.dist}%`;
      },
    });

    const cleanup = () => {
      if (tween.scrollTrigger) tween.scrollTrigger.kill();
      tween.kill();
    };
    onCleanup(cleanup);
    return cleanup;
  }

  function floatBerries(nodes) {
    if (!nodes || !nodes.length || reduced) return () => {};
    let running = true;
    const started = performance.now();

    function tick(now) {
      if (!running) return;
      const time = (now - started) * 0.001;
      nodes.forEach((berry, i) => {
        const dur = 5 + (i % 4);
        const phase = (time + i * 0.7) * ((Math.PI * 2) / dur);
        const floatY = Math.sin(phase) * 14;
        const floatAngle = Math.cos(phase) * 6;
        berry.style.transform = `translateY(${floatY}px) rotate(${floatAngle}deg)`;
      });
      const id = requestAnimationFrame(tick);
      state.rafIds.add(id);
    }
    requestAnimationFrame(tick);

    const cleanup = () => {
      running = false;
    };
    onCleanup(cleanup);
    return cleanup;
  }

  function bootSecondary(options = {}) {
    initPageTransition();
    startBubbles(document.getElementById("bubbles-container"), {
      maxConcurrent: window.innerWidth < 768 ? 6 : 14,
    });

    const flavor = options.flavor || "classic";
    setTheme(flavor, { animate: false });

    window.addEventListener("pagehide", destroy);
    onCleanup(() => window.removeEventListener("pagehide", destroy));

    return {
      setTheme,
      preloadTextures,
      applyCanTexture,
      bindPointerTilt,
      spinSwapFlavor,
      revealOnScroll,
      bindScrollOrbit,
      floatBerries,
      destroy,
      getFlavor: () => state.flavor,
      getSwitchSpin: () => state.switchSpin,
      prefersReducedMotion,
    };
  }

  global.SodaSite = {
    bootSecondary,
    prefersReducedMotion,
    destroy,
    Assets,
  };
})(window);
