import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

function isProcedureNotam(text: string) {
  return (
    text.includes("IAP ") ||
    text.includes("ILS OR LOC") ||
    text.includes("RNAV") ||
    text.includes("ALTERNATE MINIMUMS") ||
    text.includes("VORTAC")
  );
}

export async function POST() {
  try {
    const { data: notams, error } = await supabase
      .from("airport_notams")
      .select("*")
      .is("summarized", null)
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!notams || notams.length === 0) {
      return NextResponse.json({ message: "No NOTAMs to summarize." });
    }

    let count = 0;

    for (const n of notams) {
      const raw = n.raw_text || "";

      const procedurePrompt = `
You are summarizing a procedure NOTAM for a pilot.

Format exactly:

IAP
[main operational restriction]
[list each affected procedure on its own line]

Rules:
- Put the restriction first.
- Preserve all listed approaches/procedures.
- Use plain pilot language.
- Expand abbreviations if helpful (ACFT → aircraft).
- Mention unmonitored navaids if relevant.

NOTAM:
${raw}
`;

      const normalPrompt = `
Summarize this NOTAM for a pilot in one short operational sentence.

Rules:
- Be concise
- Focus on operational impact
- No filler words

NOTAM:
${raw}
`;

      const prompt = isProcedureNotam(raw)
        ? procedurePrompt
        : normalPrompt;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a professional pilot assistant." },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 180,
      });

      const summary =
        completion.choices[0]?.message?.content?.trim();

      if (!summary) {
        console.error("Empty summary for:", n.id);
        continue;
      }

      const { error: updateError } = await supabase
        .from("airport_notams")
        .update({ summarized: summary })
        .eq("id", n.id);

      if (updateError) {
        console.error("Update error:", updateError);
        continue;
      }

      count++;
    }

    return NextResponse.json({
      success: true,
      summarized: count,
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to summarize" },
      { status: 500 }
    );
  }
}