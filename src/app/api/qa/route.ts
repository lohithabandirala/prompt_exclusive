import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { question, gs_uri } = await req.json();
    
    if (!question) {
      return NextResponse.json({ detail: "Question is required" }, { status: 400 });
    }
    if (!gs_uri) {
      return NextResponse.json({ detail: "Missing gs_uri parameter" }, { status: 400 });
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
        const text = data.candidates[0].content.parts[0].text;
        return NextResponse.json({ answer: text, disclaimer: "This is not legal advice." }, { status: 200 });
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
