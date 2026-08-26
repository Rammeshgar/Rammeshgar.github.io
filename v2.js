(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const compact = window.matchMedia("(max-width: 760px)").matches;
  const saveData = navigator.connection?.saveData === true;
  const canvas = document.getElementById("story-canvas");
  const hero = document.getElementById("home");
  const intro = document.querySelector("[data-hero-intro]");
  const chapters = [...document.querySelectorAll("[data-chapter]")];
  const artifacts = document.querySelector("[data-artifacts]");
  const progressBar = document.getElementById("story-progress");
  const frameCounter = document.getElementById("story-count");
  const scrollCue = document.querySelector(".scroll-cue");
  const frameCount = 183;
  const frameDirectory = compact ? "frames/mobile" : "frames/desktop";
  const context = canvas?.getContext("2d", { alpha: false, desynchronized: true });
  const frames = new Map();
  const pending = new Map();
  let targetFrame = 0;
  let currentFrame = 0;
  let drawnFrame = -1;
  let animationRequested = false;
  let heroVisible = true;
  let canvasWidth = 0;
  let canvasHeight = 0;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const smooth = (edge0, edge1, value) => {
    const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const frameUrl = (index) => `${frameDirectory}/frame-${String(index + 1).padStart(4, "0")}.webp`;

  function loadFrame(index) {
    index = clamp(Math.round(index), 0, frameCount - 1);
    if (frames.has(index)) return Promise.resolve(frames.get(index));
    if (pending.has(index)) return pending.get(index);
    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = async () => {
        try { await image.decode?.(); } catch (_) { /* decoding already completed */ }
        frames.set(index, image);
        pending.delete(index);
        resolve(image);
      };
      image.onerror = () => {
        pending.delete(index);
        reject(new Error(`Could not load cinematic frame ${index + 1}`));
      };
      image.src = frameUrl(index);
    });
    pending.set(index, promise);
    return promise;
  }

  function resizeCanvas() {
    if (!canvas || !context) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, compact ? 1 : 1.25);
    canvasWidth = Math.max(1, Math.round(rect.width * dpr));
    canvasHeight = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      drawnFrame = -1;
      drawClosest(Math.round(currentFrame));
    }
  }

  function drawImage(image) {
    if (!context || !image?.naturalWidth) return;
    const scale = Math.max(canvasWidth / image.naturalWidth, canvasHeight / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    const x = (canvasWidth - width) / 2;
    const y = (canvasHeight - height) / 2;
    context.fillStyle = "#03070b";
    context.fillRect(0, 0, canvasWidth, canvasHeight);
    context.drawImage(image, x, y, width, height);
  }

  function drawClosest(index) {
    if (!frames.size || index === drawnFrame) return;
    let closestIndex = index;
    if (!frames.has(index)) {
      for (let radius = 1; radius < 18; radius += 1) {
        if (frames.has(index - radius)) { closestIndex = index - radius; break; }
        if (frames.has(index + radius)) { closestIndex = index + radius; break; }
      }
    }
    const image = frames.get(closestIndex);
    if (!image) return;
    drawImage(image);
    drawnFrame = closestIndex;
    document.body.classList.add("frames-ready");
  }

  function prioritizeFrames(center) {
    const order = [0, 1, -1, 2, -2, 3, -3, 5, -5, 8, -8, 12, -12];
    order.forEach((offset) => loadFrame(center + offset).then(() => requestStoryFrame()).catch(() => {}));
  }

  async function loadAllFrames() {
    const queue = Array.from({ length: frameCount }, (_, index) => index)
      .sort((a, b) => Math.abs(a - targetFrame) - Math.abs(b - targetFrame));
    let cursor = 0;
    const worker = async () => {
      while (cursor < queue.length) {
        const index = queue[cursor++];
        try { await loadFrame(index); } catch (_) { /* fallback frame remains visible */ }
      }
    };
    const concurrency = compact ? 2 : 3;
    await Promise.all(Array.from({ length: concurrency }, worker));
  }

  function scheduleFrameWarmup() {
    const beginWarmup = () => {
      const idle = window.requestIdleCallback || ((callback) => setTimeout(callback, 500));
      idle(() => loadAllFrames());
    };
    if (document.readyState === "complete") {
      window.setTimeout(beginWarmup, 2600);
    } else {
      window.addEventListener("load", () => window.setTimeout(beginWarmup, 2600), { once: true });
    }
  }

  function setLayerState(progress) {
    const introExit = 1 - smooth(.08, .2, progress);
    intro.style.opacity = introExit.toFixed(3);
    intro.style.transform = compact
      ? `translate3d(0,${-28 * (1 - introExit)}px,0)`
      : `translate3d(0,calc(-48% + ${-28 * (1 - introExit)}px),0)`;
    intro.style.pointerEvents = introExit > .35 ? "auto" : "none";
    if (scrollCue) scrollCue.style.opacity = String(1 - smooth(.025, .12, progress));

    const windows = [[.13, .22, .29, .35], [.31, .39, .47, .53], [.49, .57, .65, .71], [.67, .75, .83, .89]];
    chapters.forEach((chapter, index) => {
      const [a, b, c, d] = windows[index];
      const visibility = smooth(a, b, progress) * (1 - smooth(c, d, progress));
      const direction = chapter.classList.contains("chapter--right") ? 1 : -1;
      const x = direction * (1 - visibility) * 28;
      const y = compact ? (1 - visibility) * 24 : -42;
      chapter.style.opacity = visibility.toFixed(3);
      chapter.style.transform = compact
        ? `translate3d(${x}px,${y}px,0)`
        : `translate3d(${x}px,-42%,0)`;
    });

    const artifactVisibility = smooth(.86, .95, progress);
    artifacts.style.opacity = artifactVisibility.toFixed(3);
    artifacts.style.visibility = artifactVisibility > .55 ? "visible" : "hidden";
    artifacts.style.pointerEvents = artifactVisibility > .7 ? "auto" : "none";
    artifacts.style.transform = compact
      ? `translate3d(0,${35 * (1 - artifactVisibility)}px,0)`
      : `translate3d(-50%,${50 * (1 - artifactVisibility)}px,0)`;
    progressBar.style.width = `${progress * 100}%`;
    frameCounter.textContent = `${String(Math.round(progress * (frameCount - 1)) + 1).padStart(3, "0")} / ${frameCount}`;
  }

  function calculateProgress() {
    const rect = hero.getBoundingClientRect();
    const distance = Math.max(1, hero.offsetHeight - window.innerHeight);
    return clamp(-rect.top / distance, 0, 1);
  }

  function storyTick() {
    animationRequested = false;
    if (!context || reducedMotion) return;
    const difference = targetFrame - currentFrame;
    if (Math.abs(difference) > .015) {
      const proportional = Math.max(.28, Math.abs(difference) * .13);
      const maxStep = compact ? 1.35 : 1.65;
      currentFrame += Math.sign(difference) * Math.min(Math.abs(difference), proportional, maxStep);
    } else {
      currentFrame = targetFrame;
    }
    const rounded = Math.round(currentFrame);
    loadFrame(rounded).then(() => drawClosest(rounded)).catch(() => drawClosest(rounded));
    if (Math.abs(difference) > 8) prioritizeFrames(Math.round(targetFrame));
    setLayerState(currentFrame / (frameCount - 1));
    if (heroVisible && Math.abs(targetFrame - currentFrame) > .015) requestStoryFrame();
  }

  function requestStoryFrame() {
    if (animationRequested || reducedMotion) return;
    animationRequested = true;
    requestAnimationFrame(storyTick);
  }

  function updateStoryTarget() {
    if (reducedMotion) return;
    targetFrame = calculateProgress() * (frameCount - 1);
    prioritizeFrames(Math.round(targetFrame));
    requestStoryFrame();
  }

  if (canvas && context && !reducedMotion) {
    resizeCanvas();
    Promise.all([0, 1, 2, 3].map(loadFrame))
      .then(() => {
        targetFrame = calculateProgress() * (frameCount - 1);
        currentFrame = targetFrame;
        loadFrame(Math.round(currentFrame)).then(() => {
          drawClosest(Math.round(currentFrame));
          setLayerState(currentFrame / (frameCount - 1));
        }).catch(() => drawClosest(0));
        scheduleFrameWarmup();
      })
      .catch(() => {});
    window.addEventListener("scroll", updateStoryTarget, { passive: true });
    window.addEventListener("resize", () => {
      resizeCanvas();
      updateStoryTarget();
    }, { passive: true });
    window.addEventListener("pageshow", () => {
      targetFrame = calculateProgress() * (frameCount - 1);
      currentFrame = targetFrame;
      drawnFrame = -1;
      loadFrame(Math.round(currentFrame)).then(() => {
        drawClosest(Math.round(currentFrame));
        setLayerState(currentFrame / (frameCount - 1));
      }).catch(() => {});
    });
    new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      document.body.classList.toggle("hero-active", heroVisible);
      if (heroVisible) updateStoryTarget();
    }, { threshold: 0 }).observe(hero);
  } else {
    setLayerState(0);
  }

  const topbar = document.querySelector("[data-topbar]");
  const menuButton = document.getElementById("menu-button");
  const mobileMenu = document.getElementById("mobile-menu");
  function closeMenu() {
    document.body.classList.remove("menu-open");
    mobileMenu.classList.remove("is-open");
    mobileMenu.setAttribute("aria-hidden", "true");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open menu");
  }
  menuButton.addEventListener("click", () => {
    const opening = !mobileMenu.classList.contains("is-open");
    document.body.classList.toggle("menu-open", opening);
    mobileMenu.classList.toggle("is-open", opening);
    mobileMenu.setAttribute("aria-hidden", String(!opening));
    menuButton.setAttribute("aria-expanded", String(opening));
    menuButton.setAttribute("aria-label", opening ? "Close menu" : "Open menu");
  });
  mobileMenu.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeMenu(); });
  window.addEventListener("scroll", () => topbar.classList.toggle("is-scrolled", window.scrollY > 40), { passive: true });

  // One compositor-friendly scroll variable gives the background planes depth
  // without running a decorative animation loop while the page is idle.
  let atmosphereRequested = false;
  function updateAtmosphere() {
    atmosphereRequested = false;
    const drift = reducedMotion ? 0 : Math.max(-34, Math.min(34, window.scrollY * -.018));
    document.documentElement.style.setProperty("--ambient-y", `${drift}px`);
  }
  window.addEventListener("scroll", () => {
    if (atmosphereRequested) return;
    atmosphereRequested = true;
    requestAnimationFrame(updateAtmosphere);
  }, { passive: true });
  updateAtmosphere();

  // The section background is a progressive enhancement: it is fetched only
  // when the visitor approaches the project world and never on reduced-motion
  // or data-saver sessions.
  const systemsWorld = document.getElementById("systems-world");
  if (systemsWorld && !reducedMotion && !saveData) {
    const loadSystemsBackground = () => import("./background-3d.js?v=20260826-4").catch((error) => {
      console.warn("The interactive systems background is unavailable.", error);
    });
    if ("IntersectionObserver" in window) {
      const systemsLoader = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        systemsLoader.disconnect();
        loadSystemsBackground();
      }, { rootMargin: "110% 0px" });
      systemsLoader.observe(systemsWorld);
    } else {
      window.setTimeout(loadSystemsBackground, 1200);
    }
  }

  const reveals = document.querySelectorAll(".reveal");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    reveals.forEach((element) => element.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: .12, rootMargin: "0px 0px -7%" });
    reveals.forEach((element) => revealObserver.observe(element));
  }

  const music = document.getElementById("bg-music");
  const musicToggle = document.getElementById("music-toggle");
  musicToggle?.addEventListener("click", async () => {
    if (music.paused) {
      try {
        await music.play();
        musicToggle.setAttribute("aria-pressed", "true");
        musicToggle.setAttribute("aria-label", "Pause background music");
      } catch (_) {
        musicToggle.setAttribute("aria-label", "Background music could not start");
      }
    } else {
      music.pause();
      musicToggle.setAttribute("aria-pressed", "false");
      musicToggle.setAttribute("aria-label", "Play background music");
    }
  });
  window.portfolioMusic = {
    pauseForVoice() { if (!music.paused) { music.dataset.resumeAfterVoice = "true"; music.pause(); } },
    resumeAfterVoice() { if (music.dataset.resumeAfterVoice === "true") { delete music.dataset.resumeAfterVoice; music.play().catch(() => {}); } }
  };

  const mascotToggle = document.getElementById("ai-mascot-toggle");
  let mascotPromise;
  function loadMascotModule() {
    if (mascotPromise) return mascotPromise;
    const label = mascotToggle.querySelector(".ai-mascot-toggle__label");
    const previous = label.textContent;
    label.textContent = "Loading twin…";
    mascotPromise = import("./mascot.js?v=20260826-4")
      .then(() => { label.textContent = previous; return true; })
      .catch((error) => {
        console.error("The digital twin could not load.", error);
        label.textContent = "Twin unavailable";
        document.getElementById("ai-mascot-status").textContent = "Could not load the 3D guide";
        return false;
      });
    return mascotPromise;
  }
  mascotToggle.addEventListener("click", async (event) => {
    if (mascotPromise) return;
    event.preventDefault();
    const loaded = await loadMascotModule();
    if (loaded) mascotToggle.click();
  }, { once: true });
  document.querySelectorAll("[data-open-ai]").forEach((button) => {
    button.addEventListener("click", async () => {
      closeMenu();
      const loaded = await loadMascotModule();
      if (loaded && !document.getElementById("ai-mascot-panel").classList.contains("is-open")) mascotToggle.click();
    });
  });

  document.getElementById("current-year").textContent = new Date().getFullYear();
})();
