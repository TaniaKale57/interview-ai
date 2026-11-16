# 🎙️ InterviewAI — Real-Time AI Technical Interview Simulator

[![Live Demo](https://img.shields.io/badge/Live_Demo-Play_Now-4F46E5?style=for-the-badge)](https://interview-ai-five-phi.vercel.app)

InterviewAI is a full-stack, AI-powered interview platform designed to help developers and professionals practice technical interviews under pressure. It utilizes real-time speech transcription and Google's Gemini 2.5 Flash model to evaluate candidates on both technical depth and communication clarity.

## ✨ Core Features

* **Real-Time Speech Analysis:** Captures live audio using the Web Speech API and tracks pace (WPM) and filler words.
* **Ruthless AI Evaluation:** Leverages Google Gemini to analyze exact transcript logic, providing a Technical Score, Communication Score, and actionable critiques quoting your exact words.
* **Role-Based Dynamic Scenarios:** Tailor the interview by selecting specific roles, tech stacks, and difficulty levels.
* **Multi-Tenant Secure Dashboard:** Authenticated users only see their own historical sessions, scorecards, and AI feedback.
* **Smart Local Fallback:** Gracefully degrades to a custom offline NLP analysis algorithm if the AI API limits are hit, ensuring zero crashes.

## 🛠️ Tech Stack

* **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS
* **Backend:** Next.js Route Handlers
* **Database:** PostgreSQL (Hosted on Supabase)
* **ORM:** Prisma
* **AI Engine:** Google Gemini API (`gemini-2.5-flash`)
* **Deployment:** Vercel

## 🚀 Getting Started (Local Development)

If you'd like to run this project locally, follow these steps:

**1. Clone the repository**
```bash
git clone [https://github.com/TaniaKale57/interview-ai.git](https://github.com/TaniaKale57/interview-ai.git)
cd interview-ai
```
**2. Install dependencies**
  ```bash
  npm install
  ```
**3. Configure environment variables**
  Create a `.env` file in the root directory and add your keys:
  ```
  DATABASE_URL="postgresql://postgres.[YOUR_SUPABASE_ID]:[YOUR_PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"
  GEMINI_API_KEY="your_google_gemini_api_key_here"
  ```
**4. Sync the Database Schema**
  Push the Prisma schema to your PostgreSQL database:
  ```bash
  npx prisma db push
  ```
**5. Run the Development Server**
  ```bash
  npm run dev
  ```

Open `http://localhost:3000` with your browser to see the result.

## 🧠 Architecture Notes
Built with a "vibe coding" methodology, prioritizing rapid prototyping, secure multi-tenant data architecture, and resilient API fallback structures to maintain 100% uptime during live demos.

