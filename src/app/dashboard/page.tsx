import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import DeleteSessionButton from "./DeleteSessionButton";
import DownloadScorecardButton from "./DownloadScorecardButton";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("interview_ai_user")?.value;
  
  let currentUser = { name: "Guest Candidate", email: "anonymous" };

  if (userCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(userCookie));
      currentUser = {
        name: parsed.name || "Guest Candidate",
        // 🚀 This guarantees it never becomes undefined, locking the security filter
        email: parsed.email || "anonymous", 
      };
    } catch (e) {}
  }
  // 🚀 The Magic Fix: ONLY fetch sessions that belong to THIS user's email
  const sessions = await prisma.interviewSession.findMany({
    where: {
      userEmail: currentUser.email,
    },
    orderBy: { createdAt: "desc" },
    include: {
      responses: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const completedSessions = sessions.filter(
    (s) => s.overallTechScore !== null && s.overallCommScore !== null
  );

  const avgTech =
    completedSessions.length > 0
      ? Math.round(
          completedSessions.reduce((acc, s) => acc + (s.overallTechScore || 0), 0) /
            completedSessions.length
        )
      : 0;

  const avgComm =
    completedSessions.length > 0
      ? Math.round(
          completedSessions.reduce((acc, s) => acc + (s.overallCommScore || 0), 0) /
            completedSessions.length
        )
      : 0;

  const totalQuestionsAnswered = sessions.reduce(
    (acc, s) => acc + s.responses.length,
    0
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-5xl space-y-8">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-indigo-400">
              Private Analytics • Candidate: {currentUser.name} ({currentUser.email})
            </span>
            <h1 className="text-3xl font-bold text-white mt-1">
              Interview Performance Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition"
            >
              👤 {userCookie ? "Switch Account" : "Sign In"}
            </Link>
            <Link
              href="/"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition"
            >
              + Start New Interview
            </Link>
          </div>
        </div>

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs text-slate-400">Your Total Sessions</div>
            <div className="text-3xl font-bold text-white mt-1">
              {sessions.length}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs text-slate-400">Questions Answered</div>
            <div className="text-3xl font-bold text-indigo-400 mt-1">
              {totalQuestionsAnswered}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs text-slate-400">Avg Technical Score</div>
            <div className="text-3xl font-bold text-emerald-400 mt-1">
              {avgTech} / 100
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs text-slate-400">Avg Communication</div>
            <div className="text-3xl font-bold text-amber-400 mt-1">
              {avgComm} / 100
            </div>
          </div>
        </div>

        {/* Session History List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            Your Private Session History
          </h2>

          {sessions.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
              No interview sessions recorded for {currentUser.email} yet. Click "+ Start New Interview" to begin!
            </div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-lg font-bold text-white">{s.role}</h3>
                      <span className="px-2.5 py-0.5 text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                        {s.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Tech Stack: <span className="text-slate-300">{s.techStack}</span> •{" "}
                      {new Date(s.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <DownloadScorecardButton session={s} />
                    <Link
                      href={`/interview/${s.id}`}
                      className="px-3 py-1.5 text-xs font-semibold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 rounded-lg transition"
                    >
                      Resume →
                    </Link>
                    <DeleteSessionButton sessionId={s.id} />
                  </div>
                </div>

                {s.responses.length > 0 ? (
                  <div className="space-y-3">
                    {s.responses.map((r, idx) => (
                      <div
                        key={r.id}
                        className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-indigo-400">
                            Q{idx + 1}: {r.questionText}
                          </span>
                          <span className="text-slate-400">
                            Tech: <strong className="text-emerald-400">{r.technicalScore}</strong> | Comm:{" "}
                            <strong className="text-amber-400">{r.communicationScore}</strong>
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 italic">
                          "{r.userTranscript}"
                        </p>
                        <p className="text-xs text-slate-400">
                          <strong className="text-slate-200">AI Critique:</strong>{" "}
                          {r.aiFeedback}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    No answers submitted in this session yet.
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}