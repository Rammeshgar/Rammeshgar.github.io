// --- Typing Effect ---
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

// --- Scroll Animations & Auto-Focus Terminal ---
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) { 
            entry.target.classList.add("show"); 
            
            // UX TRICK: When 'About' section becomes visible, auto-focus the terminal
            if (entry.target.id === "about") {
                const termInput = document.getElementById("term-input");
                if (termInput) {
                    // preventScroll: true ensures the page doesn't jump aggressively
                    setTimeout(() => {
                        termInput.focus({ preventScroll: true });
                    }, 800); // Waits 0.8 seconds for the fade-in animation to finish
                }
            }
        }
    });
}, { threshold: 0.3 }); // Triggers when 30% of the section is visible

document.querySelectorAll('.hidden').forEach((el) => observer.observe(el));

// --- Random Image Swapping ---
document.querySelectorAll('.slideshow').forEach(slide => {
    const images = slide.getAttribute('data-images').split(',');
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
});

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
        "How many programmers does it take to change a light bulb? None, that's a hardware problem.",
        "A SQL query goes into a bar, walks up to two tables and asks: 'Can I join you?'"
    ];

    // Auto-Complete Visuals (The Ghost Text)
    termInput.addEventListener("input", () => {
        const val = termInput.value.toLowerCase();
        if (val.length > 0) {
            const match = commands.find(cmd => cmd.startsWith(val));
            if (match) {
                // Invisible matching text + visible remaining text (Perfect Alignment)
                termSuggestion.innerHTML = `<span style="opacity: 0;">${val}</span>${match.substring(val.length)}`;
            } else {
                termSuggestion.innerHTML = "";
            }
        } else {
            termSuggestion.innerHTML = "";
        }
    });

    // Handle TAB completion and ENTER submission
    termInput.addEventListener("keydown", function(e) {
        // Tab Completion
        if (e.key === "Tab") {
            e.preventDefault(); // Prevents moving to next field
            if (termSuggestion.innerText.trim() !== "") {
                termInput.value = termSuggestion.innerText.trim();
                termSuggestion.innerHTML = ""; // Clear ghost text
            }
        }

        // Enter Command
        if (e.key === "Enter") {
            const command = termInput.value.toLowerCase().trim();
            let response = "";

            if (command === "skills") { 
                response = "-> R, Python, SQL, Tableau, Power BI, Playwright, Kotlin, HTML/CSS/JS"; 
            } else if (command === "projects") { 
                response = "-> Check out 'Peoples Clinic QA' or 'Web Scraping' below!"; 
            } else if (command === "joke") { 
                const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
                response = `-> ${randomJoke}`; 
            } else if (command === "contact") { 
                response = "-> Email me at rezaisadeq0@gmail.com, or scroll down!"; 
            } else if (command === "clear") { 
                termHistory.innerHTML = ""; // Clears history, but keeps the Welcome Guide!
                termInput.value = "";
                termSuggestion.innerHTML = "";
                return; // Stop execution here so it doesn't print "clear"
            } else if (command === "") { 
                response = ""; 
            } else { 
                response = `-> Command not found: ${command}. Try 'skills', 'projects', 'joke', or 'clear'.`; 
            }

            // Print user command and system response
            if(command !== "") {
                termHistory.innerHTML += `<p>> ${command}</p>`;
            }
            if(response !== "") {
                termHistory.innerHTML += `<p class="system-msg" style="color:var(--accent-color);">${response}</p><br>`;
            }

            // Reset input and scroll to bottom
            termInput.value = "";
            termSuggestion.innerHTML = "";
            termBody.scrollTop = termBody.scrollHeight;
        }
    });
}

// --- Music Player Logic ---
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

// --- Unique 3D Vanta WebGL Background (Net) ---
window.addEventListener('DOMContentLoaded', () => {
    if(window.VANTA) {
        VANTA.NET({
          el: "#vanta-bg",
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 1.00,
          color: 0x66fcf1,
          backgroundColor: 0x0b0c10,
          points: 12.00,
          maxDistance: 22.00,
          spacing: 18.00
        });
    }
});