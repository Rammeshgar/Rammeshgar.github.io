# 🚀 Sadeq Rezai — Interactive 3D Portfolio

<p align="center">
  <a href="https://rammeshgar.github.io">
    <img
      src="https://img.shields.io/badge/View_Live_Portfolio-000000?style=for-the-badge&logo=github&logoColor=white"
      alt="View live portfolio"
    />
  </a>
</p>

An interactive personal portfolio built with **HTML5, CSS3, JavaScript, Three.js, WebGL, Google Gemini, ElevenLabs, and Netlify Functions**.

The website presents my work across **configuration, test engineering, automated validation, data analysis, web development, and practical AI systems** through a responsive cinematic experience and an interactive 3D digital twin.

---

## 📸 Preview

<img
  width="1900"
  alt="Sadeq Rezai interactive portfolio homepage"
  src="https://github.com/user-attachments/assets/1c187b39-9612-4d80-be53-8ce7287cf43d"
/>

<p align="center">
  <a href="https://rammeshgar.github.io">
    <strong>Open the live portfolio</strong>
  </a>
</p>

> The screenshot above can be replaced later with a current screenshot of the redesigned portfolio.

---

## ✨ Key Features

<table>
  <tr>
    <td width="50%" valign="top">

### 🎞️ Scroll-Driven Cinematic Introduction

The opening experience uses a responsive sequence of optimized WebP frames rendered onto an HTML canvas.

As visitors scroll, the visual sequence progresses through four stages:

1. Signal
2. System
3. Validation
4. Proof

The animation is synchronized with text transitions and visual progress indicators.

</td>
<td width="50%" valign="top">

### 🤖 Interactive 3D Digital Twin

The portfolio includes a custom 3D avatar that visitors can open directly from the interface.

The digital twin can:

- answer questions about my work
- explain projects and professional experience
- respond using a verified profile and source of truth
- generate spoken answers
- animate while speaking

</td>
  </tr>

  <tr>
    <td width="50%" valign="top">

### 🧠 AI Conversation

The conversational layer uses **Google Gemini** through a secure serverless backend.

The frontend never exposes private API keys. Requests are sent to a Netlify Function that:

- validates incoming requests
- applies a controlled system persona
- loads verified professional information
- maintains conversational context
- returns structured text responses

</td>
<td width="50%" valign="top">

### 🔊 Generated Voice

Responses can be converted into speech using **ElevenLabs**.

The browser also supports a native speech fallback when generated audio is unavailable.

Voice playback is integrated with avatar animation to make the digital twin feel more natural and interactive.

</td>
  </tr>
</table>

---

## 🧩 Additional Features

- Responsive navigation and mobile menu
- Interactive project showcase
- Animated Three.js systems background
- Suggested AI conversation prompts
- Voice input through browser speech recognition
- Custom background-music controls
- Accessible labels and keyboard navigation
- Responsive layouts for desktop, tablet, and mobile
- Contact form powered by Formspree
- Open Graph and social-sharing metadata
- Structured data using Schema.org
- Google Analytics 4 integration
- Microsoft Clarity integration
- Custom `robots.txt` and `sitemap.xml`

---

## 🛠️ Technology Stack

| Area | Technologies |
|---|---|
| Core frontend | HTML5, CSS3, Vanilla JavaScript |
| 3D rendering | Three.js, WebGL, GLB models |
| Cinematic animation | Canvas API, WebP frame sequences |
| AI conversation | Google Gemini |
| Voice generation | ElevenLabs |
| Backend | Netlify Functions, Node.js |
| Deployment | GitHub Pages, Netlify |
| Contact form | Formspree |
| Analytics | Google Analytics 4, Microsoft Clarity |
| SEO | Schema.org, Open Graph, sitemap, robots.txt |
| Development | Git, GitHub, npm |

---

## 🏗️ Architecture

```text
Visitor
   │
   ▼
GitHub Pages frontend
   │
   ├── HTML / CSS / JavaScript
   ├── Three.js 3D avatar
   ├── WebP cinematic frames
   └── Portfolio interface
   │
   ▼
Netlify Function API
   │
   ├── Origin validation and CORS
   ├── Persona and source-of-truth loading
   ├── Google Gemini request
   └── ElevenLabs speech generation
   │
   ▼
Structured text and audio response
```

The architecture separates the public static website from the private AI backend.

API keys and sensitive configuration are stored as Netlify environment variables rather than being committed to the public GitHub Pages repository.

---

## 🔐 Security and Privacy

The frontend repository does not contain private Gemini or ElevenLabs API keys.

Sensitive values are stored in the Netlify project as environment variables:

```env
GEMINI_API_KEY=
GEMINI_MODEL=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
ELEVENLABS_MODEL=
```

The backend restricts browser requests to approved origins, including:

```text
https://rammeshgar.github.io
http://localhost:3000
http://127.0.0.1:3000
```

Private and development-only files are excluded using `.gitignore`, including:

