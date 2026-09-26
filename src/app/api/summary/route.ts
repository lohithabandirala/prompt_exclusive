import { NextRequest, NextResponse } from "next/server";

/**
 * Request payload interface for strict type checking
 */
interface SummaryRequest {
  gs_uri: string;
}

/**
 * Handles POST requests to generate a legal document summary
 * @param req - The NextRequest object
 * @returns NextResponse with the summary or error details
 */
export async function POST(req: NextRequest) {
  try {
    const body: Partial<SummaryRequest> = await req.json().catch(() => ({}));
    const { gs_uri } = body;
    
    // Security: Input validation
    if (!gs_uri || typeof gs_uri !== "string" || gs_uri.length < 100) {
      return NextResponse.json({ detail: "Invalid or missing gs_uri parameter. Expected Base64 string." }, { status: 400 });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { summary: "Mock summary for Vercel deployment. (Configure GEMINI_API_KEY in Vercel settings)" },
        { status: 200 }
      );
    }

    const prompt = `You are an AI legal assistant providing general legal information, not a lawyer. Please summarize the attached legal document in plain language. List key parties, dates, and obligations. IMPORTANT: This is not legal advice.`;

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
        return NextResponse.json({ summary: text, disclaimer: "This is for informational purposes only." }, { status: 200 });
      } catch (err) {
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
