// ==========================================
// --- TYPING EFFECT ---
// ==========================================
const textArray = ["Data Analysis", "Configuration Management", "Web Development", "Test Engineering"];
let textArrayIndex = 0; let charIndex = 0;
const typingSpan = document.getElementById("typing-text");

function type() {
    if (charIndex < textArray[textArrayIndex].length) {
        typingSpan.textContent += textArray[textArrayIndex].charAt(charIndex);
        charIndex++;
        setTimeout(type, 100);
    } else { setTimeout(erase, 2000); }
}
function erase() {
    if (charIndex > 0) {
        typingSpan.textContent = textArray[textArrayIndex].substring(0, charIndex - 1);
        charIndex--;
        setTimeout(erase, 50);
    } else {
        textArrayIndex++;
        if (textArrayIndex >= textArray.length) textArrayIndex = 0;
        setTimeout(type, 1100);
    }
}
document.addEventListener("DOMContentLoaded", function() { if (textArray.length) setTimeout(type, 2000); });

// ==========================================
// --- RANDOM IMAGE SLIDESHOW (RESTORED) ---
// ==========================================
document.querySelectorAll('.slideshow').forEach(slide => {
    const imagesAttr = slide.getAttribute('data-images');
    if (imagesAttr) {
        const images = imagesAttr.split(',').map(s => s.trim());
        if (images.length > 1) {
            let currentIndex = 0;
            const swapInterval = Math.floor(Math.random() * 2000) + 2500;
            setInterval(() => {
                let nextIndex;
                do { nextIndex = Math.floor(Math.random() * images.length); } while (nextIndex === currentIndex);
                currentIndex = nextIndex;
                slide.style.backgroundImage = `url('${images[currentIndex]}')`;
            }, swapInterval);
        }
    }
});

// ==========================================
// --- GSAP CINEMATIC SCROLL (FIXED VIDEO BEHAVIOR) ---
// ==========================================
gsap.registerPlugin(ScrollTrigger);

// FIX: Instead of breaking the video by scrubbing it, we Parallax fade the hero section!
// This smoothly reveals the 3D particles underneath as you scroll down.
gsap.to("#home", {
    y: -150,           // Pushes the video up smoothly
    opacity: 0,        // Fades it out to reveal the particles
    scrollTrigger: {
        trigger: "#home",
        start: "top top",
        end: "bottom 30%", // Finishes fading right as you reach the About section
        scrub: true
    }
});

// Cinematic Section Reveals
const sections = document.querySelectorAll("section");
sections.forEach((sec) => {
    const glassPanel = sec.querySelector('.glass-panel');
    if (glassPanel) {
        gsap.fromTo(glassPanel, 
            { y: 80, opacity: 0 }, 
            {
                y: 0, opacity: 1, 
                duration: 1,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: sec,
                    start: "top 85%", 
                    toggleActions: "play none none reverse",
                    onEnter: () => {
                        if (sec.id === "about") {
                            const termInput = document.getElementById("term-input");
                            if (termInput) setTimeout(() => termInput.focus({ preventScroll: true }), 800);
                        }
                    }
                }
            }
        );
    }
});

// Portfolio Staggered Reveal
gsap.fromTo(".card-wrapper", 
    { y: 60, opacity: 0 },
    {
        y: 0, opacity: 1, 
        duration: 0.8,
        stagger: 0.2, 
        ease: "power2.out",
        scrollTrigger: {
            trigger: "#portfolio",
            start: "top 80%",
            toggleActions: "play none none reverse"
        }
    }
);

// ==========================================
// --- SMART TERMINAL GAME LOGIC ---
// ==========================================
const termInput = document.getElementById("term-input");
const termHistory = document.getElementById("terminal-history");
const termBody = document.getElementById("terminal-body");
const termSuggestion = document.getElementById("term-suggestion");

