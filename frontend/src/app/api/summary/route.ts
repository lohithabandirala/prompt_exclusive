import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { gs_uri } = await req.json();
    if (!gs_uri) {
      return NextResponse.json({ detail: "Missing gs_uri parameter" }, { status: 400 });
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
        const text = data.candidates[0].content.parts[0].text;
        return NextResponse.json({ summary: text, disclaimer: "This is for informational purposes only." }, { status: 200 });
      } catch (err) {
        return NextResponse.json({ detail: "Error parsing Gemini response." }, { status: 500 });
      }
    } else {
      return NextResponse.json({ detail: `Gemini API Error: ${JSON.stringify(data)}` }, { status: 500 });
    }

  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}
