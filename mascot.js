import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createMovement } from './avatar/movement.mjs';
import { blinkWeight } from './avatar/performance.mjs';

const ui = {
    toggle: document.getElementById("ai-mascot-toggle"),
    toggleLabel: document.querySelector("#ai-mascot-toggle .ai-mascot-toggle__label"),
    panel: document.getElementById("ai-mascot-panel"),
    close: document.getElementById("ai-mascot-close"),
    voiceToggle: document.getElementById("ai-mascot-voice-toggle"),
    expand: document.getElementById("ai-mascot-expand"),
    status: document.getElementById("ai-mascot-status"),
    stage: document.getElementById("ai-mascot-stage"),
    loader: document.getElementById("ai-mascot-loader"),
    log: document.getElementById("ai-chat-log"),
    form: document.getElementById("ai-chat-form"),
    input: document.getElementById("ai-chat-input"),
    mic: document.getElementById("ai-mic-btn"),
    send: document.getElementById("ai-send-btn"),
};

const state = {
    loaded: false,
    loading: false,
    busy: false,
    voiceEnabled: true,
    recognition: null,
    recognitionStarting: false,
    recognitionSubmitted: false,
    recognitionError: "",
    recorderSupported: false,
    forceRecorderFallback: false,
    mediaRecorder: null,
    recordingStream: null,
    recordingChunks: [],
    recordingTimer: null,
    discardRecording: false,
    recordingAudioContext: null,
    recordingAnalyser: null,
    recordingMonitorFrame: null,
    recordingSpeechDetected: false,
    recordingSilenceStartedAt: 0,
    speaking: false,
    activeCharacter: "",
    previousInteractionId: null,
    currentAudio: null,
    currentAudioUrl: null,
    transcriptTimeline: [],
    mouthEnergy: 0,
    expanded: false,
};

let scene;
let camera;
let renderer;
let controls;
let mixer;
let model;
let headBone;
let neckBone;
let animationFrameId;
let resizeObserver;
let audioContext;
let audioAnalyser;
let audioSource;
let audioSamples;
const animationActions = new Map();
let activeBodyAction;
const lipSyncMeshes = [];
const blinkMeshes=[];
const clock = new THREE.Clock();
const targetVisemes = new Map();
const smoothedMouse = new THREE.Vector2();
const targetMouse = new THREE.Vector2();
const animatedHeadQuaternion = new THREE.Quaternion();
const animatedNeckQuaternion = new THREE.Quaternion();
const lookQuaternion = new THREE.Quaternion();
const lookEuler = new THREE.Euler();
let headLookApplied = false;
let neckLookApplied = false;

const MODEL_URL = "avatar/mascot.glb";
const TRANSCRIBE_API_URL = "https://test-rammeshgar-webpage.netlify.app/api/transcribe";
let movement,spokenAt=0,lastRender=0;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const VISEME_NAMES = ["AA/AH", "EE/IH", "OH/O", "OO/WQ", "FV", "MBP", "L", "TH"];
const IDLE_ANIMATION = "Mascot_Body_Idle_4s";
const TALK_ANIMATION = "Mascot_Body_Talk_6s";

function setStatus(message) {
    ui.status.textContent = message;
}

function addMessage(text, role = "bot", extraClass = "") {
    const message = document.createElement("div");
    message.className = `ai-message ai-message-${role} ${extraClass}`.trim();
    message.textContent = text;
    ui.log.appendChild(message);
    ui.log.scrollTop = ui.log.scrollHeight;
    return message;
}

function openPanel() {
    ui.panel.inert=false;
    ui.panel.classList.add("is-open");
    ui.panel.setAttribute("aria-hidden", "false");
    ui.toggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("ai-open", "ai-available");
    ui.toggleLabel.textContent = "Close guide";
    if (!state.loaded && !state.loading) loadMascot();
    setTimeout(() => ui.input.focus(), 260);
}

function closePanel() {
    ui.panel.inert=true;
    ui.toggle.focus();
    ui.panel.classList.remove("is-open");
    ui.panel.setAttribute("aria-hidden", "true");
    ui.toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("ai-open");
    ui.toggleLabel.textContent = "Ask Sadeq’s AI";
    stopRecognition(true);
    stopAllSpeech();
}

