import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function normalizeAirports(input: string): string[] {
  return [...new Set(
    input
      .split(/[\s,]+/)
      .map((code) => code.trim().toUpperCase())
      .filter((code) => /^[A-Z]{4}$/.test(code))
  )];
}

export async function GET() {
  const { data, error } = await supabase
    .from("briefing_airports")
    .select("*")
    .order("airport", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ airports: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const input = body.input || "";

  const airports = normalizeAirports(input);

  if (airports.length === 0) {
    return NextResponse.json(
      { error: "No valid ICAO identifiers found." },
      { status: 400 }
    );
  }

  const rows = airports.map((airport) => ({ airport }));

  const { data, error } = await supabase
    .from("briefing_airports")
    .upsert(rows, { onConflict: "airport", ignoreDuplicates: true })
    .select();

  if (error) {
    // if duplicates are attempted, Supabase may throw unless we use upsert
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    inserted: data,
    count: data.length,
  });
}

export async function DELETE() {
  const { error } = await supabase
    .from("briefing_airports")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}