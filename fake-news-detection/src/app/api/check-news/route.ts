import { NextRequest, NextResponse } from "next/server";
import generateContent from "./generateContent";

export async function POST(request: NextRequest) {
  try {
    const { title } = await request.json();

    if (!title || typeof title !== "string" || title.trim().length < 3) {
      return NextResponse.json(
        { error: "Please enter a problem statement with at least 3 characters." },
        { status: 400 },
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key is not configured." },
        { status: 500 },
      );
    }

    const prompt = `You are helping a user understand a problem statement. Write a clear, well-structured response in a conversational chatGPT style. Use short paragraphs and bold section headings when helpful. Do not use bullet points unless necessary. Keep the response detailed but easy to read. The user input is: ${title.trim()}`;

    const responseText = await generateContent(prompt);
    const paragraphs = String(responseText)
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);

    return NextResponse.json({
      title: title.trim(),
      verdict: "Problem analysis",
      isLikelyTrue: true,
      confidence: 100,
      summary: "Gemini generated a polished explanation of the problem.",
      sourceCount: paragraphs.length,
      claimCount: paragraphs.length,
      claims: paragraphs.map((paragraph) => ({
        text: paragraph,
        rating: "Insight",
        publisher: "Gemini",
        url: "#",
      })),
    });
  } catch (error) {
    console.error("News check failed", error);
    return NextResponse.json(
      { error: "Something went wrong while analyzing the problem." },
      { status: 500 },
    );
  }
}