if(termInput) {
    const commands = ["skills", "projects", "joke", "contact", "clear"];
    const jokes = [
        "Why do programmers prefer dark mode? Because light attracts bugs.",
        "There are 10 types of people in the world: those who understand binary, and those who don't.",
        "How many programmers does it take to change a light bulb? None, that's a hardware problem."
    ];

    termInput.addEventListener("input", () => {
        const val = termInput.value.toLowerCase();
        if (val.length > 0) {
            const match = commands.find(cmd => cmd.startsWith(val));
            if (match) termSuggestion.innerHTML = `<span style="opacity: 0;">${val}</span>${match.substring(val.length)}`;
            else termSuggestion.innerHTML = "";
        } else termSuggestion.innerHTML = "";
    });

    termInput.addEventListener("keydown", function(e) {
        if (e.key === "Tab") {
            e.preventDefault(); 
            if (termSuggestion.innerText.trim() !== "") {
                termInput.value = termSuggestion.innerText.trim();
                termSuggestion.innerHTML = ""; 
            }
        }
        if (e.key === "Enter") {
            const command = termInput.value.toLowerCase().trim();
            let response = "";
            if (command === "skills") response = "-> R, Python, SQL, Tableau, Power BI, Playwright, Kotlin, HTML/CSS/JS";
            else if (command === "projects") response = "-> Check out 'Peoples Clinic QA' or 'Web Scraping' below!";
            else if (command === "joke") response = `-> ${jokes[Math.floor(Math.random() * jokes.length)]}`;
            else if (command === "contact") response = "-> Email me at rezaisadeq0@gmail.com, or scroll down!";
            else if (command === "clear") { termHistory.innerHTML = ""; termInput.value = ""; termSuggestion.innerHTML = ""; return; }
            else if (command !== "") response = `-> Command not found: ${command}. Try 'skills', 'projects', 'joke', or 'clear'.`;

            if(command !== "") termHistory.innerHTML += `<p>> ${command}</p>`;
            if(response !== "") termHistory.innerHTML += `<p class="system-msg" style="color:var(--accent-color);">${response}</p><br>`;
            termInput.value = ""; termSuggestion.innerHTML = ""; termBody.scrollTop = termBody.scrollHeight;
        }
    });
}

// ==========================================
// --- MUSIC PLAYER LOGIC ---
// ==========================================
const music = document.getElementById("bg-music");
const musicBtn = document.getElementById("music-toggle");
if(musicBtn && music) {
    music.volume = 0.1; 
    let isPlaying = false;
    musicBtn.addEventListener("click", () => {
        const musicIcon = musicBtn.querySelector("i");
        const musicText = document.getElementById("music-text");
        if (isPlaying) {
            music.pause();
            musicIcon.classList.replace("fa-pause", "fa-play");
            musicText.innerText = "Resume Music";
        } else {
            music.play();
            musicIcon.classList.replace("fa-play", "fa-pause");
            musicText.innerText = "Pause Music";
        }
        isPlaying = !isPlaying;
    });
}

// ==========================================
// --- THREE.JS PARTICLE UNIVERSE (REVEALED AFTER VIDEO) ---
// ==========================================
const initPremiumBackground = () => {
    const canvas = document.createElement('canvas');
    canvas.id = 'webgl-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    
    // FIX: Z-Index set very low so it hides behind the Hero video
    canvas.style.zIndex = '-5'; 
    canvas.style.pointerEvents = 'none';
    
    document.body.insertBefore(canvas, document.body.firstChild);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0B0C10, 0.001); 

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 400;

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 3000;
    const posArray = new Float32Array(particlesCount * 3);
    const colorsArray = new Float32Array(particlesCount * 3);

    for(let i = 0; i < particlesCount * 3; i+=3) {
        posArray[i] = (Math.random() - 0.5) * 2000; 
        posArray[i+1] = (Math.random() - 0.5) * 2000; 
        posArray[i+2] = (Math.random() - 0.5) * 1500; 

        const color = new THREE.Color();
        color.setHSL(Math.random() * 0.1 + 0.5, 0.8, 0.6); 
        colorsArray[i] = color.r;
        colorsArray[i+1] = color.g;
        colorsArray[i+2] = color.b;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
        size: 3, vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending 
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    let mouseX = 0; let mouseY = 0;
    document.addEventListener('mousemove', (event) => {
        mouseX = event.clientX / window.innerWidth - 0.5;
        mouseY = event.clientY / window.innerHeight - 0.5;
    });

    const clock = new THREE.Clock();
    const animate = () => {
        requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();
        particlesMesh.rotation.y = elapsedTime * 0.05;
        particlesMesh.rotation.x = elapsedTime * 0.02;
        camera.position.x += (mouseX * 500 - camera.position.x) * 0.05;
        camera.position.y += (-mouseY * 500 - camera.position.y) * 0.05;
        camera.lookAt(scene.position);
        renderer.render(scene, camera);
    };

    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
};

setTimeout(initPremiumBackground, 1000);