export function togglePanel() {
    if (ui.panel.classList.contains("is-open")) closePanel();
    else openPanel();
}
export {openPanel};
ui.close.addEventListener("click", closePanel);
ui.expand?.addEventListener("click", () => {
    state.expanded = !state.expanded;
    ui.panel.classList.toggle("is-expanded", state.expanded);
    ui.expand.setAttribute("aria-pressed", String(state.expanded));
    ui.expand.setAttribute("aria-label", state.expanded ? "Use compact mascot viewer" : "Expand mascot viewer");
    ui.expand.title = state.expanded ? "Use compact viewer" : "Expand mascot viewer";
    const icon = ui.expand.querySelector("[data-icon]");
    if (icon) icon.dataset.icon = state.expanded ? "compress" : "expand";
    requestAnimationFrame(resizeRenderer);
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && ui.panel.classList.contains("is-open")) closePanel();
});

document.querySelectorAll("[data-ai-prompt]").forEach((button) => {
    button.addEventListener("click", () => {
        if (!ui.panel.classList.contains("is-open")) openPanel();
        askGemini(button.dataset.aiPrompt);
    });
});

ui.voiceToggle.addEventListener("click", () => {
    state.voiceEnabled = !state.voiceEnabled;
    const icon = ui.voiceToggle.querySelector("[data-icon]");
    if (icon) icon.dataset.icon = state.voiceEnabled ? "volume" : "muted";
    ui.voiceToggle.title = state.voiceEnabled ? "Mute voice" : "Enable voice";
    ui.voiceToggle.setAttribute("aria-label", ui.voiceToggle.title);
    if (!state.voiceEnabled) {
        stopAllSpeech();
    }
});

