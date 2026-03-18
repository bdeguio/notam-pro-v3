import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function GET() {

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // find NOTAM rows that still need summaries
  const { data, error } = await supabase
    .from("airport_notams")
    .select("*")
    .is("summary", null);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  const results = [];

  for (const row of data || []) {

    const notamText =
      typeof row.raw_notams === "string"
        ? row.raw_notams
        : JSON.stringify(row.raw_notams);

    const prompt = `
You are a pilot dispatcher preparing a 10-second NOTAM briefing.

Goal:
A pilot should understand operational hazards immediately.

Classify airport severity:

RED
Major hazard or runway closure.

YELLOW
Operational caution (taxiway closures, lighting outages).

GREEN
No significant operational impact.

Return JSON only:

{
  "severity": "RED | YELLOW | GREEN",
  "summary": "short pilot briefing"
}

NOTAMS:
${notamText}
`;

    try {

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You summarize aviation NOTAMs for pilots."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      });

      const content =
        completion.choices[0]?.message?.content || "{}";

      let parsed;

      try {
        parsed = JSON.parse(content);
      } catch {
        console.error("Failed to parse GPT response:", content);
        results.push({ airport: row.airport, error: "parse_failed" });
        continue;
      }

      await supabase
        .from("airport_notams")
        .update({
          summary: parsed.summary,
          severity: parsed.severity
        })
        .eq("id", row.id);

      results.push({
        airport: row.airport,
        summarized: true
      });

    } catch (err) {

      console.error("OpenAI error:", err);

      results.push({
        airport: row.airport,
        error: true
      });

    }

  }

  return NextResponse.json({
    processed: data?.length || 0,
    results
  });

}