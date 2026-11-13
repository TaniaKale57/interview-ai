import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const { role, techStack, difficulty } = session;
    const geminiKey = process.env.GEMINI_API_KEY?.trim();

    let questions: string[] = [];

    // 1. Try Google Gemini API (Supports both AIza... keys and AQ... tokens)
    if (geminiKey && geminiKey.length > 10) {
      const promptText = `You are a senior technical interviewer. Generate 3 distinct, specific technical interview questions tailored strictly to:
Target Role: ${role}
Topics / Tech Stack: ${techStack}
Difficulty Level: ${difficulty}

Do NOT ask about unrelated programming languages. Return ONLY valid JSON in this exact format:
{ "questions": ["Question 1...", "Question 2...", "Question 3..."] }`;

      const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

      for (const model of models) {
        if (questions.length > 0) break;
        try {
          // Pass key both in URL and x-goog-api-key header for compatibility
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": geminiKey,
              },
              body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: { responseMimeType: "application/json" },
              }),
            }
          );

          if (geminiRes.ok) {
            const data = await geminiRes.json();
            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const cleanJson = rawText
                .replace(/```json/gi, "")
                .replace(/```/g, "")
                .trim();
              const parsed = JSON.parse(cleanJson);
              if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
                questions = parsed.questions;
                console.log(`✅ Gemini (${model}) generated custom questions!`);
              }
            }
          } else {
            const errBody = await geminiRes.text();
            console.warn(`⚠️ Gemini (${model}) skipped:`, errBody.slice(0, 150));
          }
        } catch (err) {
          console.warn(`⚠️ Gemini (${model}) network error:`, err);
        }
      }
    }

    // 2. Smart Dynamic Topic Generator (Guarantees exact topic match even if API key is restricted)
    if (questions.length === 0) {
      const combined = `${role} ${techStack}`.toLowerCase();

      const hasC =
        /\bc\b/.test(combined) ||
        combined.includes("c programming") ||
        combined.includes("c++");
      const hasDSA =
        combined.includes("data structure") ||
        combined.includes("algorithm") ||
        combined.includes("dsa");

      if (hasC && hasDSA) {
        questions = [
          `[${difficulty}] In C Programming, how do you implement a dynamic Singly Linked List or Binary Search Tree using structs and pointers, and how do you prevent memory leaks using malloc() and free()?`,
          `[${difficulty}] Compare the time and space complexity of QuickSort vs. MergeSort when sorting an array in C, and explain how pointer arithmetic relates to array indexing.`,
          `[${difficulty}] How would you detect a cycle in a linked list in C using O(1) auxiliary space (Floyd's Cycle-Finding Algorithm), and how do you avoid segmentation faults when traversing pointers?`,
        ];
      } else if (hasC) {
        questions = [
          `[${difficulty}] Explain how pointers, memory addresses, and dynamic memory allocation (malloc, calloc, realloc, free) work in C Programming.`,
          `[${difficulty}] What causes a Segmentation Fault, Dangling Pointer, or Memory Leak in C, and how do you debug and prevent them?`,
          `[${difficulty}] Explain the difference between pass-by-value and pass-by-reference using pointers in C, and how structs are laid out in memory.`,
        ];
      } else if (hasDSA) {
        questions = [
          `[${difficulty}] Compare Hash Tables, Binary Search Trees, and Arrays in terms of lookup, insertion, and deletion time complexities in ${techStack}.`,
          `[${difficulty}] Explain the difference between Breadth-First Search (BFS) and Depth-First Search (DFS) on a graph and provide a real-world use case for each.`,
          `[${difficulty}] How do you decide whether to solve an optimization problem using Dynamic Programming (memoization/tabulation) versus a Greedy algorithm?`,
        ];
      } else if (combined.includes("java") || combined.includes("spring")) {
        questions = [
          `[${difficulty}] In Java, how does Garbage Collection work, and what is the difference between Stack and Heap memory allocation?`,
          `[${difficulty}] Compare ArrayList, LinkedList, and HashMap in Java—how does HashMap handle hash collisions internally?`,
          `[${difficulty}] Explain the four pillars of Object-Oriented Programming (Encapsulation, Inheritance, Polymorphism, Abstraction) with a practical example in ${techStack}.`,
        ];
      } else if (
        combined.includes("dbms") ||
        combined.includes("sql") ||
        combined.includes("postgres")
      ) {
        questions = [
          `[${difficulty}] How do B-Tree database indexes speed up SQL SELECT queries, and what is the trade-off during INSERT and UPDATE operations?`,
          `[${difficulty}] Explain the ACID properties of database transactions and contrast INNER JOIN vs. LEFT JOIN with an example.`,
          `[${difficulty}] What is database normalization (1NF, 2NF, 3NF), and when would you denormalize tables for read performance?`,
        ];
      } else if (combined.includes("python")) {
        questions = [
          `[${difficulty}] In Python, what is the difference between lists, tuples, and dictionaries in terms of mutability and lookup complexity?`,
          `[${difficulty}] How do generators, list comprehensions, and decorators work in Python (${techStack})?`,
          `[${difficulty}] Explain how the Global Interpreter Lock (GIL) affects multithreading vs. multiprocessing in Python.`,
        ];
      } else {
        // Universal Custom Topic Generator (Uses your exact typed techStack & role!)
        questions = [
          `[${difficulty}] Explain the core architecture, key concepts, and memory/execution model of ${techStack} when working as a ${role}.`,
          `[${difficulty}] Walk me through a challenging technical problem or performance bottleneck you might encounter in ${techStack} and how you would debug and optimize it.`,
          `[${difficulty}] What are the most important best practices, edge cases, and design trade-offs when building a solution using ${techStack}?`,
        ];
      }
    }

    return NextResponse.json({
      session,
      questions,
    });
  } catch (error) {
    console.error("Error generating questions:", error);
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 }
    );
  }
}