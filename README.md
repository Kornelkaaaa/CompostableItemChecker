# 🌱 Compostable Item Checker

An AI-powered web tool that tells you whether *any* household item can go into your compost pile — with a clear verdict, a plain-language explanation, and practical composting tips. Type in something like `banana peel`, `pizza box`, or `avocado pit` and get an instant answer powered by Google Gemini.

![Compost smarter, waste less](image%20(1).png)

## ✨ Features
- **🤖 AI-powered answers**: Ask about any item — Google Gemini returns a verdict (**Compostable**, **Keep it out**, or **It depends**), a short summary, and 2–4 tailored tips. No more fixed lists.
- **🎬 Cinematic hero**: Full-viewport section over a fixed background video, with a heading that animates in word-by-word as the page loads.
- **🔍 Smart checker**: Enter an item and get a colour-coded result card in a sleek modal.
- **🔌 Offline fallback**: If the AI is unreachable, a built-in list keeps the core check working.
- **📚 Learn sections**: "How it works", "What is composting?" (a step-by-step timeline), and "Benefits of composting" — all with scroll-in animations.
- **📱 Responsive design**: Looks great on desktop and mobile.

## 🛠️ Technologies Used
- **HTML5** — page structure.
- **CSS3** — modern dark theme, glassmorphism cards, and animations (fade-up on scroll via CSS + `IntersectionObserver`).
- **JavaScript (vanilla)** — the checker logic, modal system, and Gemini integration.
- **Google Gemini API** (`gemini-2.5-flash`) — AI answers with structured JSON output.
- **Google Fonts / Material Symbols** — typography and icons.

## 🔑 Setup: Get a Gemini API key
The AI answers require a free Google Gemini API key:

1. Go to **[Google AI Studio](https://aistudio.google.com/app/apikey)** and create an API key.
2. Open the app and search for any item.
3. On first use, paste your key into the prompt. It's stored **only in your browser** (`localStorage`) and is never committed to the repo.

> ⚠️ **Security note:** This is a static site with no backend, so Gemini is called directly from the browser and the key lives in local storage. That's fine for personal/demo use — but **do not hardcode a key in the source or push one to a public repo**. For a production deployment, put the key behind a small serverless proxy (e.g. Netlify/Vercel function or Cloudflare Worker). Use the "reset key" link under the search box to clear or change your key anytime.

## 🚀 Running Locally
Clone the repository:

```bash
git clone https://github.com/yourusername/compostable-item-checker.git
cd compostable-item-checker
```

It's a static site, so just open `index.html` in your browser — or serve it locally:

```bash
npx serve .
```

Then visit the printed URL (e.g. `http://localhost:3000`).

## 📁 Project Structure
```
index.html    # Main page: video hero, AI checker, info sections
result.html   # Legacy standalone result page
style.css     # Dark theme, hero, cards, modal, animations
script.js     # Checker logic, Gemini API call, modal + key handling
```

## 🌍 Deploying
Any static host works — GitHub Pages, Netlify, Vercel, Cloudflare Pages. No build step required. The Gemini endpoint allows browser (CORS) requests, so no backend is needed for a personal deployment.
