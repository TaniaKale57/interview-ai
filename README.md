# 🎙️ InterviewAI — Real-Time AI Technical Interview Simulator

An end-to-end, full-stack technical interview preparation platform built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, **PostgreSQL**, and the **Google Gemini API**.

## ✨ Key Features

- **Role & Tech Stack Customizer:** Configure mock interviews by target role, custom tech stack/topics (e.g., *DSA in C, Java, Python, Next.js, DBMS*), and difficulty level.
- **Dynamic Multi-Question Engine:** Generates 3 tailored technical interview questions per session using Google Gemini (`gemini-2.5-flash`) with a built-in offline topic-aware fallback engine.
- **Live Voice Arena & Audio Playback:**
  - Real-time speech-to-text transcription via the browser **Web Speech API** (`SpeechRecognition`).
  - Live **MediaRecorder** audio capture so candidates can replay and review their own vocal delivery.
  - Real-time **Words Per Minute (WPM)** pacing calculation and **filler-word detection** (*"um", "uh", "like", "basically"*).
- **Automated AI Evaluation & Benchmarking:** Grades each response on **Technical Accuracy (0–100)** and **Communication & Delivery (0–100)**, providing actionable critique, tone analysis, and a benchmark ideal answer.
- **PostgreSQL Analytics Dashboard:** Server-rendered historical dashboard tracking lifetime average scores, total filler words, and full session-by-session transcripts with session management (resume/delete).

## 🛠️ Tech Stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Next.js Route Handlers (`/api/interview/create`, `/generate`, `/evaluate`, `/delete`)
- **Database & ORM:** PostgreSQL, Prisma ORM
- **AI & Browser APIs:** Google Gemini API, Web Speech API, MediaStream Recording API

## 🚀 Getting Started Locally

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/TaniaKale57/interview-ai.git](https://github.com/TaniaKale57/interview-ai.git)
   cd interview-ai
