# 🚀 Interactive Personal Portfolio Website

[![Live Demo](https://img.shields.io/badge/View_Live_Site-000000?style=for-the-badge&logo=github&logoColor=white)](https://rammeshgar.github.io)

A highly interactive, performance-optimized personal portfolio built from scratch using **Vanilla Web Technologies** (HTML5, CSS3, JavaScript) and **WebGL**. Designed to showcase my projects in Data Analytics, Configuration Management, and Software Engineering.

## 📸 Sneak Peek

<img width="1909" height="977" alt="Screenshot 2026-04-25 202923" src="https://github.com/user-attachments/assets/1c187b39-9612-4d80-be53-8ce7287cf43d" />


## ✨ Key Features

- 🧠 **Interactive 3D WebGL Background:** A mouse-reactive neural network built with Three.js and Vanta.js, dynamically optimized to save battery/CPU on mobile devices.
- 💻 **Functional Terminal Mini-Game:** A custom JavaScript terminal featuring auto-complete (TAB), command recognition (`skills`, `projects`, `joke`), and a dynamic typing effect.
- 🎴 **3D Flip-Card Portfolio Gallery:** A responsive CSS Grid layout with hardware-accelerated 180° 3D card flips and automated image slideshows.
- 🎵 **Custom Audio Player:** A floating, non-intrusive custom background music toggle.
- 📧 **Serverless Contact Form:** Fully functional form routing handled via Formspree API.

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
* **Graphics/3D:** [Three.js](https://threejs.org/), [Vanta.js](https://www.vantajs.com/)
* **Icons & Fonts:** FontAwesome CDN, Google Fonts (Poppins, Fira Code)
* **Analytics & SEO:** Google Analytics (GA4), Custom `robots.txt`, `sitemap.xml`
* **Hosting:** GitHub Pages

## ⚡ Performance & Lighthouse Optimization

Achieving high performance while running a video background and 3D WebGL requires aggressive optimization. 

<table align="center">
  <tr>
    <td align="center">
      <img width="770" height="659" alt="Screenshot 2026-04-26 001233" src="https://github.com/user-attachments/assets/b7975a16-2340-475f-8819-4bff1e0f46c0" />
    </td>
    <td align="center">
      <img width="755" height="675" alt="Screenshot 2026-04-25 202714" src="https://github.com/user-attachments/assets/b8732186-5607-4003-9235-fd0cae96efa9" />
    </td>
  </tr>
</table>

**Optimizations implemented:**
- **LCP Reduction:** `preload` tags for the video poster image and modern `.webp` image formats.
- **TBT Reduction:** `defer` attributes on heavy JavaScript libraries and delayed execution (`setTimeout` on `window.load`) for 3D rendering.
- **Smart Mobile Degradation:** JavaScript detects screen width to disable touch-listeners and reduce WebGL polygon geometry on mobile devices, ensuring high FPS and battery life.
- **Lazy Loading:** Non-critical assets (like FontAwesome) are loaded asynchronously.

## 🚀 How to Run Locally

If you want to explore the code locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/Rammeshgar/Rammeshgar.github.io.git
   ```
2. Navigate to the project directory:
   ```bash
   cd Rammeshgar.github.io
   ```
3. Open `index.html` in your browser, or use an extension like **Live Server** in VS Code to view it with hot-reloading.

## 📫 Let's Connect
- **LinkedIn:** [Sadeq Rezai](https://www.linkedin.com/in/sadeqrezai)
- **Email:** rezaisadeq0@gmail.com
