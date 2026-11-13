import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { role, techStack, difficulty } = body;

    if (!role || !techStack) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Read the logged-in user's cookie
    const cookieStore = await cookies();
    const userCookie = cookieStore.get("interview_ai_user")?.value;
    let userEmail = "anonymous";

    if (userCookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(userCookie));
        if (parsed.email) userEmail = parsed.email;
      } catch (e) {}
    }

    // Save the session WITH the user's email attached
    const session = await prisma.interviewSession.create({
      data: {
        role,
        techStack,
        difficulty,
        userEmail, // 🚀 This locks the session to the specific user
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error("Create session error:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}