async function loadMascot() {
    state.loading = true;
    setStatus("Chat ready · loading the 3D mascot");

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    // Start close to the face. Visitors can scroll backward to zoom out.
    camera.position.set(0, 1.5, 0.96);

    const compactViewer = window.matchMedia("(max-width: 760px)").matches;
    renderer = new THREE.WebGLRenderer({ antialias: !compactViewer, alpha: true, powerPreference: compactViewer ? "low-power" : "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, compactViewer ? 1 : 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.shadowMap.enabled = !compactViewer;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    ui.stage.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.5, 0);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 0.72;
    controls.maxDistance = 3.8;
    controls.zoomSpeed = 0.75;
    controls.minPolarAngle = Math.PI * 0.2;
    controls.maxPolarAngle = Math.PI * 0.6;

    scene.add(new THREE.HemisphereLight(0xe8f5ff, 0x17232d, 1.5));
    const key = new THREE.DirectionalLight(0xfff8ef, 1.9);
    key.position.set(2.1, 3.5, 4.8);
    key.castShadow = true;
    key.shadow.bias = -0.00012;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xc8e4ff, 1.7);
    fill.position.set(-2.8, 2.25, 4.1);
    scene.add(fill);
    const eyeLight = new THREE.DirectionalLight(0xffffff, 1.05);
    eyeLight.position.set(0, 2.1, 5.2);
    scene.add(eyeLight);
    const rim = new THREE.DirectionalLight(0xffd7b0, 1.25);
    rim.position.set(-2.5, 3.2, -3.5);
    scene.add(rim);

    if (!compactViewer) {
        const ground = new THREE.Mesh(
            new THREE.CircleGeometry(2.2, 72),
            new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.26 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0.001;
        ground.receiveShadow = true;
        scene.add(ground);
    }

    renderer.domElement.addEventListener("pointermove", (event) => {
        const rect = renderer.domElement.getBoundingClientRect();
        targetMouse.x = THREE.MathUtils.clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
        targetMouse.y = THREE.MathUtils.clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
    });
    renderer.domElement.addEventListener("pointerleave", () => targetMouse.set(0, 0));

    resizeObserver = new ResizeObserver(resizeRenderer);
    resizeObserver.observe(ui.stage);
    resizeRenderer();

    try {
        const gltf = await new GLTFLoader().loadAsync(MODEL_URL);
        model = gltf.scene;
        scene.add(model);

        model.traverse((child) => {
            if (child.isMesh) {
                const isGlasses = /glass/i.test(child.name);
                child.castShadow = !isGlasses;
                child.receiveShadow = !isGlasses;
                if (child.morphTargetDictionary) {
                    const names = Object.keys(child.morphTargetDictionary);
                    if (VISEME_NAMES.some((name) => names.includes(name))) lipSyncMeshes.push(child);
                    if(names.includes('Blink_L'))blinkMeshes.push(child);
                }
            }
            if (child.isBone) {
                const name = child.name.toLowerCase();
                if (!headBone && name.includes("head")) headBone = child;
                else if (!neckBone && name.includes("neck")) neckBone = child;
            }
        });

        frameMascot();
        // Match the approved studio to the same normalization as the character.
        new GLTFLoader().loadAsync('avatar/atelier.glb').then(({scene:studio})=>{
            studio.scale.copy(model.scale);studio.position.copy(model.position);
            studio.traverse(o=>{if(o.isMesh)o.receiveShadow=true;});scene.add(studio);
        }).catch(()=>{/* The neutral background remains a valid fallback. */});

        const manifest=await fetch('avatar/Gesture_Library.json').then(r=>{if(!r.ok)throw Error('Animation metadata unavailable');return r.json();});
        movement=createMovement(model,gltf.animations,manifest.clips);

        state.loaded = true;
        state.loading = false;
        ui.loader.classList.add("is-hidden");
        setStatus(lipSyncMeshes.length ? "Ready · voice and lip movement online" : "Ready · 3D mascot online");
        animate();
    } catch (error) {
        state.loading = false;
        ui.loader.innerHTML = '<span class="css-icon css-icon--warning" aria-hidden="true"></span><span>The 3D mascot is unavailable.<small>You can still use the full chat below.</small></span>';
        setStatus("Chat ready · 3D view unavailable");
        console.error("Mascot load error:", error);
    }
}

function frameMascot() {
    if (!model || !camera || !controls) return;

    model.updateMatrixWorld(true);
    const initialBounds = new THREE.Box3().setFromObject(model);
    const initialSize = initialBounds.getSize(new THREE.Vector3());
    if (!Number.isFinite(initialSize.y) || initialSize.y <= 0) return;

    // Normalize different replacement mascots to the same real-world height.
    const normalizedHeight = 1.9;
    const fittedScale = normalizedHeight / initialSize.y;
    model.scale.multiplyScalar(fittedScale);
    model.updateMatrixWorld(true);

    // Put the feet on the stage, regardless of the model's export origin.
    const groundedBounds = new THREE.Box3().setFromObject(model);
    model.position.y -= groundedBounds.min.y;
    model.updateMatrixWorld(true);

    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    // Keep the default view intimate, while leaving the shoulders and authored
    // hand gestures in frame. Visitors can still zoom in or out manually.
    const portraitTarget = new THREE.Vector3(
        center.x,
        bounds.min.y + size.y * 0.73,
        center.z
    );
    const portraitDistance = size.y * 0.83;

    controls.target.copy(portraitTarget);
    controls.minDistance = portraitDistance * 0.7;
    controls.maxDistance = Math.max(size.y * 2.2, 3.4);
    camera.position.set(
        portraitTarget.x + size.x * 0.035,
        portraitTarget.y + size.y * 0.015,
        portraitTarget.z + portraitDistance
    );
    camera.lookAt(portraitTarget);
    controls.update();
}

function resizeRenderer() {
    if (!renderer || !camera) return;
    const width = Math.max(ui.stage.clientWidth, 1);
    const height = Math.max(ui.stage.clientHeight, 1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}

function animate() {
    animationFrameId = requestAnimationFrame(animate);
    const now=performance.now();
    if(document.hidden||!ui.panel.classList.contains('is-open')){lastRender=now;return;}
    if(now-lastRender<1000/30-.5)return;
    const delta = Math.min((now-lastRender)/1000, 0.1);lastRender=now;
    controls?.update();

    if (headBone && headLookApplied) {
        headBone.quaternion.copy(animatedHeadQuaternion);
        headLookApplied = false;
    }
    if (neckBone && neckLookApplied) {
        neckBone.quaternion.copy(animatedNeckQuaternion);
        neckLookApplied = false;
    }

    movement?.update({now:now/1000,delta,speaking:state.speaking,time:state.currentAudio?.currentTime??(now-spokenAt)/1000,duration:Number.isFinite(state.currentAudio?.duration)?state.currentAudio.duration:300,state:state.busy?'thinking':ui.mic.classList.contains('is-listening')?'listening':'idle',enabled:!reducedMotion.matches});

    const alpha = 1 - Math.exp(-4.5 * delta);
    smoothedMouse.lerp(targetMouse, alpha);
    if (headBone) {
        animatedHeadQuaternion.copy(headBone.quaternion);
        lookEuler.set(smoothedMouse.y * THREE.MathUtils.degToRad(8), smoothedMouse.x * THREE.MathUtils.degToRad(15), 0, "YXZ");
        lookQuaternion.setFromEuler(lookEuler);
        headBone.quaternion.copy(animatedHeadQuaternion).multiply(lookQuaternion);
        headLookApplied = true;
    }
    if (neckBone) {
        animatedNeckQuaternion.copy(neckBone.quaternion);
        lookEuler.set(smoothedMouse.y * THREE.MathUtils.degToRad(3), smoothedMouse.x * THREE.MathUtils.degToRad(5), 0, "YXZ");
        lookQuaternion.setFromEuler(lookEuler);
        neckBone.quaternion.copy(animatedNeckQuaternion).multiply(lookQuaternion);
        neckLookApplied = true;
    }

    updateGeneratedSpeechViseme();
    updateVisemes();
    for(const mesh of blinkMeshes)for(const name of ['Blink_L','Blink_R']){const i=mesh.morphTargetDictionary[name];if(i!==undefined)mesh.morphTargetInfluences[i]=reducedMotion.matches?0:blinkWeight(now/1000);}
    renderer.render(scene, camera);
}

function characterToViseme(character) {
    const c = String(character || "").toLowerCase();
    if (/[aáàäâ]/.test(c)) return "AA/AH";
    if (/[eéèëêiíìïîy]/.test(c)) return "EE/IH";
    if (/[oóòöô]/.test(c)) return "OH/O";
    if (/[uúùüûwq]/.test(c)) return "OO/WQ";
    if (/[fv]/.test(c)) return "FV";
    if (/[bmp]/.test(c)) return "MBP";
    if (/[l]/.test(c)) return "L";
    if (/[th]/.test(c)) return "TH";
    if (/[cgjksxz]/.test(c)) return "EE/IH";
    if (/[dnr]/.test(c)) return "AA/AH";
    return null;
}

function pickVisemeCharacter(text, startIndex = 0) {
    const fragment = String(text || "").slice(startIndex, startIndex + 24);
    return Array.from(fragment).find((character) => characterToViseme(character)) || "";
}

function buildTranscriptTimeline(text) {
    let totalWeight = 0;
    const timeline = Array.from(String(text || "")).map((character) => {
        const weight = /\s/.test(character)
            ? 0.42
            : /[.,!?;:—-]/.test(character)
                ? 0.85
                : /[aeiouyáàäâéèëêíìïîóòöôúùüû]/i.test(character)
                    ? 1.22
                    : 0.78;
        totalWeight += weight;
        return { character, end: totalWeight };
    });

    if (totalWeight > 0) {
        for (const entry of timeline) entry.end /= totalWeight;
    }
    return timeline;
}

function setupAudioAnalysis(audio) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    try {
        audioContext ||= new AudioContextClass();
        audioAnalyser = audioContext.createAnalyser();
        audioAnalyser.fftSize = 256;
        audioAnalyser.smoothingTimeConstant = 0.72;
        audioSamples = new Uint8Array(audioAnalyser.fftSize);
        audioSource = audioContext.createMediaElementSource(audio);
        audioSource.connect(audioAnalyser);
        audioAnalyser.connect(audioContext.destination);
        audioContext.resume().catch(() => {});
    } catch (error) {
        audioAnalyser = null;
        audioSamples = null;
        console.warn("Audio analysis unavailable; using transcript timing only.", error);
    }
}

function updateGeneratedSpeechViseme() {
    const audio = state.currentAudio;
    if (!audio || audio.paused || audio.ended) return;

    if (state.transcriptTimeline.length && Number.isFinite(audio.duration) && audio.duration > 0) {
        const progress = THREE.MathUtils.clamp(audio.currentTime / audio.duration, 0, 1);
        const entry = state.transcriptTimeline.find((item) => item.end >= progress);
        state.activeCharacter = entry?.character || "";
    }

    if (audioAnalyser && audioSamples) {
        audioAnalyser.getByteTimeDomainData(audioSamples);
        let energy = 0;
        for (const sample of audioSamples) {
            const centered = (sample - 128) / 128;
            energy += centered * centered;
        }
        const rms = Math.sqrt(energy / audioSamples.length);
        const speechEnergy = THREE.MathUtils.clamp((rms - 0.012) / 0.11, 0, 1);
        state.mouthEnergy = THREE.MathUtils.lerp(state.mouthEnergy, speechEnergy, 0.38);
    } else {
        state.mouthEnergy = THREE.MathUtils.lerp(state.mouthEnergy, 0.72, 0.18);
    }
}

function updateVisemes() {
    const activeName = state.speaking ? characterToViseme(state.activeCharacter) : null;
    const strength = 0.2 + state.mouthEnergy * 0.72;
    for (const mesh of lipSyncMeshes) {
        for (const [name, index] of Object.entries(mesh.morphTargetDictionary)) {
            if (!VISEME_NAMES.includes(name)) continue;
            const target = name === activeName ? strength : 0;
            mesh.morphTargetInfluences[index] = THREE.MathUtils.lerp(mesh.morphTargetInfluences[index] || 0, target, state.speaking ? 0.32 : 0.2);
        }
    }
}

function playBodyAnimation(name, timeScale = 1) {
    const nextAction = animationActions.get(name);
    if (!nextAction || nextAction === activeBodyAction) {
        activeBodyAction?.setEffectiveTimeScale(timeScale);
        return;
    }

    const previousAction = activeBodyAction;
    activeBodyAction = nextAction;
    nextAction.reset();
    nextAction.enabled = true;
    nextAction.setLoop(THREE.LoopRepeat, Infinity);
    nextAction.setEffectiveTimeScale(timeScale);
    nextAction.setEffectiveWeight(1);
    nextAction.fadeIn(0.24).play();
    previousAction?.fadeOut(0.24);
}

function startSpeakingAnimation() {
    spokenAt=performance.now();
    state.speaking = true;
    state.mouthEnergy = 0.68;
    setStatus("Speaking…");
    window.portfolioMusic?.pauseForVoice?.();
    playBodyAnimation(TALK_ANIMATION, 1);
}

function stopSpeakingAnimation() {
    state.speaking = false;
    state.activeCharacter = "";
    state.transcriptTimeline = [];
    state.mouthEnergy = 0;
    setStatus(state.loaded ? "Ready" : "Chat ready · mascot still loading");
    window.portfolioMusic?.resumeAfterVoice?.();
    playBodyAnimation(IDLE_ANIMATION, 0.78);
}

function stopAllSpeech() {
    window.speechSynthesis?.cancel();

    audioSource?.disconnect();
    audioSource = null;
    audioAnalyser = null;
    audioSamples = null;

    if (state.currentAudio) {
        state.currentAudio.pause();
        state.currentAudio.src = "";
        state.currentAudio = null;
    }

    if (state.currentAudioUrl) {
        URL.revokeObjectURL(state.currentAudioUrl);
        state.currentAudioUrl = null;
    }

    stopSpeakingAnimation();
}

async function playGeneratedAudio(audioBase64, mimeType = "audio/mpeg", transcript = "") {
    if (!state.voiceEnabled || !audioBase64) return false;

    stopAllSpeech();

    try {
        const binary = atob(audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

        const blob = new Blob([bytes], { type: mimeType });
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);

        state.currentAudio = audio;
        state.currentAudioUrl = audioUrl;
        state.transcriptTimeline = buildTranscriptTimeline(transcript);
        setupAudioAnalysis(audio);

        audio.addEventListener("play", startSpeakingAnimation, { once: true });
        audio.addEventListener("ended", stopAllSpeech, { once: true });
        audio.addEventListener("error", stopAllSpeech, { once: true });

        await audio.play();
        return true;
    } catch (error) {
        console.error("Generated audio playback failed:", error);
        stopAllSpeech();
        return false;
    }
}

function chooseVoice() {
    const voices = window.speechSynthesis.getVoices();
    return voices.find((v) => /^en(-|_)/i.test(v.lang) && /natural|online|google|microsoft/i.test(v.name))
        || voices.find((v) => /^en(-|_)/i.test(v.lang))
        || voices[0];
}

function speak(text) {
    if (!state.voiceEnabled || !text || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;
    const voice = chooseVoice();
    if (voice) utterance.voice = voice;
    utterance.onstart = startSpeakingAnimation;
    utterance.onboundary = (event) => {
        const index = Math.min(event.charIndex || 0, text.length - 1);
        state.activeCharacter = pickVisemeCharacter(text, index);
    };
    utterance.onend = stopSpeakingAnimation;
    utterance.onerror = stopSpeakingAnimation;
    window.speechSynthesis.speak(utterance);
}

function setBusy(value) {
    state.busy = value;
    ui.input.disabled = value;
    ui.send.disabled = value;
    ui.mic.disabled = value || (!state.recognition && !state.recorderSupported);
}

async function askGemini(message) {
    const cleanMessage = String(message || "").trim();
    if (!cleanMessage || state.busy) return;

    stopAllSpeech();
    addMessage(cleanMessage, "user");
    ui.input.value = "";
    setBusy(true);
    setStatus("Thinking…");
    const thinking = addMessage("Thinking…", "bot", "ai-message-thinking");

    try {
        const API_URL = "https://test-rammeshgar-webpage.netlify.app/api/chat";

        const response = await fetch(API_URL, {
            method: "POST",
            signal: AbortSignal.timeout(30000),
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: cleanMessage,
                previousInteractionId: state.previousInteractionId,
            }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
        if(typeof data.answer!=='string'||!data.answer.trim())throw new Error('The AI returned an empty answer. Please try again.');

        thinking.remove();
        addMessage(data.answer, "bot");
        state.previousInteractionId = data.interactionId || null;
        setStatus("Ready");

        if (state.voiceEnabled) {
            const played = data.audioBase64
                ? await playGeneratedAudio(data.audioBase64, data.audioMimeType || "audio/mpeg", data.answer)
                : false;
            if (!played) speak(data.answer);
        }
    } catch (error) {
        thinking.remove();
        addMessage(error.message || "The AI could not answer.", "bot", "ai-message-error");
        setStatus("Connection error");
        console.error("AI request failed:", error);
    } finally {
        setBusy(false);
        ui.input.focus();
    }
}

ui.form.addEventListener("submit", (event) => {
    event.preventDefault();
    askGemini(ui.input.value);
});

function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    state.recorderSupported = Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
    if (!SpeechRecognition) {
        ui.mic.disabled = !state.recorderSupported;
        ui.mic.title = state.recorderSupported ? "Talk instead of typing" : "Voice input is unavailable in this browser";
        if (state.recorderSupported) {
            ui.mic.classList.add("is-voice-ready");
            ui.mic.setAttribute("aria-label", "Start voice input — talk instead of typing");
        }
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
        state.recognitionStarting = false;
        state.recognitionSubmitted = false;
        state.recognitionError = "";
        ui.mic.classList.add("is-listening");
        ui.mic.disabled = false;
        ui.mic.title = "Stop listening";
        ui.mic.setAttribute("aria-label", "Stop voice input");
        setStatus("Listening…");
        window.portfolioMusic?.pauseForVoice?.();
    };
    recognition.onaudiostart = () => setStatus("Microphone active · listening…");
    recognition.onspeechstart = () => setStatus("Speech detected · keep talking…");
    recognition.onresult = (event) => {
        let transcript = "";
        let hasFinalResult = false;
        for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
            hasFinalResult ||= event.results[i].isFinal;
        }
        ui.input.value = transcript.trim();
        if (hasFinalResult && !state.recognitionSubmitted && ui.input.value) {
            state.recognitionSubmitted = true;
            askGemini(ui.input.value);
        }
    };
    recognition.onerror = (event) => {
        const messages = {
            "not-allowed": "Microphone blocked · allow access in the address bar and retry",
            "service-not-allowed": "Voice recognition is blocked by this browser",
            "audio-capture": "No working microphone was found",
            "no-speech": "I didn’t hear anything · tap the mic and try again",
            network: "Browser voice service blocked · tap the mic again to use secure transcription",
            aborted: "Voice input stopped",
        };
        if (event.error === "network" || event.error === "service-not-allowed") state.forceRecorderFallback = true;
        state.recognitionError = messages[event.error] || `Voice input error: ${event.error}`;
        setStatus(state.recognitionError);
    };
    recognition.onend = () => {
        state.recognitionStarting = false;
        ui.mic.classList.remove("is-listening");
        ui.mic.disabled = state.busy;
        ui.mic.title = "Talk instead of typing";
        ui.mic.setAttribute("aria-label", "Start voice input — talk instead of typing");
        if (!state.busy && !state.recognitionError) setStatus("Ready");
        if (!state.busy) window.portfolioMusic?.resumeAfterVoice?.();
    };

    state.recognition = recognition;
    ui.mic.disabled = false;
    ui.mic.classList.add("is-voice-ready");
    ui.mic.title = "Talk instead of typing";
    ui.mic.setAttribute("aria-label", "Start voice input — talk instead of typing");
}

function stopRecognition(discard = false) {
    if (state.mediaRecorder?.state === "recording") {
        stopMediaRecorder(discard);
        return;
    }
    if (!state.recognition) return;
    try {
        if (discard) state.recognition.abort();
        else state.recognition.stop();
    } catch (_) { /* already stopped */ }
}

async function requestMicrophoneAccess() {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("Microphone capture is unavailable");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
}

function preferredRecordingMimeType() {
    return ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]
        .find((type) => MediaRecorder.isTypeSupported?.(type)) || "";
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(reader.error || new Error("Could not read recording"));
        reader.onloadend = () => resolve(String(reader.result || "").split(",")[1] || "");
        reader.readAsDataURL(blob);
    });
}

