import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function buildDynamicFallbackQuestions(
  role: string,
  techStack: string,
  difficulty: string
): string[] {
  const combined = (role + " " + techStack).toLowerCase();

  // 1. UI/UX, Graphic, Product, or Visual Design
  if (
    combined.includes("design") ||
    combined.includes("ui") ||
    combined.includes("ux") ||
    combined.includes("figma") ||
    combined.includes("wirefram") ||
    combined.includes("illustrator") ||
    combined.includes("canva")
  ) {
    return [
      "Walk me through your typical design workflow using " + techStack + ".",
      "How do you ensure your designs are scalable and accessible?",
      "Tell me about a time you had to pivot your design based on negative user feedback."
    ];
  }

  // 2. Product Management, Business, Marketing, HR, or Operations
  if (
    combined.includes("product manager") ||
    combined.includes("management") ||
    combined.includes("business") ||
    combined.includes("marketing") ||
    combined.includes("sales") ||
    combined.includes("agile") ||
    combined.includes("hr") ||
    combined.includes("finance")
  ) {
    return [
      "How do you prioritize competing initiatives as a " + role + "?",
      "Describe a time you used " + techStack + " to align difficult stakeholders.",
      "What key metrics do you track most closely to measure success?"
    ];
  }

  // 3. Data Science, Analytics, AI, or Machine Learning
  if (
    combined.includes("data") ||
    combined.includes("machine learning") ||
    combined.includes("analytics") ||
    combined.includes("ai") ||
    combined.includes("sql") ||
    combined.includes("pandas") ||
    combined.includes("power bi") ||
    combined.includes("tableau")
  ) {
    return [
      "How do you handle dirty or incomplete datasets before building models?",
      "Explain how you use " + techStack + " to translate complex insights for non-technical teams.",
      "Describe a time your initial data exploration contradicted your expectations."
    ];
  }

  // 4. C / C++ / Low-Level / DSA
  if (
    /\bc\b/.test(combined) ||
    combined.includes("c++") ||
    combined.includes("dsa") ||
    combined.includes("data structures") ||
    combined.includes("pointer")
  ) {
    return [
      "How do you prevent memory leaks when managing pointers in " + techStack + "?",
      "When solving algorithmic problems, how do you decide between arrays and hash tables?",
      "Walk me through how you debug a crashing routine under strict performance constraints."
    ];
  }

  // 5. Universal Custom Fallback
  return [
    "Walk me through a complex project where you relied heavily on " + techStack + ".",
    "What are the most common pitfalls someone should avoid when working with " + techStack + "?",
    "How do you ensure high quality and meet tight deadlines in your role as a " + role + "?"
  ];
}

export async function POST(req: Request) {
  let role = "Professional Candidate";
  let techStack = "Core Domain Skills";
  let difficulty = "Mid-Level";

  try {
    const body = await req.json();

    if (body.role) role = body.role;
    if (body.techStack) techStack = body.techStack;
    if (body.difficulty) difficulty = body.difficulty;

    if (body.sessionId && (!body.role || !body.techStack)) {
      const session = await prisma.interviewSession.findUnique({
        where: { id: body.sessionId },
      });
      if (session) {
        role = session.role;
        techStack = session.techStack;
        difficulty = session.difficulty;
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        questions: buildDynamicFallbackQuestions(role, techStack, difficulty),
      });
    }

    const prompt =
      "You are an expert senior hiring manager conducting a professional interview for the following candidate profile:\n" +
      "- Target Job Role: " + role + "\n" +
      "- Core Skills / Tools / Topics: " + techStack + "\n" +
      "- Experience / Difficulty Level: " + difficulty + "\n\n" +
      "CRITICAL INSTRUCTIONS:\n" +
      "1. Tailor ALL 3 questions strictly to the Target Job Role (" + role + ") and the exact Skills/Tools provided (" + techStack + ").\n" +
      "2. DO NOT ask software engineering or coding questions unless the role explicitly mentions programming.\n" +
      "3. KEEP IT CONCISE: Each question must be short, conversational, and direct (maximum 1-2 short sentences). No long paragraphs or complex scenarios.\n" +
      "4. Return ONLY a raw JSON array of 3 strings (the 3 interview questions). Do not include markdown formatting.\n" +
      'Example format: ["Question 1?", "Question 2?", "Question 3?"]';

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      apiKey;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      throw new Error("Gemini API returned error status");
    }

    const data = await response.json();
    const rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    const cleanedJson = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const parsedQuestions = JSON.parse(cleanedJson);

    if (Array.isArray(parsedQuestions) && parsedQuestions.length >= 3) {
      return NextResponse.json({
        questions: parsedQuestions.slice(0, 3),
      });
    }

    throw new Error("Invalid question array format");
  } catch (error) {
    return NextResponse.json({
      questions: buildDynamicFallbackQuestions(role, techStack, difficulty),
    });
  }
}