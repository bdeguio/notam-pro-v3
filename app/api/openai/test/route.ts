import { NextResponse } from "next/server";
import OpenAI from "openai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });

  try {

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: "Return this JSON exactly: {\"status\":\"ok\"}"
        }
      ],
    });

    return NextResponse.json({
      success: true,
      response: completion.choices[0].message.content
    });

  } catch (error) {

    return NextResponse.json({
      success: false,
      error
    });

  }

}