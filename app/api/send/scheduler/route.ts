import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();
  const windowStart = new Date(now.getTime() + 89 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 91 * 60 * 1000);

  const { data: flights } = await supabase
    .from("calendar_events")
    .select("google_email, start_time")
    .gte("start_time", windowStart.toISOString())
    .lte("start_time", windowEnd.toISOString());

  if (!flights || flights.length === 0) {
    return NextResponse.json({ message: "No briefings to send" });
  }

  const pilots = new Set<string>();

  flights.forEach(f => pilots.add(f.google_email));

  for (const email of pilots) {

    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/email/send?pilot=${email}`);

  }

  return NextResponse.json({
    pilotsTriggered: Array.from(pilots)
  });

}