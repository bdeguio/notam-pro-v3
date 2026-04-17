import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getTomorrowDateString() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const day = String(tomorrow.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const date = getTomorrowDateString();

  const { data: flights } = await supabase
    .from("calendar_events")
    .select("google_email, origin, destination, start_time")
    .gte("start_time", `${date}T00:00:00`)
    .lte("start_time", `${date}T23:59:59`);

  if (!flights || flights.length === 0) {
    return NextResponse.json({ message: "No flights tomorrow" });
  }

  const briefings: Record<string, any> = {};

  for (const flight of flights) {
    const user = flight.google_email;

    if (!briefings[user]) {
      briefings[user] = {
        flights: [],
        airports: new Set<string>(),
      };
    }

    briefings[user].flights.push({
      origin: flight.origin,
      destination: flight.destination,
      time: flight.start_time,
    });

    if (flight.origin) briefings[user].airports.add(flight.origin);
    if (flight.destination) briefings[user].airports.add(flight.destination);
  }

  for (const user in briefings) {
    briefings[user].airports = Array.from(briefings[user].airports);
  }

  for (const user in briefings) {
    const airports = briefings[user].airports;

    const { data: summaries } = await supabase
      .from("airport_notams")
      .select("airport, summary, severity")
      .eq("briefing_date", date)
      .in("airport", airports);

    briefings[user].notams = summaries || [];
  }

  return NextResponse.json(briefings);
}