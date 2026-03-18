import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = tomorrow.toISOString().split("T")[0];

  // get flights tomorrow
  const { data: flights } = await supabase
    .from("calendar_events")
    .select("google_email, origin, destination, start_time")
    .gte("start_time", `${date}T00:00:00`)
    .lte("start_time", `${date}T23:59:59`);

  if (!flights || flights.length === 0) {
    return NextResponse.json({ message: "No flights tomorrow" });
  }

  const briefings: any = {};

  for (const flight of flights) {

    const user = flight.google_email;

    if (!briefings[user]) {
      briefings[user] = {
        flights: [],
        airports: new Set()
      };
    }

    briefings[user].flights.push({
      origin: flight.origin,
      destination: flight.destination,
      time: flight.start_time
    });

    briefings[user].airports.add(flight.origin);
    briefings[user].airports.add(flight.destination);
  }

  // convert airport sets to arrays
  for (const user in briefings) {
    briefings[user].airports = Array.from(briefings[user].airports);
  }

  // fetch summaries for airports
  for (const user in briefings) {

    const airports = briefings[user].airports;

    const { data: summaries } = await supabase
      .from("airport_notams")
      .select("airport, summary, severity")
      .in("airport", airports)
      .limit(10)

    briefings[user].notams = summaries;
  }

  return NextResponse.json(briefings);

}