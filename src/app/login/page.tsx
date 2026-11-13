"use client";

import { useState } from "react";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setLoading(true);

    // Save the candidate session cookie directly in the browser (valid for 7 days)
    const userPayload = JSON.stringify({
      name: name.trim(),
      email: email.trim().toLowerCase(),
    });

    document.cookie = `interview_ai_user=${encodeURIComponent(
      userPayload
    )}; path=/; max-age=604800; SameSite=Lax`;

    // Redirect straight to the Dashboard and force a fresh server render
    window.location.href = "/dashboard";
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div>
          <span className="px-3 py-1 text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
            Candidate Portal
          </span>
          <h1 className="text-2xl font-bold text-white mt-3">
            Sign in to InterviewAI
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Access your personalized mock interview arena and PDF scorecards.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4" suppressHydrationWarning>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tania Kale"
              suppressHydrationWarning
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              suppressHydrationWarning
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            suppressHydrationWarning
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            {loading ? "Signing In..." : "Continue to Interview Arena →"}
          </button>
        </form>
      </div>
    </main>
  );
}