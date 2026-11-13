import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      sessionId,
      questionText,
      userTranscript,
      durationSeconds,
      fillerWordCount,
    } = body;

    if (!sessionId || !questionText || !userTranscript) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY;

    let evaluation = {
      technicalScore: 75,
      communicationScore: 80,
      toneAnalysis: "",
      aiFeedback: "",
      idealAnswer: "",
    };

    let evaluatedByAI = false;

    // 1. Primary: Evaluate with Google Gemini API
    if (geminiKey && geminiKey.length > 10) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are a senior technical interviewer evaluating a candidate's spoken answer.
Question: "${questionText}"
Candidate's Answer Transcript: "${userTranscript}"
Speaking Duration: ${durationSeconds} seconds
Filler Words Detected ("um", "uh", "like"): ${fillerWordCount}

Evaluate the answer honestly and return ONLY valid JSON with these exact keys:
- "technicalScore": number between 0 and 100 grading technical correctness and depth
- "communicationScore": number between 0 and 100 grading structure, clarity, pacing, and filler words
- "toneAnalysis": string analyzing their delivery pace and filler word usage
- "aiFeedback": string explaining specifically what they got right and what technical points they missed
- "idealAnswer": string providing a concise, high-scoring benchmark answer to the question`,
                    },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: "application/json",
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textOutput) {
            const parsed = JSON.parse(textOutput);
            evaluation = { ...evaluation, ...parsed };
            evaluatedByAI = true;
          }
        }
      } catch (e) {
        console.warn("Gemini evaluation fallback triggered:", e);
      }
    }

    // 2. Secondary: Evaluate with OpenAI if configured
    if (
      !evaluatedByAI &&
      openAiKey &&
      openAiKey.startsWith("sk-") &&
      !openAiKey.includes("placeholder")
    ) {
      const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You are a senior technical interviewer. Return strictly JSON with keys: technicalScore (0-100), communicationScore (0-100), toneAnalysis (string), aiFeedback (string), and idealAnswer (string).",
            },
            {
              role: "user",
              content: `Question: "${questionText}"\nCandidate Answer: "${userTranscript}"\nDuration: ${durationSeconds}s, Filler Words: ${fillerWordCount}`,
            },
          ],
        }),
      });

      if (openAiRes.ok) {
        const aiData = await openAiRes.json();
        const parsed = JSON.parse(aiData.choices[0].message.content);
        evaluation = { ...evaluation, ...parsed };
        evaluatedByAI = true;
      }
    }

    // 3. Smart Built-in Fallback Evaluator
    if (!evaluatedByAI) {
      const words = userTranscript.trim().split(/\s+/).length;
      const lower = userTranscript.toLowerCase();
      const keywords = [
        "server",
        "client",
        "render",
        "browser",
        "state",
        "database",
        "api",
        "memory",
        "async",
        "index",
        "query",
        "component",
      ];
      const matchedKeywords = keywords.filter((k) => lower.includes(k));

      const techScore = Math.min(
        95,
        Math.max(35, 45 + matchedKeywords.length * 10 + Math.min(words, 25))
      );
      const commScore = Math.max(
        40,
        Math.min(95, 88 - fillerWordCount * 4 + (words > 15 ? 7 : -10))
      );

      evaluation = {
        technicalScore: techScore,
        communicationScore: commScore,
        toneAnalysis:
          fillerWordCount === 0
            ? "Confident and clear delivery with zero filler words detected."
            : `Detected ${fillerWordCount} filler word(s). Try pausing briefly instead of using fillers.`,
        aiFeedback:
          matchedKeywords.length >= 2
            ? `Good job mentioning core concepts (${matchedKeywords.join(", ")}). To make your answer stronger, include a concrete real-world example or trade-off.`
            : "Your answer was brief or missed key technical terminology. Structure your response by defining the concept first, explaining how it works under the hood, and giving a practical use case.",
        idealAnswer:
          "A strong technical answer clearly defines the core architecture, contrasts trade-offs (such as performance, memory, or scalability), and walks through a real-world implementation scenario.",
      };
    }

    const savedResponse = await prisma.questionResponse.create({
      data: {
        sessionId,
        questionText,
        userTranscript,
        durationSeconds: Number(durationSeconds) || 0,
        fillerWordCount: Number(fillerWordCount) || 0,
        technicalScore: Number(evaluation.technicalScore) || 70,
        communicationScore: Number(evaluation.communicationScore) || 75,
        toneAnalysis: evaluation.toneAnalysis,
        aiFeedback: evaluation.aiFeedback,
        idealAnswer: evaluation.idealAnswer,
      },
    });

    return NextResponse.json({ response: savedResponse }, { status: 201 });
  } catch (error) {
    console.error("Evaluation Error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate response" },
      { status: 500 }
    );
  }
}