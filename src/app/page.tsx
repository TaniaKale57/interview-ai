"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ROLE_PRESETS = [
  {
    label: "🎨 UI/UX Designer",
    role: "UI/UX Designer",
    techStack: "Figma, Wireframing, Design Systems, User Research, Prototyping",
    difficulty: "Mid-Level",
  },
  {
    label: "💻 Full-Stack Dev",
    role: "Full-Stack Developer",
    techStack: "Next.js, React, TypeScript, Node.js, PostgreSQL, Prisma",
    difficulty: "Mid-Level",
  },
  {
    label: "⚙️ C / DSA Engineer",
    role: "Software Engineer",
    techStack: "C Programming, Data Structures and Algorithms, Pointers, Memory Management",
    difficulty: "Junior",
  },
  {
    label: "📊 Data Scientist",
    role: "Data Scientist & AI Engineer",
    techStack: "Python, Machine Learning, SQL, Pandas, Scikit-Learn",
    difficulty: "Mid-Level",
  },
  {
    label: "🚀 Product Manager",
    role: "Product Manager",
    techStack: "Product Strategy, Agile, User Stories, A/B Testing, Roadmapping",
    difficulty: "Senior",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [role, setRole] = useState("Full-Stack Developer");
  const [techStack, setTechStack] = useState(
    "Next.js, TypeScript, PostgreSQL, Prisma"
  );
  const [difficulty, setDifficulty] = useState("Mid-Level");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const applyPreset = (preset: (typeof ROLE_PRESETS)[0]) => {
    setRole(preset.role);
    setTechStack(preset.techStack);
    setDifficulty(preset.difficulty);
  };

  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role.trim() || !techStack.trim()) {
      setError("Please enter both a Target Role and Skills/Tools.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/interview/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: role.trim(),
          techStack: techStack.trim(),
          difficulty,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.sessionId) {
        throw new Error(data.error || "Failed to create interview session");
      }

      router.push(`/interview/${data.sessionId}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
              🎙️ InterviewAI Simulator
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-3.5 py-2 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl transition"
            >
              👤 Candidate Login
            </Link>
            <Link
              href="/dashboard"
              className="px-3.5 py-2 text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl transition"
            >
              📊 View Dashboard →
            </Link>
          </div>
        </div>

        {/* Main Configuration Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Configure Your Mock Interview
            </h1>
            <p className="text-slate-400 text-sm mt-2">
              Type any profession—Technical, UI/UX Design, Data Science, or Management—and our AI interviewer will tailor questions to your exact tools and experience level.
            </p>
          </div>

          {/* Quick-Fill Role Presets */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Quick-Select a Track (or type your own below):
            </span>
            <div className="flex flex-wrap gap-2">
              {ROLE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  suppressHydrationWarning
                  className="px-3 py-1.5 text-xs font-medium bg-slate-950 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-300 border border-slate-800 hover:border-indigo-500/40 rounded-lg transition cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <form
            onSubmit={handleStartInterview}
            className="space-y-5"
            suppressHydrationWarning
          >
            {/* Open Text Input for Any Job Role */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Target Job Role / Profession
              </label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. UI/UX Designer, Frontend Developer, Product Manager..."
                suppressHydrationWarning
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Open Text Input for Any Skills, Tools, or Tech Stack */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Core Skills, Tools, or Tech Stack
              </label>
              <input
                type="text"
                required
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                placeholder="e.g. Figma, Adobe XD, User Research OR Java, Python, DSA..."
                suppressHydrationWarning
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Separate multiple skills, tools, or topics with commas.
              </p>
            </div>

            {/* Universal Experience / Difficulty Level */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Experience / Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                suppressHydrationWarning
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="Intern / Fresher">Intern / Fresher (Foundational)</option>
                <option value="Junior">Junior (0–2 Years Experience)</option>
                <option value="Mid-Level">Mid-Level (2–5 Years Experience)</option>
                <option value="Senior">Senior / Lead (System & Architecture)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              suppressHydrationWarning
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition cursor-pointer"
            >
              {loading
                ? "Initializing AI Interview Room..."
                : "Enter Interview Arena →"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}