```text
.env
node_modules/
npm-debug.log*
.DS_Store
mascot-backend/
```

---

## ⚡ Performance Considerations

The portfolio combines frame-based animation, 3D rendering, audio, and AI functionality, so performance is managed carefully.

### Implemented optimizations

- Preloaded poster image for the opening screen
- Optimized WebP frame sequence
- Canvas-based frame rendering
- Deferred JavaScript loading
- Lazy loading for project images
- Cached 3D and static assets
- Reduced visual complexity on smaller devices
- Static fallback image when animation frames are unavailable
- Browser voice fallback when ElevenLabs is unavailable
- Responsive viewport and `svh` sizing
- Reduced-motion support where appropriate

---

## 📱 Responsive Design

The portfolio adapts across:

- desktop monitors
- laptops
- tablets
- mobile devices

Mobile-specific behavior includes:

- compact fixed navigation
- collapsible menu
- responsive hero typography
- simplified cinematic positioning
- full-width project cards
- mobile-friendly AI panel
- adaptive 3D rendering
- touch-compatible controls

---

## 🧪 Main Portfolio Areas

### Quality Engineering

Automated testing and monitoring systems using Python, Playwright, APIs, Pytest, GitHub Actions, and CI/CD.

### Data Products

Interactive dashboards, spatial analysis, R Shiny applications, Power BI reports, and data pipelines.

### Web Systems

Responsive interfaces, analytics infrastructure, technical SEO, WebGL, and interactive browser experiences.

### Practical AI

AI-enabled workflows, prompt engineering, conversational interfaces, generated voice, and interactive 3D digital characters.

---

## 🌟 Highlighted Projects

| Project | Description | Technologies |
|---|---|---|
| Peoples Clinic Quality Assurance Suite | Continuous automated validation of infrastructure, clinical workflows, AI-generated notes, file parsing, and chatbot behavior | Python, Playwright, Pytest, GitHub Actions, APIs |
| Interactive 3D Portfolio | Cinematic portfolio with an AI-powered, voice-enabled 3D digital twin | JavaScript, Three.js, Gemini, ElevenLabs |
| Exchange Universe | Interactive exploration of international currency data | R, Shiny, APIs |
| Awesome Chocolates BI | Sales analysis and business-performance dashboard | MySQL, Power BI |
| Interactive Insights | Spatial analysis and interactive mapping | R, Leaflet, Flexdashboard |

---

## 🚀 Running the Frontend Locally

Clone the repository:

```bash
git clone https://github.com/Rammeshgar/Rammeshgar.github.io.git
```

Enter the project folder:

```bash
cd Rammeshgar.github.io
```

The portfolio should be served through a local HTTP server rather than opening `index.html` directly.

Using Python:

```bash
python -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

You can also use the **Live Server** extension in Visual Studio Code.

> The deployed frontend sends AI requests to the hosted Netlify backend. A separate local backend is required to test the complete AI stack locally.

---

## 🤖 Running the AI Backend Locally

The AI backend is maintained in a separate repository:

[Rammeshgar/mascot-backend](https://github.com/Rammeshgar/mascot-backend)

Clone it:

```bash
git clone https://github.com/Rammeshgar/mascot-backend.git
cd mascot-backend
```

Install dependencies:

```bash
npm install
```

Create a local `.env` file:

```env
GEMINI_API_KEY=your_key
GEMINI_MODEL=your_model
ELEVENLABS_API_KEY=your_key
ELEVENLABS_VOICE_ID=your_voice_id
ELEVENLABS_MODEL=eleven_flash_v2_5
PORT=3000
```

Start the local backend:

```bash
npm start
```

The backend will then be available at:

```text
http://localhost:3000
```

Never commit the `.env` file.

---

## 📂 Main Frontend Files

```text
Rammeshgar.github.io/
├── index.html
├── style.css
├── script.js
├── mascot.js
├── background-3d.js
├── me_v1.web.glb
├── poster.webp
├── frames/
│   └── desktop/
├── img/
├── robots.txt
├── sitemap.xml
└── README.md
```

---

## 🌐 Live Links

- **Portfolio:** [rammeshgar.github.io](https://rammeshgar.github.io)
- **Portfolio repository:** [Rammeshgar.github.io](https://github.com/Rammeshgar/Rammeshgar.github.io)
- **AI backend repository:** [mascot-backend](https://github.com/Rammeshgar/mascot-backend)
- **LinkedIn:** [Sadeq Rezai](https://www.linkedin.com/in/sadeqrezai)
- **GitHub profile:** [Rammeshgar](https://github.com/Rammeshgar)

---

## 📫 Contact

For professional opportunities, technical collaboration, or questions about the project:

- **Email:** rezaisadeq0@gmail.com
- **LinkedIn:** [linkedin.com/in/sadeqrezai](https://www.linkedin.com/in/sadeqrezai)

---

<p align="center">
  Built with code, testing, data, curiosity, and a focus on reliable systems.
</p>
