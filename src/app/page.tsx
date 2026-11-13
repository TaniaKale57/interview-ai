"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const [role, setRole] = useState("Full Stack Developer");
  const [techStack, setTechStack] = useState("Next.js, TypeScript, PostgreSQL");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [loading, setLoading] = useState(false);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/interview/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, techStack, difficulty }),
      });
      const data = await res.json();
      if (data.sessionId) {
        router.push(`/interview/${data.sessionId}`);
      } else {
        alert("Failed to create session.");
      }
    } catch (error) {
      console.error(error);
      alert("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full space-y-4">
        {/* Top Bar with Dashboard Navigation Button */}
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-mono uppercase tracking-wider text-indigo-400">
            InterviewAI Platform
          </span>
          <Link
            href="/dashboard"
            className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 rounded-xl transition flex items-center gap-2 shadow-sm"
          >
            📊 View Past Sessions / Dashboard →
          </Link>
        </div>

        {/* Main Configuration Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="mb-8">
            <span className="px-3 py-1 text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
              AI Technical Interview Simulator
            </span>
            <h1 className="text-3xl font-bold mt-3 text-white">
              Configure Your Mock Interview
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Customize your target role and tech stack to generate tailored technical questions.
            </p>
          </div>

          <form onSubmit={handleStart} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Target Role
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Tech Stack / Topics
              </label>
              <input
                type="text"
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Beginner">Beginner (Intern / Junior)</option>
                <option value="Intermediate">Intermediate (SDE-1 / Mid-Level)</option>
                <option value="Advanced">Advanced (Senior / System Design)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-indigo-600/30 transition cursor-pointer mt-2"
            >
              {loading ? "Initializing Session..." : "Enter Interview Arena →"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}