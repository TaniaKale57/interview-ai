"use client";

export default function DownloadScorecardButton({ session }: { session: any }) {
  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      alert("Please allow pop-ups to export your PDF Scorecard.");
      return;
    }

    const responsesHtml =
      session.responses && session.responses.length > 0
        ? session.responses
            .map(
              (r: any, idx: number) => `
          <div class="question-block">
            <h3>Q${idx + 1}: ${r.questionText}</h3>
            <div class="scores">
              <span><strong>Technical Score:</strong> ${r.technicalScore}/100</span>
              <span><strong>Communication Score:</strong> ${r.communicationScore}/100</span>
              <span><strong>Duration:</strong> ${r.durationSeconds}s</span>
              <span><strong>Filler Words:</strong> ${r.fillerWordCount}</span>
            </div>
            <p><strong>Candidate Transcript:</strong><br/>"${r.userTranscript}"</p>
            <p><strong>AI Evaluation & Critique:</strong><br/>${r.aiFeedback}</p>
            <p><strong>Tone & Pacing Analysis:</strong><br/>${r.toneAnalysis || "N/A"}</p>
            <div class="ideal">
              <strong>Benchmark Ideal Answer:</strong><br/>${r.idealAnswer}
            </div>
          </div>
        `
            )
            .join("")
        : `<p>No recorded responses for this session.</p>`;

    printWindow.document.write(`
      <html>
        <head>
          <title>InterviewAI_Scorecard_${session.role.replace(/\s+/g, "_")}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #0f172a; padding: 32px; line-height: 1.6; }
            .header { border-bottom: 2px solid #4f46e5; padding-bottom: 16px; margin-bottom: 24px; }
            .header h1 { margin: 0; color: #312e81; font-size: 24px; }
            .meta { color: #475569; font-size: 14px; margin-top: 6px; }
            .summary-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 14px 18px; border-radius: 8px; margin-bottom: 24px; display: flex; gap: 24px; }
            .question-block { border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 20px; page-break-inside: avoid; }
            .question-block h3 { margin-top: 0; color: #1e293b; }
            .scores { display: flex; gap: 16px; font-size: 13px; color: #334155; background: #f1f5f9; padding: 8px 12px; border-radius: 6px; margin-bottom: 12px; }
            .ideal { background: #ecfdf5; border-left: 4px solid #10b981; padding: 12px; margin-top: 10px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>InterviewAI — Official Candidate Scorecard & Study Guide</h1>
            <div class="meta">
              <strong>Role:</strong> ${session.role} &nbsp;|&nbsp;
              <strong>Tech Stack:</strong> ${session.techStack} &nbsp;|&nbsp;
              <strong>Difficulty:</strong> ${session.difficulty} &nbsp;|&nbsp;
              <strong>Date:</strong> ${new Date(session.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div class="summary-box">
            <div><strong>Overall Technical Score:</strong> ${
              session.overallTechScore ? Math.round(session.overallTechScore) : 0
            } / 100</div>
            <div><strong>Overall Communication Score:</strong> ${
              session.overallCommScore ? Math.round(session.overallCommScore) : 0
            } / 100</div>
            <div><strong>Questions Completed:</strong> ${
              session.responses?.length || 0
            }</div>
          </div>
          ${responsesHtml}
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <button
      onClick={handleExportPDF}
      className="px-3 py-1.5 text-xs font-semibold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 rounded-lg transition cursor-pointer"
    >
      📄 Export PDF Scorecard
    </button>
  );
}