async function finishRecordedQuestion(blob) {
    stopRecordingMonitor();
    state.mediaRecorder = null;
    state.recordingStream?.getTracks().forEach((track) => track.stop());
    state.recordingStream = null;
    state.recordingChunks = [];
    ui.mic.classList.remove("is-listening");
    ui.mic.title = "Talk instead of typing";
    ui.mic.setAttribute("aria-label", "Start voice input — talk instead of typing");
    window.portfolioMusic?.resumeAfterVoice?.();

    if (state.discardRecording) {
        state.discardRecording = false;
        if (!state.busy) setStatus("Ready");
        ui.mic.disabled = state.busy;
        return;
    }
    if (!blob.size || (state.recordingAnalyser && !state.recordingSpeechDetected)) {
        state.recognitionError = "I didn’t hear anything · tap the mic and try again";
        setStatus(state.recognitionError);
        ui.mic.disabled = false;
        return;
    }

    setBusy(true);
    setStatus("Transcribing your question…");
    try {
        const audioBase64 = await blobToBase64(blob);
        const response = await fetch(TRANSCRIBE_API_URL, {
            method: "POST",
            signal: AbortSignal.timeout(30000),
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audioBase64, mimeType: blob.type || "audio/webm" }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || `Transcription failed (${response.status})`);
        const transcript = String(data.transcript || "").trim();
        if (!transcript) throw new Error("No speech was detected");
        ui.input.value = transcript;
        setBusy(false);
        await askGemini(transcript);
    } catch (error) {
        setBusy(false);
        state.recognitionError = error.message || "Couldn’t transcribe the recording";
        setStatus(state.recognitionError);
    }
}

