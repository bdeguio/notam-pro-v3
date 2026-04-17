import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    const { data: airports, error } = await supabase
      .from("briefing_airports")
      .select("airport");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!airports || airports.length === 0) {
      return NextResponse.json({ error: "No airports found." }, { status: 400 });
    }

    // ✅ clear old NOTAMs (your current model)
    await supabase
      .from("airport_notams")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    const start = new Date().toISOString().split("T")[0];
    const end = new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    let totalInserted = 0;

    for (const row of airports) {
      const airport = row.airport;

      const params = new URLSearchParams({
        locations: airport,
        starts_at: `${start}T00:00:00`,
        ends_at: `${end}T00:00:00`,
      });

      const res = await fetch(
        `https://api.notamify.com/api/v2/notams?${params}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.NOTAMIFY_API_KEY}`,
            Accept: "*/*",
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error("Notamify error:", data);
        continue;
      }

      const notams = data.notams || [];

      const rows = notams.map((n: any) => ({
        airport,
        notam_id: n.id,
        raw_text: n.message || n.icao_message || "",
        effective_start: n.starts_at || null,
        effective_end: n.ends_at || null,
      }));

      if (rows.length > 0) {
        const { error: insertError } = await supabase
          .from("airport_notams")
          .upsert(rows, { onConflict: "airport,notam_id" });

        if (insertError) {
          console.error("Insert error:", insertError);
          continue;
        }

        totalInserted += rows.length;
      }
    }

    return NextResponse.json({
      success: true,
      airportCount: airports.length,
      totalInserted,
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Unexpected error" },
      { status: 500 }
    );
  }
}