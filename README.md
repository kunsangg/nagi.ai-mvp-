<div align="center">
  <img src="https://raw.githubusercontent.com/kunsangg/nagi.ai-mvp-/main/public/icon.png" alt="Nagi Logo" width="120" height="120" />
  <h1>Nagi</h1>
  <p><strong>The autonomous AI operating system for academic research.</strong></p>
  
  [![Main Website](https://img.shields.io/badge/Main_Website-nagi--functionalities.vercel.app-blue?style=for-the-badge&logo=vercel)](https://nagi-functionalities-bmiz.vercel.app)
  [![Waitlist](https://img.shields.io/badge/Waitlist-nagiai.vercel.app-purple?style=for-the-badge&logo=vercel)](https://nagiai.vercel.app)
  [![Live App](https://img.shields.io/badge/Live_App-nagi--ai--mvp.vercel.app-green?style=for-the-badge&logo=vercel)](https://nagi-ai-mvp.vercel.app)
  
  <p>
    Built for the <b>AMD Developer Hackathon: ACT II (Unicorn Track)</b>
  </p>
</div>

---

## 🌍 Overview

**Nagi** is not just another chatbot—it is a full spatial operating system built to solve the core problem of academic research: **Information Overload**. 

By abandoning linear chat interfaces in favor of an infinite spatial canvas, Nagi allows researchers to visualize connections, extract metadata, and synthesize thousands of papers simultaneously using highly specialized AI agents.

### 🔗 Links
*   **Main Website:** [nagi-functionalities-bmiz.vercel.app](https://nagi-functionalities-bmiz.vercel.app)
*   **Waitlist Page:** [nagiai.vercel.app](https://nagiai.vercel.app)
*   **Live App:** [nagi-ai-mvp.vercel.app](https://nagi-ai-mvp.vercel.app)

---

## ✨ Key Features

- 🌌 **The Spatial Canvas**: An infinite, physics-based environment (powered by D3.js) where you can group, connect, and organize academic papers visually.
- 🤖 **Multi-Agent Architecture**: 
  - **Compare Agent**: Instantly generates side-by-side methodological matrices from full abstracts.
  - **Gaps Agent**: Evaluates literature to identify unexplored areas and research gaps.
  - **Canvas Agent**: A spatial editor that organizes your thoughts and summarizes findings dynamically.
  - **Writer Agent**: Drafts comprehensive literature reviews based on the spatial context you've gathered.
- ⚡ **High-Performance Inference**: Powered by Fireworks AI running on **AMD Instinct™ MI300X** accelerators, enabling ultra-low latency serverless LLM calls (Llama 3, Gemma).
- 📚 **Real-Time Data**: Deep integration with the **OpenAlex API**, dynamically pulling from an open catalog of over 250 million academic works.

---

## 🛠️ Technology Stack

- **Frontend/Framework**: Next.js (App Router, React 19)
- **Styling**: Tailwind CSS & Framer Motion for micro-interactions and glassmorphism.
- **Visualization**: D3.js (Force-directed graph physics)
- **AI Infrastructure**: Fireworks AI & Groq
- **Hardware Integration**: Optimized for execution on AMD MI300X Infrastructure.
- **Data Providers**: OpenAlex API

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm, yarn, pnpm, or bun

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy the example environment file and add your keys:
```bash
cp .env.example .env.local
```
Inside `.env.local`, ensure you have configured:
- `OPENALEX_API_KEY` (Optional, but prevents rate limits)
- `FIREWORKS_API_KEY` 
- `GROQ_API_KEY`

### 3. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to experience the Nagi environment.

---

<div align="center">
  <i>Built with precision for the modern researcher.</i>
</div>