function stopMediaRecorder(discard = false) {
    const recorder = state.mediaRecorder;
    if (!recorder || recorder.state !== "recording") return;
    state.discardRecording = discard;
    window.clearTimeout(state.recordingTimer);
    state.recordingTimer = null;
    recorder.stop();
}

function stopRecordingMonitor() {
    if (state.recordingMonitorFrame) cancelAnimationFrame(state.recordingMonitorFrame);
    state.recordingMonitorFrame = null;
    state.recordingAnalyser = null;
    state.recordingAudioContext?.close().catch(() => {});
    state.recordingAudioContext = null;
    state.recordingSpeechDetected = false;
    state.recordingSilenceStartedAt = 0;
}

function startRecordingMonitor(stream) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
        const context = new AudioContextClass();
        const analyser = context.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.72;
        context.createMediaStreamSource(stream).connect(analyser);
        const samples = new Uint8Array(analyser.fftSize);
        state.recordingAudioContext = context;
        state.recordingAnalyser = analyser;
        state.recordingSpeechDetected = false;
        state.recordingSilenceStartedAt = 0;
        const monitor = () => {
            if (state.mediaRecorder?.state !== "recording" || state.recordingAnalyser !== analyser) return;
            analyser.getByteTimeDomainData(samples);
            let energy = 0;
            for (const sample of samples) {
                const centered = (sample - 128) / 128;
                energy += centered * centered;
            }
            const rms = Math.sqrt(energy / samples.length);
            const now = performance.now();
            if (rms > 0.028) {
                if (!state.recordingSpeechDetected) setStatus("Speech detected · listening until you finish…");
                state.recordingSpeechDetected = true;
                state.recordingSilenceStartedAt = 0;
            } else if (state.recordingSpeechDetected) {
                state.recordingSilenceStartedAt ||= now;
                if (now - state.recordingSilenceStartedAt > 1600) {
                    stopMediaRecorder(false);
                    return;
                }
            }
            state.recordingMonitorFrame = requestAnimationFrame(monitor);
        };
        state.recordingMonitorFrame = requestAnimationFrame(monitor);
    } catch (error) {
        console.warn("Automatic voice-stop monitoring is unavailable.", error);
    }
}

