# Nagi.ai

**Nagi** is an AI-native academic research tool designed to help researchers effortlessly discover, understand, and synthesize scientific papers. By leveraging modern AI models and the OpenAlex catalog, Nagi provides a seamless, high-performance interface for exploring academic knowledge.

## ✨ Features

- **Semantic Search**: Discover relevant papers using natural language queries. Nagi automatically expands your query into technical academic terms for better recall.
- **Research Mapping**: Visualize the academic landscape. Nagi generates interactive, physics-based connection maps of citations, references, and related works so you can instantly spot foundational papers.
- **AI Synthesis**: Seamlessly integrate LLM summaries of abstracts and key findings directly alongside paper metadata.
- **Modern UI**: A responsive, card-based interface built for focus. Featuring dot-grid canvas views, deep zoom, and minimal distraction.

## 🛠️ Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Styling**: Tailwind CSS & Lucide Icons
- **Visualization**: D3.js (Force-directed graph physics)
- **Data Providers**: [OpenAlex](https://openalex.org/) API (Scholarly catalog)

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
Inside `.env.local`, ensure you have your `OPENALEX_API_KEY` configured so you don't hit rate limits.

### 3. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

## 🌐 Deployment
This project is configured and optimized for deployment on [Vercel](https://vercel.com/). Ensure your environment variables are configured in your project dashboard before deploying.

---
*Built with precision for the modern researcher.*
