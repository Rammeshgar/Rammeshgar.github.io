(() => {
    "use strict";

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const compactScreen = window.matchMedia("(max-width: 760px)").matches;
    const saveData = Boolean(navigator.connection?.saveData);
    const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

    const year = document.getElementById("current-year");
    if (year) year.textContent = String(new Date().getFullYear());

    /* Navigation */
    const nav = document.querySelector(".site-nav");
    const navToggle = document.querySelector(".nav-toggle");
    const navLinks = [...document.querySelectorAll(".nav-links a")];

    function closeNavigation() {
        document.body.classList.remove("nav-open");
        navToggle?.setAttribute("aria-expanded", "false");
        navToggle?.setAttribute("aria-label", "Open navigation");
    }

    navToggle?.addEventListener("click", () => {
        const willOpen = !document.body.classList.contains("nav-open");
        document.body.classList.toggle("nav-open", willOpen);
        navToggle.setAttribute("aria-expanded", String(willOpen));
        navToggle.setAttribute("aria-label", willOpen ? "Close navigation" : "Open navigation");
    });

    navLinks.forEach((link) => link.addEventListener("click", closeNavigation));
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeNavigation();
    });

    /* Retained title animation */
    const typingTarget = document.getElementById("typing-text");
    const phrases = ["configuration", "quality engineering", "data systems", "web experiences", "practical AI"];

    if (typingTarget) {
        if (reduceMotion || compactScreen || saveData) {
            typingTarget.textContent = "configuration, quality, data & web";
        } else {
            let phraseIndex = 0;
            let characterIndex = 0;
            let deleting = false;

            const type = () => {
                const phrase = phrases[phraseIndex];
                characterIndex += deleting ? -1 : 1;
                typingTarget.textContent = phrase.slice(0, characterIndex);

                let delay = deleting ? 38 : 68;
                if (!deleting && characterIndex === phrase.length) {
                    deleting = true;
                    delay = 1250;
                } else if (deleting && characterIndex === 0) {
                    deleting = false;
                    phraseIndex = (phraseIndex + 1) % phrases.length;
                    delay = 260;
                }
                window.setTimeout(type, delay);
            };

            window.setTimeout(type, 500);
        }
    }

    /* Responsive frame-sequence cinematic */
    const cinematic = document.querySelector(".cinematic");
    const storyCanvas = document.getElementById("cinematic-canvas");
    const storyContext = storyCanvas?.getContext("2d", { alpha: false, desynchronized: true });
    const cinematicVideo = document.getElementById("cinematic-video");
    const intro = document.querySelector("[data-story-intro]");
    const storySteps = [...document.querySelectorAll("[data-story-step]")];
    const progressBar = document.getElementById("story-progress-bar");
    const storyCurrent = document.getElementById("story-current");
    const loaderBar = document.getElementById("cinematic-loader-bar");
    const loaderLabel = document.getElementById("cinematic-loader-label");

    const frameConfig = saveData
        ? { directory: "frames/mobile", count: 67, cacheSize: 10 }
        : compactScreen
            ? { directory: "frames/mobile-smooth", count: 160, cacheSize: 16 }
            : { directory: "frames/desktop", count: 160, cacheSize: 20 };

    const compressedFrames = new Map();
    const compressedPromises = new Map();
    const decodedFrames = new Map();
    const decodePromises = new Map();
    const decodedOrder = [];
    let fetchedFrames = 0;
    let currentFrame = 0;
    let requestedFrame = 0;
    let storyProgress = 0;
    let storyCanvasWidth = 0;
    let storyCanvasHeight = 0;
    let videoDuration = 0;
    let videoTargetTime = 0;
    let videoSeekQueued = false;
    let videoSeekInFlight = false;
    let videoSeekWatchdog = 0;

    function syncVideoToScroll(progress) {
        if (!cinematicVideo || !videoDuration || reduceMotion) return;
        videoTargetTime = clamp(progress, 0, 1) * Math.max(0, videoDuration - 0.04);
        queueVideoSeek();
    }

    function queueVideoSeek() {
        if (videoSeekQueued || videoSeekInFlight) return;
        videoSeekQueued = true;
        window.requestAnimationFrame(() => {
            videoSeekQueued = false;
            if (!cinematicVideo || videoSeekInFlight) return;
            if (Math.abs(cinematicVideo.currentTime - videoTargetTime) <= 0.016) return;
            videoSeekInFlight = true;
            cinematicVideo.currentTime = videoTargetTime;
            window.clearTimeout(videoSeekWatchdog);
            videoSeekWatchdog = window.setTimeout(() => {
                videoSeekInFlight = false;
                queueVideoSeek();
            }, 220);
        });
    }

    const frameUrl = (index) => `${frameConfig.directory}/frame-${String(index + 1).padStart(4, "0")}.webp`;

    function updateLoadProgress() {
        const progress = fetchedFrames / frameConfig.count;
        loaderBar?.style.setProperty("transform", `scaleX(${progress})`);
        if (loaderLabel) loaderLabel.textContent = progress < 0.98
            ? `Preparing frames ${Math.round(progress * 100)}%`
            : "Story ready";
    }

    async function fetchFrame(index) {
        if (compressedFrames.has(index)) return compressedFrames.get(index);
        if (compressedPromises.has(index)) return compressedPromises.get(index);

        const promise = fetch(frameUrl(index), { cache: "force-cache" })
            .then((response) => {
                if (!response.ok) throw new Error(`Frame ${index + 1} failed (${response.status})`);
                return response.blob();
            })
            .then((blob) => {
                compressedFrames.set(index, blob);
                compressedPromises.delete(index);
                fetchedFrames += 1;
                updateLoadProgress();
                return blob;
            })
            .catch((error) => {
                compressedPromises.delete(index);
                throw error;
            });

        compressedPromises.set(index, promise);
        return promise;
    }

    function rememberDecoded(index, bitmap) {
        decodedFrames.set(index, bitmap);
        const previousPosition = decodedOrder.indexOf(index);
        if (previousPosition !== -1) decodedOrder.splice(previousPosition, 1);
        decodedOrder.push(index);

        while (decodedOrder.length > frameConfig.cacheSize) {
            const staleIndex = decodedOrder.shift();
            if (staleIndex === requestedFrame) {
                decodedOrder.push(staleIndex);
                continue;
            }
            const staleBitmap = decodedFrames.get(staleIndex);
            staleBitmap?.close?.();
            decodedFrames.delete(staleIndex);
        }
    }

    async function decodeFrame(index) {
        if (decodedFrames.has(index)) return decodedFrames.get(index);
        if (decodePromises.has(index)) return decodePromises.get(index);

        const promise = fetchFrame(index)
            .then(async (blob) => {
                if ("createImageBitmap" in window) return createImageBitmap(blob);

                return new Promise((resolve, reject) => {
                    const image = new Image();
                    const objectUrl = URL.createObjectURL(blob);
                    image.onload = () => {
                        URL.revokeObjectURL(objectUrl);
                        resolve(image);
                    };
                    image.onerror = () => {
                        URL.revokeObjectURL(objectUrl);
                        reject(new Error(`Could not decode frame ${index + 1}`));
                    };
                    image.src = objectUrl;
                });
            })
            .then((bitmap) => {
                decodePromises.delete(index);
                rememberDecoded(index, bitmap);
                return bitmap;
            })
            .catch((error) => {
                decodePromises.delete(index);
                throw error;
            });

        decodePromises.set(index, promise);
        return promise;
    }

    function nearestDecoded(index) {
        let nearest = null;
        let distance = Infinity;
        decodedFrames.forEach((_bitmap, decodedIndex) => {
            const candidateDistance = Math.abs(decodedIndex - index);
            if (candidateDistance < distance) {
                distance = candidateDistance;
                nearest = decodedIndex;
            }
        });
        return nearest;
    }

    function drawBitmap(bitmap) {
        if (!storyContext || !storyCanvas || !bitmap) return;
        const sourceWidth = bitmap.width || bitmap.naturalWidth;
        const sourceHeight = bitmap.height || bitmap.naturalHeight;
        if (!sourceWidth || !sourceHeight) return;

        const scale = Math.max(storyCanvasWidth / sourceWidth, storyCanvasHeight / sourceHeight);
        const width = sourceWidth * scale;
        const height = sourceHeight * scale;
        const x = (storyCanvasWidth - width) / 2;
        const y = (storyCanvasHeight - height) / 2;
        storyContext.drawImage(bitmap, x, y, width, height);
    }

    function requestStoryFrame(index) {
        if (reduceMotion || !storyContext) return;
        const roundedFrame = Math.round(index);
        requestedFrame = saveData
            ? clamp(Math.round(roundedFrame / 2) * 2, 0, frameConfig.count - 1)
            : clamp(roundedFrame, 0, frameConfig.count - 1);
        const frameAtRequest = requestedFrame;

        if (decodedFrames.has(frameAtRequest)) {
            currentFrame = frameAtRequest;
            drawBitmap(decodedFrames.get(frameAtRequest));
            return;
        }

        const nearby = nearestDecoded(frameAtRequest);
        if (nearby !== null) drawBitmap(decodedFrames.get(nearby));

        decodeFrame(frameAtRequest)
            .then((bitmap) => {
                if (requestedFrame !== frameAtRequest) return;
                currentFrame = frameAtRequest;
                drawBitmap(bitmap);
                document.body.classList.add("frames-ready");
            })
            .catch((error) => console.warn("Cinematic frame unavailable:", error.message));

        const neighborStep = saveData ? 2 : 1;
        [frameAtRequest - neighborStep, frameAtRequest + neighborStep].forEach((neighbor) => {
            if (neighbor >= 0 && neighbor < frameConfig.count) fetchFrame(neighbor).catch(() => {});
        });
    }

    function resizeStoryCanvas() {
        if (!storyCanvas || !storyContext) return;
        const dpr = Math.min(window.devicePixelRatio || 1, compactScreen ? 1 : 1.25);
        storyCanvasWidth = Math.max(1, window.innerWidth);
        storyCanvasHeight = Math.max(1, window.innerHeight);
        storyCanvas.width = Math.round(storyCanvasWidth * dpr);
        storyCanvas.height = Math.round(storyCanvasHeight * dpr);
        storyCanvas.style.width = `${storyCanvasWidth}px`;
        storyCanvas.style.height = `${storyCanvasHeight}px`;
        storyContext.setTransform(dpr, 0, 0, dpr, 0, 0);
        requestStoryFrame(currentFrame);
    }

    async function progressivelyFetchFrames() {
        const keyframes = [0, Math.round(frameConfig.count * 0.25), Math.round(frameConfig.count * 0.5), Math.round(frameConfig.count * 0.75), frameConfig.count - 1];
        const remaining = Array.from({ length: frameConfig.count }, (_value, index) => index)
            .filter((index) => !keyframes.includes(index));
        const queue = [...keyframes, ...remaining];
        let queueIndex = 0;

        async function worker() {
            while (queueIndex < queue.length) {
                const index = queue[queueIndex++];
                try { await fetchFrame(index); } catch (_) { /* fallback remains available */ }
            }
        }

        await Promise.all(Array.from({ length: compactScreen ? 2 : 3 }, worker));
    }

    function primeDataSaverKeyframes() {
        const keyframes = [0, 0.25, 0.5, 0.75, 1]
            .map((progress) => Math.round(progress * (frameConfig.count - 1)))
            .map((index) => clamp(Math.round(index / 2) * 2, 0, frameConfig.count - 1));
        Promise.allSettled([...new Set(keyframes)].map((index) => fetchFrame(index)));
    }

    function stepFromProgress(progress) {
        if (progress < 0.14) return -1;
        if (progress < 0.36) return 0;
        if (progress < 0.58) return 1;
        if (progress < 0.79) return 2;
        return 3;
    }

    function renderStory() {
        if (!cinematic) return;
        const rect = cinematic.getBoundingClientRect();
        const distance = Math.max(1, cinematic.offsetHeight - window.innerHeight);
        storyProgress = clamp(-rect.top / distance);
        const stepIndex = stepFromProgress(storyProgress);

        nav?.classList.toggle("is-scrolled", window.scrollY > 30);
        intro?.classList.toggle("is-past", storyProgress > 0.12);
        progressBar?.style.setProperty("transform", `scaleX(${storyProgress})`);
        if (storyCurrent) storyCurrent.textContent = String(Math.max(1, stepIndex + 1)).padStart(2, "0");
        storySteps.forEach((step, index) => step.classList.toggle("is-active", index === stepIndex));

        const hasPassedStory = rect.bottom < window.innerHeight * 1.35 || storyProgress > 0.84;
        document.body.classList.toggle("ai-available", hasPassedStory);

        if (!reduceMotion) {
            requestStoryFrame(storyProgress * (frameConfig.count - 1));
            syncVideoToScroll(storyProgress);
        }
    }

    if (!reduceMotion && storyCanvas && storyContext) {
        resizeStoryCanvas();
        decodeFrame(0).then((bitmap) => {
            drawBitmap(bitmap);
            document.body.classList.add("frames-ready");
            if (saveData) {
                const prime = () => primeDataSaverKeyframes();
                if ("requestIdleCallback" in window) {
                    window.requestIdleCallback(prime, { timeout: 2600 });
                } else {
                    window.setTimeout(prime, 1800);
                }
            } else if (compactScreen) {
                const preload = () => progressivelyFetchFrames();
                if ("requestIdleCallback" in window) {
                    window.requestIdleCallback(preload, { timeout: 1800 });
                } else {
                    window.setTimeout(preload, 900);
                }
            } else {
                window.setTimeout(progressivelyFetchFrames, 320);
            }
        }).catch(() => {
            if (loaderLabel) loaderLabel.textContent = "Using the static fallback";
        });
    } else {
        document.body.classList.add("ai-available");
    }

    if (!reduceMotion && cinematicVideo) {
        cinematicVideo.addEventListener("loadedmetadata", () => {
            videoDuration = Number.isFinite(cinematicVideo.duration) ? cinematicVideo.duration : 0;
            if (!videoDuration) return;
            cinematicVideo.pause();
            document.body.classList.add("video-ready");
            syncVideoToScroll(storyProgress);
        }, { once: true });
        cinematicVideo.addEventListener("error", () => {
            console.warn("Cinematic video unavailable; using poster fallback.");
        }, { once: true });
        cinematicVideo.addEventListener("seeked", () => {
            window.clearTimeout(videoSeekWatchdog);
            videoSeekInFlight = false;
            queueVideoSeek();
        });

        let videoPrimed = false;
        const primeVideo = () => {
            if (videoPrimed) return;
            videoPrimed = true;
            cinematicVideo.preload = "auto";
            cinematicVideo.load();
        };
        ["pointerdown", "touchstart", "wheel", "keydown"].forEach((eventName) => {
            window.addEventListener(eventName, primeVideo, { once: true, passive: true });
        });
        window.addEventListener("load", () => {
            window.setTimeout(primeVideo, 2800);
        }, { once: true });
    }

    let scrollTicking = false;
    function onScroll() {
        if (scrollTicking) return;
        scrollTicking = true;
        window.requestAnimationFrame(() => {
            renderStory();
            scrollTicking = false;
        });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", () => {
        resizeStoryCanvas();
        renderStory();
    }, { passive: true });
    renderStory();

    /* Reveal and active navigation */
    const revealElements = [...document.querySelectorAll(".reveal")];
    if (reduceMotion || !("IntersectionObserver" in window)) {
        revealElements.forEach((element) => element.classList.add("is-visible"));
    } else {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                revealObserver.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
        revealElements.forEach((element) => revealObserver.observe(element));
    }

    const observedSections = [...document.querySelectorAll("section[id]:not(#home)")];
    if ("IntersectionObserver" in window) {
        const sectionObserver = new IntersectionObserver((entries) => {
            const visible = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
            if (!visible) return;
            navLinks.forEach((link) => {
                link.classList.toggle("is-active", link.getAttribute("href") === `#${visible.target.id}`);
            });
        }, { threshold: [0.18, 0.35, 0.6], rootMargin: "-20% 0px -58% 0px" });
        observedSections.forEach((section) => sectionObserver.observe(section));
    }

    /* Lightweight hover-reactive pixels: no scroll-time redraws */
    const pixelCanvas = document.getElementById("pixel-field");
    const pixelContext = compactScreen ? null : pixelCanvas?.getContext("2d");
    const pointer = { x: -1000, y: -1000, active: false };
    let pixelWidth = 0;
    let pixelHeight = 0;
    let pixelFrame = 0;

    function resizePixelField() {
        if (!pixelCanvas || !pixelContext) return;
        const dpr = Math.min(window.devicePixelRatio || 1, compactScreen ? 1 : 1.25);
        pixelWidth = window.innerWidth;
        pixelHeight = window.innerHeight;
        pixelCanvas.width = Math.round(pixelWidth * dpr);
        pixelCanvas.height = Math.round(pixelHeight * dpr);
        pixelCanvas.style.width = `${pixelWidth}px`;
        pixelCanvas.style.height = `${pixelHeight}px`;
        pixelContext.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawPixelField();
    }

    function drawPixelField() {
        if (!pixelContext || pixelFrame) return;
        pixelFrame = window.requestAnimationFrame(() => {
            pixelFrame = 0;
            pixelContext.clearRect(0, 0, pixelWidth, pixelHeight);
            const gap = compactScreen ? 36 : 34;
            const radius = 150;

            for (let y = 0; y < pixelHeight + gap; y += gap) {
                for (let x = gap / 2; x < pixelWidth; x += gap) {
                    const staggeredX = x + ((Math.floor(y / gap) % 2) * gap / 2);
                    const distance = Math.hypot(staggeredX - pointer.x, y - pointer.y);
                    const influence = pointer.active ? clamp(1 - distance / radius) : 0;
                    const size = 1 + influence * 3.2;
                    const alpha = 0.065 + influence * 0.56;
                    pixelContext.fillStyle = influence > 0.55
                        ? `rgba(87, 230, 217, ${alpha})`
                        : `rgba(167, 176, 183, ${alpha})`;
                    pixelContext.fillRect(staggeredX - size / 2, y - size / 2, size, size);
                }
            }
        });
    }

    if (pixelCanvas && pixelContext) {
        resizePixelField();
        window.addEventListener("resize", resizePixelField, { passive: true });
        if (finePointer && !reduceMotion) {
            window.addEventListener("pointermove", (event) => {
                pointer.x = event.clientX;
                pointer.y = event.clientY;
                pointer.active = true;
                drawPixelField();
            }, { passive: true });
            document.documentElement.addEventListener("mouseleave", () => {
                pointer.active = false;
                drawPixelField();
            });
        }
    }

    /* Restored opt-in music, coordinated with the speaking mascot */
    const music = document.getElementById("bg-music");
    const musicToggle = document.getElementById("music-toggle");
    const musicLabel = document.getElementById("music-label");
    let musicPausedForVoice = false;

    function updateMusicControl() {
        if (!music || !musicToggle) return;
        const playing = !music.paused;
        musicToggle.setAttribute("aria-pressed", String(playing));
        musicToggle.setAttribute("aria-label", playing ? "Pause background music" : "Play background music");
        if (musicLabel) musicLabel.textContent = playing ? "Pause music" : "Play music";
    }

    musicToggle?.addEventListener("click", async () => {
        if (!music) return;
        musicPausedForVoice = false;
        try {
            if (music.paused) {
                music.volume = 0.34;
                await music.play();
            } else {
                music.pause();
            }
        } catch (_) {
            if (musicLabel) musicLabel.textContent = "Audio unavailable";
        }
        updateMusicControl();
    });

    window.portfolioMusic = {
        pauseForVoice() {
            if (!music || music.paused) return;
            musicPausedForVoice = true;
            music.pause();
            updateMusicControl();
        },
        async resumeAfterVoice() {
            if (!music || !musicPausedForVoice) return;
            musicPausedForVoice = false;
            try { await music.play(); } catch (_) { /* visitor can restart manually */ }
            updateMusicControl();
        },
    };
    updateMusicControl();

    /* Load the 3D systems world only when the visitor approaches it */
    const systemsWorld = document.getElementById("systems-world");
    if (systemsWorld && !reduceMotion && !saveData) {
        if ("IntersectionObserver" in window) {
            const systemsLoader = new IntersectionObserver((entries) => {
                if (!entries.some((entry) => entry.isIntersecting)) return;
                systemsLoader.disconnect();
                import("./background-3d.js").catch((error) => {
                    console.warn("Could not load the systems background:", error);
                });
            }, { rootMargin: "120% 0px" });
            systemsLoader.observe(systemsWorld);
        } else {
            window.setTimeout(() => import("./background-3d.js"), 1200);
        }
    }

    /* The navigation AI button opens the same lazy-loaded digital twin */
    const aiToggle = document.getElementById("ai-mascot-toggle");
    let aiModuleLoaded = false;
    let aiModuleLoading = false;

    aiToggle?.addEventListener("click", async (event) => {
        if (aiModuleLoaded) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (aiModuleLoading) return;

        aiModuleLoading = true;
        aiToggle.disabled = true;
        const label = aiToggle.querySelector(".ai-mascot-toggle__label");
        if (label) label.textContent = "Loading digital twin…";

        try {
            await import("./mascot.js?v=20260825-11");
            aiModuleLoaded = true;
            aiToggle.disabled = false;
            aiToggle.click();
        } catch (error) {
            aiToggle.disabled = false;
            if (label) label.textContent = "Digital twin unavailable";
            console.error("Could not load the digital twin:", error);
        } finally {
            aiModuleLoading = false;
        }
    }, true);

    document.querySelectorAll("[data-open-ai]").forEach((button) => {
        button.addEventListener("click", () => {
            document.body.classList.add("ai-available");
            aiToggle?.click();
        });
    });
})();
