"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

export default function InterviewArena() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  // Session & Multi-Question State
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(true);

  // Recording & Transcript State
  const [transcript, setTranscript] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [seconds, setSeconds] = useState<number>(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [micStatus, setMicStatus] = useState<string>("");
  const [result, setResult] = useState<any>(null);

  // Refs for SpeechRecognition, MediaRecorder, and Active State
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef<boolean>(false);
  const finalTranscriptRef = useRef<string>("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch tailored questions for this session
  useEffect(() => {
    async function loadSessionQuestions() {
      try {
        const res = await fetch("/api/interview/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();
        if (res.ok && data.questions) {
          setSessionInfo(data.session);
          setQuestions(data.questions);
        }
      } catch (err) {
        console.error("Failed to load questions:", err);
      } finally {
        setLoadingQuestions(false);
      }
    }
    if (sessionId) loadSessionQuestions();
  }, [sessionId]);

  // 2. Initialize Browser Speech-to-Text with Auto-Keep-Alive
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setMicStatus(
          "Browser does not support live mic transcription (Use Chrome/Edge, or type below)."
        );
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const piece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscriptRef.current += piece + " ";
          } else {
            interimTranscript += piece;
          }
        }
        setTranscript(finalTranscriptRef.current + interimTranscript);
      };

      recognition.onerror = (event: any) => {
        // Ignore harmless 'no-speech' pauses so it keeps listening
        if (event.error === "no-speech" || event.error === "aborted") {
          return;
        }
        setMicStatus(
          `Microphone note (${event.error}): Speak clearly or type your answer directly below.`
        );
      };

      // Automatically restart SpeechRecognition if Chrome pauses it while still recording
      recognition.onend = () => {
        if (isRecordingRef.current) {
          try {
            recognition.start();
          } catch (e) {
            // Ignore if already started
          }
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      isRecordingRef.current = false;
      recognitionRef.current?.stop();
    };
  }, []);

  // 3. Toggle Both Speech-to-Text (Priority #1) AND Audio Playback Recorder
  const toggleRecording = async () => {
    setMicStatus("");

    if (isRecording) {
      // STOP RECORDING
      isRecordingRef.current = false;
      setIsRecording(false);

      try {
        recognitionRef.current?.stop();
      } catch (e) {}

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }

      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      // START RECORDING
      setTranscript("");
      finalTranscriptRef.current = "";
      setAudioUrl(null);
      setSeconds(0);
      isRecordingRef.current = true;
      setIsRecording(true);

      // Step A: Start Speech-to-Text FIRST so it gets primary microphone access
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.warn("SpeechRecognition start note:", err);
      }

      // Step B: Start Timer
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);

      // Step C: Start Audio Recorder 150ms later so it doesn't block SpeechRecognition
      setTimeout(async () => {
        if (!isRecordingRef.current) return;
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          const mediaRecorder = new MediaRecorder(stream);
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          };

          mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, {
              type: "audio/webm",
            });
            const url = URL.createObjectURL(audioBlob);
            setAudioUrl(url);
            stream.getTracks().forEach((track) => track.stop());
          };

          mediaRecorder.start();
          mediaRecorderRef.current = mediaRecorder;
        } catch (err) {
          console.warn("Audio playback recorder unavailable:", err);
        }
      }, 150);
    }
  };

  const currentQuestion =
    questions[currentIndex] ||
    "Explain the difference between Server Components and Client Components in Next.js.";

  // Live Pacing (WPM) & Filler Words
  const words = transcript.trim() ? transcript.trim().split(/\s+/) : [];
  const wordCount = words.length;
  const wpm = seconds > 0 ? Math.round((wordCount / seconds) * 60) : 0;

  const fillerWordsList = [
    "um",
    "uh",
    "like",
    "basically",
    "actually",
    "literally",
  ];
  const fillerCount = words.filter((w) =>
    fillerWordsList.includes(w.toLowerCase().replace(/[^a-z]/g, ""))
  ).length;

  // Submit Answer to Backend Evaluator
  const handleSubmitAnswer = async () => {
    if (!transcript.trim()) return;
    if (isRecording) await toggleRecording();

    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionText: currentQuestion,
          userTranscript: transcript,
          durationSeconds: seconds || 30,
          fillerWordCount: fillerCount,
        }),
      });

      const data = await res.json();
      if (res.ok && data.response) {
        setResult(data.response);
      } else {
        alert("Failed to evaluate answer. Check terminal for details.");
      }
    } catch (error) {
      console.error(error);
      alert("Error connecting to evaluation API.");
    } finally {
      setSubmitting(false);
    }
  };

  // Move to the Next Question in the 3-Question Bank
  const handleNextQuestion = () => {
    setResult(null);
    setTranscript("");
    finalTranscriptRef.current = "";
    setAudioUrl(null);
    setSeconds(0);
    setCurrentIndex((prev) => prev + 1);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-mono text-indigo-400">
              {sessionInfo
                ? `${sessionInfo.role} • ${sessionInfo.difficulty} (${sessionInfo.techStack})`
                : `SESSION ID: ${sessionId?.slice(0, 8)}...`}
            </span>
            <h1 className="text-2xl font-bold text-white">Live Interview Arena</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 text-sm bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 rounded-lg transition cursor-pointer"
            >
              📊 View Dashboard
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg transition cursor-pointer"
            >
              ← New Setup
            </button>
          </div>
        </div>

        {/* Question Card with Progress Counter */}
        <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-indigo-400 font-semibold">
              Question {currentIndex + 1} of {questions.length || 3}
            </span>
            <div className="flex gap-1.5">
              {(questions.length ? questions : [1, 2, 3]).map((_, idx) => (
                <span
                  key={idx}
                  className={`h-2 w-8 rounded-full ${
                    idx === currentIndex
                      ? "bg-indigo-500"
                      : idx < currentIndex
                      ? "bg-emerald-500"
                      : "bg-slate-800"
                  }`}
                />
              ))}
            </div>
          </div>

          {loadingQuestions ? (
            <p className="text-lg text-slate-400 animate-pulse">
              Generating tailored questions for your role...
            </p>
          ) : (
            <p className="text-xl font-medium text-white leading-relaxed">
              "{currentQuestion}"
            </p>
          )}
        </div>

        {/* Live Metrics Bar */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
            <div className="text-xs text-slate-400">Duration</div>
            <div className="text-2xl font-bold text-white mt-1">{seconds}s</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
            <div className="text-xs text-slate-400">Speaking Pace (WPM)</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{wpm} WPM</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
            <div className="text-xs text-slate-400">Filler Words Detected</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">
              {fillerCount}
            </div>
          </div>
        </div>

        {/* Transcript & Audio Playback Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">
              Your Answer (Speak via Mic or Type Below)
            </span>
            {isRecording && (
              <span className="flex items-center gap-2 text-xs text-rose-400 animate-pulse">
                ● Recording Voice & Transcribing...
              </span>
            )}
          </div>

          {micStatus && (
            <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
              {micStatus}
            </div>
          )}

          <textarea
            value={transcript}
            onChange={(e) => {
              setTranscript(e.target.value);
              finalTranscriptRef.current = e.target.value;
            }}
            rows={5}
            placeholder="Click 'Start Speaking' to record your answer, or type your technical response directly here..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 focus:outline-none focus:border-indigo-500 transition"
          />

          {/* Recorded Voice Playback Bar */}
          {audioUrl && (
            <div className="flex items-center justify-between bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl">
              <span className="text-xs font-medium text-indigo-400">
                🎧 Listen Back to Your Recorded Delivery:
              </span>
              <audio controls src={audioUrl} className="h-8" />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={toggleRecording}
            className={`px-6 py-3.5 rounded-xl font-semibold transition cursor-pointer ${
              isRecording
                ? "bg-rose-600 hover:bg-rose-500 text-white"
                : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
            }`}
          >
            {isRecording ? "⏹ Stop Recording" : "🎙 Start Speaking"}
          </button>

          <button
            type="button"
            disabled={!transcript.trim() || submitting}
            onClick={handleSubmitAnswer}
            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            {submitting
              ? "Evaluating Answer..."
              : "Submit Answer for AI Evaluation →"}
          </button>
        </div>

        {/* AI Evaluation Results Card */}
        {result && (
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white">
                AI Evaluation & Feedback Report
              </h2>
              <span className="px-3 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                Saved to PostgreSQL ✓
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                <div className="text-xs text-slate-400">
                  Technical Accuracy Score
                </div>
                <div className="text-3xl font-bold text-indigo-400 mt-1">
                  {result.technicalScore} / 100
                </div>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                <div className="text-xs text-slate-400">
                  Communication & Delivery
                </div>
                <div className="text-3xl font-bold text-emerald-400 mt-1">
                  {result.communicationScore} / 100
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                <div className="text-xs font-semibold uppercase text-amber-400 mb-1">
                  What Was Right & What Needs Improvement
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {result.aiFeedback}
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                <div className="text-xs font-semibold uppercase text-indigo-400 mb-1">
                  Tone & Pacing Analysis
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {result.toneAnalysis}
                </p>
              </div>

              <div className="bg-slate-950 border border-emerald-500/20 p-4 rounded-xl">
                <div className="text-xs font-semibold uppercase text-emerald-400 mb-1">
                  Benchmark Ideal Answer
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {result.idealAnswer}
                </p>
              </div>
            </div>

            {/* Next Question / Finish Interview Button */}
            <div className="flex justify-end pt-2">
              {currentIndex + 1 < questions.length ? (
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition cursor-pointer"
                >
                  Next Question ({currentIndex + 2} of {questions.length}) →
                </button>
              ) : (
                <button
                  onClick={() => router.push("/dashboard")}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition cursor-pointer"
                >
                  🎉 Interview Complete! View Full Performance Dashboard →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}