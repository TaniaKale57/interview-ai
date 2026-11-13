import Link from "next/link";
import { prisma } from "@/lib/prisma";
import DeleteSessionButton from "./DeleteSessionButton";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const sessions = await prisma.interviewSession.findMany({
    include: {
      responses: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const allResponses = sessions.flatMap((s) => s.responses);
  const totalSessions = sessions.length;
  const totalQuestionsAnswered = allResponses.length;

  const avgTechnical =
    totalQuestionsAnswered > 0
      ? Math.round(
          allResponses.reduce((sum, r) => sum + (r.technicalScore || 0), 0) /
            totalQuestionsAnswered
        )
      : 0;

  const avgCommunication =
    totalQuestionsAnswered > 0
      ? Math.round(
          allResponses.reduce(
            (sum, r) => sum + (r.communicationScore || 0),
            0
          ) / totalQuestionsAnswered
        )
      : 0;

  const totalFillers = allResponses.reduce(
    (sum, r) => sum + (r.fillerWordCount || 0),
    0
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-5xl space-y-8">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-indigo-400">
              PostgreSQL Live Analytics
            </span>
            <h1 className="text-3xl font-bold text-white mt-1">
              Candidate Performance Dashboard
            </h1>
          </div>
          <Link
            href="/"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition"
          >
            + Start New Mock Interview
          </Link>
        </div>

        {/* Lifetime Summary KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs text-slate-400">Total Sessions</div>
            <div className="text-3xl font-bold text-white mt-1">
              {totalSessions}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {totalQuestionsAnswered} questions graded
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs text-slate-400">Avg Technical Score</div>
            <div className="text-3xl font-bold text-indigo-400 mt-1">
              {avgTechnical}
              <span className="text-lg text-slate-500">/100</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">Domain accuracy</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs text-slate-400">Avg Communication</div>
            <div className="text-3xl font-bold text-emerald-400 mt-1">
              {avgCommunication}
              <span className="text-lg text-slate-500">/100</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">Clarity & delivery</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs text-slate-400">Total Filler Words</div>
            <div className="text-3xl font-bold text-amber-400 mt-1">
              {totalFillers}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              ("um", "uh", "like")
            </div>
          </div>
        </div>

        {/* Session History List */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">
            Saved Interview Sessions ({totalSessions})
          </h2>

          {sessions.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
              No interview sessions recorded yet. Click "Start New Mock Interview" above!
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-white">
                        {session.role}
                      </h3>
                      <span className="px-2.5 py-0.5 text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                        {session.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Tech Stack:{" "}
                      <span className="text-slate-300">{session.techStack}</span>{" "}
                      • {new Date(session.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Action Buttons: Resume & Delete */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/interview/${session.id}`}
                      className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
                    >
                      Resume / Practice →
                    </Link>
                    <DeleteSessionButton sessionId={session.id} />
                  </div>
                </div>

                {/* Graded Responses Inside This Session */}
                {session.responses.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">
                    No answers submitted in this session yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {session.responses.map((resp, idx) => (
                      <div
                        key={resp.id}
                        className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="text-sm font-semibold text-indigo-300 flex-1">
                            Q{idx + 1}: "{resp.questionText}"
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <span className="px-2.5 py-1 text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg">
                              Tech: {resp.technicalScore}/100
                            </span>
                            <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
                              Comm: {resp.communicationScore}/100
                            </span>
                            <span className="px-2.5 py-1 text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg">
                              Fillers: {resp.fillerWordCount}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                          <span className="font-semibold text-slate-400">
                            Your Answer:{" "}
                          </span>
                          "{resp.userTranscript}"
                        </div>

                        <div className="grid md:grid-cols-2 gap-3 text-xs">
                          <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/60">
                            <span className="font-semibold text-amber-400 block mb-1">
                              AI Critique:
                            </span>
                            <span className="text-slate-300">
                              {resp.aiFeedback}
                            </span>
                          </div>
                          <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/60">
                            <span className="font-semibold text-emerald-400 block mb-1">
                              Benchmark Ideal Answer:
                            </span>
                            <span className="text-slate-300">
                              {resp.idealAnswer}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}