async function startMediaRecorder() {
    state.recognitionStarting = true;
    state.recognitionError = "";
    state.discardRecording = false;
    ui.mic.disabled = true;
    setStatus("Checking microphone access…");
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        const mimeType = preferredRecordingMimeType();
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        state.recordingStream = stream;
        state.recordingChunks = [];
        state.mediaRecorder = recorder;
        recorder.ondataavailable = (event) => { if (event.data?.size) state.recordingChunks.push(event.data); };
        recorder.onerror = () => {
            state.recognitionError = "The microphone recording failed · please retry";
            setStatus(state.recognitionError);
        };
        recorder.onstop = () => finishRecordedQuestion(new Blob(state.recordingChunks, { type: recorder.mimeType || "audio/webm" }));
        recorder.start(250);
        startRecordingMonitor(stream);
        state.recognitionStarting = false;
        ui.mic.disabled = false;
        ui.mic.classList.add("is-listening");
        ui.mic.title = "Stop and send recording";
        ui.mic.setAttribute("aria-label", "Stop recording and send voice question");
        setStatus("Listening… speak your question");
        window.portfolioMusic?.pauseForVoice?.();
        state.recordingTimer = window.setTimeout(() => stopMediaRecorder(false), 15000);
    } catch (error) {
        state.recognitionStarting = false;
        state.recordingStream?.getTracks().forEach((track) => track.stop());
        state.recordingStream = null;
        ui.mic.disabled = false;
        const blocked = error?.name === "NotAllowedError" || error?.name === "SecurityError";
        state.recognitionError = blocked ? "Microphone blocked · allow access in the address bar and retry"
            : error?.name === "NotFoundError" ? "No working microphone was found"
            : "Couldn’t start microphone recording · please retry";
        setStatus(state.recognitionError);
    }
}

