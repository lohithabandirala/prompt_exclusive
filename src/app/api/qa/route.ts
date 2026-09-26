import { NextRequest, NextResponse } from "next/server";

/**
 * Request payload interface for strict type checking
 */
interface QaRequest {
  question: string;
  gs_uri: string;
}

/**
 * Handles POST requests to answer questions about a legal document
 * @param req - The NextRequest object
 * @returns NextResponse with the AI answer or error details
 */
export async function POST(req: NextRequest) {
  try {
    const body: Partial<QaRequest> = await req.json().catch(() => ({}));
    const { question, gs_uri } = body;
    
    // Security: Input validation
    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return NextResponse.json({ detail: "Invalid or missing question parameter" }, { status: 400 });
    }
    if (!gs_uri || typeof gs_uri !== "string" || gs_uri.length < 100) {
      return NextResponse.json({ detail: "Invalid or missing gs_uri parameter. Expected Base64 string." }, { status: 400 });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { answer: `Mock answer for: "${question}" (Configure GEMINI_API_KEY in Vercel settings)` },
        { status: 200 }
      );
    }

    const prompt = `You are an AI legal assistant. Provide general legal information, not a lawyer's advice. Answer the following question based ONLY on the attached document.\nQuestion: ${question}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const payload = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "application/pdf",
                data: gs_uri
              }
            }
          ]
        }
      ]
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok) {
      try {
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("Invalid response format");
        return NextResponse.json({ answer: text, disclaimer: "This is not legal advice." }, { status: 200 });
      } catch {
        return NextResponse.json({ detail: "Error parsing Gemini response." }, { status: 500 });
      }
    } else {
      // Avoid leaking internal API errors completely in production, but provide basic info
      console.error("Gemini API Error:", data);
      return NextResponse.json({ detail: "Failed to communicate with AI provider." }, { status: 502 });
    }

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ detail: errorMsg }, { status: 500 });
  }
}
