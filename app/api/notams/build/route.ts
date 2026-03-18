import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = tomorrow.toISOString().split("T")[0];

  // get airports for tomorrow
  const { data: airports } = await supabase
    .from("briefing_airports")
    .select("airport")
    .eq("briefing_date", date);

  if (!airports || airports.length === 0) {
    return NextResponse.json({ message: "No airports found" });
  }

  const results = [];

  for (const row of airports) {

    const airport = row.airport;

    // skip if already processed
    const { data: existing } = await supabase
      .from("airport_notams")
      .select("id")
      .eq("airport", airport)
      .eq("briefing_date", date)
      .maybeSingle();

    if (existing) {
      results.push({ airport, skipped: true });
      continue;
    }

    // fetch NOTAMs
    const res = await fetch(
      `https://api.notamify.com/api/v2/notams?locations=${airport}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.NOTAMIFY_API_KEY}`
        }
      }
    );

    const data = await res.json();

    if (!res.ok) {
      results.push({ airport, error: true });
      continue;
    }

    // store raw NOTAM JSON
    await supabase
      .from("airport_notams")
      .insert({
        airport: airport,
        briefing_date: date,
        raw_notams: data
      });

    results.push({ airport, stored: true });

  }

  return NextResponse.json({
    airports_checked: airports.length,
    results
  });

}