ui.mic.addEventListener("click", async () => {
    if (state.busy || state.recognitionStarting) return;
    if (state.mediaRecorder?.state === "recording") {
        stopMediaRecorder(false);
        return;
    }
    if (ui.mic.classList.contains("is-listening")) {
        stopRecognition();
        return;
    }
    stopAllSpeech();
    const useRecorder = state.forceRecorderFallback || !state.recognition || Boolean(navigator.brave);
    if (useRecorder && state.recorderSupported) {
        await startMediaRecorder();
        return;
    }
    if (!state.recognition) {
        state.recognitionError = "Voice input is unavailable in this browser";
        setStatus(state.recognitionError);
        return;
    }
    state.recognitionStarting = true;
    state.recognitionSubmitted = false;
    state.recognitionError = "";
    ui.mic.disabled = true;
    setStatus("Checking microphone access…");
    try {
        await requestMicrophoneAccess();
        state.recognition.start();
    } catch (error) {
        state.recognitionStarting = false;
        ui.mic.disabled = false;
        const blocked = error?.name === "NotAllowedError" || error?.name === "SecurityError";
        state.recognitionError = blocked ? "Microphone blocked · allow access in the address bar and retry"
            : error?.name === "NotFoundError" ? "No working microphone was found"
            : "Couldn’t start voice input · please retry or type your question";
        setStatus(state.recognitionError);
    }
});

setupSpeechRecognition();
window.speechSynthesis?.getVoices();
